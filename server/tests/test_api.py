"""API 端到端测试：mock 引擎下全链路可用。"""

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health(monkeypatch):
    monkeypatch.setenv("LLM_ENGINE", "mock")
    resp = client.get("/health")
    assert resp.status_code == 200
    body = resp.json()
    assert body["status"] == "ok"
    assert body["engine"] == "mock"


def test_generate_all_styles(monkeypatch):
    monkeypatch.setenv("LLM_ENGINE", "mock")
    resp = client.post(
        "/api/trip/generate",
        json={
            "city": "杭州",
            "days": 3,
            "budget_total": 1500,
            "people": 3,
            "preferences": ["亲子", "美食"],
            "style": "all",
        },
    )
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["engine"] == "mock"
    assert len(body["plans"]) == 3
    styles = {p["style"] for p in body["plans"]}
    assert styles == {"compact", "relaxed", "economy"}
    for plan in body["plans"]:
        assert plan["city"] == "杭州"
        assert len(plan["itinerary"]) == 3
        assert "cost_breakdown" in plan


def test_generate_single_style(monkeypatch):
    monkeypatch.setenv("LLM_ENGINE", "mock")
    resp = client.post(
        "/api/trip/generate",
        json={"city": "成都", "days": 2, "budget_total": 900, "people": 2, "style": "economy"},
    )
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert len(body["plans"]) == 1
    assert body["plans"][0]["style"] == "economy"
    assert body["plans"][0]["days"] == 2


def test_invalid_request_rejected(monkeypatch):
    monkeypatch.setenv("LLM_ENGINE", "mock")
    resp = client.post(
        "/api/trip/generate",
        json={"city": "杭州", "days": 0, "budget_total": 100, "people": 1},
    )
    assert resp.status_code == 422
