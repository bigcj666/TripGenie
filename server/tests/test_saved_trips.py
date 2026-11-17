"""只读分享：保存行程后再按 id 取回。"""

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)

TRIP = {
    "trip_id": "local-1",
    "city": "杭州",
    "days": 1,
    "people": 2,
    "budget_total": 200,
    "style": "relaxed",
    "preferences": [],
    "summary": "一天。",
    "itinerary": [
        {
            "day": 1,
            "zone": "西湖",
            "theme": "湖滨",
            "items": [
                {
                    "time_start": "09:00",
                    "time_end": "10:00",
                    "type": "attraction",
                    "title": "断桥残雪",
                    "poi": {"name": "断桥残雪", "lat": 30.25, "lng": 120.15, "adcode": ""},
                    "duration_min": 60,
                    "cost_estimate": 0,
                },
                {
                    "time_start": "10:20",
                    "time_end": "11:20",
                    "type": "attraction",
                    "title": "孤山公园",
                    "poi": {"name": "孤山公园", "lat": 30.25, "lng": 120.14, "adcode": ""},
                    "duration_min": 60,
                    "cost_estimate": 0,
                },
            ],
        }
    ],
    "cost_breakdown": {"transport": 0, "food": 0, "tickets": 0, "hotel": 0, "other": 0},
}


def test_save_and_read_trip(tmp_path, monkeypatch):
    monkeypatch.setenv("TRIPS_DB", str(tmp_path / "trips.sqlite"))
    created = client.post("/api/trips", json=TRIP)
    assert created.status_code == 201, created.text
    trip_id = created.json()["id"]
    read = client.get(f"/api/trips/{trip_id}")
    assert read.status_code == 200
    assert read.json()["city"] == "杭州"
    assert read.json()["itinerary"][0]["zone"] == "西湖"
    assert client.get("/api/trips/missing").status_code == 404


def test_odd_share_id_is_not_found(tmp_path, monkeypatch):
    monkeypatch.setenv("TRIPS_DB", str(tmp_path / "trips.sqlite"))
    assert client.get("/api/trips/not-a-real-id").status_code == 404
    assert client.get("/api/trips/../../etc").status_code == 404


def test_empty_trip_rejected(tmp_path, monkeypatch):
    monkeypatch.setenv("TRIPS_DB", str(tmp_path / "trips.sqlite"))
    resp = client.post("/api/trips", json={"city": "杭州"})
    assert resp.status_code == 400
