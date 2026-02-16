import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './playwright',
  testMatch: /.*\.e2e\.ts/,
  timeout: 30_000,
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'npm run dev',
    port: 3000,
    reuseExistingServer: true,
    timeout: 120_000,
  },
})
