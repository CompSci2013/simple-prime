const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  const baseUrl = 'http://192.168.0.244:4205';
  const screenshotDir = '/home/odin/projects/simple-prime/docs/screenshots';

  console.log('Navigating to discover3...');
  await page.goto(`${baseUrl}/automobiles/discover3`);

  // Wait for page to load and charts to render
  await page.waitForTimeout(3000);

  // Click the popout button for the dockview-statistics panel's manufacturer chart
  console.log('Opening popout for dockview manufacturer chart...');

  // Find the popout button in the dockview panel's first chart (manufacturer)
  // The popout button is in the Plotly modebar with the external-link icon
  const dockviewPanel = await page.locator('.dockview-statistics-container');

  // Click the popout icon in the chart toolbar (it's a camera/snapshot-like icon for popout)
  // Actually, let's click the Statistics panel popout button instead for a cleaner demo
  const statsPopoutButton = await page.locator('#popout-statistics-1');
  await statsPopoutButton.click();

  // Wait for popout window to open
  await page.waitForTimeout(2000);

  // Get the popup window
  const pages = context.pages();
  const popoutPage = pages.find(p => p.url().includes('popout'));

  if (popoutPage) {
    // Wait for popout content to load
    await popoutPage.waitForTimeout(2000);

    // Position and resize the popout window for a nice screenshot
    // We'll take a composite screenshot showing both windows

    // Take screenshot of the main page showing the placeholder
    console.log('Taking screenshot of main page with placeholder...');
    await page.screenshot({
      path: `${screenshotDir}/discover3-popout-main.png`
    });

    // Take screenshot of the popout window
    console.log('Taking screenshot of popout window...');
    await popoutPage.screenshot({
      path: `${screenshotDir}/discover3-popout-window.png`
    });

    console.log('Screenshots saved. Creating composite image...');
  } else {
    console.log('Popout window not found, taking main page screenshot only');
    await page.screenshot({
      path: `${screenshotDir}/discover3-popout-main.png`
    });
  }

  await browser.close();
  console.log('Done! Screenshots saved to:', screenshotDir);
})();
