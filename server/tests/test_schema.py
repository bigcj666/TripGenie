"""契约校验测试：覆盖 [S2.3] 的全部硬性规则。"""

import pytest
from pydantic import ValidationError

from app.schemas.trip import (
    CostBreakdown,
    DayPlan,
    GenerateRequest,
    ItineraryItem,
    ItemType,
    Poi,
    TransportMode,
    TransportToNext,
    TravelStyle,
    Trip,
)


def _item(start: str, end: str, title: str = "测试点") -> ItineraryItem:
    return ItineraryItem(
        time_start=start,
        time_end=end,
        type=ItemType.ATTRACTION,
        title=title,
        poi=Poi(name=title, lat=30.25, lng=120.15),
        duration_min=60,
        cost_estimate=0,
        description="d",
        tips="t",
        transport_to_next=TransportToNext(mode=TransportMode.WALK, duration_min=10, note="走"),
        sources=[],
    )


def _day(items: list[ItineraryItem], day: int = 1) -> DayPlan:
    return DayPlan(day=day, theme="主题", items=items)


def _trip(days_plans: list[DayPlan], days: int | None = None) -> Trip:
    return Trip(
        city="杭州",
        days=days or len(days_plans),
        people=2,
        budget_total=1000,
        style=TravelStyle.COMPACT,
        preferences=[],
        summary="s",
        itinerary=days_plans,
        cost_breakdown=CostBreakdown(transport=100, food=300, tickets=100, hotel=400, other=100),
    )


def test_valid_trip_passes():
    trip = _trip([_day([_item("09:00", "10:00"), _item("10:30", "12:00")])])
    assert trip.city == "杭州"
    assert trip.itinerary[0].items[0].time_start == "09:00"


def test_item_time_order_enforced():
    with pytest.raises(ValidationError, match="时间段非法"):
        _item("11:00", "09:00")


def test_day_overlap_rejected():
    with pytest.raises(ValidationError, match="时段重叠"):
        _day([_item("09:00", "11:00", "A"), _item("10:00", "12:00", "B")])


def test_day_overlap_tolerance_5min_ok():
    day = _day([_item("09:00", "11:00", "A"), _item("10:56", "12:00", "B")])
    assert len(day.items) == 2


def test_items_count_bounds():
    with pytest.raises(ValidationError):
        _day([_item("09:00", "10:00")])  # 只有 1 个
    with pytest.raises(ValidationError):
        _day([_item(f"{9 + i:02d}:00", f"{10 + i:02d}:00") for i in range(7)])  # 7 个


def test_days_must_match_itinerary_length():
    with pytest.raises(ValidationError, match="行程天数不符"):
        _trip([_day([_item("09:00", "10:00"), _item("10:30", "12:00")])], days=3)


def test_day_numbers_sequential():
    with pytest.raises(ValidationError, match="序号应连续"):
        _trip([_day([_item("09:00", "10:00"), _item("10:30", "12:00")], day=2)])


def test_generate_request_styles():
    req = GenerateRequest(city="杭州", days=3, budget_total=1500, people=3, preferences=["亲子"], style="all")
    assert req.styles == [TravelStyle.COMPACT, TravelStyle.RELAXED, TravelStyle.ECONOMY]
    req2 = GenerateRequest(city="杭州", days=2, budget_total=800, people=2, style="economy")
    assert req2.styles == [TravelStyle.ECONOMY]


def test_generate_request_bad_style_rejected():
    with pytest.raises(ValidationError):
        GenerateRequest(city="杭州", days=1, budget_total=100, people=1, style="luxury")


def test_v3_defaults_and_rejections():
    req = GenerateRequest(city="杭州", days=3, budget_total=1500, people=3)
    assert req.budget_includes_hotel is False
    assert req.must_visit == []
    assert req.date_start is None
    with pytest.raises(ValidationError):
        GenerateRequest(city="杭州", days=1, budget_total=100, people=1, must_visit=["a", "b", "c", "d", "e", "f"])
    with pytest.raises(ValidationError):
        GenerateRequest(city="杭州", days=1, budget_total=100, people=1, date_start="2026/11/02")
    with pytest.raises(ValidationError):
        GenerateRequest(city="杭州", days=1, budget_total=100, people=1, date_start="2026-02-31")
    bad_fact = _item("09:00", "10:00").model_dump()
    bad_fact["fact_status"] = "guessed"
    with pytest.raises(ValidationError):
        ItineraryItem.model_validate(bad_fact)
    bad_closed = _item("09:00", "10:00").model_dump()
    bad_closed["closed_weekdays"] = [7]
    with pytest.raises(ValidationError):
        ItineraryItem.model_validate(bad_closed)
