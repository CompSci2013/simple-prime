import { test, expect, Page, BrowserContext } from '@playwright/test';

/**
 * Debug test for popout functionality
 * Takes screenshots and logs extensively to understand the current state
 */

test.describe('Popout Debug', () => {
  test.setTimeout(60000); // 60 second timeout

  test('Visual inspection of popout functionality', async ({ page, context }) => {
    console.log('\n=== STEP 1: Navigate to automobiles/discover ===');
    await page.goto('/automobiles/discover');
    await page.waitForLoadState('networkidle');

    // Take initial screenshot
    await page.screenshot({ path: 'test-results/01-initial-page.png', fullPage: true });
    console.log('Screenshot saved: 01-initial-page.png');

    // Log what we see on the page
    const pageContent = await page.content();
    console.log('Page title:', await page.title());
    console.log('Page URL:', page.url());

    // Check for key elements
    const queryControl = await page.locator('app-query-control').count();
    const resultsTable = await page.locator('app-dynamic-results-table').count();
    const dockviewStats = await page.locator('app-dockview-statistics-panel').count();

    console.log(`Found elements: query-control=${queryControl}, results-table=${resultsTable}, dockview-stats=${dockviewStats}`);

    // Wait for data to load
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'test-results/02-after-load.png', fullPage: true });
    console.log('Screenshot saved: 02-after-load.png');

    // Look for popout buttons
    console.log('\n=== STEP 2: Find popout buttons ===');
    const popoutButtons = await page.locator('[id^="popout-"]').all();
    console.log(`Found ${popoutButtons.length} popout buttons`);

    for (const btn of popoutButtons) {
      const id = await btn.getAttribute('id');
      const visible = await btn.isVisible();
      console.log(`  - Button: ${id}, visible: ${visible}`);
    }

    // Also look for any button with popout in class or text
    const altPopoutButtons = await page.locator('button:has-text("popout"), button:has-text("pop-out"), [class*="popout"]').all();
    console.log(`Found ${altPopoutButtons.length} alternative popout buttons/elements`);

    // Check for icons that might be popout triggers
    const externalLinkIcons = await page.locator('[class*="external"], [class*="launch"], [class*="open"]').all();
    console.log(`Found ${externalLinkIcons.length} external/launch icons`);

    // Look in the dockview panel for popout functionality
    const dockviewPanel = page.locator('app-dockview-statistics-panel');
    if (await dockviewPanel.count() > 0) {
      console.log('\n=== STEP 3: Inspect dockview statistics panel ===');
      const dockviewHTML = await dockviewPanel.innerHTML();
      console.log('Dockview panel HTML length:', dockviewHTML.length);

      // Look for any interactive elements in the dockview
      const dockviewButtons = await dockviewPanel.locator('button').all();
      console.log(`Found ${dockviewButtons.length} buttons in dockview panel`);
    }

    // Try to find charts and their popout buttons
    console.log('\n=== STEP 4: Look for charts ===');
    const charts = await page.locator('app-base-chart').all();
    console.log(`Found ${charts.length} charts`);

    for (let i = 0; i < charts.length; i++) {
      const chart = charts[i];
      const chartButtons = await chart.locator('button').all();
      console.log(`  Chart ${i}: has ${chartButtons.length} buttons`);
    }

    // Log all buttons on the page
    console.log('\n=== STEP 5: All buttons on page ===');
    const allButtons = await page.locator('button').all();
    console.log(`Total buttons: ${allButtons.length}`);
    for (let i = 0; i < Math.min(20, allButtons.length); i++) {
      const btn = allButtons[i];
      const text = await btn.textContent();
      const classes = await btn.getAttribute('class');
      const id = await btn.getAttribute('id');
      console.log(`  ${i}: id="${id || ''}" class="${classes?.substring(0, 50) || ''}" text="${text?.trim().substring(0, 30) || ''}"`);
    }

    // Check console for errors
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    console.log('\n=== STEP 6: Try clicking first popout button if found ===');
    const firstPopoutButton = page.locator('[id^="popout-"]').first();
    if (await firstPopoutButton.count() > 0) {
      console.log('Found a popout button, attempting to click...');

      const [popup] = await Promise.all([
        context.waitForEvent('page', { timeout: 5000 }).catch(() => null),
        firstPopoutButton.click()
      ]);

      if (popup) {
        console.log('Popup window opened!');
        console.log('Popup URL:', popup.url());
        await popup.waitForLoadState('networkidle');
        await popup.screenshot({ path: 'test-results/03-popup-window.png', fullPage: true });
        console.log('Screenshot saved: 03-popup-window.png');

        // Check popup content
        const popupContent = await popup.locator('body').innerHTML();
        console.log('Popup body length:', popupContent.length);

        // Check for components in popup
        const popupQueryControl = await popup.locator('app-query-control').count();
        const popupChart = await popup.locator('app-base-chart').count();
        console.log(`Popup elements: query-control=${popupQueryControl}, chart=${popupChart}`);

        // Check for router-outlet
        const routerOutlet = await popup.locator('router-outlet').count();
        console.log(`Router outlets in popup: ${routerOutlet}`);

        await popup.close();
      } else {
        console.log('No popup window was opened');
      }
    } else {
      console.log('No popout buttons found with [id^="popout-"] selector');
    }

    // Final screenshot
    await page.screenshot({ path: 'test-results/04-final-state.png', fullPage: true });
    console.log('Screenshot saved: 04-final-state.png');

    if (errors.length > 0) {
      console.log('\n=== CONSOLE ERRORS ===');
      errors.forEach(e => console.log(`  ERROR: ${e}`));
    }

    console.log('\n=== TEST COMPLETE ===');
  });
});
