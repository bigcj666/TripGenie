"""Mock 生成引擎：无网络/无 key 时的演示保命通道，输出与真实 LLM 同一契约。

内置杭州/成都/西安三城 POI 样例；其他城市走通用模板。
三种风格在停留时长、每日项目数、门票花费上做出可感知差异。
"""

from __future__ import annotations

from ..schemas.trip import (
    CostBreakdown,
    DayPlan,
    ItineraryItem,
    ItemType,
    Poi,
    SourceRef,
    TransportMode,
    TransportToNext,
    TravelStyle,
    Trip,
)

# (名称, 纬度, 经度, 适配标签, 门票花费, 建议停留分钟, 简介, 小贴士)
_POIS: dict[str, list[tuple[str, float, float, set[str], float, int, str, str]]] = {
    "杭州": [
        ("断桥残雪", 30.2593, 120.1477, {"人文", "网红打卡"}, 0, 90, "西湖十景之一，白堤东端的标志性景点。", "清晨人少，适合拍照。"),
        ("孤山公园", 30.2540, 120.1440, {"自然", "亲子"}, 0, 75, "西湖中最大的岛屿，林木幽深，适合散步。", "可顺路参观浙江省博物馆。"),
        ("楼外楼（孤山路店）", 30.2533, 120.1428, {"美食"}, 120, 75, "百年老字号杭帮菜，西湖醋鱼与东坡肉是招牌。", "建议提前取号。"),
        ("西湖游船", 30.2489, 120.1540, {"亲子", "自然"}, 55, 90, "从一公园码头登船，环湖欣赏三潭印月。", "末班船约 16:30，注意时间。"),
        ("雷峰塔", 30.2320, 120.1490, {"人文"}, 40, 90, "白蛇传传说发生地，登塔可俯瞰西湖全景。", "日落前登塔光线最好。"),
        ("河坊街", 30.2405, 120.1690, {"美食", "购物", "网红打卡"}, 0, 100, "南宋御街所在地，小吃与手工艺店铺集中。", "晚餐可以在这里解决。"),
        ("灵隐寺", 30.2410, 120.1010, {"人文"}, 75, 150, "江南禅宗名刹，飞来峰造像为全国重点文保。", "需另购飞来峰景区门票。"),
        ("西溪湿地", 30.2680, 120.0700, {"自然", "亲子"}, 80, 180, "城市中的湿地公园，摇橹船穿行芦苇荡。", "防晒防蚊，带好饮用水。"),
        ("武林夜市", 30.2790, 120.1620, {"美食", "购物"}, 0, 90, "杭州最热闹的夜市之一，小吃摊与文创摊密集。", "19:00 后最热闹。"),
        ("拱宸桥·京杭大运河", 30.3200, 120.1420, {"人文", "自然"}, 0, 100, "京杭大运河南端标志，桥西直街可逛博物馆群。", "傍晚灯光亮起时最好看。"),
    ],
    "成都": [
        ("武侯祠", 30.6460, 104.0470, {"人文"}, 50, 100, "三国文化圣地，纪念诸葛亮的祠堂。", "与锦里相邻，可连游。"),
        ("锦里古街", 30.6450, 104.0450, {"美食", "购物"}, 0, 90, "西蜀第一街，三大炮、钵钵鸡等地道小吃汇聚。", "晚上红灯笼亮起最有氛围。"),
        ("杜甫草堂", 30.6650, 104.0230, {"人文"}, 50, 100, "杜甫流寓成都时的故居，园林清幽。", "避开正午，早晨最舒适。"),
        ("宽窄巷子", 30.6720, 104.0550, {"美食", "网红打卡", "购物"}, 0, 100, "清代老街改造的休闲街区。", "人多，注意随身物品。"),
        ("成都大熊猫繁育研究基地", 30.7350, 104.1470, {"亲子", "自然"}, 55, 180, "近距离观赏大熊猫的首选地。", "上午 8–10 点熊猫最活跃。"),
        ("春熙路·太古里", 30.6520, 104.0760, {"购物", "网红打卡"}, 0, 110, "成都最繁华的商圈，IFS 爬墙熊猫是地标。", "适合安排在傍晚。"),
    ],
    "西安": [
        ("钟楼", 34.2610, 108.9420, {"人文"}, 30, 70, "西安城市中心地标，明代建筑。", "登楼可看四条大街交汇。"),
        ("回民街", 34.2620, 108.9370, {"美食"}, 0, 110, "西安最著名的小吃街，肉夹馍、羊肉泡馍云集。", "多走几步到本地人去的小巷更地道。"),
        ("秦始皇兵马俑博物馆", 34.3840, 109.2780, {"人文", "亲子"}, 120, 240, "世界第八大奇迹，一号坑最震撼。", "距市区约 1 小时车程，务必早出发。"),
        ("大雁塔·大唐不夜城", 34.2180, 108.9640, {"人文", "网红打卡", "亲子"}, 40, 150, "唐代佛塔与步行街夜景结合。", "晚上的灯光与表演值得留时间。"),
        ("西安城墙（永宁门）", 34.2540, 108.9460, {"人文", "自然"}, 54, 120, "中国保存最完整的古城墙，可骑行环城。", "租车骑行约 90 分钟一圈。"),
        ("陕西历史博物馆", 34.2230, 108.9580, {"人文", "亲子"}, 0, 150, "周秦汉唐文物荟萃，何家村窖藏必看。", "务必提前预约，周一闭馆。"),
    ],
}

