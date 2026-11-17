# 城市目录

三份 JSON 来自内容包 v1（2026-11-10），字段名保持原样，加载器不改名。

| 文件 | 内容 |
| --- | --- |
| `hangzhou.json` / `chengdu.json` / `xian.json` | 片区 `zones` 与点位 `places` |
| `itineraries.json` | 分片区动线稿和三城 3 日演示顺序。排程用它决定每天去哪、先去哪；交通时长和费用按距离重算，不照抄稿里的步行/公交交替 |

## 目录字段 → 行程契约

- `type=attraction` 排成景点。`ticket_price` 是人均门票，汇总为 `ticket_price × 人数`。
- `type=restaurant` 排成 `meal`。`price` 只是人均参考（楼外楼约 180），计入总账的是餐标：省钱 35、紧凑 50、松弛 70。餐这项 `fact_status=estimated`。
- `type=hotel` 不排进当天时间线。`price` 是元/间夜。只有请求 `budget_includes_hotel=true` 时，才把默认城区酒店（杭州 `quanji-hz`、成都 `quanji-cd`、西安 `quanji-xa`）按「每间 2 人向上取整 × (天数-1)」加进行程总账。远郊当天仍回这间城区酒店，不在西溪或熊猫基地过夜。
- `zone` + `suburban` 必填。同一天的景点和餐都在同一个片区；`suburban=true` 的片区不和城区混排。
- `fact_status` 是点位身份（目录内为 `sourced`）。`price_status` 仍用目录里的 `sourced` / `estimate`，只说明票价或人均是否为估算，不写进行程 JSON。
- `closed_weekdays`：0 是周一。陕西历史博物馆为 `[0]`。
- `duration_min` 是缩放前的建议停留。动线稿里的 `duration_min` 已经按风格缩过，排程沿用稿上的时长。
- `blurb` 与 `description` 相同，无文案模型时用作介绍。`tips` 和 `hours_note` 写入行程提示。`sources` 原样带上。

## 交通

- 同一片区直线距离小于 1.2 km：步行，0 元，时长 = 距离 / 4.5 km/h。
- 否则市内公交：速度 25 km/h，另加 15 分钟，每人 4 元。
- 远郊进出城：固定 60 分钟、每人 40 元，不按市内单价。
- `terracotta` 与 `lishanyuan` 相邻时：免费摆渡 20 分钟、0 元。

## 短名

请求里的必去先对 `id` / `name`，再对下面几个短名：`西溪`→`xixi`，`灵隐`→`lingyin`，`熊猫基地`→`panda`，`兵马俑`→`terracotta`，`陕历博`→`museum`，`不夜城` / `大唐不夜城`→`buyecheng`。对不上的名字只出现在警告里，不会编造点位。

杭州 3 天演示顺序来自 `hz-3day-demo`：西湖、灵隐、湖滨吴山。西溪不进这三天。
