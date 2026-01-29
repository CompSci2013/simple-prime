/**
 * User Story Validation: US-QC-010 to US-QC-016
 * Epic 2: Multiselect Filters (Manufacturer, Model, Body Class)
 *
 * This test captures screenshots for manual review and logs findings.
 * Uses PrimeNG 21 selectors.
 */
import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const SCREENSHOT_DIR = 'test-results/validation/epic-2';

test.describe('Epic 2: Multiselect Filters - Validation', () => {
  test.setTimeout(60000);

  test.beforeAll(async () => {
    const dir = path.join(process.cwd(), SCREENSHOT_DIR);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });

  test('US-QC-010: View Multiselect Options', async ({ page }) => {
    await page.goto('http://localhost:4205/automobiles/discover');
    await page.waitForLoadState('networkidle');
    await page.locator('.query-control-panel').waitFor({ state: 'visible', timeout: 30000 });

    // Open dropdown and select Body Class
    const dropdown = page.locator('p-select').first();
    await dropdown.click();
    await page.waitForTimeout(300);

    const bodyClassOption = page.locator('.p-select-option, .p-select-item').filter({ hasText: 'Body Class' }).first();
    await bodyClassOption.click();
    await page.waitForTimeout(500);

    // Wait for dialog to appear - use the visible .p-dialog container inside p-dialog
    const dialogContainer = page.locator('.p-dialog:visible').first();
    await dialogContainer.waitFor({ state: 'visible', timeout: 5000 });

    // Screenshot 1: Dialog opened
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/010-01-dialog-opened.png`,
      fullPage: false
    });

    // Use the dialog container for further queries
    const dialog = dialogContainer;

    // Get dialog title from header span (actual structure: ng-template pTemplate="header" > span)
    const dialogHeader = page.locator('p-dialog .p-dialog-header span').first();
    const dialogTitle = await dialogHeader.textContent();
    console.log('\n=== US-QC-010 Criteria Check ===');
    console.log('Criterion 1: Dialog title "Select [Field Name]s":', dialogTitle);

    // Check for checkbox list (actual structure: .option-item with p-checkbox)
    const checkboxItems = page.locator('.option-item');
    const checkboxCount = await checkboxItems.count();
    console.log('Criterion 2: Checkbox list displays options:', checkboxCount, 'items found');

    // Get all option text from labels
    const options = await page.locator('.option-item label').allTextContents();
    console.log('Available options:', options);

    // Screenshot 2: Dialog content focused
    await dialog.screenshot({
      path: `${SCREENSHOT_DIR}/010-02-dialog-content.png`
    });

    // Check if scrollable (options-list container)
    const optionsList = page.locator('.options-list');
    const optionsListVisible = await optionsList.isVisible();
    console.log('Criterion 3: Options scrollable - options-list element:', optionsListVisible ? 'FOUND' : 'NOT FOUND');

    // Check for keyboard navigation (Tab test)
    await page.keyboard.press('Tab');
    await page.waitForTimeout(200);
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/010-03-after-tab.png`,
      fullPage: false
    });
    console.log('Criterion 5: Tab moves focus - CHECKING via screenshot');
  });

  test('US-QC-011: Search Within Multiselect Options', async ({ page }) => {
    await page.goto('http://localhost:4205/automobiles/discover');
    await page.waitForLoadState('networkidle');
    await page.locator('.query-control-panel').waitFor({ state: 'visible', timeout: 30000 });

    // Open Body Class dialog
    const dropdown = page.locator('p-select').first();
    await dropdown.click();
    await page.waitForTimeout(300);
    await page.locator('.p-select-option, .p-select-item').filter({ hasText: 'Body Class' }).first().click();
    await page.waitForTimeout(500);

    const dialog = page.locator('.p-dialog:visible').first();
    await dialog.waitFor({ state: 'visible', timeout: 5000 });

    console.log('\n=== US-QC-011 Criteria Check ===');

    // Look for search input in dialog (actual structure: .search-box input)
    const searchInput = dialog.locator('.search-box input, input[pInputText]').first();
    const hasSearch = await searchInput.count() > 0;
    console.log('Criterion 1: Search box at top of dialog:', hasSearch ? 'FOUND' : 'NOT FOUND');

    // Get initial option count
    const initialOptions = await dialog.locator('.option-item label').allTextContents();
    console.log('Initial options count:', initialOptions.length);

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/011-01-dialog-with-search.png`,
      fullPage: false
    });

    if (hasSearch) {
      // Type to search
      await searchInput.fill('sed');
      await page.waitForTimeout(400); // Wait for potential debounce

      await page.screenshot({
        path: `${SCREENSHOT_DIR}/011-02-search-sed.png`,
        fullPage: false
      });

      const filteredOptions = await dialog.locator('.option-item label').allTextContents();
      console.log('Criterion 2: Typing filters list (300ms debounce) - filtered to:', filteredOptions);
      console.log('Criterion 3: Case-insensitive - typed "sed", results:', filteredOptions);

      // Clear search
      await searchInput.clear();
      await page.waitForTimeout(400);

      await page.screenshot({
        path: `${SCREENSHOT_DIR}/011-03-search-cleared.png`,
        fullPage: false
      });

      const restoredOptions = await dialog.locator('.option-item label').allTextContents();
      console.log('Criterion 5: Clearing restores full list:', restoredOptions.length, 'options');
    } else {
      console.log('WARNING: No search input found in dialog');
    }
  });

  test('US-QC-012: Select Multiple Options', async ({ page }) => {
    await page.goto('http://localhost:4205/automobiles/discover');
    await page.waitForLoadState('networkidle');
    await page.locator('.query-control-panel').waitFor({ state: 'visible', timeout: 30000 });

    // Open Body Class dialog
    const dropdown = page.locator('p-select').first();
    await dropdown.click();
    await page.waitForTimeout(300);
    await page.locator('.p-select-option, .p-select-item').filter({ hasText: 'Body Class' }).first().click();
    await page.waitForTimeout(500);

    const dialog = page.locator('.p-dialog:visible').first();
    await dialog.waitFor({ state: 'visible', timeout: 5000 });

    console.log('\n=== US-QC-012 Criteria Check ===');

    // Screenshot before selection
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/012-01-before-selection.png`,
      fullPage: false
    });

    // Find clickable options (actual structure: .option-item with p-checkbox)
    const options = dialog.locator('.option-item');
    const optionCount = await options.count();
    console.log('Found', optionCount, 'selectable options');

    if (optionCount >= 3) {
      // Click first option checkbox
      await options.nth(0).locator('p-checkbox').click();
      await page.waitForTimeout(200);

      await page.screenshot({
        path: `${SCREENSHOT_DIR}/012-02-one-selected.png`,
        fullPage: false
      });

      // Click second option checkbox
      await options.nth(1).locator('p-checkbox').click();
      await page.waitForTimeout(200);

      // Click third option checkbox
      await options.nth(2).locator('p-checkbox').click();
      await page.waitForTimeout(200);

      await page.screenshot({
        path: `${SCREENSHOT_DIR}/012-03-three-selected.png`,
        fullPage: false
      });

      console.log('Criterion 1: Clicking checkbox toggles selection - CHECKING via screenshots');
      console.log('Criterion 2: Multiple selections allowed - selected 3 items');

      // Check for selection count display (actual structure: .selection-summary)
      const selectionSummary = dialog.locator('.selection-summary');
      const hasSelectionCount = await selectionSummary.count() > 0;
      if (hasSelectionCount) {
        const summaryText = await selectionSummary.textContent();
        console.log('Criterion 3: Selection count displayed:', summaryText);
      } else {
        console.log('Criterion 3: Selection count displayed: NOT VISIBLE');
      }
      console.log('Criterion 4: All selections persist while dialog open - CHECKING via screenshot');
    }

    // Test keyboard Space toggle
    await page.keyboard.press('Tab');
    await page.waitForTimeout(100);
    await page.keyboard.press('Space');
    await page.waitForTimeout(200);

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/012-04-after-space-key.png`,
      fullPage: false
    });
    console.log('Criterion 5: Keyboard Space toggles checkbox - CHECKING via screenshot');
  });

  test('US-QC-013: Apply Multiselect Filter', async ({ page }) => {
    await page.goto('http://localhost:4205/automobiles/discover');
    await page.waitForLoadState('networkidle');
    await page.locator('.query-control-panel').waitFor({ state: 'visible', timeout: 30000 });

    // Capture initial URL
    const initialUrl = page.url();
    console.log('\n=== US-QC-013 Criteria Check ===');
    console.log('Initial URL:', initialUrl);

    // Open Body Class dialog and select options
    const dropdown = page.locator('p-select').first();
    await dropdown.click();
    await page.waitForTimeout(300);
    await page.locator('.p-select-option, .p-select-item').filter({ hasText: 'Body Class' }).first().click();
    await page.waitForTimeout(500);

    const dialog = page.locator('.p-dialog:visible').first();
    await dialog.waitFor({ state: 'visible', timeout: 5000 });

    // Select Sedan and SUV using actual .option-item structure
    const options = dialog.locator('.option-item');
    const allLabels = await dialog.locator('.option-item label').allTextContents();
    console.log('Available options:', allLabels);

    // Find and click Sedan checkbox
    const sedanIndex = allLabels.findIndex(o => o.includes('Sedan'));
    if (sedanIndex >= 0) {
      await options.nth(sedanIndex).locator('p-checkbox').click();
      await page.waitForTimeout(200);
      console.log('Selected Sedan at index', sedanIndex);
    }

    // Find and click SUV checkbox
    const suvIndex = allLabels.findIndex(o => o.includes('SUV'));
    if (suvIndex >= 0) {
      await options.nth(suvIndex).locator('p-checkbox').click();
      await page.waitForTimeout(200);
      console.log('Selected SUV at index', suvIndex);
    }

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/013-01-options-selected.png`,
      fullPage: false
    });

    // Check selection summary
    const selectionSummary = await dialog.locator('.selection-summary').textContent();
    console.log('Selection summary:', selectionSummary);

    // Find and click Apply button (should now be enabled)
    const applyButton = dialog.locator('p-button').filter({ hasText: 'Apply' }).locator('button');
    const isDisabled = await applyButton.getAttribute('disabled');
    console.log('Apply button disabled:', isDisabled);

    if (isDisabled === null) {
      await applyButton.click();
      await page.waitForTimeout(1000);

      await page.screenshot({
        path: `${SCREENSHOT_DIR}/013-02-after-apply.png`,
        fullPage: false
      });

      // Check dialog closed
      const dialogStillVisible = await dialog.isVisible();
      console.log('Criterion 1: Clicking Apply closes dialog:', !dialogStillVisible);

      // Check for filter chip
      const filterChip = page.locator('.filter-chip');
      const hasChip = await filterChip.count() > 0;
      console.log('Criterion 2: Filter chip appears in Active Filters:', hasChip);

      if (hasChip) {
        const chipText = await filterChip.first().textContent();
        console.log('Criterion 3: Chip shows field name and values:', chipText);
      }

      // Check URL update
      const newUrl = page.url();
      console.log('Criterion 4: URL updates with filter parameter:', newUrl);
      console.log('URL contains bodyClass:', newUrl.includes('bodyClass') || newUrl.includes('body_class'));

      // Screenshot of final state
      await page.screenshot({
        path: `${SCREENSHOT_DIR}/013-03-filter-applied.png`,
        fullPage: false
      });
    } else {
      console.log('ERROR: Apply button still disabled after selection');
      await page.screenshot({
        path: `${SCREENSHOT_DIR}/013-ERROR-apply-disabled.png`,
        fullPage: false
      });
    }
  });

  test('US-QC-014: Cancel Multiselect Dialog', async ({ page }) => {
    await page.goto('http://localhost:4205/automobiles/discover');
    await page.waitForLoadState('networkidle');
    await page.locator('.query-control-panel').waitFor({ state: 'visible', timeout: 30000 });

    const initialUrl = page.url();
    console.log('\n=== US-QC-014 Criteria Check ===');
    console.log('Initial URL:', initialUrl);

    // Open Body Class dialog
    const dropdown = page.locator('p-select').first();
    await dropdown.click();
    await page.waitForTimeout(300);
    await page.locator('.p-select-option, .p-select-item').filter({ hasText: 'Body Class' }).first().click();
    await page.waitForTimeout(500);

    const dialog = page.locator('.p-dialog:visible').first();
    await dialog.waitFor({ state: 'visible', timeout: 5000 });

    // Select some options using actual structure
    const options = dialog.locator('.option-item');
    if (await options.count() > 0) {
      await options.first().locator('p-checkbox').click();
      await page.waitForTimeout(200);
    }

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/014-01-option-selected.png`,
      fullPage: false
    });

    // Find and click Cancel button (p-button with label="Cancel")
    const cancelButton = dialog.locator('p-button').filter({ hasText: 'Cancel' }).locator('button');
    const hasCancel = await cancelButton.count() > 0;
    console.log('Cancel button found:', hasCancel);

    if (hasCancel) {
      await cancelButton.click();
      await page.waitForTimeout(500);

      await page.screenshot({
        path: `${SCREENSHOT_DIR}/014-02-after-cancel.png`,
        fullPage: false
      });

      const dialogStillVisible = await dialog.isVisible();
      console.log('Criterion 1: Clicking Cancel closes dialog:', !dialogStillVisible);

      const newUrl = page.url();
      console.log('Criterion 3: URL unchanged:', newUrl === initialUrl);

      // Check no filter chip
      const filterChip = page.locator('.filter-chip');
      const hasChip = await filterChip.count() > 0;
      console.log('Criterion 2: No filter applied:', !hasChip);
    }
  });

  test('US-QC-015: Close Dialog via X Button', async ({ page }) => {
    await page.goto('http://localhost:4205/automobiles/discover');
    await page.waitForLoadState('networkidle');
    await page.locator('.query-control-panel').waitFor({ state: 'visible', timeout: 30000 });

    console.log('\n=== US-QC-015 Criteria Check ===');

    // Open Body Class dialog
    const dropdown = page.locator('p-select').first();
    await dropdown.click();
    await page.waitForTimeout(300);
    await page.locator('.p-select-option, .p-select-item').filter({ hasText: 'Body Class' }).first().click();
    await page.waitForTimeout(500);

    const dialog = page.locator('.p-dialog:visible').first();
    await dialog.waitFor({ state: 'visible', timeout: 5000 });

    // Find X button (PrimeNG 21 uses p-dialog-header-maximize or button with close icon)
    // The dialog has [closable]="true" so there should be a close button
    const closeButton = page.locator('.p-dialog-header-close, .p-dialog-close-button, button.p-dialog-header-icon');
    const hasClose = await closeButton.count() > 0;
    console.log('Criterion 1: X button in top-right corner:', hasClose ? 'FOUND' : 'NOT FOUND');

    // Also check for any button with close/times icon
    const closeIconButton = page.locator('p-dialog button').filter({ has: page.locator('.pi-times') });
    const hasCloseIcon = await closeIconButton.count() > 0;
    console.log('Alternative X button (with pi-times icon):', hasCloseIcon ? 'FOUND' : 'NOT FOUND');

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/015-01-dialog-with-x-button.png`,
      fullPage: false
    });

    const buttonToClick = hasClose ? closeButton.first() : (hasCloseIcon ? closeIconButton.first() : null);

    if (buttonToClick) {
      await buttonToClick.click();
      await page.waitForTimeout(500);

      const dialogStillVisible = await dialog.isVisible();
      console.log('Criterion 2: Clicking X closes dialog:', !dialogStillVisible);
      console.log('Criterion 3: No side effects - same as Cancel');

      await page.screenshot({
        path: `${SCREENSHOT_DIR}/015-02-after-x-click.png`,
        fullPage: false
      });
    } else {
      console.log('FINDING: No X button found - user story US-QC-015 may be INCORRECT');
      console.log('The dialog uses Cancel button instead of X button');
    }
  });

  test('US-QC-016: Close Dialog via Escape Key', async ({ page }) => {
    await page.goto('http://localhost:4205/automobiles/discover');
    await page.waitForLoadState('networkidle');
    await page.locator('.query-control-panel').waitFor({ state: 'visible', timeout: 30000 });

    console.log('\n=== US-QC-016 Criteria Check ===');

    // Open Body Class dialog
    const dropdown = page.locator('p-select').first();
    await dropdown.click();
    await page.waitForTimeout(300);
    await page.locator('.p-select-option, .p-select-item').filter({ hasText: 'Body Class' }).first().click();
    await page.waitForTimeout(500);

    const dialog = page.locator('.p-dialog:visible').first();
    await dialog.waitFor({ state: 'visible', timeout: 5000 });

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/016-01-dialog-open.png`,
      fullPage: false
    });

    // Press Escape
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);

    const dialogStillVisible = await dialog.isVisible();
    console.log('Criterion 1: Pressing Escape closes dialog:', !dialogStillVisible);

    if (dialogStillVisible) {
      console.log('FINDING: Escape key does NOT close dialog - user story US-QC-016 may be INCORRECT');
      console.log('PrimeNG dialog may not have Escape key handling enabled');
    } else {
      console.log('Criterion 2: Same behavior as Cancel');
    }

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/016-02-after-escape.png`,
      fullPage: false
    });

    // Check focus returned
    console.log('Criterion 3: Focus returns to main page - CHECKING via screenshot');
  });
});
