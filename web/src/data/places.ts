export interface Place {
  id: string
  city: string
  name: string
  lat: number
  lng: number
  image: string
  blurb: string
  tags: string[]
  price?: number
}

export interface CityCard {
  name: string
  image: string
  line: string
}

export const CITIES: CityCard[] = [
  { name: '杭州', image: '/places/westlake.jpg', line: '西湖 · 灵隐' },
  { name: '成都', image: '/places/chengdu.jpg', line: '锦里 · 熊猫' },
  { name: '西安', image: '/places/wall.jpg', line: '城墙 · 兵马俑' },
]

export const PLACES: Place[] = [
  { id: 'duanqiao', city: '杭州', name: '断桥残雪', lat: 30.2593, lng: 120.1477, image: '/places/duanqiao.jpg', blurb: '西湖十景，白堤东端。', tags: ['人文', '网红打卡'] },
  { id: 'gushan', city: '杭州', name: '孤山公园', lat: 30.254, lng: 120.144, image: '/places/westlake.jpg', blurb: '西湖中最大的岛，适合散步。', tags: ['自然', '亲子'] },
  { id: 'louwailou', city: '杭州', name: '楼外楼', lat: 30.2533, lng: 120.1428, image: '/places/louwailou.jpg', blurb: '杭帮菜老店，西湖醋鱼、东坡肉。', tags: ['饭馆', '美食'], price: 90 },
  { id: 'cruise', city: '杭州', name: '西湖游船', lat: 30.2489, lng: 120.154, image: '/places/westlake.jpg', blurb: '从一公园码头上船，看三潭印月。', tags: ['亲子', '自然'] },
  { id: 'leifeng', city: '杭州', name: '雷峰塔', lat: 30.232, lng: 120.149, image: '/places/leifeng.jpg', blurb: '登塔看西湖，傍晚光线好。', tags: ['人文'] },
  { id: 'hefang', city: '杭州', name: '河坊街', lat: 30.2405, lng: 120.169, image: '/places/hefang.jpg', blurb: '南宋御街，小吃和手作集中。', tags: ['美食', '购物'] },
  { id: 'lingyin', city: '杭州', name: '灵隐寺', lat: 30.241, lng: 120.101, image: '/places/lingyin.jpg', blurb: '飞来峰造像，门票另计。', tags: ['人文'] },
  { id: 'xixi', city: '杭州', name: '西溪湿地', lat: 30.268, lng: 120.07, image: '/places/xixi.jpg', blurb: '摇橹船穿芦苇，注意防晒。', tags: ['自然', '亲子'] },
  { id: 'wulin', city: '杭州', name: '武林夜市', lat: 30.279, lng: 120.162, image: '', blurb: '晚上人最多，小吃集中。', tags: ['美食', '购物'] },
  { id: 'gongchen', city: '杭州', name: '拱宸桥', lat: 30.32, lng: 120.142, image: '/places/gongchen.jpg', blurb: '京杭大运河南端，傍晚灯光好看。', tags: ['人文', '自然'] },
  { id: 'zhiweiguan', city: '杭州', name: '知味观', lat: 30.2565, lng: 120.1705, image: '', blurb: '仁和路老店，片儿川和小笼，适合早餐或午餐。', tags: ['饭馆', '美食'], price: 70 },
  { id: 'xinbailu', city: '杭州', name: '新白鹿', lat: 30.2548, lng: 120.1638, image: '', blurb: '湖滨杭帮家常，晚饭不用走远。', tags: ['饭馆', '美食'], price: 65 },
  { id: 'waipojia', city: '杭州', name: '外婆家', lat: 30.2588, lng: 120.1655, image: '', blurb: '西湖银泰附近，出菜快，适合赶行程。', tags: ['饭馆', '美食'], price: 60 },
  { id: 'quanji-hz', city: '杭州', name: '全季酒店（湖滨店）', lat: 30.2556, lng: 120.1612, image: '', blurb: '湖滨一带，去西湖走路就能到。双床房，适合两人住一间。', tags: ['酒店'], price: 420 },
  { id: 'westlake-hotel', city: '杭州', name: '西湖国宾馆', lat: 30.2478, lng: 120.1375, image: '', blurb: '西湖边，出门就是湖，价格高。', tags: ['酒店'], price: 900 },
  { id: 'wuhou', city: '成都', name: '武侯祠', lat: 30.646, lng: 104.047, image: '/places/wuhou.jpg', blurb: '和锦里连在一起，适合顺路。', tags: ['人文'] },
  { id: 'jinli', city: '成都', name: '锦里古街', lat: 30.645, lng: 104.045, image: '/places/jinli.jpg', blurb: '小吃集中，晚上灯笼亮起来。', tags: ['美食', '购物'] },
  { id: 'dufu', city: '成都', name: '杜甫草堂', lat: 30.665, lng: 104.023, image: '/places/dufu.jpg', blurb: '园林清静，上午更舒服。', tags: ['人文'] },
  { id: 'kuanzhai', city: '成都', name: '宽窄巷子', lat: 30.672, lng: 104.055, image: '/places/kuanzhai.jpg', blurb: '宽巷、窄巷、井巷三条街。', tags: ['美食', '购物'] },
  { id: 'panda', city: '成都', name: '熊猫基地', lat: 30.735, lng: 104.147, image: '/places/panda.jpg', blurb: '上午 8 点到 10 点熊猫更活跃。', tags: ['亲子', '自然'] },
  { id: 'chunxi', city: '成都', name: '春熙路·太古里', lat: 30.652, lng: 104.076, image: '/places/chunxi.jpg', blurb: '市区商圈，适合傍晚逛。', tags: ['购物'] },
  { id: 'mapo', city: '成都', name: '陈麻婆豆腐', lat: 30.6715, lng: 104.0722, image: '', blurb: '西玉龙街总店，麻婆豆腐。', tags: ['饭馆', '美食'], price: 55 },
  { id: 'shudaxia', city: '成都', name: '蜀大侠火锅', lat: 30.6698, lng: 104.0536, image: '', blurb: '宽窄巷子附近，适合晚饭。', tags: ['饭馆', '美食'], price: 110 },
  { id: 'xiaolongkan', city: '成都', name: '小龙坎火锅', lat: 30.6542, lng: 104.0785, image: '', blurb: '春熙路店，人多要排队。', tags: ['饭馆', '美食'], price: 100 },
  { id: 'quanji-cd', city: '成都', name: '全季酒店（长顺街店）', lat: 30.6742, lng: 104.0528, image: '', blurb: '离宽窄巷子近，双床房。', tags: ['酒店'], price: 380 },
  { id: 'atour-cd', city: '成都', name: '亚朵酒店（盐市口店）', lat: 30.6536, lng: 104.0794, image: '', blurb: '春熙路太古里旁边，逛完可以走回去。', tags: ['酒店'], price: 520 },
  { id: 'bell', city: '西安', name: '钟楼', lat: 34.261, lng: 108.942, image: '/places/bell.jpg', blurb: '城中心，可看四条大街交汇。', tags: ['人文'] },
  { id: 'muslim', city: '西安', name: '回民街', lat: 34.262, lng: 108.937, image: '/places/muslim.jpg', blurb: '肉夹馍、羊肉泡馍集中。', tags: ['美食'] },
  { id: 'terracotta', city: '西安', name: '兵马俑', lat: 34.384, lng: 109.278, image: '/places/terracotta.jpg', blurb: '离市区远，要留出半天。', tags: ['人文', '亲子'] },
  { id: 'tang', city: '西安', name: '大雁塔·大唐不夜城', lat: 34.218, lng: 108.964, image: '/places/tang.jpg', blurb: '白天看塔，晚上看灯光。', tags: ['人文', '亲子'] },
  { id: 'wall', city: '西安', name: '西安城墙', lat: 34.254, lng: 108.946, image: '/places/wall.jpg', blurb: '永宁门上下，可骑行。', tags: ['人文', '自然'] },
  { id: 'museum', city: '西安', name: '陕西历史博物馆', lat: 34.223, lng: 108.958, image: '/places/museum.jpg', blurb: '需要预约，周一闭馆。', tags: ['人文', '亲子'] },
  { id: 'tongshengxiang', city: '西安', name: '同盛祥', lat: 34.2634, lng: 108.9432, image: '', blurb: '钟楼附近，羊肉泡馍。', tags: ['饭馆', '美食'], price: 50 },
  { id: 'laosunjia', city: '西安', name: '老孙家', lat: 34.2641, lng: 108.9396, image: '', blurb: '回民街边的泡馍老店。', tags: ['饭馆', '美食'], price: 48 },
  { id: 'chunfasheng', city: '西安', name: '春发生', lat: 34.2576, lng: 108.9478, image: '', blurb: '葫芦头泡馍，南院门附近。', tags: ['饭馆', '美食'], price: 45 },
  { id: 'quanji-xa', city: '西安', name: '全季酒店（南大街店）', lat: 34.2598, lng: 108.9472, image: '', blurb: '钟楼南边，去城墙和回民街都近。', tags: ['酒店'], price: 360 },
  { id: 'meiju-xa', city: '西安', name: '美居酒店（北院门店）', lat: 34.2584, lng: 108.9402, image: '', blurb: '鼓楼附近，晚饭后走路就能回。', tags: ['酒店'], price: 480 },
]

