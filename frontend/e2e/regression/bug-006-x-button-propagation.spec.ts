/**
 * Regression Test: BUG-006
 *
 * Issue: Clicking X button on highlight chip removes highlight
 * but immediately opens edit dialog
 * - Click event propagates from X button to chip body
 * - X button handler removes the highlight
 * - Chip body click handler opens edit dialog
 * - Needs event.stopPropagation() on X button click
 *
 * Expected: Clicking X button should ONLY remove the highlight,
 * NOT open the edit dialog.
 */
import { test, expect } from '@playwright/test';

test.describe('BUG-006: X Button Should Not Trigger Edit Dialog', () => {
  test.setTimeout(30000);

  test.beforeEach(async ({ page }) => {
    // Navigate with a highlight parameter
    await page.goto('http://localhost:4205/automobiles/discover?h_manufacturer=Ford');
    await page.waitForLoadState('networkidle');
    await page.locator('.query-control-panel').waitFor({ state: 'visible', timeout: 10000 });
  });

  test('Clicking X on highlight chip should remove it without opening dialog', async ({ page }) => {
    // Verify highlight chip exists
    const highlightChip = page.locator('.highlight-chip').first();
    await expect(highlightChip).toBeVisible();
    await expect(highlightChip).toContainText('Manufacturer');

    // Find the X (remove) button on the chip
    // PrimeNG chips have a remove icon with class like 'p-chip-remove-icon' or similar
    const removeButton = highlightChip.locator('.p-chip-remove-icon, .pi-times-circle, .pi-times, [class*="remove"]');
    await expect(removeButton).toBeVisible();

    // Click the X button
    await removeButton.click();
    await page.waitForTimeout(500);

    // Highlight chip should be removed
    await expect(highlightChip).not.toBeVisible();

    // URL should no longer have h_manufacturer
    expect(page.url()).not.toContain('h_manufacturer');

    // CRITICAL: No dialog should be open
    // This is the bug - clicking X opens the edit dialog
    const dialog = page.locator('.p-dialog');
    await expect(dialog).not.toBeVisible();
  });

  test('Clicking X on filter chip should remove it without opening dialog', async ({ page }) => {
    // First, add a regular filter
    await page.goto('http://localhost:4205/automobiles/discover?bodyClass=Sedan');
    await page.waitForLoadState('networkidle');
    await page.locator('.query-control-panel').waitFor({ state: 'visible', timeout: 10000 });

    // Verify filter chip exists
    const filterChip = page.locator('.filter-chip').first();
    await expect(filterChip).toBeVisible();
    await expect(filterChip).toContainText('Body Class');

    // Find the X button
    const removeButton = filterChip.locator('.p-chip-remove-icon, .pi-times-circle, .pi-times, [class*="remove"]');
    await expect(removeButton).toBeVisible();

    // Click the X button
    await removeButton.click();
    await page.waitForTimeout(500);

    // Filter chip should be removed
    await expect(filterChip).not.toBeVisible();

    // URL should no longer have bodyClass
    expect(page.url()).not.toContain('bodyClass');

    // No dialog should be open
    const dialog = page.locator('.p-dialog');
    await expect(dialog).not.toBeVisible();
  });

  test('Clicking chip body (not X) should open edit dialog', async ({ page }) => {
    // This test verifies that clicking the chip body DOES open the dialog
    // (to ensure we don't break that functionality while fixing the X button)

    const highlightChip = page.locator('.highlight-chip').first();
    await expect(highlightChip).toBeVisible();

    // Click the chip body (the label/text area, not the X)
    const chipLabel = highlightChip.locator('.p-chip-text, .p-chip-label');
    await chipLabel.click();
    await page.waitForTimeout(500);

    // Edit dialog SHOULD open
    const dialog = page.locator('.p-dialog');
    await expect(dialog).toBeVisible();

    // Dialog should be for editing highlight
    const dialogTitle = page.locator('.p-dialog-title, .p-dialog-header');
    await expect(dialogTitle).toContainText('Highlight');
  });

  test('Multiple highlight chips - X button removes only clicked chip', async ({ page }) => {
    // Navigate with multiple highlights
    await page.goto('http://localhost:4205/automobiles/discover?h_manufacturer=Ford&h_bodyClass=Sedan');
    await page.waitForLoadState('networkidle');
    await page.locator('.query-control-panel').waitFor({ state: 'visible', timeout: 10000 });

    // Verify both highlight chips exist
    const highlightChips = page.locator('.highlight-chip');
    const initialCount = await highlightChips.count();
    expect(initialCount).toBe(2);

    // Find the Ford chip and its X button
    const fordChip = page.locator('.highlight-chip').filter({ hasText: 'Ford' });
    await expect(fordChip).toBeVisible();

    const removeButton = fordChip.locator('.p-chip-remove-icon, .pi-times-circle, .pi-times, [class*="remove"]');
    await removeButton.click();
    await page.waitForTimeout(500);

    // Ford chip should be gone, Sedan should remain
    await expect(fordChip).not.toBeVisible();
    expect(page.url()).not.toContain('h_manufacturer');
    expect(page.url()).toContain('h_bodyClass=Sedan');

    // Remaining chip count should be 1
    const remainingChips = page.locator('.highlight-chip');
    await expect(remainingChips).toHaveCount(1);

    // No dialog should be open
    await expect(page.locator('.p-dialog')).not.toBeVisible();
  });
});
