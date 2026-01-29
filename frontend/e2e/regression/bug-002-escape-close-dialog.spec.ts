/**
 * Regression Test: BUG-002
 *
 * Issue: Escape key does not close multiselect/year range dialogs
 * - WCAG 2.1 requires dialogs to be closable via Escape key
 * - PrimeNG p-dialog needs closeOnEscape property enabled
 *
 * Expected: Pressing Escape while dialog is open should close it
 * without applying any changes.
 */
import { test, expect } from '@playwright/test';

test.describe('BUG-002: Escape Key Should Close Dialogs', () => {
  test.setTimeout(30000);

  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:4205/automobiles/discover');
    await page.waitForLoadState('networkidle');
    await page.locator('.query-control-panel').waitFor({ state: 'visible', timeout: 10000 });
  });

  test('Escape should close multiselect dialog', async ({ page }) => {
    // Open dropdown and select Body Class to open multiselect dialog
    const dropdown = page.locator('p-select').first();
    await dropdown.click();
    await page.waitForTimeout(300);

    // Click on Body Class option
    const bodyClassOption = page.locator('.p-select-option, .p-select-list-item').filter({ hasText: 'Body Class' });
    await bodyClassOption.click();
    await page.waitForTimeout(500);

    // Verify dialog is open
    const dialog = page.locator('p-dialog[header="Select Body Class"], p-dialog .p-dialog-title:has-text("Body Class")').first();
    await expect(page.locator('.p-dialog')).toBeVisible();

    // Press Escape
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);

    // Dialog should be closed
    await expect(page.locator('.p-dialog')).not.toBeVisible();
  });

  test('Escape should close year range dialog', async ({ page }) => {
    // Open dropdown and select Year to open year range dialog
    const dropdown = page.locator('p-select').first();
    await dropdown.click();
    await page.waitForTimeout(300);

    // Click on Year option
    const yearOption = page.locator('.p-select-option, .p-select-list-item').filter({ hasText: /^Year$/ });
    await yearOption.click();
    await page.waitForTimeout(500);

    // Verify dialog is open
    await expect(page.locator('.p-dialog')).toBeVisible();
    await expect(page.locator('.p-dialog-title')).toContainText('Year Range');

    // Press Escape
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);

    // Dialog should be closed
    await expect(page.locator('.p-dialog')).not.toBeVisible();
  });

  test('Escape should not apply filter changes', async ({ page }) => {
    // Get initial URL
    const initialUrl = page.url();

    // Open dropdown and select Body Class
    const dropdown = page.locator('p-select').first();
    await dropdown.click();
    await page.waitForTimeout(300);

    const bodyClassOption = page.locator('.p-select-option, .p-select-list-item').filter({ hasText: 'Body Class' });
    await bodyClassOption.click();
    await page.waitForTimeout(500);

    // Select an option
    const sedanCheckbox = page.locator('.option-item').filter({ hasText: 'Sedan' }).locator('p-checkbox');
    await sedanCheckbox.click();
    await page.waitForTimeout(200);

    // Press Escape instead of Apply
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);

    // URL should not have changed (no filter applied)
    expect(page.url()).toBe(initialUrl);

    // No filter chip should appear
    const filterChips = page.locator('.filter-chip');
    await expect(filterChips).toHaveCount(0);
  });
});
