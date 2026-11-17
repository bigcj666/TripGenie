"""LLM 客户端：OpenAI 兼容接口（DeepSeek / GLM）+ Mock 引擎统一入口。"""

from __future__ import annotations

import json
import logging
from typing import Protocol

import httpx

from ..config import Settings
from .mock_engine import generate_mock_trip

logger = logging.getLogger(__name__)


class TripGenerator(Protocol):
    def generate(self, *, city: str, days: int, budget_total: float, people: int,
                 preferences: list[str], style: str) -> dict:  # 返回 Trip 的 JSON dict
        ...


def build_prompt(*, skeleton: dict) -> list[dict]:
    user = (
        "下面这份行程的地点、顺序、时间和价格已经定好。请只改写说明文字。\n"
        "可以改 summary、route_rationale，以及已有项目的 description 和 tips。\n"
        "不要新增地点，不要删除地点，不要改标题、时间、价格、坐标或片区。\n"
        "只输出一个 JSON 对象，不要解释，不要 markdown。格式：\n"
        '{"summary":"","route_rationale":"","items":[{"day":1,"title":"已有标题","description":"","tips":""}]}\n\n'
        f"行程骨架：\n{json.dumps(skeleton, ensure_ascii=False)}"
    )
    return [
        {
            "role": "system",
            "content": "你只改写已经排好的行程说明。不新增地点，不改价格。只输出 JSON。",
        },
        {"role": "user", "content": user},
    ]


class OpenAICompatClient:
    """DeepSeek / GLM 通用（两者都提供 OpenAI 兼容 chat/completions）。"""

    def __init__(self, *, api_key: str, base_url: str, model: str, timeout: float, engine_name: str):
        self.api_key = api_key
        self.base_url = base_url
        self.model = model
        self.timeout = timeout
        self.engine_name = engine_name

    def _chat(self, messages: list[dict]) -> str:
        payload = {
            "model": self.model,
            "messages": messages,
            "temperature": 0.4,
            "response_format": {"type": "json_object"},
        }
        with httpx.Client(timeout=self.timeout) as client:
            resp = client.post(
                f"{self.base_url}/chat/completions",
                headers={"Authorization": f"Bearer {self.api_key}"},
                json=payload,
            )
            resp.raise_for_status()
            return resp.json()["choices"][0]["message"]["content"]

    def generate(self, *, city: str, days: int, budget_total: float, people: int,
                 preferences: list[str], style: str, must_visit: list[str] | None = None,
                 date_start: str | None = None, budget_includes_hotel: bool = False) -> dict:
        from ..schemas.trip import TravelStyle
        from ..services.copywriting import apply_prose, prose_skeleton

        trip = generate_mock_trip(
            city=city,
            days=days,
            budget_total=budget_total,
            people=people,
            preferences=preferences,
            style=TravelStyle(style),
            must_visit=must_visit,
            date_start=date_start,
            budget_includes_hotel=budget_includes_hotel,
        )
        messages = build_prompt(skeleton=prose_skeleton(trip))
        raw = self._chat(messages)
        try:
            prose = _extract_json(raw)
        except Exception:  # noqa: BLE001 —— 解析失败再要一次说明文字
            messages.append({"role": "assistant", "content": raw})
            messages.append({
                "role": "user",
                "content": "请只输出说明文字的 JSON（summary、route_rationale、items 的 description 和 tips），不要改地点和价格。",
            })
            prose = _extract_json(self._chat(messages))
        return apply_prose(trip, prose).model_dump(mode="json")


def _extract_json(raw: str) -> dict:
    text = raw.strip()
    if text.startswith("```"):
        text = text.strip("`")
        if text.startswith("json"):
            text = text[4:]
    start, end = text.find("{"), text.rfind("}")
    if start == -1 or end == -1:
        raise ValueError("输出中未找到 JSON 对象")
    return json.loads(text[start : end + 1])


def _looks_like_trip(data: dict) -> bool:
    return isinstance(data, dict) and "itinerary" in data and "city" in data


def make_generator(settings: Settings) -> tuple[TripGenerator, str]:
    """按配置返回 (生成器, 引擎名)。引擎名与 GenerateResponse.engine 一致。"""
    engine = settings.resolve_engine()
    if engine == "deepseek":
        return (
            OpenAICompatClient(
                api_key=settings.deepseek_api_key,
                base_url=settings.deepseek_base_url,
                model=settings.deepseek_model,
                timeout=settings.request_timeout,
                engine_name="deepseek",
            ),
            "deepseek",
        )
    if engine == "glm":
        return (
            OpenAICompatClient(
                api_key=settings.glm_api_key,
                base_url=settings.glm_base_url,
                model=settings.glm_model,
                timeout=settings.request_timeout,
                engine_name="glm",
            ),
            "glm",
        )
    return _MockGenerator(), "mock"


class _MockGenerator:
    def generate(self, *, city: str, days: int, budget_total: float, people: int,
                 preferences: list[str], style: str, must_visit: list[str] | None = None,
                 date_start: str | None = None, budget_includes_hotel: bool = False) -> dict:
        from ..schemas.trip import TravelStyle

        trip = generate_mock_trip(
            city=city,
            days=days,
            budget_total=budget_total,
            people=people,
            preferences=preferences,
            style=TravelStyle(style),
            must_visit=must_visit,
            date_start=date_start,
            budget_includes_hotel=budget_includes_hotel,
        )
        return trip.model_dump(mode="json")
