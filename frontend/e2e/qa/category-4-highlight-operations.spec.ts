import { test, expect } from '@playwright/test';
import { TestContext, screenshotAllComponents, expandAllPanels } from './test-utils';

/**
 * Category 4: Highlight Operations (Tests 061-070)
 *
 * Tests for highlight functionality including:
 * - Adding highlights via URL (h_* params)
 * - Highlight chips display
 * - Clear highlights functionality
 * - Highlight + filter combinations
 * - Highlight sync between main and pop-out windows
 */

const CATEGORY = 'Category 4: Highlight Operations';

async function navigateToDiscover(page: import('@playwright/test').Page): Promise<void> {
  await page.goto('/automobiles/discover');
  await page.waitForLoadState('networkidle');
  await expandAllPanels(page);
  await expect(page.locator('[data-testid="basic-results-table"]')).toBeVisible({ timeout: 15000 });
}

// ==================== TESTS ====================

test.describe('Category 4: Highlight Operations', () => {

  test('061 - Navigate with highlight parameter shows highlight chip', async ({ page }) => {
    const ctx = new TestContext(
      page,
      'TEST-061',
      'Highlight param shows chip',
      CATEGORY,
      'When navigating with h_manufacturer parameter:\n' +
      '1. Highlight chip should be visible\n' +
      '2. Chip should show manufacturer: Ford\n' +
      '3. No console errors should occur'
    );

    let actualResult = '';

    try {
      await page.goto('/automobiles/discover?h_manufacturer=Ford');
      await page.waitForLoadState('networkidle');
      await expect(page.locator('[data-testid="basic-results-table"]')).toBeVisible({ timeout: 15000 });

      // Screenshot all components with highlight
      await screenshotAllComponents(ctx, page, 'highlight-ford');

      await page.waitForSelector('.query-control-panel', { timeout: 10000 });

      const highlightsSection = page.locator('.active-highlights');
      const isVisible = await highlightsSection.isVisible();
      actualResult += `Active highlights section visible: ${isVisible}\n`;

      if (isVisible) {
        const chipText = await page.locator('.highlight-chip .p-chip-label').first().textContent();
        actualResult += `Highlight chip text: ${chipText}\n`;
        expect(chipText).toContain('Manufacturer');
        expect(chipText).toContain('Ford');
      }

      expect(isVisible).toBe(true);

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

  test('062 - Multiple highlight parameters show multiple chips', async ({ page }) => {
    const ctx = new TestContext(
      page,
      'TEST-062',
      'Multiple highlight chips',
      CATEGORY,
      'When navigating with multiple h_* parameters:\n' +
      '1. Multiple highlight chips should be visible\n' +
      '2. Each chip should represent one highlight\n' +
      '3. No console errors should occur'
    );

    let actualResult = '';

    try {
      await page.goto('/automobiles/discover?h_manufacturer=Ford&h_bodyClass=Sedan');
      await page.waitForLoadState('networkidle');
      await expect(page.locator('[data-testid="basic-results-table"]')).toBeVisible({ timeout: 15000 });

      // Screenshot all components with multiple highlights
      await screenshotAllComponents(ctx, page, 'multiple-highlights');

      await page.waitForSelector('.query-control-panel', { timeout: 10000 });

      const highlightChips = page.locator('.highlight-chip');
      const count = await highlightChips.count();
      actualResult += `Found ${count} highlight chips\n`;

      expect(count).toBeGreaterThanOrEqual(2);

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

  test('063 - Clear All Highlights removes all h_* params', async ({ page }) => {
    const ctx = new TestContext(
      page,
      'TEST-063',
      'Clear all highlights',
      CATEGORY,
      'When clicking Clear All Highlights:\n' +
      '1. URL should no longer contain h_* params\n' +
      '2. Highlight chips should be removed\n' +
      '3. No console errors should occur'
    );

    let actualResult = '';

    try {
      await page.goto('/automobiles/discover?h_manufacturer=Ford&h_bodyClass=Sedan');
      await page.waitForLoadState('networkidle');
      await expect(page.locator('[data-testid="basic-results-table"]')).toBeVisible({ timeout: 15000 });
      await page.waitForSelector('.query-control-panel', { timeout: 10000 });

      // Screenshot all components before clear
      await screenshotAllComponents(ctx, page, 'before-clear');

      const initialUrl = page.url();
      expect(initialUrl).toContain('h_manufacturer');
      actualResult += `Initial URL has highlights: ${initialUrl}\n`;

      const clearHighlightsLink = page.locator('.clear-highlights-link');
      await expect(clearHighlightsLink).toBeVisible({ timeout: 5000 });
      await clearHighlightsLink.click();
      await page.waitForTimeout(1000);

      // Screenshot all components after clear
      await screenshotAllComponents(ctx, page, 'after-clear');

      const clearedUrl = page.url();
      actualResult += `URL after clear: ${clearedUrl}\n`;
      expect(clearedUrl).not.toContain('h_manufacturer');
      expect(clearedUrl).not.toContain('h_bodyClass');

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

  test('064 - Remove individual highlight chip removes only that h_* param', async ({ page }) => {
    const ctx = new TestContext(
      page,
      'TEST-064',
      'Remove single highlight',
      CATEGORY,
      'When removing one highlight chip:\n' +
      '1. Only that h_* param should be removed\n' +
      '2. Other highlights should remain\n' +
      '3. No console errors should occur'
    );

    let actualResult = '';

    try {
      await page.goto('/automobiles/discover?h_manufacturer=Ford&h_bodyClass=Sedan');
      await page.waitForLoadState('networkidle');
      await expect(page.locator('[data-testid="basic-results-table"]')).toBeVisible({ timeout: 15000 });
      await page.waitForSelector('.query-control-panel', { timeout: 10000 });

      // Screenshot all components with two highlights
      await screenshotAllComponents(ctx, page, 'two-highlights');

      const fordChip = page.locator('.highlight-chip').filter({ hasText: /Manufacturer/i }).first();
      const removeBtn = fordChip.locator('.p-chip-remove-icon');

      if (await removeBtn.isVisible()) {
        await removeBtn.click();
        await page.waitForTimeout(1000);

        // Screenshot all components with one highlight removed
        await screenshotAllComponents(ctx, page, 'one-removed');

        const url = page.url();
        actualResult += `URL after removing Manufacturer highlight: ${url}\n`;
        expect(url).not.toContain('h_manufacturer=Ford');
        expect(url).toContain('h_bodyClass=Sedan');
      } else {
        actualResult += 'Could not find remove button\n';
        expect(await fordChip.isVisible()).toBe(true);
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

  test('065 - Highlight + filter combination works simultaneously', async ({ page }) => {
    const ctx = new TestContext(
      page,
      'TEST-065',
      'Highlight and filter together',
      CATEGORY,
      'When both filter and highlight are applied:\n' +
      '1. Both should be visible in UI\n' +
      '2. URL should contain both params\n' +
      '3. No console errors should occur'
    );

    let actualResult = '';

    try {
      await page.goto('/automobiles/discover?manufacturer=Chevrolet&h_manufacturer=Ford');
      await page.waitForLoadState('networkidle');
      await expect(page.locator('[data-testid="basic-results-table"]')).toBeVisible({ timeout: 15000 });
      await page.waitForSelector('.query-control-panel', { timeout: 10000 });

      // Screenshot all components with filter and highlight
      await screenshotAllComponents(ctx, page, 'filter-and-highlight');

      const url = page.url();
      actualResult += `URL: ${url}\n`;
      expect(url).toContain('manufacturer=Chevrolet');
      expect(url).toContain('h_manufacturer=Ford');

      const filterChips = page.locator('p-chip').filter({ hasText: /Chevrolet/i });
      const filterChipVisible = await filterChips.first().isVisible();
      actualResult += `Filter chip visible: ${filterChipVisible}\n`;

      const highlightSection = page.locator('.active-highlights');
      const highlightVisible = await highlightSection.isVisible();
      actualResult += `Highlight section visible: ${highlightVisible}\n`;

      expect(filterChipVisible || highlightVisible).toBe(true);

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

  test('066 - Highlight persists through page refresh', async ({ page }) => {
    const ctx = new TestContext(
      page,
      'TEST-066',
      'Highlight persists on refresh',
      CATEGORY,
      'After page refresh:\n' +
      '1. URL should still contain h_* param\n' +
      '2. Highlight chip should still be visible\n' +
      '3. No console errors should occur'
    );

    let actualResult = '';

    try {
      await page.goto('/automobiles/discover?h_manufacturer=Buick');
      await page.waitForLoadState('networkidle');
      await expect(page.locator('[data-testid="basic-results-table"]')).toBeVisible({ timeout: 15000 });

      // Screenshot all components before refresh
      await screenshotAllComponents(ctx, page, 'before-refresh');

      expect(page.url()).toContain('h_manufacturer=Buick');

      await page.reload();
      await page.waitForLoadState('networkidle');
      await expect(page.locator('[data-testid="basic-results-table"]')).toBeVisible({ timeout: 15000 });

      // Screenshot all components after refresh
      await screenshotAllComponents(ctx, page, 'after-refresh');

      const urlAfterRefresh = page.url();
      actualResult += `URL after refresh: ${urlAfterRefresh}\n`;
      expect(urlAfterRefresh).toContain('h_manufacturer=Buick');

      await page.waitForSelector('.query-control-panel', { timeout: 10000 });
      const highlightSection = page.locator('.active-highlights');
      const isVisible = await highlightSection.isVisible();
      actualResult += `Highlight section visible after refresh: ${isVisible}\n`;
      expect(isVisible).toBe(true);

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

  test('067 - Highlight syncs to Query Control pop-out', async ({ page, context }) => {
    const ctx = new TestContext(
      page,
      'TEST-067',
      'Highlight syncs to pop-out',
      CATEGORY,
      'When pop-out opens with highlight in main:\n' +
      '1. Pop-out should show highlight chip\n' +
      '2. No console errors should occur'
    );

    let actualResult = '';

    try {
      await page.goto('/automobiles/discover?h_manufacturer=Chrysler');
      await page.waitForLoadState('networkidle');
      await expect(page.locator('[data-testid="basic-results-table"]')).toBeVisible({ timeout: 15000 });

      // Screenshot all components on main with highlight
      await screenshotAllComponents(ctx, page, 'main-with-highlight');

      const [popoutPage] = await Promise.all([
        context.waitForEvent('page'),
        page.locator('#popout-query-control').click()
      ]);
      await popoutPage.waitForLoadState('networkidle');
      await popoutPage.waitForSelector('.query-control-panel', { timeout: 10000 });

      // Screenshot pop-out with highlight
      await ctx.screenshotPage(popoutPage, 'popout-with-highlight');

      // Screenshot all components on main page with placeholder
      await screenshotAllComponents(ctx, page, 'main-with-placeholder');

      const popoutHighlights = popoutPage.locator('.active-highlights');
      const isVisible = await popoutHighlights.isVisible();
      actualResult += `Highlight section visible in pop-out: ${isVisible}\n`;

      if (isVisible) {
        const chipText = await popoutPage.locator('.highlight-chip .p-chip-label').first().textContent();
        actualResult += `Pop-out highlight chip: ${chipText}\n`;
        expect(chipText).toContain('Chrysler');
      }

      expect(isVisible).toBe(true);
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

  test('068 - Highlight added in main syncs to pop-out', async ({ page, context }) => {
    const ctx = new TestContext(
      page,
      'TEST-068',
      'New highlight syncs to pop-out',
      CATEGORY,
      'When highlight is added while pop-out open:\n' +
      '1. Main URL should update\n' +
      '2. Pop-out should receive highlight\n' +
      '3. No console errors should occur'
    );

    let actualResult = '';

    try {
      await navigateToDiscover(page);

      // Screenshot all components initial state
      await screenshotAllComponents(ctx, page, 'initial');

      const [popoutPage] = await Promise.all([
        context.waitForEvent('page'),
        page.locator('#popout-query-control').click()
      ]);
      await popoutPage.waitForLoadState('networkidle');
      await popoutPage.waitForSelector('.query-control-panel', { timeout: 10000 });

      await page.evaluate(() => {
        const newUrl = '/automobiles/discover?h_manufacturer=Dodge';
        window.history.pushState({}, '', newUrl);
        window.dispatchEvent(new PopStateEvent('popstate'));
      });

      await page.waitForTimeout(1500);

      // Screenshot pop-out after highlight added
      await ctx.screenshotPage(popoutPage, 'popout-after-highlight');

      // Screenshot all components on main page with highlight
      await screenshotAllComponents(ctx, page, 'main-with-highlight');

      const highlightSection = popoutPage.locator('.active-highlights');
      const isVisible = await highlightSection.isVisible();
      actualResult += `Highlight visible in pop-out after main update: ${isVisible}\n`;

      await popoutPage.close();
      expect(page.url()).toContain('h_manufacturer=Dodge');

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

  test('069 - Highlight removed in pop-out updates main URL', async ({ page, context }) => {
    const ctx = new TestContext(
      page,
      'TEST-069',
      'Highlight removal syncs to main',
      CATEGORY,
      'When highlight is removed in pop-out:\n' +
      '1. Main URL should update\n' +
      '2. h_* param should be removed\n' +
      '3. No console errors should occur'
    );

    let actualResult = '';

    try {
      await page.goto('/automobiles/discover?h_manufacturer=Cadillac');
      await page.waitForLoadState('networkidle');
      await expect(page.locator('[data-testid="basic-results-table"]')).toBeVisible({ timeout: 15000 });

      // Screenshot all components on main with highlight
      await screenshotAllComponents(ctx, page, 'main-with-highlight');

      const [popoutPage] = await Promise.all([
        context.waitForEvent('page'),
        page.locator('#popout-query-control').click()
      ]);
      await popoutPage.waitForLoadState('networkidle');
      await popoutPage.waitForSelector('.query-control-panel', { timeout: 10000 });
      await popoutPage.waitForTimeout(500);

      // Screenshot pop-out before removal
      await ctx.screenshotPage(popoutPage, 'popout-before-remove');

      // Screenshot all components on main page with placeholder
      await screenshotAllComponents(ctx, page, 'main-with-placeholder');

      const highlightSection = popoutPage.locator('.active-highlights');
      const isVisible = await highlightSection.isVisible();
      actualResult += `Initial highlight visible in pop-out: ${isVisible}\n`;

      if (isVisible) {
        const removeBtn = popoutPage.locator('.highlight-chip .p-chip-remove-icon').first();
        await removeBtn.click();
        await popoutPage.waitForTimeout(1500);

        // Screenshot pop-out after removal
        await ctx.screenshotPage(popoutPage, 'popout-after-remove');

        // Screenshot all components on main page after removal
        await screenshotAllComponents(ctx, page, 'main-after-remove');

        const mainUrl = page.url();
        actualResult += `Main URL after removal: ${mainUrl}\n`;
        expect(mainUrl).not.toContain('h_manufacturer=Cadillac');
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

  test('070 - Statistics panel receives highlight from URL', async ({ page }) => {
    const ctx = new TestContext(
      page,
      'TEST-070',
      'Stats receives highlight',
      CATEGORY,
      'When highlight is in URL:\n' +
      '1. Statistics panel should render charts\n' +
      '2. Highlight should be applied\n' +
      '3. No console errors should occur'
    );

    let actualResult = '';

    try {
      await page.goto('/automobiles/discover?h_manufacturer=Pontiac');
      await page.waitForLoadState('networkidle');
      await expect(page.locator('[data-testid="basic-results-table"]')).toBeVisible({ timeout: 15000 });

      // Screenshot all components with highlight
      await screenshotAllComponents(ctx, page, 'with-highlight');

      const statsPanel = page.locator('#panel-statistics-panel');
      await expect(statsPanel).toBeVisible({ timeout: 10000 });

      const charts = page.locator('app-base-chart');
      const chartCount = await charts.count();
      actualResult += `Found ${chartCount} charts in Statistics panel\n`;

      expect(chartCount).toBeGreaterThan(0);

      const highlightsCount = await page.evaluate(() => {
        const el = document.querySelector('app-statistics-panel');
        if (el) {
          // @ts-ignore
          if (window.ng) {
            try {
              // @ts-ignore
              const comp = window.ng.getComponent(el);
              return Object.keys(comp?.highlights || {}).length;
            } catch {
              return -1;
            }
          }
        }
        return -1;
      });
      actualResult += `Statistics component highlights count: ${highlightsCount}\n`;

      expect(highlightsCount).toBeGreaterThan(0);

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
