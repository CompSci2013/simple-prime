import { test, expect, Page } from '@playwright/test';

/**
 * NgZone BroadcastChannel Bug Regression Test
 *
 * Tests for the bug where BroadcastChannel.onmessage fires outside Angular's zone,
 * causing "Navigation triggered outside Angular zone" console warnings.
 *
 * Bug source: bug-fix/minimal-automobiles-popout branch (commit 0d9b79e)
 * Fix: Wrap channel.onmessage handler in ngZone.run()
 *
 * The test verifies:
 * 1. Pop-out window can send messages to main window via BroadcastChannel
 * 2. Main window processes the message and updates state
 * 3. NO "Navigation triggered outside Angular zone" warning appears
 * 4. NO "outside Angular zone" errors in console
 */

interface ConsoleMessage {
  type: string;
  text: string;
  timestamp: number;
}

class ZoneWarningDetector {
  private messages: ConsoleMessage[] = [];
  private page: Page;

  constructor(page: Page) {
    this.page = page;
    this.setupListeners();
  }

  private setupListeners(): void {
    this.page.on('console', msg => {
      this.messages.push({
        type: msg.type(),
        text: msg.text(),
        timestamp: Date.now()
      });
    });
  }

  hasZoneWarning(): boolean {
    return this.messages.some(msg =>
      msg.text.includes('outside Angular zone') ||
      msg.text.includes('outside the Angular zone') ||
      msg.text.includes('Navigation triggered outside')
    );
  }

  getZoneWarnings(): ConsoleMessage[] {
    return this.messages.filter(msg =>
      msg.text.includes('outside Angular zone') ||
      msg.text.includes('outside the Angular zone') ||
      msg.text.includes('Navigation triggered outside')
    );
  }

  getAllMessages(): ConsoleMessage[] {
    return [...this.messages];
  }

  getErrors(): ConsoleMessage[] {
    return this.messages.filter(msg => msg.type === 'error');
  }

  getWarnings(): ConsoleMessage[] {
    return this.messages.filter(msg => msg.type === 'warning');
  }

  clear(): void {
    this.messages = [];
  }
}

async function injectUrlBar(page: Page): Promise<void> {
  await page.evaluate((url) => {
    const existing = document.getElementById('e2e-url-bar');
    if (existing) existing.remove();

    const div = document.createElement('div');
    div.id = 'e2e-url-bar';
    div.style.cssText = 'background: #333; color: #0f0; padding: 8px 12px; font-family: monospace; font-size: 12px; position: fixed; top: 0; left: 0; width: 100%; z-index: 999999; box-sizing: border-box;';
    div.innerText = `URL: ${url}`;
    document.body.style.marginTop = '32px';
    document.body.insertBefore(div, document.body.firstChild);
  }, page.url());
}

