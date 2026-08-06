import { defineConfig, devices } from '@playwright/test';

import { testEnv } from './test-env.js';

const API_PORT = 3001;
const CLIENT_PORT = 5174;
const CLIENT_URL = `http://localhost:${CLIENT_PORT}`;

const resetDatabase = 'npx prisma migrate reset --force';
const seedDatabase = 'npx tsx prisma/seed.ts';
const startApi = 'npx tsx src/index.ts';

export default defineConfig({
  testDir: './tests',
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
      command: `${resetDatabase} && ${seedDatabase} && ${startApi}`,
      cwd: '../server',
      env: { ...testEnv, PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION: 'Yes' },
      url: `http://localhost:${API_PORT}/api/health`,
      timeout: 180_000,
      stdout: 'pipe',
      reuseExistingServer: false,
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