_TAGS = ["美食", "自然", "人文", "亲子", "购物", "网红打卡"]

_STYLE_CONFIG: dict[TravelStyle, dict] = {
    TravelStyle.COMPACT: {
        "label": "紧凑",
        "max_items": 6,
        "min_items": 5,
        "duration_scale": 0.8,
        "ticket_scale": 1.0,
        "cost_shares": (0.35, 0.35, 0.18, 0.12),  # hotel/food/transport/other
    },
    TravelStyle.RELAXED: {
        "label": "松弛",
        "max_items": 4,
        "min_items": 3,
        "duration_scale": 1.25,
        "ticket_scale": 1.0,
        "cost_shares": (0.42, 0.32, 0.16, 0.10),
    },
    TravelStyle.ECONOMY: {
        "label": "省钱",
        "max_items": 5,
        "min_items": 4,
        "duration_scale": 1.0,
        "ticket_scale": 0.35,
        "cost_shares": (0.26, 0.32, 0.22, 0.20),  # 门票另计且占比最低（≤10% 预算）
    },
}


def _pick_pois(city: str, preferences: list[str], count: int) -> list[tuple]:
    pool = _POIS.get(city, [])
    if not pool:
        # 通用模板：任何城市都能出结构合法的行程
        return [
            (
                f"{city}市中心广场",
                30.0,
                120.0,
                {"人文", "网红打卡"},
                0,
                80,
                f"{city}城市中心地标，适合初到时快速感受城市氛围。",
                "建议第一站，熟悉周边交通。",
            ),
            (
                f"{city}地方菜馆",
                30.001,
                120.001,
                {"美食"},
                80,
                70,
                f"品尝{city}本地特色菜。",
                "点菜前先问招牌菜。",
            ),
            (
                f"{city}博物馆",
                30.002,
                120.002,
                {"人文", "亲子"},
                0,
                110,
                f"了解{city}历史文化的好去处。",
                "通常周一闭馆，提前查询。",
            ),
            (
                f"{city}城市公园",
                30.003,
                120.003,
                {"自然", "亲子"},
                0,
                90,
                f"本地人休闲的绿地，适合散步。",
                "傍晚去更凉爽。",
            ),
            (
                f"{city}夜市",
                30.004,
                120.004,
                {"美食", "购物"},
                0,
                95,
                f"{city}特色小吃与夜生活集中地。",
                "注意看管好随身物品。",
            ),
            (
                f"{city}观景台",
                30.005,
                120.005,
                {"网红打卡", "自然"},
                30,
                85,
                f"俯瞰{city}全景的绝佳位置。",
                "日落时分景色最好。",
            ),
        ][:count]

    prefs = set(preferences) & set(_TAGS)
    if prefs:
        matched = [p for p in pool if p[3] & prefs]
        others = [p for p in pool if not (p[3] & prefs)]
        ordered = matched + others
    else:
        ordered = pool
    picked = ordered[:count]
    # 不足则循环补位（同城样例通常够 3 天 × 6 项）
    while len(picked) < count:
        picked.append(pool[len(picked) % len(pool)])
    return picked


