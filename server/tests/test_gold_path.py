"""金标：杭州 3 天、1500 元、3 人、亲子+美食、style=all。"""

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)

GOLD = {
    "city": "杭州",
    "days": 3,
    "budget_total": 1500,
    "people": 3,
    "preferences": ["亲子", "美食"],
    "style": "all",
}

FORBIDDEN = ("mock", "Mock", "engine", "密钥", "API key", "api key")


def test_gold_path_returns_three_openable_plans(monkeypatch):
    monkeypatch.setenv("LLM_ENGINE", "mock")
    resp = client.post("/api/trip/generate", json=GOLD)
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["engine"] == "mock"
    assert len(body["plans"]) == 3
    assert {plan["style"] for plan in body["plans"]} == {"compact", "relaxed", "economy"}
    for warning in body["warnings"]:
        lowered = warning.lower()
        for word in FORBIDDEN:
            assert word not in warning and word.lower() not in lowered
        assert "style_rule" not in warning
    stops = {}
    tickets = {}
    stays = {}
    for plan in body["plans"]:
        assert plan["city"] == "杭州"
        assert plan["days"] == 3
        assert plan["people"] == 3
        assert plan["preferences"] == ["亲子", "美食"]
        assert plan["budget_includes_hotel"] is False
        assert plan["cost_breakdown"]["hotel"] == 0
        assert plan["metrics"]["stop_count"] == sum(len(day["items"]) for day in plan["itinerary"])
        assert plan["metrics"]["ticket_total"] == plan["cost_breakdown"]["tickets"]
        assert plan["route_rationale"]
        zones = [day["zone"] for day in plan["itinerary"]]
        assert zones == ["西湖", "灵隐", "湖滨吴山"]
        day1 = plan["itinerary"][0]
        assert day1["day"] == 1
        assert len(day1["items"]) >= 2
        assert day1["items"][0]["time_start"] < day1["items"][0]["time_end"]
        assert all("西溪" not in item["title"] for day in plan["itinerary"] for item in day["items"])
        assert all("大雁塔·大唐不夜城" not in item["title"] for day in plan["itinerary"] for item in day["items"])
        stops[plan["style"]] = plan["metrics"]["stop_count"]
        tickets[plan["style"]] = plan["cost_breakdown"]["tickets"]
        durations = [item["duration_min"] for day in plan["itinerary"] for item in day["items"]]
        stays[plan["style"]] = sum(durations) / len(durations)
        total = sum(plan["cost_breakdown"].values())
        drift = abs(total - 1500) / 1500
        if drift > 0.2:
            token = "over_budget" if total > 1500 else "under_budget"
            assert any(token in warning and f"[{plan['style']}]" in warning for warning in body["warnings"])
    assert stops["compact"] > stops["relaxed"]
    assert stops["compact"] > stops["economy"]
    assert stays["relaxed"] > stays["compact"]
    assert tickets["economy"] < tickets["relaxed"] < tickets["compact"]
    # 同一套点，换一个预算不会把明细改到预算附近。
    other = client.post("/api/trip/generate", json={**GOLD, "budget_total": 8000})
    assert other.status_code == 200
    for left, right in zip(body["plans"], other.json()["plans"]):
        assert left["cost_breakdown"] == right["cost_breakdown"]
        assert abs(sum(left["cost_breakdown"].values()) - 0.95 * 1500) > 1
