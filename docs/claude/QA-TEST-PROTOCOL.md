# QA Test Protocol

## Overview

This document describes the QA E2E test infrastructure for generating comprehensive test reports with screenshots, API call logs, and expected/actual result documentation.

## Screenshot Requirements (CRITICAL)

Every test MUST capture complete visual documentation:

### Main Page Screenshots
1. **All visible components** - Screenshot of the main page showing all components above the fold
2. **Below-the-fold components** - If any component is below the fold, scroll down until it's visible and take an additional screenshot
3. **Every component must be captured** - No component should be left undocumented

### Pop-Out Window Screenshots
1. **Every popped-out component** - Each pop-out window must have its own screenshot
2. **Pop-out AND main page** - When a pop-out is open, capture BOTH:
   - The pop-out window itself (using `ctx.screenshotPage(popoutPage, 'name')`)
   - The main page state (using `ctx.screenshot('name')`)

### Screenshot Naming Convention
- Use numbered prefixes: `01-`, `02-`, `03-` etc.
- Descriptive names: `01-main-initial`, `02-popout-open`, `03-main-with-placeholder`
- For pop-outs: clearly indicate it's a pop-out: `01-popout-query-control`, `02-popout-results-table`

### Example: Test with Pop-Out
```typescript
// Screenshot main page initial state
await ctx.screenshot('01-main-initial');

// Open pop-out
const [popoutPage] = await Promise.all([
  context.waitForEvent('page'),
  page.locator('#popout-query-control').click()
]);

// Screenshot the pop-out window
await ctx.screenshotPage(popoutPage, '02-popout-query-control');

// Screenshot main page showing placeholder
await ctx.screenshot('03-main-with-placeholder');

// After filter applied, screenshot both again
await ctx.screenshotPage(popoutPage, '04-popout-with-filter');
await ctx.screenshot('05-main-synced');
```

### Example: Scrolling for Below-Fold Components
```typescript
// Screenshot top of page
await ctx.screenshot('01-main-top');

// Scroll to results table and screenshot
await page.locator('[data-testid="basic-results-table"]').scrollIntoViewIfNeeded();
await ctx.screenshot('02-main-results-table');
```

## Running Tests

```bash
cd /home/odin/projects/generic-prime/frontend

# Run all QA tests
npx playwright test e2e/qa/ --reporter=list

# Run a specific category
npx playwright test e2e/qa/category-1-basic-filters.spec.ts --reporter=list

# Run a single test by name
npx playwright test e2e/qa/ -g "TEST-001" --reporter=list
```

## Generating Reports

After running tests:

```bash
# Generate HTML report from test results
npx tsx e2e/qa/generate-report.ts

# Convert to PDF
npx playwright pdf test-results/qa-report.html test-results/qa-report.pdf
```

## Output Structure

Each test creates its own directory under `test-results/TEST-XXX/`:

```
test-results/
├── TEST-001/
│   ├── screenshots/
│   │   ├── 01-initial.png
│   │   ├── 02-dropdown-open.png
│   │   └── ...
│   ├── expected.txt      # Description of expected behavior
│   ├── actual.txt        # Description of actual result
│   ├── api-calls.json    # All API calls with request/response data
│   ├── console-errors.json # Console errors captured
│   ├── console-log.json  # Full console output
│   └── result.json       # Complete test metadata
├── TEST-002/
│   └── ...
├── qa-report.html        # Generated HTML report
└── qa-report.pdf         # Generated PDF report
```

## Test Categories

| Category | Tests | Description |
|----------|-------|-------------|
| Category 1 | 001-010 | Basic Filters |
| Category 2 | 021-030 | Pop-Out Lifecycle |
| Category 3 | 041-050 | Filter-PopOut Sync |
| Category 4 | 061-070 | Highlight Operations |
| Category 5 | 081-090 | URL Persistence |
| Category 6 | 101-110 | Edge Cases |

## Writing New Tests

Use the `TestContext` class from `test-utils.ts`:

```typescript
import { test, expect } from '@playwright/test';
import { TestContext } from './test-utils';

test('XXX - Test description', async ({ page }) => {
  const ctx = new TestContext(
    page,
    'TEST-XXX',
    'Short test name',
    'Category Name',
    'Expected behavior description:\n' +
    '1. First expectation\n' +
    '2. Second expectation\n' +
    '3. No console errors should occur'
  );

  let actualResult = '';

  try {
    // Navigate and perform test actions
    await page.goto('/automobiles/discover');
    await page.waitForLoadState('networkidle');

    // Take screenshots at key states
    await ctx.screenshot('01-initial');

    // Perform assertions and log actual results
    const someValue = await page.locator('.some-element').textContent();
    actualResult += `Some value: ${someValue}\n`;
    expect(someValue).toBe('expected');

    // Check for console errors
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
```

## TestContext API

### Constructor
```typescript
new TestContext(page, testId, testName, category, expectedResult)
```

### Methods
- `screenshot(name: string)` - Take a screenshot of the main page (saved to `screenshots/` dir)
- `screenshotPage(targetPage: Page, name: string)` - Take a screenshot of any page (use for pop-outs)
- `hasError()` - Returns true if any console errors occurred
- `getErrors()` - Returns array of console error messages
- `getApiCalls()` - Returns array of captured API calls
- `clear()` - Clear captured logs and API calls
- `finalize(passed: boolean, actualResult: string)` - Write all output files

## Report Contents

The generated PDF/HTML report includes:

1. **Summary** - Total tests, passed/failed counts
2. **Table of Contents** - Links to each category
3. **Per-test details**:
   - Test ID and name
   - Pass/fail status
   - Expected result description
   - Actual result description
   - API calls made (method, URL, status, duration)
   - Console errors (if any)
   - Screenshots

## Quick Reference

```bash
# Full test run with report generation
cd /home/odin/projects/generic-prime/frontend
npx playwright test e2e/qa/ --reporter=list && \
npx tsx e2e/qa/generate-report.ts && \
npx playwright pdf test-results/qa-report.html test-results/qa-report.pdf

# Report location
/home/odin/projects/generic-prime/frontend/test-results/qa-report.pdf
```
