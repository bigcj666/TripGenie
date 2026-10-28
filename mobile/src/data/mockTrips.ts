/**
 * 本地 Mock 行程 fixture —— 离线/无后端时的演示保命通道。
 * 按请求参数（城市/天数/人数/预算/偏好）动态生成，结构与 server 契约一致。
 */
import type {
  CostBreakdown,
  GenerateRequest,
  GenerateResponse,
  ItineraryItem,
  ItemType,
  Trip,
  TravelStyle,
} from '../types/trip';

interface PoiSeed {
  name: string;
  lat: number;
  lng: number;
  tags: string[];
  ticket: number;
  stay: number;
  desc: string;
  tips: string;
}

const POI_POOL: Record<string, PoiSeed[]> = {
  杭州: [
    { name: '断桥残雪', lat: 30.2593, lng: 120.1477, tags: ['人文', '网红打卡'], ticket: 0, stay: 90, desc: '西湖十景之一，白堤东端的标志性景点。', tips: '清晨人少，适合拍照。' },
    { name: '孤山公园', lat: 30.254, lng: 120.144, tags: ['自然', '亲子'], ticket: 0, stay: 75, desc: '西湖中最大的岛屿，林木幽深。', tips: '可顺路参观浙江省博物馆。' },
    { name: '楼外楼', lat: 30.2533, lng: 120.1428, tags: ['美食'], ticket: 120, stay: 75, desc: '百年老字号杭帮菜。', tips: '建议提前取号。' },
    { name: '西湖游船', lat: 30.2489, lng: 120.154, tags: ['亲子', '自然'], ticket: 55, stay: 90, desc: '环湖欣赏三潭印月。', tips: '末班船约 16:30。' },
    { name: '雷峰塔', lat: 30.232, lng: 120.149, tags: ['人文'], ticket: 40, stay: 90, desc: '登塔可俯瞰西湖全景。', tips: '日落前登塔光线最好。' },
    { name: '河坊街', lat: 30.2405, lng: 120.169, tags: ['美食', '购物'], ticket: 0, stay: 100, desc: '小吃与手工艺店铺集中。', tips: '晚餐可以在这里解决。' },
  ],
  成都: [
    { name: '武侯祠', lat: 30.646, lng: 104.047, tags: ['人文'], ticket: 50, stay: 100, desc: '三国文化圣地。', tips: '与锦里相邻。' },
    { name: '锦里古街', lat: 30.645, lng: 104.045, tags: ['美食', '购物'], ticket: 0, stay: 90, desc: '地道小吃汇聚。', tips: '晚上最有氛围。' },
    { name: '大熊猫基地', lat: 30.735, lng: 104.147, tags: ['亲子', '自然'], ticket: 55, stay: 180, desc: '近距离观赏大熊猫。', tips: '上午最活跃。' },
    { name: '宽窄巷子', lat: 30.672, lng: 104.055, tags: ['美食', '网红打卡'], ticket: 0, stay: 100, desc: '清代老街休闲街区。', tips: '注意随身物品。' },
  ],
  西安: [
    { name: '钟楼', lat: 34.261, lng: 108.942, tags: ['人文'], ticket: 30, stay: 70, desc: '西安城市中心地标。', tips: '登楼可看四条大街。' },
    { name: '回民街', lat: 34.262, lng: 108.937, tags: ['美食'], ticket: 0, stay: 110, desc: '西安著名小吃街。', tips: '多走几步更地道。' },
    { name: '兵马俑', lat: 34.384, lng: 109.278, tags: ['人文', '亲子'], ticket: 120, stay: 240, desc: '世界第八大奇迹。', tips: '务必早出发。' },
    { name: '西安城墙', lat: 34.254, lng: 108.946, tags: ['人文', '自然'], ticket: 54, stay: 120, desc: '保存最完整的古城墙。', tips: '可骑行环城。' },
  ],
};

const STYLE_CFG: Record<TravelStyle, { count: number; label: string; shares: [number, number, number, number] }> = {
  compact: { count: 5, label: '紧凑', shares: [0.35, 0.35, 0.18, 0.12] },
  relaxed: { count: 3, label: '松弛', shares: [0.42, 0.32, 0.16, 0.1] },
  economy: { count: 4, label: '省钱', shares: [0.26, 0.32, 0.22, 0.2] },
};

function pickPois(city: string, preferences: string[], count: number): PoiSeed[] {
  const pool = POI_POOL[city] ?? [
    { name: `${city}市中心广场`, lat: 30.0, lng: 120.0, tags: ['人文'], ticket: 0, stay: 80, desc: `${city}城市地标。`, tips: '建议第一站。' },
    { name: `${city}地方菜馆`, lat: 30.001, lng: 120.001, tags: ['美食'], ticket: 80, stay: 70, desc: `品尝${city}本地菜。`, tips: '点菜前先问招牌菜。' },
    { name: `${city}博物馆`, lat: 30.002, lng: 120.002, tags: ['人文', '亲子'], ticket: 0, stay: 110, desc: `了解${city}历史文化。`, tips: '周一常闭馆。' },
    { name: `${city}城市公园`, lat: 30.003, lng: 120.003, tags: ['自然'], ticket: 0, stay: 90, desc: '适合散步。', tips: '傍晚更凉爽。' },
    { name: `${city}夜市`, lat: 30.004, lng: 120.004, tags: ['美食', '购物'], ticket: 0, stay: 95, desc: '小吃集中地。', tips: '看管好物品。' },
    { name: `${city}观景台`, lat: 30.005, lng: 120.005, tags: ['网红打卡'], ticket: 30, stay: 85, desc: `俯瞰${city}全景。`, tips: '日落最好。' },
  ];
  const prefs = new Set(preferences);
  const matched = pool.filter((p) => p.tags.some((t) => prefs.has(t)));
  const others = pool.filter((p) => !p.tags.some((t) => prefs.has(t)));
  const ordered = [...matched, ...others];
  const picked: PoiSeed[] = [];
  for (let i = 0; i < count; i += 1) {
    picked.push(ordered[i % ordered.length]);
  }
  return picked;
}

