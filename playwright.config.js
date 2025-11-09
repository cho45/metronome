import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:8000',
    trace: 'on-first-retry',
  },
  expect: {
    timeout: 3000, // デフォルト5秒から3秒に短縮
  },
  projects: [
    {
      name: 'ui',
      testMatch: '**/ui.spec.js',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'midi',
      testMatch: '**/midi.spec.js',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'timing',
      testMatch: '**/timing.spec.js',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'utils',
      testMatch: '**/utils.spec.js',
      // Node.js環境で実行（ブラウザ設定なし）
    },
  ],
  webServer: {
    command: 'npx serve . -l 8001',
    url: 'http://localhost:8001',
    reuseExistingServer: !process.env.CI,
  },
});
