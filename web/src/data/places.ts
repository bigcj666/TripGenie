export interface Place {
  id: string
  city: string
  name: string
  lat: number
  lng: number
  image: string
  blurb: string
  tags: string[]
  /** 饭馆人均或酒店间夜。景点门票不放这里。 */
  price?: number
  ticket_price?: number
  zone?: string
  suburban?: boolean
  type?: 'attraction' | 'restaurant' | 'hotel'
  closed_weekdays?: number[]
  fact_status?: 'sourced' | 'estimated'
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

/** 与 server/app/data/catalog 同步。门票用 ticket_price，饭馆和酒店用 price。 */
export const PLACES: Place[] = [
  {
    "id": "duanqiao",
    "city": "杭州",
    "name": "断桥残雪",
    "lat": 30.2593,
    "lng": 120.1477,
    "image": "/places/duanqiao.jpg",
    "blurb": "白堤东端的西湖十景之一，桥面和远山同框，是大多数人第一张西湖照片的地方。清晨人少，雪后或烟雨天更有气氛。",
    "tags": [
      "人文",
      "网红打卡"
    ],
    "zone": "西湖",
    "suburban": false,
    "type": "attraction",
    "fact_status": "sourced",
    "ticket_price": 0
  },
  {
    "id": "gushan",
    "city": "杭州",
    "name": "孤山公园",
    "lat": 30.254,
    "lng": 120.144,
    "image": "/places/westlake.jpg",
    "blurb": "西湖中最大的天然岛屿，东接白堤、西通西泠桥，里面是林间步行道、秋瑾墓和文人故迹，适合放慢脚步。",
    "tags": [
      "自然",
      "亲子"
    ],
    "zone": "西湖",
    "suburban": false,
    "type": "attraction",
    "fact_status": "sourced",
    "ticket_price": 0
  },
  {
    "id": "zjmuseum",
    "city": "杭州",
    "name": "浙江省博物馆（孤山馆区）",
    "lat": 30.2536,
    "lng": 120.1398,
    "image": "/places/westlake.jpg",
    "blurb": "就在孤山南麓，馆藏以浙江考古、青瓷和书画见长。不用另找一天，从孤山散步就能进门。",
    "tags": [
      "人文",
      "亲子"
    ],
    "zone": "西湖",
    "suburban": false,
    "type": "attraction",
    "fact_status": "sourced",
    "ticket_price": 0,
    "closed_weekdays": [
      0
    ]
  },
  {
    "id": "yuewang",
    "city": "杭州",
    "name": "岳王庙",
    "lat": 30.2545,
    "lng": 120.1375,
    "image": "/places/westlake.jpg",
    "blurb": "北山路旁纪念岳飞的祠庙，忠烈祠、墓园和秦桧跪像是最常被记住的几处，参观节奏比湖滨轻松。",
    "tags": [
      "人文"
    ],
    "zone": "西湖",
    "suburban": false,
    "type": "attraction",
    "fact_status": "sourced",
    "ticket_price": 25
  },
  {
    "id": "cruise",
    "city": "杭州",
    "name": "西湖游船",
    "lat": 30.2489,
    "lng": 120.154,
    "image": "/places/westlake.jpg",
    "blurb": "从湖滨一公园或中山公园码头上船，环湖看三潭印月，上岛线路的船票含三潭印月门票，是把湖面走通的最省事办法。",
    "tags": [
      "亲子",
      "自然"
    ],
    "zone": "西湖",
    "suburban": false,
    "type": "attraction",
    "fact_status": "sourced",
    "ticket_price": 55
  },
  {
    "id": "huagang",
    "city": "杭州",
    "name": "花港观鱼",
    "lat": 30.2298,
    "lng": 120.136,
    "image": "/places/westlake.jpg",
    "blurb": "苏堤南端的免费公园，红鱼池、牡丹园和大草坪适合带小孩停留，也常作为游船在花港码头下船后的第一站。",
    "tags": [
      "自然",
      "亲子"
    ],
    "zone": "西湖",
    "suburban": false,
    "type": "attraction",
    "fact_status": "sourced",
    "ticket_price": 0
  },
  {
    "id": "leifeng",
    "city": "杭州",
    "name": "雷峰塔",
    "lat": 30.232,
    "lng": 120.149,
    "image": "/places/leifeng.jpg",
    "blurb": "南岸的重建塔，登塔能把南湖、苏堤和三潭印月收进同一视野。遗址和《白蛇传》展览在塔内，不一定非要赶上日落。",
    "tags": [
      "人文"
    ],
    "zone": "西湖",
    "suburban": false,
    "type": "attraction",
    "fact_status": "sourced",
    "ticket_price": 40
  },
  {
    "id": "louwailou",
    "city": "杭州",
    "name": "楼外楼（孤山路店）",
    "lat": 30.2533,
    "lng": 120.1428,
    "image": "/places/louwailou.jpg",
    "blurb": "孤山路百年杭帮菜，西湖醋鱼和东坡肉是招牌，窗口正对湖面，味道和位置都在卖「老字号场景」。",
    "tags": [
      "饭馆",
      "美食"
    ],
    "zone": "西湖",
    "suburban": false,
    "type": "restaurant",
    "fact_status": "sourced",
    "price": 180
  },
  {
    "id": "tianwaitian",
    "city": "杭州",
    "name": "天外天（北山路）",
    "lat": 30.254,
    "lng": 120.1362,
    "image": "",
    "blurb": "岳王庙附近的老杭帮菜馆，东坡肉、叫化童鸡常被本地人点，位置比楼外楼稍离核心拍照点，用餐氛围更日常一些。",
    "tags": [
      "饭馆",
      "美食"
    ],
    "zone": "西湖",
    "suburban": false,
    "type": "restaurant",
    "fact_status": "sourced",
    "price": 120
  },
  {
    "id": "westlake-hotel",
    "city": "杭州",
    "name": "西湖国宾馆",
    "lat": 30.2478,
    "lng": 120.1375,
    "image": "",
    "blurb": "杨公堤一侧的园林式宾馆，出门就是西湖，适合想把住宿也算进湖景体验的人。",
    "tags": [
      "酒店"
    ],
    "zone": "西湖",
    "suburban": false,
    "type": "hotel",
    "fact_status": "sourced",
    "price": 900
  },
  {
    "id": "huxueyan",
    "city": "杭州",
    "name": "胡雪岩故居",
    "lat": 30.2394,
    "lng": 120.1736,
    "image": "/places/hefang.jpg",
    "blurb": "清河坊东侧的晚清红顶商人宅院，木雕、水池和厅堂保存完整，是河坊街一带少有的「真正进门看历史」的点。",
    "tags": [
      "人文"
    ],
    "zone": "湖滨吴山",
    "suburban": false,
    "type": "attraction",
    "fact_status": "sourced",
    "ticket_price": 20
  },
  {
    "id": "hefang",
    "city": "杭州",
    "name": "河坊街",
    "lat": 30.2405,
    "lng": 120.169,
    "image": "/places/hefang.jpg",
    "blurb": "清河坊历史街区，北接吴山、东连南宋御街，是杭州城南最集中的小吃、药铺和手作街，适合把午餐或晚饭放在这里。",
    "tags": [
      "美食",
      "购物"
    ],
    "zone": "湖滨吴山",
    "suburban": false,
    "type": "attraction",
    "fact_status": "sourced",
    "ticket_price": 0
  },
  {
    "id": "nansong-street",
    "city": "杭州",
    "name": "南宋御街",
    "lat": 30.243,
    "lng": 120.1695,
    "image": "/places/hefang.jpg",
    "blurb": "中山中路这一段保留了南宋都城的街道走向，石板路、骑楼和小型博物馆连在一起，比河坊街主街安静，适合饭后慢慢走。",
    "tags": [
      "人文",
      "购物"
    ],
    "zone": "湖滨吴山",
    "suburban": false,
    "type": "attraction",
    "fact_status": "sourced",
    "ticket_price": 0
  },
  {
    "id": "chenghuangge",
    "city": "杭州",
    "name": "吴山城隍阁",
    "lat": 30.2378,
    "lng": 120.1661,
    "image": "/places/hefang.jpg",
    "blurb": "吴山顶上的城隍阁，登阁能看钱塘江方向和上城区屋脊。山下十五奎巷、河坊街，爬一段石阶就能到。",
    "tags": [
      "人文",
      "网红打卡"
    ],
    "zone": "湖滨吴山",
    "suburban": false,
    "type": "attraction",
    "fact_status": "sourced",
    "ticket_price": 30
  },
  {
    "id": "wulin",
    "city": "杭州",
    "name": "武林夜市",
    "lat": 30.279,
    "lng": 120.162,
    "image": "",
    "blurb": "杭州传统的市区夜市，小吃和日用摊比较集中，适合把晚上留给市井而不是湖景。",
    "tags": [
      "美食",
      "购物"
    ],
    "zone": "湖滨吴山",
    "suburban": false,
    "type": "attraction",
    "fact_status": "sourced",
    "ticket_price": 0
  },
  {
    "id": "zhiweiguan",
    "city": "杭州",
    "name": "知味观（仁和路店）",
    "lat": 30.2565,
    "lng": 120.1705,
    "image": "",
    "blurb": "仁和路老店，片儿川、小笼和猫耳朵是更日常的杭州味道，早午餐都合适，不必非要进景区饭馆。",
    "tags": [
      "饭馆",
      "美食"
    ],
    "zone": "湖滨吴山",
    "suburban": false,
    "type": "restaurant",
    "fact_status": "sourced",
    "price": 80
  },
  {
    "id": "kuiyuanguan",
    "city": "杭州",
    "name": "奎元馆（解放路店）",
    "lat": 30.2532,
    "lng": 120.168,
    "image": "",
    "blurb": "以虾爆鳝面、片儿川出名的杭州面馆老字号，解放路店离湖滨和河坊都不远，一餐就能吃到本地午餐的节奏。",
    "tags": [
      "饭馆",
      "美食"
    ],
    "zone": "湖滨吴山",
    "suburban": false,
    "type": "restaurant",
    "fact_status": "sourced",
    "price": 50
  },
  {
    "id": "huangfaner",
    "city": "杭州",
    "name": "皇饭儿（高银街总店）",
    "lat": 30.2415,
    "lng": 120.1708,
    "image": "",
    "blurb": "河坊街旁边的杭帮菜老字号，乾隆御题「皇饭儿」的故事常被提起，东坡肉是最常点的招牌，比湖滨连锁店更有本地正餐的样子。",
    "tags": [
      "饭馆",
      "美食"
    ],
    "zone": "湖滨吴山",
    "suburban": false,
    "type": "restaurant",
    "fact_status": "sourced",
    "price": 75
  },
  {
    "id": "xinbailu",
    "city": "杭州",
    "name": "新白鹿（湖滨店）",
    "lat": 30.2548,
    "lng": 120.1638,
    "image": "",
    "blurb": "湖滨的杭帮家常连锁，菜品稳定、出菜快，适合赶行程的晚饭，但不是老字号体验。",
    "tags": [
      "饭馆",
      "美食"
    ],
    "zone": "湖滨吴山",
    "suburban": false,
    "type": "restaurant",
    "fact_status": "sourced",
    "price": 65
  },
  {
    "id": "waipojia",
    "city": "杭州",
    "name": "外婆家（西湖银泰店）",
    "lat": 30.2588,
    "lng": 120.1655,
    "image": "",
    "blurb": "浙江起源的连锁杭帮菜，银泰店离湖滨近，出菜快，适合赶时间，代表性不如老字号。",
    "tags": [
      "饭馆",
      "美食"
    ],
    "zone": "湖滨吴山",
    "suburban": false,
    "type": "restaurant",
    "fact_status": "sourced",
    "price": 60
  },
  {
    "id": "quanji-hz",
    "city": "杭州",
    "name": "全季酒店（湖滨店）",
    "lat": 30.2556,
    "lng": 120.1612,
    "image": "",
    "blurb": "湖滨一带的中档商务酒店，走路能到西湖东岸和湖滨商圈，双床房适合两人一间。",
    "tags": [
      "酒店"
    ],
    "zone": "湖滨吴山",
    "suburban": false,
    "type": "hotel",
    "fact_status": "sourced",
    "price": 420
  },
  {
    "id": "feilaifeng",
    "city": "杭州",
    "name": "飞来峰",
    "lat": 30.2408,
    "lng": 120.1,
    "image": "/places/lingyin.jpg",
    "blurb": "进灵隐寺之前的那座石灰岩山，溪边布满五代到宋元的石刻造像，冷泉溪一走，才是这条线真正的开始。",
    "tags": [
      "人文",
      "自然"
    ],
    "zone": "灵隐",
    "suburban": false,
    "type": "attraction",
    "fact_status": "sourced",
    "ticket_price": 0
  },
  {
    "id": "lingyin",
    "city": "杭州",
    "name": "灵隐寺",
    "lat": 30.241,
    "lng": 120.101,
    "image": "/places/lingyin.jpg",
    "blurb": "江南禅宗名刹，天王殿到大雄宝殿的中轴线很完整。现在与飞来峰实行「双免+预约」，不再分开买寺票和山门票。",
    "tags": [
      "人文"
    ],
    "zone": "灵隐",
    "suburban": false,
    "type": "attraction",
    "fact_status": "sourced",
    "ticket_price": 0
  },
  {
    "id": "yongfu",
    "city": "杭州",
    "name": "永福寺",
    "lat": 30.2433,
    "lng": 120.0958,
    "image": "/places/lingyin.jpg",
    "blurb": "灵隐寺西侧的寺院，庭院和坡地比大寺安静，适合在灵隐主殿看完后继续往里走，不必再另买票。",
    "tags": [
      "人文",
      "自然"
    ],
    "zone": "灵隐",
    "suburban": false,
    "type": "attraction",
    "fact_status": "sourced",
    "ticket_price": 0
  },
  {
    "id": "taoguang",
    "city": "杭州",
    "name": "韬光寺",
    "lat": 30.2475,
    "lng": 120.0961,
    "image": "/places/lingyin.jpg",
    "blurb": "从灵隐继续上山的寺院，「韬光观海」说的就是这里。台阶不少，到了以后比山下清静，能看见远处的城市和湖谷。",
    "tags": [
      "人文",
      "自然"
    ],
    "zone": "灵隐",
    "suburban": false,
    "type": "attraction",
    "fact_status": "sourced",
    "ticket_price": 0
  },
  {
    "id": "botanical",
    "city": "杭州",
    "name": "杭州植物园",
    "lat": 30.255,
    "lng": 120.1183,
    "image": "",
    "blurb": "桃源岭上的植物园，分类区和灵峰探梅都在园里，和灵隐同在西湖西北，适合把下午留给开敞绿地，尤其带小孩时。",
    "tags": [
      "自然",
      "亲子"
    ],
    "zone": "灵隐",
    "suburban": false,
    "type": "attraction",
    "fact_status": "sourced",
    "ticket_price": 10
  },
  {
    "id": "lingyin-zhai",
    "city": "杭州",
    "name": "灵隐寺随喜食堂",
    "lat": 30.2416,
    "lng": 120.099,
    "image": "",
    "blurb": "寺院一带的素面和素斋，味道朴素，胜在就近，能把灵隐当天的午餐留在片区内，不必折回湖滨。",
    "tags": [
      "饭馆",
      "美食"
    ],
    "zone": "灵隐",
    "suburban": false,
    "type": "restaurant",
    "fact_status": "sourced",
    "price": 40
  },
  {
    "id": "quanji-lingyin",
    "city": "杭州",
    "name": "全季酒店（杭州灵隐天竺店）",
    "lat": 30.2485,
    "lng": 120.1085,
    "image": "",
    "blurb": "按灵隐、天竺路一带中档商务酒店估算的住宿点，方便第二天继续向西或返回湖滨。",
    "tags": [
      "酒店"
    ],
    "zone": "灵隐",
    "suburban": false,
    "type": "hotel",
    "fact_status": "sourced",
    "price": 450
  },
  {
    "id": "xixi",
    "city": "杭州",
    "name": "西溪湿地（周家村）",
    "lat": 30.268,
    "lng": 120.07,
    "image": "/places/xixi.jpg",
    "blurb": "城市西边的国家湿地公园，芦苇、港汊和摇櫓船是主要印象。周家村是一期主入口，适合把这一天单独留给湿地，不要和西湖、灵隐挤在同一天。",
    "tags": [
      "自然",
      "亲子"
    ],
    "zone": "西溪",
    "suburban": true,
    "type": "attraction",
    "fact_status": "sourced",
    "ticket_price": 80
  },
  {
    "id": "xixi-boat",
    "city": "杭州",
    "name": "西溪电瓶船",
    "lat": 30.2682,
    "lng": 120.069,
    "image": "/places/xixi.jpg",
    "blurb": "周家村到深潭口一线的公交式电瓶船，把港汊里的烟水渔庄、秋雪庵串起来，比全程步行更适合亲子。",
    "tags": [
      "自然",
      "亲子"
    ],
    "zone": "西溪",
    "suburban": true,
    "type": "attraction",
    "fact_status": "sourced",
    "ticket_price": 60
  },
  {
    "id": "shentan",
    "city": "杭州",
    "name": "深潭口",
    "lat": 30.271,
    "lng": 120.0645,
    "image": "/places/xixi.jpg",
    "blurb": "一期游线东端的水埠，常作为电瓶船或摇櫓船的折返点，也是改步行去河渚街的交接处。",
    "tags": [
      "自然",
      "网红打卡"
    ],
    "zone": "西溪",
    "suburban": true,
    "type": "attraction",
    "fact_status": "sourced",
    "ticket_price": 0
  },
  {
    "id": "hezhu",
    "city": "杭州",
    "name": "河渚街",
    "lat": 30.2747,
    "lng": 120.0628,
    "image": "/places/xixi.jpg",
    "blurb": "西溪二期的水乡街巷，蒋村集市和商铺集中在这里，适合下船后走走、吃点心，再从北门方向离开。",
    "tags": [
      "美食",
      "购物",
      "亲子"
    ],
    "zone": "西溪",
    "suburban": true,
    "type": "attraction",
    "fact_status": "sourced",
    "ticket_price": 0
  },
  {
    "id": "hezhu-food",
    "city": "杭州",
    "name": "河渚街小吃",
    "lat": 30.2745,
    "lng": 120.0626,
    "image": "",
    "blurb": "河渚街和蒋村集市一带的点心、鱼鲜和茶饮，用来解决西溪当天的午餐，而不必折回市区。",
    "tags": [
      "饭馆",
      "美食"
    ],
    "zone": "西溪",
    "suburban": true,
    "type": "restaurant",
    "fact_status": "sourced",
    "price": 45
  },
  {
    "id": "quanji-xixi",
    "city": "杭州",
    "name": "全季酒店（杭州西溪湿地店）",
    "lat": 30.2755,
    "lng": 120.0705,
    "image": "",
    "blurb": "按西溪园区外围中档商务酒店估算，方便早入园，但演示更建议当天返回湖滨住宿。",
    "tags": [
      "酒店"
    ],
    "zone": "西溪",
    "suburban": true,
    "type": "hotel",
    "fact_status": "sourced",
    "price": 420
  },
  {
    "id": "gongchen",
    "city": "杭州",
    "name": "拱宸桥",
    "lat": 30.32,
    "lng": 120.142,
    "image": "/places/gongchen.jpg",
    "blurb": "京杭大运河南端的标志性石桥，桥西是博物馆群和直街，适合把一天留在运河，而不是和西湖上午连排。",
    "tags": [
      "人文",
      "自然"
    ],
    "zone": "运河",
    "suburban": false,
    "type": "attraction",
    "fact_status": "sourced",
    "ticket_price": 0
  },
  {
    "id": "canal-museum",
    "city": "杭州",
    "name": "杭州京杭大运河博物馆",
    "lat": 30.3219,
    "lng": 120.1447,
    "image": "/places/gongchen.jpg",
    "blurb": "拱宸桥旁的运河专题馆，把漕运、桥梁和沿岸生活说明白，是这一片区最适合亲子的室内点。",
    "tags": [
      "人文",
      "亲子"
    ],
    "zone": "运河",
    "suburban": false,
    "type": "attraction",
    "fact_status": "sourced",
    "ticket_price": 0,
    "closed_weekdays": [
      0
    ]
  },
  {
    "id": "qiaoxi",
    "city": "杭州",
    "name": "桥西直街",
    "lat": 30.3194,
    "lng": 120.139,
    "image": "/places/gongchen.jpg",
    "blurb": "拱宸桥西的沿河直街，民居、小店和博物馆入口混在一起，比河坊街生活气更重，适合饭前饭后散步。",
    "tags": [
      "人文",
      "购物"
    ],
    "zone": "运河",
    "suburban": false,
    "type": "attraction",
    "fact_status": "sourced",
    "ticket_price": 0
  },
  {
    "id": "gongmei",
    "city": "杭州",
    "name": "杭州工艺美术博物馆",
    "lat": 30.3169,
    "lng": 120.1375,
    "image": "/places/gongchen.jpg",
    "blurb": "小河路一带的博物馆群之一，展出刀剪、伞、扇等杭作工艺，比单纯走桥更适合带小孩停下来看。",
    "tags": [
      "人文",
      "亲子"
    ],
    "zone": "运河",
    "suburban": false,
    "type": "attraction",
    "fact_status": "sourced",
    "ticket_price": 0,
    "closed_weekdays": [
      0
    ]
  },
  {
    "id": "qiaoxi-food",
    "city": "杭州",
    "name": "桥西直街运河菜",
    "lat": 30.3196,
    "lng": 120.1393,
    "image": "",
    "blurb": "桥西直街、小河直街一带的运河边家常菜和点心，用来把运河当天的午餐留在片区内。",
    "tags": [
      "饭馆",
      "美食"
    ],
    "zone": "运河",
    "suburban": false,
    "type": "restaurant",
    "fact_status": "sourced",
    "price": 55
  },
  {
    "id": "quanji-gongchen",
    "city": "杭州",
    "name": "全季酒店（杭州运河拱宸桥店）",
    "lat": 30.3282,
    "lng": 120.1354,
    "image": "",
    "blurb": "拱墅花园岗街附近的全季酒店，去拱宸桥和运河博物馆方便，适合把住宿放在运河南端。",
    "tags": [
      "酒店"
    ],
    "zone": "运河",
    "suburban": false,
    "type": "hotel",
    "fact_status": "sourced",
    "price": 400
  },
  {
    "id": "wuhou",
    "city": "成都",
    "name": "武侯祠",
    "lat": 30.646,
    "lng": 104.047,
    "image": "/places/wuhou.jpg",
    "blurb": "纪念诸葛亮的君臣合祀祠庙，惠陵也在同一票里。和锦里只隔一墙，适合把武侯放上午、锦里放傍晚，不要拆成两天。",
    "tags": [
      "人文"
    ],
    "zone": "武侯锦里",
    "suburban": false,
    "type": "attraction",
    "fact_status": "sourced",
    "ticket_price": 50
  },
  {
    "id": "jinli",
    "city": "成都",
    "name": "锦里古街",
    "lat": 30.645,
    "lng": 104.045,
    "image": "/places/jinli.jpg",
    "blurb": "武侯祠西侧的仿古街，小吃、纪念品和夜间灯笼是主要体验。短、密、好逛，但价格和味道都偏游客区。",
    "tags": [
      "美食",
      "购物"
    ],
    "zone": "武侯锦里",
    "suburban": false,
    "type": "attraction",
    "fact_status": "sourced",
    "ticket_price": 0
  },
  {
    "id": "nanjiao",
    "city": "成都",
    "name": "南郊公园",
    "lat": 30.6408,
    "lng": 104.0462,
    "image": "/places/wuhou.jpg",
    "blurb": "武侯祠南边的公园，树多、路平，适合在祠庙和锦里之间留一段户外休息，尤其带小孩时。",
    "tags": [
      "自然",
      "亲子"
    ],
    "zone": "武侯锦里",
    "suburban": false,
    "type": "attraction",
    "fact_status": "sourced",
    "ticket_price": 0
  },
  {
    "id": "huaxiba",
    "city": "成都",
    "name": "华西坝",
    "lat": 30.6438,
    "lng": 104.0655,
    "image": "",
    "blurb": "四川大学华西校园一带的林荫道和早期建筑，被叫做华西坝，适合作为武侯、锦里之后往城东方向的一段散步。",
    "tags": [
      "人文",
      "网红打卡"
    ],
    "zone": "武侯锦里",
    "suburban": false,
    "type": "attraction",
    "fact_status": "sourced",
    "ticket_price": 0
  },
  {
    "id": "jinli-food",
    "city": "成都",
    "name": "锦里小吃",
    "lat": 30.6452,
    "lng": 104.0448,
    "image": "/places/jinli.jpg",
    "blurb": "锦里街上的三大炮、钵钵鸡、冰粉和现做小吃，用来把武侯当天的一餐留在片区内。",
    "tags": [
      "饭馆",
      "美食"
    ],
    "zone": "武侯锦里",
    "suburban": false,
    "type": "restaurant",
    "fact_status": "sourced",
    "price": 50
  },
  {
    "id": "quanji-wh",
    "city": "成都",
    "name": "全季酒店（成都武侯祠店）",
    "lat": 30.6475,
    "lng": 104.049,
    "image": "",
    "blurb": "按武侯祠、浆洗街一带中档商务酒店估算，方便走祠庙和锦里。",
    "tags": [
      "酒店"
    ],
    "zone": "武侯锦里",
    "suburban": false,
    "type": "hotel",
    "fact_status": "sourced",
    "price": 400
  },
  {
    "id": "kuanzhai",
    "city": "成都",
    "name": "宽窄巷子",
    "lat": 30.672,
    "lng": 104.055,
    "image": "/places/kuanzhai.jpg",
    "blurb": "少城留下的宽巷、窄巷、井巷三条街，茶馆、院落和照相铺混在一起，是成都最常见的城市名片，也是人最多的地方之一。",
    "tags": [
      "美食",
      "网红打卡",
      "购物"
    ],
    "zone": "少城宽窄",
    "suburban": false,
    "type": "attraction",
    "fact_status": "sourced",
    "ticket_price": 0
  },
  {
    "id": "renmin-park",
    "city": "成都",
    "name": "人民公园",
    "lat": 30.6608,
    "lng": 104.0619,
    "image": "",
    "blurb": "少城南边的市井公园，茶座、鹤鸣茶社和周末的相亲角比任何购物街都更像成都日常生活。",
    "tags": [
      "自然",
      "亲子"
    ],
    "zone": "少城宽窄",
    "suburban": false,
    "type": "attraction",
    "fact_status": "sourced",
    "ticket_price": 0
  },
  {
    "id": "pingan-church",
    "city": "成都",
    "name": "平安桥天主堂",
    "lat": 30.67,
    "lng": 104.0622,
    "image": "",
    "blurb": "少城平安桥附近的天主教堂，砖石立面很安静，是宽窄巷子和人民公园之间一段不拥挤的路过点。",
    "tags": [
      "人文"
    ],
    "zone": "少城宽窄",
    "suburban": false,
    "type": "attraction",
    "fact_status": "sourced",
    "ticket_price": 0
  },
  {
    "id": "wenshu",
    "city": "成都",
    "name": "文殊院",
    "lat": 30.6775,
    "lng": 104.0742,
    "image": "",
    "blurb": "成都城里最完整的汉传寺院之一，庭院和禅林比宽窄巷子清静，也常被用来吃一顿寺内素餐。",
    "tags": [
      "人文"
    ],
    "zone": "少城宽窄",
    "suburban": false,
    "type": "attraction",
    "fact_status": "sourced",
    "ticket_price": 0
  },
  {
    "id": "mapo",
    "city": "成都",
    "name": "陈麻婆豆腐（西玉龙街）",
    "lat": 30.6715,
    "lng": 104.0722,
    "image": "",
    "blurb": "麻婆豆腐的老字号门店，西玉龙街这一家更常被当成「来成都要吃一次」的坐标，菜不多，关键就是那一碗豆腐。",
    "tags": [
      "饭馆",
      "美食"
    ],
    "zone": "少城宽窄",
    "suburban": false,
    "type": "restaurant",
    "fact_status": "sourced",
    "price": 55
  },
  {
    "id": "zhongshuijiao",
    "city": "成都",
    "name": "钟水饺（人民公园总店）",
    "lat": 30.661,
    "lng": 104.062,
    "image": "",
    "blurb": "人民公园边上的钟水饺总店，红油饺子和抄手是成都老字号快餐的代表，适合早餐或简单午餐。",
    "tags": [
      "饭馆",
      "美食"
    ],
    "zone": "少城宽窄",
    "suburban": false,
    "type": "restaurant",
    "fact_status": "sourced",
    "price": 35
  },
  {
    "id": "shudaxia",
    "city": "成都",
    "name": "蜀大侠火锅（宽窄附近）",
    "lat": 30.6698,
    "lng": 104.0536,
    "image": "",
    "blurb": "宽窄巷子附近的中档火锅，适合把晚饭放在少城，不过它是连锁品牌，不是老字号。",
    "tags": [
      "饭馆",
      "美食"
    ],
    "zone": "少城宽窄",
    "suburban": false,
    "type": "restaurant",
    "fact_status": "sourced",
    "price": 110
  },
  {
    "id": "quanji-cd",
    "city": "成都",
    "name": "全季酒店（长顺街店）",
    "lat": 30.6742,
    "lng": 104.0528,
    "image": "",
    "blurb": "长顺街的全季酒店，离宽窄巷子近，双床房适合两人一间，也适合作为成都市区的默认住宿。",
    "tags": [
      "酒店"
    ],
    "zone": "少城宽窄",
    "suburban": false,
    "type": "hotel",
    "fact_status": "sourced",
    "price": 380
  },
  {
    "id": "dufu",
    "city": "成都",
    "name": "杜甫草堂",
    "lat": 30.665,
    "lng": 104.023,
    "image": "/places/dufu.jpg",
    "blurb": "杜甫留居成都时的故居园林，亭阁、溪水和碑刻比想象中更像一座安静的公园，适合把上午留给这里。",
    "tags": [
      "人文"
    ],
    "zone": "草堂青羊",
    "suburban": false,
    "type": "attraction",
    "fact_status": "sourced",
    "ticket_price": 50
  },
  {
    "id": "huanhuaxi",
    "city": "成都",
    "name": "浣花溪公园",
    "lat": 30.6628,
    "lng": 104.0247,
    "image": "/places/dufu.jpg",
    "blurb": "草堂和四川博物院之间的大面积绿地，沿溪步道适合放风、拍照，把两座收费或预约场馆连起来。",
    "tags": [
      "自然",
      "亲子"
    ],
    "zone": "草堂青羊",
    "suburban": false,
    "type": "attraction",
    "fact_status": "sourced",
    "ticket_price": 0
  },
  {
    "id": "sc-museum",
    "city": "成都",
    "name": "四川博物院",
    "lat": 30.6614,
    "lng": 104.0322,
    "image": "",
    "blurb": "青华路 5 号，张大千、巴蜀青铜和汉唐文物都在这里，是草堂片区最值得预留的室内馆，也与浣花溪步行可及。",
    "tags": [
      "人文",
      "亲子"
    ],
    "zone": "草堂青羊",
    "suburban": false,
    "type": "attraction",
    "fact_status": "sourced",
    "ticket_price": 0,
    "closed_weekdays": [
      0
    ]
  },
  {
    "id": "qingyang",
    "city": "成都",
    "name": "青羊宫",
    "lat": 30.6603,
    "lng": 104.0283,
    "image": "",
    "blurb": "成都最重要的道教宫观之一，三清殿和铜羊是标志。规模不大，和草堂、川博排在同一天下午刚刚好。",
    "tags": [
      "人文"
    ],
    "zone": "草堂青羊",
    "suburban": false,
    "type": "attraction",
    "fact_status": "sourced",
    "ticket_price": 10
  },
  {
    "id": "hongxing-qy",
    "city": "成都",
    "name": "红杏酒家（送仙桥一带）",
    "lat": 30.6626,
    "lng": 104.0335,
    "image": "",
    "blurb": "草堂、青羊宫附近可选的成都本地中档川菜品牌，宫保、沸腾类家常菜比较稳，用来把午餐留在片区内。",
    "tags": [
      "饭馆",
      "美食"
    ],
    "zone": "草堂青羊",
    "suburban": false,
    "type": "restaurant",
    "fact_status": "sourced",
    "price": 80
  },
  {
    "id": "atour-caotang",
    "city": "成都",
    "name": "亚朵酒店（成都青羊宫/浣花溪）",
    "lat": 30.666,
    "lng": 104.0285,
    "image": "",
    "blurb": "按青羊宫、草堂路一带中档酒店估算，方便早看草堂。",
    "tags": [
      "酒店"
    ],
    "zone": "草堂青羊",
    "suburban": false,
    "type": "hotel",
    "fact_status": "sourced",
    "price": 400
  },
  {
    "id": "cd-museum",
    "city": "成都",
    "name": "成都博物馆",
    "lat": 30.658,
    "lng": 104.0635,
    "image": "",
    "blurb": "天府广场西侧的市博，影雕、展陈和亲子区域都很完整，适合把春熙这一天的上午放在室内，下午再去太古里。",
    "tags": [
      "人文",
      "亲子"
    ],
    "zone": "春熙太古里",
    "suburban": false,
    "type": "attraction",
    "fact_status": "sourced",
    "ticket_price": 0,
    "closed_weekdays": [
      0
    ]
  },
  {
    "id": "tianfu",
    "city": "成都",
    "name": "天府广场",
    "lat": 30.6572,
    "lng": 104.0658,
    "image": "",
    "blurb": "成都地理中心，毛泽东像和地铁枢纽都在这里，本身不必停留太久，但和成都博物馆是同一组点。",
    "tags": [
      "网红打卡"
    ],
    "zone": "春熙太古里",
    "suburban": false,
    "type": "attraction",
    "fact_status": "sourced",
    "ticket_price": 0
  },
  {
    "id": "chunxi",
    "city": "成都",
    "name": "春熙路",
    "lat": 30.652,
    "lng": 104.076,
    "image": "/places/chunxi.jpg",
    "blurb": "成都最密的商业步行街，从地铁口走到 IFS 和太古里只是一段路，适合傍晚把购物和晚饭放在一起。",
    "tags": [
      "购物",
      "网红打卡"
    ],
    "zone": "春熙太古里",
    "suburban": false,
    "type": "attraction",
    "fact_status": "sourced",
    "ticket_price": 0
  },
  {
    "id": "ifs-panda",
    "city": "成都",
    "name": "IFS 爬墙熊猫",
    "lat": 30.656,
    "lng": 104.0788,
    "image": "/places/chunxi.jpg",
    "blurb": "国际金融中心墙上的大熊猫雕塑，是春熙路最明确的打卡坐标，几分钟就能拍完，但值得单独标出来。",
    "tags": [
      "网红打卡",
      "亲子"
    ],
    "zone": "春熙太古里",
    "suburban": false,
    "type": "attraction",
    "fact_status": "sourced",
    "ticket_price": 0
  },
  {
    "id": "taikooli",
    "city": "成都",
    "name": "成都太古里",
    "lat": 30.6547,
    "lng": 104.0815,
    "image": "/places/chunxi.jpg",
    "blurb": "大慈寺旁的开放式购物街区，和春熙路相邻却更整齐，也是晚饭后散步的常用收尾。",
    "tags": [
      "购物",
      "网红打卡"
    ],
    "zone": "春熙太古里",
    "suburban": false,
    "type": "attraction",
    "fact_status": "sourced",
    "ticket_price": 0
  },
  {
    "id": "laitangyuan",
    "city": "成都",
    "name": "赖汤圆（总府路）",
    "lat": 30.655,
    "lng": 104.077,
    "image": "",
    "blurb": "总府路一带的赖汤圆老字号，黑芝麻馅和豆花是更日常的成都甜食，适合当作春熙日的早餐或饭后点心。",
    "tags": [
      "饭馆",
      "美食"
    ],
    "zone": "春熙太古里",
    "suburban": false,
    "type": "restaurant",
    "fact_status": "sourced",
    "price": 25
  },
  {
    "id": "pansunshi",
    "city": "成都",
    "name": "盘飧市（春熙/总府一带）",
    "lat": 30.6555,
    "lng": 104.0745,
    "image": "",
    "blurb": "成都老字号食堂风格的便餐，钟水饺、甜皮鸭和各种小菜可以一次点齐，比商场餐厅更能代表本地午餐。",
    "tags": [
      "饭馆",
      "美食"
    ],
    "zone": "春熙太古里",
    "suburban": false,
    "type": "restaurant",
    "fact_status": "sourced",
    "price": 60
  },
  {
    "id": "xiaolongkan",
    "city": "成都",
    "name": "小龙坎火锅（春熙路店）",
    "lat": 30.6542,
    "lng": 104.0785,
    "image": "",
    "blurb": "春熙路的连锁火锅店，方便、好找，但全国门店很多，不能当作成都饮食的代表。",
    "tags": [
      "饭馆",
      "美食"
    ],
    "zone": "春熙太古里",
    "suburban": false,
    "type": "restaurant",
    "fact_status": "sourced",
    "price": 100
  },
  {
    "id": "atour-cd",
    "city": "成都",
    "name": "亚朵酒店（盐市口店）",
    "lat": 30.6536,
    "lng": 104.0794,
    "image": "",
    "blurb": "春熙路、太古里旁边的亚朵，逛完可以走回酒店，适合把市区住宿放在东大街一侧。",
    "tags": [
      "酒店"
    ],
    "zone": "春熙太古里",
    "suburban": false,
    "type": "hotel",
    "fact_status": "sourced",
    "price": 520
  },
  {
    "id": "panda",
    "city": "成都",
    "name": "成都大熊猫繁育研究基地",
    "lat": 30.735,
    "lng": 104.147,
    "image": "/places/panda.jpg",
    "blurb": "看大熊猫最稳妥的一处，园区大、要走路。务必把这一天单独留给基地，不要再混排宽窄或武侯。",
    "tags": [
      "亲子",
      "自然"
    ],
    "zone": "熊猫基地",
    "suburban": true,
    "type": "attraction",
    "fact_status": "sourced",
    "ticket_price": 55
  },
  {
    "id": "panda-moon",
    "city": "成都",
    "name": "月亮产房",
    "lat": 30.7382,
    "lng": 104.1455,
    "image": "/places/panda.jpg",
    "blurb": "园区里较常看到幼年熊猫的区域之一，和太阳产房、熊猫博物馆一起构成基地当天的步行主线。",
    "tags": [
      "亲子",
      "自然"
    ],
    "zone": "熊猫基地",
    "suburban": true,
    "type": "attraction",
    "fact_status": "sourced",
    "ticket_price": 0
  },
  {
    "id": "panda-sun",
    "city": "成都",
    "name": "太阳产房",
    "lat": 30.733,
    "lng": 104.1492,
    "image": "/places/panda.jpg",
    "blurb": "另一处主要的大熊猫活动场，建议按园内指示与月亮产房错开路线，避免来回走。",
    "tags": [
      "亲子",
      "自然"
    ],
    "zone": "熊猫基地",
    "suburban": true,
    "type": "attraction",
    "fact_status": "sourced",
    "ticket_price": 0
  },
  {
    "id": "panda-museum",
    "city": "成都",
    "name": "熊猫博物馆",
    "lat": 30.736,
    "lng": 104.148,
    "image": "/places/panda.jpg",
    "blurb": "把熊猫保护和繁殖说明白的室内馆，适合中午前后避阳，也适合给小孩补一点背景。",
    "tags": [
      "亲子",
      "人文"
    ],
    "zone": "熊猫基地",
    "suburban": true,
    "type": "attraction",
    "fact_status": "sourced",
    "ticket_price": 0
  },
  {
    "id": "panda-canteen",
    "city": "成都",
    "name": "熊猫基地园区食堂",
    "lat": 30.7352,
    "lng": 104.1468,
    "image": "",
    "blurb": "基地园内的简单食堂和快餐，用来把熊猫当天的午餐留在片区内，不必中途回城。",
    "tags": [
      "饭馆",
      "美食"
    ],
    "zone": "熊猫基地",
    "suburban": true,
    "type": "restaurant",
    "fact_status": "sourced",
    "price": 40
  },
  {
    "id": "bell",
    "city": "西安",
    "name": "钟楼",
    "lat": 34.261,
    "lng": 108.942,
    "image": "/places/bell.jpg",
    "blurb": "明城墙里的城市原点，四条大街在这里交汇。登楼主要是为了看格局，不必停留过久。",
    "tags": [
      "人文"
    ],
    "zone": "明城墙内",
    "suburban": false,
    "type": "attraction",
    "fact_status": "sourced",
    "ticket_price": 30
  },
  {
    "id": "gulou",
    "city": "西安",
    "name": "鼓楼",
    "lat": 34.2617,
    "lng": 108.9394,
    "image": "/places/bell.jpg",
    "blurb": "钟楼西侧的鼓楼，楼下就是北院门和回民街入口，登楼视野对着城隍庙和巷道，适合和钟楼打联票。",
    "tags": [
      "人文"
    ],
    "zone": "明城墙内",
    "suburban": false,
    "type": "attraction",
    "fact_status": "sourced",
    "ticket_price": 30
  },
  {
    "id": "muslim",
    "city": "西安",
    "name": "回民街（北院门）",
    "lat": 34.262,
    "lng": 108.937,
    "image": "/places/muslim.jpg",
    "blurb": "北院门一带最出名的回坊主街，肉夹馍、泡馍、甑糕的招牌很密，也是游客陷阱最集中的一段。",
    "tags": [
      "美食"
    ],
    "zone": "明城墙内",
    "suburban": false,
    "type": "attraction",
    "fact_status": "sourced",
    "ticket_price": 0
  },
  {
    "id": "sajinqiao",
    "city": "西安",
    "name": "洒金桥",
    "lat": 34.2635,
    "lng": 108.9335,
    "image": "/places/muslim.jpg",
    "blurb": "回坊西侧更生活化的一条街，油茶麻花、酸汤水饺和甑糕常被本地人提起，用来对照北院门主街的游客区。",
    "tags": [
      "美食"
    ],
    "zone": "明城墙内",
    "suburban": false,
    "type": "attraction",
    "fact_status": "sourced",
    "ticket_price": 0
  },
  {
    "id": "wall",
    "city": "西安",
    "name": "西安城墙（永宁门）",
    "lat": 34.254,
    "lng": 108.946,
    "image": "/places/wall.jpg",
    "blurb": "中国保存最完整的古城墙之一，永宁门是最常用的登城口。可以骑行一圈，也可以只走南门到文昌门的一段。",
    "tags": [
      "人文",
      "自然"
    ],
    "zone": "明城墙内",
    "suburban": false,
    "type": "attraction",
    "fact_status": "sourced",
    "ticket_price": 54
  },
  {
    "id": "beilin",
    "city": "西安",
    "name": "西安碑林博物馆",
    "lat": 34.2553,
    "lng": 108.9528,
    "image": "",
    "blurb": "孔庙和碑石集中地，石台孝经、颜柳欧褚的刻石是主线。在城墙东南靠近，适合不想只逛街的人把文化点补上。",
    "tags": [
      "人文"
    ],
    "zone": "明城墙内",
    "suburban": false,
    "type": "attraction",
    "fact_status": "sourced",
    "ticket_price": 85
  },
  {
    "id": "yongxingfang",
    "city": "西安",
    "name": "永兴坊",
    "lat": 34.2588,
    "lng": 108.9647,
    "image": "",
    "blurb": "明城墙东侧附近的非遗美食坊，摔碗酒和各地陕西小吃集中，热闹，也偏表演化。",
    "tags": [
      "美食",
      "购物"
    ],
    "zone": "明城墙内",
    "suburban": false,
    "type": "attraction",
    "fact_status": "sourced",
    "ticket_price": 0
  },
  {
    "id": "tongshengxiang",
    "city": "西安",
    "name": "同盛祥（钟楼店）",
    "lat": 34.2634,
    "lng": 108.9432,
    "image": "",
    "blurb": "钟楼附近的牛羊肉泡馍老字号，自己掰馍更入味，是城墙内比回民街摊位更稳的一顿正餐。",
    "tags": [
      "饭馆",
      "美食"
    ],
    "zone": "明城墙内",
    "suburban": false,
    "type": "restaurant",
    "fact_status": "sourced",
    "price": 55
  },
  {
    "id": "laosunjia",
    "city": "西安",
    "name": "老孙家（北院门）",
    "lat": 34.2641,
    "lng": 108.9396,
    "image": "",
    "blurb": "回民街边上的泡馍老店，名气大，位置方便，价格和体验都更偏游客区。",
    "tags": [
      "饭馆",
      "美食"
    ],
    "zone": "明城墙内",
    "suburban": false,
    "type": "restaurant",
    "fact_status": "sourced",
    "price": 58
  },
  {
    "id": "chunfasheng",
    "city": "西安",
    "name": "春发生（南院门）",
    "lat": 34.2576,
    "lng": 108.9478,
    "image": "",
    "blurb": "南院门附近的葫芦头泡馍老字号，和羊肉泡馍不是同一道菜，适合想在钟楼南边换一种口味的人。",
    "tags": [
      "饭馆",
      "美食"
    ],
    "zone": "明城墙内",
    "suburban": false,
    "type": "restaurant",
    "fact_status": "sourced",
    "price": 45
  },
  {
    "id": "defachang",
    "city": "西安",
    "name": "德发长（钟楼）",
    "lat": 34.2605,
    "lng": 108.9435,
    "image": "",
    "blurb": "钟楼附近以饺子出名的老字号，种类多，适合不想全员只吃泡馍、又想留在城墙内的一餐。",
    "tags": [
      "饭馆",
      "美食"
    ],
    "zone": "明城墙内",
    "suburban": false,
    "type": "restaurant",
    "fact_status": "sourced",
    "price": 50
  },
  {
    "id": "quanji-xa",
    "city": "西安",
    "name": "全季酒店（南大街店）",
    "lat": 34.2598,
    "lng": 108.9472,
    "image": "",
    "blurb": "钟楼南边的全季酒店，去城墙、南院门和钟楼都近，适合作为西安城区的默认住宿。",
    "tags": [
      "酒店"
    ],
    "zone": "明城墙内",
    "suburban": false,
    "type": "hotel",
    "fact_status": "sourced",
    "price": 360
  },
  {
    "id": "meiju-xa",
    "city": "西安",
    "name": "美居酒店（北院门店）",
    "lat": 34.2584,
    "lng": 108.9402,
    "image": "",
    "blurb": "鼓楼、北院门附近的美居，晚饭后走路就能回，适合把住宿放在回坊一侧。",
    "tags": [
      "酒店"
    ],
    "zone": "明城墙内",
    "suburban": false,
    "type": "hotel",
    "fact_status": "sourced",
    "price": 480
  },
  {
    "id": "museum",
    "city": "西安",
    "name": "陕西历史博物馆",
    "lat": 34.223,
    "lng": 108.958,
    "image": "/places/museum.jpg",
    "blurb": "小寨东路 91 号，周秦汉唐文物最集中的一处，何家村窖藏几乎是必看。要提前抢票，不要指望当天现场进入。",
    "tags": [
      "人文",
      "亲子"
    ],
    "zone": "曲江/小寨",
    "suburban": false,
    "type": "attraction",
    "fact_status": "sourced",
    "ticket_price": 0,
    "closed_weekdays": [
      0
    ]
  },
  {
    "id": "tang",
    "city": "西安",
    "name": "大雁塔",
    "lat": 34.218,
    "lng": 108.964,
    "image": "/places/wildgoose.jpg",
    "blurb": "大慈恩寺里的唐塔，是曲江的地标。只看寺院和塔身、或再登塔，是两种完全不同的停留时间；夜间灯光在北广场和不夜城一侧看，不必再进寺。",
    "tags": [
      "人文",
      "亲子"
    ],
    "zone": "曲江/小寨",
    "suburban": false,
    "type": "attraction",
    "fact_status": "sourced",
    "ticket_price": 35
  },
  {
    "id": "dayan-square",
    "city": "西安",
    "name": "大雁塔北广场",
    "lat": 34.221,
    "lng": 108.9642,
    "image": "/places/tang.jpg",
    "blurb": "塔北的免费广场，音乐喷泉是最明确的停留理由，也是连接陕历博和大雁塔的步行缓冲带。",
    "tags": [
      "亲子",
      "网红打卡"
    ],
    "zone": "曲江/小寨",
    "suburban": false,
    "type": "attraction",
    "fact_status": "sourced",
    "ticket_price": 0
  },
  {
    "id": "buyecheng",
    "city": "西安",
    "name": "大唐不夜城",
    "lat": 34.2158,
    "lng": 108.964,
    "image": "/places/tang.jpg",
    "blurb": "大雁塔南面的步行街，雕塑、铺面和夜间灯光是主体。白天可以过，真正该留的是晚饭后这一段。",
    "tags": [
      "人文",
      "网红打卡",
      "亲子"
    ],
    "zone": "曲江/小寨",
    "suburban": false,
    "type": "attraction",
    "fact_status": "sourced",
    "ticket_price": 0
  },
  {
    "id": "xiaoyanta",
    "city": "西安",
    "name": "西安博物院（小雁塔）",
    "lat": 34.2394,
    "lng": 108.9411,
    "image": "",
    "blurb": "荐福寺小雁塔和西安博物院在同一个园子里，比大雁塔安静，也免费，适合作为曲江/小寨日的补充或陕历博约满时的备选。",
    "tags": [
      "人文",
      "亲子"
    ],
    "zone": "曲江/小寨",
    "suburban": false,
    "type": "attraction",
    "fact_status": "sourced",
    "ticket_price": 0,
    "closed_weekdays": [
      0
    ]
  },
  {
    "id": "furongyuan",
    "city": "西安",
    "name": "大唐芙蓉园",
    "lat": 34.2089,
    "lng": 108.9728,
    "image": "",
    "blurb": "曲江的大型唐风主题园，晚上灯光和演出是主要理由。门票偏高，不是这条线的必选项。",
    "tags": [
      "人文",
      "亲子"
    ],
    "zone": "曲江/小寨",
    "suburban": false,
    "type": "attraction",
    "fact_status": "sourced",
    "ticket_price": 120
  },
  {
    "id": "shanxishi",
    "city": "西安",
    "name": "陕拾叁（大唐不夜城一带）",
    "lat": 34.2162,
    "lng": 108.9638,
    "image": "",
    "blurb": "大雁塔、不夜城附近的陕西菜餐厅，锅盔、脍和分量都更像正餐，适合把曲江当天的晚餐留在片区内。",
    "tags": [
      "饭馆",
      "美食"
    ],
    "zone": "曲江/小寨",
    "suburban": false,
    "type": "restaurant",
    "fact_status": "sourced",
    "price": 90
  },
  {
    "id": "xiaozhai-noodle",
    "city": "西安",
    "name": "小寨陕西面食",
    "lat": 34.2245,
    "lng": 108.953,
    "image": "",
    "blurb": "小寨、陕历博周边的 biangbiang 面、肉夹馍和凉皮，用来给参观博物馆的人一顿快、热、便宜的午餐。",
    "tags": [
      "饭馆",
      "美食"
    ],
    "zone": "曲江/小寨",
    "suburban": false,
    "type": "restaurant",
    "fact_status": "sourced",
    "price": 35
  },
  {
    "id": "quanji-dayanta",
    "city": "西安",
    "name": "全季酒店（西安大雁塔店）",
    "lat": 34.22,
    "lng": 108.961,
    "image": "",
    "blurb": "按大雁塔、小寨一带中档商务酒店估算，方便早去陕历博或晚回不夜城。",
    "tags": [
      "酒店"
    ],
    "zone": "曲江/小寨",
    "suburban": false,
    "type": "hotel",
    "fact_status": "sourced",
    "price": 400
  },
  {
    "id": "terracotta",
    "city": "西安",
    "name": "秦始皇兵马俑博物馆",
    "lat": 34.384,
    "lng": 109.278,
    "image": "/places/terracotta.jpg",
    "blurb": "一号坑是最震撼的部分，二号、三号坑规模较小但内容不同。这一天只留给临潼，不要再塞城墙或回民街。",
    "tags": [
      "人文",
      "亲子"
    ],
    "zone": "临潼",
    "suburban": true,
    "type": "attraction",
    "fact_status": "sourced",
    "ticket_price": 120
  },
  {
    "id": "lishanyuan",
    "city": "西安",
    "name": "丽山园（铜车马）",
    "lat": 34.3818,
    "lng": 109.256,
    "image": "/places/terracotta.jpg",
    "blurb": "秦始皇陵园范围内的考古遗址公园，铜车马是这里最值得看的一组，和俑坑不在同一片场地，需要单独留时间。",
    "tags": [
      "人文",
      "亲子"
    ],
    "zone": "临潼",
    "suburban": true,
    "type": "attraction",
    "fact_status": "sourced",
    "ticket_price": 0
  },
  {
    "id": "huaqing",
    "city": "西安",
    "name": "华清宫",
    "lat": 34.2472,
    "lng": 109.2119,
    "image": "",
    "blurb": "骊山脚下的唐离宫，温泉、御汤和西安事变旧址叠在同一园里。和兵马俑同属临潼，适合放在下午，但不要指望再赶回城区赶场。",
    "tags": [
      "人文"
    ],
    "zone": "临潼",
    "suburban": true,
    "type": "attraction",
    "fact_status": "sourced",
    "ticket_price": 120
  },
  {
    "id": "lintong-canteen",
    "city": "西安",
    "name": "临潼景区餐饮",
    "lat": 34.3842,
    "lng": 109.2765,
    "image": "",
    "blurb": "兵马俑出园后的午餐点，图的是把这一餐留在临潼，避免中午往返市区。",
    "tags": [
      "饭馆",
      "美食"
    ],
    "zone": "临潼",
    "suburban": true,
    "type": "restaurant",
    "fact_status": "sourced",
    "price": 50
  }
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
