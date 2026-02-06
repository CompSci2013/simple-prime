import { test, expect, Page, BrowserContext } from '@playwright/test';

/**
 * Full popout synchronization test
 * Tests actual user interactions instead of URL manipulation
 */

test.describe('Popout Full Test', () => {
  test.setTimeout(120000);

  test('Main to popout sync via actual filter selection', async ({ page, context }) => {
    console.log('\n=== TEST: Main to popout sync via UI ===');

    // Step 1: Navigate to discover page
    console.log('\n[STEP 1] Navigate to automobiles/discover');
    await page.goto('/automobiles/discover');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    await page.screenshot({ path: 'test-results/full-01-initial.png', fullPage: true });

    // Step 2: Open Query Control popout
    console.log('\n[STEP 2] Open Query Control popout');
    const qcPopoutBtn = page.locator('#popout-query-control');

    const [qcPopup] = await Promise.all([
      context.waitForEvent('page'),
      qcPopoutBtn.click()
    ]);

    await qcPopup.waitForLoadState('networkidle');
    await qcPopup.waitForTimeout(1000);

    console.log('Query Control popup URL:', qcPopup.url());
    await qcPopup.screenshot({ path: 'test-results/full-02-popout.png', fullPage: true });

    // Count initial chips in popout
    const initialPopoutChips = await qcPopup.locator('p-chip').count();
    console.log(`Initial chips in popout: ${initialPopoutChips}`);

    // Step 3: In MAIN window, add a filter using the Query Control UI
    console.log('\n[STEP 3] Add filter via Query Control UI in main window');

    // Click on the dropdown to select a field
    const mainDropdown = page.locator('app-query-control p-dropdown').first();
    await mainDropdown.click();
    await page.waitForTimeout(500);

    await page.screenshot({ path: 'test-results/full-03-dropdown-open.png', fullPage: true });

    // Select "Manufacturer" from the dropdown
    const manufacturerOption = page.locator('.p-dropdown-item').filter({ hasText: 'Manufacturer' });
    if (await manufacturerOption.count() > 0) {
      await manufacturerOption.click();
      await page.waitForTimeout(1000);

      await page.screenshot({ path: 'test-results/full-04-field-selected.png', fullPage: true });

      // Wait for dialog to appear and select a value
      const dialog = page.locator('p-dialog');
      if (await dialog.isVisible({ timeout: 3000 })) {
        console.log('Multiselect dialog appeared');
        await page.screenshot({ path: 'test-results/full-05-dialog.png', fullPage: true });

        // Select first checkbox option
        const checkboxes = page.locator('p-dialog p-checkbox');
        const checkboxCount = await checkboxes.count();
        console.log(`Found ${checkboxCount} checkboxes`);

        if (checkboxCount > 0) {
          await checkboxes.first().click();
          await page.waitForTimeout(500);

          // Click Apply button
          const applyBtn = page.locator('p-dialog button').filter({ hasText: /Apply|OK|Save/i });
          if (await applyBtn.count() > 0) {
            await applyBtn.click();
            await page.waitForTimeout(1500);
          }
        }
      }
    }

    await page.screenshot({ path: 'test-results/full-06-after-filter.png', fullPage: true });

    // Check main window URL
    console.log('Main window URL after filter:', page.url());

    // Check chips in main window
    const mainChips = await page.locator('app-query-control p-chip').count();
    console.log(`Chips in main window after filter: ${mainChips}`);

    // Step 4: Check if popout received the update
    console.log('\n[STEP 4] Check if popout received the filter update');
    await qcPopup.waitForTimeout(2000);

    await qcPopup.screenshot({ path: 'test-results/full-07-popout-after.png', fullPage: true });

    // Count chips in popout after filter
    const finalPopoutChips = await qcPopup.locator('p-chip').count();
    console.log(`Chips in popout after main filter: ${finalPopoutChips}`);

    if (finalPopoutChips > initialPopoutChips) {
      console.log('SUCCESS: Popout received filter update from main window');
    } else {
      console.log('WARNING: Popout may not have received the filter update');

      // Debug: Check console logs
      const logs: string[] = [];
      qcPopup.on('console', msg => logs.push(`[${msg.type()}] ${msg.text()}`));
      await qcPopup.waitForTimeout(500);
      console.log('Recent popout console logs:', logs.slice(-5));
    }

    // Close popout
    await qcPopup.close();

    console.log('\n=== Test complete ===');
  });

  test('Popout to main sync via filter selection in popout', async ({ page, context }) => {
    console.log('\n=== TEST: Popout to main sync ===');

    // Step 1: Navigate to discover page
    console.log('\n[STEP 1] Navigate to automobiles/discover');
    await page.goto('/automobiles/discover');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const initialUrl = page.url();
    console.log('Initial URL:', initialUrl);

    // Step 2: Open Query Control popout
    console.log('\n[STEP 2] Open Query Control popout');
    const qcPopoutBtn = page.locator('#popout-query-control');

    const [qcPopup] = await Promise.all([
      context.waitForEvent('page'),
      qcPopoutBtn.click()
    ]);

    await qcPopup.waitForLoadState('networkidle');
    await qcPopup.waitForTimeout(1000);

    await qcPopup.screenshot({ path: 'test-results/p2m-01-popout.png', fullPage: true });

    // Step 3: In POPOUT, add a filter
    console.log('\n[STEP 3] Add filter in popout');

    const popoutDropdown = qcPopup.locator('app-query-control p-dropdown').first();
    await popoutDropdown.click();
    await qcPopup.waitForTimeout(500);

    await qcPopup.screenshot({ path: 'test-results/p2m-02-dropdown.png', fullPage: true });

    // Select a field
    const yearOption = qcPopup.locator('.p-dropdown-item').filter({ hasText: 'Year' });
    if (await yearOption.count() > 0) {
      await yearOption.click();
      await qcPopup.waitForTimeout(1000);

      await qcPopup.screenshot({ path: 'test-results/p2m-03-field-selected.png', fullPage: true });

      // Handle range dialog for Year
      const dialog = qcPopup.locator('p-dialog');
      if (await dialog.isVisible({ timeout: 3000 })) {
        console.log('Range dialog appeared');

        // Set min year
        const minInput = qcPopup.locator('p-dialog p-inputnumber input').first();
        if (await minInput.count() > 0) {
          await minInput.fill('2020');
        }

        await qcPopup.screenshot({ path: 'test-results/p2m-04-year-input.png', fullPage: true });

        // Click Apply
        const applyBtn = qcPopup.locator('p-dialog button').filter({ hasText: /Apply|OK|Save/i });
        if (await applyBtn.count() > 0) {
          await applyBtn.click();
          await qcPopup.waitForTimeout(1500);
        }
      }
    }

    await qcPopup.screenshot({ path: 'test-results/p2m-05-after-filter.png', fullPage: true });

    // Step 4: Check if main window URL updated
    console.log('\n[STEP 4] Check main window for URL update');
    await page.waitForTimeout(2000);

    const newUrl = page.url();
    console.log('Main window URL after popout filter:', newUrl);

    await page.screenshot({ path: 'test-results/p2m-06-main-after.png', fullPage: true });

    if (newUrl !== initialUrl) {
      console.log('SUCCESS: Main window URL changed after popout selection');
    } else {
      console.log('WARNING: Main window URL did not change');
    }

    // Check for filter chips in main window
    const mainChips = await page.locator('app-query-control p-chip').count();
    console.log(`Filter chips in main window: ${mainChips}`);

    // Close popout
    await qcPopup.close();

    console.log('\n=== Test complete ===');
  });
});
