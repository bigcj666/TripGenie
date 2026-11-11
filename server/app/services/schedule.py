"""同区确定性排程。先排点和费用，文案另写。

交通不按步行/公交轮换：直线距离小于 1.2 km 步行，否则市内公交；
远郊进出城固定 60 分钟、每人 40 元；兵马俑与丽山园之间是免费摆渡。
"""

from __future__ import annotations

import math
from contextvars import ContextVar
from dataclasses import dataclass
from datetime import datetime, timedelta

from ..data.catalog import (
    GENERIC_HOTEL_RATE,
    CityCatalog,
    Place,
    generic_catalog,
    load_city,
    load_itineraries,
    resolve_place,
)
from ..schemas.trip import (
    CostBreakdown,
    DayPlan,
    FactStatus,
    ItineraryItem,
    ItemType,
    Poi,
    SourceRef,
    TransportMode,
    TransportToNext,
    TravelStyle,
    Trip,
    TripMetrics,
)

DEFAULT_HOTEL_RATE = GENERIC_HOTEL_RATE

MEAL_RATE = {
    TravelStyle.COMPACT: 50,
    TravelStyle.RELAXED: 70,
    TravelStyle.ECONOMY: 35,
}
STYLE_LABEL = {
    TravelStyle.COMPACT: "紧凑",
    TravelStyle.RELAXED: "松弛",
    TravelStyle.ECONOMY: "省钱",
}
# 内容包点名的默认城区酒店。远郊日晚上回到这里，不在景区过夜。
DEFAULT_HOTEL_ID = {
    "杭州": "quanji-hz",
    "成都": "quanji-cd",
    "西安": "quanji-xa",
}
# 连锁备选，动线稿没把它们当代表店。只有片区没有别的餐厅时才用。
BACKUP_RESTAURANTS = {"waipojia", "xinbailu", "xiaolongkan", "shudaxia"}
SHUTTLE_PAIR = frozenset({"terracotta", "lishanyuan"})
DAY_START = 9 * 60
_PLAN_NOTES: ContextVar[list[str] | None] = ContextVar("plan_notes", default=None)
ATTRACTION_QUOTA = {
    TravelStyle.COMPACT: 4,
    TravelStyle.RELAXED: 2,
    TravelStyle.ECONOMY: 3,
}


@dataclass(frozen=True)
class Leg:
    mode: TransportMode
    minutes: int
    cost: float
    note: str


