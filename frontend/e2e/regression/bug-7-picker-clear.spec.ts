/**
 * Bug #7 Regression Test: Picker checkboxes remain checked after Clear All
 *
 * Original Issue: When items are selected in a popped-out Picker panel and
 * "Clear All" is clicked in the main window, the checkboxes in the pop-out
 * remain visually checked even though the selection state was cleared.
 *
 * Root Cause: The BasePickerComponent used markForCheck() instead of
 * detectChanges() when clearing selections. In pop-out windows, the zone
 * boundary prevents markForCheck() from triggering UI updates.
 *
 * Fix: Changed markForCheck() to detectChanges() in subscribeToUrlChanges()
 * when filter values are cleared.
 *
 * Fixed In: Session 59 (Bug #7 fix)
 */

import { test, expect, Page } from '@playwright/test';
import { TestLogger } from '../test-logger';

test.describe('Bug #7: Picker checkboxes remain checked after Clear All', () => {
  let mainPage: Page;
  let popoutPage: Page;
  let mainLogger: TestLogger;
  let popoutLogger: TestLogger;

  test.beforeEach(async ({ context }) => {
    // Navigate to discover page
    mainPage = await context.newPage();
    mainLogger = new TestLogger(mainPage);
    await mainLogger.start(); // CRITICAL: Start capturing BEFORE navigation

    await mainPage.goto('/automobiles/discover');
    await mainPage.waitForLoadState('networkidle');
  });

  test.afterEach(async () => {
    // ALWAYS print summaries for debugging visibility
    console.log('\n=== MAIN WINDOW LOGS ===');
    mainLogger.printSummary();

    if (popoutLogger) {
      console.log('\n=== POP-OUT WINDOW LOGS ===');
      popoutLogger.printSummary();
    }
  });

  test('Clear All in main window should uncheck picker checkboxes in pop-out', async ({ context }) => {
    // Step 1: Wait for initial data load and verify API calls
    await mainPage.waitForSelector('[data-testid="picker-panel"]', { timeout: 10000 });
    console.log('[TEST] Step 1: Main window loaded');

    // Verify initial API calls completed
    const initialApiCalls = mainLogger.findApiCalls('/api/');
    console.log(`[TEST] Initial API calls: ${initialApiCalls.length}`);
    initialApiCalls.forEach(call => {
      console.log(`[TEST]   ${call.method} ${call.url} -> ${call.status}`);
    });

    // Step 2: Pop out the Picker panel
    const popoutButton = mainPage.locator('#popout-manufacturer-model-picker');
    await expect(popoutButton).toBeVisible({ timeout: 10000 });

    // Listen for new page (pop-out window)
    const popoutPromise = context.waitForEvent('page');
    await popoutButton.click();
    popoutPage = await popoutPromise;

    // Start logger on pop-out BEFORE it loads content
    popoutLogger = new TestLogger(popoutPage);
    await popoutLogger.start();

    await popoutPage.waitForLoadState('networkidle');
    console.log('[TEST] Step 2: Picker pop-out opened');

    // Step 3: Wait for picker table to load in pop-out
    await popoutPage.waitForSelector('.p-datatable-tbody tr', { timeout: 10000 });
    console.log('[TEST] Step 3: Picker table loaded in pop-out');

    // Log pop-out API calls
    const popoutApiCalls = popoutLogger.findApiCalls('/api/');
    console.log(`[TEST] Pop-out API calls: ${popoutApiCalls.length}`);
    popoutApiCalls.forEach(call => {
      console.log(`[TEST]   ${call.method} ${call.url} -> ${call.status}`);
    });

    // Step 4: Select first two items in the pop-out picker
    const checkboxes = popoutPage.locator('.p-datatable-tbody tr .p-checkbox-box');
    const checkboxCount = await checkboxes.count();
    console.log(`[TEST] Step 4: Found ${checkboxCount} checkboxes in picker`);

    if (checkboxCount < 2) {
      throw new Error(`Expected at least 2 checkboxes, found ${checkboxCount}`);
    }

    // Clear logger before selection to isolate selection-related calls
    console.log('[TEST] Clearing loggers before selection...');
    mainLogger.clear();
    popoutLogger.clear();
    await mainLogger.start();
    await popoutLogger.start();

    await checkboxes.nth(0).click();
    await popoutPage.waitForTimeout(500); // Wait for state sync
    await checkboxes.nth(1).click();
    await popoutPage.waitForTimeout(500);
    console.log('[TEST] Selected first 2 items in pop-out picker');

    // Log API calls triggered by selection
    const selectionApiCalls = mainLogger.findApiCalls('/api/');
    console.log(`[TEST] API calls after selection: ${selectionApiCalls.length}`);
    selectionApiCalls.forEach(call => {
      console.log(`[TEST]   ${call.method} ${call.url} -> ${call.status}`);
    });

    // Step 5: Verify checkboxes are checked
    const checkbox1Checked = await checkboxes.nth(0).evaluate(el =>
      el.closest('.p-checkbox')?.classList.contains('p-checkbox-checked') ||
      el.getAttribute('aria-checked') === 'true'
    );
    const checkbox2Checked = await checkboxes.nth(1).evaluate(el =>
      el.closest('.p-checkbox')?.classList.contains('p-checkbox-checked') ||
      el.getAttribute('aria-checked') === 'true'
    );
    console.log(`[TEST] Step 5: Checkbox 1 checked: ${checkbox1Checked}`);
    console.log(`[TEST] Step 5: Checkbox 2 checked: ${checkbox2Checked}`);
    expect(checkbox1Checked).toBe(true);
    expect(checkbox2Checked).toBe(true);

    // Step 6: Verify URL has the filter parameter (selections applied)
    await mainPage.waitForTimeout(500);
    const urlBefore = mainPage.url();
    console.log(`[TEST] Step 6: URL before Clear All: ${urlBefore}`);

    // Check for modelCombos parameter or similar
    expect(urlBefore).toMatch(/modelCombos|manufacturer|model/);

    // Clear logger before Clear All to isolate Clear-related events
    console.log('[TEST] Clearing loggers before Clear All...');
    mainLogger.clear();
    popoutLogger.clear();
    await mainLogger.start();
    await popoutLogger.start();

    // Step 7: Click "Clear All" in main window
    const clearAllButton = mainPage.locator('[data-testid="query-control-panel"] button:has-text("Clear")').first();
    if (await clearAllButton.isVisible()) {
      await clearAllButton.click();
      console.log('[TEST] Step 7: Clicked Clear All in main window');
    } else {
      const altClearButton = mainPage.locator('button:has-text("Clear All")').first();
      await altClearButton.click();
      console.log('[TEST] Step 7: Clicked Clear All (alt selector) in main window');
    }

    // Step 8: Wait for state update to propagate via BroadcastChannel
    await mainPage.waitForTimeout(1000);
    await popoutPage.waitForTimeout(1000);

    // Log console messages during Clear All
    const mainConsoleLogs = mainLogger.getConsoleLogs();
    const popoutConsoleLogs = popoutLogger.getConsoleLogs();
    console.log(`[TEST] Step 8: Main window console logs after Clear: ${mainConsoleLogs.length}`);
    mainConsoleLogs.forEach(log => {
      console.log(`[TEST]   [${log.type}] ${log.text.substring(0, 100)}`);
    });
    console.log(`[TEST] Step 8: Pop-out console logs after Clear: ${popoutConsoleLogs.length}`);
    popoutConsoleLogs.forEach(log => {
      console.log(`[TEST]   [${log.type}] ${log.text.substring(0, 100)}`);
    });

    // Step 9: Verify URL is cleared
    const urlAfter = mainPage.url();
    console.log(`[TEST] Step 9: URL after Clear All: ${urlAfter}`);

    // URL should no longer have the filter params
    expect(urlAfter).not.toMatch(/modelCombos=/);

    // Step 10: THE BUG CHECK - Verify checkboxes in pop-out are UNCHECKED
    const checkbox1AfterClear = await checkboxes.nth(0).evaluate(el =>
      el.closest('.p-checkbox')?.classList.contains('p-checkbox-checked') ||
      el.getAttribute('aria-checked') === 'true'
    );
    const checkbox2AfterClear = await checkboxes.nth(1).evaluate(el =>
      el.closest('.p-checkbox')?.classList.contains('p-checkbox-checked') ||
      el.getAttribute('aria-checked') === 'true'
    );

    console.log(`[TEST] Step 10: After Clear All - Checkbox 1 checked: ${checkbox1AfterClear}`);
    console.log(`[TEST] Step 10: After Clear All - Checkbox 2 checked: ${checkbox2AfterClear}`);

    // This is the critical assertion - checkboxes should be UNCHECKED after Clear All
    expect(checkbox1AfterClear).toBe(false);
    expect(checkbox2AfterClear).toBe(false);

    // Verify no console errors in either window
    const mainErrors = mainLogger.getConsoleErrors();
    const popoutErrors = popoutLogger.getConsoleErrors();
    console.log(`[TEST] Main window errors: ${mainErrors.length}`);
    console.log(`[TEST] Pop-out window errors: ${popoutErrors.length}`);

    if (mainErrors.length > 0) {
      console.log('[TEST] MAIN WINDOW ERRORS:');
      mainErrors.forEach(e => console.log(`[TEST]   ${e.text}`));
    }
    if (popoutErrors.length > 0) {
      console.log('[TEST] POP-OUT ERRORS:');
      popoutErrors.forEach(e => console.log(`[TEST]   ${e.text}`));
    }

    expect(mainErrors.length).toBe(0);
    expect(popoutErrors.length).toBe(0);

    // Also check for warnings (informational, not assertion failure)
    const mainWarnings = mainLogger.getConsoleWarnings();
    const popoutWarnings = popoutLogger.getConsoleWarnings();
    if (mainWarnings.length > 0 || popoutWarnings.length > 0) {
      console.log(`[TEST] Warnings detected: Main=${mainWarnings.length}, PopOut=${popoutWarnings.length}`);
    }

    console.log('[TEST] SUCCESS: Picker checkboxes correctly unchecked after Clear All');
  });
});
