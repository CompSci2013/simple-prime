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

  // Click the popout button for statistics-1 panel
  console.log('Clicking popout button...');
  const popoutButton = mainPage.locator('#popout-statistics-1');
  await popoutButton.click();

  // Wait for popout to open
  await mainPage.waitForTimeout(2500);

  if (popoutPage) {
    // Set popout viewport to a nice size
    await popoutPage.setViewportSize({ width: 1050, height: 550 });
    await popoutPage.waitForTimeout(2000);

    // Take main page screenshot (should now show placeholder)
    console.log('Taking main page screenshot with placeholder...');
    await mainPage.screenshot({
      path: `${screenshotDir}/discover3-popout-main.png`
    });

    // Take popout screenshot
    console.log('Taking popout window screenshot...');
    await popoutPage.screenshot({
      path: `${screenshotDir}/discover3-popout-window.png`
    });

    // Create attractive composite
    console.log('Creating composite image...');

    // Get main image dimensions
    const mainMeta = await sharp(`${screenshotDir}/discover3-popout-main.png`).metadata();

    // Resize popout to fit nicely
    const popoutResized = await sharp(`${screenshotDir}/discover3-popout-window.png`)
      .resize(900, 470)
      .png()
      .toBuffer();

    // Create a shadow/border effect by making a slightly larger dark rectangle
    const shadowWidth = 900 + 6;
    const shadowHeight = 470 + 6;
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

    // Position: overlap right side, below the placeholder area
    // Main window: 1400x950
    // Popout position: starts at x=450 (overlaps right portion), y=320 (below placeholder, shows dockview)
    const popoutX = 450;
    const popoutY = 350;

    await sharp(`${screenshotDir}/discover3-popout-main.png`)
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
      .toFile(`${screenshotDir}/discover3-popout-composite.png`);

    console.log('Composite created successfully!');
  } else {
    console.log('ERROR: Popout window did not open');
  }

  await browser.close();
  console.log('Done! Files saved to:', screenshotDir);
})();
