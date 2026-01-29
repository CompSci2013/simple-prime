/**
 * Global Test Setup - Automatic Console, Network, and API Capture
 *
 * This file provides fixtures that automatically capture all console logs,
 * network traffic, and API calls (with response data) for every test.
 *
 * Features:
 * - Automatically captures console logs (log, warn, error, info, debug)
 * - Automatically captures all network requests and responses
 * - Captures API response bodies (JSON data)
 * - Tracks pop-out windows and captures their logs too
 * - Prints summary after each test
 * - Attaches logs to test report on failure
 *
 * Usage:
 *   import { test, expect } from './global-test-setup';
 *
 *   test('my test', async ({ page, logger, popoutTracker }) => {
 *     await page.goto('/automobiles/discover');
 *     // All console and network logs are automatically captured
 *
 *     // Open a pop-out and it will be tracked automatically
 *     const popout = await popoutTracker.openPopout(page, 'query-control');
 *
 *     // Access captured data
 *     const apiCalls = logger.getApiCalls();
 *     const errors = logger.getConsoleErrors();
 *
 *     // Logs are printed automatically at test end
 *   });
 */

import { test as base, Page, BrowserContext, Request, Response } from '@playwright/test';

// ============================================================================
// TYPES
// ============================================================================

export interface ConsoleLogEntry {
  timestamp: string;
  type: 'log' | 'warn' | 'error' | 'info' | 'debug' | 'trace' | string;
  text: string;
  location?: string;
  source: 'main' | 'popout';
  windowId: string;
}

export interface NetworkLogEntry {
  timestamp: string;
  method: string;
  url: string;
  status: number | null;
  statusText: string | null;
  duration: number | null;
  requestHeaders: Record<string, string>;
  responseHeaders: Record<string, string>;
  requestBody: string | null;
  responseBody: string | null;
  responseSize: number | null;
  resourceType: string;
  isApi: boolean;
  source: 'main' | 'popout';
  windowId: string;
}

export interface PopoutWindow {
  page: Page;
  id: string;
  type: string;
  openedAt: string;
}

// ============================================================================
// COMPREHENSIVE LOGGER
// ============================================================================

export class ComprehensiveLogger {
  private consoleLogs: ConsoleLogEntry[] = [];
  private networkLogs: NetworkLogEntry[] = [];
  private pendingRequests: Map<string, { request: Request; startTime: number; windowId: string }> = new Map();
  private trackedPages: Map<string, Page> = new Map();
  private testName: string = '';

  /**
   * Set the current test name for logging context
   */
  setTestName(name: string): void {
    this.testName = name;
  }

