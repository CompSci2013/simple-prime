import { test, expect } from '@playwright/test';

test('Gemini Pilot Check', async ({ page }) => {
  // 1. Navigate to the app running on Thor
  // We use localhost because Playwright is running on the same machine (Thor) as the server
  await page.goto('http://localhost:4205/');

  // 2. verify the app is actually running by waiting for the body
  await page.waitForSelector('body');

  // 3. Log the title to the console so we know we are in the right place
  const title = await page.title();
  console.log(`Gemini Pilot Report: Arrived at page "${title}"`);

  // 4. Take a screenshot evidence
  await page.screenshot({ path: 'gemini-landing-proof.png' });
  
  // 5. Basic assertion (adjust selector based on your app, e.g., 'app-root')
  await expect(page.locator('app-root')).toBeVisible();
});