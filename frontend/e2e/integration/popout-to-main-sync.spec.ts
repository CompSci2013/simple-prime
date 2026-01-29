/**
 * Pop-out to Main Window Synchronization Integration Test
 *
 * Tests the systemic communication layer between pop-out windows and the main window.
 * Verifies that interactions in pop-out windows correctly update the main window's URL.
 *
 * Bug Discovery: Session 59 uncovered that DiscoverComponent.handlePopOutMessage()
 * was missing handlers for several message types, causing pop-out interactions to
 * be silently ignored.
 *
 * Fixed Message Types:
 * - PICKER_SELECTION_CHANGE (Picker pop-out selections)
 * - FILTER_ADD (Query Control filter additions)
 * - FILTER_REMOVE (Query Control filter removals)
 * - HIGHLIGHT_REMOVE (Individual highlight removal)
 * - CLEAR_HIGHLIGHTS (Clear all highlights)
 */

import { test, expect, Page } from '@playwright/test';
import { TestLogger } from '../test-logger';

test.describe('Pop-out to Main Window Sync', () => {
  let mainPage: Page;
  let popoutPage: Page;
  let mainLogger: TestLogger;
  let popoutLogger: TestLogger;

  test.beforeEach(async ({ context }) => {
    mainPage = await context.newPage();
    mainLogger = new TestLogger(mainPage);
    await mainLogger.start();

    await mainPage.goto('/automobiles/discover');
    await mainPage.waitForLoadState('networkidle');
  });

  test.afterEach(async () => {
    console.log('\n=== MAIN WINDOW LOGS ===');
    mainLogger.printSummary();

    if (popoutLogger) {
      console.log('\n=== POP-OUT WINDOW LOGS ===');
      popoutLogger.printSummary();
    }
  });

  test('Picker selection in pop-out should update main window URL', async ({ context }) => {
    // Step 1: Wait for picker panel
    await mainPage.waitForSelector('[data-testid="picker-panel"]', { timeout: 10000 });
    console.log('[TEST] Step 1: Main window loaded with picker panel');

    // Step 2: Pop out the Picker panel
    const popoutButton = mainPage.locator('#popout-manufacturer-model-picker');
    await expect(popoutButton).toBeVisible({ timeout: 10000 });

    const popoutPromise = context.waitForEvent('page');
    await popoutButton.click();
    popoutPage = await popoutPromise;

    popoutLogger = new TestLogger(popoutPage);
    await popoutLogger.start();

    await popoutPage.waitForLoadState('networkidle');
    console.log('[TEST] Step 2: Picker pop-out opened');

    // Step 3: Wait for picker table to load
    await popoutPage.waitForSelector('.p-datatable-tbody tr', { timeout: 10000 });
    console.log('[TEST] Step 3: Picker table loaded in pop-out');

    // Step 4: Get main URL before selection
    const urlBefore = mainPage.url();
    console.log(`[TEST] Step 4: Main URL before selection: ${urlBefore}`);
    expect(urlBefore).not.toContain('modelCombos=');

    // Step 5: Select first item in pop-out picker
    const checkboxes = popoutPage.locator('.p-datatable-tbody tr .p-checkbox-box');
    const checkboxCount = await checkboxes.count();
    console.log(`[TEST] Step 5: Found ${checkboxCount} checkboxes`);

    if (checkboxCount >= 1) {
      await checkboxes.nth(0).click();
      console.log('[TEST] Clicked first checkbox');
    }

    // Step 6: Wait for state sync via BroadcastChannel
    await mainPage.waitForTimeout(1500);

    // Step 7: Verify main window URL updated with modelCombos
    const urlAfter = mainPage.url();
    console.log(`[TEST] Step 7: Main URL after selection: ${urlAfter}`);

    // This is the critical assertion - main URL should contain the selection
    expect(urlAfter).toContain('modelCombos=');

    // Verify no errors
    expect(mainLogger.hasConsoleErrors()).toBe(false);
    expect(popoutLogger.hasConsoleErrors()).toBe(false);

    console.log('[TEST] SUCCESS: Picker selection in pop-out updated main window URL');
  });

  test('Clear All in pop-out Query Control should clear main window URL', async ({ context }) => {
    // Step 1: First apply a filter so we have something to clear
    await mainPage.goto('/automobiles/discover?manufacturer=Ford');
    await mainPage.waitForLoadState('networkidle');
    console.log('[TEST] Step 1: Loaded with manufacturer=Ford filter');

    // Verify URL has the filter
    expect(mainPage.url()).toContain('manufacturer=Ford');

    // Step 2: Pop out Query Control
    const popoutButton = mainPage.locator('#popout-query-control');
    await expect(popoutButton).toBeVisible({ timeout: 10000 });

    const popoutPromise = context.waitForEvent('page');
    await popoutButton.click();
    popoutPage = await popoutPromise;

    popoutLogger = new TestLogger(popoutPage);
    await popoutLogger.start();

    await popoutPage.waitForLoadState('networkidle');
    console.log('[TEST] Step 2: Query Control pop-out opened');

    // Step 3: Wait for Query Control to load and show the filter chip
    await popoutPage.waitForSelector('[data-testid="query-control-panel"]', { timeout: 10000 });
    console.log('[TEST] Step 3: Query Control loaded in pop-out');

    // Step 4: Click Clear All in pop-out
    const clearButton = popoutPage.locator('button:has-text("Clear")').first();
    if (await clearButton.isVisible({ timeout: 5000 })) {
      await clearButton.click();
      console.log('[TEST] Step 4: Clicked Clear All in pop-out');
    } else {
      console.log('[TEST] Step 4: Clear button not visible (no filters to clear)');
    }

    // Step 5: Wait for state sync
    await mainPage.waitForTimeout(1500);

    // Step 6: Verify main window URL is cleared
    const urlAfter = mainPage.url();
    console.log(`[TEST] Step 6: Main URL after Clear All: ${urlAfter}`);

    // URL should no longer have the filter
    expect(urlAfter).not.toContain('manufacturer=Ford');

    // Verify no errors
    expect(mainLogger.hasConsoleErrors()).toBe(false);
    expect(popoutLogger.hasConsoleErrors()).toBe(false);

    console.log('[TEST] SUCCESS: Clear All in pop-out cleared main window URL');
  });
});
