import { test, expect } from '@playwright/test';

test.describe('Chart Popout Debug', () => {
  test.setTimeout(60000);

  test('Debug chart popout messages', async ({ page, context }) => {
    // Collect console logs from main window
    const mainLogs: string[] = [];
    page.on('console', msg => {
      mainLogs.push(`[main][${msg.type()}] ${msg.text()}`);
    });

    console.log('\n=== Navigate to discover page ===');
    await page.goto('/automobiles/discover');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Open chart popout
    console.log('\n=== Opening chart-year popout ===');
    const chartPopoutBtn = page.locator('#popout-chart-year');

    const [chartPopup] = await Promise.all([
      context.waitForEvent('page'),
      chartPopoutBtn.click()
    ]);

    // Collect console logs from popout
    const popoutLogs: string[] = [];
    chartPopup.on('console', msg => {
      popoutLogs.push(`[popout][${msg.type()}] ${msg.text()}`);
    });

    await chartPopup.waitForLoadState('networkidle');
    await chartPopup.waitForTimeout(3000);

    console.log('\n=== MAIN WINDOW LOGS ===');
    mainLogs.forEach(log => console.log(log));

    console.log('\n=== POPOUT WINDOW LOGS ===');
    popoutLogs.forEach(log => console.log(log));

    // Check what the popout shows
    const noDataMsg = chartPopup.locator('text=No data available');
    const hasNoData = await noDataMsg.count() > 0;
    console.log(`\nHas "No data available": ${hasNoData}`);

    await chartPopup.screenshot({ path: 'test-results/chart-debug.png', fullPage: true });

    await chartPopup.close();
  });
});
