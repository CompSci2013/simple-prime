# QA E2E Test Suite Documentation

**Created**: 2026-01-02
**Context**: Session 68 - Understanding existing test infrastructure
**Purpose**: Document the QA E2E test suite implemented in Session 67

---

## Architecture Overview

The QA test suite is a **Playwright-based E2E testing framework** with custom test artifact infrastructure:

```
frontend/e2e/qa/
├── test-utils.ts                          # TestContext class + helper functions
├── category-1-basic-filters.spec.ts       # 10 tests (TEST-001 to TEST-010)
├── category-2-popout-lifecycle.spec.ts    # 10 tests (TEST-021 to TEST-030)
├── category-3-filter-popout-sync.spec.ts  # 10 tests (TEST-041 to TEST-050)
├── category-4-highlight-operations.spec.ts # 10 tests (TEST-061 to TEST-070)
├── category-5-url-persistence.spec.ts     # 10 tests (TEST-081 to TEST-090)
├── category-6-edge-cases.spec.ts          # 10 tests (TEST-101 to TEST-110)
└── generate-report.ts                     # HTML/PDF report generator
```

---

## Key Components

### 1. TestContext Class

**Location**: `frontend/e2e/qa/test-utils.ts:50-252`

Created per-test with `testId`, `testName`, `category`, `expectedResult`. Automatically captures:
- Console messages (all types)
- API calls with request/response data + timing
- Screenshots with injected URL bar overlay

Key method: `finalize(passed, actualResult)` writes all artifacts to disk.

### 2. Per-Test Output Directory Structure

```
test-results/TEST-001/
├── expected.txt         # What the test should verify
├── actual.txt           # What actually happened
├── api-calls.json       # All /api/ requests captured
├── console-errors.json  # Filtered console errors
├── console-log.json     # Full console log
├── result.json          # Complete test metadata
└── screenshots/
    ├── final-01-main-page.png
    ├── final-02-query-control.png
    ├── final-03-query-panel.png
    ├── final-04-results-table.png
    ├── final-05-manufacturer-model-picker.png
    └── final-06-statistics.png
```

### 3. Helper Functions

| Function | Purpose |
|----------|---------|
| `expandAllPanels(page)` | Expands collapsed panels (handles user preferences) |
| `screenshotAllComponents(ctx, page, prefix)` | Captures 6 standard component screenshots |
| `getFilterChips(page)` | Extracts filter chip text from UI |
| `getPaginatorText(page)` | Gets results count text |
| `openFilterDropdown(page)` | Opens filter field dropdown |
| `selectFilterOption(page, text)` | Selects option from dropdown |
| `applyMultiselectFilter(page, value)` | Applies multiselect filter value |
| `applyYearRangeFilter(page, min, max)` | Applies year range filter |

### 4. Report Generation

**Location**: `frontend/e2e/qa/generate-report.ts`

- Parses all `TEST-*/result.json` files
- Generates styled HTML report with:
  - Summary (total, passed, failed counts)
  - Table of contents by category
  - Per-test: expected/actual, API calls, console errors, screenshots
- Outputs:
  - `test-results/qa-report.html`
  - `test-results/qa-report.pdf`
  - `test-results/qa-report.zip`

---

## Test Categories (60 tests total)

| Category | Test IDs | Focus |
|----------|----------|-------|
| 1: Basic Filters | 001-010 | Add/remove filters, clear all, URL sync |
| 2: Pop-Out Lifecycle | 021-030 | Open/close pop-outs, placeholders |
| 3: Filter-PopOut Sync | 041-050 | BroadcastChannel sync between windows |
| 4: Highlight Operations | 061-070 | URL h_* params, row highlighting |
| 5: URL Persistence | 081-090 | Back/forward, refresh, bookmark URLs |
| 6: Edge Cases | 101-110 | Invalid params, rapid clicks, stress |

---

## Test Structure Pattern

```typescript
test('001 - Add manufacturer filter', async ({ page }) => {
  const ctx = new TestContext(
    page,
    'TEST-001',
    'Add manufacturer filter',
    CATEGORY,
    'Expected behavior description...'
  );

  let actualResult = '';

  try {
    await navigateToDiscover(page);
    // ... test actions ...
    await screenshotAllComponents(ctx, page, 'final');
    actualResult += 'TEST PASSED';
    ctx.finalize(true, actualResult);
  } catch (error) {
    actualResult += `\nTEST FAILED: ${error}`;
    ctx.finalize(false, actualResult);
    throw error;
  }
});
```

---

## URL Bar Injection

The `injectUrlBar()` function adds a visual URL bar overlay to screenshots. This is critical for debugging in headless mode - you can see what URL the test was on when each screenshot was taken.

```typescript
private async injectUrlBar(targetPage: Page): Promise<void> {
  await targetPage.evaluate((url) => {
    const div = document.createElement('div');
    div.id = 'e2e-url-bar';
    div.style.cssText = 'background: #333; color: #0f0; padding: 8px 12px; ...';
    div.innerText = `URL: ${url}`;
    document.body.insertBefore(div, document.body.firstChild);
  }, targetPage.url());
}
```

---

## Running the Tests

```bash
cd ~/projects/generic-prime/frontend

# Run QA tests
npm run test:e2e -- e2e/qa/

# Generate HTML report
npx ts-node e2e/qa/generate-report.ts

# View report
npm run test:report
```

---

## Key Files

| File | Purpose |
|------|---------|
| `frontend/e2e/qa/test-utils.ts` | TestContext class and helper functions |
| `frontend/e2e/qa/generate-report.ts` | HTML/PDF report generator |
| `frontend/e2e/qa/category-*.spec.ts` | Test spec files (6 categories) |
| `frontend/test-results/` | Output directory for test artifacts |
| `frontend/test-results/qa-report.html` | Generated HTML report |
| `frontend/test-results/qa-report.zip` | Windows-compatible archive |

---

## Design Principles

1. **Full Traceability**: Every test produces expected.txt, actual.txt, API logs, console logs, and screenshots
2. **Visual Evidence**: 6 component screenshots per test for visual regression detection
3. **URL-First Verification**: URL parameters are primary source of truth for state
4. **Headless-Friendly**: URL bar injection makes headless screenshots debuggable
5. **Auditable Output**: HTML/PDF reports suitable for QA review

---

**Last Updated**: 2026-01-02
