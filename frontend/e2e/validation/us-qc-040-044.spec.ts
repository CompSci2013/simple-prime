/**
 * User Story Validation: US-QC-040 to US-QC-044
 * Epic 5: Highlight Filters
 */
import { test } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const SCREENSHOT_DIR = 'test-results/validation/epic-5';

test.describe('Epic 5: Highlight Filters - Validation', () => {
  test.setTimeout(60000);

  test.beforeAll(async () => {
    const dir = path.join(process.cwd(), SCREENSHOT_DIR);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });

  test('US-QC-040: Add Highlight Filter', async ({ page }) => {
    await page.goto('http://localhost:4205/automobiles/discover');
    await page.waitForLoadState('networkidle');
    await page.locator('.query-control-panel').waitFor({ state: 'visible', timeout: 30000 });

    console.log('\n=== US-QC-040 Criteria Check ===');

    // Open dropdown
    const dropdown = page.locator('p-select').first();
    await dropdown.click();
    await page.waitForTimeout(300);

    // Screenshot dropdown options
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/040-01-dropdown-options.png`,
      fullPage: false
    });

    // Check for highlight options in dropdown
    const allOptions = await page.locator('.p-select-option, .p-select-item').allTextContents();
    console.log('All dropdown options:', allOptions);

    const highlightOptions = allOptions.filter(o => o.toLowerCase().includes('highlight'));
    console.log('Criterion 1: Highlight fields in dropdown:', highlightOptions);

    // Look for "Highlight Manufacturer" or similar
    const highlightManufacturer = page.locator('.p-select-option, .p-select-item').filter({ hasText: /highlight.*manufacturer/i }).first();
    const hasHighlightManufacturer = await highlightManufacturer.count() > 0;
    console.log('Highlight Manufacturer option:', hasHighlightManufacturer ? 'FOUND' : 'NOT FOUND');

    if (!hasHighlightManufacturer) {
      // Check if there's any option with "Highlight" in it
      const anyHighlight = page.locator('.p-select-option, .p-select-item').filter({ hasText: /highlight/i }).first();
      const hasAnyHighlight = await anyHighlight.count() > 0;

      if (!hasAnyHighlight) {
        console.log('FINDING: No highlight options found in dropdown');
        console.log('User story expects "Highlight Manufacturer", "Highlight Models", etc.');

        // Close dropdown and check if highlights are elsewhere
        await page.keyboard.press('Escape');
        await page.waitForTimeout(300);
        return;
      }
    }

    // Try to add a highlight filter
    if (await highlightManufacturer.count() > 0) {
      await highlightManufacturer.click();
      await page.waitForTimeout(500);

      const dialog = page.locator('.p-dialog:visible').first();
      if (await dialog.isVisible()) {
        await page.screenshot({
          path: `${SCREENSHOT_DIR}/040-02-highlight-dialog.png`,
          fullPage: false
        });

        // Select an option
        const options = dialog.locator('.option-item');
        if (await options.count() > 0) {
          await options.first().locator('p-checkbox').click();
          await page.waitForTimeout(200);
          await dialog.locator('p-button').filter({ hasText: 'Apply' }).locator('button').click();
          await page.waitForTimeout(500);
        }
      }

      // Check for highlight chip in Active Highlights section
      const highlightSection = page.locator('.active-highlights');
      const highlightSectionVisible = await highlightSection.isVisible();
      console.log('Criterion 3: Active Highlights section:', highlightSectionVisible ? 'VISIBLE' : 'NOT VISIBLE');

      await page.screenshot({
        path: `${SCREENSHOT_DIR}/040-03-after-highlight.png`,
        fullPage: false
      });

      // Check chip styling
      const highlightChip = page.locator('.highlight-chip');
      const hasHighlightChip = await highlightChip.count() > 0;
      console.log('Criterion 4: Highlight chip with different styling:', hasHighlightChip ? 'FOUND' : 'NOT FOUND');
    }
  });

  test('US-QC-041: Distinguish Highlights from Filters', async ({ page }) => {
    // Navigate with both a filter and highlight pre-set via URL
    await page.goto('http://localhost:4205/automobiles/discover?bodyClass=Sedan&h_manufacturer=Toyota');
    await page.waitForLoadState('networkidle');
    await page.locator('.query-control-panel').waitFor({ state: 'visible', timeout: 30000 });

    console.log('\n=== US-QC-041 Criteria Check ===');

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/041-01-filters-and-highlights.png`,
      fullPage: false
    });

    // Check for separate sections
    const activeFiltersSection = page.locator('.active-filters');
    const activeHighlightsSection = page.locator('.active-highlights');

    const filtersVisible = await activeFiltersSection.isVisible();
    const highlightsVisible = await activeHighlightsSection.isVisible();

    console.log('Active Filters section:', filtersVisible ? 'VISIBLE' : 'NOT VISIBLE');
    console.log('Active Highlights section:', highlightsVisible ? 'VISIBLE' : 'NOT VISIBLE');
    console.log('Criterion 3: Separate sections:', filtersVisible && highlightsVisible ? 'YES' : 'PARTIAL');

    // Check styling differences
    const filterChip = page.locator('.filter-chip').first();
    const highlightChip = page.locator('.highlight-chip').first();

    if (await filterChip.count() > 0) {
      const filterBg = await filterChip.evaluate(el => getComputedStyle(el).backgroundColor);
      console.log('Filter chip background:', filterBg);
    }

    if (await highlightChip.count() > 0) {
      const highlightBg = await highlightChip.evaluate(el => getComputedStyle(el).backgroundColor);
      console.log('Highlight chip background:', highlightBg);
      console.log('Criterion 2: Yellow/amber styling:', highlightBg.includes('255') ? 'CHECKING' : 'UNKNOWN');
    }

    // Check URL parameters
    const url = page.url();
    console.log('URL:', url);
    console.log('Criterion 4: Regular filter param (bodyClass=):', url.includes('bodyClass='));
    console.log('Criterion 4: Highlight param (h_manufacturer=):', url.includes('h_manufacturer=') || url.includes('h_'));
  });

  test('US-QC-042: Clear All Highlights', async ({ page }) => {
    // Navigate with highlights pre-set
    await page.goto('http://localhost:4205/automobiles/discover?h_manufacturer=Toyota,Honda&h_bodyClass=Sedan');
    await page.waitForLoadState('networkidle');
    await page.locator('.query-control-panel').waitFor({ state: 'visible', timeout: 30000 });

    console.log('\n=== US-QC-042 Criteria Check ===');

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/042-01-with-highlights.png`,
      fullPage: false
    });

    // Look for "Clear All Highlights" link
    const clearAllHighlights = page.locator('.clear-highlights-link, a:has-text("Clear All Highlights")');
    const hasClearLink = await clearAllHighlights.count() > 0;
    console.log('Criterion 1: Clear All Highlights link:', hasClearLink ? 'FOUND' : 'NOT FOUND');

    if (hasClearLink) {
      const urlBefore = page.url();
      await clearAllHighlights.click();
      await page.waitForTimeout(500);

      await page.screenshot({
        path: `${SCREENSHOT_DIR}/042-02-after-clear.png`,
        fullPage: false
      });

      // Check highlights removed
      const highlightChips = page.locator('.highlight-chip');
      const chipCount = await highlightChips.count();
      console.log('Criterion 2: Highlight chips after clear:', chipCount);

      // Check URL
      const urlAfter = page.url();
      console.log('Criterion 3: URL h_* params removed:', !urlAfter.includes('h_'));
    }
  });

  test('US-QC-043: Edit Highlight Filter', async ({ page }) => {
    // Navigate with highlight pre-set
    await page.goto('http://localhost:4205/automobiles/discover?h_bodyClass=Sedan');
    await page.waitForLoadState('networkidle');
    await page.locator('.query-control-panel').waitFor({ state: 'visible', timeout: 30000 });

    console.log('\n=== US-QC-043 Criteria Check ===');

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/043-01-highlight-to-edit.png`,
      fullPage: false
    });

    // Click highlight chip to edit
    const highlightChip = page.locator('.highlight-chip').first();
    if (await highlightChip.count() > 0) {
      await highlightChip.locator('.p-chip-label, span').first().click();
      await page.waitForTimeout(500);

      const dialog = page.locator('.p-dialog:visible').first();
      const dialogOpened = await dialog.isVisible();
      console.log('Criterion 1: Clicking chip opens dialog:', dialogOpened);

      if (dialogOpened) {
        await page.screenshot({
          path: `${SCREENSHOT_DIR}/043-02-edit-dialog.png`,
          fullPage: false
        });

        // Check pre-selection
        const selectedCount = await dialog.locator('.p-checkbox-checked, .p-highlight').count();
        console.log('Criterion 2: Current selections pre-checked:', selectedCount > 0);

        await dialog.locator('p-button').filter({ hasText: 'Cancel' }).locator('button').click();
      }
    } else {
      console.log('FINDING: No highlight chip found to edit');
    }
  });

  test('US-QC-044: Remove Single Highlight', async ({ page }) => {
    // Navigate with highlight pre-set
    await page.goto('http://localhost:4205/automobiles/discover?h_bodyClass=Sedan&bodyClass=SUV');
    await page.waitForLoadState('networkidle');
    await page.locator('.query-control-panel').waitFor({ state: 'visible', timeout: 30000 });

    console.log('\n=== US-QC-044 Criteria Check ===');

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/044-01-before-remove.png`,
      fullPage: false
    });

    const highlightChip = page.locator('.highlight-chip').first();
    if (await highlightChip.count() > 0) {
      // Find remove button
      const removeButton = highlightChip.locator('.p-chip-remove-icon, .pi-times-circle, .pi-times');
      const hasRemove = await removeButton.count() > 0;
      console.log('Criterion 1: X button on highlight chip:', hasRemove ? 'FOUND' : 'NOT FOUND');

      if (hasRemove) {
        const urlBefore = page.url();
        await removeButton.click();
        await page.waitForTimeout(500);

        await page.screenshot({
          path: `${SCREENSHOT_DIR}/044-02-after-remove.png`,
          fullPage: false
        });

        // Check only highlight removed, filter preserved
        const filterChip = page.locator('.filter-chip');
        const filterCount = await filterChip.count();
        console.log('Criterion 3: Regular filter chips preserved:', filterCount);

        const urlAfter = page.url();
        console.log('URL after:', urlAfter);
        console.log('Filter preserved:', urlAfter.includes('bodyClass='));
        console.log('Highlight removed:', !urlAfter.includes('h_bodyClass='));
      }
    } else {
      console.log('FINDING: No highlight chip found to remove');
    }
  });
});