  /**
   * Track a page (main window or pop-out) for logging
   */
  trackPage(page: Page, windowId: string, source: 'main' | 'popout' = 'main'): void {
    if (this.trackedPages.has(windowId)) return;
    this.trackedPages.set(windowId, page);

    // Console logging
    page.on('console', (msg) => {
      const entry: ConsoleLogEntry = {
        timestamp: new Date().toISOString(),
        type: msg.type(),
        text: msg.text(),
        location: msg.location()?.url,
        source,
        windowId,
      };
      this.consoleLogs.push(entry);

      // Real-time output with color coding
      const prefix = this.getConsoleIcon(msg.type());
      const windowLabel = source === 'popout' ? `[POPOUT:${windowId}]` : '[MAIN]';
      console.log(`${prefix} ${windowLabel} ${entry.text}`);
    });

    // Request tracking
    page.on('request', (request) => {
      const key = this.getRequestKey(request, windowId);
      this.pendingRequests.set(key, {
        request,
        startTime: Date.now(),
        windowId,
      });
    });

    // Response tracking with body capture
    page.on('response', async (response) => {
      const request = response.request();
      const key = this.getRequestKey(request, windowId);
      const pending = this.pendingRequests.get(key);
      const startTime = pending?.startTime || Date.now();
      const duration = Date.now() - startTime;

      // Capture request body for POST/PUT/PATCH
      let requestBody: string | null = null;
      try {
        requestBody = request.postData() || null;
      } catch {
        // Ignore
      }

      // Capture response body
      let responseBody: string | null = null;
      let responseSize: number | null = null;
      try {
        const buffer = await response.body();
        responseSize = buffer.length;
        const text = buffer.toString('utf-8');
        // Truncate very large responses but keep enough context
        if (text.length > 50000) {
          responseBody = text.substring(0, 50000) + `\n...[TRUNCATED - Total: ${text.length} bytes]`;
        } else {
          responseBody = text;
        }
      } catch {
        responseBody = null;
      }

      // Get headers
      const requestHeaders: Record<string, string> = {};
      const responseHeaders: Record<string, string> = {};
      try {
        Object.entries(request.headers()).forEach(([k, v]) => requestHeaders[k] = v);
        Object.entries(response.headers()).forEach(([k, v]) => responseHeaders[k] = v);
      } catch {
        // Ignore header errors
      }

      const url = request.url();
      const isApi = this.isApiRequest(url);

      const entry: NetworkLogEntry = {
        timestamp: new Date().toISOString(),
        method: request.method(),
        url,
        status: response.status(),
        statusText: response.statusText(),
        duration,
        requestHeaders,
        responseHeaders,
        requestBody,
        responseBody,
        responseSize,
        resourceType: request.resourceType(),
        isApi,
        source,
        windowId,
      };
      this.networkLogs.push(entry);

      // Real-time output for API calls
      if (isApi) {
        const statusIcon = response.ok() ? '✓' : '✗';
        const windowLabel = source === 'popout' ? `[POPOUT:${windowId}]` : '[MAIN]';
        const shortUrl = this.shortenUrl(url);
        console.log(`  ${statusIcon} ${windowLabel} ${request.method()} ${shortUrl} → ${response.status()} (${duration}ms)`);

        // For errors, print response body preview
        if (!response.ok() && responseBody) {
          const preview = responseBody.substring(0, 200);
          console.log(`    Response: ${preview}${responseBody.length > 200 ? '...' : ''}`);
        }
      }

      this.pendingRequests.delete(key);
    });

    // Request failures
    page.on('requestfailed', (request) => {
      const url = request.url();
      const isApi = this.isApiRequest(url);
      const key = this.getRequestKey(request, windowId);
      const pending = this.pendingRequests.get(key);

      const entry: NetworkLogEntry = {
        timestamp: new Date().toISOString(),
        method: request.method(),
        url,
        status: null,
        statusText: request.failure()?.errorText || 'Unknown error',
        duration: pending ? Date.now() - pending.startTime : null,
        requestHeaders: {},
        responseHeaders: {},
        requestBody: null,
        responseBody: `REQUEST FAILED: ${request.failure()?.errorText || 'Unknown error'}`,
        responseSize: null,
        resourceType: request.resourceType(),
        isApi,
        source,
        windowId,
      };
      this.networkLogs.push(entry);

      if (isApi) {
        const windowLabel = source === 'popout' ? `[POPOUT:${windowId}]` : '[MAIN]';
        console.log(`  ✗ ${windowLabel} ${request.method()} ${this.shortenUrl(url)} → FAILED: ${entry.statusText}`);
      }

      this.pendingRequests.delete(key);
    });

    // Page errors
    page.on('pageerror', (error) => {
      const entry: ConsoleLogEntry = {
        timestamp: new Date().toISOString(),
        type: 'error',
        text: `PAGE ERROR: ${error.message}\n${error.stack || ''}`,
        source,
        windowId,
      };
      this.consoleLogs.push(entry);
      const windowLabel = source === 'popout' ? `[POPOUT:${windowId}]` : '[MAIN]';
      console.log(`❌ ${windowLabel} PAGE ERROR: ${error.message}`);
    });
  }

  /**
   * Stop tracking a page
   */
  untrackPage(windowId: string): void {
    this.trackedPages.delete(windowId);
  }

  // ============================================================================
  // GETTERS
  // ============================================================================

  getConsoleLogs(): ConsoleLogEntry[] {
    return [...this.consoleLogs];
  }

  getNetworkLogs(): NetworkLogEntry[] {
    return [...this.networkLogs];
  }

  getConsoleErrors(): ConsoleLogEntry[] {
    return this.consoleLogs.filter(l => l.type === 'error');
  }