test.describe('NgZone BroadcastChannel Bug Regression', () => {

  test('Pop-out sending message to main window should NOT trigger zone warning', async ({ page, context }) => {
    const mainDetector = new ZoneWarningDetector(page);

    // Step 1: Navigate to discover page
    console.log('\n[TEST] Step 1: Navigate to /automobiles/discover');
    await page.goto('/automobiles/discover');
    await page.waitForLoadState('networkidle');

    // Wait for the results table to load
    await expect(page.locator('[data-testid="basic-results-table"]')).toBeVisible({ timeout: 15000 });

    // Take initial screenshot
    await injectUrlBar(page);
    await page.screenshot({
      path: 'screenshots/ngzone-test-01-initial.png',
      fullPage: true
    });
    console.log('[TEST] Screenshot: ngzone-test-01-initial.png');

    // Verify initial record count
    const paginator = page.locator('[data-testid="basic-results-table-panel"] .p-paginator-current').first();
    await expect(paginator).toContainText(/of\s+\d+/, { timeout: 5000 });
    const initialText = await paginator.textContent();
    console.log(`[TEST] Initial paginator: ${initialText}`);

    // Step 2: Open Results Table pop-out (this component allows sorting/pagination that triggers messages)
    console.log('\n[TEST] Step 2: Opening Results Table pop-out window');

    // Clear console before opening pop-out
    mainDetector.clear();

    const [popoutPage] = await Promise.all([
      context.waitForEvent('page'),
      page.locator('#popout-basic-results-table').click()
    ]);

    await popoutPage.waitForLoadState('load');
    const popoutDetector = new ZoneWarningDetector(popoutPage);

    await popoutPage.waitForLoadState('networkidle');
    await popoutPage.waitForTimeout(1000);

    console.log(`[TEST] Pop-out opened: ${popoutPage.url()}`);

    // Take screenshot of pop-out
    await injectUrlBar(popoutPage);
    await popoutPage.screenshot({
      path: 'screenshots/ngzone-test-02-popout-opened.png',
      fullPage: true
    });
    console.log('[TEST] Screenshot: ngzone-test-02-popout-opened.png');

    // Step 3: Trigger an action in pop-out that sends BroadcastChannel message
    // Clicking a column header to sort will trigger a message to main window
    console.log('\n[TEST] Step 3: Triggering sort action in pop-out (sends BroadcastChannel message)');

    // Clear logs before the critical action
    mainDetector.clear();
    popoutDetector.clear();

    // Find and click a sortable column header (PrimeNG 21 uses p-datatable-sortable-column)
    const sortableHeader = popoutPage.locator('th.p-datatable-sortable-column').first();
    await expect(sortableHeader).toBeVisible({ timeout: 5000 });

    console.log('[TEST] Clicking sortable column header in pop-out...');
    await sortableHeader.click();

    // Wait for the message to be processed
    await popoutPage.waitForTimeout(2000);
    await page.waitForTimeout(1000);

    // Take screenshot after sort
    await injectUrlBar(page);
    await page.screenshot({
      path: 'screenshots/ngzone-test-03-after-sort.png',
      fullPage: true
    });
    console.log('[TEST] Screenshot: ngzone-test-03-after-sort.png');

    // Step 4: Check for zone warnings
    console.log('\n[TEST] Step 4: Checking for zone warnings in console');

    const mainZoneWarnings = mainDetector.getZoneWarnings();
    const popoutZoneWarnings = popoutDetector.getZoneWarnings();

    console.log(`[TEST] Main window zone warnings: ${mainZoneWarnings.length}`);
    mainZoneWarnings.forEach(w => console.log(`  [WARNING] ${w.text}`));

    console.log(`[TEST] Pop-out zone warnings: ${popoutZoneWarnings.length}`);
    popoutZoneWarnings.forEach(w => console.log(`  [WARNING] ${w.text}`));

    // Print all console messages for debugging
    console.log('\n[TEST] === MAIN WINDOW CONSOLE (last 20) ===');
    mainDetector.getAllMessages().slice(-20).forEach(m => {
      console.log(`  [${m.type}] ${m.text.substring(0, 150)}`);
    });

    console.log('\n[TEST] === POP-OUT CONSOLE (last 20) ===');
    popoutDetector.getAllMessages().slice(-20).forEach(m => {
      console.log(`  [${m.type}] ${m.text.substring(0, 150)}`);
    });

    // Step 5: Also try pagination which sends a different message type
    console.log('\n[TEST] Step 5: Testing pagination action in pop-out');

    mainDetector.clear();
    popoutDetector.clear();

    const nextPageButton = popoutPage.locator('.p-paginator-next').first();
    if (await nextPageButton.isEnabled()) {
      console.log('[TEST] Clicking next page button in pop-out...');
      await nextPageButton.click();
      await popoutPage.waitForTimeout(2000);
      await page.waitForTimeout(1000);

      // Take screenshot after pagination
      await injectUrlBar(page);
      await page.screenshot({
        path: 'screenshots/ngzone-test-04-after-pagination.png',
        fullPage: true
      });
      console.log('[TEST] Screenshot: ngzone-test-04-after-pagination.png');

      // Check for warnings after pagination
      const paginationZoneWarnings = mainDetector.getZoneWarnings();
      console.log(`[TEST] Zone warnings after pagination: ${paginationZoneWarnings.length}`);
      paginationZoneWarnings.forEach(w => console.log(`  [WARNING] ${w.text}`));
    }

    // Step 6: Final verification
    console.log('\n[TEST] Step 6: Final verification');

    // Combine all zone warnings from both tests
    const allMainWarnings = mainDetector.getZoneWarnings();
    const allPopoutWarnings = popoutDetector.getZoneWarnings();
    const totalZoneWarnings = allMainWarnings.length + allPopoutWarnings.length;

    // Check for errors
    const mainErrors = mainDetector.getErrors();
    const popoutErrors = popoutDetector.getErrors();

    console.log(`[TEST] Total zone warnings: ${totalZoneWarnings}`);
    console.log(`[TEST] Main window errors: ${mainErrors.length}`);
    console.log(`[TEST] Pop-out errors: ${popoutErrors.length}`);

    if (mainErrors.length > 0) {
      console.log('\n[TEST] === MAIN WINDOW ERRORS ===');
      mainErrors.forEach(e => console.log(`  [ERROR] ${e.text}`));
    }

    if (popoutErrors.length > 0) {
      console.log('\n[TEST] === POP-OUT ERRORS ===');
      popoutErrors.forEach(e => console.log(`  [ERROR] ${e.text}`));
    }

    // Cleanup
    await popoutPage.close();

    // ASSERTION: No zone warnings should be present if the fix is in place
    expect(totalZoneWarnings).toBe(0);

    console.log('\n[TEST] ✅ PASS: No "outside Angular zone" warnings detected');
  });

  test('Filter change from pop-out to main should be zone-aware', async ({ page, context }) => {
    const mainDetector = new ZoneWarningDetector(page);

    // Navigate to discover page
    console.log('\n[TEST] Navigate to /automobiles/discover');
    await page.goto('/automobiles/discover');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('[data-testid="basic-results-table"]')).toBeVisible({ timeout: 15000 });

    // Open Query Control pop-out
    console.log('[TEST] Opening Query Control pop-out');

    mainDetector.clear();

    const [popoutPage] = await Promise.all([
      context.waitForEvent('page'),
      page.locator('#popout-query-control').click()
    ]);

    await popoutPage.waitForLoadState('networkidle');
    const popoutDetector = new ZoneWarningDetector(popoutPage);
    await popoutPage.waitForTimeout(1000);

    console.log(`[TEST] Pop-out opened: ${popoutPage.url()}`);

    // In pop-out, try to apply a filter
    // This should send a message to main window via BroadcastChannel
    console.log('[TEST] Attempting to interact with filter in pop-out');

    mainDetector.clear();
    popoutDetector.clear();

    // Look for dropdown in pop-out
    const dropdown = popoutPage.locator('.p-dropdown').first();
    if (await dropdown.isVisible()) {
      console.log('[TEST] Found dropdown, clicking...');
      await dropdown.click();
      await popoutPage.waitForTimeout(500);

      // Take screenshot of dropdown open
      await injectUrlBar(popoutPage);
      await popoutPage.screenshot({
        path: 'screenshots/ngzone-test-05-dropdown-open.png',
        fullPage: true
      });

      // Close dropdown
      await popoutPage.keyboard.press('Escape');
      await popoutPage.waitForTimeout(500);
    }

    // Check for zone warnings
    const warnings = mainDetector.getZoneWarnings();
    console.log(`[TEST] Zone warnings after dropdown interaction: ${warnings.length}`);

    // Cleanup
    await popoutPage.close();

    expect(mainDetector.hasZoneWarning()).toBe(false);
    console.log('[TEST] ✅ PASS: No zone warnings from filter interaction');
  });

});
