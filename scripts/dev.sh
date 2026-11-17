#!/usr/bin/env bash
# 同时启动后端（8000）和网页（5173）。网页 /api 与 /health 代理到这个后端。
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

cd "$ROOT/server"
if [[ ! -x .venv/bin/uvicorn ]]; then
  python3 -m venv .venv
  .venv/bin/pip install -r requirements.txt
fi
.venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000 &
api_pid=$!

cd "$ROOT/web"
if [[ ! -d node_modules ]]; then
  npm install
fi
npm run dev -- --host 127.0.0.1 --port 5173 &
web_pid=$!

cleanup() {
  kill "$api_pid" "$web_pid" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

echo "后端  http://127.0.0.1:8000/health"
echo "网页  http://127.0.0.1:5173   （/api 与 /health 代理到 8000）"
wait