function buildItem(poi: PoiSeed, startMin: number, style: TravelStyle, isLast: boolean, preferences: string[]): { item: ItineraryItem; nextStart: number } {
  const scale = style === 'relaxed' ? 1.25 : style === 'compact' ? 0.8 : 1;
  let stay = Math.max(45, Math.round((poi.stay * scale) / 5) * 5);
  if (style === 'relaxed') {
    stay = Math.max(90, stay);
  }
  const ticketScale = style === 'economy' ? 0.35 : 1;
  const matchedTags = poi.tags.filter((t) => preferences.includes(t));
  const desc = matchedTags.length > 0 ? `${poi.desc}（适合${matchedTags.join('、')}）` : poi.desc;
  const endMin = startMin + stay;
  const fmt = (m: number): string => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
  const type: ItemType = poi.tags.includes('美食') ? 'meal' : 'attraction';
  const gap = isLast ? 0 : 20;
  const item: ItineraryItem = {
    time_start: fmt(startMin),
    time_end: fmt(endMin),
    type,
    title: poi.name,
    poi: { name: poi.name, lat: poi.lat, lng: poi.lng, adcode: '' },
    duration_min: stay,
    cost_estimate: poi.ticket > 0 ? Math.round(poi.ticket * ticketScale * 10) / 10 : 0,
    description: desc,
    tips: poi.tips,
    transport_to_next: isLast
      ? null
      : { mode: 'walk', duration_min: gap, note: '步行前往' },
    sources: [{ title: '途灵 Mock 演示数据', url: 'https://example.com/tuling-mock' }],
  };
  return { item, nextStart: endMin + gap };
}

function buildTrip(req: GenerateRequest, style: TravelStyle): Trip {
  const cfg = STYLE_CFG[style];
  const themes = ['经典必游', '深度漫游', '美食与夜色', '亲子时光', '人文历史', '自然休闲'];
  const itinerary = [];
  for (let day = 1; day <= req.days; day += 1) {
    // 按天轮换取样，避免多日条目完全重复
    const seeds = pickPois(req.city, req.preferences, cfg.count * 2).slice(
      (day - 1) % cfg.count,
      ((day - 1) % cfg.count) + cfg.count,
    );
    const items: ItineraryItem[] = [];
    let start = 9 * 60;
    for (let i = 0; i < cfg.count; i += 1) {
      const built = buildItem(seeds[i % seeds.length], start, style, i === cfg.count - 1, req.preferences);
      items.push(built.item);
      start = built.nextStart;
    }
    itinerary.push({ day, theme: themes[(day - 1) % themes.length], items });
  }

  const allItems = itinerary.flatMap((d) => d.items);
  // 门票按风格上限缩放【条目明细】，保证明细与汇总一致
  let rawTickets = allItems.reduce((s, it) => s + it.cost_estimate, 0) * req.people;
  const capRatio = style === 'economy' ? 0.1 : 0.4;
  const cap = req.budget_total * capRatio;
  if (rawTickets > cap && rawTickets > 0) {
    const factor = cap / rawTickets;
    for (const it of allItems) {
      it.cost_estimate = Math.round(it.cost_estimate * factor * 10) / 10;
    }
    rawTickets = allItems.reduce((s, it) => s + it.cost_estimate, 0) * req.people;
  }
  const tickets = Math.round(rawTickets * 10) / 10;
  const remaining = Math.max(req.budget_total * 0.95 - tickets, req.budget_total * 0.2);
  const [hs, fs, ts, os] = cfg.shares;
  const cost_breakdown: CostBreakdown = {
    transport: Math.round(remaining * ts * 10) / 10,
    food: Math.round(remaining * fs * 10) / 10,
    tickets,
    hotel: Math.round(remaining * hs * 10) / 10,
    other: Math.round(remaining * os * 10) / 10,
  };

  return {
    trip_id: `mock-${style}-${Date.now()}`,
    city: req.city,
    days: req.days,
    people: req.people,
    budget_total: req.budget_total,
    style,
    preferences: req.preferences,
    summary: `${req.city}${req.days}天${cfg.label}行程，适合${req.people}人同行。`,
    itinerary,
    cost_breakdown,
  };
}

/** style=all 返回三方案，否则返回单方案。 */
export function buildMockPlans(req: GenerateRequest): GenerateResponse {
  const styles: TravelStyle[] = req.style === 'all' ? ['compact', 'relaxed', 'economy'] : [req.style];
  return {
    engine: 'mock',
    plans: styles.map((s) => buildTrip(req, s)),
  };
}
