const { chromium } = require('playwright');

(async () => {
  // Launch browser with a large viewport to show both "windows"
  const browser = await chromium.launch();

  const baseUrl = 'http://192.168.0.244:4205';
  const screenshotDir = '/home/odin/projects/simple-prime/docs/screenshots';

  // Create main page context - left side
  const mainContext = await browser.newContext({
    viewport: { width: 1400, height: 900 }
  });
  const mainPage = await mainContext.newPage();

  // Create popout page context - right side (smaller, overlapping)
  const popoutContext = await browser.newContext({
    viewport: { width: 900, height: 700 }
  });
  const popoutPage = await popoutContext.newPage();

  console.log('Loading main page...');
  await mainPage.goto(`${baseUrl}/automobiles/discover3`);
  await mainPage.waitForTimeout(3000);

  console.log('Loading popout page directly...');
  // Load the statistics panel popout directly
  await popoutPage.goto(`${baseUrl}/panel/discover3/statistics-1/statistics-2?popout=statistics-1`);
  await popoutPage.waitForTimeout(3000);

  // Take screenshot of main page (will show placeholder since we're simulating)
  // First, let's mark the statistics panel as "popped out" by adding URL param
  console.log('Loading main page with popout state...');
  await mainPage.goto(`${baseUrl}/automobiles/discover3?popout=statistics-1`);
  await mainPage.waitForTimeout(2000);

  // Hmm, the popout state is managed by the service, not URL.
  // Let's take individual screenshots and describe them well

  console.log('Taking main page screenshot...');
  await mainPage.screenshot({
    path: `${screenshotDir}/discover3-popout-main.png`
  });

  console.log('Taking popout window screenshot with shadow/border styling...');

  // Add some visual styling to the popout to make it look like a window
  await popoutPage.addStyleTag({
    content: `
      body {
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        border-radius: 8px;
        overflow: hidden;
      }
    `
  });

  await popoutPage.screenshot({
    path: `${screenshotDir}/discover3-popout-window.png`
  });

  // Now let's create a proper composite using canvas in Node
  console.log('Creating composite image...');

  // Use sharp if available, otherwise just save both images
  try {
    const sharp = require('sharp');

    const mainImage = await sharp(`${screenshotDir}/discover3-popout-main.png`).toBuffer();
    const popoutImage = await sharp(`${screenshotDir}/discover3-popout-window.png`)
      .resize(850, 650) // Slightly smaller
      .toBuffer();

    // Create composite: main image with popout overlaid in bottom-right
    await sharp(`${screenshotDir}/discover3-popout-main.png`)
      .resize(1400, 900)
      .composite([
        {
          input: popoutImage,
          top: 180,
          left: 480,
          blend: 'over'
        }
      ])
      .toFile(`${screenshotDir}/discover3-popout-composite.png`);

    console.log('Composite image created!');
  } catch (e) {
    console.log('Sharp not available, individual screenshots saved');
    console.log('Main:', `${screenshotDir}/discover3-popout-main.png`);
    console.log('Popout:', `${screenshotDir}/discover3-popout-window.png`);
  }

  await browser.close();
  console.log('Done!');
})();
