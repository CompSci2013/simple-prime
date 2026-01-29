/**
 * User Story Validation: US-QC-020 to US-QC-027
 * Epic 3: Year Range Filter
 *
 * This test captures screenshots for manual review and logs findings.
 * IMPORTANT: The user stories describe a "decade grid" UI, but actual
 * implementation uses simple number inputs (p-inputNumber).
 */
import { test } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const SCREENSHOT_DIR = 'test-results/validation/epic-3';

test.describe('Epic 3: Year Range Filter - Validation', () => {
  test.setTimeout(60000);

  test.beforeAll(async () => {
    const dir = path.join(process.cwd(), SCREENSHOT_DIR);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });

  test('US-QC-020: Open Year Range Picker', async ({ page }) => {
    await page.goto('http://localhost:4205/automobiles/discover');
    await page.waitForLoadState('networkidle');
    await page.locator('.query-control-panel').waitFor({ state: 'visible', timeout: 30000 });

    // Open dropdown and select Year
    const dropdown = page.locator('p-select').first();
    await dropdown.click();
    await page.waitForTimeout(300);

    // Screenshot dropdown with Year option
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/020-01-dropdown-with-year.png`,
      fullPage: false
    });

    const yearOption = page.locator('.p-select-option, .p-select-item').filter({ hasText: /^Year$/ }).first();
    const hasYear = await yearOption.count() > 0;
    console.log('\n=== US-QC-020 Criteria Check ===');
    console.log('Year option in dropdown:', hasYear ? 'FOUND' : 'NOT FOUND');

    if (hasYear) {
      await yearOption.click();
      await page.waitForTimeout(500);

      const dialog = page.locator('.p-dialog:visible').first();
      await dialog.waitFor({ state: 'visible', timeout: 5000 });

      await page.screenshot({
        path: `${SCREENSHOT_DIR}/020-02-year-dialog-opened.png`,
        fullPage: false
      });

      // Check dialog structure
      const dialogTitle = await dialog.locator('.p-dialog-title').first().textContent();
      console.log('Dialog title:', dialogTitle);

      // Check for decade grid (as per user story) vs number inputs (actual)
      const decadeGrid = dialog.locator('.decade-grid, .year-grid, .p-calendar');
      const hasDecadeGrid = await decadeGrid.count() > 0;
      console.log('Criterion 2: Decade grid:', hasDecadeGrid ? 'FOUND' : 'NOT FOUND');

      // Check for number inputs (actual implementation)
      const numberInputs = dialog.locator('p-inputnumber, input[type="number"]');
      const hasNumberInputs = await numberInputs.count() > 0;
      console.log('Actual implementation: Number inputs:', hasNumberInputs ? 'FOUND' : 'NOT FOUND');

      if (hasNumberInputs) {
        console.log('FINDING: User story describes "decade grid" but actual uses NUMBER INPUTS');
        console.log('User stories US-QC-020 to US-QC-023 describe wrong UI pattern');
      }

      // Screenshot dialog content
      await dialog.screenshot({
        path: `${SCREENSHOT_DIR}/020-03-year-dialog-content.png`
      });

      // Check for left/right navigation arrows (as per story)
      const navArrows = dialog.locator('.p-datepicker-prev, .p-datepicker-next, button:has(.pi-chevron-left), button:has(.pi-chevron-right)');
      const hasNavArrows = await navArrows.count() > 0;
      console.log('Criterion 3: Left/right navigation arrows:', hasNavArrows ? 'FOUND' : 'NOT FOUND');
    }
  });

  test('US-QC-021-022: Select Year Range', async ({ page }) => {
    await page.goto('http://localhost:4205/automobiles/discover');
    await page.waitForLoadState('networkidle');
    await page.locator('.query-control-panel').waitFor({ state: 'visible', timeout: 30000 });

    // Open Year dialog
    const dropdown = page.locator('p-select').first();
    await dropdown.click();
    await page.waitForTimeout(300);
    await page.locator('.p-select-option, .p-select-item').filter({ hasText: /^Year$/ }).first().click();
    await page.waitForTimeout(500);

    const dialog = page.locator('.p-dialog:visible').first();
    await dialog.waitFor({ state: 'visible', timeout: 5000 });

    console.log('\n=== US-QC-021-022 Criteria Check ===');

    // Find the year inputs (Start Year and End Year)
    const startYearInput = dialog.locator('p-inputnumber').first();
    const endYearInput = dialog.locator('p-inputnumber').nth(1);

    const hasStartInput = await startYearInput.count() > 0;
    const hasEndInput = await endYearInput.count() > 0;
    console.log('Start Year input:', hasStartInput ? 'FOUND' : 'NOT FOUND');
    console.log('End Year input:', hasEndInput ? 'FOUND' : 'NOT FOUND');

    if (hasStartInput && hasEndInput) {
      // Fill in year range
      await startYearInput.locator('input').fill('1980');
      await page.waitForTimeout(200);

      await page.screenshot({
        path: `${SCREENSHOT_DIR}/021-01-start-year-entered.png`,
        fullPage: false
      });

      await endYearInput.locator('input').fill('2003');
      await page.waitForTimeout(200);

      await page.screenshot({
        path: `${SCREENSHOT_DIR}/022-01-end-year-entered.png`,
        fullPage: false
      });

      // Verify inputs show correct values
      const startValue = await startYearInput.locator('input').inputValue();
      const endValue = await endYearInput.locator('input').inputValue();
      console.log('Start year value:', startValue);
      console.log('End year value:', endValue);

      console.log('FINDING: Actual UI uses text inputs, not clicking years in a grid');
      console.log('User stories US-QC-021 and US-QC-022 describe grid clicking, but actual uses input fields');
    }
  });

  test('US-QC-024: Apply Year Range Filter', async ({ page }) => {
    await page.goto('http://localhost:4205/automobiles/discover');
    await page.waitForLoadState('networkidle');
    await page.locator('.query-control-panel').waitFor({ state: 'visible', timeout: 30000 });

    const initialUrl = page.url();
    console.log('\n=== US-QC-024 Criteria Check ===');
    console.log('Initial URL:', initialUrl);

    // Open Year dialog
    const dropdown = page.locator('p-select').first();
    await dropdown.click();
    await page.waitForTimeout(300);
    await page.locator('.p-select-option, .p-select-item').filter({ hasText: /^Year$/ }).first().click();
    await page.waitForTimeout(500);

    const dialog = page.locator('.p-dialog:visible').first();
    await dialog.waitFor({ state: 'visible', timeout: 5000 });

    // Fill in year range
    const startYearInput = dialog.locator('p-inputnumber').first();
    const endYearInput = dialog.locator('p-inputnumber').nth(1);

    await startYearInput.locator('input').fill('1980');
    await endYearInput.locator('input').fill('2003');
    await page.waitForTimeout(200);

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/024-01-years-entered.png`,
      fullPage: false
    });

    // Click Apply
    const applyButton = dialog.locator('p-button').filter({ hasText: 'Apply' }).locator('button');
    await applyButton.click();
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/024-02-after-apply.png`,
      fullPage: false
    });

    // Check dialog closed
    const dialogStillVisible = await dialog.isVisible();
    console.log('Criterion 1: Clicking Apply closes dialog:', !dialogStillVisible);

    // Check for filter chip
    const filterChip = page.locator('.filter-chip');
    const hasChip = await filterChip.count() > 0;
    console.log('Criterion 2: Chip appears:', hasChip);

    if (hasChip) {
      const chipText = await filterChip.first().textContent();
      console.log('Chip text:', chipText);
      console.log('Expected format: "Year: 1980 - 2003"');
    }

    // Check URL
    const newUrl = page.url();
    console.log('Criterion 3: URL updates:', newUrl);
    console.log('URL contains yearMin:', newUrl.includes('yearMin'));
    console.log('URL contains yearMax:', newUrl.includes('yearMax'));
  });

  test('US-QC-025: Select Single Year', async ({ page }) => {
    await page.goto('http://localhost:4205/automobiles/discover');
    await page.waitForLoadState('networkidle');
    await page.locator('.query-control-panel').waitFor({ state: 'visible', timeout: 30000 });

    console.log('\n=== US-QC-025 Criteria Check ===');

    // Open Year dialog
    const dropdown = page.locator('p-select').first();
    await dropdown.click();
    await page.waitForTimeout(300);
    await page.locator('.p-select-option, .p-select-item').filter({ hasText: /^Year$/ }).first().click();
    await page.waitForTimeout(500);

    const dialog = page.locator('.p-dialog:visible').first();
    await dialog.waitFor({ state: 'visible', timeout: 5000 });

    // Fill same year for both
    const startYearInput = dialog.locator('p-inputnumber').first();
    const endYearInput = dialog.locator('p-inputnumber').nth(1);

    await startYearInput.locator('input').fill('2020');
    await endYearInput.locator('input').fill('2020');
    await page.waitForTimeout(200);

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/025-01-single-year.png`,
      fullPage: false
    });

    // Click Apply
    const applyButton = dialog.locator('p-button').filter({ hasText: 'Apply' }).locator('button');
    await applyButton.click();
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/025-02-after-apply.png`,
      fullPage: false
    });

    // Check chip and URL
    const filterChip = page.locator('.filter-chip');
    if (await filterChip.count() > 0) {
      const chipText = await filterChip.first().textContent();
      console.log('Chip text for single year:', chipText);
      console.log('Expected: "Year: 2020" or "Year: 2020 - 2020"');
    }

    const url = page.url();
    console.log('URL:', url);
    console.log('Expected: yearMin=2020&yearMax=2020');
  });

  test('US-QC-026: Select Open-Ended Range (Start Only)', async ({ page }) => {
    await page.goto('http://localhost:4205/automobiles/discover');
    await page.waitForLoadState('networkidle');
    await page.locator('.query-control-panel').waitFor({ state: 'visible', timeout: 30000 });

    console.log('\n=== US-QC-026 Criteria Check ===');

    // Open Year dialog
    const dropdown = page.locator('p-select').first();
    await dropdown.click();
    await page.waitForTimeout(300);
    await page.locator('.p-select-option, .p-select-item').filter({ hasText: /^Year$/ }).first().click();
    await page.waitForTimeout(500);

    const dialog = page.locator('.p-dialog:visible').first();
    await dialog.waitFor({ state: 'visible', timeout: 5000 });

    // Fill only start year
    const startYearInput = dialog.locator('p-inputnumber').first();
    await startYearInput.locator('input').fill('2020');
    await page.waitForTimeout(200);

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/026-01-start-only.png`,
      fullPage: false
    });

    // Check if Apply is enabled with only start year
    const applyButton = dialog.locator('p-button').filter({ hasText: 'Apply' }).locator('button');
    const isDisabled = await applyButton.getAttribute('disabled');
    console.log('Apply button with only start year - disabled:', isDisabled);

    if (isDisabled === null) {
      await applyButton.click();
      await page.waitForTimeout(1000);

      await page.screenshot({
        path: `${SCREENSHOT_DIR}/026-02-after-apply.png`,
        fullPage: false
      });

      const url = page.url();
      console.log('URL with start only:', url);
      console.log('Expected: yearMin=2020 (no yearMax)');
    } else {
      console.log('FINDING: Apply button disabled with only start year');
      console.log('This differs from user story expectation');
    }
  });

  test('US-QC-027: Select Open-Ended Range (End Only)', async ({ page }) => {
    await page.goto('http://localhost:4205/automobiles/discover');
    await page.waitForLoadState('networkidle');
    await page.locator('.query-control-panel').waitFor({ state: 'visible', timeout: 30000 });

    console.log('\n=== US-QC-027 Criteria Check ===');

    // Open Year dialog
    const dropdown = page.locator('p-select').first();
    await dropdown.click();
    await page.waitForTimeout(300);
    await page.locator('.p-select-option, .p-select-item').filter({ hasText: /^Year$/ }).first().click();
    await page.waitForTimeout(500);

    const dialog = page.locator('.p-dialog:visible').first();
    await dialog.waitFor({ state: 'visible', timeout: 5000 });

    // Fill only end year
    const endYearInput = dialog.locator('p-inputnumber').nth(1);
    await endYearInput.locator('input').fill('2003');
    await page.waitForTimeout(200);

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/027-01-end-only.png`,
      fullPage: false
    });

    // Check if Apply is enabled with only end year
    const applyButton = dialog.locator('p-button').filter({ hasText: 'Apply' }).locator('button');
    const isDisabled = await applyButton.getAttribute('disabled');
    console.log('Apply button with only end year - disabled:', isDisabled);

    if (isDisabled === null) {
      await applyButton.click();
      await page.waitForTimeout(1000);

      await page.screenshot({
        path: `${SCREENSHOT_DIR}/027-02-after-apply.png`,
        fullPage: false
      });

      const url = page.url();
      console.log('URL with end only:', url);
      console.log('Expected: yearMax=2003 (no yearMin)');
    } else {
      console.log('FINDING: Apply button disabled with only end year');
      console.log('This differs from user story expectation');
    }
  });
});
