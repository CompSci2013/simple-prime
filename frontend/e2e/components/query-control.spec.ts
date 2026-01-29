/**
 * Query Control Component Test Suite
 *
 * Tests the Query Control component which provides filter management:
 * - Filter field dropdown (selecting which filter to add)
 * - Multiselect dialogs (Manufacturer, Model, Body Class)
 * - Year Range dialog
 * - Filter chips (display, edit, remove)
 * - Clear All button
 *
 * These tests run against the component in the main window (not pop-out).
 * Pop-out specific tests are in ../popout/popout-query-control.spec.ts
 */

import { test, expect } from '@playwright/test';
import { TestLogger, createTestLogger } from '../test-logger';
import {
  navigateToDiscover,
  navigateWithFilters,
  openFilterDropdown,
  closeFilterDropdown,
  getDropdownOptions,
  selectFilterByClick,
  selectFilterByKeyboard,
  selectFilterWithSearch,
  isMultiselectDialogVisible,
  isYearRangeDialogVisible,
  getDialogTitle,
  searchInDialog,
  selectDialogOptions,
  getDialogOptions,
  clickDialogApply,
  clickDialogCancel,
  waitForDialogOptionsLoaded,
  setYearRange,
  getActiveFilterChips,
  hasFilterChip,
  clickFilterChip,
  removeFilterChip,
  clickClearAll,
  isClearAllEnabled,
  urlHasParam,
  waitForUrlParam,
  AUTOMOBILE_BASELINE,
} from '../test-helpers';

