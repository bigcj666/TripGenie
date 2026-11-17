"""内容包目录：字段原样可读，关键事实没有退回旧票价。"""

from pathlib import Path

from app.data.catalog import load_catalogs, load_city

ROOT = Path(__file__).resolve().parents[2]

# 原 places.ts / Mock 里的坐标。内容包要求已有点坐标不变。
ORIGINAL_COORDS = {
    "duanqiao": (30.2593, 120.1477),
    "gushan": (30.254, 120.144),
    "louwailou": (30.2533, 120.1428),
    "cruise": (30.2489, 120.154),
    "leifeng": (30.232, 120.149),
    "hefang": (30.2405, 120.169),
    "lingyin": (30.241, 120.101),
    "xixi": (30.268, 120.07),
    "wulin": (30.279, 120.162),
    "gongchen": (30.32, 120.142),
    "wuhou": (30.646, 104.047),
    "jinli": (30.645, 104.045),
    "dufu": (30.665, 104.023),
    "kuanzhai": (30.672, 104.055),
    "panda": (30.735, 104.147),
    "chunxi": (30.652, 104.076),
    "bell": (34.261, 108.942),
    "muslim": (34.262, 108.937),
    "terracotta": (34.384, 109.278),
    "tang": (34.218, 108.964),
    "wall": (34.254, 108.946),
    "museum": (34.223, 108.958),
}


def test_three_cities_keep_zone_and_suburban():
    catalogs = load_catalogs()
    assert set(catalogs) == {"杭州", "成都", "西安"}
    for catalog in catalogs.values():
        assert len(catalog.zones) >= 3
        assert len([place for place in catalog.places if place.type == "attraction"]) >= 10
        free = [place for place in catalog.places if place.type == "attraction" and place.ticket_price == 0]
        assert len(free) >= 4
        for place in catalog.places:
            assert place.zone
            assert isinstance(place.suburban, bool)
            zone = catalog.zone(place.zone)
            assert zone is not None
            assert zone.suburban is place.suburban


def test_original_coordinates_unchanged():
    for catalog in load_catalogs().values():
        for place in catalog.places:
            if place.id not in ORIGINAL_COORDS:
                continue
            lat, lng = ORIGINAL_COORDS[place.id]
            assert place.lat == lat
            assert place.lng == lng


def test_content_rules_for_prices_and_closures():
    hangzhou = load_city("杭州")
    xian = load_city("西安")
    chengdu = load_city("成都")
    lingyin = hangzhou.by_id("lingyin")
    feilai = hangzhou.by_id("feilaifeng")
    assert lingyin.ticket_price == 0
    assert feilai.ticket_price == 0
    tang = xian.by_id("tang")
    buyecheng = xian.by_id("buyecheng")
    assert tang.name == "大雁塔"
    assert tang.ticket_price == 35
    assert "不夜城" not in tang.name
    assert buyecheng.name == "大唐不夜城"
    assert buyecheng.ticket_price == 0
    museum = xian.by_id("museum")
    assert 0 in museum.closed_weekdays
    assert hangzhou.by_id("xixi").suburban is True
    assert chengdu.by_id("panda").suburban is True
    assert xian.by_id("terracotta").suburban is True
    assert xian.by_id("lishanyuan").suburban is True
    assert chengdu.by_id("jinsha") is None
    assert all("金沙" not in place.name for catalog in load_catalogs().values() for place in catalog.places)


def test_frontend_ticket_table_drops_obsolete_prices():
    schedule = (ROOT / "web/src/custom/schedule.ts").read_text(encoding="utf-8")
    places = (ROOT / "web/src/data/places.ts").read_text(encoding="utf-8")
    assert "lingyin: 45" not in schedule
    assert "lingyin: 0" in schedule
    assert "tang: 35" in schedule
    assert "大雁塔·大唐不夜城" not in places
    assert "春熙路·太古里" not in places
