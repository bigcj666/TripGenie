"""社区分享：发布、留言、撤回。"""

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)

TRIP = {
    "trip_id": "t1",
    "city": "杭州",
    "days": 1,
    "people": 2,
    "budget_total": 200,
    "style": "relaxed",
    "preferences": ["自定义"],
    "summary": "一天，住湖滨。",
    "itinerary": [
        {
            "day": 1,
            "theme": "湖滨",
            "items": [
                {
                    "time_start": "12:00",
                    "time_end": "13:10",
                    "type": "meal",
                    "title": "知味观",
                    "poi": {"name": "知味观", "lat": 30.25, "lng": 120.17, "adcode": ""},
                    "duration_min": 70,
                    "cost_estimate": 70,
                    "description": "午餐",
                    "tips": "",
                    "transport_to_next": None,
                    "sources": [],
                },
                {
                    "time_start": "21:00",
                    "time_end": "次日",
                    "type": "hotel",
                    "title": "全季酒店（湖滨店）",
                    "poi": {"name": "全季酒店（湖滨店）", "lat": 30.25, "lng": 120.16, "adcode": ""},
                    "duration_min": 60,
                    "cost_estimate": 420,
                    "description": "当晚入住",
                    "tips": "",
                    "transport_to_next": None,
                    "sources": [],
                },
            ],
        }
    ],
    "cost_breakdown": {"transport": 0, "food": 140, "tickets": 0, "hotel": 420, "other": 0},
}


def test_publish_comment_and_remove(tmp_path, monkeypatch):
    monkeypatch.setenv("COMMUNITY_DB", str(tmp_path / "community.sqlite"))
    assert client.get("/api/community").json()["posts"] == []

    created = client.post("/api/community", json={"author": "小林", "note": "两人一天", "trip": TRIP})
    assert created.status_code == 201, created.text
    body = created.json()
    post_id = body["id"]
    token = body["token"]
    assert body["post"]["city"] == "杭州"
    assert "token" not in body["post"]

    listed = client.get("/api/community", params={"city": "杭州"}).json()["posts"]
    assert len(listed) == 1
    assert listed[0]["note"] == "两人一天"
    assert client.get("/api/community", params={"city": "成都"}).json()["posts"] == []

    talked = client.post(f"/api/community/{post_id}/comments", json={"author": "阿宁", "body": "湖滨晚上安静吗？"})
    assert talked.status_code == 201, talked.text

    detail = client.get(f"/api/community/{post_id}").json()
    assert detail["trip"]["itinerary"][0]["items"][1]["time_end"] == "次日"
    assert detail["comments"][0]["body"] == "湖滨晚上安静吗？"
    assert detail["comment_count"] == 1

    denied = client.post(f"/api/community/{post_id}/remove", json={"token": "nope"})
    assert denied.status_code == 403
    removed = client.post(f"/api/community/{post_id}/remove", json={"token": token})
    assert removed.status_code == 200
    assert client.get(f"/api/community/{post_id}").status_code == 404


def test_review_with_photo_and_without_trip(tmp_path, monkeypatch):
    monkeypatch.setenv("COMMUNITY_DB", str(tmp_path / "community.sqlite"))
    png = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="
    created = client.post("/api/community", json={"author": "阿宁", "note": "湖边风很大，适合慢慢走。", "photos": [png], "city": "杭州"})
    assert created.status_code == 201, created.text
    body = created.json()
    assert body["post"]["has_trip"] is False
    assert body["post"]["photos"][0].startswith("/api/community/media/")
    listed = client.get("/api/community", params={"city": "杭州"}).json()["posts"]
    assert listed[0]["note"].startswith("湖边风很大")
    photo = client.get(body["post"]["photos"][0])
    assert photo.status_code == 200
    assert photo.headers["content-type"].startswith("image/")
    detail = client.get(f"/api/community/{body['id']}").json()
    assert detail["trip"] is None


def test_empty_plan_rejected(tmp_path, monkeypatch):
    monkeypatch.setenv("COMMUNITY_DB", str(tmp_path / "community.sqlite"))
    resp = client.post("/api/community", json={"author": "小林", "trip": {"city": "杭州"}})
    assert resp.status_code == 400
    missing = client.post("/api/community/missing/comments", json={"body": "在吗"})
    assert missing.status_code == 404
