# 途灵 TripGenie

AI 旅游攻略生成 App——输入目的地/天数/预算/偏好，生成结构化多日行程（紧凑/松弛/省钱三方案），时间线展示、可接地图打点。目标：简历项目经历 + 4C 中国大学生计算机设计大赛「人工智能应用」赛道参赛作品。

## 项目结构

```
途灵/
├── mobile/   # React Native (Expo + TypeScript) 客户端
├── server/   # FastAPI 后端（行程契约 / LLM+Mock 双引擎 / 生成 API）
└── docs/     # 执行计划与参赛文档
```

详细执行计划（里程碑/砍线规则/参赛材料规格）见 `docs/compose/spec/tuling-tripgenie.md`。

## 后端启动（server/）

```bash
cd server
python -m venv .venv
# Windows:
.venv\Scripts\python.exe -m pip install -r requirements.txt
.venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

环境变量（都不设也能跑，默认 Mock 引擎）：

| 变量 | 说明 | 默认 |
|---|---|---|
| `LLM_ENGINE` | `auto` / `deepseek` / `glm` / `mock` | `auto`（无 key 自动降级 mock） |
| `DEEPSEEK_API_KEY` | DeepSeek 密钥 | 空 |
| `GLM_API_KEY` | 智谱 GLM 密钥（备选） | 空 |

### API

`POST /api/trip/generate`

```json
{
  "city": "杭州", "days": 3, "budget_total": 1500, "people": 3,
  "preferences": ["亲子", "美食"], "style": "all"
}
```

`style` 取 `compact` / `relaxed` / `economy` / `all`（all 返回 3 套方案）。响应 `{ engine, plans[], warnings[] }`。

### 测试

```bash
cd server
.venv\Scripts\python.exe -m pytest -q
```

## 移动端启动（mobile/）

```bash
cd mobile
npm install
npx expo start        # 扫码真机预览，或按 a 开安卓模拟器
```

> API 地址在 `mobile/src/services/` 中配置：模拟器默认 `http://10.0.2.2:8000`，真机需改成电脑的局域网 IP。

## 1 分钟 Mock 演示（断网/无 key 也能跑）

1. 后端以默认配置启动（引擎显示 `mock`）。
2. `GET /health` 应返回 `{"status":"ok","engine":"mock"}`。
3. 移动端打开「演示模式」开关（或直接提交表单，后端自动用 mock）。
4. 输入「杭州 / 3 天 / 1500 元 / 3 人 / 亲子+美食」→ 生成 → 切换紧凑/松弛/省钱三方案 → 展开时间线详情。

内置 mock 演示数据覆盖**杭州、成都、西安**；其他城市走通用模板，结构同样合法。

## 演示兜底三件套（参赛现场）

1. **Mock 模式**：断网/欠费时全流程可演示（`engine: mock` 时前端显示「演示引擎」）。
2. **预录视频**：4 分钟完整版随 U 盘携带。
3. **离线 APK**：提前安装到备用演示机。
