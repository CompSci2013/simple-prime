# Cline Rules Reference

**Source**: `.clinerules` from `feature/cline-experiment`
**Purpose**: Project context rules for AI assistants

---

## Critical Constraints

### DO NOT
- Run `ng build` or `ng serve` - the dev server runs in a separate SSH session
- Modify frontend code without understanding the full data flow
- Use `router.navigate()` directly - use `UrlStateService` instead
- Create unit tests - testing is E2E only (Playwright)

### ALWAYS
- Ask the user if the dev server is running before executing tests
- Use the correct routes (see below)
- Use the correct data-testid selectors (see below)

---

## Routes

| Route | Status |
|-------|--------|
| `/automobiles/discover` | CORRECT |
| `/automobiles/discover?manufacturer=Chevrolet` | CORRECT (with filters) |
| `/discover/automobile` | WRONG |
| `/automobile/discover` | WRONG |
| `/discover` | WRONG |

**Base URL**: `http://localhost:4205`

---

## Data Test IDs

**IMPORTANT**: The main discover page uses `BasicResultsTable`, NOT `ResultsTable`.

| Component | Test ID | Notes |
|-----------|---------|-------|
| Query Panel | `query-panel` | Main filter container |
| Query Control | `query-control-panel` | Filter controls |
| Filter Dropdown | `filter-field-dropdown` | Field selector |
| **Basic Results Table Panel** | `basic-results-table-panel` | **Main table container** |
| **Basic Results Table** | `basic-results-table` | **Main p-table** |
| Results Table Panel | `results-table-panel` | Only in pop-out windows |
| Results Table | `results-table` | Only in pop-out windows |
| Picker Panel | `picker-panel` | Manufacturer/Model picker |
| Picker Table | `picker-table` | Picker p-table |
| Statistics Panel | `statistics-panel` | Stats/charts panel |
| Charts | `chart-{id}` | e.g., `chart-manufacturer-distribution` |

---

## Playwright Testing

### Location
- E2E tests: `frontend/e2e/`
- Temporary tests: `frontend/e2e/tests/tmp/` (clean up after use)
- Screenshots: `frontend/screenshots/`

### Running Tests
```bash
cd frontend
npm run test:e2e                    # Run all tests
npx playwright test path/to/test.ts # Run specific test
npm run test:report                 # View results at port 9323
```

### Test Pattern
```typescript
import { test, expect } from '@playwright/test';

test.describe('My Test Suite', () => {
  test('test name', async ({ page }) => {
    await page.goto('/automobiles/discover');
    await page.waitForLoadState('networkidle');
    // Use basic-results-table for the main page (NOT results-table)
    await expect(page.locator('[data-testid="basic-results-table"]')).toBeVisible({ timeout: 10000 });
  });
});
```

---

## Screenshot with URL Bar (Headless)

```typescript
const injectUrlBar = async (p: typeof page) => {
  await p.evaluate((url) => {
    const div = document.createElement('div');
    div.style.cssText = 'background: #333; color: white; padding: 5px; font-family: monospace; font-size: 14px; position: fixed; top: 0; left: 0; width: 100%; z-index: 999999;';
    div.innerText = `URL: ${url}`;
    document.body.style.marginTop = '30px';
    document.body.appendChild(div);
  }, p.url());
};

await injectUrlBar(page);
await page.screenshot({ path: 'screenshot.png', fullPage: true });
```

---

## Self-Repair Workflow

When tests fail:

1. **Read the error message** - What locator failed? What was expected vs actual?
2. **Verify the selector exists** - Inspect DOM for actual `data-testid` values
3. **Check `.clinerules`** - Authoritative list of correct routes and selectors
4. **Fix and re-run** - Update test, verify all pass
