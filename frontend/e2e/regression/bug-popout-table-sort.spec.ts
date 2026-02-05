import { test, expect, Page } from '@playwright/test';
import { TestLogger, createTestLogger } from '../test-logger';

/**
 * Bug: Pop-out Results Table Sorting
 *
 * When sorting a column in the popped-out results table:
 * - URL params change (correctly?)
 * - But table rows do NOT sort
 *
 * Root cause: DynamicResultsTableComponent emits urlParamsChange event in pop-out mode,
 * but panel-popout.component.html doesn't bind to this output, so the event is lost.
 *
 * Fix: Add (urlParamsChange)="onUrlParamsChange($event)" binding in panel-popout.component.html
 *
 * URL-First Architecture Verification:
 * - Pop-out does NOT directly update its own state
 * - Pop-out sends URL_PARAMS_CHANGED message to main window
 * - Main window is the URL owner - it updates URL (source of truth)
 * - URL change triggers API fetch in main window
 * - New state is broadcast back to all pop-outs via STATE_UPDATE
 */

test.describe('Bug: Pop-out Results Table Sorting', () => {
  let mainLogger: TestLogger;
  let popoutLogger: TestLogger;

  // Increase timeout for this test due to multiple windows and network traffic
  test.setTimeout(60000);

  test('Sorting in pop-out table should update rows via URL-First flow', async ({ page, context }) => {
    // Initialize logger for main page
    mainLogger = await createTestLogger(page);

    // Step 1: Navigate to Automobile discover page (has results table with pop-out)
    console.log('\n[TEST] Step 1: Navigate to /automobiles/discover');
    await page.goto('/automobiles/discover');
    await page.waitForLoadState('domcontentloaded');

    // Wait for panels container
    await page.waitForSelector('.panels-container', { timeout: 15000 });
    console.log('[TEST] Panels container visible');

    // Wait for initial data to load
    await page.waitForSelector('.p-datatable-tbody tr', { timeout: 15000 });
    console.log('[TEST] Table rows visible in main window');

    // Step 2: Get initial table data (first few rows)
    // Note: The table has an expand toggle in the first column, so we need to get the Manufacturer column (second td)
    const getManufacturerColumnValues = async (targetPage: Page): Promise<string[]> => {
      // Wait a moment for data to render
      await targetPage.waitForTimeout(500);

      // Debug: Log DOM structure
      const debugInfo = await targetPage.evaluate(() => {
        const tbody = document.querySelector('.p-datatable-tbody');
        const rows = tbody?.querySelectorAll('tr');
        return {
          tbodyExists: !!tbody,
          rowCount: rows?.length || 0,
          firstRowHtml: rows?.[0]?.innerHTML?.substring(0, 200) || 'no row'
        };
      });
      console.log('[TEST DEBUG] DOM structure:', debugInfo);

      return await targetPage.evaluate(() => {
        const rows = document.querySelectorAll('.p-datatable-tbody tr');
        const values: string[] = [];
        for (let i = 0; i < Math.min(rows.length, 5); i++) {
          const row = rows[i];
          const cells = row.querySelectorAll('td');
          // Second cell (index 1) is Manufacturer column (first is expand toggle)
          if (cells.length >= 2) {
            const text = cells[1].textContent?.trim() || '';
            values.push(text);
          }
        }
        return values;
      });
    };
    const getFirstColumnValues = getManufacturerColumnValues;

    const initialValues = await getFirstColumnValues(page);
    console.log('[TEST] Initial first column values:', initialValues);

    // Step 3: Open Results Table pop-out FIRST (before sorting)
    console.log('\n[TEST] Step 3: Opening Results Table pop-out window');

    // Find the pop-out button for results-table panel
    const popoutButton = page.locator('#popout-results-table');
    const [popoutPage] = await Promise.all([
      context.waitForEvent('page'),
      popoutButton.click()
    ]);

    await popoutPage.waitForLoadState('domcontentloaded');
    popoutLogger = await createTestLogger(popoutPage);
    await popoutPage.waitForTimeout(2000);

    console.log(`[TEST] Pop-out window opened: ${popoutPage.url()}`);

    // Wait for table in pop-out
    await popoutPage.waitForSelector('.p-datatable-tbody tr', { timeout: 15000 });
    console.log('[TEST] Table visible in pop-out window');

    // Step 4: Get initial values in pop-out
    const popoutInitialValues = await getFirstColumnValues(popoutPage);
    console.log('[TEST] Pop-out initial values:', popoutInitialValues);

    // Step 5: Click sort header in pop-out (Manufacturer column)
    console.log('\n[TEST] Step 5: Clicking Manufacturer sort header in pop-out');
    const popoutHeader = popoutPage.locator('.p-datatable-thead th').filter({ hasText: 'Manufacturer' });
    await popoutHeader.click();

    // Wait for the full URL-First sync cycle:
    // 1. urlParamsChange event emitted by table
    // 2. panel-popout receives event, sends URL_PARAMS_CHANGED via BroadcastChannel
    // 3. Main window receives message, updates URL (source of truth)
    // 4. URL change triggers API fetch in main window
    // 5. New state broadcast back via STATE_UPDATE
    await popoutPage.waitForTimeout(4000);

    // Step 6: Check console logs for URL-First communication
    const popoutLogs = popoutLogger.getConsoleLogs();
    const urlParamsChangeLogs = popoutLogs.filter(log =>
      log.text.includes('urlParamsChange') ||
      log.text.includes('URL_PARAMS_CHANGED') ||
      log.text.includes('onUrlParamsChange')
    );
    console.log(`[TEST] urlParamsChange related logs: ${urlParamsChangeLogs.length}`);
    urlParamsChangeLogs.forEach(log => console.log(`  - ${log.text}`));

    // Step 7: Check if values actually changed in pop-out
    const popoutSortedValues = await getFirstColumnValues(popoutPage);
    console.log('[TEST] Pop-out after sort click:', popoutSortedValues);

    const popoutSortWorked = JSON.stringify(popoutInitialValues) !== JSON.stringify(popoutSortedValues);
    console.log(`[TEST] Pop-out sort worked: ${popoutSortWorked}`);

    // Step 8: Verify URL was updated in main window (URL-First proof)
    const mainUrl = page.url();
    console.log(`[TEST] Main window URL after sort: ${mainUrl}`);
    const urlHasSortParam = mainUrl.includes('sort=') || mainUrl.includes('sortBy=');
    console.log(`[TEST] Main window URL has sort param: ${urlHasSortParam}`);

    // Step 9: Take screenshots for documentation
    await page.screenshot({ path: 'e2e/screenshots/bug-popout-sort-main.png' });
    await popoutPage.screenshot({ path: 'e2e/screenshots/bug-popout-sort-popout.png' });
    console.log('[TEST] Screenshots saved');

    // Print summaries
    console.log('\n[TEST] === MAIN WINDOW LOGS ===');
    mainLogger.printSummary();

    console.log('\n[TEST] === POP-OUT WINDOW LOGS ===');
    popoutLogger.printSummary();

    // Verify URL-First architecture is working
    console.log(`\n[TEST] URL-FIRST VERIFICATION:`);
    console.log(`  - Main URL updated with sort params: ${urlHasSortParam}`);
    console.log(`  - Pop-out data changed: ${popoutSortWorked}`);

    if (popoutSortWorked && urlHasSortParam) {
      console.log('[TEST] SUCCESS: URL-First architecture working correctly');
    } else {
      console.log('[TEST] FAILURE: URL-First flow not working as expected');
    }

    // Assert that sorting works via URL-First flow
    expect(popoutSortWorked).toBe(true);

    // Cleanup
    await popoutPage.close();
  });
});
