/**
 * User Story Validation: US-QP-060 through US-QP-062
 * Epic 7: URL State Synchronization
 *
 * Tests URL updates, restoration, and browser navigation
 */
import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const SCREENSHOT_DIR = 'test-results/validation/query-panel/epic-7';

test.describe('Query Panel - Epic 7: URL State Synchronization', () => {
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

  test('US-QP-060: Filter Changes Update URL', async ({ page }) => {
    // beforeEach already navigated and cleared localStorage
    const queryPanel = page.locator('.query-panel-container');
    await queryPanel.waitFor({ state: 'visible', timeout: 30000 });

    console.log('\n=== US-QP-060 Criteria Check ===');
    console.log('Initial URL:', page.url());

    // Apply year filter
    const yearMinField = queryPanel.locator('.filter-field').filter({ hasText: /^Year Range$/ });
    const yearMinInput = yearMinField.locator('input').first();
    await yearMinInput.fill('2000');
    await page.waitForTimeout(500);

    // Screenshot after year filter
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/060-01-after-year-filter.png`,
      fullPage: false
    });

    let url = page.url();
    console.log('After yearMin=2000:', url);
    console.log('Criterion 1: URL updated immediately:', url.includes('yearMin=2000') ? 'PASS' : 'FAIL');

    // Apply body class filter
    const bodyClassField = queryPanel.locator('.filter-field').filter({ hasText: 'Body Class' });
    const multiSelect = bodyClassField.locator('p-multiselect');
    await multiSelect.click();
    await page.waitForTimeout(300);

    const sedanOption = page.locator('.p-multiselect-item').filter({ hasText: 'Sedan' });
    if (await sedanOption.count() > 0) {
      await sedanOption.click();
      await page.waitForTimeout(200);
    }

    // Close multiselect
    await page.locator('body').click({ position: { x: 10, y: 10 } });
    await page.waitForTimeout(500);

    // Screenshot after body class
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/060-02-after-body-class.png`,
      fullPage: false
    });

    url = page.url();
    console.log('After bodyClass=Sedan:', url);
    console.log('Criterion 2: URL contains bodyClass:', url.includes('bodyClass=') ? 'PASS' : 'FAIL');
    console.log('Criterion 3: Page resets to 1:', url.includes('page=1') ? 'PASS' : 'FAIL');

    // Verify parameter names match expected
    const expectedParams = ['yearMin', 'bodyClass', 'page'];
    for (const param of expectedParams) {
      console.log(`  Parameter "${param}":`, url.includes(`${param}=`) ? 'FOUND' : 'NOT FOUND');
    }
  });

  test('US-QP-061: Restore Filters from URL', async ({ page }) => {
    // Navigate directly to URL with filters - need to clear localStorage after navigating
    const testUrl = 'http://localhost:4205/automobiles/discover?manufacturer=Ford&yearMin=1990&yearMax=2010&bodyClass=Sedan,SUV';
    await page.goto(testUrl);
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForLoadState('networkidle');

    const queryPanel = page.locator('.query-panel-container');
    await queryPanel.waitFor({ state: 'visible', timeout: 30000 });

    // Screenshot showing restored state
    await queryPanel.screenshot({
      path: `${SCREENSHOT_DIR}/061-01-restored-state.png`
    });

    console.log('\n=== US-QP-061 Criteria Check ===');
    console.log('Test URL:', testUrl);

    // Check manufacturer input
    const manufacturerField = queryPanel.locator('.filter-field').filter({ hasText: 'Manufacturer' });
    const manufacturerInput = manufacturerField.locator('input').first();
    const manufacturerValue = await manufacturerInput.inputValue();
    console.log('Criterion 1: Manufacturer restored:', manufacturerValue === 'Ford' ? 'PASS' : `FAIL (got "${manufacturerValue}")`);

    // Check year min input
    const yearMinField = queryPanel.locator('.filter-field').filter({ hasText: /^Year Range$/ });
    const yearMinInput = yearMinField.locator('input').first();
    const yearMinValue = await yearMinInput.inputValue();
    console.log('Criterion 2: Year min restored:', yearMinValue === '1990' ? 'PASS' : `FAIL (got "${yearMinValue}")`);

    // Check year max input
    const yearMaxField = queryPanel.locator('.filter-field').filter({ hasText: 'Year Range Max' });
    const yearMaxInput = yearMaxField.locator('input').first();
    const yearMaxValue = await yearMaxInput.inputValue();
    console.log('Criterion 3: Year max restored:', yearMaxValue === '2010' ? 'PASS' : `FAIL (got "${yearMaxValue}")`);

    // Check body class multiselect
    const bodyClassField = queryPanel.locator('.filter-field').filter({ hasText: 'Body Class' });
    const multiSelectLabel = await bodyClassField.locator('.p-multiselect-label').textContent();
    console.log('Criterion 4: Body class restored:', multiSelectLabel);
    console.log('  Expected to contain Sedan and SUV');

    // Take full page screenshot to verify results are filtered
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/061-02-full-page.png`,
      fullPage: true
    });
  });

  test('US-QP-062: Browser Back/Forward Navigation', async ({ page }) => {
    // beforeEach already navigated and cleared localStorage
    const queryPanel = page.locator('.query-panel-container');
    await queryPanel.waitFor({ state: 'visible', timeout: 30000 });

    console.log('\n=== US-QP-062 Criteria Check ===');

    // Step 1: Add first filter
    const yearMinField = queryPanel.locator('.filter-field').filter({ hasText: /^Year Range$/ });
    const yearMinInput = yearMinField.locator('input').first();
    await yearMinInput.fill('1990');
    await page.waitForTimeout(500);

    const url1 = page.url();
    console.log('Step 1 - After yearMin=1990:', url1);

    // Screenshot state 1
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/062-01-state-1.png`,
      fullPage: false
    });

    // Step 2: Add second filter
    const yearMaxField = queryPanel.locator('.filter-field').filter({ hasText: 'Year Range Max' });
    const yearMaxInput = yearMaxField.locator('input').first();
    await yearMaxInput.fill('2000');
    await page.waitForTimeout(500);

    const url2 = page.url();
    console.log('Step 2 - After yearMax=2000:', url2);

    // Screenshot state 2
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/062-02-state-2.png`,
      fullPage: false
    });

    console.log('Criterion 1: Filter changes create history entries');

    // Step 3: Go back
    await page.goBack();
    await page.waitForTimeout(500);

    const urlAfterBack = page.url();
    console.log('After back:', urlAfterBack);
    console.log('Criterion 2: Back removes yearMax:', !urlAfterBack.includes('yearMax=') ? 'PASS' : 'FAIL');

    // Screenshot after back
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/062-03-after-back.png`,
      fullPage: false
    });

    // Check input updated
    const yearMaxValueAfterBack = await yearMaxInput.inputValue();
    console.log('Criterion 3: Year max input cleared:', yearMaxValueAfterBack === '' ? 'PASS' : `FAIL (got "${yearMaxValueAfterBack}")`);

    // Step 4: Go forward
    await page.goForward();
    await page.waitForTimeout(500);

    const urlAfterForward = page.url();
    console.log('After forward:', urlAfterForward);
    console.log('Criterion 4: Forward restores yearMax:', urlAfterForward.includes('yearMax=2000') ? 'PASS' : 'FAIL');

    // Screenshot after forward
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/062-04-after-forward.png`,
      fullPage: false
    });

    // Check input restored
    const yearMaxValueAfterForward = await yearMaxInput.inputValue();
    console.log('Criterion 5: Year max input restored:', yearMaxValueAfterForward === '2000' ? 'PASS' : `FAIL (got "${yearMaxValueAfterForward}")`);
  });
});
