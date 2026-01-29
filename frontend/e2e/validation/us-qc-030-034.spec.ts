/**
 * User Story Validation: US-QC-030 to US-QC-034
 * Epic 4: Active Filter Chips
 */
import { test } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const SCREENSHOT_DIR = 'test-results/validation/epic-4';

test.describe('Epic 4: Active Filter Chips - Validation', () => {
  test.setTimeout(60000);

  test.beforeAll(async () => {
    const dir = path.join(process.cwd(), SCREENSHOT_DIR);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });

  // Helper to add a filter
  async function addBodyClassFilter(page: import('@playwright/test').Page, values: string[]) {
    const dropdown = page.locator('p-select').first();
    await dropdown.click();
    await page.waitForTimeout(300);
    await page.locator('.p-select-option, .p-select-item').filter({ hasText: 'Body Class' }).first().click();
    await page.waitForTimeout(500);

    const dialog = page.locator('.p-dialog:visible').first();
    await dialog.waitFor({ state: 'visible', timeout: 5000 });

    for (const value of values) {
      const options = dialog.locator('.option-item');
      const allLabels = await dialog.locator('.option-item label').allTextContents();
      const index = allLabels.findIndex(l => l.includes(value));
      if (index >= 0) {
        await options.nth(index).locator('p-checkbox').click();
        await page.waitForTimeout(100);
      }
    }

    await dialog.locator('p-button').filter({ hasText: 'Apply' }).locator('button').click();
    await page.waitForTimeout(500);
  }

  test('US-QC-030: View Active Filters', async ({ page }) => {
    await page.goto('http://localhost:4205/automobiles/discover');
    await page.waitForLoadState('networkidle');
    await page.locator('.query-control-panel').waitFor({ state: 'visible', timeout: 30000 });

    console.log('\n=== US-QC-030 Criteria Check ===');

    // Screenshot initial state (no filters)
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/030-01-no-filters.png`,
      fullPage: false
    });

    // Check initial state - no active filters section
    const activeFiltersSection = page.locator('.active-filters');
    const initiallyVisible = await activeFiltersSection.isVisible();
    console.log('Initial state - Active Filters section visible:', initiallyVisible);
    console.log('Criterion 4 (empty state): Section hidden when no filters:', !initiallyVisible ? 'YES' : 'NO');

    // Add a filter
    await addBodyClassFilter(page, ['Sedan', 'SUV']);

    // Screenshot with filter applied
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/030-02-with-filter.png`,
      fullPage: false
    });

    // Check Active Filters section now visible
    const sectionVisible = await activeFiltersSection.isVisible();
    console.log('Criterion 1: Active Filters section displays:', sectionVisible);

    // Check for chips
    const chips = page.locator('.filter-chip');
    const chipCount = await chips.count();
    console.log('Criterion 2: Filter chips present:', chipCount);

    if (chipCount > 0) {
      const chipText = await chips.first().textContent();
      console.log('Chip text:', chipText);
      console.log('Criterion 2: Shows field name and values');
    }

    // Check layout (horizontal)
    const chipsContainer = page.locator('.filter-chips');
    const containerVisible = await chipsContainer.isVisible();
    console.log('Criterion 3: Chips container (horizontal layout):', containerVisible ? 'FOUND' : 'NOT FOUND');
  });

  test('US-QC-031: Remove Filter via Chip', async ({ page }) => {
    await page.goto('http://localhost:4205/automobiles/discover');
    await page.waitForLoadState('networkidle');
    await page.locator('.query-control-panel').waitFor({ state: 'visible', timeout: 30000 });

    console.log('\n=== US-QC-031 Criteria Check ===');

    // Add a filter first
    await addBodyClassFilter(page, ['Sedan']);

    const urlBeforeRemove = page.url();
    console.log('URL before remove:', urlBeforeRemove);

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/031-01-before-remove.png`,
      fullPage: false
    });

    // Find and click the remove button on chip
    const chip = page.locator('.filter-chip').first();
    const removeButton = chip.locator('.p-chip-remove-icon, .pi-times-circle, .pi-times');
    const hasRemoveButton = await removeButton.count() > 0;
    console.log('X button on chip:', hasRemoveButton ? 'FOUND' : 'NOT FOUND');

    if (hasRemoveButton) {
      await removeButton.click();
      await page.waitForTimeout(500);

      await page.screenshot({
        path: `${SCREENSHOT_DIR}/031-02-after-remove.png`,
        fullPage: false
      });

      // Check chip disappeared
      const chipCount = await page.locator('.filter-chip').count();
      console.log('Criterion 1 & 2: Chip removed:', chipCount === 0);

      // Check URL updated
      const urlAfterRemove = page.url();
      console.log('Criterion 3: URL after remove:', urlAfterRemove);
      console.log('URL changed:', urlAfterRemove !== urlBeforeRemove);
    }
  });

  test('US-QC-032: Edit Filter via Chip Click', async ({ page }) => {
    await page.goto('http://localhost:4205/automobiles/discover');
    await page.waitForLoadState('networkidle');
    await page.locator('.query-control-panel').waitFor({ state: 'visible', timeout: 30000 });

    console.log('\n=== US-QC-032 Criteria Check ===');

    // Add a filter first
    await addBodyClassFilter(page, ['Sedan']);

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/032-01-chip-to-edit.png`,
      fullPage: false
    });

    // Click the chip (not the X button) to edit
    const chip = page.locator('.filter-chip').first();
    // Click on the label part, not the remove icon
    await chip.locator('.p-chip-label, span').first().click();
    await page.waitForTimeout(500);

    // Check if dialog opens
    const dialog = page.locator('.p-dialog:visible').first();
    const dialogOpened = await dialog.isVisible();
    console.log('Criterion 1: Clicking chip opens edit dialog:', dialogOpened);

    if (dialogOpened) {
      await page.screenshot({
        path: `${SCREENSHOT_DIR}/032-02-edit-dialog.png`,
        fullPage: false
      });

      // Check if Sedan is pre-selected
      const selectedOptions = await dialog.locator('.p-checkbox-checked, .p-highlight').count();
      console.log('Criterion 2: Current selections pre-checked:', selectedOptions > 0);

      // Close dialog
      await dialog.locator('p-button').filter({ hasText: 'Cancel' }).locator('button').click();
    }
  });

  test('US-QC-033: View Filter Chip Tooltip', async ({ page }) => {
    await page.goto('http://localhost:4205/automobiles/discover');
    await page.waitForLoadState('networkidle');
    await page.locator('.query-control-panel').waitFor({ state: 'visible', timeout: 30000 });

    console.log('\n=== US-QC-033 Criteria Check ===');

    // Add a filter with multiple values
    await addBodyClassFilter(page, ['Sedan', 'SUV', 'Pickup']);

    // Hover over chip to show tooltip
    const chip = page.locator('.filter-chip').first();
    await chip.hover();
    await page.waitForTimeout(500);

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/033-01-chip-hover.png`,
      fullPage: false
    });

    // Check for tooltip
    const tooltip = page.locator('.p-tooltip, [role="tooltip"]');
    const tooltipVisible = await tooltip.isVisible();
    console.log('Criterion 1: Tooltip appears on hover:', tooltipVisible);

    if (tooltipVisible) {
      const tooltipText = await tooltip.textContent();
      console.log('Tooltip content:', tooltipText);
      console.log('Criterion 2: Full values shown in tooltip');
    }
  });

  test('US-QC-034: Truncated Chip Display', async ({ page }) => {
    await page.goto('http://localhost:4205/automobiles/discover');
    await page.waitForLoadState('networkidle');
    await page.locator('.query-control-panel').waitFor({ state: 'visible', timeout: 30000 });

    console.log('\n=== US-QC-034 Criteria Check ===');

    // Add a filter with MANY values to test truncation
    await addBodyClassFilter(page, ['Sedan', 'SUV', 'Pickup', 'Coupe', 'Hatchback', 'Wagon']);

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/034-01-many-values.png`,
      fullPage: false
    });

    // Check chip text
    const chip = page.locator('.filter-chip').first();
    const chipText = await chip.textContent();
    console.log('Chip text with 6 values:', chipText);

    // Check if truncated (contains "..." or "+N more")
    const isTruncated = chipText?.includes('...') || chipText?.includes('+') || chipText?.includes('more');
    console.log('Criterion 1 & 2: Chip truncated:', isTruncated);

    if (!isTruncated) {
      console.log('FINDING: Chip shows all values without truncation');
      console.log('User story expects truncation with "+N more" format');
    }
  });
});
