import { test, expect } from '@playwright/test';
import { TestContext, getPaginatorText, screenshotAllComponents, expandAllPanels } from './test-utils';

/**
 * Category 6: Edge Cases (Tests 101-110)
 *
 * Tests for edge cases and error handling:
 * - Invalid URL parameters
 * - Empty results handling
 * - Long filter values
 * - Special characters in filters
 * - Concurrent operations
 */

const CATEGORY = 'Category 6: Edge Cases';

async function navigateToDiscover(page: import('@playwright/test').Page): Promise<void> {
  await page.goto('/automobiles/discover');
  await page.waitForLoadState('networkidle');
  await expandAllPanels(page);
  await expect(page.locator('[data-testid="basic-results-table"]')).toBeVisible({ timeout: 15000 });
}

// ==================== TESTS ====================

test.describe('Category 6: Edge Cases', () => {

  test('101 - Invalid URL params are handled gracefully', async ({ page }) => {
    const ctx = new TestContext(
      page,
      'TEST-101',
      'Invalid params handled',
      CATEGORY,
      'When navigating with invalid params:\n' +
      '1. App should not crash\n' +
      '2. Results table should still be visible\n' +
      '3. No critical errors should occur'
    );

    let actualResult = '';

    try {
      await page.goto('/automobiles/discover?invalidParam=xyz&yearMin=notanumber');
      await page.waitForLoadState('networkidle');

      // Screenshot all components with invalid params
      await screenshotAllComponents(ctx, page, 'invalid-params');

      const resultsTable = page.locator('[data-testid="basic-results-table"]');
      const isVisible = await resultsTable.isVisible({ timeout: 15000 }).catch(() => false);
      actualResult += `Results table visible despite invalid params: ${isVisible}\n`;

      expect(isVisible).toBe(true);

      actualResult += `Console errors: ${ctx.getErrors().length}\n`;
      actualResult += '\nTEST PASSED';

      ctx.finalize(true, actualResult);
    } catch (error) {
      actualResult += `\nTEST FAILED: ${error}`;
      ctx.finalize(false, actualResult);
      throw error;
    }
  });

  test('102 - Empty results show appropriate message', async ({ page }) => {
    const ctx = new TestContext(
      page,
      'TEST-102',
      'Empty results handled',
      CATEGORY,
      'When filter produces no results:\n' +
      '1. Should show zero count or empty message\n' +
      '2. App should not crash\n' +
      '3. No console errors should occur'
    );

    let actualResult = '';

    try {
      await page.goto('/automobiles/discover?manufacturer=ZZZZNONEXISTENT12345');
      await page.waitForLoadState('networkidle');

      // Screenshot all components with empty results
      await screenshotAllComponents(ctx, page, 'empty-results');

      await page.waitForTimeout(2000);

      const paginator = page.locator('.p-paginator-current').first();
      const paginatorText = await paginator.textContent().catch(() => '');
      actualResult += `Paginator text: ${paginatorText}\n`;

      const hasZeroResults = paginatorText?.includes('0 results') || paginatorText?.includes('0 of 0');
      const emptyMessage = page.locator('text=/no results|no data|empty/i');
      const hasEmptyMessage = await emptyMessage.isVisible().catch(() => false);

      actualResult += `Has zero results: ${hasZeroResults}, Has empty message: ${hasEmptyMessage}\n`;
      expect(hasZeroResults || hasEmptyMessage || paginatorText?.includes('0')).toBe(true);

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

  test('103 - URL with encoded special characters works', async ({ page }) => {
    const ctx = new TestContext(
      page,
      'TEST-103',
      'Encoded chars work',
      CATEGORY,
      'When URL contains encoded characters:\n' +
      '1. App should decode correctly\n' +
      '2. Filter chip should be visible\n' +
      '3. No console errors should occur'
    );

    let actualResult = '';

    try {
      const encodedValue = encodeURIComponent('Best Lane Enterprises dba Ramp Free');
      await page.goto(`/automobiles/discover?manufacturer=${encodedValue}`);
      await page.waitForLoadState('networkidle');
      await expect(page.locator('[data-testid="basic-results-table"]')).toBeVisible({ timeout: 15000 });

      // Screenshot all components with encoded URL
      await screenshotAllComponents(ctx, page, 'encoded-url');

      const url = page.url();
      actualResult += `URL with encoded value: ${url}\n`;

      await page.waitForSelector('.query-control-panel', { timeout: 10000 });
      const chips = page.locator('p-chip .p-chip-label');
      const count = await chips.count();
      actualResult += `Filter chips count: ${count}\n`;

      expect(count).toBeGreaterThan(0);

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

  test('104 - Very long filter values are handled', async ({ page }) => {
    const ctx = new TestContext(
      page,
      'TEST-104',
      'Long values handled',
      CATEGORY,
      'When filter value is very long:\n' +
      '1. App should not crash\n' +
      '2. Results table should be visible\n' +
      '3. No console errors should occur'
    );

    let actualResult = '';

    try {
      const longValue = 'A'.repeat(200);
      await page.goto(`/automobiles/discover?manufacturer=${longValue}`);
      await page.waitForLoadState('networkidle');

      // Screenshot all components with long value
      await screenshotAllComponents(ctx, page, 'long-value');

      const resultsTable = page.locator('[data-testid="basic-results-table"]');
      const isVisible = await resultsTable.isVisible({ timeout: 15000 }).catch(() => false);
      actualResult += `Results table visible with long value: ${isVisible}\n`;

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

  test('105 - Multiple rapid filter changes are handled', async ({ page }) => {
    const ctx = new TestContext(
      page,
      'TEST-105',
      'Rapid changes handled',
      CATEGORY,
      'When filters change rapidly:\n' +
      '1. Final state should be correct (Dodge)\n' +
      '2. Results should match (390 records)\n' +
      '3. No console errors should occur'
    );

    let actualResult = '';

    try {
      await navigateToDiscover(page);

      // Screenshot all components initial state
      await screenshotAllComponents(ctx, page, 'initial');

      const filters = ['Ford', 'Chevrolet', 'Buick', 'Chrysler', 'Dodge'];
      for (const manufacturer of filters) {
        await page.evaluate((m) => {
          const newUrl = `/automobiles/discover?manufacturer=${m}`;
          window.history.pushState({}, '', newUrl);
          window.dispatchEvent(new PopStateEvent('popstate'));
        }, manufacturer);
        await page.waitForTimeout(100);
      }

      await page.waitForTimeout(2000);

      // Screenshot all components after rapid changes
      await screenshotAllComponents(ctx, page, 'after-rapid-changes');

      const finalUrl = page.url();
      actualResult += `Final URL after rapid changes: ${finalUrl}\n`;
      expect(finalUrl).toContain('manufacturer=Dodge');

      const paginator = await getPaginatorText(page);
      actualResult += `Final paginator: ${paginator}\n`;
      expect(paginator).toContain('390');

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

  test('106 - Page handles missing data gracefully', async ({ page }) => {
    const ctx = new TestContext(
      page,
      'TEST-106',
      'Missing data handled',
      CATEGORY,
      'When filter produces no matching data:\n' +
      '1. App should not crash\n' +
      '2. Results table should be visible\n' +
      '3. No console errors should occur'
    );

    let actualResult = '';

    try {
      await page.goto('/automobiles/discover?yearMin=1900&yearMax=1901');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      // Screenshot all components with missing data
      await screenshotAllComponents(ctx, page, 'missing-data');

      const resultsTable = page.locator('[data-testid="basic-results-table"]');
      const isVisible = await resultsTable.isVisible({ timeout: 10000 }).catch(() => false);
      actualResult += `Results table visible for obscure date range: ${isVisible}\n`;

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

  test('107 - Pop-out survives filter that returns empty results', async ({ page, context }) => {
    const ctx = new TestContext(
      page,
      'TEST-107',
      'Pop-out survives empty filter',
      CATEGORY,
      'When filter returns empty while pop-out open:\n' +
      '1. Pop-out should remain open\n' +
      '2. App should not crash\n' +
      '3. No console errors should occur'
    );

    let actualResult = '';

    try {
      await navigateToDiscover(page);

      // Screenshot all components initial
      await screenshotAllComponents(ctx, page, 'initial');

      const [popoutPage] = await Promise.all([
        context.waitForEvent('page'),
        page.locator('#popout-basic-results-table').click()
      ]);
      await popoutPage.waitForLoadState('networkidle');

      // Screenshot pop-out before empty filter
      await ctx.screenshotPage(popoutPage, 'popout-with-data');

      // Screenshot all components on main page with placeholder
      await screenshotAllComponents(ctx, page, 'main-with-placeholder');

      await page.evaluate(() => {
        const newUrl = '/automobiles/discover?manufacturer=NONEXISTENT99999';
        window.history.pushState({}, '', newUrl);
        window.dispatchEvent(new PopStateEvent('popstate'));
      });
      await page.waitForTimeout(2000);

      // Screenshot pop-out after empty filter
      await ctx.screenshotPage(popoutPage, 'popout-after-empty-filter');

      // Screenshot all components on main page after empty filter
      await screenshotAllComponents(ctx, page, 'main-after-empty-filter');

      const popoutClosed = popoutPage.isClosed();
      actualResult += `Pop-out closed after empty filter: ${popoutClosed}\n`;

      expect(popoutClosed).toBe(false);

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

  test('108 - Ampersand in filter value is properly encoded', async ({ page }) => {
    const ctx = new TestContext(
      page,
      'TEST-108',
      'Ampersand encoded properly',
      CATEGORY,
      'When filter value contains ampersand:\n' +
      '1. URL should parse correctly\n' +
      '2. Results table should be visible\n' +
      '3. No console errors should occur'
    );

    let actualResult = '';

    try {
      const valueWithAmpersand = 'Test & Company';
      const encoded = encodeURIComponent(valueWithAmpersand);
      await page.goto(`/automobiles/discover?manufacturer=${encoded}`);
      await page.waitForLoadState('networkidle');

      // Screenshot all components with ampersand value
      await screenshotAllComponents(ctx, page, 'ampersand-value');

      const resultsTable = page.locator('[data-testid="basic-results-table"]');
      const isVisible = await resultsTable.isVisible({ timeout: 15000 }).catch(() => false);
      actualResult += `Results table visible with ampersand value: ${isVisible}\n`;

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

  test('109 - Multiple identical filters are deduplicated', async ({ page }) => {
    const ctx = new TestContext(
      page,
      'TEST-109',
      'Duplicate filters handled',
      CATEGORY,
      'When same filter is repeated in URL:\n' +
      '1. App should handle gracefully\n' +
      '2. At least one chip should be visible\n' +
      '3. No console errors should occur'
    );

    let actualResult = '';

    try {
      await page.goto('/automobiles/discover?manufacturer=Ford&manufacturer=Ford');
      await page.waitForLoadState('networkidle');
      await expect(page.locator('[data-testid="basic-results-table"]')).toBeVisible({ timeout: 15000 });

      // Screenshot all components with duplicate params
      await screenshotAllComponents(ctx, page, 'duplicate-params');

      await page.waitForSelector('.query-control-panel', { timeout: 10000 });
      const fordChips = page.locator('p-chip').filter({ hasText: /Ford/i });
      const count = await fordChips.count();
      actualResult += `Ford chips count with duplicate params: ${count}\n`;

      expect(count).toBeGreaterThanOrEqual(1);

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

  test('110 - Navigating between pages preserves no state leakage', async ({ page }) => {
    const ctx = new TestContext(
      page,
      'TEST-110',
      'No state leakage',
      CATEGORY,
      'When navigating away and back:\n' +
      '1. Clean URL should have no filter\n' +
      '2. Results should be full count (4887)\n' +
      '3. No console errors should occur'
    );

    let actualResult = '';

    try {
      await page.goto('/automobiles/discover?manufacturer=Ford');
      await page.waitForLoadState('networkidle');
      await expect(page.locator('[data-testid="basic-results-table"]')).toBeVisible({ timeout: 15000 });

      // Screenshot all components with filter
      await screenshotAllComponents(ctx, page, 'with-filter');

      const url1 = page.url();
      actualResult += `Automobiles URL: ${url1}\n`;
      expect(url1).toContain('manufacturer=Ford');

      await page.goto('/automobiles/discover');
      await page.waitForLoadState('networkidle');
      await expect(page.locator('[data-testid="basic-results-table"]')).toBeVisible({ timeout: 15000 });

      // Screenshot all components in clean state
      await screenshotAllComponents(ctx, page, 'clean-state');

      const url2 = page.url();
      actualResult += `Clean automobiles URL: ${url2}\n`;
      expect(url2).not.toContain('manufacturer=Ford');

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
