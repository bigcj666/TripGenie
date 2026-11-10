"""同区排程、远郊、必去、费用不贴预算。"""

from app.data.catalog import load_city
from app.llm.mock_engine import generate_mock_trip
from app.schemas.trip import ItemType, TravelStyle
from app.services.copywriting import apply_prose
from app.services.schedule import access_leg, haversine_km, quote_leg

CITIES = ["杭州", "成都", "西安"]
STYLES = [TravelStyle.COMPACT, TravelStyle.RELAXED, TravelStyle.ECONOMY]
GOLD = dict(city="杭州", days=3, budget_total=1500, people=3, preferences=["亲子", "美食"])


def _zones_of(trip):
    return [day.zone for day in trip.itinerary]


def _titles(trip):
    return [item.title for day in trip.itinerary for item in day.items]


def test_distance_formula_not_alternating():
    hangzhou = load_city("杭州")
    near = quote_leg(hangzhou.by_id("duanqiao"), hangzhou.by_id("gushan"), people=3)
    distance = haversine_km(30.2593, 120.1477, 30.254, 120.144)
    assert distance < 1.2
    assert near.mode.value == "walk"
    assert near.cost == 0
    assert near.minutes == max(1, round(distance / 4.5 * 60))

    far = quote_leg(hangzhou.by_id("duanqiao"), hangzhou.by_id("leifeng"), people=2)
    far_km = haversine_km(30.2593, 120.1477, 30.232, 120.149)
    assert far_km >= 1.2
    assert far.mode.value == "transit"
    assert far.cost == 8
    assert far.minutes == max(1, round(far_km / 25 * 60) + 15)

    access = access_leg(3)
    assert access.minutes == 60
    assert access.cost == 120
    assert access.mode.value == "taxi"

    xian = load_city("西安")
    shuttle = quote_leg(xian.by_id("terracotta"), xian.by_id("lishanyuan"), people=4)
    assert shuttle.minutes == 20
    assert shuttle.cost == 0
    assert "摆渡" in shuttle.note


def test_same_zone_and_suburban_not_mixed():
    for city in CITIES:
        catalog = load_city(city)
        for style in STYLES:
            trip = generate_mock_trip(city, 3, 1500, 3, ["亲子", "美食"], style)
            assert _zones_of(trip)
            for day in trip.itinerary:
                zone = catalog.zone(day.zone)
                assert zone is not None
                for item in day.items:
                    if item.title == "片区内用餐":
                        continue
                    place = next(place for place in catalog.places if place.name == item.title)
                    assert place.zone == day.zone
                    assert place.suburban is zone.suburban
                if zone.suburban:
                    assert any(item.transport_to_next and item.transport_to_next.mode.value == "taxi" for item in day.items)


def test_hangzhou_gold_zones_skip_xixi():
    for style in STYLES:
        trip = generate_mock_trip(**GOLD, style=style)
        assert _zones_of(trip) == ["西湖", "灵隐", "湖滨吴山"]
        assert all("西溪" not in title for title in _titles(trip))
        assert trip.cost_breakdown.hotel == 0
        assert trip.budget_includes_hotel is False


def test_xixi_can_be_its_own_day():
    trip = generate_mock_trip("杭州", 3, 1500, 2, [], TravelStyle.RELAXED, must_visit=["西溪"])
    assert "西溪" in _zones_of(trip)
    catalog = load_city("杭州")
    xixi_days = [day for day in trip.itinerary if day.zone == "西溪"]
    assert len(xixi_days) == 1
    for item in xixi_days[0].items:
        if item.title == "片区内用餐":
            continue
        place = next(place for place in catalog.places if place.name == item.title)
        assert place.zone == "西溪"
        assert place.suburban is True
    names = {item.title for item in xixi_days[0].items}
    assert "断桥残雪" not in names
    assert "灵隐寺" not in names


def test_must_visit_hit_and_miss():
    trip = generate_mock_trip("杭州", 3, 1500, 3, ["亲子"], TravelStyle.COMPACT, must_visit=["灵隐寺", "火星乐园"])
    assert any(item.title == "灵隐寺" for day in trip.itinerary if day.zone == "灵隐" for item in day.items)
    assert "火星乐园" not in _titles(trip)
    from app.services.generate import generate_trips
    from app.schemas.trip import GenerateRequest
    from app.config import Settings

    resp = generate_trips(
        GenerateRequest(
            city="杭州",
            days=3,
            budget_total=1500,
            people=3,
            preferences=["亲子", "美食"],
            style="compact",
            must_visit=["灵隐寺", "火星乐园"],
        ),
        Settings.from_env(),
    )
    assert any("must_visit_unmatched" in warning and "火星乐园" in warning for warning in resp.warnings)
    assert all("火星乐园" not in item.title for plan in resp.plans for day in plan.itinerary for item in day.items)


