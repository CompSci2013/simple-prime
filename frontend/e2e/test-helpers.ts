/**
 * Shared Test Helpers
 *
 * Common operations used across E2E tests for the Generic Prime application.
 * These helpers abstract away repetitive interactions and provide consistent behavior.
 */

import { Page, Locator } from '@playwright/test';

// ==================== Navigation Helpers ====================

/**
 * Navigate to the automobile discover page and wait for it to load
 */
export async function navigateToDiscover(page: Page): Promise<void> {
  await page.goto('/automobiles/discover');
  
  // Wait for the main container to load
  await page.waitForSelector('.discover-container', { timeout: 15000 });
  
  // Ensure Query Control panel is visible and expanded
  const panel = page.locator('#panel-query-control');
  await panel.waitFor({ timeout: 10000 });
  
  const expandButton = panel.locator('.panel-actions button').first();
  const buttonHtml = await expandButton.innerHTML();
  
  if (buttonHtml.includes('pi-chevron-right')) {
    console.log('[DEBUG] Query Control panel is collapsed, expanding...');
    await expandButton.click();
    await page.waitForTimeout(500);
  }
  
  // Wait for the query control content to be visible
  await page.waitForSelector('.query-control-panel, [data-testid="query-control-panel"]', { timeout: 10000 });
  
  // Wait for dropdown to be ready
  await page.waitForSelector('.filter-field-dropdown, .p-dropdown', { timeout: 5000 });
  
  // Give Angular time to finish rendering
  await page.waitForTimeout(500);
}

/**
 * Navigate to discover page with pre-applied URL parameters
 */
export async function navigateWithFilters(page: Page, params: Record<string, string>): Promise<void> {
  const queryString = new URLSearchParams(params).toString();
  await page.goto(`/automobiles/discover?${queryString}`);
  await page.waitForSelector('.p-dropdown', { timeout: 10000 });
}

// ==================== Query Control Helpers ====================

/**
 * Open the filter field dropdown
 */
export async function openFilterDropdown(page: Page): Promise<void> {
  const dropdown = page.locator('.filter-field-dropdown, .query-control-panel .p-dropdown').first();
  await dropdown.click();
  await page.waitForSelector('.p-dropdown-items, .p-dropdown-panel', { timeout: 5000 });
}

/**
 * Close the filter dropdown (click outside)
 */
export async function closeFilterDropdown(page: Page): Promise<void> {
  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);
}

/**
 * Get all visible options in the filter dropdown
 */
export async function getDropdownOptions(page: Page): Promise<string[]> {
  const options = page.locator('.p-dropdown-items li');
  const count = await options.count();
  const texts: string[] = [];
  for (let i = 0; i < count; i++) {
    const text = await options.nth(i).textContent();
    texts.push(text?.trim() || '');
  }
  return texts;
}

/**
 * Select a filter option by label using mouse click
 */
export async function selectFilterByClick(page: Page, label: string): Promise<void> {
  await openFilterDropdown(page);
  const option = page.locator('.p-dropdown-items li').filter({ hasText: new RegExp(`^${label}$`) });
  await option.click();
  await page.waitForTimeout(500); // Wait for dialog to open
}

/**
 * Select a filter option by label using keyboard navigation
 */
export async function selectFilterByKeyboard(page: Page, label: string): Promise<void> {
  await openFilterDropdown(page);

  // Get all options to determine how many arrow presses needed
  const options = await getDropdownOptions(page);
  const targetIndex = options.findIndex(opt => opt === label);

  if (targetIndex === -1) {
    throw new Error(`Option "${label}" not found in dropdown. Available: ${options.join(', ')}`);
  }

  // Press ArrowDown to navigate to the target
  for (let i = 0; i <= targetIndex; i++) {
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(50);
  }

  // Press Enter to select
  await page.keyboard.press('Enter');
  await page.waitForTimeout(500); // Wait for dialog to open
}

/**
 * Type in the dropdown filter and select an option
 */
export async function selectFilterWithSearch(page: Page, searchText: string, label: string): Promise<void> {
  await openFilterDropdown(page);

  const filterInput = page.locator('.p-dropdown-filter');
  await filterInput.fill(searchText);
  await page.waitForTimeout(300); // Wait for filter to apply

  // Navigate to and select the option
  const option = page.locator('.p-dropdown-items li').filter({ hasText: new RegExp(`^${label}$`) });
  await option.click();
  await page.waitForTimeout(500);
}

// ==================== Multiselect Dialog Helpers ====================

/**
 * Check if multiselect dialog is visible
 */
export async function isMultiselectDialogVisible(page: Page): Promise<boolean> {
  const dialog = page.locator('.p-dialog').filter({ has: page.locator('.p-checkbox') });
  return await dialog.isVisible().catch(() => false);
}

/**
 * Get the dialog title
 */
export async function getDialogTitle(page: Page): Promise<string> {
  const title = await page.locator('.p-dialog-header, .p-dialog-title').first().textContent();
  return title?.trim() || '';
}

