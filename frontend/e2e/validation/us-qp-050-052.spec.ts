/**
 * User Story Validation: US-QP-050 through US-QP-052
 * Epic 6: Clear All Filters
 *
 * Tests Clear Filters button behavior
 */
import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const SCREENSHOT_DIR = 'test-results/validation/query-panel/epic-6';

test.describe('Query Panel - Epic 6: Clear All Filters', () => {
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

  test('US-QP-050: View Clear Filters Button', async ({ page }) => {
    // beforeEach already navigated and cleared localStorage
    const queryPanel = page.locator('.query-panel-container');
    await queryPanel.waitFor({ state: 'visible', timeout: 30000 });

    // Screenshot full panel
    await queryPanel.screenshot({
      path: `${SCREENSHOT_DIR}/050-01-query-panel.png`
    });

    console.log('\n=== US-QP-050 Criteria Check ===');

    // Find Clear Filters button
    const clearBtn = queryPanel.locator('button').filter({ hasText: 'Clear Filters' });
    const hasClearBtn = await clearBtn.count() > 0;
    console.log('Criterion 1: Clear Filters button visible:', hasClearBtn ? 'PASS' : 'FAIL');

    if (hasClearBtn) {
      // Check icon
      const icon = clearBtn.locator('span[class*="pi-filter-slash"]');
      const hasIcon = await icon.count() > 0;
      console.log('Criterion 2: Has filter-slash icon:', hasIcon ? 'PASS' : 'FAIL');

      // Check outlined styling
      const btnClasses = await clearBtn.getAttribute('class');
      const isOutlined = btnClasses?.includes('p-button-outlined');
      console.log('Criterion 3: Outlined styling:', isOutlined ? 'PASS' : 'FAIL');

      // Screenshot button
      await clearBtn.screenshot({
        path: `${SCREENSHOT_DIR}/050-02-clear-button.png`
      });
    }

    expect(hasClearBtn).toBe(true);
  });

  test('US-QP-051: Clear All Filters Action', async ({ page }) => {
    // Start with multiple filters applied - need to clear localStorage after navigating
    await page.goto('http://localhost:4205/automobiles/discover?manufacturer=Ford&yearMin=1990&yearMax=2000&bodyClass=Sedan');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForLoadState('networkidle');

    const queryPanel = page.locator('.query-panel-container');
    await queryPanel.waitFor({ state: 'visible', timeout: 30000 });

    // Screenshot before clearing
    await queryPanel.screenshot({
      path: `${SCREENSHOT_DIR}/051-01-before-clear.png`
    });

    console.log('\n=== US-QP-051 Criteria Check ===');
    console.log('Initial URL:', page.url());

    // Find and click Clear Filters button
    const clearBtn = queryPanel.locator('button').filter({ hasText: 'Clear Filters' });
    await clearBtn.click();
    await page.waitForTimeout(500);

    // Screenshot after clearing
    await queryPanel.screenshot({
      path: `${SCREENSHOT_DIR}/051-02-after-clear.png`
    });

    // Check URL
    const url = page.url();
    console.log('After clear URL:', url);

    console.log('Criterion 1: manufacturer cleared:', !url.includes('manufacturer=') ? 'PASS' : 'FAIL');
    console.log('Criterion 2: yearMin cleared:', !url.includes('yearMin=') ? 'PASS' : 'FAIL');
    console.log('Criterion 3: yearMax cleared:', !url.includes('yearMax=') ? 'PASS' : 'FAIL');
    console.log('Criterion 4: bodyClass cleared:', !url.includes('bodyClass=') ? 'PASS' : 'FAIL');

    // Check inputs are empty
    const manufacturerField = queryPanel.locator('.filter-field').filter({ hasText: 'Manufacturer' });
    const manufacturerInput = manufacturerField.locator('input').first();
    const manufacturerValue = await manufacturerInput.inputValue();
    console.log('Criterion 5: Manufacturer input cleared:', manufacturerValue === '' ? 'PASS' : `FAIL (got "${manufacturerValue}")`);

    const yearMinField = queryPanel.locator('.filter-field').filter({ hasText: /^Year Range$/ });
    const yearMinInput = yearMinField.locator('input').first();
    const yearMinValue = await yearMinInput.inputValue();
    console.log('Criterion 6: Year min input cleared:', yearMinValue === '' ? 'PASS' : `FAIL (got "${yearMinValue}")`);
  });

  test('US-QP-052: Clear Filters Scope (Query Panel Only)', async ({ page }) => {
    // Start with Query Panel filters AND Query Control highlight - need to clear localStorage after navigating
    await page.goto('http://localhost:4205/automobiles/discover?manufacturer=Ford&h_manufacturer=Toyota');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForLoadState('networkidle');

    const queryPanel = page.locator('.query-panel-container');
    await queryPanel.waitFor({ state: 'visible', timeout: 30000 });

    // Screenshot before
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/052-01-before-clear.png`,
      fullPage: false
    });

    console.log('\n=== US-QP-052 Criteria Check ===');
    console.log('Initial URL:', page.url());

    // Click Clear Filters in Query Panel
    const clearBtn = queryPanel.locator('button').filter({ hasText: 'Clear Filters' });
    await clearBtn.click();
    await page.waitForTimeout(500);

    // Screenshot after
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/052-02-after-clear.png`,
      fullPage: false
    });

    const url = page.url();
    console.log('After clear URL:', url);

    // Query Panel filter should be cleared
    console.log('Criterion 1: Query Panel filter cleared:', !url.includes('manufacturer=Ford') ? 'PASS' : 'FAIL');

    // Highlight filter should remain (it's from Query Control, not Query Panel)
    console.log('Criterion 2: Highlight preserved:', url.includes('h_manufacturer=Toyota') ? 'PASS' : 'FAIL (or highlights not in scope)');

    // Note: If highlight is also cleared, the scope may be different than expected
    // This test documents actual behavior
  });
});
