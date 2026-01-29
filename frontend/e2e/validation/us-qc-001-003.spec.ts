/**
 * User Story Validation: US-QC-001, US-QC-002, US-QC-003
 * Epic 1: Filter Field Selection
 *
 * This test captures screenshots for manual review.
 * Uses PrimeNG 21 selectors (p-select instead of p-dropdown)
 */
import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const SCREENSHOT_DIR = 'test-results/validation/epic-1';

test.describe('Epic 1: Filter Field Selection - Validation', () => {
  // Increase timeout for validation tests (network latency, animations)
  test.setTimeout(60000);

  test.beforeAll(async () => {
    // Ensure screenshot directory exists
    const dir = path.join(process.cwd(), SCREENSHOT_DIR);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });

  test('US-QC-001: View Available Filter Fields', async ({ page }) => {
    // Navigate to discover page
    await page.goto('http://localhost:4205/automobiles/discover');
    await page.waitForLoadState('networkidle');

    // Wait for page to fully load - look for query control panel
    const queryControlPanel = page.locator('.query-control-panel');
    await queryControlPanel.waitFor({ state: 'visible', timeout: 30000 });

    // Screenshot 1: Initial state
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/001-01-initial-state.png`,
      fullPage: false
    });

    // Find the p-select dropdown (PrimeNG 21 uses p-select, not p-dropdown)
    const dropdown = page.locator('p-select').first();
    await dropdown.waitFor({ state: 'visible' });

    // Screenshot 2: Before clicking dropdown
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/001-02-before-dropdown-click.png`,
      fullPage: false
    });

    // Click to open dropdown
    await dropdown.click();
    await page.waitForTimeout(500); // Wait for animation

    // Screenshot 3: Dropdown expanded
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/001-03-dropdown-expanded.png`,
      fullPage: false
    });

    // Check for filter fields in dropdown panel (PrimeNG 21 uses p-select-overlay)
    const dropdownPanel = page.locator('.p-select-overlay, .p-select-panel');
    await dropdownPanel.waitFor({ state: 'visible', timeout: 5000 });

    // Get all visible options (PrimeNG 21 uses p-select-option)
    const options = await page.locator('.p-select-option, .p-select-item').allTextContents();
    console.log('Available filter fields:', options);

    // Screenshot 4: Close-up of dropdown options
    await dropdownPanel.screenshot({
      path: `${SCREENSHOT_DIR}/001-04-dropdown-options.png`
    });

    // Verify expected fields are present
    const expectedFields = ['Manufacturer', 'Model', 'Year', 'Body Class', 'Data Source'];

    console.log('\n=== US-QC-001 Criteria Check ===');
    console.log('Criterion 1: Dropdown expands - CHECKING via screenshot');
    console.log('Criterion 2: Shows configured filter fields:',
      expectedFields.filter(f => options.some(o => o.includes(f))));
    console.log('Criterion 3: Shows highlight filter fields:',
      options.filter(o => o.includes('Highlight')));
    console.log('Criterion 4: Each field clickable - CHECKING next');
  });

  test('US-QC-002: Search for Filter Field', async ({ page }) => {
    await page.goto('http://localhost:4205/automobiles/discover');
    await page.waitForLoadState('networkidle');

    // Wait for query control
    await page.locator('.query-control-panel').waitFor({ state: 'visible', timeout: 30000 });

    // Open dropdown
    const dropdown = page.locator('p-select').first();
    await dropdown.click();
    await page.waitForTimeout(300);

    // Screenshot 1: Dropdown open, looking for search box
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/002-01-dropdown-open.png`,
      fullPage: false
    });

    // Look for filter/search input in dropdown (PrimeNG 21 filter classes)
    const filterInput = page.locator('.p-select-filter, .p-select-filter-input, input[type="text"]').first();
    const hasFilter = await filterInput.count() > 0;

    console.log('\n=== US-QC-002 Criteria Check ===');
    console.log('Criterion 1: Search box at top of dropdown:', hasFilter ? 'FOUND' : 'NOT FOUND');

    if (hasFilter) {
      // Type to search
      await filterInput.fill('body');
      await page.waitForTimeout(300);

      // Screenshot 2: After typing "body"
      await page.screenshot({
        path: `${SCREENSHOT_DIR}/002-02-search-body.png`,
        fullPage: false
      });

      // Check filtered results
      const filteredOptions = await page.locator('.p-select-option:visible, .p-select-item:visible').allTextContents();
      console.log('Criterion 2: Real-time filtering - filtered to:', filteredOptions);
      console.log('Criterion 3: Case-insensitive - typed "body", got:', filteredOptions);
      console.log('Criterion 4: Partial match shows "Body Class":',
        filteredOptions.some(o => o.includes('Body Class')));

      // Clear and verify full list restores
      await filterInput.clear();
      await page.waitForTimeout(300);

      // Screenshot 3: After clearing search
      await page.screenshot({
        path: `${SCREENSHOT_DIR}/002-03-search-cleared.png`,
        fullPage: false
      });

      const restoredOptions = await page.locator('.p-select-option:visible, .p-select-item:visible').allTextContents();
      console.log('Criterion 5: Clearing restores full list:', restoredOptions.length, 'options');
    } else {
      console.log('WARNING: No search/filter input found in dropdown');
      await page.screenshot({
        path: `${SCREENSHOT_DIR}/002-02-no-search-box.png`,
        fullPage: false
      });
    }
  });

  test('US-QC-003: Select Field to Open Dialog', async ({ page }) => {
    await page.goto('http://localhost:4205/automobiles/discover');
    await page.waitForLoadState('networkidle');

    // Wait for query control
    await page.locator('.query-control-panel').waitFor({ state: 'visible', timeout: 30000 });

    // Open dropdown
    const dropdown = page.locator('p-select').first();
    await dropdown.click();
    await page.waitForTimeout(300);

    // Screenshot 1: Dropdown open
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/003-01-dropdown-open.png`,
      fullPage: false
    });

    // Find and click "Body Class" option (try multiple selectors)
    const bodyClassOption = page.locator('.p-select-option, .p-select-item').filter({ hasText: 'Body Class' }).first();

    if (await bodyClassOption.count() > 0) {
      await bodyClassOption.click();
      await page.waitForTimeout(500);

      // Screenshot 2: After clicking - check if dropdown closed
      await page.screenshot({
        path: `${SCREENSHOT_DIR}/003-02-after-field-click.png`,
        fullPage: false
      });

      // Check for dialog (wait a bit for it to appear)
      await page.waitForTimeout(500);
      const dialog = page.locator('p-dialog[ng-reflect-visible="true"], .p-dialog');
      const dialogVisible = await dialog.isVisible();

      console.log('\n=== US-QC-003 Criteria Check ===');
      console.log('Criterion 1: Dropdown closes after click - CHECKING via screenshot');
      console.log('Criterion 2: Dialog opens:', dialogVisible ? 'YES' : 'NO');

      if (dialogVisible) {
        // Screenshot 3: Dialog open
        await page.screenshot({
          path: `${SCREENSHOT_DIR}/003-03-dialog-open.png`,
          fullPage: false
        });

        // Wait for options to load
        await page.waitForTimeout(1000);

        // Check for loading state or options
        const dialogContent = await dialog.textContent();
        console.log('Criterion 3: Dialog loads options from API - content preview:',
          dialogContent?.substring(0, 100));
        console.log('Criterion 4: Loading state - NEEDS VISUAL REVIEW');

        // Screenshot 4: Dialog content
        await dialog.screenshot({
          path: `${SCREENSHOT_DIR}/003-04-dialog-content.png`
        });
      }
    } else {
      console.log('ERROR: Body Class option not found in dropdown');
      // Screenshot showing what options ARE available
      await page.screenshot({
        path: `${SCREENSHOT_DIR}/003-02-body-class-not-found.png`,
        fullPage: false
      });
    }
  });
});
