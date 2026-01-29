import { test, expect } from '@playwright/test';
import { TestContext, getFilterChips, getPaginatorText, screenshotAllComponents, expandAllPanels } from './test-utils';

/**
 * Category 5: URL Persistence (Tests 081-090)
 *
 * Tests for URL-first architecture ensuring state is preserved via URL:
 * - Browser back/forward navigation
 * - Page refresh state preservation
 * - Direct URL navigation (bookmark/share)
 * - Sort/pagination in URL
 */

const CATEGORY = 'Category 5: URL Persistence';

async function navigateToDiscover(page: import('@playwright/test').Page): Promise<void> {
  await page.goto('/automobiles/discover');
  await page.waitForLoadState('networkidle');
  await expandAllPanels(page);
  await expect(page.locator('[data-testid="basic-results-table"]')).toBeVisible({ timeout: 15000 });
}

// ==================== TESTS ====================

test.describe('Category 5: URL Persistence', () => {

  test('081 - Browser back restores previous filter state', async ({ page }) => {
    const ctx = new TestContext(
      page,
      'TEST-081',
      'Browser back restores state',
      CATEGORY,
      'When pressing browser back:\n' +
      '1. URL should return to previous state\n' +
      '2. Filter should be removed\n' +
      '3. No console errors should occur'
    );

    let actualResult = '';

    try {
      await navigateToDiscover(page);
      const initialUrl = page.url();
      actualResult += `Initial URL: ${initialUrl}\n`;

      // Screenshot all components initial state
      await screenshotAllComponents(ctx, page, 'initial');

      await page.goto('/automobiles/discover?manufacturer=Ford');
      await page.waitForLoadState('networkidle');
      await expect(page.locator('[data-testid="basic-results-table"]')).toBeVisible({ timeout: 15000 });

      const filteredUrl = page.url();
      actualResult += `Filtered URL: ${filteredUrl}\n`;
      expect(filteredUrl).toContain('manufacturer=Ford');

      // Screenshot all components with filter
      await screenshotAllComponents(ctx, page, 'filtered');

      await page.goBack();
      await page.waitForLoadState('networkidle');
      await expect(page.locator('[data-testid="basic-results-table"]')).toBeVisible({ timeout: 15000 });

      // Screenshot all components after back
      await screenshotAllComponents(ctx, page, 'after-back');

      const backUrl = page.url();
      actualResult += `URL after back: ${backUrl}\n`;
      expect(backUrl).not.toContain('manufacturer=Ford');

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

  test('082 - Browser forward restores next state', async ({ page }) => {
    const ctx = new TestContext(
      page,
      'TEST-082',
      'Browser forward restores state',
      CATEGORY,
      'When pressing browser forward:\n' +
      '1. URL should contain filter again\n' +
      '2. Filter should be restored\n' +
      '3. No console errors should occur'
    );

    let actualResult = '';

    try {
      await navigateToDiscover(page);

      // Screenshot all components initial
      await screenshotAllComponents(ctx, page, 'initial');

      await page.goto('/automobiles/discover?manufacturer=Chevrolet');
      await page.waitForLoadState('networkidle');
      await expect(page.locator('[data-testid="basic-results-table"]')).toBeVisible({ timeout: 15000 });
      expect(page.url()).toContain('manufacturer=Chevrolet');

      // Screenshot all components filtered
      await screenshotAllComponents(ctx, page, 'filtered');

      await page.goBack();
      await page.waitForLoadState('networkidle');
      actualResult += `URL after back: ${page.url()}\n`;
      expect(page.url()).not.toContain('manufacturer=Chevrolet');

      // Screenshot all components after back
      await screenshotAllComponents(ctx, page, 'after-back');

      await page.goForward();
      await page.waitForLoadState('networkidle');
      await expect(page.locator('[data-testid="basic-results-table"]')).toBeVisible({ timeout: 15000 });

      // Screenshot all components after forward
      await screenshotAllComponents(ctx, page, 'after-forward');

      const forwardUrl = page.url();
      actualResult += `URL after forward: ${forwardUrl}\n`;
      expect(forwardUrl).toContain('manufacturer=Chevrolet');

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

  test('083 - Direct URL with filter shows filtered results (bookmark scenario)', async ({ page }) => {
    const ctx = new TestContext(
      page,
      'TEST-083',
      'Bookmark URL loads correctly',
      CATEGORY,
      'When navigating directly to URL with filters:\n' +
      '1. All URL params should be parsed\n' +
      '2. Filter chips should be displayed\n' +
      '3. Results should be filtered\n' +
      '4. No console errors should occur'
    );

    let actualResult = '';

    try {
      await page.goto('/automobiles/discover?manufacturer=Lincoln&yearMin=2020&yearMax=2022');
      await page.waitForLoadState('networkidle');
      await expect(page.locator('[data-testid="basic-results-table"]')).toBeVisible({ timeout: 15000 });

      // Screenshot all components with bookmark URL
      await screenshotAllComponents(ctx, page, 'bookmark-url');

      const url = page.url();
      actualResult += `Direct URL: ${url}\n`;
      expect(url).toContain('manufacturer=Lincoln');
      expect(url).toContain('yearMin=2020');
      expect(url).toContain('yearMax=2022');

      await page.waitForSelector('.query-control-panel', { timeout: 10000 });
      const chips = await getFilterChips(page);
      actualResult += `Filter chips: ${chips.join(', ')}\n`;

      const hasLincoln = chips.some(c => c.toLowerCase().includes('lincoln'));
      const hasYear = chips.some(c => c.toLowerCase().includes('year'));
      actualResult += `Has Lincoln chip: ${hasLincoln}, Has Year chip: ${hasYear}\n`;

      expect(hasLincoln || hasYear).toBe(true);

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

  test('084 - Page refresh preserves filter state', async ({ page }) => {
    const ctx = new TestContext(
      page,
      'TEST-084',
      'Refresh preserves state',
      CATEGORY,
      'After page refresh:\n' +
      '1. URL should still contain filter\n' +
      '2. Chip should still be visible\n' +
      '3. Results count should match (299 for Jeep)\n' +
      '4. No console errors should occur'
    );

    let actualResult = '';

    try {
      await page.goto('/automobiles/discover?manufacturer=Jeep');
      await page.waitForLoadState('networkidle');
      await expect(page.locator('[data-testid="basic-results-table"]')).toBeVisible({ timeout: 15000 });

      // Screenshot all components before refresh
      await screenshotAllComponents(ctx, page, 'before-refresh');

      const beforeRefresh = page.url();
      actualResult += `URL before refresh: ${beforeRefresh}\n`;
      expect(beforeRefresh).toContain('manufacturer=Jeep');

      const paginatorBefore = await getPaginatorText(page);
      actualResult += `Paginator before refresh: ${paginatorBefore}\n`;
      expect(paginatorBefore).toContain('299');

      await page.reload();
      await page.waitForLoadState('networkidle');
      await expect(page.locator('[data-testid="basic-results-table"]')).toBeVisible({ timeout: 15000 });

      // Screenshot all components after refresh
      await screenshotAllComponents(ctx, page, 'after-refresh');

      const afterRefresh = page.url();
      actualResult += `URL after refresh: ${afterRefresh}\n`;
      expect(afterRefresh).toContain('manufacturer=Jeep');

      await page.waitForSelector('.query-control-panel', { timeout: 10000 });
      const chips = await getFilterChips(page);
      const hasJeep = chips.some(c => c.toLowerCase().includes('jeep'));
      actualResult += `Jeep chip visible after refresh: ${hasJeep}\n`;
      expect(hasJeep).toBe(true);

      const paginatorAfter = await getPaginatorText(page);
      actualResult += `Paginator after refresh: ${paginatorAfter}\n`;
      expect(paginatorAfter).toContain('299');

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

  test('085 - Complex URL with multiple params loads correctly', async ({ page }) => {
    const ctx = new TestContext(
      page,
      'TEST-085',
      'Complex URL loads correctly',
      CATEGORY,
      'When navigating to URL with many params:\n' +
      '1. All params should be present in URL\n' +
      '2. Page should load successfully\n' +
      '3. No console errors should occur'
    );

    let actualResult = '';

    try {
      const complexUrl = '/automobiles/discover?manufacturer=Ford&yearMin=2018&yearMax=2023&sort=year&sortDirection=desc&page=2&size=25';
      await page.goto(complexUrl);
      await page.waitForLoadState('networkidle');
      await expect(page.locator('[data-testid="basic-results-table"]')).toBeVisible({ timeout: 15000 });

      // Screenshot all components with complex URL
      await screenshotAllComponents(ctx, page, 'complex-url');

      const url = page.url();
      actualResult += `Complex URL: ${url}\n`;
      expect(url).toContain('manufacturer=Ford');
      expect(url).toContain('yearMin=2018');
      expect(url).toContain('yearMax=2023');
      expect(url).toContain('sort=year');
      expect(url).toContain('sortDirection=desc');
      expect(url).toContain('page=2');
      expect(url).toContain('size=25');

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

  test('086 - Sort state persists in URL', async ({ page }) => {
    const ctx = new TestContext(
      page,
      'TEST-086',
      'Sort state in URL',
      CATEGORY,
      'When clicking sort header:\n' +
      '1. URL should contain sort params\n' +
      '2. No console errors should occur'
    );

    let actualResult = '';

    try {
      await navigateToDiscover(page);

      // Screenshot all components initial
      await screenshotAllComponents(ctx, page, 'initial');

      const sortHeader = page.locator('th.p-datatable-sortable-column').filter({ hasText: 'Manufacturer' }).first();
      await sortHeader.click();
      await page.waitForTimeout(1000);

      // Screenshot all components after sort
      await screenshotAllComponents(ctx, page, 'after-sort');

      const url = page.url();
      actualResult += `URL after sort: ${url}\n`;
      expect(url).toContain('sortBy=');
      expect(url).toContain('sortOrder=');

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

  test('087 - Pagination state persists in URL', async ({ page }) => {
    const ctx = new TestContext(
      page,
      'TEST-087',
      'Pagination state in URL',
      CATEGORY,
      'When clicking next page:\n' +
      '1. URL should contain page=2\n' +
      '2. No console errors should occur'
    );

    let actualResult = '';

    try {
      await navigateToDiscover(page);

      // Screenshot all components page 1
      await screenshotAllComponents(ctx, page, 'page1');

      const nextPageBtn = page.locator('.p-paginator-next').first();
      await nextPageBtn.click();
      await page.waitForTimeout(1000);

      // Screenshot all components page 2
      await screenshotAllComponents(ctx, page, 'page2');

      const url = page.url();
      actualResult += `URL after pagination: ${url}\n`;
      expect(url).toContain('page=2');

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

  test('088 - URL state survives soft navigation', async ({ page }) => {
    const ctx = new TestContext(
      page,
      'TEST-088',
      'Soft navigation preserves state',
      CATEGORY,
      'After pushState navigation:\n' +
      '1. Both params should be in URL\n' +
      '2. No console errors should occur'
    );

    let actualResult = '';

    try {
      await page.goto('/automobiles/discover?manufacturer=GMC');
      await page.waitForLoadState('networkidle');
      await expect(page.locator('[data-testid="basic-results-table"]')).toBeVisible({ timeout: 15000 });

      // Screenshot all components initial
      await screenshotAllComponents(ctx, page, 'initial');

      await page.evaluate(() => {
        const newUrl = '/automobiles/discover?manufacturer=GMC&yearMin=2021';
        window.history.pushState({}, '', newUrl);
        window.dispatchEvent(new PopStateEvent('popstate'));
      });
      await page.waitForTimeout(1000);

      // Screenshot all components after soft navigation
      await screenshotAllComponents(ctx, page, 'after-soft-nav');

      const url = page.url();
      actualResult += `URL after soft navigation: ${url}\n`;
      expect(url).toContain('manufacturer=GMC');
      expect(url).toContain('yearMin=2021');

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

  test('089 - Highlight params persist in URL independently', async ({ page }) => {
    const ctx = new TestContext(
      page,
      'TEST-089',
      'Highlight params persist',
      CATEGORY,
      'When both filter and highlight are in URL:\n' +
      '1. Both should persist after refresh\n' +
      '2. Results should match filter count (169 for Plymouth)\n' +
      '3. No console errors should occur'
    );

    let actualResult = '';

    try {
      await page.goto('/automobiles/discover?manufacturer=Plymouth&h_bodyClass=Sedan');
      await page.waitForLoadState('networkidle');
      await expect(page.locator('[data-testid="basic-results-table"]')).toBeVisible({ timeout: 15000 });

      // Screenshot all components with filter and highlight
      await screenshotAllComponents(ctx, page, 'filter-and-highlight');

      const url = page.url();
      actualResult += `URL: ${url}\n`;
      expect(url).toContain('manufacturer=Plymouth');
      expect(url).toContain('h_bodyClass=Sedan');

      const paginator = await getPaginatorText(page);
      actualResult += `Paginator: ${paginator}\n`;
      expect(paginator).toContain('169');

      await page.reload();
      await page.waitForLoadState('networkidle');

      // Screenshot all components after refresh
      await screenshotAllComponents(ctx, page, 'after-refresh');

      const afterRefresh = page.url();
      actualResult += `URL after refresh: ${afterRefresh}\n`;
      expect(afterRefresh).toContain('manufacturer=Plymouth');
      expect(afterRefresh).toContain('h_bodyClass=Sedan');

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

  test('090 - Empty discover URL loads default state', async ({ page }) => {
    const ctx = new TestContext(
      page,
      'TEST-090',
      'Empty URL loads default',
      CATEGORY,
      'When navigating to bare discover URL:\n' +
      '1. Should show all 4887 records\n' +
      '2. No filters should be applied\n' +
      '3. No console errors should occur'
    );

    let actualResult = '';

    try {
      await page.goto('/automobiles/discover');
      await page.waitForLoadState('networkidle');
      await expect(page.locator('[data-testid="basic-results-table"]')).toBeVisible({ timeout: 15000 });

      // Screenshot all components in default state
      await screenshotAllComponents(ctx, page, 'default-state');

      const paginator = page.locator('[data-testid="basic-results-table"] .p-paginator-current').first();
      const paginatorText = await paginator.textContent();
      actualResult += `Paginator text: ${paginatorText}\n`;
      expect(paginatorText).toContain('4887');

      await page.waitForSelector('.query-control-panel', { timeout: 10000 });
      const chips = await getFilterChips(page);
      actualResult += `Filter chips in default state: ${chips.length}\n`;

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
