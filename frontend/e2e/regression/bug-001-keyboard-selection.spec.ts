/**
 * Regression Test: BUG-001
 *
 * Issue: Filter field dropdown keyboard selection broken
 * - Arrow keys highlight options correctly
 * - Spacebar adds space to search instead of selecting highlighted option
 * - Enter key should select highlighted option
 *
 * Expected: After typing 'b' (filters to 'Body Class'), pressing Enter or Space
 * should select 'Body Class' and open the dialog.
 */
import { test, expect } from '@playwright/test';

test.describe('BUG-001: Keyboard Selection in Filter Dropdown', () => {
  test.setTimeout(30000);

  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:4205/automobiles/discover');
    await page.waitForLoadState('networkidle');
    await page.locator('.query-control-panel').waitFor({ state: 'visible', timeout: 10000 });
  });

  test('Enter key should select highlighted option after search', async ({ page }) => {
    // Click dropdown to open
    const dropdown = page.locator('p-select').first();
    await dropdown.click();
    await page.waitForTimeout(300);

    // Type 'b' to filter to 'Body Class'
    const filterInput = page.locator('.p-select-filter-container input, .p-select-filter');
    await filterInput.fill('b');
    await page.waitForTimeout(200);

    // Verify only 'Body Class' is visible
    const visibleOptions = page.locator('.p-select-option:visible, .p-select-list-item:visible');
    await expect(visibleOptions).toHaveCount(1);
    await expect(visibleOptions.first()).toContainText('Body Class');

    // Press Enter to select
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);

    // Dialog should open with 'Select Body Class' title
    const dialog = page.locator('p-dialog .p-dialog-title, .p-dialog-header');
    await expect(dialog).toContainText('Body Class');
  });

  test('Space key should select highlighted option (not add space to search)', async ({ page }) => {
    // Click dropdown to open
    const dropdown = page.locator('p-select').first();
    await dropdown.click();
    await page.waitForTimeout(300);

    // Type 'b' to filter to 'Body Class'
    const filterInput = page.locator('.p-select-filter-container input, .p-select-filter');
    await filterInput.fill('b');
    await page.waitForTimeout(200);

    // Press ArrowDown to highlight first option
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(100);

    // Press Space to select (should NOT add space to search)
    await page.keyboard.press('Space');
    await page.waitForTimeout(500);

    // Check: search box should NOT have 'b ' (with space)
    const searchValue = await filterInput.inputValue();
    expect(searchValue).not.toContain(' '); // No space should be added

    // Dialog should open with 'Select Body Class' title
    const dialog = page.locator('p-dialog .p-dialog-title, .p-dialog-header');
    await expect(dialog).toContainText('Body Class');
  });

  test('ArrowDown + Enter should select highlighted option', async ({ page }) => {
    // Click dropdown to open
    const dropdown = page.locator('p-select').first();
    await dropdown.click();
    await page.waitForTimeout(300);

    // Type 'b' to filter to 'Body Class'
    const filterInput = page.locator('.p-select-filter-container input, .p-select-filter');
    await filterInput.fill('b');
    await page.waitForTimeout(200);

    // Press ArrowDown to highlight first option
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(100);

    // Press Enter to select
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);

    // Dialog should open
    const dialog = page.locator('p-dialog .p-dialog-title, .p-dialog-header');
    await expect(dialog).toContainText('Body Class');
  });
});
