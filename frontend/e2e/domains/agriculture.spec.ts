import { test, expect, Page } from '@playwright/test';

/**
 * Agriculture Domain E2E Test Suite
 *
 * Tests the Agriculture discovery interface with same workflows as Automobiles
 * but configured for agriculture-specific data and fields
 */

// Helper to get current URL parameters
async function getUrlParams(page: Page): Promise<Record<string, string>> {
  const url = new URL(page.url());
  const params: Record<string, string> = {};
  url.searchParams.forEach((value, key) => {
    params[key] = value;
  });
  return params;
}

// Helper to wait for results table data
async function waitForTableUpdate(page: Page, timeoutMs: number = 10000) {
  const resultsTable = page.locator('[data-testid="results-table"]');
  await resultsTable.locator('.p-paginator-current').first().waitFor({ timeout: timeoutMs });
}

// ============================================================================
// PHASE 1: INITIAL STATE & BASIC NAVIGATION
// ============================================================================

test.describe('PHASE 1 (Agriculture): Initial State & Basic Navigation', () => {

  test.skip('1.1: Initial page load - agriculture records displayed', async ({ page }) => {
    // Navigate to agriculture discover page
    await page.goto('/agriculture/discover');

    // Verify all 4 panels are visible
    await expect(page.locator('[data-testid="query-control-panel"]')).toBeVisible();
    await expect(page.locator('[data-testid="picker-panel"]')).toBeVisible();
    await expect(page.locator('[data-testid="results-table-panel"]')).toBeVisible();
    await expect(page.locator('[data-testid="statistics-panel"]')).toBeVisible();

    // Verify URL is clean (no query params)
    const params = await getUrlParams(page);
    expect(Object.keys(params).length).toBe(0);

    // Verify Results Table shows records
    const resultsTable = page.locator('[data-testid="results-table"]');
    const resultsTablePaginator = resultsTable.locator('.p-paginator-current').first();
    await expect(resultsTablePaginator).toBeVisible({ timeout: 10000 });
  });

  test.skip('1.2: Panel collapse/expand - state independent of URL', async ({ page }) => {
    await page.goto('/agriculture/discover');

    // Collapse Query Control panel
    const queryControlComponent = page.locator('[data-testid="query-control-panel"]');
    const panelActions = page.locator('.panel-actions button');
    await panelActions.first().click();

    // Verify it's collapsed
    await expect(queryControlComponent).not.toBeVisible();

    // Verify URL remains clean
    const params = await getUrlParams(page);
    expect(Object.keys(params).length).toBe(0);

    // Expand it back
    await panelActions.first().click();
    await expect(queryControlComponent).toBeVisible();
  });

});

// ============================================================================
// PHASE 2.1: FILTER WORKFLOW
// ============================================================================

test.describe('PHASE 2.1 (Agriculture): Filter Workflows', () => {

  test.skip('2.1.1: Apply filter', async ({ page }: { page: Page }) => {
    await page.goto('/agriculture/discover');

    // Apply a filter via URL (agriculture domain has different filters)
    await page.goto('/agriculture/discover?crop=Wheat');

    await waitForTableUpdate(page);

    // Verify URL has the filter
    const params = await getUrlParams(page);
    expect(params['crop']).toBeDefined();

    // Verify Results Table shows filtered data
    const rows = page.locator('[data-testid="results-table"] tbody tr');
    const rowCount = await rows.count();
    expect(rowCount).toBeGreaterThan(0);
  });

  test.skip('2.1.2: Remove filter', async ({ page }: { page: Page }) => {
    await page.goto('/agriculture/discover?crop=Wheat');

    await waitForTableUpdate(page);

    // Navigate to clear filter
    await page.goto('/agriculture/discover');

    await waitForTableUpdate(page);

    // Verify filter is cleared
    const params = await getUrlParams(page);
    expect(params['crop']).toBeUndefined();
  });

});

// ============================================================================
// PHASE 3: RESULTS TABLE PANEL
// ============================================================================

test.describe('PHASE 3 (Agriculture): Results Table Panel', () => {

  test.skip('3.1.1: Table pagination', async ({ page }: { page: Page }) => {
    // Test pagination by navigating to a specific page via URL
    await page.goto('/agriculture/discover?first=10');

    await waitForTableUpdate(page);

    // Verify pagination parameter is in URL
    const params = await getUrlParams(page);
    expect(params['first']).toBe('10');

    // Verify table is showing data
    const rows = page.locator('[data-testid="results-table"] tbody tr');
    const rowCount = await rows.count();
    expect(rowCount).toBeGreaterThan(0);
  });

});

// ============================================================================
// PHASE 4: PICKER (DOMAIN-SPECIFIC)
// ============================================================================

test.describe('PHASE 4 (Agriculture): Picker Panel', () => {

  test.skip('4.1.1: Single picker selection', async ({ page }: { page: Page }) => {
    // For agriculture, picker might select crop or region
    await page.goto('/agriculture/discover?pickedCrop=Wheat');

    await waitForTableUpdate(page);

    // Verify picker parameter is in URL
    const params = await getUrlParams(page);
    expect(params['pickedCrop']).toBe('Wheat');

    // Verify results table updated
    const rows = page.locator('[data-testid="results-table"] tbody tr');
    const rowCount = await rows.count();
    expect(rowCount).toBeGreaterThan(0);
  });

});

// ============================================================================
// PHASE 5: STATISTICS PANEL
// ============================================================================

test.describe('PHASE 5 (Agriculture): Statistics Panel', () => {

  test.skip('5.1.1: Statistics display', async ({ page }) => {
    await page.goto('/agriculture/discover');

    const statsPanel = page.locator('[data-testid="statistics-panel"]');
    await expect(statsPanel).toBeVisible();

    // Verify charts are visible
    const charts = statsPanel.locator('canvas, svg, [role="img"]');
    const chartCount = await charts.count();
    expect(chartCount).toBeGreaterThan(0);
  });

});
