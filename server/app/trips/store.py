"""只存一份行程 JSON，无账号。TRIPS_DB 可改路径。"""

from __future__ import annotations

import json
import os
import secrets
import sqlite3
import threading
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

_LOCK = threading.Lock()


def db_path() -> Path:
    override = os.environ.get("TRIPS_DB")
    if override:
        return Path(override)
    return Path(__file__).resolve().parents[2] / "data" / "trips.sqlite"


def save_trip(trip: dict[str, Any]) -> str:
    _check(trip)
    trip_id = secrets.token_hex(8)
    payload = json.dumps(trip, ensure_ascii=False)
    if len(payload) > 200_000:
        raise ValueError("这套行程太长，存不下")
    with _LOCK:
        conn = _connect()
        try:
            conn.execute(
                "INSERT INTO trips (id, payload, created_at) VALUES (?, ?, ?)",
                (trip_id, payload, datetime.now(timezone.utc).isoformat(timespec="seconds")),
            )
            conn.commit()
        finally:
            conn.close()
    return trip_id


def get_trip(trip_id: str) -> dict[str, Any] | None:
    with _LOCK:
        conn = _connect()
        try:
            row = conn.execute("SELECT payload FROM trips WHERE id = ?", (trip_id,)).fetchone()
        finally:
            conn.close()
    if row is None:
        return None
    data = json.loads(row["payload"])
    return data if isinstance(data, dict) else None


def _connect() -> sqlite3.Connection:
    path = db_path()
    path.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(path)
    conn.row_factory = sqlite3.Row
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS trips (
            id TEXT PRIMARY KEY,
            payload TEXT NOT NULL,
            created_at TEXT NOT NULL
        )
        """
    )
    return conn


def _check(trip: Any) -> None:
    if not isinstance(trip, dict):
        raise ValueError("行程内容不对")
    city = str(trip.get("city") or "").strip()
    if not city:
        raise ValueError("城市不对")
    itinerary = trip.get("itinerary")
    if not isinstance(itinerary, list) or not itinerary:
        raise ValueError("这套行程是空的")
    for day in itinerary:
        if not isinstance(day, dict) or not isinstance(day.get("items"), list) or not day["items"]:
            raise ValueError("某一天是空的")