/**
 * Search within multiselect dialog
 */
export async function searchInDialog(page: Page, query: string): Promise<void> {
  const searchInput = page.locator('.p-dialog input[type="text"]').first();
  await searchInput.fill(query);
  await page.waitForTimeout(300);
}

/**
 * Select options in multiselect dialog by their labels
 */
export async function selectDialogOptions(page: Page, labels: string[]): Promise<void> {
  for (const label of labels) {
    const checkbox = page.locator('.p-dialog .p-checkbox').filter({ hasText: label });
    await checkbox.click();
    await page.waitForTimeout(100);
  }
}

/**
 * Get all available options in the multiselect dialog
 */
export async function getDialogOptions(page: Page): Promise<string[]> {
  const options = page.locator('.p-dialog .option-item, .p-dialog .p-checkbox-label');
  const count = await options.count();
  const texts: string[] = [];
  for (let i = 0; i < count; i++) {
    const text = await options.nth(i).textContent();
    texts.push(text?.trim() || '');
  }
  return texts;
}

/**
 * Click Apply button in dialog
 */
export async function clickDialogApply(page: Page): Promise<void> {
  const applyButton = page.locator('.p-dialog button').filter({ hasText: /apply/i });
  await applyButton.click();
  await page.waitForTimeout(500);
}

/**
 * Click Cancel button in dialog
 */
export async function clickDialogCancel(page: Page): Promise<void> {
  const cancelButton = page.locator('.p-dialog button').filter({ hasText: /cancel/i });
  await cancelButton.click();
  await page.waitForTimeout(300);
}

/**
 * Check if dialog is loading
 */
export async function isDialogLoading(page: Page): Promise<boolean> {
  const spinner = page.locator('.p-dialog .p-progressspinner, .p-dialog .loading-state');
  return await spinner.isVisible().catch(() => false);
}

/**
 * Wait for dialog options to load
 */
export async function waitForDialogOptionsLoaded(page: Page, timeout = 10000): Promise<void> {
  // Wait for loading to finish
  await page.waitForFunction(() => {
    const spinner = document.querySelector('.p-dialog .p-progressspinner, .p-dialog .loading-state');
    return !spinner || (spinner as HTMLElement).style.display === 'none';
  }, { timeout });

  // Wait for options to appear
  await page.waitForSelector('.p-dialog .option-item, .p-dialog .p-checkbox', { timeout });
}

// ==================== Year Range Dialog Helpers ====================

/**
 * Check if year range dialog is visible
 */
export async function isYearRangeDialogVisible(page: Page): Promise<boolean> {
  const dialog = page.locator('.p-dialog').filter({ has: page.locator('p-inputnumber') });
  return await dialog.isVisible().catch(() => false);
}

/**
 * Set year range values
 */
export async function setYearRange(page: Page, min?: number, max?: number): Promise<void> {
  if (min !== undefined) {
    const minInput = page.locator('#yearMin input, [id*="yearMin"] input').first();
    await minInput.fill(min.toString());
  }
  if (max !== undefined) {
    const maxInput = page.locator('#yearMax input, [id*="yearMax"] input').first();
    await maxInput.fill(max.toString());
  }
}

// ==================== Filter Chip Helpers ====================

/**
 * Get all active filter chips
 */
export async function getActiveFilterChips(page: Page): Promise<string[]> {
  const chips = page.locator('.filter-chip .p-chip-text, .active-filters .p-chip');
  const count = await chips.count();
  const texts: string[] = [];
  for (let i = 0; i < count; i++) {
    const text = await chips.nth(i).textContent();
    texts.push(text?.trim() || '');
  }
  return texts;
}

/**
 * Check if a specific filter chip exists
 */
export async function hasFilterChip(page: Page, filterLabel: string): Promise<boolean> {
  const chips = await getActiveFilterChips(page);
  return chips.some(chip => chip.toLowerCase().includes(filterLabel.toLowerCase()));
}

/**
 * Click on a filter chip to edit it
 */
export async function clickFilterChip(page: Page, filterLabel: string): Promise<void> {
  const chip = page.locator('.filter-chip, .active-filters .p-chip').filter({ hasText: filterLabel });
  await chip.click();
  await page.waitForTimeout(500);
}

/**
 * Remove a filter chip by clicking its X button
 */
export async function removeFilterChip(page: Page, filterLabel: string): Promise<void> {
  const chip = page.locator('.filter-chip, .active-filters .p-chip').filter({ hasText: filterLabel });
  const removeButton = chip.locator('.p-chip-remove-icon, .pi-times-circle');
  await removeButton.click();
  await page.waitForTimeout(300);
}

/**
 * Click Clear All button
 */
export async function clickClearAll(page: Page): Promise<void> {
  const clearButton = page.locator('button').filter({ hasText: /clear all/i });
  await clearButton.click();
  await page.waitForTimeout(500);
}

/**
 * Check if Clear All button is enabled
 */
