/**
 * User Story Validation: US-QP-020 through US-QP-027
 * Epic 3: Year Range Filter
 *
 * Tests year range min/max inputs and their behavior
 */
import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const SCREENSHOT_DIR = 'test-results/validation/query-panel/epic-3';

test.describe('Query Panel - Epic 3: Year Range Filter', () => {
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

  test('US-QP-020: View Year Range Inputs', async ({ page }) => {
    // beforeEach already navigated and cleared localStorage
    const queryPanel = page.locator('.query-panel-container');
    await queryPanel.waitFor({ state: 'visible', timeout: 30000 });

    // Screenshot full panel
    await queryPanel.screenshot({
      path: `${SCREENSHOT_DIR}/020-01-query-panel.png`
    });

    console.log('\n=== US-QP-020 Criteria Check ===');

    // Find year range fields
    const yearMinField = queryPanel.locator('.filter-field').filter({ hasText: /^Year Range$/ });
    const yearMaxField = queryPanel.locator('.filter-field').filter({ hasText: 'Year Range Max' });

    const hasMinField = await yearMinField.count() > 0;
    const hasMaxField = await yearMaxField.count() > 0;
    console.log('Criterion 1: Year Range (min) field exists:', hasMinField ? 'PASS' : 'FAIL');
    console.log('Criterion 2: Year Range Max field exists:', hasMaxField ? 'PASS' : 'FAIL');

    // Check for p-inputNumber components
    const minInputNumber = yearMinField.locator('p-inputnumber');
    const maxInputNumber = yearMaxField.locator('p-inputnumber');
    console.log('Criterion 3: Min uses p-inputNumber:', await minInputNumber.count() > 0 ? 'PASS' : 'FAIL');
    console.log('Criterion 4: Max uses p-inputNumber:', await maxInputNumber.count() > 0 ? 'PASS' : 'FAIL');

    // Screenshot year fields
    if (hasMinField) {
      await yearMinField.screenshot({
        path: `${SCREENSHOT_DIR}/020-02-year-min-field.png`
      });
    }
    if (hasMaxField) {
      await yearMaxField.screenshot({
        path: `${SCREENSHOT_DIR}/020-03-year-max-field.png`
      });
    }

    // Check placeholders
    const minInput = yearMinField.locator('input');
    const maxInput = yearMaxField.locator('input');
    const minPlaceholder = await minInput.first().getAttribute('placeholder');
    const maxPlaceholder = await maxInput.first().getAttribute('placeholder');
    console.log('Criterion 5: Min placeholder:', minPlaceholder);
    console.log('Criterion 6: Max placeholder:', maxPlaceholder);

    expect(hasMinField).toBe(true);
    expect(hasMaxField).toBe(true);
  });

  test('US-QP-021: Enter Year Min Value', async ({ page }) => {
    // beforeEach already navigated and cleared localStorage
    const queryPanel = page.locator('.query-panel-container');
    await queryPanel.waitFor({ state: 'visible', timeout: 30000 });

    // Find year min input
    const yearMinField = queryPanel.locator('.filter-field').filter({ hasText: /^Year Range$/ });
    const yearMinInput = yearMinField.locator('input').first();

    // Screenshot 1: Before entering value
    await queryPanel.screenshot({
      path: `${SCREENSHOT_DIR}/021-01-before-year-min.png`
    });

    // Enter year value - need to clear first, then type, then blur to trigger change
    await yearMinInput.click();
    await yearMinInput.fill('1990');
    // Blur to trigger ngModelChange
    await page.locator('body').click({ position: { x: 10, y: 10 } });
    await page.waitForTimeout(500);

    // Screenshot 2: After entering value
    await queryPanel.screenshot({
      path: `${SCREENSHOT_DIR}/021-02-after-year-min.png`
    });

    console.log('\n=== US-QP-021 Criteria Check ===');

    // Check URL update
    const url = page.url();
    const hasYearMinParam = url.includes('yearMin=1990');
    console.log('Criterion 1: URL updates with yearMin:', hasYearMinParam ? 'PASS' : 'FAIL');
    console.log('Current URL:', url);

    // Check for clear button
    const clearBtn = yearMinField.locator('button[icon*="times"]');
    const hasClearBtn = await clearBtn.count() > 0;
    console.log('Criterion 2: Clear button appears:', hasClearBtn ? 'PASS' : 'FAIL');

    expect(hasYearMinParam).toBe(true);
  });

  test('US-QP-022: Enter Year Max Value', async ({ page }) => {
    // beforeEach already navigated and cleared localStorage
    const queryPanel = page.locator('.query-panel-container');
    await queryPanel.waitFor({ state: 'visible', timeout: 30000 });

    // Find year max input
    const yearMaxField = queryPanel.locator('.filter-field').filter({ hasText: 'Year Range Max' });
    const yearMaxInput = yearMaxField.locator('input').first();

    // Enter year value - click, fill, then blur
    await yearMaxInput.click();
    await yearMaxInput.fill('2020');
    await page.locator('body').click({ position: { x: 10, y: 10 } });
    await page.waitForTimeout(500);

    // Screenshot
    await queryPanel.screenshot({
      path: `${SCREENSHOT_DIR}/022-01-after-year-max.png`
    });

    console.log('\n=== US-QP-022 Criteria Check ===');

    // Check URL update
    const url = page.url();
    const hasYearMaxParam = url.includes('yearMax=2020');
    console.log('Criterion 1: URL updates with yearMax:', hasYearMaxParam ? 'PASS' : 'FAIL');
    console.log('Current URL:', url);

    expect(hasYearMaxParam).toBe(true);
  });

  test('US-QP-023: Apply Combined Year Range', async ({ page }) => {
    // beforeEach already navigated and cleared localStorage
    const queryPanel = page.locator('.query-panel-container');
    await queryPanel.waitFor({ state: 'visible', timeout: 30000 });

    // Enter both year values
    const yearMinField = queryPanel.locator('.filter-field').filter({ hasText: /^Year Range$/ });
    const yearMaxField = queryPanel.locator('.filter-field').filter({ hasText: 'Year Range Max' });

    const yearMinInput = yearMinField.locator('input').first();
    const yearMaxInput = yearMaxField.locator('input').first();

    await yearMinInput.click();
    await yearMinInput.fill('1990');
    await yearMaxInput.click();
    await yearMaxInput.fill('2000');
    // Blur to trigger final update
    await page.locator('body').click({ position: { x: 10, y: 10 } });
    await page.waitForTimeout(500);

    // Screenshot
    await queryPanel.screenshot({
      path: `${SCREENSHOT_DIR}/023-01-combined-range.png`
    });

    console.log('\n=== US-QP-023 Criteria Check ===');

    const url = page.url();
    const hasBothParams = url.includes('yearMin=1990') && url.includes('yearMax=2000');
    console.log('Criterion 1: URL has both yearMin and yearMax:', hasBothParams ? 'PASS' : 'FAIL');
    console.log('Current URL:', url);

    expect(url).toContain('yearMin=1990');
    expect(url).toContain('yearMax=2000');
  });

  test('US-QP-024: Clear Year Min Value', async ({ page }) => {
    // Start with year min set - need to clear localStorage after navigating
    await page.goto('http://localhost:4205/automobiles/discover?yearMin=1990&yearMax=2000');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForLoadState('networkidle');

    const queryPanel = page.locator('.query-panel-container');
    await queryPanel.waitFor({ state: 'visible', timeout: 30000 });

    // Screenshot 1: Before clearing
    await queryPanel.screenshot({
      path: `${SCREENSHOT_DIR}/024-01-before-clear.png`
    });

    console.log('\n=== US-QP-024 Criteria Check ===');

    // Find year min field and clear button
    const yearMinField = queryPanel.locator('.filter-field').filter({ hasText: /^Year Range$/ });
    const clearBtn = yearMinField.locator('button[icon*="times"]');

    const hasClearBtn = await clearBtn.count() > 0;
    console.log('Criterion 1: Clear button exists:', hasClearBtn ? 'PASS' : 'FAIL');

    if (hasClearBtn) {
      await clearBtn.click();
      await page.waitForTimeout(500);

      // Screenshot 2: After clearing
      await queryPanel.screenshot({
        path: `${SCREENSHOT_DIR}/024-02-after-clear.png`
      });

      const url = page.url();
      console.log('Criterion 2: yearMin removed from URL:', !url.includes('yearMin=') ? 'PASS' : 'FAIL');
      console.log('Criterion 3: yearMax preserved:', url.includes('yearMax=2000') ? 'PASS' : 'FAIL');
      console.log('Current URL:', url);
    }
  });

  test('US-QP-025: Clear Year Max Value', async ({ page }) => {
    // Start with year max set - need to clear localStorage after navigating
    await page.goto('http://localhost:4205/automobiles/discover?yearMin=1990&yearMax=2000');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForLoadState('networkidle');

    const queryPanel = page.locator('.query-panel-container');
    await queryPanel.waitFor({ state: 'visible', timeout: 30000 });

    console.log('\n=== US-QP-025 Criteria Check ===');

    // Find year max field and clear button
    const yearMaxField = queryPanel.locator('.filter-field').filter({ hasText: 'Year Range Max' });
    const clearBtn = yearMaxField.locator('button[icon*="times"]');

    const hasClearBtn = await clearBtn.count() > 0;
    console.log('Criterion 1: Clear button exists:', hasClearBtn ? 'PASS' : 'FAIL');

    if (hasClearBtn) {
      await clearBtn.click();
      await page.waitForTimeout(500);

      await queryPanel.screenshot({
        path: `${SCREENSHOT_DIR}/025-01-after-clear-max.png`
      });

      const url = page.url();
      console.log('Criterion 2: yearMax removed from URL:', !url.includes('yearMax=') ? 'PASS' : 'FAIL');
      console.log('Criterion 3: yearMin preserved:', url.includes('yearMin=1990') ? 'PASS' : 'FAIL');
      console.log('Current URL:', url);
    }
  });

  test('US-QP-026: Year Input Bounds', async ({ page }) => {
    // beforeEach already navigated and cleared localStorage
    const queryPanel = page.locator('.query-panel-container');
    await queryPanel.waitFor({ state: 'visible', timeout: 30000 });

    console.log('\n=== US-QP-026 Criteria Check ===');

    // Check p-inputNumber min/max attributes
    const yearMinField = queryPanel.locator('.filter-field').filter({ hasText: /^Year Range$/ });
    const inputNumber = yearMinField.locator('p-inputnumber');

    // PrimeNG inputNumber stores min/max in component
    const minAttr = await inputNumber.getAttribute('ng-reflect-min');
    const maxAttr = await inputNumber.getAttribute('ng-reflect-max');

    console.log('Criterion 1: Minimum year bound:', minAttr || 'Not found in attributes');
    console.log('Criterion 2: Maximum year bound:', maxAttr || 'Not found in attributes');
    console.log('Expected: min=1900, max=currentYear+1');

    // Take screenshot
    await yearMinField.screenshot({
      path: `${SCREENSHOT_DIR}/026-01-year-bounds.png`
    });
  });

  test('US-QP-027: Sync Year Range from URL', async ({ page }) => {
    // Navigate with year params in URL - need to clear localStorage after navigating
    await page.goto('http://localhost:4205/automobiles/discover?yearMin=1985&yearMax=1995');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForLoadState('networkidle');

    const queryPanel = page.locator('.query-panel-container');
    await queryPanel.waitFor({ state: 'visible', timeout: 30000 });

    // Screenshot
    await queryPanel.screenshot({
      path: `${SCREENSHOT_DIR}/027-01-url-sync.png`
    });

    console.log('\n=== US-QP-027 Criteria Check ===');

    // Check year min input value
    const yearMinField = queryPanel.locator('.filter-field').filter({ hasText: /^Year Range$/ });
    const yearMinInput = yearMinField.locator('input').first();
    const minValue = await yearMinInput.inputValue();

    // Check year max input value
    const yearMaxField = queryPanel.locator('.filter-field').filter({ hasText: 'Year Range Max' });
    const yearMaxInput = yearMaxField.locator('input').first();
    const maxValue = await yearMaxInput.inputValue();

    console.log('Criterion 1: Year min input shows URL value:', minValue === '1985' ? 'PASS' : `FAIL (got "${minValue}")`);
    console.log('Criterion 2: Year max input shows URL value:', maxValue === '1995' ? 'PASS' : `FAIL (got "${maxValue}")`);

    // This test validates BUG-003 fix
    expect(minValue).toBe('1985');
    expect(maxValue).toBe('1995');
  });
});
