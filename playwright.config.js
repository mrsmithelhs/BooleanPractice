import { defineConfig, devices } from '@playwright/test';
import { loadEnv } from 'vite';

const DEFAULT_HOST = '127.0.0.1';
const DEFAULT_DEV_PORT = 5177;

function parsePort(value, fallback) {
  const port = Number(value);
  return Number.isInteger(port) && port > 0 ? port : fallback;
}

const env = loadEnv('test', process.cwd(), 'BOOLEAN_PRACTICE_');
const host = env.BOOLEAN_PRACTICE_HOST || DEFAULT_HOST;
const devPort = parsePort(env.BOOLEAN_PRACTICE_DEV_PORT, DEFAULT_DEV_PORT);

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: `http://${host}:${devPort}`,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: `http://${host}:${devPort}`,
    reuseExistingServer: !process.env.CI,
  },
});
