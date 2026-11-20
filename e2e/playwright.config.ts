import { defineConfig, devices } from '@playwright/test'

/**
 * Which build to test. Unset: build the monolith and serve it on a port of
 * its own (always a fresh build and a fresh server). Set BASE_URL to run the
 * same tests against an already running configuration, e.g. an F4 shell:
 *   BASE_URL=http://localhost:5300 pnpm test:e2e
 */
const TEST_PORT = 5199
const BASE_URL = process.env.BASE_URL ?? `http://localhost:${TEST_PORT}`

export default defineConfig({
  testDir: './tests',
  globalSetup: './global-setup.ts',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  // No retries: a flaky test should fail loudly, not hide behind a rerun.
  retries: 0,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]],
  use: {
    baseURL: BASE_URL,
    trace: 'retain-on-failure',
  },
  projects: [
    // Signs in the test accounts once and saves their sessions.
    { name: 'setup', testMatch: /.*\.setup\.ts/ },
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['setup'],
    },
  ],
  webServer: process.env.BASE_URL
    ? undefined
    : {
        command: `pnpm --dir .. monolith:build && node ../scripts/serve-static.mjs ../apps/monolith/dist:${TEST_PORT}`,
        url: BASE_URL,
        reuseExistingServer: false,
        timeout: 60_000,
      },
})