def test_styles_differ_in_counts_stay_and_tickets():
    compact = generate_mock_trip(**GOLD, style=TravelStyle.COMPACT)
    relaxed = generate_mock_trip(**GOLD, style=TravelStyle.RELAXED)
    economy = generate_mock_trip(**GOLD, style=TravelStyle.ECONOMY)

    def stops(trip):
        return trip.metrics.stop_count

    def mean_stay(trip):
        durations = [item.duration_min for day in trip.itinerary for item in day.items]
        return sum(durations) / len(durations)

    assert stops(compact) > stops(relaxed)
    assert stops(compact) > stops(economy)
    assert mean_stay(relaxed) > mean_stay(compact)
    assert mean_stay(relaxed) > mean_stay(economy)
    assert economy.cost_breakdown.tickets < relaxed.cost_breakdown.tickets < compact.cost_breakdown.tickets
    assert economy.metrics.ticket_total == economy.cost_breakdown.tickets


def test_hotel_switch_adds_its_own_line():
    off = generate_mock_trip(**GOLD, style=TravelStyle.COMPACT, budget_includes_hotel=False)
    on = generate_mock_trip(**GOLD, style=TravelStyle.COMPACT, budget_includes_hotel=True)
    assert off.cost_breakdown.hotel == 0
    assert on.cost_breakdown.hotel == 420 * 2 * 2
    assert on.cost_breakdown.tickets == off.cost_breakdown.tickets
    assert on.cost_breakdown.food == off.cost_breakdown.food
    assert on.cost_breakdown.transport == off.cost_breakdown.transport
    assert "住宿未计入" in off.summary
    assert "住宿" in on.summary


def test_line_items_match_breakdown_and_ignore_budget():
    low = generate_mock_trip("成都", 3, 800, 2, ["美食"], TravelStyle.ECONOMY)
    high = generate_mock_trip("成都", 3, 8000, 2, ["美食"], TravelStyle.ECONOMY)
    assert low.cost_breakdown.model_dump() == high.cost_breakdown.model_dump()
    for trip in (low, high):
        tickets = sum(item.ticket_price for day in trip.itinerary for item in day.items if item.type == ItemType.ATTRACTION)
        meals = sum(item.cost_estimate for day in trip.itinerary for item in day.items if item.type == ItemType.MEAL)
        assert abs(tickets * trip.people - trip.cost_breakdown.tickets) < 0.2
        assert abs(meals * trip.people - trip.cost_breakdown.food) < 0.2
        assert trip.cost_breakdown.hotel == 0
        assert abs(trip.cost_breakdown.total - trip.budget_total * 0.95) > 1


def test_prose_cannot_invent_places_or_prices():
    trip = generate_mock_trip(**GOLD, style=TravelStyle.COMPACT)
    original = next(item for day in trip.itinerary for item in day.items if item.title == "断桥残雪")
    updated = apply_prose(
        trip,
        {
            "summary": "改写后的概述",
            "route_rationale": "三天分别留在三个片区。",
            "items": [
                {
                    "day": 1,
                    "title": "断桥残雪",
                    "description": "改写后的介绍",
                    "tips": "早一点到",
                    "cost_estimate": 9999,
                    "ticket_price": 75,
                },
                {"day": 1, "title": "火星乐园", "description": "不该出现"},
            ],
        },
    )
    titles = _titles(updated)
    assert "火星乐园" not in titles
    assert updated.summary == "改写后的概述"
    bridge = next(item for day in updated.itinerary for item in day.items if item.title == "断桥残雪")
    assert bridge.description == "改写后的介绍"
    assert bridge.cost_estimate == original.cost_estimate
    assert bridge.ticket_price == original.ticket_price
    assert bridge.poi.lat == original.poi.lat


def test_restaurant_notes_survive_and_meals_use_rate():
    trip = generate_mock_trip(**GOLD, style=TravelStyle.COMPACT)
    lou = next(item for day in trip.itinerary for item in day.items if item.title.startswith("楼外楼"))
    assert lou.type == ItemType.MEAL
    assert lou.cost_estimate == 50
    assert lou.fact_status.value == "estimated"
    assert "景区" in lou.tips or "180" in lou.tips
    lingyin = next(item for day in trip.itinerary for item in day.items if item.title == "灵隐寺")
    assert lingyin.ticket_price == 0
    assert lingyin.cost_estimate == 0
