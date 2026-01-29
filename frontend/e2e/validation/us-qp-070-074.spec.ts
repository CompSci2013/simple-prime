/**
 * User Story Validation: US-QP-070 through US-QP-074
 * Epic 8: Panel Behavior
 *
 * Tests collapse, expand, pop-out, and drag functionality
 */
import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const SCREENSHOT_DIR = 'test-results/validation/query-panel/epic-8';

test.describe('Query Panel - Epic 8: Panel Behavior', () => {
  test.setTimeout(60000);

  test.beforeAll(async () => {
    const dir = path.join(process.cwd(), SCREENSHOT_DIR);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });

  test.beforeEach(async ({ page }) => {
    // Clear localStorage to ensure fresh state (panels not collapsed)
    await page.goto('http://localhost:4205/automobiles/discover');
    await page.evaluate(() => localStorage.clear());
    // Reload to apply cleared state
    await page.reload();
    await page.waitForLoadState('networkidle');
  });

  test('US-QP-070: Collapse Query Panel', async ({ page }) => {
    // beforeEach already navigated and cleared localStorage
    // Find Query Panel wrapper
    const panelWrapper = page.locator('.panel-wrapper').filter({ hasText: 'Query Panel' });
    await panelWrapper.waitFor({ state: 'visible', timeout: 30000 });

    // Screenshot before collapse
    await panelWrapper.screenshot({
      path: `${SCREENSHOT_DIR}/070-01-before-collapse.png`
    });

    console.log('\n=== US-QP-070 Criteria Check ===');

    // Find collapse button (look for button with chevron icon span)
    const collapseBtn = panelWrapper.locator('button').filter({ has: page.locator('span[class*="chevron"]') }).first();
    const hasBtnBeforeCollapse = await collapseBtn.count() > 0;
    console.log('Criterion 1: Collapse button exists:', hasBtnBeforeCollapse ? 'PASS' : 'FAIL');

    if (hasBtnBeforeCollapse) {
      // Get icon class before click
      const iconBefore = await collapseBtn.locator('span[class*="pi"]').getAttribute('class');
      console.log('Icon before collapse:', iconBefore);

      // Click collapse
      await collapseBtn.click();
      await page.waitForTimeout(300);

      // Screenshot after collapse
      await panelWrapper.screenshot({
        path: `${SCREENSHOT_DIR}/070-02-after-collapse.png`
      });

      // Check content is hidden
      const queryPanelContent = panelWrapper.locator('.query-panel-container');
      const isContentVisible = await queryPanelContent.isVisible();
      console.log('Criterion 2: Content hidden after collapse:', !isContentVisible ? 'PASS' : 'FAIL');

      // Check icon changed
      const iconAfter = await collapseBtn.locator('span[class*="pi"]').getAttribute('class');
      console.log('Icon after collapse:', iconAfter);
      console.log('Criterion 3: Icon changed to chevron-right:', iconAfter?.includes('chevron-right') ? 'PASS' : 'FAIL');
    }
  });

  test('US-QP-071: Expand Collapsed Panel', async ({ page }) => {
    // beforeEach already navigated and cleared localStorage
    // Find panel wrapper
    const panelWrapper = page.locator('.panel-wrapper').filter({ hasText: 'Query Panel' });
    await panelWrapper.waitFor({ state: 'visible', timeout: 30000 });

    const queryPanelContent = panelWrapper.locator('.query-panel-container');
    const collapseBtn = panelWrapper.locator('button').filter({ has: page.locator('span[class*="chevron"]') }).first();

    // Check initial state - if already collapsed, we can directly test expand
    const initiallyExpanded = await queryPanelContent.isVisible();
    console.log('Initial state - content visible:', initiallyExpanded);

    // If panel starts expanded, collapse it first
    if (initiallyExpanded) {
      await collapseBtn.click();
      await page.waitForTimeout(500);
      console.log('Collapsed panel for test');
    }

    // Screenshot collapsed state
    await panelWrapper.screenshot({
      path: `${SCREENSHOT_DIR}/071-01-collapsed.png`
    });

    // Verify now collapsed
    const isNowCollapsed = !(await queryPanelContent.isVisible());
    console.log('Panel is collapsed:', isNowCollapsed);

    console.log('\n=== US-QP-071 Criteria Check ===');

    // Click expand button
    await collapseBtn.click();
    await page.waitForTimeout(500);

    // Screenshot expanded state
    await panelWrapper.screenshot({
      path: `${SCREENSHOT_DIR}/071-02-expanded.png`
    });

    // Check content is visible
    const isContentVisible = await queryPanelContent.isVisible();
    console.log('Criterion 1: Content visible after expand:', isContentVisible ? 'PASS' : 'FAIL');

    // Check icon changed to chevron-down (expanded state)
    const iconAfterExpand = await collapseBtn.locator('span[class*="pi"]').getAttribute('class');
    console.log('Criterion 2: Icon is chevron-down:', iconAfterExpand?.includes('chevron-down') ? 'PASS' : 'FAIL');

    expect(isContentVisible).toBe(true);
  });

  test('US-QP-072: Pop-Out Query Panel', async ({ page, context }) => {
    // beforeEach already navigated and cleared localStorage
    // Find Query Panel wrapper
    const panelWrapper = page.locator('.panel-wrapper').filter({ hasText: 'Query Panel' });
    await panelWrapper.waitFor({ state: 'visible', timeout: 30000 });

    console.log('\n=== US-QP-072 Criteria Check ===');

    // Find pop-out button
    const popoutBtn = panelWrapper.locator('button[icon*="external-link"]');
    const hasPopoutBtn = await popoutBtn.count() > 0;
    console.log('Criterion 1: Pop-out button exists:', hasPopoutBtn ? 'PASS' : 'FAIL');

    if (hasPopoutBtn) {
      // Check tooltip
      const tooltip = await popoutBtn.getAttribute('ptooltip');
      console.log('Criterion 2: Tooltip:', tooltip);

      // Screenshot before pop-out
      await page.screenshot({
        path: `${SCREENSHOT_DIR}/072-01-before-popout.png`,
        fullPage: false
      });

      // Listen for new page (popup window)
      const popupPromise = context.waitForEvent('page');

      // Click pop-out
      await popoutBtn.click();

      // Wait for popup
      const popup = await popupPromise;
      await popup.waitForLoadState('networkidle');

      // Screenshot popup
      await popup.screenshot({
        path: `${SCREENSHOT_DIR}/072-02-popup-window.png`
      });

      // Check popup URL
      const popupUrl = popup.url();
      console.log('Criterion 3: Pop-out opens new window: PASS');
      console.log('Criterion 4: Pop-out URL:', popupUrl);
      console.log('Expected pattern: /panel/discover/query-panel/query-panel?popout=query-panel');

      // Screenshot main page placeholder
      await page.screenshot({
        path: `${SCREENSHOT_DIR}/072-03-main-placeholder.png`,
        fullPage: false
      });

      // Check for placeholder message
      const placeholder = page.locator('.popout-placeholder');
      const hasPlaceholder = await placeholder.isVisible();
      console.log('Criterion 5: Main shows placeholder:', hasPlaceholder ? 'PASS' : 'FAIL');

      if (hasPlaceholder) {
        const placeholderText = await placeholder.textContent();
        console.log('Placeholder text:', placeholderText);
      }

      // Close popup
      await popup.close();
    }
  });

  test('US-QP-073: Sync Filter Changes in Pop-Out', async ({ page, context }) => {
    // beforeEach already navigated and cleared localStorage
    // Find and pop out Query Panel
    const panelWrapper = page.locator('.panel-wrapper').filter({ hasText: 'Query Panel' });
    await panelWrapper.waitFor({ state: 'visible', timeout: 30000 });

    const popoutBtn = panelWrapper.locator('button[icon*="external-link"]');

    console.log('\n=== US-QP-073 Criteria Check ===');

    if (await popoutBtn.count() > 0) {
      const popupPromise = context.waitForEvent('page');
      await popoutBtn.click();
      const popup = await popupPromise;
      await popup.waitForLoadState('networkidle');

      // Find year input in popup
      const popupQueryPanel = popup.locator('.query-panel-container');
      await popupQueryPanel.waitFor({ state: 'visible', timeout: 10000 });

      const yearMinField = popupQueryPanel.locator('.filter-field').filter({ hasText: /^Year Range$/ });
      const yearMinInput = yearMinField.locator('input').first();

      // Apply filter in popup
      await yearMinInput.fill('1995');
      await popup.waitForTimeout(500);

      // Screenshot popup after filter
      await popup.screenshot({
        path: `${SCREENSHOT_DIR}/073-01-popup-filter-applied.png`
      });

      // Wait for sync to main window
      await page.waitForTimeout(500);

      // Screenshot main window
      await page.screenshot({
        path: `${SCREENSHOT_DIR}/073-02-main-after-sync.png`,
        fullPage: false
      });

      // Check main window URL updated
      const mainUrl = page.url();
      console.log('Criterion 1: Main window URL updated:', mainUrl.includes('yearMin=1995') ? 'PASS' : 'FAIL');
      console.log('Main window URL:', mainUrl);

      // Close popup
      await popup.close();
    }
  });

  test('US-QP-074: Drag to Reorder Panel', async ({ page }) => {
    // beforeEach already navigated and cleared localStorage
    // Find Query Panel wrapper
    const panelWrapper = page.locator('.panel-wrapper').filter({ hasText: 'Query Panel' });
    await panelWrapper.waitFor({ state: 'visible', timeout: 30000 });

    console.log('\n=== US-QP-074 Criteria Check ===');

    // Find drag handle
    const dragHandle = panelWrapper.locator('.drag-handle');
    const hasDragHandle = await dragHandle.count() > 0;
    console.log('Criterion 1: Drag handle (hamburger icon) exists:', hasDragHandle ? 'PASS' : 'FAIL');

    if (hasDragHandle) {
      // Screenshot before drag
      await page.screenshot({
        path: `${SCREENSHOT_DIR}/074-01-before-drag.png`,
        fullPage: true
      });

      // Get all panel titles in order
      const panelTitles = await page.locator('.panel-wrapper .panel-title').allTextContents();
      console.log('Panel order before drag:', panelTitles);

      // Find Query Panel position
      const queryPanelIndex = panelTitles.indexOf('Query Panel');
      console.log('Query Panel position:', queryPanelIndex);

      // Try drag (note: CDK drag/drop may require specific handling)
      const handleBox = await dragHandle.boundingBox();
      if (handleBox) {
        // Find next panel to drag over
        const panels = await page.locator('.panel-wrapper').all();
        if (panels.length > 1) {
          const targetPanel = queryPanelIndex === 0 ? panels[1] : panels[0];
          const targetBox = await targetPanel.boundingBox();

          if (targetBox) {
            // Perform drag
            await page.mouse.move(handleBox.x + handleBox.width / 2, handleBox.y + handleBox.height / 2);
            await page.mouse.down();
            await page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + targetBox.height / 2, { steps: 10 });
            await page.mouse.up();
            await page.waitForTimeout(500);

            // Screenshot after drag attempt
            await page.screenshot({
              path: `${SCREENSHOT_DIR}/074-02-after-drag.png`,
              fullPage: true
            });

            // Check new order
            const newPanelTitles = await page.locator('.panel-wrapper .panel-title').allTextContents();
            console.log('Panel order after drag:', newPanelTitles);
            console.log('Criterion 2: Panel reordered:', panelTitles.join(',') !== newPanelTitles.join(',') ? 'PASS' : 'FAIL (order unchanged)');
          }
        }
      }
    }
  });
});
