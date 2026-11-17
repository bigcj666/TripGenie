"""没有大模型配置时的行程：读城市目录，先排程，再用目录简介做说明。"""

from __future__ import annotations

from ..schemas.trip import TravelStyle, Trip
from ..services.schedule import plan_trip


def generate_mock_trip(
    city: str,
    days: int,
    budget_total: float,
    people: int,
    preferences: list[str],
    style: TravelStyle,
    *,
    must_visit: list[str] | None = None,
    date_start: str | None = None,
    budget_includes_hotel: bool = False,
) -> Trip:
    return plan_trip(
        city=city,
        days=days,
        budget_total=budget_total,
        people=people,
        preferences=preferences,
        style=style,
        must_visit=must_visit,
        date_start=date_start,
        budget_includes_hotel=budget_includes_hotel,
    )