  getConsoleWarnings(): ConsoleLogEntry[] {
    return this.consoleLogs.filter(l => l.type === 'warn' || l.type === 'warning');
  }

  getApiCalls(): NetworkLogEntry[] {
    return this.networkLogs.filter(l => l.isApi);
  }

  getFailedApiCalls(): NetworkLogEntry[] {
    return this.networkLogs.filter(l => l.isApi && (l.status === null || l.status >= 400));
  }

  findApiCalls(urlPattern: string | RegExp): NetworkLogEntry[] {
    return this.getApiCalls().filter(l => {
      if (typeof urlPattern === 'string') {
        return l.url.includes(urlPattern);
      }
      return urlPattern.test(l.url);
    });
  }

  getApiResponseData<T = unknown>(urlPattern: string | RegExp): T | null {
    const calls = this.findApiCalls(urlPattern);
    if (calls.length === 0) return null;
    const lastCall = calls[calls.length - 1];
    if (!lastCall.responseBody) return null;
    try {
      return JSON.parse(lastCall.responseBody) as T;
    } catch {
      return null;
    }
  }

  hasConsoleErrors(): boolean {
    return this.getConsoleErrors().length > 0;
  }

  hasFailedApiCalls(): boolean {
    return this.getFailedApiCalls().length > 0;
  }

  // ============================================================================
  // SUMMARY & REPORTING
  // ============================================================================

  printSummary(): void {
    const divider = '═'.repeat(80);
    const subDivider = '─'.repeat(80);

    console.log(`\n${divider}`);
    console.log(`TEST LOG SUMMARY: ${this.testName || 'Unknown Test'}`);
    console.log(divider);

    // Console Summary
    const errors = this.getConsoleErrors();
    const warnings = this.getConsoleWarnings();
    console.log(`\n📋 CONSOLE: ${this.consoleLogs.length} entries (${errors.length} errors, ${warnings.length} warnings)`);
    console.log(subDivider);

    if (errors.length > 0) {
      console.log('\n❌ ERRORS:');
      errors.forEach((e, i) => {
        console.log(`  ${i + 1}. [${e.source}:${e.windowId}] ${e.text.substring(0, 200)}`);
      });
    }

    if (warnings.length > 0) {
      console.log('\n⚠️  WARNINGS:');
      warnings.slice(0, 5).forEach((w, i) => {
        console.log(`  ${i + 1}. [${w.source}:${w.windowId}] ${w.text.substring(0, 200)}`);
      });
      if (warnings.length > 5) {
        console.log(`  ... and ${warnings.length - 5} more warnings`);
      }
    }

    // API Summary
    const apiCalls = this.getApiCalls();
    const failedApi = this.getFailedApiCalls();
    console.log(`\n🌐 API CALLS: ${apiCalls.length} total (${failedApi.length} failed)`);
    console.log(subDivider);

    if (apiCalls.length > 0) {
      apiCalls.forEach((a, i) => {
        const statusIcon = a.status && a.status < 400 ? '✓' : '✗';
        const size = a.responseSize ? `${Math.round(a.responseSize / 1024)}KB` : '?';
        console.log(`  ${statusIcon} ${a.method.padEnd(6)} ${this.shortenUrl(a.url, 60)} → ${a.status || 'FAIL'} (${a.duration}ms, ${size})`);
      });
    }

    // Failed API Details
    if (failedApi.length > 0) {
      console.log('\n❌ FAILED API DETAILS:');
      failedApi.forEach((f, i) => {
        console.log(`\n  ${i + 1}. ${f.method} ${f.url}`);
        console.log(`     Status: ${f.status || 'N/A'} - ${f.statusText || 'Unknown'}`);
        if (f.responseBody) {
          const preview = f.responseBody.substring(0, 500);
          console.log(`     Response: ${preview}${f.responseBody.length > 500 ? '...' : ''}`);
        }
      });
    }

    console.log(`\n${divider}\n`);
  }

