import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests',
  use: { baseURL: 'http://127.0.0.1:4317', channel: process.env.CI ? undefined : 'chrome', headless: true, viewport: {width: 1440, height: 1200} },
  webServer: { command: 'npm run start', url: 'http://127.0.0.1:4317', timeout: 120000, reuseExistingServer: false },
  workers: 1,
  reporter: [['list'], ['json', { outputFile: 'evidence/test-results.json' }]],
});
