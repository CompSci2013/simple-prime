/**
 * Regression Test: BUG-003
 *
 * Issue: Query Panel "Year Range" field does not sync when year filter
 * applied via Query Control
 * - URL and chip show correct year values
 * - Query Panel input stays at "Min" instead of showing actual values
 *
 * Expected: After applying year filter via Query Control, the Query Panel
 * should display the same year range values.
 */
import { test, expect } from '@playwright/test';

test.describe('BUG-003: Year Range Sync Between Query Control and Query Panel', () => {
  test.setTimeout(30000);

  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:4205/automobiles/discover');
    await page.waitForLoadState('networkidle');
    await page.locator('.query-control-panel').waitFor({ state: 'visible', timeout: 10000 });
  });

  test('Year filter applied in Query Control should sync to Query Panel', async ({ page }) => {
    // Open dropdown and select Year
    const dropdown = page.locator('p-select').first();
    await dropdown.click();
    await page.waitForTimeout(300);

    const yearOption = page.locator('.p-select-option, .p-select-list-item').filter({ hasText: /^Year$/ });
    await yearOption.click();
    await page.waitForTimeout(500);

    // Set year range: 1990-2000 - use the dialog's inputs specifically
    const dialog = page.locator('p-dialog').filter({ has: page.locator('text=Select Year Range') });
    const yearMinInput = dialog.locator('#yearMin input');
    const yearMaxInput = dialog.locator('#yearMax input');

    await yearMinInput.fill('1990');
    await yearMaxInput.fill('2000');
    await page.waitForTimeout(200);

    // Click Apply
    const applyButton = dialog.locator('p-button').filter({ hasText: 'Apply' });
    await applyButton.click();
    await page.waitForTimeout(500);

    // Verify URL has year params
    expect(page.url()).toContain('yearMin=1990');
    expect(page.url()).toContain('yearMax=2000');

    // Verify chip shows year range
    const yearChip = page.locator('.filter-chip').filter({ hasText: 'Year' });
    await expect(yearChip).toBeVisible();
    await expect(yearChip).toContainText('1990');
    await expect(yearChip).toContainText('2000');

    // Now check Query Panel - it should show the same year values
    const queryPanel = page.locator('app-query-panel, .query-panel-container');

    // Find year inputs in Query Panel by their specific IDs
    // The Query Panel has id="yearMin" and id="yearMax" on p-inputNumber elements
    const queryPanelYearMin = queryPanel.locator('p-inputNumber#yearMin input');
    const queryPanelYearMax = queryPanel.locator('p-inputNumber#yearMax input');

    // Check that Query Panel shows the synced values
    await expect(queryPanelYearMin).toBeVisible();
    await expect(queryPanelYearMax).toBeVisible();

    const minValue = await queryPanelYearMin.inputValue();
    const maxValue = await queryPanelYearMax.inputValue();

    // Values should be synced from URL
    expect(minValue).toBe('1990');
    expect(maxValue).toBe('2000');
  });

  test('URL with year params should sync to Query Panel on load', async ({ page }) => {
    // Navigate directly with year params in URL
    await page.goto('http://localhost:4205/automobiles/discover?yearMin=1985&yearMax=1995');
    await page.waitForLoadState('networkidle');
    await page.locator('.query-control-panel').waitFor({ state: 'visible', timeout: 10000 });

    // Verify chip shows correct year range
    const yearChip = page.locator('.filter-chip').filter({ hasText: 'Year' });
    await expect(yearChip).toBeVisible();
    await expect(yearChip).toContainText('1985');
    await expect(yearChip).toContainText('1995');

    // Check Query Panel displays the synced values
    const queryPanel = page.locator('app-query-panel, .query-panel-container');

    // Find year inputs in Query Panel by their specific IDs
    const queryPanelYearMin = queryPanel.locator('p-inputNumber#yearMin input');
    const queryPanelYearMax = queryPanel.locator('p-inputNumber#yearMax input');

    // Verify inputs are visible and have synced values
    await expect(queryPanelYearMin).toBeVisible();
    await expect(queryPanelYearMax).toBeVisible();

    const minValue = await queryPanelYearMin.inputValue();
    const maxValue = await queryPanelYearMax.inputValue();

    expect(minValue).toBe('1985');
    expect(maxValue).toBe('1995');
  });
});