def _build_item(
    poi: tuple,
    start_min: int,
    style: TravelStyle,
    day_index: int,
    item_index: int,
    total_items: int,
    preferences: list[str],
) -> tuple[ItineraryItem, int]:
    name, lat, lng, tags, ticket, stay, desc, tips = poi
    cfg = _STYLE_CONFIG[style]
    stay_scaled = max(45, int(stay * cfg["duration_scale"] / 5) * 5)
    if style == TravelStyle.RELAXED:
        stay_scaled = max(90, stay_scaled)  # 松弛风格：单点停留 ≥90 分钟
    ticket_scaled = round(ticket * cfg["ticket_scale"], 1) if ticket else 0.0

    matched = tags & set(preferences)
    if matched:
        desc = f"{desc}（适合{'、'.join(sorted(matched))}）"

    end_min = start_min + stay_scaled
    start_str = f"{start_min // 60:02d}:{start_min % 60:02d}"
    end_str = f"{end_min // 60:02d}:{end_min % 60:02d}"

    if "美食" in tags:
        itype = ItemType.MEAL
    elif ticket_scaled == 0 and not tags:
        itype = ItemType.FREE
    else:
        itype = ItemType.ATTRACTION

    transport = None
    next_start = end_min
    if item_index < total_items - 1:
        mode = TransportMode.WALK if item_index % 2 == 0 else TransportMode.TRANSIT
        gap = 20 if mode == TransportMode.WALK else 35
        transport = TransportToNext(
            mode=mode,
            duration_min=gap,
            note="步行前往" if mode == TransportMode.WALK else "乘坐公共交通前往",
        )
        next_start = end_min + gap

    item = ItineraryItem(
        time_start=start_str,
        time_end=end_str,
        type=itype,
        title=name,
        poi=Poi(name=name, lat=lat, lng=lng, adcode=""),
        duration_min=stay_scaled,
        cost_estimate=ticket_scaled,
        description=desc,
        tips=tips,
        transport_to_next=transport,
        sources=[
            SourceRef(title="途灵 Mock 演示数据", url="https://example.com/tuling-mock"),
        ],
    )
    return item, next_start


def generate_mock_trip(
    city: str,
    days: int,
    budget_total: float,
    people: int,
    preferences: list[str],
    style: TravelStyle,
) -> Trip:
    cfg = _STYLE_CONFIG[style]
    per_day_count = cfg["min_items"] if style == TravelStyle.RELAXED else cfg["max_items"] - 1
    needed = per_day_count * days
    pool = _pick_pois(city, preferences, needed)

    itinerary: list[DayPlan] = []
    themes = ["经典必游", "深度漫游", "美食与夜色", "亲子时光", "人文历史", "自然休闲", "购物打卡"]
    cursor = 0
    for d in range(1, days + 1):
        items: list[ItineraryItem] = []
        start = 9 * 60  # 09:00
        for i in range(per_day_count):
            poi = pool[cursor % len(pool)]
            cursor += 1
            item, start = _build_item(poi, start, style, d, i, per_day_count, preferences)
            items.append(item)
        itinerary.append(DayPlan(day=d, theme=themes[(d - 1) % len(themes)], items=items))

    raw_tickets_pp = sum(it.cost_estimate for day in itinerary for it in day.items)
    raw_total = raw_tickets_pp * people
    # 成本随预算缩放：先按风格上限缩放【条目明细】（保证明细与汇总一致），再拆分剩余
    cap_ratio = 0.10 if style == TravelStyle.ECONOMY else 0.40
    cap = budget_total * cap_ratio
    if raw_total > cap and raw_total > 0:
        factor = cap / raw_total
        for day in itinerary:
            for it in day.items:
                it.cost_estimate = round(it.cost_estimate * factor, 1)
        raw_tickets_pp = sum(it.cost_estimate for day in itinerary for it in day.items)
    tickets_total = round(raw_tickets_pp * people, 1)
    remaining = max(budget_total * 0.95 - tickets_total, budget_total * 0.2)
    hotel_share, food_share, transport_share, other_share = cfg["cost_shares"]
    hotel_total = round(remaining * hotel_share, 1)
    food_total = round(remaining * food_share, 1)
    transport_total = round(remaining * transport_share, 1)
    other_total = round(remaining * other_share, 1)

    summary = f"{city}{days}天{cfg['label']}行程，覆盖{len(preferences) or '经典'}偏好，适合{people}人同行。"

    return Trip(
        city=city,
        days=days,
        people=people,
        budget_total=budget_total,
        style=style,
        preferences=preferences,
        summary=summary,
        itinerary=itinerary,
        cost_breakdown=CostBreakdown(
            transport=transport_total,
            food=food_total,
            tickets=tickets_total,
            hotel=hotel_total,
            other=other_total,
        ),
    )
