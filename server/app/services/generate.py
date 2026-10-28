"""生成服务：编排引擎调用、契约校验、降级与质量告警。"""

from __future__ import annotations

import logging

from ..config import Settings
from ..llm.client import make_generator
from ..llm.mock_engine import generate_mock_trip
from ..schemas.trip import GenerateRequest, GenerateResponse, Trip, TravelStyle

logger = logging.getLogger(__name__)

_PREF_TAGS = ["美食", "自然", "人文", "亲子", "购物", "网红打卡"]


def _quality_warnings(trip: Trip) -> list[str]:
    warnings: list[str] = []
    total = trip.cost_breakdown.total
    if trip.budget_total > 0:
        drift = abs(total - trip.budget_total) / trip.budget_total
        if drift > 0.2:
            warnings.append(
                f"预算偏差 {drift:.0%}：估算合计 {total:.0f} 元 vs 预算 {trip.budget_total:.0f} 元"
            )
    if trip.preferences:
        text = " ".join(
            f"{it.title} {it.description} {it.tips}"
            for day in trip.itinerary
            for it in day.items
        )
        hit = sum(1 for p in trip.preferences if p in text)
        if hit < max(1, len(trip.preferences) * 0.5):
            warnings.append(f"偏好命中不足：{trip.preferences} 仅 {hit} 项体现在行程中")
    return warnings


def generate_trips(request: GenerateRequest, settings: Settings | None = None) -> GenerateResponse:
    settings = settings or Settings.from_env()
    generator, engine = make_generator(settings)
    plans: list[Trip] = []
    warnings: list[str] = []

    for style in request.styles:
        trip, engine_used, fallback_reason = _generate_one(generator, engine, request, style)
        plans.append(trip)
        if fallback_reason:
            warnings.append(f"[{style.value}] {fallback_reason}")
        warnings.extend(f"[{style.value}] {w}" for w in _quality_warnings(trip))
        engine = engine_used

    return GenerateResponse(engine=engine, plans=plans, warnings=warnings)


def _generate_one(generator, engine: str, request: GenerateRequest, style: TravelStyle):
    """返回 (Trip, 实际引擎, 降级原因或空串)。"""
    try:
        raw = generator.generate(
            city=request.city,
            days=request.days,
            budget_total=request.budget_total,
            people=request.people,
            preferences=request.preferences,
            style=style.value,
        )
        trip = Trip.model_validate(raw)
        if trip.style != style:
            trip.style = style
        return trip, engine, ""
    except Exception as exc:  # noqa: BLE001 —— 校验/网络/解析失败一律降级
        reason = f"真实引擎失败已降级 Mock（{type(exc).__name__}）"
        logger.warning("%s: %s", reason, exc)
        trip = generate_mock_trip(
            city=request.city,
            days=request.days,
            budget_total=request.budget_total,
            people=request.people,
            preferences=request.preferences,
            style=style,
        )
        return trip, "mock", reason
