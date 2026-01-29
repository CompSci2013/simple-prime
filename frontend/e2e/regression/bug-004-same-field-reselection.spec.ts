/**
 * Regression Test: BUG-004
 *
 * Issue: If dropdown already shows a field name (e.g., "Year"), selecting
 * that same field does NOT open the dialog
 * - Must select a different field first or close/reopen dropdown
 * - The p-select (ngModel) binding doesn't trigger onChange when same value selected
 *
 * Expected: Selecting the same field that's already displayed should still
 * open its corresponding dialog.
 */
import { test, expect } from '@playwright/test';

test.describe('BUG-004: Same Field Reselection Should Open Dialog', () => {
  test.setTimeout(30000);

  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:4205/automobiles/discover');
    await page.waitForLoadState('networkidle');
    await page.locator('.query-control-panel').waitFor({ state: 'visible', timeout: 10000 });
  });

  test('Selecting same field twice should open dialog both times', async ({ page }) => {
    // First selection: Open Body Class dialog
    const dropdown = page.locator('p-select').first();
    await dropdown.click();
    await page.waitForTimeout(300);

    const bodyClassOption = page.locator('.p-select-option, .p-select-list-item').filter({ hasText: 'Body Class' });
    await bodyClassOption.click();
    await page.waitForTimeout(500);

    // Verify dialog opened
    await expect(page.locator('.p-dialog')).toBeVisible();
    const dialogTitle = page.locator('.p-dialog-title, .p-dialog-header');
    await expect(dialogTitle).toContainText('Body Class');

    // Cancel the dialog (don't apply)
    const cancelButton = page.locator('p-dialog').locator('p-button').filter({ hasText: 'Cancel' });
    await cancelButton.click();
    await page.waitForTimeout(500);

    // Dialog should be closed
    await expect(page.locator('.p-dialog')).not.toBeVisible();

    // Second selection: Try to select Body Class again
    // The dropdown should show "Body Class" as the current value now
    await dropdown.click();
    await page.waitForTimeout(300);

    // Click Body Class option again
    const bodyClassOption2 = page.locator('.p-select-option, .p-select-list-item').filter({ hasText: 'Body Class' });
    await bodyClassOption2.click();
    await page.waitForTimeout(500);

    // Dialog should open again (this is the bug - it doesn't)
    await expect(page.locator('.p-dialog')).toBeVisible();
    await expect(dialogTitle).toContainText('Body Class');
  });

  test('Selecting same Year field twice should open dialog both times', async ({ page }) => {
    // First selection: Open Year dialog
    const dropdown = page.locator('p-select').first();
    await dropdown.click();
    await page.waitForTimeout(300);

    const yearOption = page.locator('.p-select-option, .p-select-list-item').filter({ hasText: /^Year$/ });
    await yearOption.click();
    await page.waitForTimeout(500);

    // Verify Year dialog opened
    await expect(page.locator('.p-dialog')).toBeVisible();
    await expect(page.locator('.p-dialog-title').first()).toContainText('Year Range');

    // Cancel the dialog
    const cancelButton = page.locator('p-dialog').locator('p-button').filter({ hasText: 'Cancel' });
    await cancelButton.click();
    await page.waitForTimeout(500);

    // Dialog should be closed
    await expect(page.locator('.p-dialog')).not.toBeVisible();

    // Second selection: Try to select Year again
    await dropdown.click();
    await page.waitForTimeout(300);

    const yearOption2 = page.locator('.p-select-option, .p-select-list-item').filter({ hasText: /^Year$/ });
    await yearOption2.click();
    await page.waitForTimeout(500);

    // Dialog should open again
    await expect(page.locator('.p-dialog')).toBeVisible();
    await expect(page.locator('.p-dialog-title').first()).toContainText('Year Range');
  });

  test('After applying filter, same field selection should open edit dialog', async ({ page }) => {
    // Open and apply a Body Class filter
    const dropdown = page.locator('p-select').first();
    await dropdown.click();
    await page.waitForTimeout(300);

    const bodyClassOption = page.locator('.p-select-option, .p-select-list-item').filter({ hasText: 'Body Class' });
    await bodyClassOption.click();
    await page.waitForTimeout(500);

    // Select Sedan and apply
    const sedanCheckbox = page.locator('.option-item').filter({ hasText: 'Sedan' }).locator('p-checkbox');
    await sedanCheckbox.click();
    await page.waitForTimeout(200);

    const applyButton = page.locator('p-dialog').locator('p-button').filter({ hasText: 'Apply' });
    await applyButton.click();
    await page.waitForTimeout(500);

    // Filter should be applied
    expect(page.url()).toContain('bodyClass=Sedan');

    // Now try to open Body Class dialog again via dropdown
    await dropdown.click();
    await page.waitForTimeout(300);

    const bodyClassOption2 = page.locator('.p-select-option, .p-select-list-item').filter({ hasText: 'Body Class' });
    await bodyClassOption2.click();
    await page.waitForTimeout(500);

    // Dialog should open with current selection pre-checked
    await expect(page.locator('.p-dialog')).toBeVisible();
  });
});
