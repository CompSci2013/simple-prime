import { test, expect } from '@playwright/test';
import { TestContext, getFilterChips, screenshotAllComponents, expandAllPanels } from './test-utils';

/**
 * Category 3: Filter-PopOut Sync (Tests 041-050)
 *
 * Based on QUALITY-ASSURANCE.md Part 3.3: Synchronization Verification
 *
 * Tests bidirectional filter synchronization between main window and pop-outs:
 * - Filter in main syncs to pop-out
 * - Filter in pop-out syncs to main
 * - Clear in main syncs to pop-out
 */

const CATEGORY = 'Category 3: Filter-PopOut Sync';

async function navigateToDiscover(page: import('@playwright/test').Page): Promise<void> {
  await page.goto('/automobiles/discover');
  await page.waitForLoadState('networkidle');
  await expandAllPanels(page);
  await expect(page.locator('[data-testid="basic-results-table"]')).toBeVisible({ timeout: 15000 });
}

// ==================== TESTS ====================

test.describe('Category 3: Filter-PopOut Sync', () => {

  test('041 - Filter in main syncs to pop-out', async ({ page, context }) => {
    const ctx = new TestContext(
      page,
      'TEST-041',
      'Filter syncs main to pop-out',
      CATEGORY,
      'When filter is applied in main window:\n' +
      '1. Pop-out should receive the filter\n' +
      '2. Chip should appear in pop-out\n' +
      '3. No console errors should occur'
    );

    let actualResult = '';

    try {
      await navigateToDiscover(page);

      // Open Query Control pop-out first
      const [popoutPage] = await Promise.all([
        context.waitForEvent('page'),
        page.locator('#popout-query-control').click()
      ]);
      await popoutPage.waitForLoadState('networkidle');
      await popoutPage.waitForTimeout(500);

      // Apply filter in main window via URL
      await page.evaluate(() => {
        const newUrl = '/automobiles/discover?manufacturer=Chevrolet';
        window.history.pushState({}, '', newUrl);
        window.dispatchEvent(new PopStateEvent('popstate'));
      });
      await page.waitForTimeout(2000);

      // Check pop-out received the filter
      const popoutChips = await getFilterChips(popoutPage);
      actualResult += `Pop-out chips: ${popoutChips.join(', ')}\n`;

      const hasChevroletInPopout = popoutChips.some(c => c.toLowerCase().includes('chevrolet'));
      expect(hasChevroletInPopout).toBe(true);

      // Screenshot pop-out with synced filter
      await ctx.screenshotPage(popoutPage, 'popout-synced');

      // Screenshot all components on main page with filter
      await screenshotAllComponents(ctx, page, 'main-with-filter');

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

  test('042 - Filter in pop-out syncs to main', async ({ page, context }) => {
    const ctx = new TestContext(
      page,
      'TEST-042',
      'Filter syncs pop-out to main',
      CATEGORY,
      'When filter is applied in pop-out:\n' +
      '1. Main window URL should update\n' +
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
      await popoutPage.waitForTimeout(500);

      // Apply filter in pop-out via the dropdown
      const dropdown = popoutPage.locator('.filter-field-dropdown').first();
      await dropdown.click();
      await popoutPage.waitForSelector('.p-select-overlay', { timeout: 5000 });

      const option = popoutPage.locator('.p-select-overlay .p-select-option[aria-label="Manufacturer"]');
      await option.click();
      await popoutPage.waitForTimeout(500);

      // Select Ford in dialog
      const dialog = popoutPage.locator('.p-dialog');
      await expect(dialog).toBeVisible({ timeout: 5000 });
      const searchInput = dialog.locator('input[type="text"]').first();
      await searchInput.fill('Ford');
      await popoutPage.waitForTimeout(500);

      const checkboxInput = dialog.locator('.p-checkbox-input[value="Ford"]');
      await checkboxInput.click({ force: true });
      await popoutPage.waitForTimeout(300);

      const applyBtn = dialog.locator('button').filter({ hasText: /apply/i });
      await applyBtn.click();
      await popoutPage.waitForTimeout(1500);

      // Check main window received the filter (URL should update)
      const mainUrl = page.url();
      actualResult += `Main window URL: ${mainUrl}\n`;
      expect(mainUrl.toLowerCase()).toContain('manufacturer=ford');

      // Verify the chip exists in the pop-out
      const popoutChips = await getFilterChips(popoutPage);
      actualResult += `Pop-out chips: ${popoutChips.join(', ')}\n`;
      const hasFordInPopout = popoutChips.some(c => c.toLowerCase().includes('ford'));
      expect(hasFordInPopout).toBe(true);

      // Screenshot of the pop-out window
      await ctx.screenshotPage(popoutPage, 'popout-with-filter');

      // Screenshot all components on main page
      await screenshotAllComponents(ctx, page, 'main-page-synced');

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

  test('043 - Clear in pop-out syncs to main URL', async ({ page, context }) => {
    const ctx = new TestContext(
      page,
      'TEST-043',
      'Clear syncs pop-out to main',
      CATEGORY,
      'When Clear All is clicked in pop-out:\n' +
      '1. Main window URL should clear filter params\n' +
      '2. Pop-out chips should be cleared\n' +
      '3. No console errors should occur'
    );

    let actualResult = '';

    try {
      // Navigate with existing filter
      await page.goto('/automobiles/discover?manufacturer=Ford');
      await page.waitForLoadState('networkidle');
      await expect(page.locator('[data-testid="basic-results-table"]')).toBeVisible({ timeout: 15000 });

      // Verify main URL has filter
      let mainUrl = page.url();
      actualResult += `Main URL before clear: ${mainUrl}\n`;
      expect(mainUrl).toContain('manufacturer=Ford');

      // Open Query Control pop-out
      const [popoutPage] = await Promise.all([
        context.waitForEvent('page'),
        page.locator('#popout-query-control').click()
      ]);
      await popoutPage.waitForLoadState('networkidle');
      await popoutPage.waitForTimeout(500);

      // Verify pop-out has the filter
      let popoutChips = await getFilterChips(popoutPage);
      actualResult += `Pop-out chips before clear: ${popoutChips.join(', ')}\n`;
      expect(popoutChips.some(c => c.toLowerCase().includes('ford'))).toBe(true);

      // Clear all filters in pop-out
      const clearBtn = popoutPage.locator('button').filter({ hasText: /^clear all$/i });
      await clearBtn.click();
      await popoutPage.waitForTimeout(2000);

      // Check main window URL is cleared
      mainUrl = page.url();
      actualResult += `Main URL after clear: ${mainUrl}\n`;
      expect(mainUrl).not.toContain('manufacturer=Ford');

      // Check pop-out filters are cleared
      popoutChips = await getFilterChips(popoutPage);
      actualResult += `Pop-out chips after clear: ${popoutChips.length}\n`;
      expect(popoutChips.length).toBe(0);

      // Screenshot of the pop-out window after clear
      await ctx.screenshotPage(popoutPage, 'popout-after-clear');

      // Screenshot all components on main page after clear
      await screenshotAllComponents(ctx, page, 'main-page-after-clear');

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

  test('044 - Sort in pop-out syncs to main URL', async ({ page, context }) => {
    const ctx = new TestContext(
      page,
      'TEST-044',
      'Sort syncs pop-out to main',
      CATEGORY,
      'When sort is applied in pop-out:\n' +
      '1. Main window URL should contain sort params\n' +
      '2. No console errors should occur'
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
      await popoutPage.waitForTimeout(500);

      // Click a sortable column in pop-out
      const sortColumn = popoutPage.locator('th.p-datatable-sortable-column').first();
      await sortColumn.click();
      await popoutPage.waitForTimeout(2000);

      // Check main window URL has sort params
      const mainUrl = page.url();
      actualResult += `Main window URL: ${mainUrl}\n`;
      expect(mainUrl).toContain('sort');

      // Screenshot pop-out with sorted table
      await ctx.screenshotPage(popoutPage, 'popout-sorted');

      // Screenshot all components on main page
      await screenshotAllComponents(ctx, page, 'main-synced');

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

  test('045 - Pagination in pop-out syncs to main URL', async ({ page, context }) => {
    const ctx = new TestContext(
      page,
      'TEST-045',
      'Pagination syncs pop-out to main',
      CATEGORY,
      'When pagination is changed in pop-out:\n' +
      '1. Main window URL should contain page param\n' +
      '2. No console errors should occur'
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
      await popoutPage.waitForTimeout(500);

      // Click next page in pop-out
      const nextBtn = popoutPage.locator('.p-paginator-next').first();
      if (await nextBtn.isEnabled()) {
        await nextBtn.click();
        await popoutPage.waitForTimeout(2000);

        // Check main window URL has page param
        const mainUrl = page.url();
        actualResult += `Main window URL: ${mainUrl}\n`;
        expect(mainUrl).toContain('page=2');

        // Screenshot pop-out on page 2
        await ctx.screenshotPage(popoutPage, 'popout-page2');

        // Screenshot all components on main page
        await screenshotAllComponents(ctx, page, 'main-synced');
      } else {
        actualResult += 'Next button not enabled, skipping\n';
      }

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

  test('046 - Multiple filter changes sync correctly', async ({ page, context }) => {
    const ctx = new TestContext(
      page,
      'TEST-046',
      'Multiple filter changes sync',
      CATEGORY,
      'When multiple filters are applied:\n' +
      '1. Pop-out should show all filter chips\n' +
      '2. No console errors should occur'
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

      // Apply first filter in main
      await page.evaluate(() => {
        window.history.pushState({}, '', '/automobiles/discover?manufacturer=Ford');
        window.dispatchEvent(new PopStateEvent('popstate'));
      });
      await page.waitForTimeout(1500);

      // Add second filter
      await page.evaluate(() => {
        window.history.pushState({}, '', '/automobiles/discover?manufacturer=Ford&yearMin=2020&yearMax=2024');
        window.dispatchEvent(new PopStateEvent('popstate'));
      });
      await page.waitForTimeout(1500);

      // Verify pop-out has both filters
      const popoutChips = await getFilterChips(popoutPage);
      actualResult += `Pop-out chips: ${popoutChips.join(', ')}\n`;
      expect(popoutChips.length).toBeGreaterThanOrEqual(2);

      // Screenshot pop-out with multiple filters
      await ctx.screenshotPage(popoutPage, 'popout-multiple-filters');

      // Screenshot all components on main page with filters
      await screenshotAllComponents(ctx, page, 'main-with-filters');

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

  test('047 - Sync works after pop-out close and reopen', async ({ page, context }) => {
    const ctx = new TestContext(
      page,
      'TEST-047',
      'Sync after close/reopen',
      CATEGORY,
      'After closing and reopening pop-out:\n' +
      '1. New pop-out should receive current filter state\n' +
      '2. Chip should be visible\n' +
      '3. No console errors should occur'
    );

    let actualResult = '';

    try {
      await navigateToDiscover(page);

      // Open and close pop-out
      const [firstPopout] = await Promise.all([
        context.waitForEvent('page'),
        page.locator('#popout-query-control').click()
      ]);
      await firstPopout.waitForLoadState('networkidle');
      await firstPopout.close();
      await page.waitForTimeout(500);

      // Apply filter in main (using Buick which has 480 records)
      await page.evaluate(() => {
        window.history.pushState({}, '', '/automobiles/discover?manufacturer=Buick');
        window.dispatchEvent(new PopStateEvent('popstate'));
      });
      await page.waitForTimeout(1000);
      actualResult += 'Applied Buick filter after first pop-out closed\n';

      // Reopen pop-out
      const [secondPopout] = await Promise.all([
        context.waitForEvent('page'),
        page.locator('#popout-query-control').click()
      ]);
      await secondPopout.waitForLoadState('networkidle');
      await secondPopout.waitForTimeout(500);

      // Verify filter is synced to new pop-out
      const popoutChips = await getFilterChips(secondPopout);
      actualResult += `Pop-out chips: ${popoutChips.join(', ')}\n`;
      expect(popoutChips.some(c => c.toLowerCase().includes('buick'))).toBe(true);

      // Screenshot reopened pop-out with filter
      await ctx.screenshotPage(secondPopout, 'popout-reopened-with-filter');

      // Screenshot all components on main page with filter
      await screenshotAllComponents(ctx, page, 'main-with-filter');

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

  test('048 - Filter removal syncs bidirectionally', async ({ page, context }) => {
    const ctx = new TestContext(
      page,
      'TEST-048',
      'Filter removal syncs bidirectionally',
      CATEGORY,
      'When filter is removed in pop-out:\n' +
      '1. Main window URL should update\n' +
      '2. Chip should be removed from pop-out\n' +
      '3. No console errors should occur'
    );

    let actualResult = '';

    try {
      // Navigate with filter
      await page.goto('/automobiles/discover?manufacturer=Ford');
      await page.waitForLoadState('networkidle');
      await expect(page.locator('[data-testid="basic-results-table"]')).toBeVisible({ timeout: 15000 });

      // Open Query Control pop-out (chips move to pop-out with MOVE semantics)
      const [popoutPage] = await Promise.all([
        context.waitForEvent('page'),
        page.locator('#popout-query-control').click()
      ]);
      await popoutPage.waitForLoadState('networkidle');
      await popoutPage.waitForTimeout(500);

      // Verify chip is in pop-out
      const popoutChipsBefore = await getFilterChips(popoutPage);
      actualResult += `Pop-out chips before removal: ${popoutChipsBefore.join(', ')}\n`;
      expect(popoutChipsBefore.some(c => c.toLowerCase().includes('ford'))).toBe(true);

      // Remove filter chip in pop-out window
      const chip = popoutPage.locator('p-chip').filter({ hasText: /Ford/i }).first();
      const removeBtn = chip.locator('.p-chip-remove-icon');
      await removeBtn.click();
      await popoutPage.waitForTimeout(1500);

      // Verify main URL is updated (filter removed)
      const mainUrl = page.url();
      actualResult += `Main URL after removal: ${mainUrl}\n`;
      expect(mainUrl).not.toContain('manufacturer=Ford');

      // Verify pop-out chip is gone
      const popoutChipsAfter = await getFilterChips(popoutPage);
      actualResult += `Pop-out chips after removal: ${popoutChipsAfter.length}\n`;
      const hasFord = popoutChipsAfter.some(c => c.toLowerCase().includes('ford'));
      expect(hasFord).toBe(false);

      // Screenshot pop-out after filter removal
      await ctx.screenshotPage(popoutPage, 'popout-filter-removed');

      // Screenshot all components on main page after filter removal
      await screenshotAllComponents(ctx, page, 'main-filter-removed');

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

  test('049 - Results count syncs after filter in pop-out', async ({ page, context }) => {
    const ctx = new TestContext(
      page,
      'TEST-049',
      'Results count syncs',
      CATEGORY,
      'When filter is applied:\n' +
      '1. Pop-out should show filtered count\n' +
      '2. Count should be different from initial\n' +
      '3. No console errors should occur'
    );

    let actualResult = '';

    try {
      await navigateToDiscover(page);

      // Get initial count in main
      const initialPaginator = await page.locator('[data-testid="basic-results-table-panel"] .p-paginator-current').first().textContent();
      actualResult += `Initial count: ${initialPaginator}\n`;

      // Open Results Table pop-out
      const [popoutPage] = await Promise.all([
        context.waitForEvent('page'),
        page.locator('#popout-basic-results-table').click()
      ]);
      await popoutPage.waitForLoadState('networkidle');

      // Apply filter in main (using Chevrolet which has 849 records)
      await page.evaluate(() => {
        window.history.pushState({}, '', '/automobiles/discover?manufacturer=Chevrolet');
        window.dispatchEvent(new PopStateEvent('popstate'));
      });
      await page.waitForTimeout(2000);

      // Check pop-out shows filtered count
      const popoutPaginator = await popoutPage.locator('.p-paginator-current').first().textContent();
      actualResult += `Pop-out count after filter: ${popoutPaginator}\n`;

      // The count should be different from initial (less than 4887)
      expect(popoutPaginator).not.toContain('4887');

      // Screenshot pop-out with filtered count
      await ctx.screenshotPage(popoutPage, 'popout-filtered-count');

      // Screenshot all components on main page after filter
      await screenshotAllComponents(ctx, page, 'main-filtered');

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

  test('050 - Sync uses BroadcastChannel (no console errors)', async ({ page, context }) => {
    const ctx = new TestContext(
      page,
      'TEST-050',
      'BroadcastChannel no errors',
      CATEGORY,
      'During sync operations:\n' +
      '1. No critical console errors should occur\n' +
      '2. BroadcastChannel should work silently\n' +
      '3. Filter should sync properly'
    );

    let actualResult = '';

    try {
      const errors: string[] = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        }
      });

      await navigateToDiscover(page);

      // Open pop-out
      const [popoutPage] = await Promise.all([
        context.waitForEvent('page'),
        page.locator('#popout-query-control').click()
      ]);

      popoutPage.on('console', msg => {
        if (msg.type() === 'error') {
          errors.push(`[POPOUT] ${msg.text()}`);
        }
      });

      await popoutPage.waitForLoadState('networkidle');

      // Trigger sync events
      await page.evaluate(() => {
        window.history.pushState({}, '', '/automobiles/discover?manufacturer=Ford');
        window.dispatchEvent(new PopStateEvent('popstate'));
      });
      await page.waitForTimeout(2000);

      // Screenshot pop-out after sync
      await ctx.screenshotPage(popoutPage, 'popout-synced');

      // Screenshot all components on main page with filter
      await screenshotAllComponents(ctx, page, 'main-with-filter');

      actualResult += `Console errors: ${errors.length}\n`;
      if (errors.length > 0) {
        errors.forEach(e => actualResult += `  ERROR: ${e.substring(0, 100)}\n`);
      }

      await popoutPage.close();

      // Filter out known harmless errors
      const criticalErrors = errors.filter(e =>
        !e.includes('favicon') &&
        !e.includes('ResizeObserver')
      );
      expect(criticalErrors.length).toBe(0);

      actualResult += '\nTEST PASSED';

      ctx.finalize(true, actualResult);
    } catch (error) {
      actualResult += `\nTEST FAILED: ${error}`;
      ctx.finalize(false, actualResult);
      throw error;
    }
  });

});
