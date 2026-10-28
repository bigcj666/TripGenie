import type { GenerateResponse, Trip } from '../types/trip';

const city = '杭州';
const people = 2;
const budget_total = 1500;
const preferences = ['美食', '人文'];

const baseSources = [
  {
    title: '杭州市文化广电旅游局',
    url: 'https://whly.hangzhou.gov.cn/',
  },
  {
    title: '杭州西湖风景名胜区',
    url: 'https://www.hzwestlake.com/',
  },
];

function makeItem(
  time_start: string,
  time_end: string,
  type: Trip['itinerary'][number]['items'][number]['type'],
  title: string,
  duration_min: number,
  cost_estimate: number,
  description: string,
  tips: string,
  transport: { mode: 'walk' | 'transit' | 'drive' | 'taxi'; duration_min: number; note: string } | null,
): Trip['itinerary'][number]['items'][number] {
  return {
    time_start,
    time_end,
    type,
    title,
    poi: {
      name: title,
      lat: 30.25 + Math.random() * 0.02,
      lng: 120.14 + Math.random() * 0.02,
      adcode: '330106',
    },
    duration_min,
    cost_estimate,
    description,
    tips,
    transport_to_next: transport,
    sources: baseSources,
  };
}

const compactTrip: Trip = {
  trip_id: 'mock-compact-hz-001',
  city,
  days: 2,
  people,
  budget_total,
  style: 'compact',
  preferences,
  summary: '两日紧凑打卡西湖经典线，覆盖断桥、灵隐寺与河坊街美食。',
  itinerary: [
    {
      day: 1,
      theme: '西湖经典线',
      items: [
        makeItem('08:30', '10:00', 'attraction', '断桥残雪', 90, 0, '白堤起点，清晨人少景美。', '建议早去避人流。', {
          mode: 'walk',
          duration_min: 15,
          note: '沿白堤步行至孤山',
        }),
        makeItem('10:15', '11:30', 'attraction', '浙江省博物馆孤山馆区', 75, 0, '了解西湖与吴越文化。', '免费参观，带身份证。', {
          mode: 'walk',
          duration_min: 10,
          note: '步行到楼外楼',
        }),
        makeItem('11:40', '12:40', 'meal', '楼外楼午餐', 60, 120, '西湖醋鱼、龙井虾仁。', '错峰就餐。', {
          mode: 'walk',
          duration_min: 20,
          note: '沿北山街到曲院风荷',
        }),
        makeItem('13:00', '14:30', 'attraction', '曲院风荷', 90, 0, '夏日荷花名景。', '沿湖栈道拍照。', {
          mode: 'transit',
          duration_min: 25,
          note: '公交到灵隐',
        }),
        makeItem('15:00', '17:00', 'attraction', '灵隐寺', 120, 75, '千年古刹，飞来峰石窟。', '提前网上购票。', {
          mode: 'transit',
          duration_min: 30,
          note: '公交回市区',
        }),
        makeItem('17:30', '18:30', 'meal', '知味观小吃', 60, 60, '杭帮小吃简餐。', '点片儿川。', {
          mode: 'walk',
          duration_min: 10,
          note: '步行回酒店',
        }),
        makeItem('19:00', '20:30', 'hotel', '西湖边精品酒店', 90, 280, '休息恢复体力。', '尽量订湖景房。', null),
      ],
    },
    {
      day: 2,
      theme: '宋韵与市井',
      items: [
        makeItem('09:00', '11:00', 'attraction', '河坊街', 120, 30, '南宋御街遗址，老字号聚集。', '早到避团客。', {
          mode: 'walk',
          duration_min: 15,
          note: '步行到胡庆余堂',
        }),
        makeItem('11:15', '12:15', 'attraction', '胡庆余堂中药博物馆', 60, 20, '江南药王老宅。', '听免费讲解。', {
          mode: 'walk',
          duration_min: 10,
          note: '步行到高银街',
        }),
        makeItem('12:30', '13:30', 'meal', '高银街杭帮菜', 60, 100, '东坡肉、叫花鸡。', '两人分菜不浪费。', {
          mode: 'transit',
          duration_min: 20,
          note: '公交到钱王祠',
        }),
        makeItem('14:00', '15:30', 'attraction', '钱王祠', 90, 20, '吴越国钱镠纪念地。', '带学生证半价。', {
          mode: 'walk',
          duration_min: 15,
          note: '步行到南山路',
        }),
        makeItem('15:45', '16:45', 'free', '南山路咖啡休息', 60, 40, '文艺街区闲逛咖啡。', '网红店可打卡。', {
          mode: 'taxi',
          duration_min: 15,
          note: '打车到杭州东站',
        }),
        makeItem('17:00', '17:30', 'transport', '前往杭州东站', 30, 50, '返程交通。', '预留安检时间。', null),
      ],
    },
  ],
  cost_breakdown: { transport: 200, food: 320, tickets: 115, hotel: 280, other: 140 },
};

