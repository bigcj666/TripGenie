"""社区攻略：本地 SQLite，无账号。COMMUNITY_DB 可改路径，测试用它避开示例数据。"""

from __future__ import annotations

import base64
import json
import os
import re
import secrets
import sqlite3
import threading
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

_LOCK = threading.Lock()
_STYLES = {"compact", "relaxed", "economy"}
_MEDIA_NAME = re.compile(r"^[0-9a-f]{16}\.(jpg|png|webp)$")


def db_path() -> Path:
    override = os.environ.get("COMMUNITY_DB")
    if override:
        return Path(override)
    return Path(__file__).resolve().parents[2] / "data" / "community.sqlite"


def list_posts(city: str | None = None) -> list[dict[str, Any]]:
    with _LOCK:
        conn = _connect()
        try:
            sql = """
                SELECT p.id, p.author, p.note, p.city, p.days, p.people, p.style, p.summary, p.created_at,
                       p.photos, p.payload,
                       (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) AS comment_count
                FROM posts p
            """
            args: list[str] = []
            if city:
                sql += " WHERE p.city = ?"
                args.append(city)
            sql += " ORDER BY p.created_at DESC LIMIT 50"
            return [_public(row) for row in conn.execute(sql, args)]
        finally:
            conn.close()


def get_post(post_id: str) -> dict[str, Any] | None:
    with _LOCK:
        conn = _connect()
        try:
            row = conn.execute("SELECT * FROM posts WHERE id = ?", (post_id,)).fetchone()
            if row is None:
                return None
            comments = conn.execute(
                "SELECT id, author, body, created_at FROM comments WHERE post_id = ? ORDER BY created_at ASC",
                (post_id,),
            ).fetchall()
            data = _public(row)
            data["trip"] = _trip_or_none(row["payload"])
            data["comments"] = [dict(item) for item in comments]
            data["comment_count"] = len(data["comments"])
            return data
        finally:
            conn.close()


