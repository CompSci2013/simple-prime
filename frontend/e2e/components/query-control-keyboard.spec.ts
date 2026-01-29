import { test, expect } from '@playwright/test';
import { TestLogger, createTestLogger } from '../test-logger';

/**
 * Query Control Keyboard Interaction Test Suite
 *
 * Tests keyboard navigation in the filter dropdown:
 * - Arrow keys to navigate options
 * - Enter/Space to select and open dialog
 *
 * Bug: Arrow key selection shows filter chip but dialog doesn't open
 * Expected: Selecting via keyboard should open dialog (same as mouse click)
 */

test.describe('Query Control Keyboard Interaction', () => {
  let logger: TestLogger;

  test.beforeEach(async ({ page }) => {
    logger = await createTestLogger(page);
  });

  test.afterEach(async () => {
    logger.printSummary();
  });

  test('Selecting filter via ArrowDown + Enter should open dialog', async ({ page }) => {
    // Navigate to discover page
    await page.goto('/automobiles/discover');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('[data-testid="results-table"]')).toBeVisible({ timeout: 10000 });

    console.log('\n[TEST] Step 1: Focus the filter dropdown');

    // Find and click the dropdown to open it
    const dropdown = page.locator('[data-testid="filter-field-dropdown"]');
    await dropdown.click();

    // Wait for dropdown panel to open
    const dropdownPanel = page.locator('.p-dropdown-panel');
    await expect(dropdownPanel).toBeVisible({ timeout: 5000 });
    console.log('[TEST] Dropdown panel is visible');

    // Get the list of options
    const options = dropdownPanel.locator('.p-dropdown-items li');
    const optionCount = await options.count();
    console.log(`[TEST] Found ${optionCount} options in dropdown`);

    // Log the first few options
    for (let i = 0; i < Math.min(3, optionCount); i++) {
      const text = await options.nth(i).textContent();
      console.log(`[TEST] Option ${i}: ${text}`);
    }

    console.log('\n[TEST] Step 2: Navigate with ArrowDown');

    // Press ArrowDown to highlight first option
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(200);

    // Check which option is highlighted
    const highlightedOption = dropdownPanel.locator('.p-dropdown-items .p-highlight');
    const isHighlighted = await highlightedOption.isVisible();
    console.log(`[TEST] Highlighted option visible: ${isHighlighted}`);

    if (isHighlighted) {
      const highlightedText = await highlightedOption.textContent();
      console.log(`[TEST] Highlighted option text: ${highlightedText}`);
    }

    console.log('\n[TEST] Step 3: Press Enter to select');

    // Press Enter to select the highlighted option
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);

    console.log('\n[TEST] Step 4: Verify dialog opened');

    // Check if dialog is visible
    const dialog = page.locator('.p-dialog');
    const dialogVisible = await dialog.isVisible();
    console.log(`[TEST] Dialog visible after Enter: ${dialogVisible}`);

    // This is the key assertion - the dialog SHOULD be visible
    await expect(dialog).toBeVisible({ timeout: 5000 });

    // If we get here, the test passes
    console.log('[TEST] SUCCESS: Dialog opened after keyboard selection');
  });

  test('Selecting filter via ArrowDown + Space should open dialog', async ({ page }) => {
    await page.goto('/automobiles/discover');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('[data-testid="results-table"]')).toBeVisible({ timeout: 10000 });

    console.log('\n[TEST] Step 1: Focus the filter dropdown');

    const dropdown = page.locator('[data-testid="filter-field-dropdown"]');
    await dropdown.click();

    const dropdownPanel = page.locator('.p-dropdown-panel');
    await expect(dropdownPanel).toBeVisible({ timeout: 5000 });

    console.log('\n[TEST] Step 2: Navigate with ArrowDown');
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(200);

    console.log('\n[TEST] Step 3: Press Space to select');
    await page.keyboard.press('Space');
    await page.waitForTimeout(500);

    console.log('\n[TEST] Step 4: Verify dialog opened');
    const dialog = page.locator('.p-dialog');
    const dialogVisible = await dialog.isVisible();
    console.log(`[TEST] Dialog visible after Space: ${dialogVisible}`);

    // This is the key assertion
    await expect(dialog).toBeVisible({ timeout: 5000 });

    console.log('[TEST] SUCCESS: Dialog opened after Space key selection');
  });

  test('Mouse click on dropdown option should open dialog (baseline)', async ({ page }) => {
    await page.goto('/automobiles/discover');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('[data-testid="results-table"]')).toBeVisible({ timeout: 10000 });

    console.log('\n[TEST] Step 1: Click dropdown to open');

    const dropdown = page.locator('[data-testid="filter-field-dropdown"]');
    await dropdown.click();

    const dropdownPanel = page.locator('.p-dropdown-panel');
    await expect(dropdownPanel).toBeVisible({ timeout: 5000 });

    console.log('\n[TEST] Step 2: Click on first option (Manufacturer)');

    // Click on Manufacturer option
    const manufacturerOption = dropdownPanel.locator('.p-dropdown-items li').filter({ hasText: 'Manufacturer' }).first();
    await manufacturerOption.click();
    await page.waitForTimeout(500);

    console.log('\n[TEST] Step 3: Verify dialog opened');
    const dialog = page.locator('.p-dialog');
    const dialogVisible = await dialog.isVisible();
    console.log(`[TEST] Dialog visible after click: ${dialogVisible}`);

    // Baseline test - this should definitely work
    await expect(dialog).toBeVisible({ timeout: 5000 });

    console.log('[TEST] SUCCESS: Dialog opened after mouse click (baseline confirmed)');
  });

});
