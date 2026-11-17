"""Pydantic 契约：与 mobile/src/types/trip.ts 逐字段同步，变更需双端同改。"""

from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Optional
from uuid import uuid4

from pydantic import BaseModel, Field, field_validator, model_validator


class TravelStyle(str, Enum):
    COMPACT = "compact"
    RELAXED = "relaxed"
    ECONOMY = "economy"


class ItemType(str, Enum):
    ATTRACTION = "attraction"
    MEAL = "meal"
    TRANSPORT = "transport"
    HOTEL = "hotel"
    FREE = "free"


class FactStatus(str, Enum):
    SOURCED = "sourced"
    ESTIMATED = "estimated"


class TransportMode(str, Enum):
    WALK = "walk"
    TRANSIT = "transit"
    DRIVE = "drive"
    TAXI = "taxi"


class Poi(BaseModel):
    name: str = Field(min_length=1)
    lat: float = Field(ge=-90, le=90)
    lng: float = Field(ge=-180, le=180)
    adcode: str = Field(default="", description="行政区划代码，可为空")


class SourceRef(BaseModel):
    title: str = Field(min_length=1)
    url: str = Field(min_length=1)


class TransportToNext(BaseModel):
    mode: TransportMode
    duration_min: int = Field(ge=0, le=600)
    note: str = ""


class ItineraryItem(BaseModel):
    time_start: str = Field(pattern=r"^([01]\d|2[0-3]):[0-5]\d$")
    time_end: str = Field(pattern=r"^([01]\d|2[0-3]):[0-5]\d$")
    type: ItemType
    title: str = Field(min_length=1)
    poi: Poi
    duration_min: int = Field(ge=1, le=720)
    cost_estimate: float = Field(ge=0)
    ticket_price: float = Field(default=0, ge=0, description="景点人均门票；餐饮为 0")
    fact_status: FactStatus = FactStatus.ESTIMATED
    closed_weekdays: list[int] = Field(default_factory=list, description="0=周一 … 6=周日")
    description: str = ""
    tips: str = ""
    transport_to_next: Optional[TransportToNext] = None
    sources: list[SourceRef] = Field(default_factory=list)

    @field_validator("closed_weekdays")
    @classmethod
    def _check_closed(cls, days: list[int]) -> list[int]:
        for day in days:
            if day < 0 or day > 6:
                raise ValueError(f"闭馆日非法: {day}")
        return days

    @model_validator(mode="after")
    def _check_time_order(self) -> "ItineraryItem":
        if self.time_start >= self.time_end:
            raise ValueError(f"时间段非法: {self.time_start} >= {self.time_end}（{self.title}）")
        return self


def _to_minutes(hhmm: str) -> int:
    h, m = hhmm.split(":")
    return int(h) * 60 + int(m)


class DayPlan(BaseModel):
    day: int = Field(ge=1, le=30)
    zone: str = ""
    theme: str = Field(min_length=1)
    items: list[ItineraryItem] = Field(min_length=2, max_length=6)

    @model_validator(mode="after")
    def _check_no_overlap(self) -> "DayPlan":
        ordered = sorted(self.items, key=lambda it: _to_minutes(it.time_start))
        for prev, cur in zip(ordered, ordered[1:]):
            # 容差 5 分钟：允许短暂衔接缝隙
            if _to_minutes(cur.time_start) < _to_minutes(prev.time_end) - 5:
                raise ValueError(
                    f"Day{self.day} 时段重叠: {prev.title}({prev.time_end}) 与 {cur.title}({cur.time_start})"
                )
        return self


class TripMetrics(BaseModel):
    stop_count: int = Field(default=0, ge=0)
    transit_min: int = Field(default=0, ge=0)
    ticket_total: float = Field(default=0, ge=0)
    walk_ratio: float = Field(default=0, ge=0, le=1)


class CostBreakdown(BaseModel):
    transport: float = Field(ge=0)
    food: float = Field(ge=0)
    tickets: float = Field(ge=0)
    hotel: float = Field(ge=0)
    other: float = Field(ge=0)

    @property
    def total(self) -> float:
        return self.transport + self.food + self.tickets + self.hotel + self.other


class Trip(BaseModel):
    trip_id: str = Field(default_factory=lambda: str(uuid4()))
    city: str = Field(min_length=1)
    days: int = Field(ge=1, le=14)
    people: int = Field(ge=1, le=20)
    budget_total: float = Field(gt=0)
    style: TravelStyle
    preferences: list[str] = Field(default_factory=list)
    date_start: Optional[str] = None
    must_visit: list[str] = Field(default_factory=list)
    budget_includes_hotel: bool = False
    summary: str = ""
    route_rationale: str = ""
    metrics: TripMetrics = Field(default_factory=TripMetrics)
    itinerary: list[DayPlan]
    cost_breakdown: CostBreakdown

    @field_validator("date_start")
    @classmethod
    def _check_date(cls, value: object) -> object:
        if value is None or value == "":
            return None
        if not isinstance(value, str):
            raise ValueError("date_start 应为 YYYY-MM-DD")
        try:
            datetime.strptime(value, "%Y-%m-%d")
        except ValueError as exc:
            raise ValueError("date_start 应为有效日期 YYYY-MM-DD") from exc
        return value

    @model_validator(mode="after")
    def _check_days(self) -> "Trip":
        if len(self.itinerary) != self.days:
            raise ValueError(f"行程天数不符: days={self.days} 但 itinerary={len(self.itinerary)} 天")
        for idx, plan in enumerate(self.itinerary, start=1):
            if plan.day != idx:
                raise ValueError(f"行程日序号应连续: 第{idx}项 day={plan.day}")
        return self


class GenerateRequest(BaseModel):
    city: str = Field(min_length=1, max_length=20)
    days: int = Field(ge=1, le=7)
    budget_total: float = Field(gt=0, le=1_000_000)
    people: int = Field(ge=1, le=20)
    preferences: list[str] = Field(default_factory=list)
    style: TravelStyle | str = "all"
    date_start: Optional[str] = None
    must_visit: list[str] = Field(default_factory=list)
    budget_includes_hotel: bool = False

    @field_validator("date_start")
    @classmethod
    def _check_date(cls, value: object) -> object:
        if value is None or value == "":
            return None
        if not isinstance(value, str):
            raise ValueError("date_start 应为 YYYY-MM-DD")
        try:
            datetime.strptime(value, "%Y-%m-%d")
        except ValueError as exc:
            raise ValueError("date_start 应为有效日期 YYYY-MM-DD") from exc
        return value

    @field_validator("must_visit")
    @classmethod
    def _check_must_visit(cls, names: list[str]) -> list[str]:
        cleaned: list[str] = []
        for name in names:
            text = str(name).strip()
            if not text:
                raise ValueError("必去地名不能是空的")
            cleaned.append(text)
        if len(cleaned) > 5:
            raise ValueError("必去最多 5 个")
        return cleaned

    @field_validator("style")
    @classmethod
    def _check_style(cls, v: object) -> object:
        if isinstance(v, str) and v not in {s.value for s in TravelStyle} | {"all"}:
            raise ValueError(f"style 非法: {v}")
        return v

    @property
    def styles(self) -> list[TravelStyle]:
        if self.style == "all":
            return [TravelStyle.COMPACT, TravelStyle.RELAXED, TravelStyle.ECONOMY]
        return [TravelStyle(self.style)]


class GenerateResponse(BaseModel):
    engine: str = Field(description="deepseek | glm | mock")
    plans: list[Trip]
    warnings: list[str] = Field(default_factory=list)
