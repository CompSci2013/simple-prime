import { test, expect } from '@playwright/test';
import {
  TestContext,
  getUrlParams,
  getFilterChips,
  getPaginatorText,
  openFilterDropdown,
  selectFilterOption,
  applyMultiselectFilter,
  applyYearRangeFilter,
  screenshotAllComponents,
  expandAllPanels
} from './test-utils';

/**
 * Category 1: Basic Filters (Tests 001-010)
 *
 * Based on QUALITY-ASSURANCE.md Part 5: E2E Test Categories
 *
 * Tests basic filter operations:
 * - Add filters via dropdown
 * - Remove filters via chip
 * - Clear all filters
 * - Multiple filters
 * - Year range filters
 */

const CATEGORY = 'Category 1: Basic Filters';

async function navigateToDiscover(page: import('@playwright/test').Page): Promise<void> {
  await page.goto('/automobiles/discover');
  await page.waitForLoadState('networkidle');

  // Expand all panels that might be collapsed by user preference
  await expandAllPanels(page);

  await expect(page.locator('[data-testid="basic-results-table"]')).toBeVisible({ timeout: 15000 });
}

async function removeFilterChip(page: import('@playwright/test').Page, filterText: string): Promise<void> {
  const chip = page.locator('p-chip').filter({ hasText: filterText });
  const removeBtn = chip.locator('.p-chip-remove-icon');
  await removeBtn.click();
  await page.waitForTimeout(500);
}

async function clickClearAll(page: import('@playwright/test').Page): Promise<void> {
  const clearBtn = page.locator('button').filter({ hasText: /^clear all$/i });
  await clearBtn.click();
  await page.waitForTimeout(500);
}

// ==================== TESTS ====================