def publish(
    author: str,
    note: str,
    trip: dict[str, Any] | None = None,
    photos: list[str] | None = None,
    city: str = "",
) -> dict[str, Any]:
    author = _name(author)
    note = _clip(note, 400)
    photo_urls = _store_photos(photos or [])
    if trip:
        city, days, people, style, summary = _check_trip(trip)
        payload = json.dumps(trip, ensure_ascii=False)
        if len(payload) > 200_000:
            raise ValueError("这套攻略太长，发不出去")
    else:
        if not note and not photo_urls:
            raise ValueError("写一点内容再发布")
        city = _clip(city, 20)
        days, people, style, summary = 0, 0, "", ""
        payload = "{}"
    post_id = secrets.token_hex(8)
    token = secrets.token_urlsafe(18)
    created = _now()
    with _LOCK:
        conn = _connect()
        try:
            conn.execute(
                """
                INSERT INTO posts (id, author, note, city, days, people, style, summary, payload, photos, token, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (post_id, author, note, city, days, people, style, summary, payload, json.dumps(photo_urls, ensure_ascii=False), token, created),
            )
            conn.commit()
        finally:
            conn.close()
    return {
        "id": post_id,
        "token": token,
        "post": {
            "id": post_id,
            "author": author,
            "note": note,
            "city": city,
            "days": days,
            "people": people,
            "style": style,
            "summary": summary,
            "created_at": created,
            "comment_count": 0,
            "photos": photo_urls,
            "highlights": _highlights(payload),
            "has_trip": bool(trip),
        },
    }


def add_comment(post_id: str, author: str, body: str) -> dict[str, Any]:
    text = body.strip()
    if not text:
        raise ValueError("留言是空的")
    if len(text) > 200:
        raise ValueError("留言最多 200 字")
    created = _now()
    comment = {"id": secrets.token_hex(8), "author": _name(author), "body": text, "created_at": created}
    with _LOCK:
        conn = _connect()
        try:
            found = conn.execute("SELECT 1 FROM posts WHERE id = ?", (post_id,)).fetchone()
            if found is None:
                raise KeyError(post_id)
            count = conn.execute("SELECT COUNT(*) AS n FROM comments WHERE post_id = ?", (post_id,)).fetchone()["n"]
            if count >= 100:
                raise ValueError("这条攻略留言已经很多了")
            conn.execute(
                "INSERT INTO comments (id, post_id, author, body, created_at) VALUES (?, ?, ?, ?, ?)",
                (comment["id"], post_id, comment["author"], comment["body"], comment["created_at"]),
            )
            conn.commit()
        finally:
            conn.close()
    return comment


def remove_post(post_id: str, token: str) -> bool:
    with _LOCK:
        conn = _connect()
        try:
            row = conn.execute("SELECT token, photos FROM posts WHERE id = ?", (post_id,)).fetchone()
            if row is None:
                return False
            if not token or not secrets.compare_digest(row["token"], token):
                raise PermissionError
            conn.execute("DELETE FROM comments WHERE post_id = ?", (post_id,))
            conn.execute("DELETE FROM posts WHERE id = ?", (post_id,))
            _delete_media(row["photos"] if "photos" in row.keys() else "[]")
            conn.commit()
            return True
        finally:
            conn.close()


def _connect() -> sqlite3.Connection:
    path = db_path()
    path.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(path)
    conn.row_factory = sqlite3.Row
    conn.executescript(
        """
        CREATE TABLE IF NOT EXISTS posts (
            id TEXT PRIMARY KEY,
            author TEXT NOT NULL,
            note TEXT NOT NULL,
            city TEXT NOT NULL,
            days INTEGER NOT NULL,
            people INTEGER NOT NULL,
            style TEXT NOT NULL,
            summary TEXT NOT NULL,
            payload TEXT NOT NULL,
            token TEXT NOT NULL,
            photos TEXT NOT NULL DEFAULT '[]',
            created_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS comments (
            id TEXT PRIMARY KEY,
            post_id TEXT NOT NULL,
            author TEXT NOT NULL,
            body TEXT NOT NULL,
            created_at TEXT NOT NULL
        );
        """
    )
    columns = {item["name"] for item in conn.execute("PRAGMA table_info(posts)")}
    if "photos" not in columns:
        conn.execute("ALTER TABLE posts ADD COLUMN photos TEXT NOT NULL DEFAULT '[]'")
    if not os.environ.get("COMMUNITY_DB"):
        _seed(conn)
    return conn


def _seed(conn: sqlite3.Connection) -> None:
    have = {row["id"] for row in conn.execute("SELECT id FROM posts WHERE id LIKE 'seed-%'")}
    changed = False
    for post in _SAMPLES:
        if post["id"] in have:
            continue
        conn.execute(
            """
                INSERT INTO posts (id, author, note, city, days, people, style, summary, payload, photos, token, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
            (
                post["id"],
                post["author"],
                post["note"],
                post["trip"]["city"],
                post["trip"]["days"],
                post["trip"]["people"],
                post["trip"]["style"],
                post["trip"]["summary"],
                json.dumps(post["trip"], ensure_ascii=False),
                json.dumps(post.get("photos") or [], ensure_ascii=False),
                secrets.token_urlsafe(18),
                post["created_at"],
            ),
        )
        changed = True
    for comment in _SAMPLE_COMMENTS:
        if comment["post_id"] not in {post["id"] for post in _SAMPLES}:
            continue
        exists = conn.execute("SELECT 1 FROM comments WHERE id = ?", (comment["id"],)).fetchone()
        if exists:
            continue
        conn.execute(
            "INSERT INTO comments (id, post_id, author, body, created_at) VALUES (?, ?, ?, ?, ?)",
            (comment["id"], comment["post_id"], comment["author"], comment["body"], comment["created_at"]),
        )
        changed = True
    for post in _SAMPLES:
        photos = json.dumps(post.get("photos") or [], ensure_ascii=False)
        current = conn.execute("SELECT photos FROM posts WHERE id = ?", (post["id"],)).fetchone()
        if current is not None and (current["photos"] or "[]") in ("", "[]") and post.get("photos"):
            conn.execute("UPDATE posts SET photos = ? WHERE id = ?", (photos, post["id"]))
            changed = True
    if changed:
        conn.commit()


def _public(row: sqlite3.Row) -> dict[str, Any]:
    payload = row["payload"] if "payload" in row.keys() else "{}"
    photos = _photo_list(row["photos"] if "photos" in row.keys() else "[]")
    return {
        "id": row["id"],
        "author": row["author"],
        "note": row["note"],
        "city": row["city"],
        "days": row["days"],
        "people": row["people"],
        "style": row["style"],
        "summary": row["summary"],
        "created_at": row["created_at"],
        "comment_count": row["comment_count"] if "comment_count" in row.keys() else 0,
        "photos": photos,
        "highlights": _highlights(payload),
        "has_trip": _trip_or_none(payload) is not None,
    }


def media_path(name: str) -> Path | None:
    if not _MEDIA_NAME.fullmatch(name):
        return None
    return db_path().parent / "community-media" / name


def _photo_list(raw: str | None) -> list[str]:
    try:
        data = json.loads(raw or "[]")
    except json.JSONDecodeError:
        return []
    if not isinstance(data, list):
        return []
    return [item for item in data if isinstance(item, str) and item.startswith("/")]


def _trip_or_none(raw: str | None) -> dict[str, Any] | None:
    try:
        data = json.loads(raw or "{}")
    except json.JSONDecodeError:
        return None
    if not isinstance(data, dict) or not data.get("itinerary"):
        return None
    return data


def _highlights(raw: str | None) -> list[str]:
    trip = _trip_or_none(raw)
    if trip is None:
        return []
    names: list[str] = []
    for day in trip.get("itinerary") or []:
        if not isinstance(day, dict):
            continue
        for item in day.get("items") or []:
            if not isinstance(item, dict) or item.get("type") == "hotel":
                continue
            title = str(item.get("title") or "").strip()
            if title and title not in names:
                names.append(title)
            if len(names) >= 2:
                return names
    return names


def _store_photos(raws: list[str]) -> list[str]:
    if len(raws) > 6:
        raise ValueError("最多 6 张照片")
    folder = db_path().parent / "community-media"
    saved: list[str] = []
    for raw in raws:
        if not isinstance(raw, str):
            raise ValueError("照片格式不对")
        if raw.startswith("/places/") or raw.startswith("/api/community/media/"):
            saved.append(raw)
            continue
        if not raw.startswith("data:image/"):
            raise ValueError("照片格式不对")
        header, _, encoded = raw.partition(",")
        if "png" in header:
            ext = "png"
        elif "webp" in header:
            ext = "webp"
        elif "jpeg" in header or "jpg" in header:
            ext = "jpg"
        else:
            raise ValueError("只支持常见图片")
        try:
            blob = base64.b64decode(encoded, validate=False)
        except Exception as exc:  # noqa: BLE001
            raise ValueError("照片格式不对") from exc
        if not blob or len(blob) > 1_200_000:
            raise ValueError("有一张照片太大了")
        folder.mkdir(parents=True, exist_ok=True)
        name = f"{secrets.token_hex(8)}.{ext}"
        (folder / name).write_bytes(blob)
        saved.append(f"/api/community/media/{name}")
    return saved


def _delete_media(raw: str) -> None:
    for url in _photo_list(raw):
        prefix = "/api/community/media/"
        if not url.startswith(prefix):
            continue
        path = media_path(url[len(prefix) :])
        if path is not None and path.is_file():
            path.unlink()


def _check_trip(trip: Any) -> tuple[str, int, int, str, str]:
    if not isinstance(trip, dict):
        raise ValueError("攻略内容不对")
    city = str(trip.get("city") or "").strip()
    if not city or len(city) > 20:
        raise ValueError("城市不对")
    itinerary = trip.get("itinerary")
    days = trip.get("days")
    people = trip.get("people")
    style = trip.get("style")
    if not isinstance(itinerary, list) or not itinerary:
        raise ValueError("这套攻略是空的")
    if isinstance(days, float) and days.is_integer():
        days = int(days)
    if isinstance(people, float) and people.is_integer():
        people = int(people)
    if not isinstance(days, int) or days != len(itinerary) or not 1 <= days <= 7:
        raise ValueError("天数不对")
    if not isinstance(people, int) or not 1 <= people <= 20:
        raise ValueError("人数不对")
    if style not in _STYLES:
        raise ValueError("风格不对")
    for day in itinerary:
        if not isinstance(day, dict) or not isinstance(day.get("items"), list) or not day["items"]:
            raise ValueError("某一天是空的")
        for item in day["items"]:
            if not isinstance(item, dict) or not str(item.get("title") or "").strip():
                raise ValueError("行程里有一项没有名称")
    summary = _clip(str(trip.get("summary") or ""), 80)
    return city, days, people, style, summary


def _name(value: str) -> str:
    text = " ".join(value.split()).strip()
    return text[:12] or "旅行者"


def _clip(value: str, limit: int) -> str:
    return " ".join(value.split()).strip()[:limit]


def _now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def _item(start: str, end: str, kind: str, title: str, lat: float, lng: float, cost: float, description: str) -> dict[str, Any]:
    sh, sm = (int(part) for part in start.split(":"))
    eh, em = (int(part) for part in end.split(":"))
    return {
        "time_start": start,
        "time_end": end,
        "type": kind,
        "title": title,
        "poi": {"name": title, "lat": lat, "lng": lng, "adcode": ""},
        "duration_min": (eh * 60 + em) - (sh * 60 + sm),
        "cost_estimate": cost,
        "description": description,
        "tips": "",
        "transport_to_next": None,
        "sources": [],
    }


def _day(day: int, theme: str, items: list[dict[str, Any]]) -> dict[str, Any]:
    return {"day": day, "theme": theme, "items": items}


def _trip(
    city: str,
    people: int,
    style: str,
    summary: str,
    days: list[dict[str, Any]],
    costs: dict[str, float],
    budget: float,
) -> dict[str, Any]:
    return {
        "trip_id": f"seed-{city}",
        "city": city,
        "days": len(days),
        "people": people,
        "budget_total": budget,
        "style": style,
        "preferences": ["分享"],
        "summary": summary,
        "itinerary": days,
        "cost_breakdown": costs,
    }


_SAMPLES: list[dict[str, Any]] = [
    {
        "id": "seed-hangzhou",
        "author": "阿宁",
        "note": "下雨就改走灵隐，中午知味观，晚上住湖滨。",
        "photos": ["/places/lingyin.jpg", "/places/westlake.jpg"],
        "created_at": "2026-10-28T02:10:00+00:00",
        "trip": _trip(
            "杭州",
            2,
            "relaxed",
            "杭州两天。第一天看室内，第二天沿西湖走走。",
            [
                _day(
                    1,
                    "雨天改室内",
                    [
                        _item("09:00", "11:30", "attraction", "灵隐寺", 30.241, 120.101, 45, "飞来峰造像，下雨也能逛。"),
                        _item("12:00", "13:10", "meal", "知味观", 30.2565, 120.1705, 70, "午餐。片儿川和小笼。"),
                        _item("21:00", "22:00", "hotel", "全季酒店（湖滨店）", 30.2556, 120.1612, 420, "当晚住湖滨，第二天走路去西湖。"),
                    ],
                ),
                _day(
                    2,
                    "沿湖",
                    [
                        _item("09:30", "11:20", "attraction", "断桥残雪", 30.2593, 120.1477, 0, "白堤东端，早上人少一些。"),
                        _item("12:00", "13:20", "meal", "楼外楼", 30.2533, 120.1428, 90, "午餐。西湖醋鱼、东坡肉。"),
                    ],
                ),
            ],
            {"transport": 40, "food": 320, "tickets": 90, "hotel": 420, "other": 0},
            870,
        ),
    },
    {
        "id": "seed-chengdu",
        "author": "老周",
        "note": "不想跑远，武侯祠、麻婆豆腐、宽窄巷子一天走完。",
        "photos": ["/places/wuhou.jpg", "/places/jinli.jpg"],
        "created_at": "2026-10-29T06:20:00+00:00",
        "trip": _trip(
            "成都",
            1,
            "economy",
            "成都市区一天，不住宿。",
            [
                _day(
                    1,
                    "市区",
                    [
                        _item("09:00", "11:00", "attraction", "武侯祠", 30.646, 104.047, 50, "和锦里连在一起。"),
                        _item("12:00", "13:10", "meal", "陈麻婆豆腐", 30.6715, 104.0722, 55, "午餐。总店在西玉龙街。"),
                        _item("14:30", "16:40", "attraction", "宽窄巷子", 30.672, 104.055, 0, "下午慢慢逛三条巷子。"),
                    ],
                )
            ],
            {"transport": 16, "food": 55, "tickets": 50, "hotel": 0, "other": 0},
            121,
        ),
    },
    {
        "id": "seed-xian",
        "author": "小满",
        "note": "钟楼附近吃住，兵马俑单独留一个上午。",
        "photos": ["/places/bell.jpg", "/places/terracotta.jpg"],
        "created_at": "2026-10-30T09:00:00+00:00",
        "trip": _trip(
            "西安",
            2,
            "compact",
            "西安两天，市区和兵马俑分开。",
            [
                _day(
                    1,
                    "钟楼附近",
                    [
                        _item("09:00", "10:20", "attraction", "钟楼", 34.261, 108.942, 30, "城中心，看四条大街交汇。"),
                        _item("12:00", "13:10", "meal", "同盛祥", 34.2634, 108.9432, 50, "午餐。羊肉泡馍。"),
                        _item("21:00", "22:00", "hotel", "全季酒店（南大街店）", 34.2598, 108.9472, 360, "当晚住钟楼南边。"),
                    ],
                ),
                _day(
                    2,
                    "兵马俑",
                    [
                        _item("08:30", "12:00", "attraction", "兵马俑", 34.384, 109.278, 120, "离市区远，一上午就给它。"),
                        _item("14:30", "16:20", "meal", "回民街", 34.262, 108.937, 40, "下午回来吃肉夹馍。"),
                    ],
                ),
            ],
            {"transport": 80, "food": 180, "tickets": 300, "hotel": 360, "other": 0},
            920,
        ),
    },
]

_SAMPLE_COMMENTS: list[dict[str, str]] = [
    {
        "id": "seed-hangzhou-c1",
        "post_id": "seed-hangzhou",
        "author": "小林",
        "body": "灵隐雨天人多吗？",
        "created_at": "2026-10-28T08:12:00+00:00",
    },
    {
        "id": "seed-hangzhou-c2",
        "post_id": "seed-hangzhou",
        "author": "阿宁",
        "body": "工作日上午还行，记得带伞。",
        "created_at": "2026-10-28T09:02:00+00:00",
    },
    {
        "id": "seed-chengdu-c1",
        "post_id": "seed-chengdu",
        "author": "阿宁",
        "body": "宽窄巷子下午去会不会很挤？",
        "created_at": "2026-10-29T11:16:00+00:00",
    },
    {
        "id": "seed-xian-c1",
        "post_id": "seed-xian",
        "author": "老周",
        "body": "兵马俑看完再回回民街，下午赶得及吗？",
        "created_at": "2026-10-30T12:40:00+00:00",
    },
]
