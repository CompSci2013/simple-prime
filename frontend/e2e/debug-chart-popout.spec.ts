import { test, expect } from '@playwright/test';

test.describe('Chart Popout', () => {
  test.setTimeout(60000);

  test('Chart popout should display data', async ({ page, context }) => {
    console.log('\n=== TEST: Chart popout with data ===');

    // Navigate to discover page
    await page.goto('/automobiles/discover');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    await page.screenshot({ path: 'test-results/chart-01-main.png', fullPage: true });

    // Open chart popout (year chart)
    console.log('Opening chart-year popout...');
    const chartPopoutBtn = page.locator('#popout-chart-year');

    const [chartPopup] = await Promise.all([
      context.waitForEvent('page'),
      chartPopoutBtn.click()
    ]);

    await chartPopup.waitForLoadState('networkidle');
    await chartPopup.waitForTimeout(2000);

    console.log('Chart popup URL:', chartPopup.url());
    await chartPopup.screenshot({ path: 'test-results/chart-02-popout.png', fullPage: true });

    // Check for chart component
    const chartComponent = chartPopup.locator('app-base-chart');
    const chartCount = await chartComponent.count();
    console.log(`Chart components in popout: ${chartCount}`);

    // Check for canvas (Plotly renders to canvas)
    const canvas = chartPopup.locator('canvas');
    const canvasCount = await canvas.count();
    console.log(`Canvas elements in popout: ${canvasCount}`);

    // Check for "No data available" message
    const noDataMsg = chartPopup.locator('text=No data available');
    const hasNoData = await noDataMsg.count() > 0;
    console.log(`Has "No data available" message: ${hasNoData}`);

    // Check for error messages
    const errorToast = chartPopup.locator('.p-toast-message-error');
    const hasError = await errorToast.count() > 0;
    console.log(`Has error toast: ${hasError}`);

    // Check console for errors
    const errors: string[] = [];
    chartPopup.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    await chartPopup.waitForTimeout(500);

    if (errors.length > 0) {
      console.log('Console errors:', errors);
    }

    await chartPopup.close();

    // Assertions
    expect(chartCount).toBe(1);
    expect(hasNoData).toBe(false);

    console.log('\n=== Test complete ===');
  });
});
