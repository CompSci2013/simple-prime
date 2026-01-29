/**
 * User Story Validation: US-QP-040 through US-QP-043
 * Epic 5: VIN Count Range Filter
 *
 * Tests VIN count range min/max inputs
 */
import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const SCREENSHOT_DIR = 'test-results/validation/query-panel/epic-5';

test.describe('Query Panel - Epic 5: VIN Count Range Filter', () => {
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

  test('US-QP-040: View VIN Count Range Inputs', async ({ page }) => {
    // beforeEach already navigated and cleared localStorage
    const queryPanel = page.locator('.query-panel-container');
    await queryPanel.waitFor({ state: 'visible', timeout: 30000 });

    // Screenshot full panel
    await queryPanel.screenshot({
      path: `${SCREENSHOT_DIR}/040-01-query-panel.png`
    });

    console.log('\n=== US-QP-040 Criteria Check ===');

    // Find VIN count range fields
    const vinMinField = queryPanel.locator('.filter-field').filter({ hasText: /^VIN Count Range$/ });
    const vinMaxField = queryPanel.locator('.filter-field').filter({ hasText: 'VIN Count Range Max' });

    const hasMinField = await vinMinField.count() > 0;
    const hasMaxField = await vinMaxField.count() > 0;
    console.log('Criterion 1: VIN Count Range (min) field exists:', hasMinField ? 'PASS' : 'FAIL');
    console.log('Criterion 2: VIN Count Range Max field exists:', hasMaxField ? 'PASS' : 'FAIL');

    // Check for p-inputNumber components
    if (hasMinField) {
      const minInputNumber = vinMinField.locator('p-inputnumber');
      console.log('Criterion 3: Min uses p-inputNumber:', await minInputNumber.count() > 0 ? 'PASS' : 'FAIL');

      await vinMinField.screenshot({
        path: `${SCREENSHOT_DIR}/040-02-vin-min-field.png`
      });
    }

    if (hasMaxField) {
      const maxInputNumber = vinMaxField.locator('p-inputnumber');
      console.log('Criterion 4: Max uses p-inputNumber:', await maxInputNumber.count() > 0 ? 'PASS' : 'FAIL');

      await vinMaxField.screenshot({
        path: `${SCREENSHOT_DIR}/040-03-vin-max-field.png`
      });
    }

    // Check placeholders
    if (hasMinField && hasMaxField) {
      const minInput = vinMinField.locator('input').first();
      const maxInput = vinMaxField.locator('input').first();
      const minPlaceholder = await minInput.getAttribute('placeholder');
      const maxPlaceholder = await maxInput.getAttribute('placeholder');
      console.log('Criterion 5: Min placeholder:', minPlaceholder);
      console.log('Criterion 6: Max placeholder:', maxPlaceholder);
    }
  });

  test('US-QP-041: Enter VIN Count Min', async ({ page }) => {
    // beforeEach already navigated and cleared localStorage
    const queryPanel = page.locator('.query-panel-container');
    await queryPanel.waitFor({ state: 'visible', timeout: 30000 });

    // Find VIN count min input
    const vinMinField = queryPanel.locator('.filter-field').filter({ hasText: /^VIN Count Range$/ });
    const vinMinInput = vinMinField.locator('input').first();

    // Enter value
    await vinMinInput.fill('100');
    await page.waitForTimeout(500);

    // Screenshot
    await queryPanel.screenshot({
      path: `${SCREENSHOT_DIR}/041-01-after-vin-min.png`
    });

    console.log('\n=== US-QP-041 Criteria Check ===');

    // Check URL update
    const url = page.url();
    const hasParam = url.includes('instanceCountRangeMin=100');
    console.log('Criterion 1: URL updates with instanceCountRangeMin:', hasParam ? 'PASS' : 'FAIL');
    console.log('Current URL:', url);

    // Check for clear button
    const clearBtn = vinMinField.locator('button[icon*="times"]');
    const hasClearBtn = await clearBtn.count() > 0;
    console.log('Criterion 2: Clear button appears:', hasClearBtn ? 'PASS' : 'FAIL');
  });

  test('US-QP-042: Enter VIN Count Max', async ({ page }) => {
    // beforeEach already navigated and cleared localStorage
    const queryPanel = page.locator('.query-panel-container');
    await queryPanel.waitFor({ state: 'visible', timeout: 30000 });

    // Find VIN count max input
    const vinMaxField = queryPanel.locator('.filter-field').filter({ hasText: 'VIN Count Range Max' });
    const vinMaxInput = vinMaxField.locator('input').first();

    // Enter value
    await vinMaxInput.fill('500');
    await page.waitForTimeout(500);

    // Screenshot
    await queryPanel.screenshot({
      path: `${SCREENSHOT_DIR}/042-01-after-vin-max.png`
    });

    console.log('\n=== US-QP-042 Criteria Check ===');

    // Check URL update
    const url = page.url();
    const hasParam = url.includes('instanceCountRangeMax=500');
    console.log('Criterion 1: URL updates with instanceCountRangeMax:', hasParam ? 'PASS' : 'FAIL');
    console.log('Current URL:', url);
  });

  test('US-QP-043: VIN Count Input Bounds', async ({ page }) => {
    // beforeEach already navigated and cleared localStorage
    const queryPanel = page.locator('.query-panel-container');
    await queryPanel.waitFor({ state: 'visible', timeout: 30000 });

    console.log('\n=== US-QP-043 Criteria Check ===');

    // Find VIN count min input
    const vinMinField = queryPanel.locator('.filter-field').filter({ hasText: /^VIN Count Range$/ });
    const inputNumber = vinMinField.locator('p-inputnumber');

    // Check min/max attributes
    const minAttr = await inputNumber.getAttribute('ng-reflect-min');
    const maxAttr = await inputNumber.getAttribute('ng-reflect-max');

    console.log('Criterion 1: Minimum bound:', minAttr || 'Not found');
    console.log('Criterion 2: Maximum bound:', maxAttr || 'Not found');
    console.log('Expected: min=0, max=10000');

    // Test negative value rejection
    const vinMinInput = vinMinField.locator('input').first();
    await vinMinInput.fill('-5');
    await page.waitForTimeout(300);

    const inputValue = await vinMinInput.inputValue();
    console.log('Criterion 3: Negative values rejected:', inputValue === '' || parseInt(inputValue) >= 0 ? 'PASS' : 'FAIL');
    console.log('Input value after -5:', inputValue);

    // Screenshot
    await vinMinField.screenshot({
      path: `${SCREENSHOT_DIR}/043-01-vin-bounds.png`
    });
  });
});