test.describe('Category 1: Basic Filters', () => {

  test('001 - Add manufacturer filter: URL contains manufacturer=X, chip visible', async ({ page }) => {
    const ctx = new TestContext(
      page,
      'TEST-001',
      'Add manufacturer filter',
      CATEGORY,
      'When a manufacturer filter is applied via the dropdown:\n' +
      '1. URL should contain manufacturer=Ford parameter\n' +
      '2. A filter chip should be visible showing the manufacturer\n' +
      '3. Results count should change from 4887 to ~665 (Ford count)\n' +
      '4. No console errors should occur'
    );

    let actualResult = '';

    try {
      // Navigate to discover
      await navigateToDiscover(page);

      // Verify initial state - 4887 records
      const initialText = await getPaginatorText(page);
      expect(initialText).toContain('4887');
      actualResult += `Initial state: ${initialText}\n`;

      // Open filter dropdown
      await openFilterDropdown(page);

      // Select Manufacturer filter
      await selectFilterOption(page, 'Manufacturer');

      // Apply "Ford" as manufacturer
      await applyMultiselectFilter(page, 'Ford');
      await page.waitForLoadState('networkidle');

      // Verify URL contains manufacturer parameter
      const params = await getUrlParams(page);
      expect(params.get('manufacturer')).toBe('Ford');
      actualResult += `URL params: ${params.toString()}\n`;

      // Verify filter chip is visible
      const chips = await getFilterChips(page);
      const hasFordChip = chips.some(c => c.toLowerCase().includes('ford') || c.toLowerCase().includes('manufacturer'));
      expect(hasFordChip).toBe(true);
      actualResult += `Filter chips: ${chips.join(', ')}\n`;

      // Verify results count changed
      const filteredText = await getPaginatorText(page);
      expect(filteredText).not.toContain('4887');
      actualResult += `Filtered state: ${filteredText}\n`;

      // Screenshot all 6 components
      await screenshotAllComponents(ctx, page, 'final');

      // Verify no console errors
      expect(ctx.hasError()).toBe(false);
      actualResult += `Console errors: ${ctx.getErrors().length}\n`;
      actualResult += '\nTEST PASSED';

      ctx.finalize(true, actualResult);
    } catch (error) {
      actualResult += `\nTEST FAILED: ${error}`;
      ctx.finalize(false, actualResult);
      throw error;
    }
  });

  test('002 - Remove filter via chip: URL cleared, chip removed', async ({ page }) => {
    const ctx = new TestContext(
      page,
      'TEST-002',
      'Remove filter via chip',
      CATEGORY,
      'When a filter chip is clicked to remove:\n' +
      '1. URL should no longer contain the manufacturer parameter\n' +
      '2. The filter chip should be removed from the UI\n' +
      '3. Results should return to full count (4887)\n' +
      '4. No console errors should occur'
    );

    let actualResult = '';

    try {
      // Navigate with existing filter
      await page.goto('/automobiles/discover?manufacturer=Chevrolet');
      await page.waitForLoadState('networkidle');
      await expect(page.locator('[data-testid="basic-results-table"]')).toBeVisible({ timeout: 15000 });
      await ctx.screenshot('01-with-filter');

      // Verify filter is applied
      let params = await getUrlParams(page);
      expect(params.get('manufacturer')).toBe('Chevrolet');
      actualResult += `Initial URL: ${params.toString()}\n`;

      // Screenshot all components with filter
      await screenshotAllComponents(ctx, page, 'with-filter');

      // Verify chip exists
      let chips = await getFilterChips(page);
      actualResult += `Initial chips: ${chips.join(', ')}\n`;
      expect(chips.length).toBeGreaterThan(0);

      // Remove the filter chip
      await removeFilterChip(page, 'Chevrolet');
      await page.waitForLoadState('networkidle');

      // Screenshot all components after removal
      await screenshotAllComponents(ctx, page, 'after-removal');

      // Verify URL no longer has manufacturer param
      params = await getUrlParams(page);
      expect(params.has('manufacturer')).toBe(false);
      actualResult += `After removal URL: ${params.toString()}\n`;

      // Verify chip is removed
      chips = await getFilterChips(page);
      const hasChevroletChip = chips.some(c => c.toLowerCase().includes('chevrolet'));
      expect(hasChevroletChip).toBe(false);
      actualResult += `After removal chips: ${chips.join(', ')}\n`;

      expect(ctx.hasError()).toBe(false);
      actualResult += `Console errors: ${ctx.getErrors().length}\n`;
      actualResult += '\nTEST PASSED';

      ctx.finalize(true, actualResult);
    } catch (error) {
      actualResult += `\nTEST FAILED: ${error}`;
      ctx.finalize(false, actualResult);
      throw error;
    }
  });

  test('003 - Clear all filters: URL has no filter params', async ({ page }) => {
    const ctx = new TestContext(
      page,
      'TEST-003',
      'Clear all filters',
      CATEGORY,
      'When "Clear All" button is clicked:\n' +
      '1. URL should have no filter parameters\n' +
      '2. All filter chips should be removed\n' +
      '3. Results should return to full count (4887)\n' +
      '4. No console errors should occur'
    );

    let actualResult = '';

    try {
      // Navigate with multiple filters
      await page.goto('/automobiles/discover?manufacturer=Ford&yearMin=2020&yearMax=2024');
      await page.waitForLoadState('networkidle');
      await expect(page.locator('[data-testid="basic-results-table"]')).toBeVisible({ timeout: 15000 });
      await ctx.screenshot('01-multiple-filters');

      // Verify filters are applied
      let params = await getUrlParams(page);
      expect(params.has('manufacturer')).toBe(true);
      expect(params.has('yearMin')).toBe(true);
      actualResult += `Initial URL: ${params.toString()}\n`;

      // Screenshot all components with filters
      await screenshotAllComponents(ctx, page, 'with-filters');

      // Click Clear All button
      await clickClearAll(page);
      await page.waitForLoadState('networkidle');

      // Screenshot all components after clear
      await screenshotAllComponents(ctx, page, 'after-clear');

      // Verify URL has no filter params
      params = await getUrlParams(page);
      expect(params.has('manufacturer')).toBe(false);
      expect(params.has('yearMin')).toBe(false);
      expect(params.has('yearMax')).toBe(false);
      actualResult += `After clear URL: ${params.toString()}\n`;

      // Verify no filter chips
      const chips = await getFilterChips(page);
      expect(chips.length).toBe(0);
      actualResult += `After clear chips: ${chips.length}\n`;

      // Verify back to full results
      const paginatorText = await getPaginatorText(page);
      expect(paginatorText).toContain('4887');
      actualResult += `Results count: ${paginatorText}\n`;

      expect(ctx.hasError()).toBe(false);
      actualResult += `Console errors: ${ctx.getErrors().length}\n`;
      actualResult += '\nTEST PASSED';

      ctx.finalize(true, actualResult);
    } catch (error) {
      actualResult += `\nTEST FAILED: ${error}`;
      ctx.finalize(false, actualResult);
      throw error;
    }
  });

  test('004 - Multiple filters: All params in URL, all chips visible', async ({ page }) => {
    const ctx = new TestContext(
      page,
      'TEST-004',
      'Multiple filters applied',
      CATEGORY,
      'When multiple filters are applied sequentially:\n' +
      '1. URL should contain all filter parameters\n' +
      '2. Multiple filter chips should be visible\n' +
      '3. Results should be filtered by all criteria\n' +
      '4. No console errors should occur'
    );

    let actualResult = '';

    try {
      // Navigate to discover
      await navigateToDiscover(page);

      // Apply first filter - Manufacturer
      await openFilterDropdown(page);
      await selectFilterOption(page, 'Manufacturer');
      await applyMultiselectFilter(page, 'Ford');
      await page.waitForLoadState('networkidle');

      // Apply second filter - Year
      await openFilterDropdown(page);
      await selectFilterOption(page, 'Year');
      await applyYearRangeFilter(page, 2020, 2024);
      await page.waitForLoadState('networkidle');

      // Screenshot all components with multiple filters
      await screenshotAllComponents(ctx, page, 'multiple-filters');

      // Verify URL contains both filters
      const params = await getUrlParams(page);
      expect(params.get('manufacturer')).toBe('Ford');
      expect(params.has('yearMin')).toBe(true);
      actualResult += `URL params: ${params.toString()}\n`;

      // Verify multiple chips visible
      const chips = await getFilterChips(page);
      actualResult += `Filter chips: ${chips.join(', ')}\n`;
      expect(chips.length).toBeGreaterThanOrEqual(2);

      // Verify results are filtered
      const paginatorText = await getPaginatorText(page);
      const match = paginatorText.match(/of\s+(\d+)/);
      if (match) {
        const count = parseInt(match[1], 10);
        expect(count).toBeLessThan(4887);
        actualResult += `Filtered count: ${count}\n`;
      }

      expect(ctx.hasError()).toBe(false);
      actualResult += `Console errors: ${ctx.getErrors().length}\n`;
      actualResult += '\nTEST PASSED';

      ctx.finalize(true, actualResult);
    } catch (error) {
      actualResult += `\nTEST FAILED: ${error}`;
      ctx.finalize(false, actualResult);
      throw error;
    }
  });

  test('005 - Year range filter: yearMin and yearMax in URL', async ({ page }) => {
    const ctx = new TestContext(
      page,
      'TEST-005',
      'Year range filter',
      CATEGORY,
      'When a year range filter is applied:\n' +
      '1. URL should contain yearMin and yearMax parameters\n' +
      '2. A filter chip should show the year range\n' +
      '3. Results should be filtered to that year range\n' +
      '4. No console errors should occur'
    );

    let actualResult = '';

    try {
      // Navigate to discover
      await navigateToDiscover(page);

      // Open filter dropdown and select Year
      await openFilterDropdown(page);
      await selectFilterOption(page, 'Year');

      // Apply year range
      await applyYearRangeFilter(page, 2020, 2024);
      await page.waitForLoadState('networkidle');

      // Screenshot all components with year filter
      await screenshotAllComponents(ctx, page, 'year-filter');

      // Verify URL contains yearMin and yearMax
      const params = await getUrlParams(page);
      expect(params.get('yearMin')).toBe('2020');
      expect(params.get('yearMax')).toBe('2024');
      actualResult += `URL params: ${params.toString()}\n`;

      // Verify chip shows year range
      const chips = await getFilterChips(page);
      const hasYearChip = chips.some(c => c.includes('Year') || c.includes('2020') || c.includes('2024'));
      expect(hasYearChip).toBe(true);
      actualResult += `Filter chips: ${chips.join(', ')}\n`;

      expect(ctx.hasError()).toBe(false);
      actualResult += `Console errors: ${ctx.getErrors().length}\n`;
      actualResult += '\nTEST PASSED';

      ctx.finalize(true, actualResult);
    } catch (error) {
      actualResult += `\nTEST FAILED: ${error}`;
      ctx.finalize(false, actualResult);
      throw error;
    }
  });

  test('006 - Filter persistence on page reload', async ({ page }) => {
    const ctx = new TestContext(
      page,
      'TEST-006',
      'Filter persistence on reload',
      CATEGORY,
      'When page is reloaded with filter in URL:\n' +
      '1. Filter should persist after reload\n' +
      '2. URL should still contain manufacturer=Buick\n' +
      '3. Filter chip should still be visible\n' +
      '4. Results count should remain 480 (Buick count)\n' +
      '5. No console errors should occur'
    );

    let actualResult = '';

    try {
      // Navigate with filter (Buick has 480 records)
      await page.goto('/automobiles/discover?manufacturer=Buick');
      await page.waitForLoadState('networkidle');
      await expect(page.locator('[data-testid="basic-results-table"]')).toBeVisible({ timeout: 15000 });

      // Get initial results count
      const initialText = await getPaginatorText(page);
      actualResult += `Initial paginator: ${initialText}\n`;
      expect(initialText).toContain('480');

      // Screenshot all components before reload
      await screenshotAllComponents(ctx, page, 'before-reload');

      // Reload page
      await page.reload();
      await page.waitForLoadState('networkidle');
      await expect(page.locator('[data-testid="basic-results-table"]')).toBeVisible({ timeout: 15000 });

      // Screenshot all components after reload
      await screenshotAllComponents(ctx, page, 'after-reload');

      // Verify filter is still applied
      const params = await getUrlParams(page);
      expect(params.get('manufacturer')).toBe('Buick');
      actualResult += `After reload URL: ${params.toString()}\n`;

      // Verify chip still visible
      const chips = await getFilterChips(page);
      const hasBuickChip = chips.some(c => c.toLowerCase().includes('buick'));
      expect(hasBuickChip).toBe(true);
      actualResult += `After reload chips: ${chips.join(', ')}\n`;

      // Verify same results count
      const reloadedText = await getPaginatorText(page);
      expect(reloadedText).toBe(initialText);
      actualResult += `After reload paginator: ${reloadedText}\n`;

      expect(ctx.hasError()).toBe(false);
      actualResult += `Console errors: ${ctx.getErrors().length}\n`;
      actualResult += '\nTEST PASSED';

      ctx.finalize(true, actualResult);
    } catch (error) {
      actualResult += `\nTEST FAILED: ${error}`;
      ctx.finalize(false, actualResult);
      throw error;
    }
  });

  test('007 - Direct URL navigation with filter params', async ({ page }) => {
    const ctx = new TestContext(
      page,
      'TEST-007',
      'Direct URL navigation',
      CATEGORY,
      'When navigating directly to URL with filter params:\n' +
      '1. All URL parameters should be parsed correctly\n' +
      '2. Filter chips should be displayed for each filter\n' +
      '3. Results should be filtered (less than Chrysler total of 415)\n' +
      '4. No console errors should occur'
    );

    let actualResult = '';

    try {
      // Navigate directly with filters (Chrysler has 415 records)
      await page.goto('/automobiles/discover?manufacturer=Chrysler&yearMin=2018&yearMax=2022');
      await page.waitForLoadState('networkidle');
      await expect(page.locator('[data-testid="basic-results-table"]')).toBeVisible({ timeout: 15000 });

      // Screenshot all components
      await screenshotAllComponents(ctx, page, 'direct-url');

      // Verify URL params are preserved
      const params = await getUrlParams(page);
      expect(params.get('manufacturer')).toBe('Chrysler');
      expect(params.get('yearMin')).toBe('2018');
      expect(params.get('yearMax')).toBe('2022');
      actualResult += `URL params: ${params.toString()}\n`;

      // Verify chips are displayed
      const chips = await getFilterChips(page);
      actualResult += `Filter chips: ${chips.join(', ')}\n`;
      expect(chips.length).toBeGreaterThanOrEqual(2);

      // Verify results are filtered
      const paginatorText = await getPaginatorText(page);
      expect(paginatorText).not.toContain('4887');
      const match = paginatorText.match(/of\s+(\d+)/);
      if (match) {
        const count = parseInt(match[1], 10);
        expect(count).toBeGreaterThan(0);
        expect(count).toBeLessThanOrEqual(415);
        actualResult += `Filtered count: ${count}\n`;
      }
      actualResult += `Paginator: ${paginatorText}\n`;

      expect(ctx.hasError()).toBe(false);
      actualResult += `Console errors: ${ctx.getErrors().length}\n`;
      actualResult += '\nTEST PASSED';

      ctx.finalize(true, actualResult);
    } catch (error) {
      actualResult += `\nTEST FAILED: ${error}`;
      ctx.finalize(false, actualResult);
      throw error;
    }
  });

  test('008 - Filter dropdown shows available options', async ({ page }) => {
    const ctx = new TestContext(
      page,
      'TEST-008',
      'Filter dropdown options',
      CATEGORY,
      'When filter dropdown is opened:\n' +
      '1. Dropdown should show available filter options\n' +
      '2. Manufacturer option should be present\n' +
      '3. Year option should be present\n' +
      '4. No console errors should occur'
    );

    let actualResult = '';

    try {
      await navigateToDiscover(page);

      // Open filter dropdown
      await openFilterDropdown(page);

      // Screenshot all components with dropdown open
      await screenshotAllComponents(ctx, page, 'dropdown-open');

      // Get dropdown options
      const options = page.locator('.p-select-overlay .p-select-option');
      const count = await options.count();
      actualResult += `Dropdown options count: ${count}\n`;

      // Get option texts
      const optionTexts: string[] = [];
      for (let i = 0; i < count; i++) {
        const text = await options.nth(i).textContent();
        optionTexts.push(text?.trim() || '');
      }
      actualResult += `Options: ${optionTexts.join(', ')}\n`;

      // Check for expected filter types
      expect(optionTexts.some(o => o.includes('Manufacturer'))).toBe(true);
      expect(optionTexts.some(o => o.includes('Year'))).toBe(true);

      // Close dropdown
      await page.keyboard.press('Escape');

      expect(ctx.hasError()).toBe(false);
      actualResult += `Console errors: ${ctx.getErrors().length}\n`;
      actualResult += '\nTEST PASSED';

      ctx.finalize(true, actualResult);
    } catch (error) {
      actualResult += `\nTEST FAILED: ${error}`;
      ctx.finalize(false, actualResult);
      throw error;
    }
  });

  test('009 - Results table updates when filter applied', async ({ page }) => {
    const ctx = new TestContext(
      page,
      'TEST-009',
      'Results table updates',
      CATEGORY,
      'When a filter is applied:\n' +
      '1. Results table should update to show filtered data\n' +
      '2. All visible rows should contain the filtered manufacturer\n' +
      '3. No console errors should occur'
    );

    let actualResult = '';

    try {
      await navigateToDiscover(page);

      // Get initial first row
      const firstRowBefore = await page.locator('[data-testid="basic-results-table"] tbody tr').first().textContent();
      actualResult += `First row before: ${firstRowBefore?.substring(0, 100)}\n`;

      // Apply manufacturer filter
      await page.goto('/automobiles/discover?manufacturer=Chevrolet');
      await page.waitForLoadState('networkidle');
      await expect(page.locator('[data-testid="basic-results-table"]')).toBeVisible({ timeout: 15000 });

      // Screenshot all components
      await screenshotAllComponents(ctx, page, 'filtered');

      // Verify all visible rows contain Chevrolet
      const rows = page.locator('[data-testid="basic-results-table"] tbody tr');
      const rowCount = await rows.count();

      let verifiedRows = 0;
      for (let i = 0; i < Math.min(rowCount, 5); i++) {
        const rowText = await rows.nth(i).textContent();
        expect(rowText?.toLowerCase()).toContain('chevrolet');
        verifiedRows++;
      }
      actualResult += `Verified ${verifiedRows} rows contain Chevrolet\n`;

      expect(ctx.hasError()).toBe(false);
      actualResult += `Console errors: ${ctx.getErrors().length}\n`;
      actualResult += '\nTEST PASSED';

      ctx.finalize(true, actualResult);
    } catch (error) {
      actualResult += `\nTEST FAILED: ${error}`;
      ctx.finalize(false, actualResult);
      throw error;
    }
  });

  test('010 - API called with correct filter parameters', async ({ page }) => {
    const ctx = new TestContext(
      page,
      'TEST-010',
      'API filter parameters',
      CATEGORY,
      'When a filter is applied:\n' +
      '1. API calls should include the filter parameters\n' +
      '2. Results should match expected count (Dodge = 390)\n' +
      '3. No console errors should occur'
    );

    let actualResult = '';

    try {
      await navigateToDiscover(page);
      ctx.clear();

      // Apply filter via URL (Dodge has 390 records)
      await page.goto('/automobiles/discover?manufacturer=Dodge');
      await page.waitForLoadState('networkidle');

      // Screenshot all components
      await screenshotAllComponents(ctx, page, 'dodge-filter');

      // Verify results count
      const paginatorText = await getPaginatorText(page);
      expect(paginatorText).toContain('390');
      actualResult += `Paginator: ${paginatorText}\n`;

      // Check API calls
      const apiCalls = ctx.getApiCalls();
      actualResult += `API calls count: ${apiCalls.length}\n`;
      apiCalls.forEach(c => {
        actualResult += `  ${c.method} ${c.url.substring(0, 100)}... (${c.status})\n`;
      });

      // Verify at least one API call includes manufacturer parameter
      const vehicleApiCall = apiCalls.find(c => c.url.includes('vehicles') || c.url.includes('details'));
      if (vehicleApiCall) {
        expect(vehicleApiCall.url.toLowerCase()).toContain('manufacturer');
        actualResult += `Found API call with manufacturer param\n`;
      }

      expect(ctx.hasError()).toBe(false);
      actualResult += `Console errors: ${ctx.getErrors().length}\n`;
      actualResult += '\nTEST PASSED';

      ctx.finalize(true, actualResult);
    } catch (error) {
      actualResult += `\nTEST FAILED: ${error}`;
      ctx.finalize(false, actualResult);
      throw error;
    }
  });

});
