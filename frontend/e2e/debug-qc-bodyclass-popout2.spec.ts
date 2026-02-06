import { test, expect } from '@playwright/test';

test.describe('QueryControl Body Class in Popout v2', () => {
  test.setTimeout(90000);

  test('Body Class filter should work in popped-out Query Control', async ({ page, context }) => {
    console.log('\n=== TEST: Body Class filter in popout ===');

    // Track API calls
    const popoutApiCalls: string[] = [];

    // Step 1: Navigate to discover page
    console.log('\n[STEP 1] Navigate to discover page');
    await page.goto('/automobiles/discover');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Step 2: Open Body Class filter in MAIN window first to cache options
    console.log('\n[STEP 2] Open Body Class filter in main to cache options');
    const mainDropdown = page.locator('app-query-control .p-dropdown, app-query-control p-dropdown').first();
    await mainDropdown.click();
    await page.waitForTimeout(500);

    // Take screenshot to see dropdown structure
    await page.screenshot({ path: 'test-results/qc-bc-main-01-dropdown.png', fullPage: true });

    // Find Body Class option - try different selectors
    const bodyClassOption = page.locator('.p-dropdown-item, .p-dropdown-items li, .p-select-option').filter({ hasText: 'Body Class' });
    const bcCount = await bodyClassOption.count();
    console.log(`Body Class options found: ${bcCount}`);

    if (bcCount > 0) {
      await bodyClassOption.first().click();
      await page.waitForTimeout(2000);

      await page.screenshot({ path: 'test-results/qc-bc-main-02-dialog.png', fullPage: true });

      // Check if options loaded
      const optionItems = page.locator('.options-list .option-item, .p-listbox-item');
      const optionCount = await optionItems.count();
      console.log(`Body Class options in main dialog: ${optionCount}`);

      // Close dialog
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
    } else {
      // Try clicking by text directly
      await page.click('text=Body Class');
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'test-results/qc-bc-main-02-dialog.png', fullPage: true });
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
    }

    // Step 3: Open Query Control popout
    console.log('\n[STEP 3] Open Query Control popout');
    const qcPopoutBtn = page.locator('#popout-query-control');

    const [qcPopup] = await Promise.all([
      context.waitForEvent('page'),
      qcPopoutBtn.click()
    ]);

    // Track API calls from popout
    qcPopup.on('request', request => {
      const url = request.url();
      if (url.includes('/filters/') || url.includes('/agg/')) {
        popoutApiCalls.push(url);
        console.log('[POPOUT API CALL]', url);
      }
    });

    await qcPopup.waitForLoadState('networkidle');
    await qcPopup.waitForTimeout(2000);

    console.log('Popout URL:', qcPopup.url());

    // Step 4: Open Body Class filter in POPOUT
    console.log('\n[STEP 4] Open Body Class filter in popout');
    const popoutDropdown = qcPopup.locator('app-query-control .p-dropdown, app-query-control p-dropdown').first();
    await expect(popoutDropdown).toBeVisible();
    await popoutDropdown.click();
    await qcPopup.waitForTimeout(500);

    await qcPopup.screenshot({ path: 'test-results/qc-bc-popout-01-dropdown.png', fullPage: true });

    // Click Body Class in popout
    await qcPopup.click('text=Body Class');
    await qcPopup.waitForTimeout(3000);

    await qcPopup.screenshot({ path: 'test-results/qc-bc-popout-02-dialog.png', fullPage: true });

    // Check if options loaded in popout
    const popoutOptionItems = qcPopup.locator('.options-list .option-item');
    const popoutOptionCount = await popoutOptionItems.count();
    console.log(`Body Class options in popout dialog: ${popoutOptionCount}`);

    if (popoutOptionCount > 0) {
      console.log('SUCCESS: Body Class options loaded in popout');

      // List first few options
      for (let i = 0; i < Math.min(5, popoutOptionCount); i++) {
        const text = await popoutOptionItems.nth(i).textContent();
        console.log(`  Option ${i + 1}: ${text?.trim()}`);
      }
    } else {
      console.log('CHECKING: Looking for loading or error state...');

      // Check for loading spinner
      const spinner = qcPopup.locator('.p-progress-spinner');
      if (await spinner.count() > 0) {
        console.log('  - Loading spinner visible');
      }

      // Check for error message
      const errorSection = qcPopup.locator('.options-error');
      if (await errorSection.count() > 0) {
        const errorText = await errorSection.first().textContent();
        console.log(`  - Error: ${errorText}`);
      }

      // Check dialog visibility
      const dialog = qcPopup.locator('.p-dialog');
      console.log(`  - Dialog visible: ${await dialog.count() > 0}`);
    }

    // Step 5: Report API calls
    console.log('\n[STEP 5] API calls made by popout:');
    if (popoutApiCalls.length === 0) {
      console.log('SUCCESS: No API calls made by popout');
    } else {
      console.log('API calls made:');
      popoutApiCalls.forEach(url => console.log('  -', url));
    }

    await qcPopup.close();
    console.log('\n=== Test complete ===');
  });
});