def haversine_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    radius = 6371.0
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    d_phi = math.radians(lat2 - lat1)
    d_lng = math.radians(lng2 - lng1)
    hav = math.sin(d_phi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(d_lng / 2) ** 2
    return 2 * radius * math.asin(math.sqrt(hav))


def access_leg(people: int) -> Leg:
    """远郊进出城。固定 60 分钟、每人 40 元，不按距离加价。"""
    return Leg(
        mode=TransportMode.TAXI,
        minutes=60,
        cost=40 * people,
        note="进出城至少 60 分钟，每人 40 元",
    )


def quote_leg(origin: Place, dest: Place, people: int) -> Leg:
    if frozenset({origin.id, dest.id}) == SHUTTLE_PAIR:
        return Leg(
            mode=TransportMode.TRANSIT,
            minutes=20,
            cost=0,
            note="免费摆渡，约 20 分钟，不按市内交通计费",
        )
    distance = haversine_km(origin.lat, origin.lng, dest.lat, dest.lng)
    if distance < 1.2:
        minutes = max(1, round(distance / 4.5 * 60))
        return Leg(mode=TransportMode.WALK, minutes=minutes, cost=0, note=f"步行约 {minutes} 分钟")
    minutes = max(1, round(distance / 25.0 * 60) + 15)
    minutes = min(minutes, 600)
    return Leg(
        mode=TransportMode.TRANSIT,
        minutes=minutes,
        cost=4 * people,
        note=f"公共交通约 {minutes} 分钟，每人 4 元",
    )


def _hhmm(minutes: int) -> str:
    minutes = max(0, min(minutes, 23 * 60 + 59))
    return f"{minutes // 60:02d}:{minutes % 60:02d}"


def _zone_order(catalog: CityCatalog) -> list[str]:
    demo = next(
        (
            item
            for item in load_itineraries()
            if item.get("city") == catalog.city and str(item.get("id", "")).endswith("3day-demo")
        ),
        None,
    )
    ordered: list[str] = []
    if demo:
        for day in demo.get("days") or []:
            zone = str(day.get("zone") or "")
            if zone and zone not in ordered:
                ordered.append(zone)
    for zone in catalog.zones:
        if zone.name not in ordered and not zone.suburban:
            ordered.append(zone.name)
    for zone in catalog.zones:
        if zone.name not in ordered:
            ordered.append(zone.name)
    return ordered or ["市区"]


def _draft(city: str, zone: str, style: TravelStyle) -> dict | None:
    for item in load_itineraries():
        if item.get("city") == city and item.get("zone") == zone and item.get("style") == style.value and item.get("slots"):
            return item
    return None


def _demo_theme(city: str, day_index: int, zone: str) -> str | None:
    for item in load_itineraries():
        if item.get("city") != city or not str(item.get("id", "")).endswith("3day-demo"):
            continue
        days = item.get("days") or []
        if day_index < len(days) and days[day_index].get("zone") == zone:
            return str(days[day_index].get("theme") or "")
    return None


def choose_zones(catalog: CityCatalog, days: int, must_zones: list[str]) -> list[str]:
    order = _zone_order(catalog)
    chosen = order[:days]
    while len(chosen) < days:
        chosen.append(order[-1])
    pinned = [zone for zone in must_zones if zone]
    for zone in pinned:
        if zone in chosen:
            continue
        for index in range(len(chosen) - 1, -1, -1):
            if chosen[index] not in pinned:
                chosen[index] = zone
                break
    return chosen[:days]


def _nearest(places: list[Place]) -> list[Place]:
    if not places:
        return []
    ordered = [places[0]]
    rest = places[1:]
    while rest:
        current = ordered[-1]
        nxt = min(rest, key=lambda place: haversine_km(current.lat, current.lng, place.lat, place.lng))
        rest.remove(nxt)
        ordered.append(nxt)
    return ordered


def _fallback_slots(catalog: CityCatalog, zone: str, style: TravelStyle, used: set[str]) -> list[dict]:
    attractions = [place for place in catalog.in_zone(zone, "attraction") if place.id not in used]
    if style == TravelStyle.ECONOMY:
        free = [place for place in attractions if place.ticket_price == 0]
        attractions = free or attractions
    elif style == TravelStyle.RELAXED:
        attractions = sorted(attractions, key=lambda place: place.duration_min, reverse=True)
    quota = ATTRACTION_QUOTA[style]
    picked = attractions[:quota]
    if style == TravelStyle.COMPACT and picked and all(place.ticket_price == 0 for place in picked):
        paid = next((place for place in attractions if place.ticket_price > 0 and place not in picked), None)
        if paid:
            picked[-1] = paid
    # 起点用片区目录里靠前的那个，之后按距离。
    catalog_rank = {place.id: index for index, place in enumerate(catalog.in_zone(zone, "attraction"))}
    picked.sort(key=lambda place: catalog_rank.get(place.id, 999))
    ordered = _nearest(picked)
    restaurants = [
        place
        for place in catalog.in_zone(zone, "restaurant")
        if place.id not in used and place.id not in BACKUP_RESTAURANTS
    ]
    if not restaurants:
        restaurants = [place for place in catalog.in_zone(zone, "restaurant") if place.id not in used]
    slots = [
        {"place_id": place.id, "duration_min": None, "type": "attraction"}
        for place in ordered
    ]
    if restaurants or ordered:
        meal_id = restaurants[0].id if restaurants else ""
        meal = {"place_id": meal_id, "duration_min": None, "type": "restaurant"}
        if slots:
            slots.insert(1, meal)
        else:
            slots.append(meal)
    return slots


def _ensure_must(slots: list[dict], must: list[Place]) -> list[dict]:
    present = {slot["place_id"] for slot in slots}
    for place in must:
        if place.id in present:
            continue
        slots.append(
            {
                "place_id": place.id,
                "duration_min": place.duration_min,
                "type": "restaurant" if place.type == "restaurant" else "attraction",
            }
        )
        present.add(place.id)
    must_ids = {place.id for place in must}
    while len(slots) > 6:
        dropped = False
        for index in range(len(slots) - 1, -1, -1):
            slot = slots[index]
            if slot["place_id"] not in must_ids and slot.get("type") != "restaurant":
                slots.pop(index)
                dropped = True
                break
        if not dropped:
            break
    return slots


def _stay_minutes(style: TravelStyle, kind: str, catalog_minutes: int, drafted: int | None) -> int:
    if drafted is not None:
        base = drafted
    elif style == TravelStyle.COMPACT and kind != "restaurant":
        base = round(catalog_minutes * 0.8)
    else:
        base = catalog_minutes
    if style == TravelStyle.RELAXED:
        return max(90, base)
    if kind == "restaurant":
        return max(60, base)
    return max(45, base)


def pop_plan_notes() -> list[str]:
    notes = _PLAN_NOTES.get()
    _PLAN_NOTES.set(None)
    return list(notes or [])


def _public_copy(text: str) -> str:
    cleaned = text.replace("大雁塔·大唐不夜城", "大雁塔和不夜城")
    cleaned = cleaned.replace("closed_weekdays", "闭馆日")
    return cleaned


def _visit_weekday(date_start: str | None, day_index: int) -> int | None:
    if not date_start:
        return None
    try:
        start = datetime.strptime(date_start, "%Y-%m-%d").date()
    except ValueError:
        return None
    return (start + timedelta(days=day_index)).weekday()


def _replace_closed(
    slots: list[dict],
    catalog: CityCatalog,
    zone: str,
    weekday: int | None,
    style: TravelStyle,
) -> list[str]:
    if weekday is None:
        return []
    notes: list[str] = []
    occupied = {slot.get("place_id") for slot in slots}
    for slot in list(slots):
        place = catalog.by_id(slot.get("place_id") or "")
        if place is None or place.type != "attraction" or weekday not in place.closed_weekdays:
            continue
        candidates = [
            item
            for item in catalog.in_zone(zone, "attraction")
            if item.id not in occupied and weekday not in item.closed_weekdays
        ]
        if style == TravelStyle.ECONOMY:
            free = [item for item in candidates if item.ticket_price == 0]
            candidates = free or candidates
        if candidates:
            pick = candidates[0]
            occupied.discard(place.id)
            occupied.add(pick.id)
            slot["place_id"] = pick.id
            slot["duration_min"] = None
            notes.append(f"closed_day {place.name}这天不开放，已改排同片区的{pick.name}。")
        else:
            slots.remove(slot)
            occupied.discard(place.id)
            notes.append(f"closed_day {place.name}这天不开放，同片区没有可替换的地点，已从这一天拿下。")
    return notes


def _suburban_zone(catalog: CityCatalog, name: str) -> bool:
    zone = catalog.zone(name)
    return bool(zone and zone.suburban)


def _without_optional_suburban(catalog: CityCatalog, zones: list[str], must_zones: list[str]) -> list[str]:
    kept = [zone for zone in zones if zone in must_zones or not _suburban_zone(catalog, zone)]
    if not kept:
        return zones
    downtown = [zone for zone in kept if not _suburban_zone(catalog, zone)] or kept

    def free_count(zone: str) -> int:
        return sum(1 for place in catalog.in_zone(zone, "attraction") if place.ticket_price == 0)

    while len(kept) < len(zones):
        pool = sorted(downtown, key=free_count, reverse=True)
        kept.append(pool[0])
    return kept[: len(zones)]


def _tickets_above_peers(tickets: float, food: float, transport: float) -> bool:
    return tickets > min(tickets, food, transport)


def _tips(place: Place, meal_rate: int | None) -> str:
    text = _public_copy(place.tips.strip())
    hours = _public_copy(place.hours_note)
    if hours and hours not in text:
        text = f"{text} {hours}".strip()
    if meal_rate is not None:
        prefix = f"这一顿按人均 {meal_rate} 元餐标计入，不是菜单标价。"
        if prefix not in text:
            text = f"{prefix}{text}"
    return text


def _description(place: Place, preferences: list[str]) -> str:
    text = _public_copy((place.description or place.blurb).strip())
    matched = [tag for tag in preferences if tag in place.tags]
    if matched:
        text = f"{text}（适合{'、'.join(matched)}）"
    return text


def _item_from_place(
    place: Place,
    *,
    kind: str,
    start: int,
    duration: int,
    people: int,
    preferences: list[str],
    meal_rate: int,
    leg: Leg | None,
) -> ItineraryItem:
    end = start + duration
    meal = kind == "restaurant"
    ticket = 0 if meal else place.ticket_price
    status = FactStatus.ESTIMATED if meal or place.fact_status != "sourced" else FactStatus.SOURCED
    return ItineraryItem(
        time_start=_hhmm(start),
        time_end=_hhmm(end),
        type=ItemType.MEAL if meal else ItemType.ATTRACTION,
        title=place.name,
        poi=Poi(name=place.name, lat=place.lat, lng=place.lng, adcode=""),
        duration_min=duration,
        cost_estimate=float(meal_rate if meal else ticket),
        ticket_price=float(ticket),
        fact_status=status,
        closed_weekdays=list(place.closed_weekdays),
        description=_description(place, preferences),
        tips=_tips(place, meal_rate if meal else None),
        transport_to_next=None
        if leg is None
        else TransportToNext(mode=leg.mode, duration_min=leg.minutes, note=leg.note),
        sources=[SourceRef(title=src.title, url=src.url) for src in place.sources],
    )


def _estimated_meal(anchor: Place, start: int, duration: int, rate: int, zone: str) -> ItineraryItem:
    return ItineraryItem(
        time_start=_hhmm(start),
        time_end=_hhmm(start + duration),
        type=ItemType.MEAL,
        title="片区内用餐",
        poi=Poi(name=f"{zone}用餐", lat=anchor.lat, lng=anchor.lng, adcode=""),
        duration_min=duration,
        cost_estimate=float(rate),
        ticket_price=0,
        fact_status=FactStatus.ESTIMATED,
        closed_weekdays=[],
        description=f"这一片没有指定餐厅，按人均 {rate} 元餐标估算。",
        tips=f"这一顿按人均 {rate} 元餐标计入，不是菜单标价。",
        transport_to_next=None,
        sources=[],
    )


def _layout(
    catalog: CityCatalog,
    slots: list[dict],
    *,
    style: TravelStyle,
    people: int,
    preferences: list[str],
    suburban: bool,
) -> tuple[list[ItineraryItem], float, int, int, int]:
    """返回 items、交通费（含远郊进城）、交通分钟、步行段数、衔接段数。"""
    rate = MEAL_RATE[style]
    resolved: list[tuple[dict, Place | None]] = []
    for slot in slots:
        place_id = slot.get("place_id") or ""
        resolved.append((slot, catalog.by_id(place_id) if place_id else None))
    resolved = [(slot, place) for slot, place in resolved if place is not None or not slot.get("place_id")]
    if not any(place is not None for _, place in resolved):
        return [], 0, 0, 0, 0

    built: list[ItineraryItem] = []
    cursor = DAY_START
    transport_cost = 0.0
    transit_min = 0
    walk_legs = 0
    leg_count = 0
    if suburban:
        inbound = access_leg(people)
        transport_cost += inbound.cost
        transit_min += inbound.minutes
        leg_count += 1

    real_slots = [(slot, place) for slot, place in resolved if place is not None or slot.get("type") == "restaurant"]
    for index, (slot, place) in enumerate(real_slots):
        nxt = real_slots[index + 1][1] if index + 1 < len(real_slots) else None
        kind = slot.get("type") or (place.type if place else "restaurant")
        drafted = slot.get("duration_min")
        catalog_minutes = place.duration_min if place else 60
        duration = _stay_minutes(style, kind, catalog_minutes, drafted if isinstance(drafted, int) else None)
        end = cursor + duration
        if end >= 24 * 60:
            break
        leg = None
        if nxt is not None and place is not None:
            leg = quote_leg(place, nxt, people)
        elif nxt is not None and place is None:
            leg = None
        item_place = place
        if item_place is None:
            anchor = next((prev for prev in reversed(built) if prev.poi), None)
            if anchor is None:
                continue
            fake_anchor = Place(
                id="meal-anchor",
                city=catalog.city,
                name=anchor.title,
                type="attraction",
                zone="",
                suburban=suburban,
                lat=anchor.poi.lat,
                lng=anchor.poi.lng,
                tags=(),
                duration_min=60,
                ticket_price=0,
                price=None,
                price_status="estimate",
                closed_weekdays=(),
                hours_note="",
                blurb="",
                description="",
                tips="",
                image="",
                sources=(),
                fact_status="estimated",
            )
            item = _estimated_meal(fake_anchor, cursor, duration, rate, catalog.city)
        else:
            item = _item_from_place(
                item_place,
                kind=kind,
                start=cursor,
                duration=duration,
                people=people,
                preferences=preferences,
                meal_rate=rate,
                leg=None,
            )
        if leg is not None:
            item.transport_to_next = TransportToNext(mode=leg.mode, duration_min=leg.minutes, note=leg.note)
            transport_cost += leg.cost
            transit_min += leg.minutes
            leg_count += 1
            if leg.mode == TransportMode.WALK:
                walk_legs += 1
            cursor = end + leg.minutes
        else:
            cursor = end
        built.append(item)
        if len(built) >= 6:
            break

    if suburban and built:
        outbound = access_leg(people)
        built[-1].transport_to_next = TransportToNext(
            mode=outbound.mode, duration_min=outbound.minutes, note=outbound.note
        )
        transport_cost += outbound.cost
        transit_min += outbound.minutes
        leg_count += 1
    return built, transport_cost, transit_min, walk_legs, leg_count


def _hotel_total(catalog: CityCatalog, people: int, days: int, include: bool) -> tuple[float, str]:
    if not include or days < 2:
        return 0.0, ""
    rooms = max(1, math.ceil(people / 2))
    nights = days - 1
    hotel_id = DEFAULT_HOTEL_ID.get(catalog.city)
    place = catalog.by_id(hotel_id) if hotel_id else None
    if place and place.price:
        rate = place.price
        name = place.name
    else:
        rate = DEFAULT_HOTEL_RATE
        name = "估算客房"
    return float(rate * rooms * nights), name


def plan_trip(
    *,
    city: str,
    days: int,
    budget_total: float,
    people: int,
    preferences: list[str],
    style: TravelStyle,
    must_visit: list[str] | None = None,
    date_start: str | None = None,
    budget_includes_hotel: bool = False,
) -> Trip:
    catalog = load_city(city) or generic_catalog(city)
    requested = [name.strip() for name in (must_visit or []) if name and name.strip()]
    must_places = [place for name in requested if (place := resolve_place(city, name))]
    must_zones: list[str] = []
    for place in must_places:
        if place.zone not in must_zones:
            must_zones.append(place.zone)
    notes: list[str] = []
    _PLAN_NOTES.set(notes)

    def render(zone_names: list[str]) -> tuple[list[DayPlan], float, int, int, int]:
        used: set[str] = set()
        day_plans: list[DayPlan] = []
        transport_total = 0.0
        transit_min = 0
        walk_legs = 0
        leg_count = 0
        for index, zone_name in enumerate(zone_names):
            zone_info = catalog.zone(zone_name)
            suburban = bool(zone_info.suburban) if zone_info else any(
                place.suburban for place in catalog.in_zone(zone_name)
            )
            draft = _draft(catalog.city, zone_name, style)
            draft_ids = {slot.get("place_id") for slot in (draft or {}).get("slots") or []}
            if draft and draft_ids.isdisjoint(used):
                slots = [
                    {
                        "place_id": slot.get("place_id"),
                        "duration_min": slot.get("duration_min"),
                        "type": slot.get("type"),
                    }
                    for slot in draft["slots"]
                ]
            else:
                slots = _fallback_slots(catalog, zone_name, style, used)
            slots = _ensure_must(slots, [place for place in must_places if place.zone == zone_name])
            notes.extend(
                _replace_closed(slots, catalog, zone_name, _visit_weekday(date_start, index), style)
            )
            items, cost, minutes, walks, legs = _layout(
                catalog,
                slots,
                style=style,
                people=people,
                preferences=preferences,
                suburban=suburban,
            )
            if len(items) < 2:
                slots = _fallback_slots(catalog, zone_name, TravelStyle.RELAXED, set())
                items, cost, minutes, walks, legs = _layout(
                    catalog,
                    slots[:3],
                    style=style,
                    people=people,
                    preferences=preferences,
                    suburban=suburban,
                )
            for item in items:
                named = next((place for place in catalog.places if place.name == item.title), None)
                if named:
                    used.add(named.id)
            theme = _demo_theme(catalog.city, index, zone_name) or f"{zone_name}片区"
            day_plans.append(DayPlan(day=index + 1, zone=zone_name, theme=theme, items=items))
            transport_total += cost
            transit_min += minutes
            walk_legs += walks
            leg_count += legs
        return day_plans, transport_total, transit_min, walk_legs, leg_count

    zones = choose_zones(catalog, days, must_zones)
    day_plans, transport_total, transit_min, walk_legs, leg_count = render(zones)
    ticket_probe = sum(item.ticket_price for day in day_plans for item in day.items if item.type == ItemType.ATTRACTION) * people
    meal_probe = sum(item.cost_estimate for day in day_plans for item in day.items if item.type == ItemType.MEAL) * people
    if style == TravelStyle.ECONOMY and _tickets_above_peers(ticket_probe, meal_probe, transport_total):
        notes.clear()
        zones = _without_optional_suburban(catalog, zones, must_zones)
        day_plans, transport_total, transit_min, walk_legs, leg_count = render(zones)

    ticket_units = sum(item.ticket_price for day in day_plans for item in day.items if item.type == ItemType.ATTRACTION)
    meal_units = sum(item.cost_estimate for day in day_plans for item in day.items if item.type == ItemType.MEAL)
    tickets = round(ticket_units * people, 1)
    food = round(meal_units * people, 1)
    hotel, hotel_name = _hotel_total(catalog, people, days, budget_includes_hotel)
    hotel_sentence = "住宿未计入。" if hotel == 0 else f"住宿按{hotel_name}的估算房价计入。"
    summary = f"{city}{days}天{STYLE_LABEL[style]}行程，适合{people}人。每天只安排一个片区。{hotel_sentence}"
    rationale = "，".join(f"第{day.day}天留在{day.zone}" for day in day_plans) + "。"
    stops = sum(len(day.items) for day in day_plans)
    return Trip(
        city=city,
        days=days,
        people=people,
        budget_total=budget_total,
        style=style,
        preferences=list(preferences),
        date_start=date_start,
        must_visit=requested,
        budget_includes_hotel=budget_includes_hotel,
        summary=summary,
        route_rationale=rationale,
        metrics=TripMetrics(
            stop_count=stops,
            transit_min=transit_min,
            ticket_total=tickets,
            walk_ratio=0 if leg_count == 0 else round(walk_legs / leg_count, 4),
        ),
        itinerary=day_plans,
        cost_breakdown=CostBreakdown(
            transport=round(transport_total, 1),
            food=food,
            tickets=tickets,
            hotel=hotel,
            other=0,
        ),
    )


def unmatched_must_visits(city: str, names: list[str], trip: Trip) -> list[str]:
    warnings: list[str] = []
    titles = [item.title for day in trip.itinerary for item in day.items]
    for name in names:
        place = resolve_place(city, name)
        if place is None:
            warnings.append(f"must_visit_unmatched 没有在目录里找到「{name}」，不会编造这个地点。")
            continue
        if not any(place.name == title or place.name in title or title in place.name for title in titles):
            warnings.append(f"must_visit_unmatched 「{name}」这几天没有排进去，不会另编一个地点。")
    return warnings