  getLogAttachment(): string {
    const data = {
      testName: this.testName,
      timestamp: new Date().toISOString(),
      consoleLogs: this.consoleLogs,
      networkLogs: this.networkLogs.map(n => ({
        ...n,
        // Truncate response bodies for attachment
        responseBody: n.responseBody?.substring(0, 5000),
      })),
      summary: {
        totalConsole: this.consoleLogs.length,
        consoleErrors: this.getConsoleErrors().length,
        consoleWarnings: this.getConsoleWarnings().length,
        totalNetwork: this.networkLogs.length,
        apiCalls: this.getApiCalls().length,
        failedApiCalls: this.getFailedApiCalls().length,
      },
    };
    return JSON.stringify(data, null, 2);
  }

  clear(): void {
    this.consoleLogs = [];
    this.networkLogs = [];
    this.pendingRequests.clear();
  }

  // ============================================================================
  // HELPERS
  // ============================================================================

  private getRequestKey(request: Request, windowId: string): string {
    return `${windowId}:${request.method()}:${request.url()}:${Date.now()}`;
  }

  private isApiRequest(url: string): boolean {
    if (url.includes('/api/')) return true;
    if (url.includes('elasticsearch')) return true;

    // Exclude static assets
    const staticPatterns = [
      /\.(js|css|png|jpg|jpeg|gif|svg|woff|woff2|ttf|ico|html|map)(\?|$)/i,
      /^data:/,
      /hot-update/,
      /webpack/,
      /sockjs-node/,
    ];
    return !staticPatterns.some(p => p.test(url));
  }

  private shortenUrl(url: string, maxLength: number = 80): string {
    try {
      const urlObj = new URL(url);
      let result = urlObj.pathname;
      if (urlObj.search) {
        const params = urlObj.search.substring(0, 30);
        result += params + (urlObj.search.length > 30 ? '...' : '');
      }
      if (result.length > maxLength) {
        result = result.substring(0, maxLength - 3) + '...';
      }
      return result;
    } catch {
      return url.length > maxLength ? url.substring(0, maxLength - 3) + '...' : url;
    }
  }

  private getConsoleIcon(type: string): string {
    switch (type) {
      case 'error': return '❌';
      case 'warn':
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      case 'debug': return '🔍';
      case 'log':
      default: return '📝';
    }
  }
}

// ============================================================================
// POPOUT TRACKER
// ============================================================================

export class PopoutTracker {
  private popouts: Map<string, PopoutWindow> = new Map();
  private logger: ComprehensiveLogger;
  private context: BrowserContext;
  private popoutCounter: number = 0;

  constructor(context: BrowserContext, logger: ComprehensiveLogger) {
    this.context = context;
    this.logger = logger;
  }

  /**
   * Open a pop-out window and automatically track it
   */
  async openPopout(mainPage: Page, panelType: string): Promise<PopoutWindow> {
    this.popoutCounter++;
    const popoutId = `popout-${this.popoutCounter}-${panelType}`;

    // Find and click the pop-out button for the panel
    const popoutButton = mainPage.locator(`[data-panel-type="${panelType}"] .popout-button, [data-testid="popout-${panelType}"]`).first();

    // Wait for new page to open
    const [newPage] = await Promise.all([
      this.context.waitForEvent('page'),
      popoutButton.click(),
    ]);

    await newPage.waitForLoadState('domcontentloaded');

    // Track the pop-out page
    this.logger.trackPage(newPage, popoutId, 'popout');

    const popout: PopoutWindow = {
      page: newPage,
      id: popoutId,
      type: panelType,
      openedAt: new Date().toISOString(),
    };

    this.popouts.set(popoutId, popout);

    console.log(`🪟 Opened pop-out: ${popoutId}`);

    return popout;
  }

  /**
   * Open a pop-out by navigating directly to its URL
   */
  async openPopoutByUrl(url: string, panelType: string): Promise<PopoutWindow> {
    this.popoutCounter++;
    const popoutId = `popout-${this.popoutCounter}-${panelType}`;

    const newPage = await this.context.newPage();
    this.logger.trackPage(newPage, popoutId, 'popout');

    await newPage.goto(url);
    await newPage.waitForLoadState('domcontentloaded');

    const popout: PopoutWindow = {
      page: newPage,
      id: popoutId,
      type: panelType,
      openedAt: new Date().toISOString(),
    };

    this.popouts.set(popoutId, popout);

    console.log(`🪟 Opened pop-out by URL: ${popoutId} → ${url}`);

    return popout;
  }

