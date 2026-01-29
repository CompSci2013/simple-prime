import { Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Shared test utilities for QA E2E tests
 *
 * Each test gets its own directory containing:
 * - screenshots/*.png - Screenshots at key states
 * - api-calls.json - All API calls with request/response data
 * - console-errors.json - Console errors captured during test
 * - expected.txt - Description of expected behavior
 * - actual.txt - Description of actual result
 */

export interface ConsoleMessage {
  timestamp: string;
  type: string;
  text: string;
}

export interface ApiCall {
  timestamp: string;
  url: string;
  method: string;
  status?: number;
  requestHeaders?: Record<string, string>;
  responseHeaders?: Record<string, string>;
  responseData?: unknown;
  duration?: number;
}

export interface TestResult {
  testId: string;
  testName: string;
  category: string;
  startTime: string;
  endTime?: string;
  passed: boolean;
  expected: string;
  actual: string;
  consoleLogs: ConsoleMessage[];
  apiCalls: ApiCall[];
  screenshots: string[];
  errors: string[];
}

const OUTPUT_BASE = 'test-results';

export class TestContext {
  private consoleLogs: ConsoleMessage[] = [];
  private apiCalls: ApiCall[] = [];
  private screenshots: string[] = [];
  private testDir: string;
  private screenshotDir: string;
  private startTime: Date;
  private requestTimings: Map<string, number> = new Map();

  constructor(
    private page: Page,
    private testId: string,
    private testName: string,
    private category: string,
    private expectedResult: string
  ) {
    this.startTime = new Date();
    this.testDir = path.join(OUTPUT_BASE, testId);
    this.screenshotDir = path.join(this.testDir, 'screenshots');

    // Create directories
    fs.mkdirSync(this.screenshotDir, { recursive: true });

    // Write expected result
    fs.writeFileSync(
      path.join(this.testDir, 'expected.txt'),
      expectedResult
    );

    this.setupListeners();
  }

  private setupListeners(): void {
    // Capture console messages
    this.page.on('console', msg => {
      this.consoleLogs.push({
        timestamp: new Date().toISOString(),
        type: msg.type(),
        text: msg.text()
      });
    });

    // Track request start times
    this.page.on('request', request => {
      if (request.url().includes('/api/')) {
        this.requestTimings.set(request.url() + request.method(), Date.now());
      }
    });

    // Capture API responses with full data
    this.page.on('response', async response => {
      if (response.url().includes('/api/')) {
        const key = response.url() + response.request().method();
        const startTime = this.requestTimings.get(key);
        const duration = startTime ? Date.now() - startTime : undefined;

        let responseData: unknown = null;
        try {
          const contentType = response.headers()['content-type'] || '';
          if (contentType.includes('application/json')) {
            responseData = await response.json();
          }
        } catch {
          // Not JSON or failed to parse
        }

        const requestHeaders: Record<string, string> = {};
        const reqHeaders = response.request().headers();
        for (const [k, v] of Object.entries(reqHeaders)) {
          if (!k.toLowerCase().includes('cookie') && !k.toLowerCase().includes('authorization')) {
            requestHeaders[k] = v;
          }
        }

        const responseHeaders: Record<string, string> = {};
        const respHeaders = response.headers();
        for (const [k, v] of Object.entries(respHeaders)) {
          responseHeaders[k] = v;
        }

        this.apiCalls.push({
          timestamp: new Date().toISOString(),
          url: response.url(),
          method: response.request().method(),
          status: response.status(),
          requestHeaders,
          responseHeaders,
          responseData,
          duration
        });
      }
    });
  }

  async screenshot(name: string): Promise<void> {
    // Inject URL bar before screenshot
    await this.injectUrlBar(this.page);

    const filename = `${name}.png`;
    const filepath = path.join(this.screenshotDir, filename);
    await this.page.screenshot({ path: filepath, fullPage: true });
    this.screenshots.push(filename);
  }

  async screenshotPage(targetPage: Page, name: string): Promise<void> {
    // Inject URL bar before screenshot on the target page
    await this.injectUrlBar(targetPage);

    const filename = `${name}.png`;
    const filepath = path.join(this.screenshotDir, filename);
    await targetPage.screenshot({ path: filepath, fullPage: true });
    this.screenshots.push(filename);
  }

  private async injectUrlBar(targetPage: Page): Promise<void> {
    await targetPage.evaluate((url) => {
      const existing = document.getElementById('e2e-url-bar');
      if (existing) existing.remove();
      const div = document.createElement('div');
      div.id = 'e2e-url-bar';
      div.style.cssText = 'background: #333; color: #0f0; padding: 8px 12px; font-family: monospace; font-size: 12px; position: fixed; top: 0; left: 0; width: 100%; z-index: 999999; box-shadow: 0 2px 4px rgba(0,0,0,0.3);';
      div.innerText = `URL: ${url}`;
      document.body.style.marginTop = '32px';
      document.body.insertBefore(div, document.body.firstChild);
    }, targetPage.url());
  }

  clear(): void {
    this.consoleLogs = [];
    this.apiCalls = [];
  }

  hasError(): boolean {
    return this.consoleLogs.some(m => m.type === 'error');
  }

  getErrors(): ConsoleMessage[] {
    return this.consoleLogs.filter(m => m.type === 'error');
  }

  getApiCalls(): ApiCall[] {
    return [...this.apiCalls];
  }

  /**
   * Finalize the test - write all collected data to files
   */
  finalize(passed: boolean, actualResult: string): void {
    const endTime = new Date();

    // Write actual result
    fs.writeFileSync(
      path.join(this.testDir, 'actual.txt'),
      actualResult
    );

    // Write API calls
    fs.writeFileSync(
      path.join(this.testDir, 'api-calls.json'),
      JSON.stringify(this.apiCalls, null, 2)
    );

    // Write console errors (filter to errors only)
    const errors = this.getErrors();
    fs.writeFileSync(
      path.join(this.testDir, 'console-errors.json'),
      JSON.stringify(errors, null, 2)
    );

    // Write full console log
    fs.writeFileSync(
      path.join(this.testDir, 'console-log.json'),
      JSON.stringify(this.consoleLogs, null, 2)
    );

    // Write test metadata/summary
    const result: TestResult = {
      testId: this.testId,
      testName: this.testName,
      category: this.category,
      startTime: this.startTime.toISOString(),
      endTime: endTime.toISOString(),
      passed,
      expected: fs.readFileSync(path.join(this.testDir, 'expected.txt'), 'utf-8'),
      actual: actualResult,
      consoleLogs: this.consoleLogs,
      apiCalls: this.apiCalls,
      screenshots: this.screenshots,
      errors: errors.map(e => e.text)
    };

    fs.writeFileSync(
      path.join(this.testDir, 'result.json'),
      JSON.stringify(result, null, 2)
    );

    // Log summary to console
    console.log(`[${this.testId}] Test ${passed ? 'PASSED' : 'FAILED'}`);
    console.log(`[${this.testId}] API calls: ${this.apiCalls.length}`);
    console.log(`[${this.testId}] Console errors: ${errors.length}`);
    console.log(`[${this.testId}] Screenshots: ${this.screenshots.length}`);
    console.log(`[${this.testId}] Output: ${this.testDir}`);
  }
}

// Helper functions used across tests

export async function getUrlParams(page: Page): Promise<URLSearchParams> {
  return new URL(page.url()).searchParams;
}

export async function getFilterChips(page: Page): Promise<string[]> {
  const chips = page.locator('p-chip');
  const count = await chips.count();
  const texts: string[] = [];
  for (let i = 0; i < count; i++) {
    const text = await chips.nth(i).textContent();
    texts.push(text?.trim() || '');
  }
  return texts;
}

export async function getPaginatorText(page: Page): Promise<string> {
  const paginator = page.locator('.p-paginator-current').first();
  return await paginator.textContent() || '';
}

export async function openFilterDropdown(page: Page): Promise<void> {
  const dropdown = page.locator('.filter-field-dropdown').first();
  await dropdown.click();
  await page.waitForSelector('.p-select-overlay, .p-dropdown-panel', { timeout: 5000 });
}

export async function selectFilterOption(page: Page, optionText: string): Promise<void> {
  const option = page.locator(`.p-select-overlay .p-select-option[aria-label="${optionText}"]`);
  await option.click();
  await page.waitForTimeout(500);
}

export async function applyMultiselectFilter(page: Page, value: string): Promise<void> {
  const dialog = page.locator('.p-dialog');

  const searchInput = dialog.locator('input[type="text"]').first();
  await searchInput.fill(value);
  await page.waitForTimeout(500);

  const checkboxInput = dialog.locator(`.p-checkbox-input[value="${value}"]`);
  if (await checkboxInput.isVisible().catch(() => false)) {
    await checkboxInput.click({ force: true });
    await page.waitForTimeout(300);
  } else {
    const label = dialog.locator('label').filter({ hasText: new RegExp(`^${value}$`) }).first();
    await label.click();
    await page.waitForTimeout(300);
  }

  const applyBtn = dialog.locator('button').filter({ hasText: /apply/i });
  await applyBtn.click();
  await page.waitForTimeout(1000);
}

export async function applyYearRangeFilter(page: Page, minYear?: number, maxYear?: number): Promise<void> {
  const dialog = page.locator('.p-dialog');

  if (minYear !== undefined) {
    const minInput = dialog.locator('input').first();
    await minInput.fill(minYear.toString());
  }

  if (maxYear !== undefined) {
    const maxInput = dialog.locator('input').nth(1);
    await maxInput.fill(maxYear.toString());
  }

  const applyBtn = dialog.locator('button').filter({ hasText: /apply/i });
  await applyBtn.click();
  await page.waitForTimeout(1000);
}

/**
 * Expand all collapsed panels on the discover page
 * Panels may be collapsed by user preference - we need to expand them for testing
 */
export async function expandAllPanels(page: Page): Promise<void> {
  const panelsToExpand = [
    { id: '#panel-query-control', selector: '[data-testid="query-control-panel"]' },
    { id: '#panel-query-panel', selector: '[data-testid="query-panel"]' },
    { id: '#panel-basic-results-table', selector: '[data-testid="basic-results-table"]' },
    { id: '#panel-manufacturer-model-picker', selector: '[data-testid="picker-panel"]' },
    { id: '#panel-statistics-panel', selector: '[data-testid="statistics-panel"]' },
  ];

  for (const panel of panelsToExpand) {
    const panelWrapper = page.locator(panel.id);
    const collapseBtn = panelWrapper.locator('.panel-header button.p-button-text').first();
    const content = page.locator(panel.selector);

    // If the content isn't visible, the panel is collapsed - click to expand
    if (!(await content.isVisible().catch(() => false))) {
      await collapseBtn.click();
      await page.waitForTimeout(300);
    }
  }
}

/**
 * Component selectors for the 5 main components on the discover page
 */
const COMPONENT_SELECTORS = {
  queryControl: '[data-testid="query-control-panel"], .query-control-panel, #panel-query-control',
  queryPanel: '[data-testid="query-panel"], .query-panel, #panel-query-panel',
  resultsTable: '[data-testid="basic-results-table"], #panel-basic-results-table',
  manufacturerModelPicker: '[data-testid="manufacturer-model-picker"], .manufacturer-model-picker, #panel-manufacturer-model-picker',
  statistics: '[data-testid="statistics-panel"], #panel-statistics-panel, app-statistics-panel'
};

/**
 * Screenshot all 6 required images:
 * 1. Main page overview
 * 2. Query Control component
 * 3. Query Panel component
 * 4. Results Table component
 * 5. Manufacturer-Model Picker component
 * 6. Statistics component
 */
export async function screenshotAllComponents(
  ctx: TestContext,
  page: Page,
  prefix: string
): Promise<void> {
  // 1. Main page overview (full page)
  await ctx.screenshot(`${prefix}-01-main-page`);

  // 2. Query Control - scroll into view and screenshot
  const queryControl = page.locator(COMPONENT_SELECTORS.queryControl).first();
  if (await queryControl.isVisible().catch(() => false)) {
    await queryControl.scrollIntoViewIfNeeded();
    await ctx.screenshot(`${prefix}-02-query-control`);
  }

  // 3. Query Panel - scroll into view and screenshot
  const queryPanel = page.locator(COMPONENT_SELECTORS.queryPanel).first();
  if (await queryPanel.isVisible().catch(() => false)) {
    await queryPanel.scrollIntoViewIfNeeded();
    await ctx.screenshot(`${prefix}-03-query-panel`);
  }

  // 4. Results Table - scroll into view and screenshot
  const resultsTable = page.locator(COMPONENT_SELECTORS.resultsTable).first();
  if (await resultsTable.isVisible().catch(() => false)) {
    await resultsTable.scrollIntoViewIfNeeded();
    await ctx.screenshot(`${prefix}-04-results-table`);
  }

  // 5. Manufacturer-Model Picker - scroll into view and screenshot
  const mmPicker = page.locator(COMPONENT_SELECTORS.manufacturerModelPicker).first();
  if (await mmPicker.isVisible().catch(() => false)) {
    await mmPicker.scrollIntoViewIfNeeded();
    await ctx.screenshot(`${prefix}-05-manufacturer-model-picker`);
  }

  // 6. Statistics - scroll into view and screenshot
  const statistics = page.locator(COMPONENT_SELECTORS.statistics).first();
  if (await statistics.isVisible().catch(() => false)) {
    await statistics.scrollIntoViewIfNeeded();
    await ctx.screenshot(`${prefix}-06-statistics`);
  }
}

/**
 * Screenshot all components for a pop-out page
 * Takes screenshot of the pop-out content
 */
export async function screenshotPopout(
  ctx: TestContext,
  popoutPage: Page,
  name: string
): Promise<void> {
  await ctx.screenshotPage(popoutPage, name);
}
