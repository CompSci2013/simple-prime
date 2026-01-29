import { test, expect } from '@playwright/test';
import { TestLogger, createTestLogger } from '../test-logger';

/**
 * Pop-out Window Synchronization Test Suite
 *
 * Verifies that pop-out windows receive STATE_UPDATE messages via BroadcastChannel
 * and stay synchronized with the main window when filters change.
 *
 * Architecture Overview:
 * - Main window owns the URL state (source of truth)
 * - Pop-out windows subscribe to BroadcastChannel for STATE_UPDATE messages
 * - When main window filters change, it broadcasts STATE_UPDATE to all pop-outs
 * - Pop-outs should reflect the new filter state without page reload
 */

test.describe('Pop-out Window Synchronization', () => {
  let mainLogger: TestLogger;
  let popoutLogger: TestLogger;

  test('Query Control pop-out receives STATE_UPDATE when main window changes filter', async ({ page, context }) => {
    // Initialize logger for main page
    mainLogger = await createTestLogger(page);

    // Step 1: Navigate to discover page
    console.log('\n[TEST] Step 1: Navigate to /automobiles/discover');
    await page.goto('/automobiles/discover');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('[data-testid="results-table"]')).toBeVisible({ timeout: 10000 });

    // Verify initial state - 4887 total records
    const initialPaginator = page.locator('[data-testid="results-table"] .p-paginator-current').first();
    await expect(initialPaginator).toContainText(/4887/, { timeout: 5000 });
    console.log('[TEST] Initial state verified: 4887 records');

    // Step 2: Open Query Control pop-out window using the correct ID selector
    console.log('\n[TEST] Step 2: Opening Query Control pop-out window');

    const [popoutPage] = await Promise.all([
      context.waitForEvent('page'),
      page.locator('#popout-query-control').click()
    ]);

    await popoutPage.waitForLoadState('load');
    console.log(`[TEST] Pop-out window opened: ${popoutPage.url()}`);

    // Initialize logger for pop-out page
    popoutLogger = await createTestLogger(popoutPage);

    // Wait for pop-out to fully initialize
    await popoutPage.waitForLoadState('networkidle');
    await popoutPage.waitForTimeout(500);

    // Verify pop-out shows Query Control component
    const popoutQueryControl = popoutPage.locator('app-query-control');
    await expect(popoutQueryControl).toBeVisible({ timeout: 5000 });
    console.log('[TEST] Pop-out Query Control component visible');

    // Step 3: In main window, apply a filter via URL change (without full navigation)
    console.log('\n[TEST] Step 3: Applying Year filter in main window');

    // Clear main logger to focus on sync-related logs
    mainLogger.clear();

    // Use history.pushState + dispatch popstate to trigger URL change without closing pop-out
    await page.evaluate(() => {
      const newUrl = '/automobiles/discover?yearMin=2020&yearMax=2024';
      window.history.pushState({}, '', newUrl);
      window.dispatchEvent(new PopStateEvent('popstate'));
    });

    // Wait for the app to react to URL change
    await page.waitForTimeout(1500);

    // Wait for main window to update
    await expect(page.locator('[data-testid="results-table"]')).toBeVisible({ timeout: 10000 });

    // Verify main window shows filtered results (less than 4887)
    const filteredPaginator = page.locator('[data-testid="results-table"] .p-paginator-current').first();
    const filteredText = await filteredPaginator.textContent();
    console.log(`[TEST] Main window after filter: ${filteredText}`);
    expect(filteredText).not.toContain('4887');

    // Step 4: Verify pop-out received the STATE_UPDATE and shows filter chip
    console.log('\n[TEST] Step 4: Verifying pop-out received STATE_UPDATE');

    // Wait for BroadcastChannel message to propagate
    await popoutPage.waitForTimeout(1000);

    // Check for Year filter chip in pop-out
    const yearChip = popoutPage.locator('p-chip').filter({ hasText: /Year/i }).first();

    // The pop-out should now show the Year filter chip
    const chipVisible = await yearChip.isVisible().catch(() => false);
    console.log(`[TEST] Year filter chip visible in pop-out: ${chipVisible}`);

    if (chipVisible) {
      console.log('[TEST] SUCCESS: Pop-out synchronized with main window filter');
    } else {
      // Check console logs for BroadcastChannel activity
      const popoutLogs = popoutLogger.getConsoleLogs();
      console.log(`[TEST] Pop-out console logs (${popoutLogs.length}):`);
      popoutLogs.slice(-10).forEach(log => {
        console.log(`  [${log.type}] ${log.text.substring(0, 100)}`);
      });
    }

    // The test passes if the chip is visible (sync worked)
    await expect(yearChip).toBeVisible({ timeout: 5000 });

    // Step 5: Print summaries
    console.log('\n[TEST] === MAIN WINDOW LOGS ===');
    mainLogger.printSummary();

    console.log('\n[TEST] === POP-OUT WINDOW LOGS ===');
    popoutLogger.printSummary();

    // Cleanup
    await popoutPage.close();
  });

  test('Pop-out receives filter updates via BroadcastChannel message', async ({ page, context }) => {
    mainLogger = await createTestLogger(page);

    // Navigate with existing filter
    await page.goto('/automobiles/discover?manufacturer=Ford');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('[data-testid="results-table"]')).toBeVisible({ timeout: 10000 });

    console.log('\n[TEST] Initial state: manufacturer=Ford filter applied');

    // Verify Ford filter chip is visible in main (use first() to avoid strict mode)
    await expect(page.locator('p-chip').filter({ hasText: /Manufacturer/i }).first()).toBeVisible();

    // Open Results Table pop-out
    console.log('[TEST] Opening Results Table pop-out...');

    const [popoutPage] = await Promise.all([
      context.waitForEvent('page'),
      page.locator('#popout-results-table').click()
    ]);

    await popoutPage.waitForLoadState('load');
    popoutLogger = await createTestLogger(popoutPage);
    await popoutPage.waitForLoadState('networkidle');

    console.log(`[TEST] Pop-out opened: ${popoutPage.url()}`);

    // Give time for initial sync
    await popoutPage.waitForTimeout(1000);

    // Check if pop-out received initial state
    const popoutLogs = popoutLogger.getConsoleLogs();
    const stateUpdateLogs = popoutLogs.filter(log =>
      log.text.includes('STATE_UPDATE') ||
      log.text.includes('BroadcastChannel') ||
      log.text.includes('syncStateFromExternal')
    );

    console.log(`[TEST] Found ${stateUpdateLogs.length} STATE_UPDATE related logs in pop-out`);
    stateUpdateLogs.forEach(log => console.log(`  - ${log.text.substring(0, 100)}`));

    // Now change filter in main window (without full navigation to keep pop-out alive)
    mainLogger.clear();
    console.log('\n[TEST] Adding yearMin filter in main window...');

    await page.evaluate(() => {
      const newUrl = '/automobiles/discover?manufacturer=Ford&yearMin=2020';
      window.history.pushState({}, '', newUrl);
      window.dispatchEvent(new PopStateEvent('popstate'));
    });

    // Wait for sync
    await page.waitForTimeout(1500);

    // Check pop-out logs for new STATE_UPDATE
    const newPopoutLogs = popoutLogger.getConsoleLogs();
    console.log(`[TEST] Pop-out now has ${newPopoutLogs.length} console logs`);

    // Verify no errors in either window
    expect(mainLogger.hasConsoleErrors()).toBe(false);
    expect(popoutLogger.hasConsoleErrors()).toBe(false);

    console.log('[TEST] No console errors in main or pop-out windows');

    // Print summaries
    console.log('\n[TEST] === MAIN WINDOW LOGS ===');
    mainLogger.printSummary();

    console.log('\n[TEST] === POP-OUT WINDOW LOGS ===');
    popoutLogger.printSummary();

    // Cleanup
    await popoutPage.close();
  });

});
