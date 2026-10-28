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


_SCHEMA_HINT = """{
  "trip_id": "uuid字符串",
  "city": "城市名",
  "days": 3,
  "people": 3,
  "budget_total": 1500,
  "style": "compact|relaxed|economy",
  "preferences": ["亲子"],
  "summary": "一句话概述",
  "itinerary": [
    {
      "day": 1,
      "theme": "当日主题",
      "items": [
        {
          "time_start": "09:00", "time_end": "11:30",
          "type": "attraction|meal|transport|hotel|free",
          "title": "地点名",
          "poi": {"name": "地点名", "lat": 30.25, "lng": 120.15, "adcode": "330106"},
          "duration_min": 150,
          "cost_estimate": 0,
          "description": "介绍",
          "tips": "建议",
          "transport_to_next": {"mode": "walk|transit|drive|taxi", "duration_min": 15, "note": "说明"},
          "sources": [{"title": "来源名", "url": "https://..."}]
        }
      ]
    }
  ],
  "cost_breakdown": {"transport": 200, "food": 400, "tickets": 300, "hotel": 500, "other": 100}
}"""

_STYLE_DESC = {
    "compact": "紧凑高效：每天 5–6 个安排，节奏快，步行衔接多",
    "relaxed": "松弛休闲：每天 3–4 个安排，单点停留 ≥90 分钟，不赶场",
    "economy": "省钱优先：门票花费尽量低，优先免费景点与平价餐饮",
}


def build_prompt(*, city: str, days: int, budget_total: float, people: int,
                 preferences: list[str], style: str) -> list[dict]:
    user = (
        f"请为我生成一份旅游行程。\n"
        f"- 城市：{city}\n"
        f"- 天数：{days} 天\n"
        f"- 总预算：{budget_total} 元\n"
        f"- 人数：{people} 人\n"
        f"- 偏好标签：{', '.join(preferences) if preferences else '无特别偏好'}\n"
        f"- 风格：{style}（{_STYLE_DESC.get(style, style)}）\n\n"
        f"硬性要求：\n"
        f"1. itinerary 恰好 {days} 个元素，day 从 1 连续编号；\n"
        f"2. 每日 items 2–6 个，time_start < time_end，当日时段不得重叠；\n"
        f"3. poi 的 lat/lng 必须是真实地点的近似坐标；\n"
        f"4. cost_breakdown 各项之和与 budget_total 偏差不超过 20%；\n"
        f"5. 只输出一个 JSON 对象，不要任何解释文字、不要 markdown 代码块。\n\n"
        f"JSON 结构如下：\n{_SCHEMA_HINT}"
    )
    return [
        {"role": "system", "content": "你是旅游行程规划引擎，只输出合法 JSON 对象，字段与结构必须与用户给出的 schema 完全一致。"},
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

    def _chat(self, messages: list[dict], *, retry_with_repair: bool = False) -> str:
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
            content = resp.json()["choices"][0]["message"]["content"]
        if retry_with_repair:
            return content
        return content

    def generate(self, *, city: str, days: int, budget_total: float, people: int,
                 preferences: list[str], style: str) -> dict:
        messages = build_prompt(
            city=city, days=days, budget_total=budget_total,
            people=people, preferences=preferences, style=style,
        )
        raw = self._chat(messages)
        try:
            data = _extract_json(raw)
            if _looks_like_trip(data):
                return data
        except Exception:  # noqa: BLE001 —— 解析失败走修复重试
            data = None
        messages.append({"role": "assistant", "content": raw})
        messages.append({
            "role": "user",
            "content": "上面的输出不是合法的行程 JSON，请重新输出修正后的完整 JSON 对象（仅 JSON，无解释）。",
        })
        return _extract_json(self._chat(messages))


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
                 preferences: list[str], style: str) -> dict:
        from ..schemas.trip import TravelStyle

        trip = generate_mock_trip(
            city=city,
            days=days,
            budget_total=budget_total,
            people=people,
            preferences=preferences,
            style=TravelStyle(style),
        )
        return trip.model_dump(mode="json")
