/**
 * User Story Validation: US-QP-030 through US-QP-034
 * Epic 4: Body Class Multiselect Filter
 *
 * Tests multiselect dropdown for Body Class field
 */
import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const SCREENSHOT_DIR = 'test-results/validation/query-panel/epic-4';

test.describe('Query Panel - Epic 4: Body Class Multiselect', () => {
  test.setTimeout(60000);

  test.beforeAll(async () => {
    const dir = path.join(process.cwd(), SCREENSHOT_DIR);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });

  test.beforeEach(async ({ page }) => {
    // Clear localStorage to ensure fresh state (panels not collapsed)
    await page.goto('http://localhost:4205/automobiles/discover');
    await page.evaluate(() => localStorage.clear());
    // Reload to apply cleared state
    await page.reload();
    await page.waitForLoadState('networkidle');
  });

  test('US-QP-030: View Body Class Dropdown', async ({ page }) => {
    // beforeEach already navigated and cleared localStorage
    const queryPanel = page.locator('.query-panel-container');
    await queryPanel.waitFor({ state: 'visible', timeout: 30000 });

    // Find body class field
    const bodyClassField = queryPanel.locator('.filter-field').filter({ hasText: 'Body Class' });

    // Screenshot
    await bodyClassField.screenshot({
      path: `${SCREENSHOT_DIR}/030-01-body-class-field.png`
    });

    console.log('\n=== US-QP-030 Criteria Check ===');

    // Check for p-multiSelect component
    const multiSelect = bodyClassField.locator('p-multiselect');
    const hasMultiSelect = await multiSelect.count() > 0;
    console.log('Criterion 1: Uses p-multiSelect:', hasMultiSelect ? 'PASS' : 'FAIL');

    // Check placeholder
    const placeholderText = await multiSelect.locator('.p-multiselect-label').textContent();
    console.log('Criterion 2: Placeholder text:', placeholderText);
    console.log('Expected: "Select body classes..."');

    expect(hasMultiSelect).toBe(true);
  });

  test('US-QP-031: Load Body Class Options', async ({ page }) => {
    // beforeEach already navigated and cleared localStorage
    const queryPanel = page.locator('.query-panel-container');
    await queryPanel.waitFor({ state: 'visible', timeout: 30000 });

    // Find and click body class multiselect
    const bodyClassField = queryPanel.locator('.filter-field').filter({ hasText: 'Body Class' });
    const multiSelect = bodyClassField.locator('p-multiselect');

    await multiSelect.click();
    await page.waitForTimeout(500); // Wait for options to load

    // Screenshot dropdown panel
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/031-01-dropdown-open.png`,
      fullPage: false
    });

    console.log('\n=== US-QP-031 Criteria Check ===');

    // Check for options panel
    const optionsPanel = page.locator('.p-multiselect-panel, .p-multiselect-items-wrapper');
    const hasPanelVisible = await optionsPanel.isVisible();
    console.log('Criterion 1: Options panel visible:', hasPanelVisible ? 'PASS' : 'FAIL');

    if (hasPanelVisible) {
      // Get all options
      const options = await page.locator('.p-multiselect-item').allTextContents();
      console.log('Criterion 2: Options loaded from API:', options.length, 'options');
      console.log('Options:', options);

      // Check for expected body classes
      const expectedOptions = ['Convertible', 'Coupe', 'Hatchback', 'Sedan', 'SUV', 'Truck'];
      for (const expected of expectedOptions) {
        const found = options.some(o => o.includes(expected));
        console.log(`  - ${expected}:`, found ? 'FOUND' : 'NOT FOUND');
      }

      // Screenshot options
      await optionsPanel.screenshot({
        path: `${SCREENSHOT_DIR}/031-02-options-list.png`
      });
    }
  });

  test('US-QP-032: Search Body Class Options', async ({ page }) => {
    // beforeEach already navigated and cleared localStorage
    const queryPanel = page.locator('.query-panel-container');
    await queryPanel.waitFor({ state: 'visible', timeout: 30000 });

    // Open multiselect
    const bodyClassField = queryPanel.locator('.filter-field').filter({ hasText: 'Body Class' });
    const multiSelect = bodyClassField.locator('p-multiselect');
    await multiSelect.click();
    await page.waitForTimeout(500);

    console.log('\n=== US-QP-032 Criteria Check ===');

    // Look for filter input
    const filterInput = page.locator('.p-multiselect-filter, .p-multiselect-filter-container input');
    const hasFilter = await filterInput.count() > 0;
    console.log('Criterion 1: Filter input exists:', hasFilter ? 'PASS' : 'FAIL');

    if (hasFilter) {
      // Type to filter
      await filterInput.first().fill('sed');
      await page.waitForTimeout(300);

      // Screenshot filtered results
      await page.screenshot({
        path: `${SCREENSHOT_DIR}/032-01-filtered-options.png`,
        fullPage: false
      });

      // Check filtered options
      const filteredOptions = await page.locator('.p-multiselect-item:visible').allTextContents();
      console.log('Criterion 2: Filtered results for "sed":', filteredOptions);
      console.log('Criterion 3: Case-insensitive:', filteredOptions.some(o => o.toLowerCase().includes('sed')) ? 'PASS' : 'FAIL');
    }
  });

  test('US-QP-033: Select Body Classes', async ({ page }) => {
    // beforeEach already navigated and cleared localStorage
    const queryPanel = page.locator('.query-panel-container');
    await queryPanel.waitFor({ state: 'visible', timeout: 30000 });

    // Open multiselect
    const bodyClassField = queryPanel.locator('.filter-field').filter({ hasText: 'Body Class' });
    const multiSelect = bodyClassField.locator('p-multiselect');
    await multiSelect.click();
    await page.waitForTimeout(500);

    console.log('\n=== US-QP-033 Criteria Check ===');

    // Select multiple options
    const sedanOption = page.locator('.p-multiselect-item').filter({ hasText: 'Sedan' });
    const suvOption = page.locator('.p-multiselect-item').filter({ hasText: 'SUV' });

    if (await sedanOption.count() > 0) {
      await sedanOption.click();
      await page.waitForTimeout(200);
    }

    if (await suvOption.count() > 0) {
      await suvOption.click();
      await page.waitForTimeout(200);
    }

    // Screenshot with selections
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/033-01-multiple-selected.png`,
      fullPage: false
    });

    // Close dropdown by clicking elsewhere
    await page.locator('body').click({ position: { x: 10, y: 10 } });
    await page.waitForTimeout(500);

    // Screenshot after closing
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/033-02-after-selection.png`,
      fullPage: false
    });

    // Check URL
    const url = page.url();
    console.log('Criterion 1: Multiple selections allowed: CHECKING via URL');
    console.log('Criterion 2: URL updates:', url.includes('bodyClass=') ? 'PASS' : 'FAIL');
    console.log('Current URL:', url);

    // Check multiselect label shows selections
    const label = await multiSelect.locator('.p-multiselect-label').textContent();
    console.log('Criterion 3: Selection reflected in dropdown:', label);
  });

  test('US-QP-034: Clear Body Class Filter', async ({ page }) => {
    // Start with body class filter applied - need to clear localStorage after navigating
    await page.goto('http://localhost:4205/automobiles/discover?bodyClass=Sedan,SUV');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForLoadState('networkidle');

    const queryPanel = page.locator('.query-panel-container');
    await queryPanel.waitFor({ state: 'visible', timeout: 30000 });

    // Screenshot before clearing
    await queryPanel.screenshot({
      path: `${SCREENSHOT_DIR}/034-01-before-clear.png`
    });

    console.log('\n=== US-QP-034 Criteria Check ===');

    // Find body class field and clear button
    const bodyClassField = queryPanel.locator('.filter-field').filter({ hasText: 'Body Class' });
    const multiSelect = bodyClassField.locator('p-multiselect');
    const clearBtn = multiSelect.locator('.p-multiselect-clear-icon, .p-icon-times');

    const hasClearBtn = await clearBtn.count() > 0;
    console.log('Criterion 1: Clear button visible:', hasClearBtn ? 'PASS' : 'FAIL');

    if (hasClearBtn) {
      await clearBtn.click();
      await page.waitForTimeout(500);

      // Screenshot after clearing
      await queryPanel.screenshot({
        path: `${SCREENSHOT_DIR}/034-02-after-clear.png`
      });

      const url = page.url();
      console.log('Criterion 2: bodyClass removed from URL:', !url.includes('bodyClass=') ? 'PASS' : 'FAIL');
      console.log('Current URL:', url);

      // Check placeholder restored
      const label = await multiSelect.locator('.p-multiselect-label').textContent();
      console.log('Criterion 3: Placeholder restored:', label);
    }
  });
});