const relaxedTrip: Trip = {
  trip_id: 'mock-relaxed-hz-001',
  city,
  days: 2,
  people,
  budget_total,
  style: 'relaxed',
  preferences,
  summary: '两日松弛慢游，深度停留西湖与灵隐，节奏舒缓不赶路。',
  itinerary: [
    {
      day: 1,
      theme: '西湖慢享',
      items: [
        makeItem('09:30', '11:30', 'attraction', '断桥残雪', 120, 0, '清晨漫步白堤，远眺保俶塔。', '可在桥头长椅发呆。', {
          mode: 'walk',
          duration_min: 20,
          note: '沿白堤慢走',
        }),
        makeItem('12:00', '13:30', 'meal', '平湖秋月茶室', 90, 150, '湖景午餐与龙井。', '点一份定胜糕。', {
          mode: 'walk',
          duration_min: 15,
          note: '步行到曲院风荷',
        }),
        makeItem('14:00', '16:30', 'attraction', '曲院风荷', 150, 0, '荷塘曲径，适合发呆。', '午后光线好。', {
          mode: 'taxi',
          duration_min: 20,
          note: '打车回酒店',
        }),
        makeItem('17:00', '18:30', 'hotel', '湖滨酒店休息', 90, 350, '回酒店小憩。', '可预约SPA。', {
          mode: 'walk',
          duration_min: 10,
          note: '步行到晚餐点',
        }),
        makeItem('18:45', '20:30', 'meal', '湖滨银泰晚餐', 105, 180, '杭帮融合菜。', '提前取号。', null),
      ],
    },
    {
      day: 2,
      theme: '禅意灵隐',
      items: [
        makeItem('09:30', '12:00', 'attraction', '灵隐寺', 150, 75, '香火鼎盛，飞来峰造像。', '请香在寺外。', {
          mode: 'walk',
          duration_min: 15,
          note: '寺内步道',
        }),
        makeItem('12:30', '14:00', 'meal', '灵隐素斋', 90, 80, '清心素斋。', '人多需等位。', {
          mode: 'taxi',
          duration_min: 25,
          note: '打车到西湖天地',
        }),
        makeItem('14:30', '16:30', 'free', '西湖天地闲逛', 120, 50, '湖畔商业街区。', '买伴手礼。', {
          mode: 'walk',
          duration_min: 15,
          note: '步行到钱王祠',
        }),
        makeItem('17:00', '18:00', 'attraction', '钱王祠', 60, 20, '傍晚游园。', '闭园前1小时入。', null),
      ],
    },
  ],
  cost_breakdown: { transport: 180, food: 410, tickets: 95, hotel: 350, other: 120 },
};

const economyTrip: Trip = {
  trip_id: 'mock-economy-hz-001',
  city,
  days: 2,
  people,
  budget_total,
  style: 'economy',
  preferences,
  summary: '两日省钱玩法，优先免费景点与公共交通，人均控制在预算内。',
  itinerary: [
    {
      day: 1,
      theme: '免费西湖环线',
      items: [
        makeItem('08:30', '10:30', 'attraction', '断桥残雪', 120, 0, '免费开放的白堤起点。', '自带水和干粮。', {
          mode: 'walk',
          duration_min: 30,
          note: '沿白堤步行到孤山',
        }),
        makeItem('11:00', '12:00', 'free', '孤山公园', 60, 0, '免费公园，俯瞰西湖。', '野餐垫休息。', {
          mode: 'walk',
          duration_min: 15,
          note: '步行到附近小吃',
        }),
        makeItem('12:15', '13:00', 'meal', '老娘舅简餐', 45, 45, '经济快餐。', '错峰更便宜。', {
          mode: 'transit',
          duration_min: 40,
          note: '公交到青芝坞',
        }),
        makeItem('13:45', '15:45', 'attraction', '青芝坞街区', 120, 0, '免费文艺街区。', '小店多可逛。', {
          mode: 'transit',
          duration_min: 30,
          note: '公交回市区',
        }),
        makeItem('16:15', '17:15', 'free', '武林夜市外围', 60, 30, '感受市井氛围。', '只看不买。', {
          mode: 'walk',
          duration_min: 15,
          note: '步行到青年旅舍',
        }),
        makeItem('17:30', '18:00', 'hotel', '西湖边青旅床位', 30, 90, '经济住宿。', '自备洗漱。', null),
      ],
    },
    {
      day: 2,
      theme: '低价人文',
      items: [
        makeItem('09:00', '11:00', 'attraction', '京杭大运河拱宸桥', 120, 0, '世界遗产点，免费。', '博物馆免费。', {
          mode: 'transit',
          duration_min: 25,
          note: '公交到小河直街',
        }),
        makeItem('11:30', '12:30', 'meal', '小河直街小吃', 60, 35, '本地小吃。', '人均30内。', {
          mode: 'walk',
          duration_min: 15,
          note: '步行到手工艺活态馆',
        }),
        makeItem('12:45', '14:15', 'attraction', '手工艺活态展示馆', 90, 20, '非遗体验，低价。', '学生证优惠。', {
          mode: 'transit',
          duration_min: 35,
          note: '公交到河坊街',
        }),
        makeItem('15:00', '16:30', 'free', '河坊街步行', 90, 20, '免费逛街。', '只尝一种小吃。', {
          mode: 'transit',
          duration_min: 30,
          note: '公交到火车站',
        }),
        makeItem('17:00', '17:30', 'transport', '公交前往火车站', 30, 10, '最省钱返程。', '刷公交卡。', null),
      ],
    },
  ],
  cost_breakdown: { transport: 120, food: 200, tickets: 40, hotel: 90, other: 80 },
};

export const MOCK_TRIPS: Trip[] = [compactTrip, relaxedTrip, economyTrip];

export const MOCK_GENERATE_RESPONSE: GenerateResponse = {
  engine: 'mock',
  plans: MOCK_TRIPS,
};

/** 按 style='all' 或单风格返回对应 plans */
export function buildMockPlans(style: string): Trip[] {
  if (style === 'all') return MOCK_TRIPS;
  return MOCK_TRIPS.filter((t) => t.style === style).slice(0, 1);
}