test.describe('Query Control Component', () => {
  let logger: TestLogger;

  test.beforeEach(async ({ page }) => {
    logger = new TestLogger(page);
  });

  test.afterEach(async () => {
    logger.printSummary();
  });

  // ============================================================
  // FILTER DROPDOWN TESTS
  // ============================================================
  test.describe('Filter Dropdown', () => {

    test('opens when clicked', async ({ page }) => {
      await navigateToDiscover(page);

      await openFilterDropdown(page);

      const dropdownPanel = page.locator('.p-dropdown-items');
      await expect(dropdownPanel).toBeVisible();
    });

    test('shows all filter options', async ({ page }) => {
      await navigateToDiscover(page);

      await openFilterDropdown(page);
      const options = await getDropdownOptions(page);

      console.log(`[TEST] Dropdown options: ${options.join(', ')}`);

      // Verify expected options are present
      expect(options).toContain('Manufacturer');
      expect(options).toContain('Model');
      expect(options).toContain('Body Class');
      expect(options).toContain('Year');
    });

    test('filters options when typing in search', async ({ page }) => {
      await navigateToDiscover(page);

      await openFilterDropdown(page);

      // Type in filter
      const filterInput = page.locator('.p-dropdown-filter');
      await filterInput.fill('man');
      await page.waitForTimeout(300);

      const options = await getDropdownOptions(page);
      console.log(`[TEST] Filtered options (search "man"): ${options.join(', ')}`);

      // Should show Manufacturer (contains "man")
      expect(options.some(o => o.toLowerCase().includes('manufacturer'))).toBeTruthy();
      // Should NOT show Year (doesn't contain "man")
      expect(options.some(o => o.toLowerCase() === 'year')).toBeFalsy();
    });

    test('closes when pressing Escape', async ({ page }) => {
      await navigateToDiscover(page);

      await openFilterDropdown(page);
      await expect(page.locator('.p-dropdown-items')).toBeVisible();

      await closeFilterDropdown(page);
      await expect(page.locator('.p-dropdown-items')).not.toBeVisible();
    });

    test('selects option with mouse click and opens dialog', async ({ page }) => {
      await navigateToDiscover(page);

      await selectFilterByClick(page, 'Manufacturer');

      // Dialog should be visible
      const dialogVisible = await isMultiselectDialogVisible(page);
      expect(dialogVisible).toBeTruthy();

      const title = await getDialogTitle(page);
      console.log(`[TEST] Dialog title: ${title}`);
      expect(title.toLowerCase()).toContain('manufacturer');
    });

    test('selects option with keyboard (ArrowDown + Enter)', async ({ page }) => {
      await navigateToDiscover(page);

      await openFilterDropdown(page);

      // Navigate with arrow keys
      await page.keyboard.press('ArrowDown');
      await page.waitForTimeout(100);

      // Verify highlight moved
      const highlighted = page.locator('.p-dropdown-items .p-highlight');
      await expect(highlighted).toBeVisible();

      // Press Enter to select
      await page.keyboard.press('Enter');
      await page.waitForTimeout(500);

      // Dialog should open
      const dialogVisible = await isMultiselectDialogVisible(page);
      expect(dialogVisible).toBeTruthy();
    });

    test('selects option with keyboard (ArrowDown + Space)', async ({ page }) => {
      await navigateToDiscover(page);

      await openFilterDropdown(page);

      await page.keyboard.press('ArrowDown');
      await page.waitForTimeout(100);

      // Press Space to select
      await page.keyboard.press(' ');
      await page.waitForTimeout(500);

      const dialogVisible = await isMultiselectDialogVisible(page);
      expect(dialogVisible).toBeTruthy();
    });

    test('selects correct option when dropdown is filtered (Bug #15 regression)', async ({ page }) => {
      await navigateToDiscover(page);

      await openFilterDropdown(page);

      // Type 'y' to filter (should show Body Class and Year)
      const filterInput = page.locator('.p-dropdown-filter');
      await filterInput.fill('y');
      await page.waitForTimeout(300);

      // Navigate to Year option
      await filterInput.press('ArrowDown');
      await page.waitForTimeout(100);
      let highlighted = await page.locator('.p-dropdown-items .p-highlight').textContent();

      if (highlighted?.includes('Body')) {
        await filterInput.press('ArrowDown');
        await page.waitForTimeout(100);
      }

      // Select with Space
      await filterInput.press(' ');
      await page.waitForTimeout(500);

      // Should open Year Range dialog (NOT Model dialog)
      const yearDialogVisible = await isYearRangeDialogVisible(page);
      expect(yearDialogVisible).toBeTruthy();

      const title = await getDialogTitle(page);
      console.log(`[TEST] Dialog title: ${title}`);
      expect(title.toLowerCase()).toContain('year');
    });

  });

  // ============================================================
  // MULTISELECT DIALOG TESTS
  // ============================================================
  test.describe('Multiselect Dialog', () => {

    test('opens when Manufacturer filter selected', async ({ page }) => {
      await navigateToDiscover(page);

      await selectFilterByClick(page, 'Manufacturer');

      const dialogVisible = await isMultiselectDialogVisible(page);
      expect(dialogVisible).toBeTruthy();

      const title = await getDialogTitle(page);
      expect(title.toLowerCase()).toContain('manufacturer');
    });

    test('loads options from API', async ({ page }) => {
      await navigateToDiscover(page);

      await selectFilterByClick(page, 'Manufacturer');
      await waitForDialogOptionsLoaded(page);

      const options = await getDialogOptions(page);
      console.log(`[TEST] Loaded ${options.length} manufacturer options`);

      // Should have loaded multiple options
      expect(options.length).toBeGreaterThan(10);

      // Check for known manufacturers
      expect(options.some(o => o.includes('Chevrolet') || o.includes('chevrolet'))).toBeTruthy();
      expect(options.some(o => o.includes('Ford') || o.includes('ford'))).toBeTruthy();
    });

    test('filters options with search box', async ({ page }) => {
      await navigateToDiscover(page);

      await selectFilterByClick(page, 'Manufacturer');
      await waitForDialogOptionsLoaded(page);

      const initialOptions = await getDialogOptions(page);
      console.log(`[TEST] Initial options count: ${initialOptions.length}`);

      // Search for specific manufacturer
      await searchInDialog(page, 'Chev');
      await page.waitForTimeout(300);

      const filteredOptions = await getDialogOptions(page);
      console.log(`[TEST] Filtered options (search "Chev"): ${filteredOptions.length}`);

      expect(filteredOptions.length).toBeLessThan(initialOptions.length);
      expect(filteredOptions.some(o => o.toLowerCase().includes('chev'))).toBeTruthy();
    });

    test('allows selecting multiple options', async ({ page }) => {
      await navigateToDiscover(page);

      await selectFilterByClick(page, 'Manufacturer');
      await waitForDialogOptionsLoaded(page);

      // Select Chevrolet and Ford
      await searchInDialog(page, 'Chevrolet');
      await page.waitForTimeout(300);

      const chevCheckbox = page.locator('.p-dialog .p-checkbox').first();
      await chevCheckbox.click();

      // Clear search and find Ford
      await searchInDialog(page, 'Ford');
      await page.waitForTimeout(300);

      const fordCheckbox = page.locator('.p-dialog .p-checkbox').first();
      await fordCheckbox.click();

      // Verify selection summary shows both
      const summary = page.locator('.selection-summary, .p-dialog').filter({ hasText: /selected/i });
      await expect(summary).toContainText('2');
    });

    test('Apply button updates URL with selected values', async ({ page }) => {
      await navigateToDiscover(page);

      await selectFilterByClick(page, 'Manufacturer');
      await waitForDialogOptionsLoaded(page);

      // Select Chevrolet
      await searchInDialog(page, 'Chevrolet');
      await page.waitForTimeout(300);

      const checkbox = page.locator('.p-dialog .p-checkbox').first();
      await checkbox.click();

      // Click Apply
      await clickDialogApply(page);

      // Verify URL updated
      await waitForUrlParam(page, 'manufacturer');
      const hasParam = await urlHasParam(page, 'manufacturer');
      expect(hasParam).toBeTruthy();

      console.log(`[TEST] URL after apply: ${page.url()}`);
    });

    test('Cancel button closes dialog without changes', async ({ page }) => {
      await navigateToDiscover(page);

      // Get initial URL
      const initialUrl = page.url();

      await selectFilterByClick(page, 'Manufacturer');
      await waitForDialogOptionsLoaded(page);

      // Select something
      const checkbox = page.locator('.p-dialog .p-checkbox').first();
      await checkbox.click();

      // Cancel
      await clickDialogCancel(page);

      // Dialog should close
      const dialogVisible = await isMultiselectDialogVisible(page);
      expect(dialogVisible).toBeFalsy();

      // URL should not have changed
      expect(page.url()).toBe(initialUrl);
    });

    test('shows error state when API fails', async ({ page }) => {
      // This test would require mocking the API to fail
      // Skipping for now - would need route interception
      test.skip();
    });

  });

  // ============================================================
  // YEAR RANGE DIALOG TESTS
  // ============================================================
  test.describe('Year Range Dialog', () => {

    test('opens when Year filter selected', async ({ page }) => {
      await navigateToDiscover(page);

      await selectFilterByClick(page, 'Year');

      const dialogVisible = await isYearRangeDialogVisible(page);
      expect(dialogVisible).toBeTruthy();

      const title = await getDialogTitle(page);
      expect(title.toLowerCase()).toContain('year');
    });

    test('accepts min year only', async ({ page }) => {
      await navigateToDiscover(page);

      await selectFilterByClick(page, 'Year');
      await setYearRange(page, 2020, undefined);
      await clickDialogApply(page);

      await waitForUrlParam(page, 'yearMin');
      const hasMin = await urlHasParam(page, 'yearMin', '2020');
      expect(hasMin).toBeTruthy();

      const hasMax = await urlHasParam(page, 'yearMax');
      expect(hasMax).toBeFalsy();
    });

    test('accepts max year only', async ({ page }) => {
      await navigateToDiscover(page);

      await selectFilterByClick(page, 'Year');
      await setYearRange(page, undefined, 2020);
      await clickDialogApply(page);

      await waitForUrlParam(page, 'yearMax');
      const hasMax = await urlHasParam(page, 'yearMax', '2020');
      expect(hasMax).toBeTruthy();
    });

    test('accepts both min and max year', async ({ page }) => {
      await navigateToDiscover(page);

      await selectFilterByClick(page, 'Year');
      await setYearRange(page, 2015, 2020);
      await clickDialogApply(page);

      await waitForUrlParam(page, 'yearMin');

      const hasMin = await urlHasParam(page, 'yearMin', '2015');
      const hasMax = await urlHasParam(page, 'yearMax', '2020');
      expect(hasMin).toBeTruthy();
      expect(hasMax).toBeTruthy();
    });

    test('Apply button is disabled when no year selected', async ({ page }) => {
      await navigateToDiscover(page);

      await selectFilterByClick(page, 'Year');

      const applyButton = page.locator('.p-dialog button').filter({ hasText: /apply/i });
      const isDisabled = await applyButton.getAttribute('disabled');

      expect(isDisabled).not.toBeNull();
    });

  });

  // ============================================================
  // FILTER CHIP TESTS
  // ============================================================
  test.describe('Filter Chips', () => {

    test('appear after filter applied', async ({ page }) => {
      await navigateToDiscover(page);

      // Initially no chips
      let chips = await getActiveFilterChips(page);
      expect(chips.length).toBe(0);

      // Apply Manufacturer filter
      await selectFilterByClick(page, 'Manufacturer');
      await waitForDialogOptionsLoaded(page);

      await searchInDialog(page, 'Chevrolet');
      await page.waitForTimeout(300);
      await page.locator('.p-dialog .p-checkbox').first().click();
      await clickDialogApply(page);

      // Now should have chip
      chips = await getActiveFilterChips(page);
      console.log(`[TEST] Active chips: ${chips.join(', ')}`);
      expect(chips.length).toBeGreaterThan(0);
    });

    test('show correct label and values', async ({ page }) => {
      await navigateWithFilters(page, { manufacturer: 'Chevrolet' });

      const hasChip = await hasFilterChip(page, 'Manufacturer');
      expect(hasChip).toBeTruthy();

      const chips = await getActiveFilterChips(page);
      console.log(`[TEST] Chips content: ${chips.join(' | ')}`);

      // Chip should contain both label and value
      expect(chips.some(c => c.includes('Chevrolet'))).toBeTruthy();
    });

    test('clicking chip opens edit dialog with current values selected', async ({ page }) => {
      await navigateWithFilters(page, { manufacturer: 'Chevrolet' });

      await clickFilterChip(page, 'Manufacturer');

      const dialogVisible = await isMultiselectDialogVisible(page);
      expect(dialogVisible).toBeTruthy();

      // Chevrolet should be pre-selected (checkbox checked)
      await waitForDialogOptionsLoaded(page);
      await searchInDialog(page, 'Chevrolet');
      await page.waitForTimeout(300);

      // The checkbox should be in checked state
      const checkedCheckbox = page.locator('.p-dialog .p-checkbox-checked, .p-dialog .p-highlight');
      const isChecked = await checkedCheckbox.count();
      console.log(`[TEST] Checked checkboxes: ${isChecked}`);
      expect(isChecked).toBeGreaterThan(0);
    });

    test('X button removes filter', async ({ page }) => {
      await navigateWithFilters(page, { manufacturer: 'Chevrolet' });

      let hasChip = await hasFilterChip(page, 'Manufacturer');
      expect(hasChip).toBeTruthy();

      await removeFilterChip(page, 'Manufacturer');

      hasChip = await hasFilterChip(page, 'Manufacturer');
      expect(hasChip).toBeFalsy();
    });

    test('removing filter updates URL', async ({ page }) => {
      await navigateWithFilters(page, { manufacturer: 'Chevrolet' });

      let hasParam = await urlHasParam(page, 'manufacturer');
      expect(hasParam).toBeTruthy();

      await removeFilterChip(page, 'Manufacturer');
      await page.waitForTimeout(500);

      hasParam = await urlHasParam(page, 'manufacturer');
      expect(hasParam).toBeFalsy();
    });

  });

  // ============================================================
  // CLEAR ALL BUTTON TESTS
  // ============================================================
  test.describe('Clear All Button', () => {

    test('is disabled when no filters applied', async ({ page }) => {
      await navigateToDiscover(page);

      const isEnabled = await isClearAllEnabled(page);
      expect(isEnabled).toBeFalsy();
    });

    test('is enabled when filters exist', async ({ page }) => {
      await navigateWithFilters(page, { manufacturer: 'Chevrolet' });

      const isEnabled = await isClearAllEnabled(page);
      expect(isEnabled).toBeTruthy();
    });

    test('removes all filters when clicked', async ({ page }) => {
      await navigateWithFilters(page, {
        manufacturer: 'Chevrolet',
        yearMin: '2020',
        yearMax: '2024'
      });

      let chips = await getActiveFilterChips(page);
      console.log(`[TEST] Initial chips: ${chips.length}`);
      expect(chips.length).toBeGreaterThan(0);

      await clickClearAll(page);

      chips = await getActiveFilterChips(page);
      console.log(`[TEST] Chips after Clear All: ${chips.length}`);
      expect(chips.length).toBe(0);
    });

    test('updates URL to remove all filter params', async ({ page }) => {
      await navigateWithFilters(page, {
        manufacturer: 'Chevrolet',
        yearMin: '2020'
      });

      let hasManufacturer = await urlHasParam(page, 'manufacturer');
      let hasYearMin = await urlHasParam(page, 'yearMin');
      expect(hasManufacturer).toBeTruthy();
      expect(hasYearMin).toBeTruthy();

      await clickClearAll(page);
      await page.waitForTimeout(500);

      hasManufacturer = await urlHasParam(page, 'manufacturer');
      hasYearMin = await urlHasParam(page, 'yearMin');
      expect(hasManufacturer).toBeFalsy();
      expect(hasYearMin).toBeFalsy();
    });

  });

  // ============================================================
  // URL STATE SYNC TESTS
  // ============================================================
  test.describe('URL State Synchronization', () => {

    test('URL params populate filter chips on page load', async ({ page }) => {
      await navigateWithFilters(page, { manufacturer: 'Ford' });

      const hasChip = await hasFilterChip(page, 'Ford');
      expect(hasChip).toBeTruthy();
    });

    test('multiple URL params populate multiple chips', async ({ page }) => {
      await navigateWithFilters(page, {
        manufacturer: 'Ford',
        yearMin: '2018',
        yearMax: '2022'
      });

      const chips = await getActiveFilterChips(page);
      console.log(`[TEST] Chips from URL: ${chips.join(' | ')}`);

      expect(chips.length).toBeGreaterThanOrEqual(2); // Manufacturer + Year Range
    });

    test('browser back button restores previous filter state', async ({ page }) => {
      await navigateToDiscover(page);

      // Apply first filter
      await navigateWithFilters(page, { manufacturer: 'Chevrolet' });
      let hasChev = await hasFilterChip(page, 'Chevrolet');
      expect(hasChev).toBeTruthy();

      // Apply second filter (replace)
      await navigateWithFilters(page, { manufacturer: 'Ford' });
      let hasFord = await hasFilterChip(page, 'Ford');
      expect(hasFord).toBeTruthy();

      // Go back
      await page.goBack();
      await page.waitForTimeout(500);

      // Should restore Chevrolet
      hasChev = await hasFilterChip(page, 'Chevrolet');
      expect(hasChev).toBeTruthy();
    });

  });

});
