"""生成服务：编排引擎调用、契约校验、降级与质量告警。"""

from __future__ import annotations

import logging

from ..config import Settings
from ..llm.client import make_generator
from ..llm.mock_engine import generate_mock_trip
from ..schemas.trip import GenerateRequest, GenerateResponse, TravelStyle, Trip

logger = logging.getLogger(__name__)


def _quality_warnings(trip: Trip) -> list[str]:
    warnings: list[str] = []
    total = trip.cost_breakdown.total
    if trip.budget_total > 0:
        drift = abs(total - trip.budget_total) / trip.budget_total
        if drift > 0.2:
            token = "over_budget " if total > trip.budget_total else "under_budget "
            warnings.append(
                f"{token}预算偏差 {drift:.0%}：估算合计 {total:.0f} 元 vs 预算 {trip.budget_total:.0f} 元"
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


def _style_warnings(trip: Trip) -> list[str]:
    """[S2.3] 风格规则的服务层校验（不拦截输出，出告警供前端提示）。"""
    warnings: list[str] = []
    per_day = [len(day.items) for day in trip.itinerary]
    items = [it for day in trip.itinerary for it in day.items]
    if trip.style == TravelStyle.COMPACT and min(per_day) < 5:
        warnings.append("style_rule compact：建议每日 ≥5 项安排")
    if trip.style == TravelStyle.RELAXED:
        if max(per_day) > 4:
            warnings.append("style_rule relaxed：建议每日 ≤4 项安排")
        if any(it.duration_min < 90 for it in items):
            warnings.append("style_rule relaxed：建议单点停留 ≥90 分钟")
    if trip.style == TravelStyle.ECONOMY:
        cats = {
            "transport": trip.cost_breakdown.transport,
            "food": trip.cost_breakdown.food,
            "tickets": trip.cost_breakdown.tickets,
            "hotel": trip.cost_breakdown.hotel,
            "other": trip.cost_breakdown.other,
        }
        if cats["tickets"] > min(cats.values()):
            warnings.append("style_rule economy：门票类花费应为各项中最低")
        if not any(it.cost_estimate == 0 for it in items):
            warnings.append("style_rule economy：建议包含免费/低价备选")
    return warnings


def generate_trips(request: GenerateRequest, settings: Settings | None = None) -> GenerateResponse:
    settings = settings or Settings.from_env()
    generator, engine = make_generator(settings)
    plans: list[Trip] = []
    warnings: list[str] = []
    engines_used: list[str] = []

    for style in request.styles:
        trip, engine_used, fallback_reason = _generate_one(generator, engine, request, style)
        plans.append(trip)
        engines_used.append(engine_used)
        if fallback_reason:
            warnings.append(f"[{style.value}] {fallback_reason}")
        warnings.extend(f"[{style.value}] {w}" for w in _quality_warnings(trip))
        warnings.extend(f"[{style.value}] {w}" for w in _style_warnings(trip))

    # 任一方案降级即整体标记 mock，避免混合场景下降级标记丢失
    if any(e == "mock" for e in engines_used):
        final_engine = "mock"
    else:
        final_engine = engines_used[0] if engines_used else engine

    return GenerateResponse(engine=final_engine, plans=plans, warnings=warnings)


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
