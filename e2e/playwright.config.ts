import { defineConfig, devices } from '@playwright/test';

const API_PORT = 3001;
const CLIENT_PORT = 5174;
const CLIENT_URL = `http://localhost:${CLIENT_PORT}`;

export default defineConfig({
  testDir: './tests',
  globalSetup: './global-setup.ts',
  globalTeardown: './global-teardown.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  outputDir: './test-results',
  reporter: [['html', { outputFolder: './playwright-report' }]],
  use: {
    baseURL: CLIENT_URL,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: [
    {
      name: 'api',
      command: 'npx tsx --env-file=../e2e/.env.test src/index.ts',
      cwd: '../server',
      url: `http://localhost:${API_PORT}/api/health`,
      reuseExistingServer: !process.env.CI,
    },
    {
      name: 'client',
      command: `npm run dev -- --port ${CLIENT_PORT} --strictPort`,
      cwd: '../client',
      env: { API_PROXY_TARGET: `http://localhost:${API_PORT}` },
      url: CLIENT_URL,
      reuseExistingServer: !process.env.CI,
    },
  ],
});
