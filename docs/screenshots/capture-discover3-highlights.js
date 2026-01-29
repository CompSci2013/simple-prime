const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1200, height: 3000 } // Tall viewport for vertical orientation
  });
  const page = await context.newPage();

  const baseUrl = 'http://192.168.0.244:4205';
  const screenshotDir = '/home/odin/projects/simple-prime/docs/screenshots';

  // URL with highlight params
  const highlightParams = '?h_yearMin=1969&h_yearMax=1991';

  console.log('Navigating to discover3 with highlights...');
  await page.goto(`${baseUrl}/automobiles/discover3${highlightParams}`);

  // Wait for page to load and charts to render with highlights
  await page.waitForTimeout(4000);

  // Screenshot 1: Picker collapsed (default state) with highlights
  console.log('Taking screenshot 1: picker collapsed with highlights...');
  await page.screenshot({
    path: `${screenshotDir}/discover3-highlights-picker-collapsed.png`,
    fullPage: true
  });
  console.log('Screenshot 1 saved.');

  // Screenshot 2: Expand the picker panel and wait for data
  console.log('Expanding picker panel...');

  // Find and click the expand button for manufacturer-model-picker panel
  const expandButton = await page.locator('#panel-manufacturer-model-picker .panel-header button.p-button-text').first();
  await expandButton.click();

  // Wait for picker to expand and load data
  await page.waitForTimeout(2000);

  // Change rows per page to 10 (click the dropdown and select 10)
  console.log('Setting rows per page to 10...');
  const rowsDropdown = await page.locator('.p-paginator-rpp-options').first();
  await rowsDropdown.click();
  await page.waitForTimeout(500);

  // Select the "10" option from the dropdown (use exact match to avoid matching "100")
  await page.getByRole('option', { name: '10', exact: true }).click();
  await page.waitForTimeout(1000);

  // Take screenshot with picker expanded showing 10 rows
  console.log('Taking screenshot 2: picker expanded with highlights...');
  await page.screenshot({
    path: `${screenshotDir}/discover3-highlights-picker-expanded.png`,
    fullPage: true
  });
  console.log('Screenshot 2 saved.');

  await browser.close();
  console.log('Done! Screenshots saved to:', screenshotDir);
})();
