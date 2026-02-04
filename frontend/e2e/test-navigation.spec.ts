import { test, expect } from '@playwright/test';

test.describe('Navigation Tests', () => {
  test('Home page Automobiles button navigates correctly', async ({ page }) => {
    await page.goto('http://localhost:4200/');
    await page.waitForLoadState('networkidle');

    const automobilesCard = page.locator('a.domain-card', { hasText: 'Automobiles' });
    const href = await automobilesCard.getAttribute('href');
    console.log('Automobiles href:', href);

    await automobilesCard.click({ force: true });
    await page.waitForTimeout(500);

    expect(page.url()).toContain('/automobiles');
  });

  test('Automobiles page Advanced Search button navigates correctly', async ({ page }) => {
    await page.goto('http://localhost:4200/');
    await page.waitForLoadState('networkidle');
    await page.locator('a.domain-card', { hasText: 'Automobiles' }).click({ force: true });
    await page.waitForTimeout(500);

    const searchCard = page.locator('a.feature-card-link', { hasText: 'Advanced Search' });
    const href = await searchCard.getAttribute('href');
    console.log('Advanced Search href:', href);

    await searchCard.click({ force: true });
    await page.waitForTimeout(500);

    expect(page.url()).toContain('/automobiles/discover');
  });

  test('Menu contains Automobiles and Agriculture (no Developer)', async ({ page }) => {
    await page.goto('http://localhost:4200/');
    await page.waitForLoadState('networkidle');

    // Click the Domains link to open the menu
    const domainsLink = page.locator('a.domains-link');
    await domainsLink.click({ force: true });
    await page.waitForTimeout(300);

    // Check that Automobiles and Agriculture menus exist
    const automobilesMenu = page.locator('.p-menuitem-text', { hasText: 'Automobiles' });
    const agricultureMenu = page.locator('.p-menuitem-text', { hasText: 'Agriculture' });

    expect(await automobilesMenu.count()).toBeGreaterThan(0);
    expect(await agricultureMenu.count()).toBeGreaterThan(0);

    // Verify Developer menu does NOT exist
    const developerMenu = page.locator('.p-menuitem-text', { hasText: 'Developer' });
    expect(await developerMenu.count()).toBe(0);
  });
});
