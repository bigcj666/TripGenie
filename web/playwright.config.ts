import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from '@playwright/test'

const root = path.dirname(fileURLToPath(import.meta.url))
const python = process.env.CI ? 'python' : path.resolve(root, '../server/.venv/bin/python')

export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  use: {
    baseURL: 'http://127.0.0.1:5173',
    viewport: { width: 390, height: 844 },
  },
  webServer: [
    {
      command: `${python} -m uvicorn app.main:app --host 127.0.0.1 --port 8000`,
      cwd: path.resolve(root, '../server'),
      port: 8000,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'npm run dev -- --host 127.0.0.1 --port 5173',
      port: 5173,
      reuseExistingServer: !process.env.CI,
    },
  ],
})
