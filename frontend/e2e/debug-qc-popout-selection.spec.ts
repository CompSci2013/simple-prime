import { test, expect } from '@playwright/test';

test.describe('QueryControl Popout Selection Sync', () => {
  test.setTimeout(90000);

  test('Selections in popped-out QueryControl should update main window', async ({ page, context }) => {
    console.log('\n=== TEST: Popout QueryControl selection sync ===');

    // Step 1: Navigate to discover page
    console.log('\n[STEP 1] Navigate to discover page');
    await page.goto('/automobiles/discover');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Step 2: Take screenshot of initial state
    console.log('\n[STEP 2] Capture initial main window state');
    await page.screenshot({ path: 'test-results/qc-sel-01-initial.png', fullPage: true });

    // Check initial filter chips in main window
    const initialChips = await page.locator('.p-chip').count();
    console.log(`Initial filter chips in main: ${initialChips}`);

    // Step 3: Open Query Control popout
    console.log('\n[STEP 3] Open Query Control popout');
    const qcPopoutBtn = page.locator('#popout-query-control');

    const [qcPopup] = await Promise.all([
      context.waitForEvent('page'),
      qcPopoutBtn.click()
    ]);

    await qcPopup.waitForLoadState('networkidle');
    await qcPopup.waitForTimeout(2000);
    console.log('Popout URL:', qcPopup.url());

    // Step 4: Open Body Class filter in popout and select values
    console.log('\n[STEP 4] Open Body Class filter in popout');
    const popoutDropdown = qcPopup.locator('app-query-control .p-dropdown, app-query-control p-dropdown').first();
    await expect(popoutDropdown).toBeVisible();
    await popoutDropdown.click();
    await qcPopup.waitForTimeout(500);

    // Click Body Class option
    await qcPopup.click('text=Body Class');
    await qcPopup.waitForTimeout(2000);

    await qcPopup.screenshot({ path: 'test-results/qc-sel-02-popout-dialog.png', fullPage: true });

    // Step 5: Select some options
    console.log('\n[STEP 5] Select Convertible and Coupe in popout');

    // Click on Convertible option
    const convertibleOption = qcPopup.locator('.options-list .option-item').filter({ hasText: 'Convertible' });
    if (await convertibleOption.count() > 0) {
      await convertibleOption.click();
      console.log('  - Selected: Convertible');
    }

    // Click on Coupe option
    const coupeOption = qcPopup.locator('.options-list .option-item').filter({ hasText: 'Coupe' });
    if (await coupeOption.count() > 0) {
      await coupeOption.click();
      console.log('  - Selected: Coupe');
    }

    await qcPopup.waitForTimeout(500);
    await qcPopup.screenshot({ path: 'test-results/qc-sel-03-popout-selected.png', fullPage: true });

    // Step 6: Click Apply button
    console.log('\n[STEP 6] Click Apply button in popout');
    const applyButton = qcPopup.locator('button').filter({ hasText: /Apply|OK/ });
    if (await applyButton.count() > 0) {
      await applyButton.first().click();
      console.log('  - Clicked Apply');
    } else {
      console.log('  - Apply button not found, trying to close dialog');
    }

    await qcPopup.waitForTimeout(1000);
    await qcPopup.screenshot({ path: 'test-results/qc-sel-04-popout-after-apply.png', fullPage: true });

    // Step 7: Check popout has the chip
    console.log('\n[STEP 7] Verify filter chip in popout');
    const popoutChips = await qcPopup.locator('.p-chip').count();
    console.log(`Filter chips in popout: ${popoutChips}`);

    // Step 8: Check main window was updated
    console.log('\n[STEP 8] Verify main window received the filter');
    await page.waitForTimeout(2000); // Wait for broadcast message to propagate

    await page.screenshot({ path: 'test-results/qc-sel-05-main-after-apply.png', fullPage: true });

    // Check if URL was updated with bodyClass param
    const mainUrl = page.url();
    console.log('Main window URL:', mainUrl);

    const hasBodyClassParam = mainUrl.includes('bodyClass');
    console.log(`URL contains bodyClass param: ${hasBodyClassParam}`);

    // Check for filter chips in main window
    const mainChips = await page.locator('.p-chip').count();
    console.log(`Filter chips in main: ${mainChips}`);

    // Check results table updated (if visible)
    const resultsTable = page.locator('app-dynamic-results-table, .results-table');
    if (await resultsTable.count() > 0) {
      const rowCount = await page.locator('table tbody tr, .p-datatable-tbody tr').count();
      console.log(`Results table rows: ${rowCount}`);
    }

    // Step 9: Verify the filter is actually applied
    console.log('\n[STEP 9] Verification summary');
    if (hasBodyClassParam) {
      console.log('SUCCESS: Filter selection from popout updated main window URL');
    } else {
      console.log('FAILURE: Main window URL was not updated with filter');
    }

    // Close popout
    await qcPopup.close();
    console.log('\n=== Test complete ===');

    // Assert that the filter was propagated
    expect(hasBodyClassParam).toBe(true);
  });
});
