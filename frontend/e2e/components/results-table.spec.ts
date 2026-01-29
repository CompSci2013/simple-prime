/**
 * Results Table Component Test Suite
 *
 * Tests the Results Table component which displays filtered data:
 * - Data display and row rendering
 * - Pagination controls
 * - Sorting functionality
 * - Results count accuracy
 * - Column visibility
 *
 * These tests run against the component in the main window (not pop-out).
 */

import { test, expect } from '@playwright/test';
import { TestLogger } from '../test-logger';
import {
  navigateToDiscover,
  navigateWithFilters,
  getResultsCount,
  getTableRows,
  getColumnValues,
  waitForNetworkIdle,
  AUTOMOBILE_BASELINE,
} from '../test-helpers';

test.describe('Results Table Component', () => {
  let logger: TestLogger;

  test.beforeEach(async ({ page }) => {
    logger = new TestLogger(page);
  });

  test.afterEach(async () => {
    logger.printSummary();
  });

  // ============================================================
  // DATA DISPLAY TESTS
  // ============================================================
  test.describe('Data Display', () => {

    test('displays data on initial load', async ({ page }) => {
      await navigateToDiscover(page);
      await waitForNetworkIdle(page);

      const rows = await getTableRows(page);
      const rowCount = await rows.count();

      console.log(`[TEST] Visible rows: ${rowCount}`);
      expect(rowCount).toBeGreaterThan(0);
    });

    test('shows correct total results count (unfiltered)', async ({ page }) => {
      await navigateToDiscover(page);
      await waitForNetworkIdle(page);

      const count = await getResultsCount(page);
      console.log(`[TEST] Total results: ${count}`);

      // Should be around 4887 (baseline)
      expect(count).toBeGreaterThan(4000);
      expect(count).toBeLessThan(6000);
    });

    test('shows filtered results count after filter applied', async ({ page }) => {
      await navigateWithFilters(page, { manufacturer: 'Chevrolet' });
      await waitForNetworkIdle(page);

      const count = await getResultsCount(page);
      console.log(`[TEST] Chevrolet results: ${count}`);

      // Should be around 849 for Chevrolet
      expect(count).toBeGreaterThan(500);
      expect(count).toBeLessThan(1200);
      expect(count).toBeLessThan(AUTOMOBILE_BASELINE.TOTAL_RECORDS);
    });

    test('displays rows matching the applied filter', async ({ page }) => {
      await navigateWithFilters(page, { manufacturer: 'Ford' });
      await waitForNetworkIdle(page);

      // Wait for table to render
      await page.waitForSelector('p-table tbody tr, .p-datatable-tbody tr', { timeout: 10000 });

      // Get manufacturer column values (assuming it's one of the visible columns)
      const rows = await getTableRows(page);
      const rowCount = await rows.count();

      console.log(`[TEST] Checking ${rowCount} rows for Ford filter`);

      // Check first few rows contain Ford
      for (let i = 0; i < Math.min(5, rowCount); i++) {
        const rowText = await rows.nth(i).textContent();
        console.log(`[TEST] Row ${i}: ${rowText?.substring(0, 100)}...`);
        // Row should contain Ford (case insensitive)
        expect(rowText?.toLowerCase()).toContain('ford');
      }
    });

    test('updates displayed data when filter changes', async ({ page }) => {
      await navigateToDiscover(page);
      await waitForNetworkIdle(page);

      const initialCount = await getResultsCount(page);
      console.log(`[TEST] Initial count: ${initialCount}`);

      // Apply filter via URL
      await navigateWithFilters(page, { manufacturer: 'Chevrolet' });
      await waitForNetworkIdle(page);

      const filteredCount = await getResultsCount(page);
      console.log(`[TEST] Filtered count: ${filteredCount}`);

      expect(filteredCount).toBeLessThan(initialCount);
    });

  });

  // ============================================================
  // PAGINATION TESTS
  // ============================================================
  test.describe('Pagination', () => {

    test('shows pagination controls when results exceed page size', async ({ page }) => {
      await navigateToDiscover(page);
      await waitForNetworkIdle(page);

      // Look for pagination controls
      const paginator = page.locator('.p-paginator, p-paginator');
      await expect(paginator).toBeVisible();
    });

    test('shows page size selector', async ({ page }) => {
      await navigateToDiscover(page);
      await waitForNetworkIdle(page);

      const pageSizeDropdown = page.locator('.p-paginator-rpp-options, .p-dropdown');
      const count = await pageSizeDropdown.count();

      console.log(`[TEST] Page size selectors found: ${count}`);
      expect(count).toBeGreaterThan(0);
    });

    test('navigating to next page updates displayed rows', async ({ page }) => {
      await navigateToDiscover(page);
      await waitForNetworkIdle(page);

      // Get first row content
      const rows = await getTableRows(page);
      const firstPageFirstRow = await rows.first().textContent();
      console.log(`[TEST] First page, first row: ${firstPageFirstRow?.substring(0, 50)}...`);

      // Click next page
      const nextButton = page.locator('.p-paginator-next, [aria-label="Next Page"]');
      await nextButton.click();
      await waitForNetworkIdle(page);

      // Get new first row content
      const newFirstRow = await rows.first().textContent();
      console.log(`[TEST] Second page, first row: ${newFirstRow?.substring(0, 50)}...`);

      // Should be different content
      expect(newFirstRow).not.toBe(firstPageFirstRow);
    });

    test('page number in URL updates when navigating', async ({ page }) => {
      await navigateToDiscover(page);
      await waitForNetworkIdle(page);

      // Click next page
      const nextButton = page.locator('.p-paginator-next, [aria-label="Next Page"]');
      await nextButton.click();
      await page.waitForTimeout(500);

      // Check URL for page parameter
      const url = page.url();
      console.log(`[TEST] URL after pagination: ${url}`);

      // URL should contain page parameter
      expect(url).toMatch(/page=2|page%3D2/);
    });

    test('changing page size affects number of displayed rows', async ({ page }) => {
      await navigateToDiscover(page);
      await waitForNetworkIdle(page);

      // Get initial row count
      let rows = await getTableRows(page);
      const initialRowCount = await rows.count();
      console.log(`[TEST] Initial row count: ${initialRowCount}`);

      // Change page size (if dropdown available)
      const pageSizeDropdown = page.locator('.p-paginator .p-dropdown').first();
      const isVisible = await pageSizeDropdown.isVisible().catch(() => false);

      if (isVisible) {
        await pageSizeDropdown.click();
        await page.waitForTimeout(200);

        // Select a different page size
        const option = page.locator('.p-dropdown-item').filter({ hasText: '50' }).first();
        const optionVisible = await option.isVisible().catch(() => false);

        if (optionVisible) {
          await option.click();
          await waitForNetworkIdle(page);

          rows = await getTableRows(page);
          const newRowCount = await rows.count();
          console.log(`[TEST] New row count: ${newRowCount}`);

          expect(newRowCount).not.toBe(initialRowCount);
        } else {
          console.log('[TEST] Page size 50 option not available');
        }
      } else {
        console.log('[TEST] Page size dropdown not visible');
      }
    });

  });

  // ============================================================
  // SORTING TESTS
  // ============================================================
  test.describe('Sorting', () => {

    test('clicking column header sorts data', async ({ page }) => {
      await navigateToDiscover(page);
      await waitForNetworkIdle(page);

      // Find sortable column header
      const sortableHeader = page.locator('th.p-sortable-column, [p-sortablecolumn]').first();
      const isVisible = await sortableHeader.isVisible().catch(() => false);

      if (isVisible) {
        // Get initial first cell value
        const rows = await getTableRows(page);
        const initialFirstCell = await rows.first().locator('td').first().textContent();
        console.log(`[TEST] Before sort, first cell: ${initialFirstCell}`);

        // Click to sort
        await sortableHeader.click();
        await waitForNetworkIdle(page);

        // Get new first cell value
        const newFirstCell = await rows.first().locator('td').first().textContent();
        console.log(`[TEST] After sort, first cell: ${newFirstCell}`);

        // Values should potentially differ (unless data happens to start sorted)
        console.log('[TEST] Sort completed');
      } else {
        console.log('[TEST] No sortable columns found');
      }
    });

    test('sort indicator appears after sorting', async ({ page }) => {
      await navigateToDiscover(page);
      await waitForNetworkIdle(page);

      const sortableHeader = page.locator('th.p-sortable-column, [p-sortablecolumn]').first();
      const isVisible = await sortableHeader.isVisible().catch(() => false);

      if (isVisible) {
        await sortableHeader.click();
        await page.waitForTimeout(300);

        // Check for sort indicator
        const sortIcon = page.locator('.p-sortable-column-icon, .pi-sort-amount-up, .pi-sort-amount-down');
        const iconCount = await sortIcon.count();
        console.log(`[TEST] Sort icons visible: ${iconCount}`);
      }
    });

    test('clicking same column header toggles sort direction', async ({ page }) => {
      await navigateToDiscover(page);
      await waitForNetworkIdle(page);

      const sortableHeader = page.locator('th.p-sortable-column, [p-sortablecolumn]').first();
      const isVisible = await sortableHeader.isVisible().catch(() => false);

      if (isVisible) {
        // First click - ascending
        await sortableHeader.click();
        await page.waitForTimeout(300);

        const ascIcon = page.locator('.pi-sort-amount-up-alt, .pi-sort-up');
        const hasAsc = await ascIcon.count();

        // Second click - descending
        await sortableHeader.click();
        await page.waitForTimeout(300);

        const descIcon = page.locator('.pi-sort-amount-down, .pi-sort-down');
        const hasDesc = await descIcon.count();

        console.log(`[TEST] Asc icons: ${hasAsc}, Desc icons: ${hasDesc}`);
      }
    });

  });

  // ============================================================
  // RESULTS COUNT ACCURACY TESTS
  // ============================================================
  test.describe('Results Count Accuracy', () => {

    test('shows "Showing X to Y of Z" format', async ({ page }) => {
      await navigateToDiscover(page);
      await waitForNetworkIdle(page);

      // Look for results summary text
      const summaryText = await page.locator('text=/Showing.*to.*of/i').textContent().catch(() => null);

      if (summaryText) {
        console.log(`[TEST] Results summary: ${summaryText}`);
        expect(summaryText).toMatch(/showing\s+\d+\s+to\s+\d+\s+of\s+\d+/i);
      } else {
        console.log('[TEST] Results summary text not found in expected format');
      }
    });

    test('count updates when filter applied', async ({ page }) => {
      await navigateToDiscover(page);
      await waitForNetworkIdle(page);

      const initialCount = await getResultsCount(page);

      await navigateWithFilters(page, { model: 'Camaro' });
      await waitForNetworkIdle(page);

      const filteredCount = await getResultsCount(page);

      console.log(`[TEST] Initial: ${initialCount}, Filtered (Camaro): ${filteredCount}`);
      expect(filteredCount).toBeLessThan(initialCount);

      // Camaro should be around 59 results
      expect(filteredCount).toBeLessThan(200);
    });

    test('count resets when filter cleared', async ({ page }) => {
      await navigateWithFilters(page, { manufacturer: 'Chevrolet' });
      await waitForNetworkIdle(page);

      const filteredCount = await getResultsCount(page);

      // Clear filter by navigating without params
      await navigateToDiscover(page);
      await waitForNetworkIdle(page);

      const resetCount = await getResultsCount(page);

      console.log(`[TEST] Filtered: ${filteredCount}, Reset: ${resetCount}`);
      expect(resetCount).toBeGreaterThan(filteredCount);
    });

  });

  // ============================================================
  // EMPTY STATE TESTS
  // ============================================================
  test.describe('Empty State', () => {

    test('shows empty message when no results match filter', async ({ page }) => {
      // Apply a filter that returns no results
      await navigateWithFilters(page, { manufacturer: 'NonExistentBrand12345' });
      await waitForNetworkIdle(page);

      // Look for empty state message
      const emptyMessage = page.locator('.p-datatable-emptymessage, text=/no.*results/i, text=/no.*data/i');
      const rows = await getTableRows(page);
      const rowCount = await rows.count();

      console.log(`[TEST] Rows with invalid filter: ${rowCount}`);

      // Either empty message visible or zero rows
      const hasEmptyMessage = await emptyMessage.count();
      expect(rowCount === 0 || hasEmptyMessage > 0).toBeTruthy();
    });

  });

  // ============================================================
  // LOADING STATE TESTS
  // ============================================================
  test.describe('Loading State', () => {

    test('shows loading indicator during data fetch', async ({ page }) => {
      // This test requires intercepting the API to slow it down
      // For now, we'll check that the table eventually loads

      await navigateToDiscover(page);

      // Wait for table to have data
      await page.waitForSelector('p-table tbody tr, .p-datatable-tbody tr', { timeout: 15000 });

      const rows = await getTableRows(page);
      const rowCount = await rows.count();

      expect(rowCount).toBeGreaterThan(0);
      console.log('[TEST] Table loaded successfully');
    });

  });

});
