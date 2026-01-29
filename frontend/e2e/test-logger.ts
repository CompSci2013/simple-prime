import { Page, Request, Response } from '@playwright/test';

/**
 * Test Logger - Captures console logs and network traffic during Playwright tests
 *
 * Usage:
 *   const logger = new TestLogger(page);
 *   await logger.start();
 *   // ... run your test ...
 *   logger.printSummary();
 */

export interface ConsoleEntry {
  timestamp: string;
  type: string;
  text: string;
}

export interface NetworkEntry {
  timestamp: string;
  method: string;
  url: string;
  status: number | null;
  responseBody: string | null;
  duration: number | null;
}

export class TestLogger {
  private page: Page;
  private consoleLogs: ConsoleEntry[] = [];
  private networkLogs: NetworkEntry[] = [];
  private pendingRequests: Map<string, { request: Request; startTime: number }> = new Map();
  private isCapturing = false;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Start capturing console logs and network traffic
   */
  async start(): Promise<void> {
    if (this.isCapturing) return;
    this.isCapturing = true;

    // Capture console logs
    this.page.on('console', (msg) => {
      const entry: ConsoleEntry = {
        timestamp: new Date().toISOString(),
        type: msg.type(),
        text: msg.text(),
      };
      this.consoleLogs.push(entry);

      // Print to test runner output immediately
      const prefix = this.getConsolePrefix(msg.type());
      console.log(`${prefix} [${entry.timestamp}] ${entry.text}`);
    });

    // Capture network requests
    this.page.on('request', (request) => {
      const url = request.url();
      // Only capture API calls (XHR/Fetch), skip static assets
      if (this.isApiRequest(url)) {
        this.pendingRequests.set(request.url() + request.method(), {
          request,
          startTime: Date.now(),
        });
      }
    });

    // Capture network responses
    this.page.on('response', async (response) => {
      const request = response.request();
      const url = request.url();

      if (this.isApiRequest(url)) {
        const key = url + request.method();
        const pending = this.pendingRequests.get(key);
        const startTime = pending?.startTime || Date.now();
        const duration = Date.now() - startTime;

        let responseBody: string | null = null;
        try {
          const body = await response.text();
          // Truncate long responses but keep enough to see metadata
          responseBody = body.length > 10000 ? body.substring(0, 10000) + '...[truncated]' : body;
        } catch {
          responseBody = '[Unable to read response body]';
        }

        const entry: NetworkEntry = {
          timestamp: new Date().toISOString(),
          method: request.method(),
          url: this.truncateUrl(url),
          status: response.status(),
          responseBody,
          duration,
        };
        this.networkLogs.push(entry);

        // Print to test runner output immediately
        const statusIcon = response.ok() ? '  ' : '  ';
        console.log(`${statusIcon} [API] ${entry.method} ${entry.url} -> ${entry.status} (${duration}ms)`);

        this.pendingRequests.delete(key);
      }
    });

    // Capture request failures
    this.page.on('requestfailed', (request) => {
      const url = request.url();
      if (this.isApiRequest(url)) {
        const entry: NetworkEntry = {
          timestamp: new Date().toISOString(),
          method: request.method(),
          url: this.truncateUrl(url),
          status: null,
          responseBody: `[Request Failed: ${request.failure()?.errorText || 'Unknown error'}]`,
          duration: null,
        };
        this.networkLogs.push(entry);
        console.log(`  [API FAILED] ${entry.method} ${entry.url} - ${entry.responseBody}`);
      }
    });
  }

