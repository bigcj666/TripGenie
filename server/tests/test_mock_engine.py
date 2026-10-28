"""Mock 引擎 golden case：3 城 × 3 风格全部通过契约校验。"""

import pytest

from app.llm.mock_engine import generate_mock_trip
from app.schemas.trip import TravelStyle, Trip

CITIES = ["杭州", "成都", "西安"]
STYLES = [TravelStyle.COMPACT, TravelStyle.RELAXED, TravelStyle.ECONOMY]


@pytest.mark.parametrize("city", CITIES)
@pytest.mark.parametrize("style", STYLES)
def test_mock_trips_valid(city, style):
    trip = generate_mock_trip(
        city=city, days=3, budget_total=1500, people=3, preferences=["亲子", "美食"], style=style
    )
    assert isinstance(trip, Trip)
    assert trip.city == city
    assert len(trip.itinerary) == 3
    assert trip.style == style
    # 契约已由 Pydantic 构造校验；再断言风格差异存在
    items_day1 = len(trip.itinerary[0].items)
    if style == TravelStyle.RELAXED:
        assert items_day1 <= 4
    else:
        assert items_day1 >= 4


def test_mock_generic_city():
    trip = generate_mock_trip(
        city="洛阳", days=2, budget_total=800, people=2, preferences=[], style=TravelStyle.RELAXED
    )
    assert trip.city == "洛阳"
    assert len(trip.itinerary) == 2
    assert all(len(d.items) >= 2 for d in trip.itinerary)


def test_style_differences_visible():
    compact = generate_mock_trip("杭州", 3, 1500, 3, [], TravelStyle.COMPACT)
    relaxed = generate_mock_trip("杭州", 3, 1500, 3, [], TravelStyle.RELAXED)
    economy = generate_mock_trip("杭州", 3, 1500, 3, [], TravelStyle.ECONOMY)
    c_items = sum(len(d.items) for d in compact.itinerary)
    r_items = sum(len(d.items) for d in relaxed.itinerary)
    assert c_items > r_items
    assert economy.cost_breakdown.tickets <= compact.cost_breakdown.tickets