  /**
   * Get all tracked pop-outs
   */
  getPopouts(): PopoutWindow[] {
    return Array.from(this.popouts.values());
  }

  /**
   * Close a specific pop-out
   */
  async closePopout(popoutId: string): Promise<void> {
    const popout = this.popouts.get(popoutId);
    if (popout) {
      await popout.page.close();
      this.logger.untrackPage(popoutId);
      this.popouts.delete(popoutId);
      console.log(`🪟 Closed pop-out: ${popoutId}`);
    }
  }

  /**
   * Close all pop-outs
   */
  async closeAllPopouts(): Promise<void> {
    for (const [id, popout] of this.popouts) {
      await popout.page.close();
      this.logger.untrackPage(id);
    }
    this.popouts.clear();
    console.log('🪟 Closed all pop-outs');
  }
}

// ============================================================================
// CUSTOM TEST FIXTURE
// ============================================================================

interface TestFixtures {
  logger: ComprehensiveLogger;
  popoutTracker: PopoutTracker;
}

export const test = base.extend<TestFixtures>({
  logger: async ({ page }, use, testInfo) => {
    const logger = new ComprehensiveLogger();
    logger.setTestName(testInfo.title);

    // Track main page
    logger.trackPage(page, 'main', 'main');

    console.log(`\n${'━'.repeat(80)}`);
    console.log(`🧪 TEST: ${testInfo.title}`);
    console.log(`${'━'.repeat(80)}\n`);

    await use(logger);

    // Print summary at end
    logger.printSummary();

    // Attach logs to report on failure
    if (testInfo.status !== 'passed') {
      await testInfo.attach('test-logs.json', {
        body: logger.getLogAttachment(),
        contentType: 'application/json',
      });
    }
  },

  popoutTracker: async ({ context, logger }, use) => {
    const tracker = new PopoutTracker(context, logger);

    await use(tracker);

    // Cleanup: close all pop-outs
    await tracker.closeAllPopouts();
  },
});

export { expect } from '@playwright/test';

// ============================================================================
// CONVENIENCE HELPERS
// ============================================================================

/**
 * Wait for a specific API call to complete
 */
export async function waitForApiCall(
  page: Page,
  urlPattern: string | RegExp,
  options: { timeout?: number } = {}
): Promise<Response> {
  const timeout = options.timeout || 10000;
  return page.waitForResponse(
    (response) => {
      const url = response.url();
      if (typeof urlPattern === 'string') {
        return url.includes(urlPattern);
      }
      return urlPattern.test(url);
    },
    { timeout }
  );
}

/**
 * Get JSON response from an API call
 */
export async function getApiResponse<T = unknown>(
  page: Page,
  urlPattern: string | RegExp,
  action: () => Promise<void>,
  options: { timeout?: number } = {}
): Promise<{ response: Response; data: T }> {
  const [response] = await Promise.all([
    waitForApiCall(page, urlPattern, options),
    action(),
  ]);

  const data = await response.json() as T;
  return { response, data };
}

/**
 * Apply a filter and wait for the API response
 */
export async function applyFilterWithCapture(
  page: Page,
  filterType: string,
  values: string[]
): Promise<{ apiCalls: Response[] }> {
  const apiCalls: Response[] = [];

  // Set up listener before action
  const listener = (response: Response) => {
    if (response.url().includes('/api/')) {
      apiCalls.push(response);
    }
  };
  page.on('response', listener);

  // Open dropdown
  await page.locator('.p-dropdown').first().click();
  await page.waitForSelector('.p-dropdown-panel');

  // Select filter type
  await page.locator(`.p-dropdown-item:has-text("${filterType}")`).click();

  // Wait for dialog
  await page.waitForSelector('.p-dialog');

  // Select values
  for (const value of values) {
    await page.locator(`.p-checkbox-label:has-text("${value}")`).click();
  }

  // Apply
  await page.locator('button:has-text("Apply")').click();

  // Wait for results to update
  await page.waitForTimeout(500);

  // Remove listener
  page.off('response', listener);

  return { apiCalls };
}
