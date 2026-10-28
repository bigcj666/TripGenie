"""降级路径与风格规则告警测试（S2.3 / S2.10）。"""

from fastapi.testclient import TestClient

from app.config import Settings
from app.llm.mock_engine import generate_mock_trip
from app.main import app
from app.schemas.trip import GenerateRequest, TravelStyle
from app.services.generate import _style_warnings, generate_trips

client = TestClient(app)


class _BrokenGenerator:
    def generate(self, **kwargs):
        raise ValueError("LLM 输出无法解析")


def test_llm_failure_falls_back_to_mock(monkeypatch):
    """真实引擎失败 → 降级 Mock，engine 标记为 mock 且 plans 合法。"""
    monkeypatch.setattr(
        "app.services.generate.make_generator",
        lambda settings: (_BrokenGenerator(), "deepseek"),
    )
    req = GenerateRequest(city="杭州", days=2, budget_total=1000, people=2, style="compact")
    resp = generate_trips(req, Settings(llm_engine="mock", deepseek_api_key="x", deepseek_base_url="",
                                       deepseek_model="m", glm_api_key="", glm_base_url="", glm_model="m",
                                       request_timeout=5))
    assert resp.engine == "mock"
    assert len(resp.plans) == 1
    assert any("降级 Mock" in w for w in resp.warnings)


def test_mixed_engine_any_mock_wins(monkeypatch):
    """多方案中只要有一个降级，整体 engine 必须是 mock。"""
    calls = {"n": 0}

    class _Flaky:
        def generate(self, **kwargs):
            calls["n"] += 1
            if calls["n"] == 1:
                raise ValueError("boom")
            from app.llm.mock_engine import generate_mock_trip as gm
            from app.schemas.trip import TravelStyle as TS
            return gm(city=kwargs["city"], days=kwargs["days"], budget_total=kwargs["budget_total"],
                      people=kwargs["people"], preferences=kwargs["preferences"],
                      style=TS(kwargs["style"])).model_dump(mode="json")

    monkeypatch.setattr("app.services.generate.make_generator", lambda s: (_Flaky(), "deepseek"))
    req = GenerateRequest(city="杭州", days=2, budget_total=1000, people=2, style="all")
    resp = generate_trips(req, Settings(llm_engine="mock", deepseek_api_key="x", deepseek_base_url="",
                                       deepseek_model="m", glm_api_key="", glm_base_url="", glm_model="m",
                                       request_timeout=5))
    assert resp.engine == "mock"
    assert len(resp.plans) == 3


def test_mock_cost_tracks_budget():
    """mock 成本应随预算缩放：偏差 ≤20%（否则触发 over_budget 告警）。"""
    for budget, people in [(1500, 3), (800, 2), (5000, 4)]:
        trip = generate_mock_trip("杭州", 3, budget, people, ["亲子"], TravelStyle.COMPACT)
        drift = abs(trip.cost_breakdown.total - budget) / budget
        assert drift <= 0.2, f"budget={budget} drift={drift:.0%}"


def test_mock_preferences_reflected():
    """偏好标签应出现在行程文本中（否则偏好命中告警）。"""
    trip = generate_mock_trip("杭州", 3, 1500, 3, ["美食", "亲子"], TravelStyle.COMPACT)
    text = " ".join(f"{it.title} {it.description} {it.tips}" for d in trip.itinerary for it in d.items)
    assert "美食" in text or any(it.type == "meal" for d in trip.itinerary for it in d.items)


def test_style_warnings_rules():
    """风格规则服务层校验：不合规出告警，mock 输出本身应合规。"""
    relaxed = generate_mock_trip("杭州", 2, 1200, 2, [], TravelStyle.RELAXED)
    assert all(it.duration_min >= 90 for d in relaxed.itinerary for it in d.items)
    assert all(len(d.items) <= 4 for d in relaxed.itinerary)
    assert not [w for w in _style_warnings(relaxed) if "relaxed" in w]

    compact = generate_mock_trip("杭州", 2, 1200, 2, [], TravelStyle.COMPACT)
    assert all(len(d.items) >= 5 for d in compact.itinerary)
    assert not [w for w in _style_warnings(compact) if "compact" in w]


def test_over_budget_token(monkeypatch):
    """预算超差 20% 时必须出现 over_budget 标记词。"""
    monkeypatch.setenv("LLM_ENGINE", "mock")

    class _OverBudget:
        def generate(self, **kwargs):
            trip = generate_mock_trip(city=kwargs["city"], days=kwargs["days"],
                                     budget_total=kwargs["budget_total"], people=kwargs["people"],
                                     preferences=kwargs["preferences"], style=TravelStyle(kwargs["style"]))
            data = trip.model_dump(mode="json")
            data["cost_breakdown"] = {"transport": 9000, "food": 1, "tickets": 1, "hotel": 1, "other": 1}
            return data

    monkeypatch.setattr("app.services.generate.make_generator", lambda s: (_OverBudget(), "deepseek"))
    req = GenerateRequest(city="杭州", days=1, budget_total=100, people=1, style="compact")
    resp = generate_trips(req, Settings(llm_engine="mock", deepseek_api_key="x", deepseek_base_url="",
                                       deepseek_model="m", glm_api_key="", glm_base_url="", glm_model="m",
                                       request_timeout=5))
    assert any("over_budget" in w for w in resp.warnings)


def test_api_returns_warnings_field(monkeypatch):
    monkeypatch.setenv("LLM_ENGINE", "mock")
    resp = client.post("/api/trip/generate", json={"city": "杭州", "days": 2, "budget_total": 1000,
                                                   "people": 2, "style": "all"})
    assert resp.status_code == 200
    body = resp.json()
    assert "warnings" in body
    assert body["engine"] == "mock"
