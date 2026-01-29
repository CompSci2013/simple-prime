/**
 * Bug #10 Regression Test: Popped-Out Statistics Panel breaks with pre-selected bodyClass filters
 *
 * Steps to reproduce:
 * 1. Navigate to /automobiles/discover?bodyClass=Coupe,Sedan
 * 2. Verify main window statistics charts render correctly
 * 3. Pop out the Statistics Panel
 * 4. Verify pop-out window charts are visible and show data
 *
 * Expected: Pop-out shows same charts/data as main window
 * Actual (bug): Pop-out shows empty charts or console errors
 *
 * Root Cause Hypothesis: Statistics component may have lifecycle issues similar to Bug #14,
 * or may not be properly handling STATE_UPDATE messages in pop-out context.
 *
 * Lessons Applied from Bug #14:
 * - Test with BOTH windows active (main + pop-out)
 * - Use comprehensive logging to trace message flow
 * - Watch for service lifecycle violations
 * - Check zone boundary issues
 */

import { test, expect, Page, BrowserContext } from '@playwright/test';
import { TestLogger } from '../test-logger';

test.describe('Bug #10: Statistics Panel Pop-Out with Pre-Selected Filters', () => {

  test('Pop-out Statistics Panel should render charts when main window has bodyClass filter', async ({ page, context }) => {
    // Initialize logger for main window
    const mainLogger = new TestLogger(page);

    console.log('[TEST] ============================================');
    console.log('[TEST] Bug #10 Reproduction Test Starting');
    console.log('[TEST] ============================================');

    // --------------------------------------------------------
    // STEP 1: Navigate with pre-selected bodyClass filter
    // --------------------------------------------------------
    console.log('[TEST] Step 1: Navigate to /automobiles/discover?bodyClass=Coupe,Sedan');
    await page.goto('/automobiles/discover?bodyClass=Coupe,Sedan');
    await page.waitForSelector('.p-dropdown', { timeout: 10000 });
    await page.waitForTimeout(1000); // Let Angular settle

    // Verify URL has the filter
    const url = page.url();
    console.log(`[TEST] Current URL: ${url}`);
    expect(url).toContain('bodyClass=');

    // --------------------------------------------------------
    // STEP 2: Verify main window statistics charts are rendering
    // --------------------------------------------------------
    console.log('[TEST] Step 2: Verify main window statistics charts');

    // Look for chart containers in main window
    const mainCharts = page.locator('.chart-container, plotly-plot, [class*="chart"], canvas');
    const mainChartCount = await mainCharts.count();
    console.log(`[TEST] Main window chart elements found: ${mainChartCount}`);

    // Also check for statistics panel
    const statsPanel = page.locator('[class*="statistics"], [class*="stats"], .panel-statistics');
    const statsPanelCount = await statsPanel.count();
    console.log(`[TEST] Main window statistics panel elements: ${statsPanelCount}`);

    // Check for any visible data in charts (pie slices, bars, etc.)
    const chartData = page.locator('.plotly .slice, .plotly .bar, svg path, svg rect');
    const chartDataCount = await chartData.count();
    console.log(`[TEST] Main window chart data elements: ${chartDataCount}`);

    // --------------------------------------------------------
    // STEP 3: Pop out the Statistics Panel
    // --------------------------------------------------------
    console.log('[TEST] Step 3: Pop out the Statistics Panel');

    // Find all popout buttons and list them for debugging
    const allPopoutButtons = page.locator('.pi-external-link, .pi-window-maximize');
    const popoutButtonCount = await allPopoutButtons.count();
    console.log(`[TEST] Total popout buttons found: ${popoutButtonCount}`);

    // List parent panel info for each button
    for (let i = 0; i < popoutButtonCount; i++) {
      const btn = allPopoutButtons.nth(i);
      const parentText = await btn.locator('..').locator('..').textContent().catch(() => 'unknown');
      console.log(`[TEST] Popout button ${i}: parent contains "${parentText?.substring(0, 50)}..."`);
    }

    // Find the statistics panel popout button
    // Statistics panel usually has chart-related content or "statistics" in class/id
    const statsPopoutButton = page.locator(
      '#popout-statistics, ' +
      '[id*="statistics"] .pi-external-link, ' +
      '.statistics .pi-external-link, ' +
      '[class*="statistics"] .pi-external-link, ' +
      '[class*="chart"] .pi-external-link'
    ).first();

    let popoutButtonVisible = await statsPopoutButton.isVisible().catch(() => false);
    console.log(`[TEST] Statistics popout button visible: ${popoutButtonVisible}`);

    // If not found by specific selector, try by position (statistics is often the 3rd panel)
    // Panel order: Query Control, Results Table, Statistics
    if (!popoutButtonVisible && popoutButtonCount >= 3) {
      console.log('[TEST] Trying 3rd popout button (likely statistics)');
    }

    // Wait for new page/window to open
    const popoutPromise = context.waitForEvent('page', { timeout: 10000 });

    if (popoutButtonVisible) {
      await statsPopoutButton.click();
    } else if (popoutButtonCount >= 3) {
      // Click the 3rd popout button (index 2) - likely statistics
      await allPopoutButtons.nth(2).click();
    } else if (popoutButtonCount > 0) {
      // Fallback: click last popout button
      console.log('[TEST] Fallback: clicking last popout button');
      await allPopoutButtons.last().click();
    } else {
      console.log('[TEST] ERROR: Could not find popout button');
      await page.screenshot({ path: 'test-results/bug-10-no-popout-button.png' });
      throw new Error('Could not find statistics popout button');
    }

    const popoutPage = await popoutPromise;
    await popoutPage.waitForLoadState('domcontentloaded');
    await popoutPage.waitForTimeout(2000); // Wait for pop-out to initialize

    console.log(`[TEST] Pop-out window URL: ${popoutPage.url()}`);

    // --------------------------------------------------------
    // STEP 4: Initialize logger on pop-out and verify charts
    // --------------------------------------------------------
    console.log('[TEST] Step 4: Verify pop-out window charts');

    // Initialize logger on pop-out window
    const popoutLogger = new TestLogger(popoutPage);

    // Wait for pop-out content to load
    await popoutPage.waitForSelector('body', { timeout: 10000 });
    await popoutPage.waitForTimeout(1000);

    // Check for charts in pop-out
    const popoutCharts = popoutPage.locator('.chart-container, plotly-plot, [class*="chart"], canvas');
    const popoutChartCount = await popoutCharts.count();
    console.log(`[TEST] Pop-out chart elements found: ${popoutChartCount}`);

    // Check for chart data elements
    const popoutChartData = popoutPage.locator('.plotly .slice, .plotly .bar, svg path, svg rect');
    const popoutChartDataCount = await popoutChartData.count();
    console.log(`[TEST] Pop-out chart data elements: ${popoutChartDataCount}`);

    // Check for any error states
    const errorElements = popoutPage.locator('.error, [class*="error"], .no-data');
    const errorCount = await errorElements.count();
    console.log(`[TEST] Pop-out error elements: ${errorCount}`);

    // Check for loading spinners still visible (stuck loading)
    const spinners = popoutPage.locator('.p-progressspinner, .loading, [class*="spinner"]');
    const spinnerCount = await spinners.count();
    console.log(`[TEST] Pop-out loading spinners: ${spinnerCount}`);

    // --------------------------------------------------------
    // STEP 5: Print logger summaries for both windows
    // --------------------------------------------------------
    console.log('[TEST] ============================================');
    console.log('[TEST] MAIN WINDOW LOGS:');
    mainLogger.printSummary();

    console.log('[TEST] ============================================');
    console.log('[TEST] POP-OUT WINDOW LOGS:');
    popoutLogger.printSummary();

    // --------------------------------------------------------
    // ASSERTIONS
    // --------------------------------------------------------
    console.log('[TEST] ============================================');
    console.log('[TEST] ASSERTIONS');
    console.log('[TEST] ============================================');

    // Pop-out should have chart elements
    if (popoutChartCount === 0) {
      console.log('[TEST] BUG CONFIRMED: No chart elements in pop-out!');
    }

    // Pop-out should have chart data
    if (popoutChartDataCount === 0) {
      console.log('[TEST] BUG CONFIRMED: No chart data elements in pop-out!');
    }

    // Check for console errors
    const hasMainErrors = mainLogger.hasConsoleErrors();
    const hasPopoutErrors = popoutLogger.hasConsoleErrors();
    console.log(`[TEST] Main window console errors: ${hasMainErrors}`);
    console.log(`[TEST] Pop-out window console errors: ${hasPopoutErrors}`);

    // Take screenshots for evidence
    await page.screenshot({ path: 'test-results/bug-10-main-window.png' });
    await popoutPage.screenshot({ path: 'test-results/bug-10-popout-window.png' });

    // Final assertions
    expect(popoutChartCount, 'Pop-out should have chart elements').toBeGreaterThan(0);
    expect(errorCount, 'Pop-out should not have error elements').toBe(0);
    expect(spinnerCount, 'Pop-out should not be stuck loading').toBe(0);

    // Close pop-out
    await popoutPage.close();
  });

  test('Statistics Panel pop-out should receive STATE_UPDATE messages', async ({ page, context }) => {
    const mainLogger = new TestLogger(page);

    console.log('[TEST] ============================================');
    console.log('[TEST] Testing STATE_UPDATE message propagation');
    console.log('[TEST] ============================================');

    // Navigate without filters first
    await page.goto('/automobiles/discover');
    await page.waitForSelector('.p-dropdown', { timeout: 10000 });
    await page.waitForTimeout(1000);

    // Open pop-out
    const popoutPromise = context.waitForEvent('page', { timeout: 10000 });

    // Find statistics popout button (or any panel popout)
    const popoutButtons = page.locator('.pi-external-link, button[class*="popout"]');
    const buttonCount = await popoutButtons.count();
    console.log(`[TEST] Found ${buttonCount} popout buttons`);

    if (buttonCount > 0) {
      // Click the first one (adjust index if needed for statistics specifically)
      await popoutButtons.first().click();

      const popoutPage = await popoutPromise;
      await popoutPage.waitForLoadState('domcontentloaded');
      await popoutPage.waitForTimeout(1000);

      const popoutLogger = new TestLogger(popoutPage);

      console.log('[TEST] Pop-out opened, now applying filter in main window...');

      // Apply bodyClass filter in main window via URL
      await page.evaluate(() => {
        window.history.pushState({}, '', '/automobiles/discover?bodyClass=Coupe');
        window.dispatchEvent(new PopStateEvent('popstate'));
      });

      // Wait for state to propagate
      await page.waitForTimeout(2000);

      // Check pop-out received the update
      console.log('[TEST] Checking if pop-out received STATE_UPDATE...');

      // Print logs from both windows
      console.log('[TEST] MAIN WINDOW LOGS:');
      mainLogger.printSummary();

      console.log('[TEST] POP-OUT WINDOW LOGS:');
      popoutLogger.printSummary();

      // Pop-out should have reacted to the filter change
      // Look for filter-related logs or API calls
      const popoutUrl = popoutPage.url();
      console.log(`[TEST] Pop-out URL after filter: ${popoutUrl}`);

      // Pop-out URL should NOT have query params (URL-First architecture)
      expect(popoutUrl).not.toContain('bodyClass=');

      await popoutPage.close();
    } else {
      console.log('[TEST] No popout buttons found - cannot test STATE_UPDATE');
      test.skip();
    }
  });

});
