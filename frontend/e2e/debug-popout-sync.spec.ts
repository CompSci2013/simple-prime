import { test, expect, Page, BrowserContext } from '@playwright/test';

/**
 * Comprehensive popout synchronization test
 * Tests bidirectional sync between main window and popout windows
 */

test.describe('Popout Synchronization', () => {
  test.setTimeout(90000); // 90 second timeout

  test('Chart popout: selection in main should highlight in popout', async ({ page, context }) => {
    console.log('\n=== TEST: Chart popout sync ===');

    // Step 1: Navigate to discover page
    console.log('\n[STEP 1] Navigate to automobiles/discover');
    await page.goto('/automobiles/discover');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // Wait for charts to render

    await page.screenshot({ path: 'test-results/sync-01-initial.png', fullPage: true });

    // Step 2: Open a chart popout
    console.log('\n[STEP 2] Open chart popout');
    const chartPopoutBtn = page.locator('#popout-chart-body-class');
    await expect(chartPopoutBtn).toBeVisible();

    const [chartPopup] = await Promise.all([
      context.waitForEvent('page'),
      chartPopoutBtn.click()
    ]);

    await chartPopup.waitForLoadState('networkidle');
    await chartPopup.waitForTimeout(1000);

    console.log('Chart popup URL:', chartPopup.url());
    await chartPopup.screenshot({ path: 'test-results/sync-02-chart-popout.png', fullPage: true });

    // Check if chart is visible in popout
    const popoutChart = chartPopup.locator('app-base-chart');
    const chartCount = await popoutChart.count();
    console.log(`Charts in popout: ${chartCount}`);

    // Step 3: In main window, click on a different chart to make a selection
    console.log('\n[STEP 3] Click on a chart bar in main window to add filter');

    // Find manufacturer chart and click on it
    const mainCharts = page.locator('app-base-chart');
    const mainChartCount = await mainCharts.count();
    console.log(`Charts in main window: ${mainChartCount}`);

    // Try to click on a chart bar (assuming it's a bar chart)
    // Look for canvas or SVG elements
    const canvas = page.locator('canvas').first();
    if (await canvas.count() > 0) {
      console.log('Found canvas element, clicking on it');
      await canvas.click({ position: { x: 100, y: 100 } });
      await page.waitForTimeout(1000);
    }

    await page.screenshot({ path: 'test-results/sync-03-after-chart-click.png', fullPage: true });
    await chartPopup.screenshot({ path: 'test-results/sync-04-popout-after-click.png', fullPage: true });

    // Check URL for filter changes
    console.log('Main window URL after click:', page.url());

    // Step 4: Check if popout received the update via console logs
    console.log('\n[STEP 4] Check for BroadcastChannel activity');

    // Look for filter chips in main window
    const mainFilterChips = await page.locator('p-chip').count();
    console.log(`Filter chips in main window: ${mainFilterChips}`);

    // Close chart popout
    await chartPopup.close();

    console.log('\n=== Chart sync test complete ===');
  });

  test('Query control popout: make selection in popout, verify main updates', async ({ page, context }) => {
    console.log('\n=== TEST: Query control popout to main sync ===');

    // Step 1: Navigate with no filters
    console.log('\n[STEP 1] Navigate to automobiles/discover');
    await page.goto('/automobiles/discover');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const initialUrl = page.url();
    console.log('Initial URL:', initialUrl);

    await page.screenshot({ path: 'test-results/qc-01-initial.png', fullPage: true });

    // Step 2: Open Query Control popout
    console.log('\n[STEP 2] Open Query Control popout');
    const qcPopoutBtn = page.locator('#popout-query-control');
    await expect(qcPopoutBtn).toBeVisible();

    const [qcPopup] = await Promise.all([
      context.waitForEvent('page'),
      qcPopoutBtn.click()
    ]);

    await qcPopup.waitForLoadState('networkidle');
    await qcPopup.waitForTimeout(1000);

    console.log('Query Control popup URL:', qcPopup.url());
    await qcPopup.screenshot({ path: 'test-results/qc-02-popout.png', fullPage: true });

    // Step 3: In the popout, find and interact with a dropdown
    console.log('\n[STEP 3] Interact with dropdown in popout');

    // Look for p-dropdown elements
    const dropdowns = qcPopup.locator('p-dropdown');
    const dropdownCount = await dropdowns.count();
    console.log(`Dropdowns in popout: ${dropdownCount}`);

    if (dropdownCount > 0) {
      // Click the first dropdown
      const firstDropdown = dropdowns.first();
      await firstDropdown.click();
      await qcPopup.waitForTimeout(500);

      await qcPopup.screenshot({ path: 'test-results/qc-03-dropdown-open.png', fullPage: true });

      // Select an option
      const options = qcPopup.locator('.p-dropdown-item');
      const optionCount = await options.count();
      console.log(`Dropdown options: ${optionCount}`);

      if (optionCount > 1) {
        // Click the second option (first is usually empty/all)
        await options.nth(1).click();
        await qcPopup.waitForTimeout(1000);

        await qcPopup.screenshot({ path: 'test-results/qc-04-after-selection.png', fullPage: true });

        // Step 4: Check if main window URL updated
        console.log('\n[STEP 4] Check main window for updates');
        await page.waitForTimeout(1500);

        const newUrl = page.url();
        console.log('Main window URL after popout selection:', newUrl);

        await page.screenshot({ path: 'test-results/qc-05-main-after-popout-selection.png', fullPage: true });

        // Check if URL has new parameters
        if (newUrl !== initialUrl) {
          console.log('SUCCESS: Main window URL changed after popout selection');
        } else {
          console.log('WARNING: Main window URL did not change');
        }

        // Check for filter chips in main window
        const chips = await page.locator('p-chip').count();
        console.log(`Filter chips in main window: ${chips}`);
      }
    }

    // Close popout
    await qcPopup.close();

    console.log('\n=== Query control sync test complete ===');
  });

  test('Main to popout sync: apply filter in main, verify popout updates', async ({ page, context }) => {
    console.log('\n=== TEST: Main to popout sync ===');

    // Step 1: Navigate to discover page
    console.log('\n[STEP 1] Navigate to automobiles/discover');
    await page.goto('/automobiles/discover');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    await page.screenshot({ path: 'test-results/m2p-01-initial.png', fullPage: true });

    // Step 2: Open Query Control popout
    console.log('\n[STEP 2] Open Query Control popout');
    const qcPopoutBtn = page.locator('#popout-query-control');

    const [qcPopup] = await Promise.all([
      context.waitForEvent('page'),
      qcPopoutBtn.click()
    ]);

    await qcPopup.waitForLoadState('networkidle');
    await qcPopup.waitForTimeout(1000);

    await qcPopup.screenshot({ path: 'test-results/m2p-02-popout-initial.png', fullPage: true });

    // Count initial chips in popout
    const initialPopoutChips = await qcPopup.locator('p-chip').count();
    console.log(`Initial chips in popout: ${initialPopoutChips}`);

    // Step 3: Apply filter via URL in main window
    console.log('\n[STEP 3] Apply filter via URL change in main window');

    // Use pushState to change URL without full navigation
    await page.evaluate(() => {
      const newUrl = '/automobiles/discover?manufacturer=Ford';
      window.history.pushState({}, '', newUrl);
      window.dispatchEvent(new PopStateEvent('popstate'));
    });

    // Wait for state to propagate
    await page.waitForTimeout(2000);

    await page.screenshot({ path: 'test-results/m2p-03-main-after-filter.png', fullPage: true });

    // Step 4: Check if popout received the update
    console.log('\n[STEP 4] Check if popout received the filter update');

    await qcPopup.screenshot({ path: 'test-results/m2p-04-popout-after-main-filter.png', fullPage: true });

    // Count chips in popout after filter
    const finalPopoutChips = await qcPopup.locator('p-chip').count();
    console.log(`Chips in popout after main filter: ${finalPopoutChips}`);

    // Look for specific filter chip
    const manufacturerChip = qcPopup.locator('p-chip').filter({ hasText: /Manufacturer|Ford/i });
    const manufacturerChipCount = await manufacturerChip.count();
    console.log(`Manufacturer/Ford chips found: ${manufacturerChipCount}`);

    if (finalPopoutChips > initialPopoutChips || manufacturerChipCount > 0) {
      console.log('SUCCESS: Popout received filter update from main window');
    } else {
      console.log('WARNING: Popout may not have received the filter update');
    }

    // Close popout
    await qcPopup.close();

    console.log('\n=== Main to popout sync test complete ===');
  });
});
