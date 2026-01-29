const { chromium } = require('playwright');
const sharp = require('sharp');

(async () => {
  const browser = await chromium.launch({ headless: true });

  const baseUrl = 'http://192.168.0.244:4205';
  const screenshotDir = '/home/odin/projects/simple-prime/docs/screenshots';

  // Create context that allows popups
  const context = await browser.newContext({
    viewport: { width: 1400, height: 950 }
  });

  // Listen for new pages (popouts)
  let popoutPage = null;
  context.on('page', async (page) => {
    console.log('New page opened:', page.url());
    popoutPage = page;
  });

  const mainPage = await context.newPage();

  console.log('Loading main page...');
  await mainPage.goto(`${baseUrl}/automobiles/discover3`);
  await mainPage.waitForTimeout(3500);

  // The dockview charts have a popout button in their Plotly modebar
  // We need to hover over the chart first to reveal the modebar
  console.log('Hovering over dockview chart to reveal modebar...');

  // First, find the dockview panel content area
  const dockviewContent = mainPage.locator('.dockview-chart-content').first();
  await dockviewContent.hover();
  await mainPage.waitForTimeout(800);

  // Now click the popout button in the modebar
  // The button has data-title="Pop out to separate window"
  console.log('Clicking popout button...');
  const popoutButton = mainPage.locator('.dockview-statistics-container .modebar-btn[data-title="Pop out to separate window"]').first();
  await popoutButton.click({ timeout: 5000 });

  // Wait for popout to open
  await mainPage.waitForTimeout(2500);

  if (popoutPage) {
    // Set popout viewport to a nice size
    await popoutPage.setViewportSize({ width: 950, height: 500 });
    await popoutPage.waitForTimeout(2000);

    // Take main page screenshot (should now show placeholder in dockview panel)
    console.log('Taking main page screenshot with dockview placeholder...');
    await mainPage.screenshot({
      path: `${screenshotDir}/discover3-dockview-popout-main.png`
    });

    // Take popout screenshot
    console.log('Taking popout window screenshot...');
    await popoutPage.screenshot({
      path: `${screenshotDir}/discover3-dockview-popout-window.png`
    });

    // Create attractive composite
    console.log('Creating composite image...');

    // Resize popout to fit nicely
    const popoutResized = await sharp(`${screenshotDir}/discover3-dockview-popout-window.png`)
      .resize(850, 450)
      .png()
      .toBuffer();

    // Create a shadow/border effect
    const shadowWidth = 850 + 6;
    const shadowHeight = 450 + 6;
    const shadow = await sharp({
      create: {
        width: shadowWidth,
        height: shadowHeight,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 255 }
      }
    })
      .png()
      .toBuffer();

    // Position: overlap right side, positioned to show both the dockview placeholder and the popout
    const popoutX = 480;
    const popoutY = 380;

    await sharp(`${screenshotDir}/discover3-dockview-popout-main.png`)
      .composite([
        {
          // Shadow/border first (offset by 3px)
          input: shadow,
          top: popoutY + 3,
          left: popoutX + 3,
          blend: 'over'
        },
        {
          // Popout window on top
          input: popoutResized,
          top: popoutY,
          left: popoutX,
          blend: 'over'
        }
      ])
      .toFile(`${screenshotDir}/discover3-dockview-popout-composite.png`);

    console.log('Composite created successfully!');
  } else {
    console.log('ERROR: Popout window did not open');
  }

  await browser.close();
  console.log('Done! Files saved to:', screenshotDir);
})();
