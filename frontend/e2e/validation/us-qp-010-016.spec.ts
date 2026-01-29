/**
 * User Story Validation: US-QP-010 through US-QP-016
 * Epic 2: Autocomplete Filters (Manufacturer, Model)
 *
 * Tests autocomplete inputs for Manufacturer and Model fields
 */
import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const SCREENSHOT_DIR = 'test-results/validation/query-panel/epic-2';

test.describe('Query Panel - Epic 2: Autocomplete Filters', () => {
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

  test('US-QP-010: View Manufacturer Autocomplete', async ({ page }) => {
    // beforeEach already navigated and cleared localStorage
    const queryPanel = page.locator('.query-panel-container');
    await queryPanel.waitFor({ state: 'visible', timeout: 30000 });

    // Find manufacturer input by its ID or nearby label
    const manufacturerField = queryPanel.locator('.filter-field').filter({ hasText: 'Manufacturer' });
    await manufacturerField.screenshot({
      path: `${SCREENSHOT_DIR}/010-01-manufacturer-field.png`
    });

    console.log('\n=== US-QP-010 Criteria Check ===');

    // Check for p-autoComplete component
    const autocomplete = manufacturerField.locator('p-autocomplete');
    const hasAutocomplete = await autocomplete.count() > 0;
    console.log('Criterion 1: Uses p-autoComplete:', hasAutocomplete ? 'PASS' : 'FAIL');

    // Check placeholder
    const input = manufacturerField.locator('input');
    const placeholder = await input.getAttribute('placeholder');
    console.log('Criterion 2: Placeholder text:', placeholder);
    console.log('Expected: "Enter manufacturer name..."');

    expect(hasAutocomplete).toBe(true);
  });

  test('US-QP-011: Search Manufacturer', async ({ page }) => {
    // beforeEach already navigated and cleared localStorage
    const queryPanel = page.locator('.query-panel-container');
    await queryPanel.waitFor({ state: 'visible', timeout: 30000 });

    // Find manufacturer autocomplete input within the filter field
    const manufacturerField = queryPanel.locator('.filter-field').filter({ hasText: 'Manufacturer' });
    const manufacturerInput = manufacturerField.locator('input').first();

    // Screenshot 1: Before typing
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/011-01-before-typing.png`,
      fullPage: false
    });

    // Type to trigger autocomplete
    await manufacturerInput.fill('Ford');
    await page.waitForTimeout(500); // Wait for debounce (300ms) + API response

    // Screenshot 2: After typing - check for suggestions
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/011-02-after-typing-ford.png`,
      fullPage: false
    });

    console.log('\n=== US-QP-011 Criteria Check ===');

    // Check for autocomplete panel
    const suggestionsPanel = page.locator('.p-autocomplete-panel, .p-autocomplete-items');
    const hasSuggestions = await suggestionsPanel.isVisible();
    console.log('Criterion 1: API triggered, suggestions appear:', hasSuggestions ? 'PASS' : 'FAIL');

    if (hasSuggestions) {
      const suggestions = await page.locator('.p-autocomplete-item').allTextContents();
      console.log('Criterion 2: Suggestions shown:', suggestions.slice(0, 5));
      console.log('Criterion 3: Up to 10 suggestions:', suggestions.length <= 10 ? 'PASS' : 'FAIL');

      await suggestionsPanel.screenshot({
        path: `${SCREENSHOT_DIR}/011-03-suggestions-panel.png`
      });
    }
  });

  test('US-QP-012: Select Manufacturer from Suggestions', async ({ page }) => {
    // beforeEach already navigated and cleared localStorage
    const queryPanel = page.locator('.query-panel-container');
    await queryPanel.waitFor({ state: 'visible', timeout: 30000 });

    // Find manufacturer autocomplete input within the filter field
    const manufacturerField = queryPanel.locator('.filter-field').filter({ hasText: 'Manufacturer' });
    const manufacturerInput = manufacturerField.locator('input').first();

    // Type to get suggestions
    await manufacturerInput.fill('Ford');
    await page.waitForTimeout(500);

    // Screenshot 1: Suggestions visible
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/012-01-suggestions-visible.png`,
      fullPage: false
    });

    console.log('\n=== US-QP-012 Criteria Check ===');

    // Try to select first suggestion
    const firstSuggestion = page.locator('.p-autocomplete-item').first();
    if (await firstSuggestion.isVisible()) {
      const suggestionText = await firstSuggestion.textContent();
      console.log('Selecting suggestion:', suggestionText);

      await firstSuggestion.click();
      await page.waitForTimeout(500);

      // Screenshot 2: After selection
      await page.screenshot({
        path: `${SCREENSHOT_DIR}/012-02-after-selection.png`,
        fullPage: false
      });

      // Check URL update
      const url = page.url();
      console.log('Criterion 1: URL updates:', url.includes('manufacturer=') ? 'PASS' : 'FAIL');
      console.log('Current URL:', url);

      // Check input value
      const inputValue = await manufacturerInput.inputValue();
      console.log('Criterion 2: Input shows selected value:', inputValue);
    } else {
      console.log('No suggestions visible - may need different search term');
    }
  });

  test('US-QP-013: Apply Typed Manufacturer Value on Blur', async ({ page }) => {
    // beforeEach already navigated and cleared localStorage
    const queryPanel = page.locator('.query-panel-container');
    await queryPanel.waitFor({ state: 'visible', timeout: 30000 });

    // Find manufacturer autocomplete input within the filter field
    const manufacturerField = queryPanel.locator('.filter-field').filter({ hasText: 'Manufacturer' });
    const manufacturerInput = manufacturerField.locator('input').first();

    // Type without selecting from dropdown
    await manufacturerInput.fill('Toyota');
    await page.waitForTimeout(300);

    // Screenshot 1: Before blur
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/013-01-before-blur.png`,
      fullPage: false
    });

    // Blur the input (click elsewhere)
    await page.locator('body').click({ position: { x: 10, y: 10 } });
    await page.waitForTimeout(500);

    // Screenshot 2: After blur
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/013-02-after-blur.png`,
      fullPage: false
    });

    console.log('\n=== US-QP-013 Criteria Check ===');

    // Check URL update
    const url = page.url();
    const hasManufacturerParam = url.includes('manufacturer=');
    console.log('Criterion 1: Blur applies filter:', hasManufacturerParam ? 'PASS' : 'FAIL');
    console.log('Current URL:', url);
  });

  test('US-QP-014: Clear Manufacturer Filter', async ({ page }) => {
    // Start with manufacturer filter applied - need to clear localStorage after navigating
    await page.goto('http://localhost:4205/automobiles/discover?manufacturer=Ford');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForLoadState('networkidle');

    const queryPanel = page.locator('.query-panel-container');
    await queryPanel.waitFor({ state: 'visible', timeout: 30000 });

    // Screenshot 1: With filter applied
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/014-01-filter-applied.png`,
      fullPage: false
    });

    console.log('\n=== US-QP-014 Criteria Check ===');

    // Look for clear button in autocomplete
    const manufacturerField = queryPanel.locator('.filter-field').filter({ hasText: 'Manufacturer' });
    const clearBtn = manufacturerField.locator('.p-autocomplete-clear-icon, .p-icon-times, button[icon*="times"]');

    const hasClearBtn = await clearBtn.count() > 0;
    console.log('Criterion 1: Clear button visible when value present:', hasClearBtn ? 'PASS' : 'FAIL');

    if (hasClearBtn) {
      await clearBtn.first().click();
      await page.waitForTimeout(500);

      // Screenshot 2: After clearing
      await page.screenshot({
        path: `${SCREENSHOT_DIR}/014-02-after-clear.png`,
        fullPage: false
      });

      const url = page.url();
      console.log('Criterion 2: URL parameter removed:', !url.includes('manufacturer=') ? 'PASS' : 'FAIL');
      console.log('Current URL:', url);
    }
  });

  test('US-QP-015: View Model Autocomplete', async ({ page }) => {
    // beforeEach already navigated and cleared localStorage
    const queryPanel = page.locator('.query-panel-container');
    await queryPanel.waitFor({ state: 'visible', timeout: 30000 });

    // Find model input
    const modelField = queryPanel.locator('.filter-field').filter({ hasText: /^Model$/ });
    await modelField.screenshot({
      path: `${SCREENSHOT_DIR}/015-01-model-field.png`
    });

    console.log('\n=== US-QP-015 Criteria Check ===');

    // Check for p-autoComplete
    const autocomplete = modelField.locator('p-autocomplete');
    const hasAutocomplete = await autocomplete.count() > 0;
    console.log('Criterion 1: Uses p-autoComplete:', hasAutocomplete ? 'PASS' : 'FAIL');

    // Check placeholder
    const input = modelField.locator('input');
    const placeholder = await input.getAttribute('placeholder');
    console.log('Criterion 2: Placeholder text:', placeholder);
    console.log('Expected: "Type to search models..."');

    expect(hasAutocomplete).toBe(true);
  });

  test('US-QP-016: Autocomplete Focus Shows Initial Suggestions', async ({ page }) => {
    // beforeEach already navigated and cleared localStorage
    const queryPanel = page.locator('.query-panel-container');
    await queryPanel.waitFor({ state: 'visible', timeout: 30000 });

    // Find manufacturer autocomplete input within the filter field
    const manufacturerField = queryPanel.locator('.filter-field').filter({ hasText: 'Manufacturer' });
    const manufacturerInput = manufacturerField.locator('input').first();

    // Screenshot 1: Before focus
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/016-01-before-focus.png`,
      fullPage: false
    });

    // Focus the input (click on it)
    await manufacturerInput.click();
    await page.waitForTimeout(800); // Wait for API call on focus

    // Screenshot 2: After focus
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/016-02-after-focus.png`,
      fullPage: false
    });

    console.log('\n=== US-QP-016 Criteria Check ===');

    // Check if suggestions panel appears on focus
    const suggestionsPanel = page.locator('.p-autocomplete-panel, .p-autocomplete-items');
    const hasSuggestions = await suggestionsPanel.isVisible();
    console.log('Criterion 1: Initial suggestions on focus:', hasSuggestions ? 'PASS' : 'FAIL (may require typing first)');

    if (hasSuggestions) {
      const suggestions = await page.locator('.p-autocomplete-item').allTextContents();
      console.log('Criterion 2: First 10 options displayed:', suggestions.length);
    }
  });
});
