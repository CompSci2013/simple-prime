import { defineConfig, devices } from '@playwright/test';

// The port the application will be served on.
// Must match the frontend dev server or production app port
const PORT = 4205;

export default defineConfig({
  // Directory where the tests are located.
  testDir: './e2e',

  // Fail the build on CI if you accidentally left test.only in the source code.
  forbidOnly: !!process.env.CI,

  // Retry on CI only.
  retries: process.env.CI ? 2 : 0,

  // Opt out of parallel tests on CI.
  workers: process.env.CI ? 1 : undefined,

  // Timeout per test
  // Most tests are fast (3 seconds), but pop-out tests (6.1, 6.2) need more time
  // to open multiple windows and wait for BroadcastChannel synchronization
  timeout: 10000,

  // Reporter to use. See https://playwright.dev/docs/test-reporters
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results.json' }],
  ],

  use: {
    // Base URL to use in actions like `await page.goto('/')`.
    // In Docker container: dev server is on localhost (same container)
    // HOST env variable is only for the backend API, not for the dev server
    baseURL: `http://localhost:${PORT}`,

    // Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer
    trace: 'on-first-retry',

    // Increased viewport to see all panels
    viewport: { width: 1920, height: 1080 },
  },

  // Configure projects for major browsers.
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // IMPORTANT: The dev server (npm start) should already be running on the configured PORT
  // The tests will connect to http://localhost:4205 where the dev server is running
  // Don't start another server - the dev server handles live reload and compilation

  // Skip webServer config - assumes dev server is already running
  // (started by scripts/run-e2e-tests.sh or manually by user)
});
