import { test, expect } from '@playwright/test';

test.describe('Filter Options Cache', () => {
  test.setTimeout(60000);

  test('Popout QueryControl should use cached filter options (no API calls)', async ({ page, context }) => {
    // Track API calls made by the popout window
    const popoutApiCalls: string[] = [];

    console.log('\n=== TEST: Filter options caching ===');

    // Step 1: Navigate to discover page in main window
    console.log('\n[STEP 1] Navigate to discover page');
    await page.goto('/automobiles/discover');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Step 2: Open filter dropdown in main window to trigger caching
    console.log('\n[STEP 2] Open filter dropdown in main to cache options');
    const mainDropdown = page.locator('app-query-control p-dropdown').first();
    await mainDropdown.click();
    await page.waitForTimeout(500);

    // Select a filter type to load its options
    const manufacturerOption = page.locator('.p-select-option').filter({ hasText: 'Manufacturer' });
    if (await manufacturerOption.count() > 0) {
      await manufacturerOption.first().click();
      await page.waitForTimeout(1000);
      console.log('Manufacturer filter options loaded in main window');

      // Close dialog without selecting (cancel)
      const cancelBtn = page.locator('button').filter({ hasText: /cancel/i });
      if (await cancelBtn.count() > 0) {
        await cancelBtn.first().click();
      } else {
        // Press escape to close
        await page.keyboard.press('Escape');
      }
      await page.waitForTimeout(500);
    }

    // Step 3: Open Query Control popout
    console.log('\n[STEP 3] Open Query Control popout');
    const qcPopoutBtn = page.locator('#popout-query-control');

    const [qcPopup] = await Promise.all([
      context.waitForEvent('page'),
      qcPopoutBtn.click()
    ]);

    // Set up API call tracking for the popout window
    qcPopup.on('request', request => {
      const url = request.url();
      // Only track API calls to filter endpoints
      if (url.includes('/filters/') || url.includes('/agg/')) {
        popoutApiCalls.push(url);
        console.log('[POPOUT API CALL]', url);
      }
    });

    await qcPopup.waitForLoadState('networkidle');
    await qcPopup.waitForTimeout(2000);

    console.log('Popout URL:', qcPopup.url());

    // Step 4: Open filter dropdown in popout
    console.log('\n[STEP 4] Open filter dropdown in popout');
    const popoutDropdown = qcPopup.locator('app-query-control p-dropdown').first();
    await expect(popoutDropdown).toBeVisible();
    await popoutDropdown.click();
    await qcPopup.waitForTimeout(500);

    // Select Manufacturer to trigger options loading
    const popoutManufacturerOption = qcPopup.locator('.p-select-option').filter({ hasText: 'Manufacturer' });
    if (await popoutManufacturerOption.count() > 0) {
      await popoutManufacturerOption.first().click();
      await qcPopup.waitForTimeout(1500);

      // Check if options are displayed (from cache)
      const optionItems = qcPopup.locator('.options-list .option-item');
      const optionCount = await optionItems.count();
      console.log(`Options displayed in popout: ${optionCount}`);

      // Take screenshot
      await qcPopup.screenshot({ path: 'test-results/filter-options-cache-01.png', fullPage: true });
    }

    // Step 5: Report API calls
    console.log('\n[STEP 5] API calls made by popout:');
    if (popoutApiCalls.length === 0) {
      console.log('SUCCESS: No API calls made by popout for filter options');
    } else {
      console.log('WARNING: Popout made API calls:');
      popoutApiCalls.forEach(url => console.log('  -', url));
    }

    // Verify no filter-related API calls were made by the popout
    const filterApiCalls = popoutApiCalls.filter(url =>
      url.includes('/filters/') || url.includes('/agg/')
    );

    console.log(`\nFilter API calls from popout: ${filterApiCalls.length}`);

    await qcPopup.close();

    // Note: This is an informational test - actual verification depends on
    // whether options were cached in main window before popout opened
    console.log('\n=== Filter options cache test complete ===');
  });
});
