"""把模型返回的说明贴回已经排好的行程。地点和价格保持不动。"""

from __future__ import annotations

from ..schemas.trip import Trip


def apply_prose(trip: Trip, prose: dict) -> Trip:
    data = trip.model_dump(mode="json")
    summary = prose.get("summary") if isinstance(prose, dict) else None
    if isinstance(summary, str) and summary.strip():
        data["summary"] = summary.strip()
    rationale = prose.get("route_rationale") if isinstance(prose, dict) else None
    if isinstance(rationale, str) and rationale.strip():
        data["route_rationale"] = rationale.strip()
    indexed: dict[tuple[int, str], dict] = {}
    for day in data["itinerary"]:
        for item in day["items"]:
            indexed[(day["day"], item["title"])] = item
    for entry in (prose.get("items") if isinstance(prose, dict) else None) or []:
        if not isinstance(entry, dict):
            continue
        item = indexed.get((entry.get("day"), entry.get("title")))
        if item is None:
            continue
        for field in ("description", "tips"):
            value = entry.get(field)
            if isinstance(value, str) and value.strip():
                item[field] = value.strip()
    return Trip.model_validate(data)


def prose_skeleton(trip: Trip) -> dict:
    return {
        "city": trip.city,
        "days": trip.days,
        "style": trip.style.value,
        "summary": trip.summary,
        "route_rationale": trip.route_rationale,
        "days_plan": [
            {
                "day": day.day,
                "zone": day.zone,
                "theme": day.theme,
                "items": [
                    {"title": item.title, "description": item.description, "tips": item.tips}
                    for item in day.items
                ],
            }
            for day in trip.itinerary
        ],
    }
