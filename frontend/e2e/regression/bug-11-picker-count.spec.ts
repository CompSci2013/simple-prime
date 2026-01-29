import { test, expect } from '@playwright/test';
import { TestLogger, createTestLogger } from '../test-logger';

/**
 * Bug #11 Regression Test - Manufacturer-Model Picker Count
 *
 * BUG DESCRIPTION:
 * The Manufacturer-Model picker shows ~72 entries instead of the expected 4,800+
 * manufacturer-model combinations. This appears to be a pagination or data loading issue.
 *
 * EXPECTED: Picker should indicate > 800 unique manufacturer-model combinations
 * ACTUAL: Picker shows limited entries or incorrect total count.
 */

test.describe('Bug #11 - Manufacturer-Model Picker Count', () => {
  let logger: TestLogger;

  test.beforeEach(async ({ page }) => {
    logger = await createTestLogger(page);
  });

  test.afterEach(async () => {
    logger.printSummary();
  });

  test('Picker UI should show total count > 800 for manufacturer-model combinations', async ({ page }) => {
    // Navigate to discover page
    await page.goto('/automobiles/discover');
    await page.waitForLoadState('networkidle');
    
    console.log('\n[TEST] Step 1: Ensure Manufacturer-Model Picker panel is expanded');
    
    const panelId = 'manufacturer-model-picker';
    const panelWrapper = page.locator(`#panel-${panelId}`);
    await expect(panelWrapper).toBeVisible({ timeout: 10000 });

    // Check if collapsed
    const content = panelWrapper.locator('.picker-container');
    const isVisible = await content.isVisible();
    
    if (!isVisible) {
      console.log('[TEST] Panel is collapsed, expanding...');
      const expandButton = panelWrapper.locator('.panel-actions button').first();
      await expandButton.click();
      await expect(content).toBeVisible({ timeout: 5000 });
    } else {
      console.log('[TEST] Panel is already expanded');
    }

    // Step 2: Check the paginator total count
    console.log('[TEST] Step 2: Verifying total count in paginator...');
    const pickerTable = content.locator('[data-testid="picker-table"]');
    await expect(pickerTable).toBeVisible({ timeout: 10000 });

    const paginatorCurrent = pickerTable.locator('.p-paginator-current');
    await expect(paginatorCurrent).toBeVisible({ timeout: 10000 });
    
    const paginatorText = await paginatorCurrent.textContent();
    console.log(`[TEST] Picker paginator text: ${paginatorText}`);

    // If the bug is present, the paginator might show "of 20" or "of 72"
    // instead of "of 881"
    const match = paginatorText?.match(/of (\d+) entries/);
    const totalCount = match ? parseInt(match[1], 10) : 0;
    console.log(`[TEST] UI Total Count: ${totalCount}`);

    // VERIFIED BUG: Documentation says > 800. 
    // If it returns 881, the bug might be about something else (e.g. inability to reach next pages)
    // but the test should assert our expectation.
    expect(totalCount).toBeGreaterThan(800);
  });

  test('Document: API response for manufacturer-model combinations', async ({ page }) => {
    await page.goto('/automobiles/discover');
    await page.waitForLoadState('networkidle');

    console.log('\n[BUG #11 API DOCUMENTATION]');
    console.log('============================');

    await page.waitForTimeout(1000);
    const combinationsCalls = logger.findApiCalls('/manufacturer-model-combinations');

    if (combinationsCalls.length > 0) {
      const call = combinationsCalls[0];
      console.log(`\nAPI Call: ${call.url}`);
      
      if (call.responseBody) {
        try {
          const json = JSON.parse(call.responseBody);
          console.log(`API reported total: ${json.total}`);
          console.log(`API returned data length: ${json.data?.length}`);
        } catch (e) {
          console.log(`Raw Response preview: ${call.responseBody.substring(0, 200)}...`);
        }
      }
    }

    expect(combinationsCalls.length).toBeGreaterThan(0);
  });

});
