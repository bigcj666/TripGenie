"""读取内容包里的分城 JSON。字段名保持目录原样。"""

from __future__ import annotations

import json
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path

_DIR = Path(__file__).resolve().parent

# 短名只用于必去匹配，不改目录里的 id / name。
ALIASES = {
    "西溪": "xixi",
    "灵隐": "lingyin",
    "熊猫基地": "panda",
    "大熊猫基地": "panda",
    "兵马俑": "terracotta",
    "陕历博": "museum",
    "不夜城": "buyecheng",
    "大唐不夜城": "buyecheng",
}

GENERIC_HOTEL_RATE = 280


@dataclass(frozen=True)
class Source:
    title: str
    url: str


@dataclass(frozen=True)
class ZoneInfo:
    id: str
    name: str
    suburban: bool
    note: str = ""


@dataclass(frozen=True)
class Place:
    id: str
    city: str
    name: str
    type: str
    zone: str
    suburban: bool
    lat: float
    lng: float
    tags: tuple[str, ...]
    duration_min: int
    ticket_price: float
    price: float | None
    price_status: str
    closed_weekdays: tuple[int, ...]
    hours_note: str
    blurb: str
    description: str
    tips: str
    image: str
    sources: tuple[Source, ...]
    fact_status: str
    existing: bool = False

    def has_tag(self, tag: str) -> bool:
        return tag in self.tags


@dataclass(frozen=True)
class CityCatalog:
    city: str
    slug: str
    zones: tuple[ZoneInfo, ...]
    places: tuple[Place, ...]

    def by_id(self, place_id: str) -> Place | None:
        for place in self.places:
            if place.id == place_id:
                return place
        return None

    def zone(self, name: str) -> ZoneInfo | None:
        for item in self.zones:
            if item.name == name or item.id == name:
                return item
        return None

    def in_zone(self, name: str, kind: str | None = None) -> list[Place]:
        found = [place for place in self.places if place.zone == name]
        if kind:
            found = [place for place in found if place.type == kind]
        return found


def _source(raw: dict) -> Source | None:
    title = str(raw.get("title") or "").strip()
    url = str(raw.get("url") or "").strip()
    if not title or not url:
        return None
    return Source(title=title, url=url)


def _place(city: str, raw: dict) -> Place:
    if "zone" not in raw or "suburban" not in raw:
        raise ValueError(f"{city} / {raw.get('id')} 缺少 zone 或 suburban")
    price = raw.get("price")
    return Place(
        id=str(raw["id"]),
        city=city,
        name=str(raw["name"]),
        type=str(raw.get("type") or "attraction"),
        zone=str(raw["zone"]),
        suburban=bool(raw["suburban"]),
        lat=float(raw["lat"]),
        lng=float(raw["lng"]),
        tags=tuple(str(tag) for tag in raw.get("tags") or []),
        duration_min=int(raw.get("duration_min") or 60),
        ticket_price=float(raw.get("ticket_price") or 0),
        price=None if price is None else float(price),
        price_status=str(raw.get("price_status") or "estimate"),
        closed_weekdays=tuple(int(day) for day in raw.get("closed_weekdays") or []),
        hours_note=str(raw.get("hours_note") or ""),
        blurb=str(raw.get("blurb") or ""),
        description=str(raw.get("description") or raw.get("blurb") or ""),
        tips=str(raw.get("tips") or ""),
        image=str(raw.get("image") or ""),
        sources=tuple(item for item in (_source(src) for src in raw.get("sources") or []) if item),
        fact_status=str(raw.get("fact_status") or "sourced"),
        existing=bool(raw.get("existing") or False),
    )


