/**
 * User Story Validation: US-QP-001, US-QP-002, US-QP-003
 * Epic 1: Panel Layout and Visibility
 *
 * Tests Query Panel visibility, filter grid layout, and labels
 */
import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const SCREENSHOT_DIR = 'test-results/validation/query-panel/epic-1';

test.describe('Query Panel - Epic 1: Panel Layout and Visibility', () => {
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

  test('US-QP-001: View Query Panel', async ({ page }) => {
    // beforeEach already navigated and cleared localStorage
    // Screenshot 1: Full page showing panel list
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/001-01-full-page.png`,
      fullPage: true
    });

    // Find Query Panel by title
    const panelHeader = page.locator('.panel-wrapper').filter({ hasText: 'Query Panel' });
    await panelHeader.waitFor({ state: 'visible', timeout: 30000 });

    // Screenshot 2: Query Panel header
    await panelHeader.screenshot({
      path: `${SCREENSHOT_DIR}/001-02-query-panel-header.png`
    });

    console.log('\n=== US-QP-001 Criteria Check ===');

    // Check panel title
    const title = await panelHeader.locator('.panel-title').textContent();
    console.log('Criterion 1: Panel appears with title "Query Panel":', title === 'Query Panel' ? 'PASS' : `FAIL (got "${title}")`);

    // Check for drag handle
    const dragHandle = panelHeader.locator('.drag-handle i.pi-bars');
    const hasDragHandle = await dragHandle.count() > 0;
    console.log('Criterion 2: Hamburger icon (drag handle):', hasDragHandle ? 'PASS' : 'FAIL');

    // Check for collapse button (look for button with chevron icon class in span)
    const collapseBtn = panelHeader.locator('button').filter({ has: page.locator('span[class*="chevron"]') });
    const hasCollapseBtn = await collapseBtn.count() > 0;
    console.log('Criterion 3: Collapse button:', hasCollapseBtn ? 'PASS' : 'FAIL');

    // Check for pop-out button
    const popoutBtn = panelHeader.locator('button[icon*="external-link"]');
    const hasPopoutBtn = await popoutBtn.count() > 0;
    console.log('Criterion 4: Pop-out button:', hasPopoutBtn ? 'PASS' : 'FAIL');

    // Check for query panel content
    const queryPanelContainer = page.locator('[data-testid="query-panel"], .query-panel-container');
    const hasContent = await queryPanelContainer.count() > 0;
    console.log('Criterion 5: Panel content displays filter grid:', hasContent ? 'PASS' : 'FAIL');

    // Screenshot 3: Query Panel content
    if (hasContent) {
      await queryPanelContainer.first().screenshot({
        path: `${SCREENSHOT_DIR}/001-03-query-panel-content.png`
      });
    }

    expect(title).toBe('Query Panel');
    expect(hasDragHandle).toBe(true);
    expect(hasCollapseBtn).toBe(true);
  });

  test('US-QP-002: View Filter Grid Layout', async ({ page }) => {
    // beforeEach already navigated and cleared localStorage
    const queryPanel = page.locator('.query-panel-container');
    await queryPanel.waitFor({ state: 'visible', timeout: 30000 });

    // Screenshot 1: Filter grid
    await queryPanel.screenshot({
      path: `${SCREENSHOT_DIR}/002-01-filter-grid.png`
    });

    console.log('\n=== US-QP-002 Criteria Check ===');

    // Check for filter-grid class
    const filterGrid = queryPanel.locator('.filter-grid');
    const hasGrid = await filterGrid.count() > 0;
    console.log('Criterion 1: Filters in responsive grid:', hasGrid ? 'PASS' : 'FAIL');

    // Check filter fields
    const filterFields = queryPanel.locator('.filter-field');
    const fieldCount = await filterFields.count();
    console.log('Criterion 2: Filter field count:', fieldCount);

    // Check labels
    const labels = await queryPanel.locator('.filter-field label').allTextContents();
    console.log('Criterion 3: Labels present:', labels);

    // Screenshot 2: Individual filter field
    if (fieldCount > 0) {
      await filterFields.first().screenshot({
        path: `${SCREENSHOT_DIR}/002-02-filter-field-sample.png`
      });
    }

    expect(hasGrid).toBe(true);
    expect(fieldCount).toBeGreaterThan(0);
  });

  test('US-QP-003: View Filter Labels', async ({ page }) => {
    // beforeEach already navigated and cleared localStorage
    const queryPanel = page.locator('.query-panel-container');
    await queryPanel.waitFor({ state: 'visible', timeout: 30000 });

    // Get all labels
    const labels = await queryPanel.locator('.filter-field label').allTextContents();
    const labelsText = labels.map(l => l.trim()).filter(l => l.length > 0);

    console.log('\n=== US-QP-003 Criteria Check ===');
    console.log('All labels found:', labelsText);

    // Expected labels based on filter-definitions.ts
    const expectedLabels = [
      'Manufacturer',
      'Model',
      'Year Range',
      'Year Range Max',
      'Body Class',
      'VIN Count Range',
      'VIN Count Range Max'
    ];

    for (const expected of expectedLabels) {
      const found = labelsText.some(l => l.includes(expected));
      console.log(`Label "${expected}":`, found ? 'PASS' : 'FAIL');
    }

    // Screenshot showing all labels
    await queryPanel.screenshot({
      path: `${SCREENSHOT_DIR}/003-01-all-labels.png`
    });

    // Verify at least the main labels exist
    expect(labelsText).toContain('Manufacturer');
    expect(labelsText).toContain('Model');
    expect(labelsText.some(l => l.includes('Year'))).toBe(true);
    expect(labelsText).toContain('Body Class');
  });
});
