/**
 * Debug test to inspect DOM classes for highlighted options
 */
import { test } from '@playwright/test';

test('Debug: inspect highlighted option classes', async ({ page }) => {
  await page.goto('http://localhost:4205/automobiles/discover');
  await page.waitForLoadState('networkidle');
  await page.locator('.query-control-panel').waitFor({ state: 'visible', timeout: 10000 });

  // Click dropdown to open
  const dropdown = page.locator('p-select').first();
  await dropdown.click();
  await page.waitForTimeout(300);

  // Type 'b' to filter
  const filterInput = page.locator('.p-select-filter-container input, .p-select-filter');
  await filterInput.fill('b');
  await page.waitForTimeout(200);

  // Press ArrowDown to highlight
  await page.keyboard.press('ArrowDown');
  await page.waitForTimeout(200);

  // Dump all classes on option elements
  const optionClasses = await page.evaluate(() => {
    const options = document.querySelectorAll('[class*="select-option"], [class*="select-item"], [class*="listbox"]');
    const result: string[] = [];
    options.forEach(el => {
      result.push(`${el.tagName}: ${el.className}`);
    });

    // Also check for any element with 'highlight' or 'focus' in class
    const highlighted = document.querySelectorAll('[class*="highlight"], [class*="focus"], [class*="focused"]');
    highlighted.forEach(el => {
      result.push(`HIGHLIGHTED: ${el.tagName}: ${el.className}`);
    });

    // Check the actual p-select structure
    const selectOverlay = document.querySelector('.p-select-overlay');
    if (selectOverlay) {
      result.push(`OVERLAY HTML (first 2000 chars): ${selectOverlay.innerHTML.substring(0, 2000)}`);
    }

    return result;
  });

  console.log('=== DOM Classes Debug ===');
  optionClasses.forEach(c => console.log(c));
});