def _read_json(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


@lru_cache(maxsize=1)
def load_catalogs() -> dict[str, CityCatalog]:
    catalogs: dict[str, CityCatalog] = {}
    for path in sorted(_DIR.glob("*.json")):
        if path.name == "itineraries.json":
            continue
        raw = _read_json(path)
        city = str(raw["city"])
        zones = tuple(
            ZoneInfo(
                id=str(item.get("id") or item["name"]),
                name=str(item["name"]),
                suburban=bool(item.get("suburban") or False),
                note=str(item.get("note") or ""),
            )
            for item in raw.get("zones") or []
        )
        places = tuple(_place(city, item) for item in raw.get("places") or [])
        catalogs[city] = CityCatalog(
            city=city,
            slug=str(raw.get("city_slug") or path.stem),
            zones=zones,
            places=places,
        )
    return catalogs


def load_city(city: str) -> CityCatalog | None:
    return load_catalogs().get(city)


@lru_cache(maxsize=1)
def load_itineraries() -> tuple[dict, ...]:
    path = _DIR / "itineraries.json"
    if not path.exists():
        return ()
    raw = json.loads(path.read_text(encoding="utf-8"))
    return tuple(raw)


def resolve_place(city: str, query: str) -> Place | None:
    """按 id、全名、短名或唯一包含关系找到目录点。找不到返回 None。"""
    catalog = load_city(city)
    if catalog is None:
        return None
    text = query.strip()
    if not text:
        return None
    alias = ALIASES.get(text)
    if alias:
        found = catalog.by_id(alias)
        if found:
            return found
    for place in catalog.places:
        if place.id == text or place.name == text:
            return place
    attractions = [place for place in catalog.places if place.type == "attraction" and text in place.name]
    if attractions:
        starts = [place for place in attractions if place.name.startswith(text)]
        return (starts or attractions)[0]
    others = [place for place in catalog.places if place.type != "hotel" and text in place.name]
    if len(others) == 1:
        return others[0]
    return others[0] if others else None


def generic_catalog(city: str) -> CityCatalog:
    """目录外城市：一组估算点，单独一片区，不冒充三城事实。"""
    nudge = (sum(ord(char) for char in city) % 40) * 0.01
    base_lat = 30.2 + nudge
    base_lng = 120.1 + (nudge / 2)
    specs = [
        ("square", f"{city}市中心广场", "attraction", ("人文", "网红打卡"), 80, 0),
        ("museum", f"{city}博物馆", "attraction", ("人文", "亲子"), 110, 0),
        ("park", f"{city}城市公园", "attraction", ("自然", "亲子"), 90, 0),
        ("street", f"{city}老街", "attraction", ("购物", "美食"), 90, 0),
        ("river", f"{city}江岸", "attraction", ("自然",), 70, 0),
        ("memorial", f"{city}纪念馆", "attraction", ("人文",), 80, 0),
        ("view", f"{city}观景台", "attraction", ("网红打卡", "自然"), 60, 0),
        ("night", f"{city}夜市", "attraction", ("美食", "购物"), 80, 0),
        ("diner", f"{city}家常馆", "restaurant", ("饭馆", "美食"), 60, 0),
    ]
    places: list[Place] = []
    for index, (suffix, name, kind, tags, stay, ticket) in enumerate(specs):
        places.append(
            Place(
                id=f"generic-{suffix}",
                city=city,
                name=name,
                type=kind,
                zone="市区",
                suburban=False,
                lat=round(base_lat + index * 0.008, 5),
                lng=round(base_lng + (index % 3) * 0.01, 5),
                tags=tags,
                duration_min=stay,
                ticket_price=ticket,
                price=50 if kind == "restaurant" else None,
                price_status="estimate",
                closed_weekdays=(),
                hours_note="",
                blurb=f"这是{city}的估算点位，坐标和费用出发前再核对。",
                description=f"这是{city}的估算点位，坐标和费用出发前再核对。",
                tips="出发前再核对开放时间和价格。",
                image="",
                sources=(),
                fact_status="estimated",
            )
        )
    return CityCatalog(
        city=city,
        slug="generic",
        zones=(ZoneInfo(id="downtown", name="市区", suburban=False, note="估算片区"),),
        places=tuple(places),
    )
