import { test, expect } from '@playwright/test';

test.describe('QueryControl Body Class in Popout', () => {
  test.setTimeout(60000);

  test('Body Class filter should work in popped-out Query Control', async ({ page, context }) => {
    console.log('\n=== TEST: Body Class filter in popout ===');

    // Collect console logs
    const mainLogs: string[] = [];
    const popoutLogs: string[] = [];

    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('FilterOptions') || text.includes('Error') || text.includes('body')) {
        mainLogs.push(`[main] ${text}`);
      }
    });

    // Step 1: Navigate to discover page
    console.log('\n[STEP 1] Navigate to discover page');
    await page.goto('/automobiles/discover');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Step 2: Open Body Class filter in MAIN window first to cache options
    console.log('\n[STEP 2] Open Body Class filter in main to cache options');
    const mainDropdown = page.locator('app-query-control p-dropdown').first();
    await mainDropdown.click();
    await page.waitForTimeout(500);

    // Find and click Body Class option
    const bodyClassOption = page.locator('.p-select-option').filter({ hasText: 'Body Class' });
    if (await bodyClassOption.count() > 0) {
      await bodyClassOption.first().click();
      await page.waitForTimeout(1500);
      console.log('Body Class dialog opened in main');

      // Check if options loaded
      const optionItems = page.locator('.options-list .option-item');
      const optionCount = await optionItems.count();
      console.log(`Body Class options in main: ${optionCount}`);

      // Close dialog
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
    } else {
      console.log('WARNING: Body Class option not found in dropdown');
    }

    // Step 3: Open Query Control popout
    console.log('\n[STEP 3] Open Query Control popout');
    const qcPopoutBtn = page.locator('#popout-query-control');

    const [qcPopup] = await Promise.all([
      context.waitForEvent('page'),
      qcPopoutBtn.click()
    ]);

    qcPopup.on('console', msg => {
      const text = msg.text();
      popoutLogs.push(`[popout] ${text}`);
    });

    await qcPopup.waitForLoadState('networkidle');
    await qcPopup.waitForTimeout(2000);

    console.log('Popout URL:', qcPopup.url());

    // Step 4: Open Body Class filter in POPOUT
    console.log('\n[STEP 4] Open Body Class filter in popout');
    const popoutDropdown = qcPopup.locator('app-query-control p-dropdown').first();
    await expect(popoutDropdown).toBeVisible();
    await popoutDropdown.click();
    await qcPopup.waitForTimeout(500);

    await qcPopup.screenshot({ path: 'test-results/qc-bodyclass-01-dropdown.png', fullPage: true });

    // Find and click Body Class option in popout
    const popoutBodyClassOption = qcPopup.locator('.p-select-option').filter({ hasText: 'Body Class' });
    const bodyClassCount = await popoutBodyClassOption.count();
    console.log(`Body Class options in popout dropdown: ${bodyClassCount}`);

    if (bodyClassCount > 0) {
      await popoutBodyClassOption.first().click();
      await qcPopup.waitForTimeout(2000);

      await qcPopup.screenshot({ path: 'test-results/qc-bodyclass-02-dialog.png', fullPage: true });

      // Check if options loaded in popout
      const popoutOptionItems = qcPopup.locator('.options-list .option-item');
      const popoutOptionCount = await popoutOptionItems.count();
      console.log(`Body Class options in popout dialog: ${popoutOptionCount}`);

      if (popoutOptionCount > 0) {
        console.log('SUCCESS: Body Class options loaded in popout');

        // List first few options
        for (let i = 0; i < Math.min(3, popoutOptionCount); i++) {
          const text = await popoutOptionItems.nth(i).textContent();
          console.log(`  Option ${i + 1}: ${text?.trim()}`);
        }
      } else {
        console.log('FAILURE: No Body Class options in popout');

        // Check for error message
        const errorMsg = qcPopup.locator('.options-error, .error-message');
        if (await errorMsg.count() > 0) {
          const errorText = await errorMsg.first().textContent();
          console.log(`Error message: ${errorText}`);
        }

        // Check for loading spinner
        const spinner = qcPopup.locator('.p-progress-spinner, .loading');
        if (await spinner.count() > 0) {
          console.log('Loading spinner still visible - options may still be loading');
        }
      }
    } else {
      console.log('FAILURE: Body Class option not found in popout dropdown');
    }

    // Print collected logs
    console.log('\n=== MAIN WINDOW LOGS ===');
    mainLogs.slice(-10).forEach(log => console.log(log));

    console.log('\n=== POPOUT WINDOW LOGS ===');
    popoutLogs.slice(-20).forEach(log => console.log(log));

    await qcPopup.close();
    console.log('\n=== Test complete ===');
  });
});