export async function isClearAllEnabled(page: Page): Promise<boolean> {
  const clearButton = page.locator('button').filter({ hasText: /clear all/i });
  const isDisabled = await clearButton.getAttribute('disabled');
  return isDisabled === null;
}

// ==================== Results Table Helpers ====================

/**
 * Get the results count from the page
 */
export async function getResultsCount(page: Page): Promise<number> {
  // Try multiple selectors for results count
  const selectors = [
    '.results-count',
    '[data-testid="results-count"]',
    'text=/Showing.*of.*\\d+/'
  ];

  for (const selector of selectors) {
    try {
      const element = page.locator(selector).first();
      const text = await element.textContent({ timeout: 2000 });
      if (text) {
        // Extract number from text like "Showing 1 to 20 of 4887 results"
        const match = text.match(/of\s+(\d+)/i) || text.match(/(\d+)\s+results/i) || text.match(/(\d+)/);
        if (match) {
          return parseInt(match[1], 10);
        }
      }
    } catch {
      continue;
    }
  }

  return -1; // Unable to determine count
}

/**
 * Get table rows (excluding header)
 */
export async function getTableRows(page: Page): Promise<Locator> {
  return page.locator('p-table tbody tr, .p-datatable-tbody tr');
}

/**
 * Get value from a specific column in visible rows
 */
export async function getColumnValues(page: Page, columnIndex: number): Promise<string[]> {
  const rows = await getTableRows(page);
  const count = await rows.count();
  const values: string[] = [];

  for (let i = 0; i < count; i++) {
    const cell = rows.nth(i).locator('td').nth(columnIndex);
    const text = await cell.textContent();
    values.push(text?.trim() || '');
  }

  return values;
}

// ==================== URL Helpers ====================

/**
 * Get current URL parameters
 */
export async function getUrlParams(page: Page): Promise<URLSearchParams> {
  const url = page.url();
  return new URL(url).searchParams;
}

/**
 * Check if URL contains specific parameter
 */
export async function urlHasParam(page: Page, key: string, value?: string): Promise<boolean> {
  const params = await getUrlParams(page);
  if (value === undefined) {
    return params.has(key);
  }
  return params.get(key) === value;
}

/**
 * Wait for URL to contain specific parameter
 */
export async function waitForUrlParam(page: Page, key: string, timeout = 5000): Promise<void> {
  await page.waitForFunction(
    (paramKey) => {
      const params = new URLSearchParams(window.location.search);
      return params.has(paramKey);
    },
    key,
    { timeout }
  );
}

// ==================== Pop-Out Helpers ====================

/**
 * Open a pop-out window for a specific panel
 */
export async function openPopout(page: Page, panelType: 'query-control' | 'results-table' | 'statistics'): Promise<Page> {
  const buttonId = `#popout-${panelType}`;
  const popoutButton = page.locator(buttonId);

  // Create promise to catch new page before clicking
  const popoutPromise = page.context().waitForEvent('page');

  await popoutButton.click();

  const popoutPage = await popoutPromise;
  await popoutPage.waitForLoadState('domcontentloaded');

  return popoutPage;
}

/**
 * Apply filter via URL change (keeps pop-out windows alive)
 */
export async function applyFilterViaUrl(page: Page, params: Record<string, string>): Promise<void> {
  const currentParams = await getUrlParams(page);

  // Merge new params with existing
  for (const [key, value] of Object.entries(params)) {
    currentParams.set(key, value);
  }

  const newUrl = `/automobiles/discover?${currentParams.toString()}`;

  await page.evaluate((url) => {
    window.history.pushState({}, '', url);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }, newUrl);

  await page.waitForTimeout(500); // Wait for state to propagate
}

// ==================== Assertion Helpers ====================

/**
 * Assert that API was called with expected URL pattern
 */
export async function assertApiCalled(
  page: Page,
  urlPattern: string | RegExp,
  options: { method?: string; timeout?: number } = {}
): Promise<void> {
  const { method = 'GET', timeout = 5000 } = options;

  await page.waitForRequest(
    (request) => {
      const matchesUrl = typeof urlPattern === 'string'
        ? request.url().includes(urlPattern)
        : urlPattern.test(request.url());
      return matchesUrl && request.method() === method;
    },
    { timeout }
  );
}

/**
 * Wait for network idle (all API calls complete)
 */
export async function waitForNetworkIdle(page: Page, timeout = 5000): Promise<void> {
  await page.waitForLoadState('networkidle', { timeout });
}

// ==================== Baseline Data Constants ====================

/**
 * Expected baseline data for automobile domain
 * Use these for assertions in tests
 */
export const AUTOMOBILE_BASELINE = {
  TOTAL_RECORDS: 4887,
  CHEVROLET_COUNT: 849,
  FORD_COUNT: 600, // Approximate
  CAMARO_COUNT: 59,
  YEAR_2020_2024_COUNT: 290, // Approximate
  MANUFACTURER_MODEL_COMBINATIONS: 881,
  FILTER_OPTIONS: ['Manufacturer', 'Model', 'Body Class', 'Year'],
} as const;
