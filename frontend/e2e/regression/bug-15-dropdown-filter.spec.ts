/**
 * Bug #15 Regression Test: Filtered Dropdown Selects Wrong Item
 *
 * Steps to reproduce:
 * 1. Open the filter dropdown
 * 2. Type 'y' in the search field to filter options
 * 3. Arrow down to highlight 'Year' (the filtered list shows 'Body Class' and 'Year')
 * 4. Press Space or Enter
 *
 * Expected: Year Range dialog opens (showing min/max inputs)
 * Actual (bug): Model dialog opens instead (wrong index lookup)
 *
 * Root Cause: The onDropdownKeydown() handler uses index-based lookup on filterFieldOptions[],
 * but when filter text is active, the visible list is filtered. The index of highlighted item
 * in filtered list doesn't match the index in filterFieldOptions.
 *
 * @see query-control.component.ts lines 313-324
 */

import { test, expect, Page } from '@playwright/test';
import { TestLogger } from '../test-logger';

test.describe('Bug #15: Filtered Dropdown Wrong Selection', () => {
  let logger: TestLogger;

  test.beforeEach(async ({ page }) => {
    logger = new TestLogger(page);
  });

  test.afterEach(async () => {
    logger.printSummary();
  });

  test('Type "y" + ArrowDown + Space should open Year Range dialog, NOT Model dialog', async ({ page }) => {
    // Navigate to discover page
    await page.goto('/automobiles/discover');

    // Wait for page to load completely
    await page.waitForSelector('.p-dropdown', { timeout: 10000 });
    await page.waitForTimeout(500); // Let Angular settle
    console.log('[TEST] Page loaded, dropdown visible');

    // Step 1: Click dropdown to open it
    const dropdown = page.locator('.p-dropdown').first();
    await dropdown.click();
    await page.waitForSelector('.p-dropdown-items', { timeout: 5000 });
    console.log('[TEST] Dropdown opened');

    // Step 2: Type 'y' in the filter input to filter options
    const filterInput = page.locator('.p-dropdown-filter');
    await expect(filterInput).toBeVisible({ timeout: 5000 });
    await filterInput.fill('y');
    await page.waitForTimeout(300); // Wait for filter to apply

    // Verify filtering worked
    const visibleOptions = page.locator('.p-dropdown-items li');
    const optionCount = await visibleOptions.count();
    console.log(`[TEST] After typing 'y': ${optionCount} visible options`);

    // List the visible options
    const optionTexts: string[] = [];
    for (let i = 0; i < optionCount; i++) {
      const text = await visibleOptions.nth(i).textContent();
      optionTexts.push(text?.trim() || '');
    }
    console.log(`[TEST] Visible options: ${JSON.stringify(optionTexts)}`);

    // Expect: "Body Class" and "Year" should be visible (both contain 'y')
    expect(optionTexts.some(t => t.toLowerCase().includes('body'))).toBeTruthy();
    expect(optionTexts.some(t => t.toLowerCase().includes('year'))).toBeTruthy();

    // Step 3: Press ArrowDown to navigate to options
    await filterInput.press('ArrowDown');
    await page.waitForTimeout(100);

    let highlightedText = await page.locator('.p-dropdown-items .p-highlight').textContent().catch(() => '');
    console.log(`[TEST] After first ArrowDown, highlighted: "${highlightedText?.trim()}"`);

    // Navigate to Year option
    if (highlightedText?.toLowerCase().includes('body')) {
      await filterInput.press('ArrowDown');
      await page.waitForTimeout(100);
      highlightedText = await page.locator('.p-dropdown-items .p-highlight').textContent().catch(() => '');
      console.log(`[TEST] After second ArrowDown, highlighted: "${highlightedText?.trim()}"`);
    }

    // Verify Year is highlighted
    expect(highlightedText?.toLowerCase()).toContain('year');
    console.log('[TEST] Year option is highlighted, pressing Space to select...');

    // Step 4: Press Space to select
    // This triggers onDropdownKeydown() -> onFieldSelected() -> openFilterDialog()
    await filterInput.press(' ');
    await page.waitForTimeout(1000); // Wait for dialog to open

    // Step 5: Check which dialog opened
    // Check for any visible dialog
    const anyDialog = page.locator('.p-dialog');
    const dialogVisible = await anyDialog.isVisible().catch(() => false);
    console.log(`[TEST] Any dialog visible: ${dialogVisible}`);

    if (dialogVisible) {
      // Get dialog header/title
      const dialogHeader = await page.locator('.p-dialog-header, .p-dialog-title').first().textContent().catch(() => '');
      console.log(`[TEST] Dialog header: "${dialogHeader}"`);

      // Check for Year Range specific elements (p-inputNumber for year input)
      const yearInputs = page.locator('.p-dialog p-inputnumber');
      const hasYearInputs = await yearInputs.count() > 0;
      console.log(`[TEST] Has Year input fields: ${hasYearInputs}`);

      // Check for Multiselect specific elements (checkboxes)
      const checkboxes = page.locator('.p-dialog .p-checkbox');
      const hasCheckboxes = await checkboxes.count() > 0;
      console.log(`[TEST] Has Checkboxes (multiselect): ${hasCheckboxes}`);

      // If checkboxes are present but Year inputs are not, the wrong dialog opened
      if (hasCheckboxes && !hasYearInputs) {
        console.log('[TEST] BUG CONFIRMED: Multiselect dialog opened when Year Range should have opened!');
        // Get dialog subtitle which often shows which filter is selected
        const subtitle = await page.locator('.p-dialog .dialog-subtitle').textContent().catch(() => '');
        console.log(`[TEST] Dialog subtitle: "${subtitle}"`);
      }

      // Assert that Year Range dialog opened (has year inputs, not checkboxes)
      expect(hasYearInputs).toBeTruthy();
      expect(hasCheckboxes).toBeFalsy();
    } else {
      console.log('[TEST] No dialog opened at all!');
      // Fail the test - dialog should have opened
      expect(dialogVisible).toBeTruthy();
    }
  });

  test('Click on Year option directly should work (mouse baseline)', async ({ page }) => {
    await page.goto('/automobiles/discover');
    await page.waitForSelector('.p-dropdown', { timeout: 10000 });
    await page.waitForTimeout(500);

    // Open dropdown
    const dropdown = page.locator('.p-dropdown').first();
    await dropdown.click();
    await page.waitForSelector('.p-dropdown-items', { timeout: 5000 });

    // Type 'y' to filter
    const filterInput = page.locator('.p-dropdown-filter');
    await filterInput.fill('y');
    await page.waitForTimeout(300);

    // Click directly on Year option
    const yearOption = page.locator('.p-dropdown-items li').filter({ hasText: /^Year$/ });
    await yearOption.click();
    await page.waitForTimeout(1000);

    // Verify Year Range dialog opened
    const yearInputs = page.locator('.p-dialog p-inputnumber');
    const hasYearInputs = await yearInputs.count() > 0;
    console.log(`[TEST] Mouse click: Has Year input fields: ${hasYearInputs}`);

    expect(hasYearInputs).toBeTruthy();
  });
});