const PHOTO_RULES: [string, string][] = [
  ['不夜城', '/places/tang.jpg'],
  ['大雁塔', '/places/wildgoose.jpg'],
  ['兵马俑', '/places/terracotta.jpg'],
  ['历史博物馆', '/places/museum.jpg'],
  ['城墙', '/places/wall.jpg'],
  ['回民', '/places/muslim.jpg'],
  ['钟楼', '/places/bell.jpg'],
  ['太古里', '/places/chunxi.jpg'],
  ['春熙', '/places/chunxi.jpg'],
  ['熊猫', '/places/panda.jpg'],
  ['宽窄', '/places/kuanzhai.jpg'],
  ['杜甫', '/places/dufu.jpg'],
  ['锦里', '/places/jinli.jpg'],
  ['武侯', '/places/wuhou.jpg'],
  ['拱宸', '/places/gongchen.jpg'],
  ['运河', '/places/gongchen.jpg'],
  ['西溪', '/places/xixi.jpg'],
  ['灵隐', '/places/lingyin.jpg'],
  ['河坊', '/places/hefang.jpg'],
  ['雷峰', '/places/leifeng.jpg'],
  ['楼外楼', '/places/louwailou.jpg'],
  ['游船', '/places/westlake.jpg'],
  ['孤山', '/places/westlake.jpg'],
  ['断桥', '/places/duanqiao.jpg'],
]

export function photoFor(name: string): string {
  for (const [key, src] of PHOTO_RULES) {
    if (name.includes(key)) return src
  }
  return ''
}

export function cityImage(city: string): string {
  return CITIES.find((item) => item.name === city)?.image ?? ''
}
