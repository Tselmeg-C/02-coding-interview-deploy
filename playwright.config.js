import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  use: {
    baseURL: process.env.APP_URL ?? 'http://127.0.0.1:3001',
    browserName: 'chromium',
    headless: true,
  },
});
