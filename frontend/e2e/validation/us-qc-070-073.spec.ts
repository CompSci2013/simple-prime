/**
 * User Story Validation: US-QC-070 to US-QC-073
 * Epic 8: Panel Behavior
 *
 * Note: These stories describe collapse/expand and pop-out functionality
 * which may or may not be implemented for the query-control panel.
 */
import { test } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const SCREENSHOT_DIR = 'test-results/validation/epic-8';

test.describe('Epic 8: Panel Behavior - Validation', () => {
  test.setTimeout(60000);

  test.beforeAll(async () => {
    const dir = path.join(process.cwd(), SCREENSHOT_DIR);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });

  test('US-QC-070: Collapse Query Control Panel', async ({ page }) => {
    await page.goto('http://localhost:4205/automobiles/discover');
    await page.waitForLoadState('networkidle');
    await page.locator('.query-control-panel').waitFor({ state: 'visible', timeout: 30000 });

    console.log('\n=== US-QC-070 Criteria Check ===');

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/070-01-panel-expanded.png`,
      fullPage: false
    });

    // Look for collapse button (− or similar)
    const collapseButton = page.locator('.panel-collapse, .collapse-button, button:has(.pi-minus), button:has-text("−")');
    const hasCollapseButton = await collapseButton.count() > 0;
    console.log('Criterion 1: Collapse button (−) in panel header:', hasCollapseButton ? 'FOUND' : 'NOT FOUND');

    // Also check for p-panel (PrimeNG panel component)
    const pPanel = page.locator('p-panel');
    const hasPPanel = await pPanel.count() > 0;
    console.log('PrimeNG p-panel component:', hasPPanel ? 'FOUND' : 'NOT FOUND');

    if (!hasCollapseButton && !hasPPanel) {
      console.log('FINDING: Query Control panel does NOT have collapse functionality');
      console.log('User stories US-QC-070 and US-QC-071 may describe unimplemented features');
    }

    if (hasCollapseButton) {
      await collapseButton.click();
      await page.waitForTimeout(500);

      await page.screenshot({
        path: `${SCREENSHOT_DIR}/070-02-panel-collapsed.png`,
        fullPage: false
      });

      console.log('Criterion 2: Panel collapses on click');
      console.log('Criterion 3: Collapse state persisted - would need localStorage check');
    }
  });

  test('US-QC-071: Expand Collapsed Panel', async ({ page }) => {
    await page.goto('http://localhost:4205/automobiles/discover');
    await page.waitForLoadState('networkidle');
    await page.locator('.query-control-panel').waitFor({ state: 'visible', timeout: 30000 });

    console.log('\n=== US-QC-071 Criteria Check ===');

    // Look for expand button
    const expandButton = page.locator('.panel-expand, .expand-button, button:has(.pi-plus), button:has-text("+")');
    const hasExpandButton = await expandButton.count() > 0;
    console.log('Criterion 1: Expand button (+) when collapsed:', hasExpandButton ? 'FOUND' : 'NOT FOUND');

    if (!hasExpandButton) {
      console.log('FINDING: No expand button found - panel may always be expanded');
      console.log('This is consistent with US-QC-070 finding');
    }

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/071-01-looking-for-expand.png`,
      fullPage: false
    });
  });

  test('US-QC-072: Pop-Out Query Control', async ({ page }) => {
    await page.goto('http://localhost:4205/automobiles/discover');
    await page.waitForLoadState('networkidle');
    await page.locator('.query-control-panel').waitFor({ state: 'visible', timeout: 30000 });

    console.log('\n=== US-QC-072 Criteria Check ===');

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/072-01-panel-initial.png`,
      fullPage: false
    });

    // Hover over panel to reveal pop-out button
    const panel = page.locator('.query-control-panel');
    await panel.hover();
    await page.waitForTimeout(500);

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/072-02-panel-hovered.png`,
      fullPage: false
    });

    // Look for pop-out button
    const popOutButton = page.locator('.pop-out-button, .panel-popout, button:has(.pi-external-link), button[title*="pop"], button[aria-label*="pop"]');
    const hasPopOut = await popOutButton.count() > 0;
    console.log('Criterion 1: Pop-out button appears on hover:', hasPopOut ? 'FOUND' : 'NOT FOUND');

    if (!hasPopOut) {
      console.log('FINDING: Query Control panel does NOT have pop-out functionality');
      console.log('User stories US-QC-072 and US-QC-073 may describe unimplemented features');
    }

    if (hasPopOut) {
      // Note: Actually clicking would open new window which is hard to test in Playwright
      console.log('Criterion 2: Clicking opens panel in new window - not tested');
      console.log('Criterion 3: Main page shows placeholder - not tested');
      console.log('Criterion 4: BroadcastChannel sync - not tested');
    }
  });

  test('US-QC-073: Sync Filter Changes in Pop-Out', async ({ page }) => {
    console.log('\n=== US-QC-073 Criteria Check ===');

    await page.goto('http://localhost:4205/automobiles/discover');
    await page.waitForLoadState('networkidle');
    await page.locator('.query-control-panel').waitFor({ state: 'visible', timeout: 30000 });

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/073-01-main-window.png`,
      fullPage: false
    });

    // Check if pop-out sync is even implemented
    const hasPopOutFeature = await page.locator('.pop-out-button, .panel-popout').count() > 0;

    if (!hasPopOutFeature) {
      console.log('FINDING: Pop-out feature not found - cannot test sync');
      console.log('User story US-QC-073 depends on US-QC-072 which appears unimplemented');
      console.log('All criteria marked as NOT TESTABLE due to missing prerequisite');
    } else {
      console.log('Pop-out feature found - sync testing would require multi-window setup');
      console.log('Criterion 1: Adding filter in pop-out updates main window - needs manual test');
      console.log('Criterion 2: Main window results refresh - needs manual test');
      console.log('Criterion 3: Main window filter chips update - needs manual test');
      console.log('Criterion 4: No manual refresh required - needs manual test');
    }
  });
});
