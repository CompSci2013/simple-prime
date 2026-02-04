import { test, expect } from '@playwright/test';

test.describe('Agriculture Module Tests', () => {

  // Helper to navigate via Angular router
  async function navigateToAgriculture(page: any) {
    await page.goto('http://localhost:4200/');
    await page.waitForLoadState('networkidle');
    await page.locator('a.domain-card', { hasText: 'Agriculture' }).click({ force: true });
    await page.waitForTimeout(1000);
  }

  async function navigateToAgricultureDiscover(page: any) {
    await navigateToAgriculture(page);
    await page.locator('a.feature-card-link', { hasText: 'Crop Analysis' }).click({ force: true });
    await page.waitForTimeout(1000);
  }

  test('Home page Agriculture button has correct href', async ({ page }) => {
    await page.goto('http://localhost:4200/');
    await page.waitForLoadState('networkidle');

    const agricultureCard = page.locator('a.domain-card', { hasText: 'Agriculture' });
    const href = await agricultureCard.getAttribute('href');
    console.log('Agriculture href:', href);
    expect(href).toBe('/agriculture');
  });

  test('Home page Agriculture button navigates correctly', async ({ page }) => {
    await navigateToAgriculture(page);
    expect(page.url()).toContain('/agriculture');
  });

  test('Agriculture Home page loads and displays correctly', async ({ page }) => {
    await navigateToAgriculture(page);

    // Check header
    const header = page.locator('h2', { hasText: 'Explore Agricultural Data' });
    await expect(header).toBeVisible();

    // Check Crop Analysis card exists
    const cropCard = page.locator('.feature-card', { hasText: 'Crop Analysis' });
    await expect(cropCard).toBeVisible();

    // Check other feature cards
    const soilCard = page.locator('.feature-card', { hasText: 'Soil Data' });
    await expect(soilCard).toBeVisible();
  });

  test('Agriculture Home Crop Analysis button navigates to Discover', async ({ page }) => {
    await navigateToAgricultureDiscover(page);
    console.log('URL after navigating to discover:', page.url());
    expect(page.url()).toContain('/agriculture/discover');
  });

  test('Agriculture Discover page loads and displays data', async ({ page }) => {
    await navigateToAgricultureDiscover(page);

    // Check header
    const header = page.locator('h1', { hasText: 'Agriculture Discovery' });
    await expect(header).toBeVisible();

    // Check that statistics cards appear
    const totalRecordsCard = page.locator('.stat-card', { hasText: 'Total Records' });
    await expect(totalRecordsCard).toBeVisible();

    // Wait for data to load
    await page.waitForTimeout(500);

    // Check that the data table has rows
    const tableRows = page.locator('.p-datatable-tbody tr');
    const rowCount = await tableRows.count();
    console.log('Table row count:', rowCount);
    expect(rowCount).toBeGreaterThan(0);
  });

  test('Agriculture Discover filters work', async ({ page }) => {
    await navigateToAgricultureDiscover(page);
    await page.waitForTimeout(500);

    // Get initial record count
    const statsValue = page.locator('.stat-value').first();
    const initialCount = await statsValue.textContent();
    console.log('Initial count:', initialCount);

    // Click region dropdown
    const regionDropdown = page.locator('#regionFilter').locator('..').locator('.p-dropdown');
    await regionDropdown.click({ force: true });
    await page.waitForTimeout(300);

    // Select Midwest
    const midwestOption = page.locator('.p-dropdown-item', { hasText: 'Midwest' });
    if (await midwestOption.count() > 0) {
      await midwestOption.click({ force: true });
      await page.waitForTimeout(500);

      // Check count changed
      const filteredCount = await statsValue.textContent();
      console.log('Filtered count:', filteredCount);
      // Midwest has 4 records, total is 12
      expect(filteredCount).not.toBe(initialCount);
    }
  });

  test('Menu navigation works for Agriculture', async ({ page }) => {
    await page.goto('http://localhost:4200/');
    await page.waitForLoadState('networkidle');

    // Open domains menu
    const domainsLink = page.locator('a.domains-link');
    await domainsLink.click({ force: true });
    await page.waitForTimeout(300);

    // Hover on Agriculture to show submenu
    const agricultureMenu = page.locator('.p-menuitem-text', { hasText: 'Agriculture' }).first();
    await agricultureMenu.hover();
    await page.waitForTimeout(300);

    // Check submenu items exist
    const agricultureHome = page.locator('.p-menuitem-text', { hasText: 'Agriculture Home' });
    const agricultureDiscover = page.locator('.p-menuitem-text', { hasText: 'Agriculture Discover' });

    expect(await agricultureHome.count()).toBeGreaterThan(0);
    expect(await agricultureDiscover.count()).toBeGreaterThan(0);
  });

  test('Back button on Discover page works', async ({ page }) => {
    await navigateToAgricultureDiscover(page);

    const backButton = page.locator('a.back-button');
    await expect(backButton).toBeVisible();

    await backButton.click({ force: true });
    await page.waitForTimeout(500);

    expect(page.url()).toContain('/agriculture');
    expect(page.url()).not.toContain('/discover');
  });

});
