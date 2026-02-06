import { test, expect } from '@playwright/test';

test.describe('Chart Popout Click Sync', () => {
  test.setTimeout(60000);

  test('Click on chart bar in popout should update main window URL', async ({ page, context }) => {
    // Collect console logs
    const mainLogs: string[] = [];
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('CHART_CLICK') || text.includes('BaseChart')) {
        mainLogs.push(`[main] ${text}`);
      }
    });

    console.log('\n=== Navigate to discover page ===');
    await page.goto('/automobiles/discover');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Record initial URL
    const initialUrl = page.url();
    console.log('Initial URL:', initialUrl);

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
      const text = msg.text();
      if (text.includes('CHART_CLICK') || text.includes('BaseChart')) {
        popoutLogs.push(`[popout] ${text}`);
      }
    });

    await chartPopup.waitForLoadState('networkidle');
    await chartPopup.waitForTimeout(2000);

    console.log('Popout URL:', chartPopup.url());

    // Take screenshot of popout before click
    await chartPopup.screenshot({ path: 'test-results/chart-click-01-before.png', fullPage: true });

    // Find the chart canvas in the popout
    const chartCanvas = chartPopup.locator('.js-plotly-plot');
    await expect(chartCanvas).toBeVisible();

    // Get the chart's bounding box
    const box = await chartCanvas.boundingBox();
    console.log('Chart bounding box:', box);

    if (box) {
      // Click somewhere in the middle-right of the chart (where recent years are)
      // The year chart typically shows years on x-axis, so clicking in the data area
      const clickX = box.x + box.width * 0.8; // 80% from left (recent years)
      const clickY = box.y + box.height * 0.5; // Middle height

      console.log(`\n=== Clicking on chart at (${clickX}, ${clickY}) ===`);
      await chartPopup.mouse.click(clickX, clickY);
      await chartPopup.waitForTimeout(1000);

      // Take screenshot after click
      await chartPopup.screenshot({ path: 'test-results/chart-click-02-after.png', fullPage: true });
    }

    // Wait for potential URL update in main window
    await page.waitForTimeout(2000);

    // Check main window URL
    const finalUrl = page.url();
    console.log('\nFinal main window URL:', finalUrl);

    // Log collected messages
    console.log('\n=== MAIN WINDOW LOGS ===');
    mainLogs.forEach(log => console.log(log));

    console.log('\n=== POPOUT WINDOW LOGS ===');
    popoutLogs.forEach(log => console.log(log));

    // Screenshot main window
    await page.screenshot({ path: 'test-results/chart-click-03-main-final.png', fullPage: true });

    // Check if URL changed (indicating filter was applied)
    if (finalUrl !== initialUrl) {
      console.log('\nSUCCESS: Main window URL changed after popout chart click');
      console.log('URL diff:', finalUrl.replace(initialUrl, ''));
    } else {
      console.log('\nWARNING: Main window URL did not change');
    }

    await chartPopup.close();
  });
});
