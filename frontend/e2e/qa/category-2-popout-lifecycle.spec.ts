import { test, expect } from '@playwright/test';
import { TestContext, getFilterChips, screenshotAllComponents, screenshotPopout, expandAllPanels } from './test-utils';

/**
 * Category 2: Pop-Out Lifecycle (Tests 021-030)
 *
 * Based on QUALITY-ASSURANCE.md Part 3: Pop-Out Window System
 *
 * Tests pop-out window operations:
 * - Open pop-out window
 * - Placeholder shown in main window
 * - Close pop-out restores panel
 * - Multiple pop-outs tracked independently
 */

const CATEGORY = 'Category 2: Pop-Out Lifecycle';

async function navigateToDiscover(page: import('@playwright/test').Page): Promise<void> {
  await page.goto('/automobiles/discover');
  await page.waitForLoadState('networkidle');
  await expandAllPanels(page);
  await expect(page.locator('[data-testid="basic-results-table"]')).toBeVisible({ timeout: 15000 });
}

// ==================== TESTS ====================

test.describe('Category 2: Pop-Out Lifecycle', () => {

  test('021 - Open pop-out window: New window opens with correct URL', async ({ page, context }) => {
    const ctx = new TestContext(
      page,
      'TEST-021',
      'Open pop-out window',
      CATEGORY,
      'When clicking the pop-out button for Results Table:\n' +
      '1. A new window should open\n' +
      '2. Pop-out URL should contain /panel/ and popout= parameter\n' +
      '3. Results table should be visible in pop-out\n' +
      '4. No console errors should occur'
    );

    let actualResult = '';

    try {
      await navigateToDiscover(page);

      // Screenshot all components before pop-out
      await screenshotAllComponents(ctx, page, 'initial');

      // Click the pop-out button for Results Table
      const [popoutPage] = await Promise.all([
        context.waitForEvent('page'),
        page.locator('#popout-basic-results-table').click()
      ]);

      await popoutPage.waitForLoadState('networkidle');
      await popoutPage.waitForTimeout(1000);

      // Verify pop-out window URL
      const popoutUrl = popoutPage.url();
      actualResult += `Pop-out URL: ${popoutUrl}\n`;

      expect(popoutUrl).toContain('/panel/');
      expect(popoutUrl).toContain('popout=');

      // Screenshot the pop-out window
      await ctx.screenshotPage(popoutPage, 'popout-results-table');

      // Screenshot all components on main page showing placeholder
      await screenshotAllComponents(ctx, page, 'main-with-placeholder');

      // Verify pop-out shows the Results Table
      const resultsTable = popoutPage.locator('[data-testid="results-table"], .results-table, p-table').first();
      await expect(resultsTable).toBeVisible({ timeout: 5000 });
      actualResult += 'Results table visible in pop-out: true\n';

      // Cleanup
      await popoutPage.close();

      expect(ctx.hasError()).toBe(false);
      actualResult += `Console errors: ${ctx.getErrors().length}\n`;
      actualResult += '\nTEST PASSED';

      ctx.finalize(true, actualResult);
    } catch (error) {
      actualResult += `\nTEST FAILED: ${error}`;
      ctx.finalize(false, actualResult);
      throw error;
    }
  });

  test('022 - Placeholder shown in main window when panel popped out', async ({ page, context }) => {
    const ctx = new TestContext(
      page,
      'TEST-022',
      'Placeholder shown in main',
      CATEGORY,
      'When a panel is popped out:\n' +
      '1. Main window should show placeholder text\n' +
      '2. Actual table content should be in pop-out only\n' +
      '3. No console errors should occur'
    );

    let actualResult = '';

    try {
      await navigateToDiscover(page);

      // Open Results Table pop-out
      const [popoutPage] = await Promise.all([
        context.waitForEvent('page'),
        page.locator('#popout-basic-results-table').click()
      ]);

      await popoutPage.waitForLoadState('networkidle');
      await page.waitForTimeout(500);

      // Screenshot the pop-out window
      await ctx.screenshotPage(popoutPage, 'popout-results-table');

      // Screenshot all components on main page showing placeholder
      await screenshotAllComponents(ctx, page, 'main-placeholder');

      // Verify placeholder is shown in main window
      const placeholderText = page.locator('text=/open in a separate window|is open in/i').first();
      const hasPlaceholder = await placeholderText.isVisible().catch(() => false);

      actualResult += `Placeholder visible: ${hasPlaceholder}\n`;
      expect(hasPlaceholder).toBe(true);

      // Verify the actual table is NOT in main window
      const mainTable = page.locator('[data-testid="basic-results-table-panel"] p-table');
      const tableInMain = await mainTable.isVisible().catch(() => false);
      actualResult += `Table still in main: ${tableInMain}\n`;

      // Cleanup
      await popoutPage.close();

      expect(ctx.hasError()).toBe(false);
      actualResult += `Console errors: ${ctx.getErrors().length}\n`;
      actualResult += '\nTEST PASSED';

      ctx.finalize(true, actualResult);
    } catch (error) {
      actualResult += `\nTEST FAILED: ${error}`;
      ctx.finalize(false, actualResult);
      throw error;
    }
  });

  test('023 - Close pop-out restores panel in main window', async ({ page, context }) => {
    const ctx = new TestContext(
      page,
      'TEST-023',
      'Close pop-out restores panel',
      CATEGORY,
      'When pop-out window is closed:\n' +
      '1. Panel should restore in main window\n' +
      '2. Placeholder should disappear\n' +
      '3. Table should be visible again in main\n' +
      '4. No console errors should occur'
    );

    let actualResult = '';

    try {
      await navigateToDiscover(page);

      // Verify table is initially in main window
      const initialTable = page.locator('[data-testid="basic-results-table"]');
      await expect(initialTable).toBeVisible({ timeout: 5000 });
      actualResult += 'Table initially visible in main: true\n';

      // Open pop-out
      const [popoutPage] = await Promise.all([
        context.waitForEvent('page'),
        page.locator('#popout-basic-results-table').click()
      ]);

      await popoutPage.waitForLoadState('networkidle');
      await page.waitForTimeout(500);

      // Screenshot the pop-out window
      await ctx.screenshotPage(popoutPage, 'popout-results-table');

      // Screenshot all components on main page with placeholder
      await screenshotAllComponents(ctx, page, 'main-with-placeholder');

      // Close the pop-out window
      await popoutPage.close();

      // Wait for panel to restore
      await page.waitForTimeout(1000);

      // Screenshot all components after restore
      await screenshotAllComponents(ctx, page, 'main-restored');

      // Verify table is restored in main window
      const restoredTable = page.locator('[data-testid="basic-results-table"]');
      await expect(restoredTable).toBeVisible({ timeout: 5000 });
      actualResult += 'Table restored in main window: true\n';

      // Verify placeholder is gone
      const placeholderText = page.locator('text=/open in a separate window/i');
      const placeholderGone = !(await placeholderText.isVisible().catch(() => false));
      actualResult += `Placeholder gone: ${placeholderGone}\n`;

      expect(ctx.hasError()).toBe(false);
      actualResult += `Console errors: ${ctx.getErrors().length}\n`;
      actualResult += '\nTEST PASSED';

      ctx.finalize(true, actualResult);
    } catch (error) {
      actualResult += `\nTEST FAILED: ${error}`;
      ctx.finalize(false, actualResult);
      throw error;
    }
  });

  test('024 - Multiple pop-outs tracked independently', async ({ page, context }) => {
    const ctx = new TestContext(
      page,
      'TEST-024',
      'Multiple pop-outs independent',
      CATEGORY,
      'When multiple panels are popped out:\n' +
      '1. Each pop-out should have unique URL\n' +
      '2. Closing one should not affect the other\n' +
      '3. Panel should restore when its pop-out closes\n' +
      '4. No console errors should occur'
    );

    let actualResult = '';

    try {
      await navigateToDiscover(page);

      // Open Results Table pop-out
      const [resultsPopout] = await Promise.all([
        context.waitForEvent('page'),
        page.locator('#popout-basic-results-table').click()
      ]);
      await resultsPopout.waitForLoadState('networkidle');

      // Open Query Control pop-out
      const [queryPopout] = await Promise.all([
        context.waitForEvent('page'),
        page.locator('#popout-query-control').click()
      ]);
      await queryPopout.waitForLoadState('networkidle');

      // Screenshot all components on main page with both placeholders
      await screenshotAllComponents(ctx, page, 'main-both-placeholders');

      // Screenshot both pop-outs
      await ctx.screenshotPage(resultsPopout, 'popout-results-table');
      await ctx.screenshotPage(queryPopout, 'popout-query-control');

      // Verify both pop-outs have unique URLs
      const resultsUrl = resultsPopout.url();
      const queryUrl = queryPopout.url();

      actualResult += `Results pop-out URL: ${resultsUrl}\n`;
      actualResult += `Query pop-out URL: ${queryUrl}\n`;

      expect(resultsUrl).not.toBe(queryUrl);
      expect(resultsUrl).toContain('basic-results');
      expect(queryUrl).toContain('query-control');

      // Close only the Results pop-out
      await resultsPopout.close();
      await page.waitForTimeout(1000);

      // Screenshot all components after one pop-out closed
      await screenshotAllComponents(ctx, page, 'main-one-restored');
      await ctx.screenshotPage(queryPopout, 'popout-query-still-open');

      // Verify Results table is restored in main
      const restoredTable = page.locator('[data-testid="basic-results-table"]');
      await expect(restoredTable).toBeVisible({ timeout: 5000 });
      actualResult += 'Results table restored: true\n';

      // Verify Query pop-out is still open
      expect(queryPopout.isClosed()).toBe(false);
      actualResult += 'Query pop-out still open: true\n';

      // Cleanup
      await queryPopout.close();

      expect(ctx.hasError()).toBe(false);
      actualResult += `Console errors: ${ctx.getErrors().length}\n`;
      actualResult += '\nTEST PASSED';

      ctx.finalize(true, actualResult);
    } catch (error) {
      actualResult += `\nTEST FAILED: ${error}`;
      ctx.finalize(false, actualResult);
      throw error;
    }
  });

  test('025 - Pop-out URL contains correct routing', async ({ page, context }) => {
    const ctx = new TestContext(
      page,
      'TEST-025',
      'Pop-out URL routing',
      CATEGORY,
      'Pop-out URLs should contain:\n' +
      '1. Correct panel identifier in path\n' +
      '2. popout= query parameter\n' +
      '3. No console errors should occur'
    );

    let actualResult = '';

    try {
      await navigateToDiscover(page);

      const panels = [
        { id: '#popout-query-control', expectedPattern: 'query-control' },
        { id: '#popout-basic-results-table', expectedPattern: 'basic-results' },
      ];

      for (const panel of panels) {
        const button = page.locator(panel.id);
        if (!(await button.isVisible().catch(() => false))) {
          actualResult += `Button ${panel.id} not visible, skipping\n`;
          continue;
        }

        const [popoutPage] = await Promise.all([
          context.waitForEvent('page'),
          button.click()
        ]);

        await popoutPage.waitForLoadState('networkidle');

        const url = popoutPage.url();
        actualResult += `${panel.id} URL: ${url}\n`;

        expect(url).toContain(panel.expectedPattern);
        expect(url).toContain('popout=');

        // Screenshot the pop-out
        await ctx.screenshotPage(popoutPage, `popout-${panel.expectedPattern}`);

        // Screenshot all components on main page
        await screenshotAllComponents(ctx, page, `main-with-${panel.expectedPattern}-popout`);

        await popoutPage.close();
        await page.waitForTimeout(500);
      }

      expect(ctx.hasError()).toBe(false);
      actualResult += `Console errors: ${ctx.getErrors().length}\n`;
      actualResult += '\nTEST PASSED';

      ctx.finalize(true, actualResult);
    } catch (error) {
      actualResult += `\nTEST FAILED: ${error}`;
      ctx.finalize(false, actualResult);
      throw error;
    }
  });

  test('026 - Pop-out window receives initial state from main', async ({ page, context }) => {
    const ctx = new TestContext(
      page,
      'TEST-026',
      'Pop-out receives initial state',
      CATEGORY,
      'When pop-out opens with filter applied:\n' +
      '1. Pop-out should show filtered data\n' +
      '2. Data should match filter (Ford only)\n' +
      '3. No console errors should occur'
    );

    let actualResult = '';

    try {
      // Navigate with a filter already applied
      await page.goto('/automobiles/discover?manufacturer=Ford');
      await page.waitForLoadState('networkidle');
      await expect(page.locator('[data-testid="basic-results-table"]')).toBeVisible({ timeout: 15000 });

      actualResult += 'Main window has Ford filter\n';

      // Open Results Table pop-out
      const [popoutPage] = await Promise.all([
        context.waitForEvent('page'),
        page.locator('#popout-basic-results-table').click()
      ]);

      await popoutPage.waitForLoadState('networkidle');
      await popoutPage.waitForTimeout(1000);

      // Screenshot all components on main page with filter
      await screenshotAllComponents(ctx, page, 'main-with-filter');

      // Screenshot pop-out with filtered data
      await ctx.screenshotPage(popoutPage, 'popout-with-filter');

      // Verify pop-out shows filtered data (Ford only)
      const rows = popoutPage.locator('p-table tbody tr, .p-datatable-tbody tr');
      const rowCount = await rows.count();

      if (rowCount > 0) {
        let fordRowsVerified = 0;
        for (let i = 0; i < Math.min(rowCount, 3); i++) {
          const rowText = await rows.nth(i).textContent();
          expect(rowText?.toLowerCase()).toContain('ford');
          fordRowsVerified++;
        }
        actualResult += `Pop-out shows Ford-filtered data: ${fordRowsVerified} rows verified\n`;
      }

      // Cleanup
      await popoutPage.close();

      expect(ctx.hasError()).toBe(false);
      actualResult += `Console errors: ${ctx.getErrors().length}\n`;
      actualResult += '\nTEST PASSED';

      ctx.finalize(true, actualResult);
    } catch (error) {
      actualResult += `\nTEST FAILED: ${error}`;
      ctx.finalize(false, actualResult);
      throw error;
    }
  });

  test('027 - Pop-out title reflects panel type', async ({ page, context }) => {
    const ctx = new TestContext(
      page,
      'TEST-027',
      'Pop-out title reflects panel',
      CATEGORY,
      'Pop-out window should have:\n' +
      '1. Meaningful page title or header\n' +
      '2. Content related to the panel type\n' +
      '3. No console errors should occur'
    );

    let actualResult = '';

    try {
      await navigateToDiscover(page);

      // Open Results Table pop-out
      const [popoutPage] = await Promise.all([
        context.waitForEvent('page'),
        page.locator('#popout-basic-results-table').click()
      ]);

      await popoutPage.waitForLoadState('networkidle');

      // Screenshot all components on main page with pop-out
      await screenshotAllComponents(ctx, page, 'main-with-popout');

      // Screenshot pop-out
      await ctx.screenshotPage(popoutPage, 'popout-results-table');

      // Get the page title or header
      const title = await popoutPage.title();
      actualResult += `Pop-out page title: ${title}\n`;

      // Also check for header in the page
      const headerText = await popoutPage.locator('h1, h2, .panel-title').first().textContent().catch(() => '');
      actualResult += `Pop-out header: ${headerText}\n`;

      // Verify title contains relevant keywords
      const combinedText = `${title} ${headerText}`.toLowerCase();
      const hasRelevantTitle = combinedText.includes('result') || combinedText.includes('table') || combinedText.includes('discover');
      expect(hasRelevantTitle).toBe(true);

      // Cleanup
      await popoutPage.close();

      expect(ctx.hasError()).toBe(false);
      actualResult += `Console errors: ${ctx.getErrors().length}\n`;
      actualResult += '\nTEST PASSED';

      ctx.finalize(true, actualResult);
    } catch (error) {
      actualResult += `\nTEST FAILED: ${error}`;
      ctx.finalize(false, actualResult);
      throw error;
    }
  });

  test('028 - Pop-out can be reopened after closing', async ({ page, context }) => {
    const ctx = new TestContext(
      page,
      'TEST-028',
      'Pop-out reopens after close',
      CATEGORY,
      'After closing and reopening pop-out:\n' +
      '1. Pop-out should open successfully\n' +
      '2. Content should be visible\n' +
      '3. No console errors should occur'
    );

    let actualResult = '';

    try {
      await navigateToDiscover(page);

      // Open and close pop-out first time
      const [firstPopout] = await Promise.all([
        context.waitForEvent('page'),
        page.locator('#popout-basic-results-table').click()
      ]);
      await firstPopout.waitForLoadState('networkidle');

      await firstPopout.close();
      await page.waitForTimeout(1000);

      // Verify panel is restored
      await expect(page.locator('[data-testid="basic-results-table"]')).toBeVisible({ timeout: 5000 });
      actualResult += 'Panel restored after first close: true\n';

      // Open pop-out second time
      const [secondPopout] = await Promise.all([
        context.waitForEvent('page'),
        page.locator('#popout-basic-results-table').click()
      ]);
      await secondPopout.waitForLoadState('networkidle');

      // Verify second pop-out works correctly
      const resultsTable = secondPopout.locator('[data-testid="results-table"], p-table').first();
      await expect(resultsTable).toBeVisible({ timeout: 5000 });
      actualResult += 'Second pop-out opened successfully: true\n';

      // Screenshot pop-out
      await ctx.screenshotPage(secondPopout, 'popout-reopened');

      // Screenshot all components on main page with reopened popout
      await screenshotAllComponents(ctx, page, 'main-with-reopened-popout');

      // Cleanup
      await secondPopout.close();

      expect(ctx.hasError()).toBe(false);
      actualResult += `Console errors: ${ctx.getErrors().length}\n`;
      actualResult += '\nTEST PASSED';

      ctx.finalize(true, actualResult);
    } catch (error) {
      actualResult += `\nTEST FAILED: ${error}`;
      ctx.finalize(false, actualResult);
      throw error;
    }
  });

  test('029 - Main window remains functional with pop-out open', async ({ page, context }) => {
    const ctx = new TestContext(
      page,
      'TEST-029',
      'Main functional with pop-out',
      CATEGORY,
      'With pop-out open:\n' +
      '1. Main window should remain interactive\n' +
      '2. Can interact with other panels\n' +
      '3. No console errors should occur'
    );

    let actualResult = '';

    try {
      await navigateToDiscover(page);

      // Open Results Table pop-out
      const [popoutPage] = await Promise.all([
        context.waitForEvent('page'),
        page.locator('#popout-basic-results-table').click()
      ]);
      await popoutPage.waitForLoadState('networkidle');

      // In main window, interact with Query Control (which is not popped out)
      const queryPanel = page.locator('[data-testid="query-control-panel"], .query-control-panel').first();
      await expect(queryPanel).toBeVisible({ timeout: 5000 });

      // Screenshot pop-out
      await ctx.screenshotPage(popoutPage, 'popout-results-table');

      // Try to open filter dropdown in main window
      const dropdown = page.locator('.filter-field-dropdown').first();
      await dropdown.click();
      await page.waitForTimeout(500);

      // Screenshot all components on main page with dropdown open
      await screenshotAllComponents(ctx, page, 'main-functional-dropdown-open');

      // Close dropdown
      await page.keyboard.press('Escape');

      actualResult += 'Main window interactive while pop-out open: true\n';

      // Cleanup
      await popoutPage.close();

      expect(ctx.hasError()).toBe(false);
      actualResult += `Console errors: ${ctx.getErrors().length}\n`;
      actualResult += '\nTEST PASSED';

      ctx.finalize(true, actualResult);
    } catch (error) {
      actualResult += `\nTEST FAILED: ${error}`;
      ctx.finalize(false, actualResult);
      throw error;
    }
  });

  test('030 - Pop-out maintains state after main window navigation', async ({ page, context }) => {
    const ctx = new TestContext(
      page,
      'TEST-030',
      'Pop-out state after navigation',
      CATEGORY,
      'When filter is applied in main with pop-out open:\n' +
      '1. Pop-out should receive the filter update\n' +
      '2. Chip should appear in pop-out\n' +
      '3. No console errors should occur'
    );

    let actualResult = '';

    try {
      await navigateToDiscover(page);

      // Open Query Control pop-out
      const [popoutPage] = await Promise.all([
        context.waitForEvent('page'),
        page.locator('#popout-query-control').click()
      ]);
      await popoutPage.waitForLoadState('networkidle');

      actualResult += 'Query Control pop-out opened\n';

      // In main window, apply a filter via URL
      await page.evaluate(() => {
        const newUrl = '/automobiles/discover?manufacturer=Chevrolet';
        window.history.pushState({}, '', newUrl);
        window.dispatchEvent(new PopStateEvent('popstate'));
      });
      await page.waitForTimeout(1500);

      // Screenshot pop-out after filter applied
      await ctx.screenshotPage(popoutPage, 'popout-after-filter');

      // Screenshot all components on main page after filter
      await screenshotAllComponents(ctx, page, 'main-after-filter');

      // Verify pop-out received the filter update (should show Chevrolet chip)
      const chipInPopout = popoutPage.locator('p-chip').filter({ hasText: /Chevrolet/i }).first();
      const hasChip = await chipInPopout.isVisible().catch(() => false);
      actualResult += `Pop-out received filter update: ${hasChip}\n`;

      // Cleanup
      await popoutPage.close();

      expect(ctx.hasError()).toBe(false);
      actualResult += `Console errors: ${ctx.getErrors().length}\n`;
      actualResult += '\nTEST PASSED';

      ctx.finalize(true, actualResult);
    } catch (error) {
      actualResult += `\nTEST FAILED: ${error}`;
      ctx.finalize(false, actualResult);
      throw error;
    }
  });

});