  /**
   * Check if a URL is an API request (not static assets)
   */
  private isApiRequest(url: string): boolean {
    // Match API endpoints
    if (url.includes('/api/')) return true;

    // Exclude common static assets
    const staticExtensions = ['.js', '.css', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.woff', '.woff2', '.ttf', '.ico', '.html'];
    const lowerUrl = url.toLowerCase();
    return !staticExtensions.some(ext => lowerUrl.endsWith(ext));
  }

  /**
   * Get console log prefix based on type
   */
  private getConsolePrefix(type: string): string {
    switch (type) {
      case 'error': return '  [CONSOLE ERROR]';
      case 'warning': return '  [CONSOLE WARN]';
      case 'info': return '  [CONSOLE INFO]';
      case 'log': return '  [CONSOLE LOG]';
      case 'debug': return '  [CONSOLE DEBUG]';
      default: return `  [CONSOLE ${type.toUpperCase()}]`;
    }
  }

  /**
   * Truncate long URLs for readability
   */
  private truncateUrl(url: string): string {
    const maxLength = 100;
    if (url.length <= maxLength) return url;

    // Keep the path, truncate query params if too long
    const urlObj = new URL(url);
    const path = urlObj.pathname;
    const search = urlObj.search;

    if (search.length > 50) {
      return `${urlObj.origin}${path}?...[params truncated]`;
    }
    return url;
  }

  /**
   * Get all captured console logs
   */
  getConsoleLogs(): ConsoleEntry[] {
    return [...this.consoleLogs];
  }

  /**
   * Get all captured network logs
   */
  getNetworkLogs(): NetworkEntry[] {
    return [...this.networkLogs];
  }

  /**
   * Get console errors only
   */
  getConsoleErrors(): ConsoleEntry[] {
    return this.consoleLogs.filter(log => log.type === 'error');
  }

  /**
   * Get console warnings only
   */
  getConsoleWarnings(): ConsoleEntry[] {
    return this.consoleLogs.filter(log => log.type === 'warning');
  }

  /**
   * Get failed API requests
   */
  getFailedRequests(): NetworkEntry[] {
    return this.networkLogs.filter(log => log.status === null || (log.status >= 400));
  }

  /**
   * Check if there are any console errors
   */
  hasConsoleErrors(): boolean {
    return this.getConsoleErrors().length > 0;
  }

  /**
   * Find API calls matching a URL pattern
   */
  findApiCalls(urlPattern: string | RegExp): NetworkEntry[] {
    return this.networkLogs.filter(log => {
      if (typeof urlPattern === 'string') {
        return log.url.includes(urlPattern);
      }
      return urlPattern.test(log.url);
    });
  }

  /**
   * Assert that an API call was made with specific criteria
   */
  assertApiCall(options: {
    urlPattern: string | RegExp;
    method?: string;
    expectedStatus?: number;
  }): NetworkEntry {
    const calls = this.findApiCalls(options.urlPattern);

    if (calls.length === 0) {
      throw new Error(`No API call found matching pattern: ${options.urlPattern}`);
    }

    let matchingCall = calls[0];

    if (options.method) {
      matchingCall = calls.find(c => c.method === options.method) || matchingCall;
      if (matchingCall.method !== options.method) {
        throw new Error(`Expected API call with method ${options.method}, but found ${matchingCall.method}`);
      }
    }

    if (options.expectedStatus !== undefined && matchingCall.status !== options.expectedStatus) {
      throw new Error(`Expected API call to return status ${options.expectedStatus}, but got ${matchingCall.status}`);
    }

    return matchingCall;
  }

  /**
   * Print a formatted summary of all captured logs
   */
  printSummary(): void {
    console.log('\n' + '='.repeat(80));
    console.log('TEST LOGGER SUMMARY');
    console.log('='.repeat(80));

    console.log(`\n  CONSOLE LOGS (${this.consoleLogs.length} total):`);
    console.log('-'.repeat(40));

    if (this.consoleLogs.length === 0) {
      console.log('  No console logs captured');
    } else {
      const errors = this.getConsoleErrors();
      const warnings = this.getConsoleWarnings();
      console.log(`  Errors: ${errors.length}, Warnings: ${warnings.length}`);

      if (errors.length > 0) {
        console.log('\n  ERRORS:');
        errors.forEach(e => console.log(`    - ${e.text}`));
      }
    }

    console.log(`\n  NETWORK LOGS (${this.networkLogs.length} API calls):`);
    console.log('-'.repeat(40));

    if (this.networkLogs.length === 0) {
      console.log('  No API calls captured');
    } else {
      this.networkLogs.forEach(n => {
        const statusIcon = n.status && n.status < 400 ? '  ' : '  ';
        console.log(`  ${statusIcon} ${n.method} ${n.url} -> ${n.status || 'FAILED'}`);
      });
    }

    const failed = this.getFailedRequests();
    if (failed.length > 0) {
      console.log(`\n  FAILED REQUESTS (${failed.length}):`);
      failed.forEach(f => {
        console.log(`    - ${f.method} ${f.url}: ${f.responseBody}`);
      });
    }

    console.log('\n' + '='.repeat(80) + '\n');
  }

  /**
   * Clear all captured logs
   */
  clear(): void {
    this.consoleLogs = [];
    this.networkLogs = [];
    this.pendingRequests.clear();
  }
}

/**
 * Convenience function to create and start a logger
 */
export async function createTestLogger(page: Page): Promise<TestLogger> {
  const logger = new TestLogger(page);
  await logger.start();
  return logger;
}
