# E2E Test Suite Architecture

**Created**: 2025-12-25
**Last Updated**: 2025-12-25
**Purpose**: Define the testing strategy and organization for the Generic Prime application

---

## Quick Reference

```
frontend/e2e/
├── TEST-SUITE.md          # This file - architecture & organization
├── TEST-LIST.md           # Comprehensive test case enumeration (~870 tests)
├── test-logger.ts         # Console/network capture utility
├── test-helpers.ts        # Shared helper functions
│
├── components/            # Component tests (bundled by component)
├── integration/           # Cross-component integration tests
├── popout/                # Pop-out window synchronization tests
├── regression/            # Bug regression tests (one per bug)
├── domains/               # Domain-specific tests
└── archive/               # Deprecated/legacy test files
```

---

## Organization Philosophy

### Bundled Tests by Logical Grouping

Tests are bundled into single Playwright spec files to **minimize setup/teardown overhead** while maintaining logical organization. For example, Section 2 (Dropdown) from TEST-LIST.md becomes a single spec file with multiple `test()` blocks.

**Benefits:**
1. **Reduced execution time** - Single browser setup for related tests
2. **Logical grouping** - Related tests live together
3. **Parallel execution** - Playwright runs spec files in parallel
4. **Maintainability** - Easy to find and update tests when component changes

### Directory Structure

| Directory | Purpose | Test Count Target |
|-----------|---------|-------------------|
| `components/` | Per-component test suites | ~400 tests |
| `integration/` | Cross-component interactions | ~100 tests |
| `popout/` | Multi-window synchronization | ~130 tests |
| `regression/` | Bug-specific regression tests | ~50 tests |
| `domains/` | Domain-specific functionality | ~40 tests |
| `archive/` | Deprecated tests (not executed) | N/A |

---

## Current Test Files

### Components (`components/`)

| File | Coverage | Status |
|------|----------|--------|
| `query-control.spec.ts` | Dropdown, dialogs, chips, Clear All | Active |
| `query-control-keyboard.spec.ts` | Keyboard navigation (Arrow, Enter, Space) | Active |
| `results-table.spec.ts` | Pagination, sorting, filtering display | Active |
| `statistics-panel.spec.ts` | Charts, interactions | Planned |
| `picker.spec.ts` | Manufacturer-Model picker | Planned |

### Integration (`integration/`)

| File | Coverage | Status |
|------|----------|--------|
| `integration-suite.spec.ts` | API logging, filter verification | Active |
| `filter-propagation.spec.ts` | Filter → all components | Planned |
| `url-state-sync.spec.ts` | URL ↔ component state | Planned |
| `cross-component.spec.ts` | Chart clicks, picker selections | Planned |

### Pop-Out (`popout/`)

| File | Coverage | Status |
|------|----------|--------|
| `popout-sync.spec.ts` | Main ↔ pop-out synchronization | Active |
| `popout-query-control.spec.ts` | Query Control in pop-out | Planned |
| `popout-results-table.spec.ts` | Results Table in pop-out | Planned |
| `multi-popout.spec.ts` | Multiple simultaneous pop-outs | Planned |

### Regression (`regression/`)

| File | Bug | Status |
|------|-----|--------|
| `bug-10-stats-popout.spec.ts` | Statistics panel with bodyClass filters | Passing (not reproducible) |
| `bug-11-picker-count.spec.ts` | Picker showing ~72 vs 881 entries | Passing (verified fixed) |
| `bug-15-dropdown-filter.spec.ts` | Filtered dropdown selects wrong item | Passing (fixed) |
| `bug-highlight-chips.spec.ts` | Highlight filters not syncing to/from pop-outs | Passing (fixed) |

### Domains (`domains/`)

| File | Coverage | Status |
|------|----------|--------|
| `agriculture.spec.ts` | Agriculture domain routes | Active |
| `chemistry.spec.ts` | Chemistry domain routes | Active |
| `math.spec.ts` | Math domain routes | Active |
| `physics.spec.ts` | Physics domain routes | Active |
| `automobiles.spec.ts` | Full automobile functionality | Planned |

### Archive (`archive/`)

| File | Reason |
|------|--------|
| `app.spec.ts.legacy` | Monolithic 1325-line test file, superseded by modular structure |
| `gemini-pilot.spec.ts` | One-off connectivity test, no longer needed |

---

## Mapping TEST-LIST.md to Spec Files

The ~870 tests in TEST-LIST.md are organized into sections. Here's how they map to spec files:

| TEST-LIST Section | Target Spec File | Test Count |
|-------------------|------------------|------------|
| 1. Initial Load & Navigation | `integration/page-load.spec.ts` | 25 |
| 2. Query Control Dropdown | `components/query-control.spec.ts` | 50 |
| 3. Multiselect Dialogs | `components/query-control.spec.ts` | 90 |
| 4. Year Range Dialog | `components/query-control.spec.ts` | 40 |
| 5. Filter Chips | `components/query-control.spec.ts` | 45 |
| 6. Clear All Button | `components/query-control.spec.ts` | 20 |
| 7. Results Table | `components/results-table.spec.ts` | 80 |
| 8. Picker Panel | `components/picker.spec.ts` | 60 |
| 9. Statistics Panel | `components/statistics-panel.spec.ts` | 55 |
| 10. Panel Management | `integration/panel-management.spec.ts` | 40 |
| 11-14. Pop-Out Windows | `popout/*.spec.ts` | 115 |
| 15. Multi-Window Integration | `popout/multi-popout.spec.ts` | 45 |
| 16. Cross-Component Integration | `integration/cross-component.spec.ts` | 40 |
| 17. Keyboard/Accessibility | `components/query-control-keyboard.spec.ts` | 35 |
| 18. Error Handling | `integration/error-handling.spec.ts` | 30 |
| 19. Performance | `integration/performance.spec.ts` | 20 |
| 20. Browser Compatibility | N/A (Playwright config) | 15 |
| 21. Domain-Specific | `domains/*.spec.ts` | 40 |
| 22. User Preferences | `integration/preferences.spec.ts` | 25 |

---

## Test Bundling Strategy

### Why Bundle?

Many of the ~870 tests can be bundled into single Playwright scripts to avoid excessive setup/teardown time. Playwright's `test.describe()` blocks provide logical grouping within a file.

### Example: Query Control Bundle

```typescript
// components/query-control.spec.ts

test.describe('Query Control Component', () => {

  // Section 2: Dropdown (50 tests)
  test.describe('Filter Dropdown', () => {
    test.describe('Opening Behavior', () => { /* 2.1.1-2.1.7 */ });
    test.describe('Options Display', () => { /* 2.2.1-2.2.7 */ });
    test.describe('Filtering/Search', () => { /* 2.3.1-2.3.8 */ });
    test.describe('Mouse Selection', () => { /* 2.4.1-2.4.6 */ });
    test.describe('Keyboard Selection', () => { /* 2.5.1-2.5.8 */ });
    test.describe('Filtered + Keyboard', () => { /* 2.6.1-2.6.8 (Bug #15) */ });
  });

  // Section 3: Dialogs (90 tests)
  test.describe('Multiselect Dialog', () => {
    test.describe('Manufacturer Dialog', () => { /* 3.1-3.5 */ });
    test.describe('Model Dialog', () => { /* 3.6 */ });
    test.describe('Body Class Dialog', () => { /* 3.7 */ });
    test.describe('Editing Existing', () => { /* 3.8 */ });
    test.describe('Error States', () => { /* 3.9 */ });
  });

  // Section 4: Year Range (40 tests)
  test.describe('Year Range Dialog', () => { /* 4.1-4.5 */ });

  // Section 5: Filter Chips (45 tests)
  test.describe('Filter Chips', () => { /* 5.1-5.5 */ });

  // Section 6: Clear All (20 tests)
  test.describe('Clear All Button', () => { /* 6.1-6.3 */ });
});
```

This structure:
- Groups 245 tests into one spec file
- Shares browser setup across all tests
- Maintains logical organization matching TEST-LIST.md
- Allows running subsets: `npx playwright test query-control --grep "Dropdown"`

---

## Shared Utilities

### TestLogger (`test-logger.ts`)

Captures console logs and network traffic for debugging.

```typescript
import { TestLogger } from '../test-logger';

test('example', async ({ page }) => {
  const logger = new TestLogger(page);

  // ... test code ...

  // Assertions
  expect(logger.hasConsoleErrors()).toBeFalsy();
  logger.assertApiCall('/api/specs/v1/vehicles/details', 200);

  // Debug output
  logger.printSummary();
});
```

### Test Helpers (`test-helpers.ts`)

Common operations used across tests:

```typescript
import { applyFilter, clearAllFilters, openPopout, getResultsCount } from '../test-helpers';

test('filter flow', async ({ page }) => {
  await applyFilter(page, 'manufacturer', ['Chevrolet']);
  expect(await getResultsCount(page)).toBe(849);

  const popout = await openPopout(page, 'query-control');
  // ... verify popout state
});
```

---

## Test Execution

### Run All Tests
```bash
npx playwright test
```

### Run by Directory
```bash
npx playwright test components/     # Component tests
npx playwright test integration/    # Integration tests
npx playwright test popout/         # Pop-out tests
npx playwright test regression/     # Bug regression tests
npx playwright test domains/        # Domain-specific tests
```

### Run Single File
```bash
npx playwright test components/query-control.spec.ts
```

### Run Subset with grep
```bash
npx playwright test --grep "Dropdown"        # All dropdown tests
npx playwright test --grep "Bug #15"         # Specific bug regression
```

### Debugging Modes
```bash
npx playwright test --ui              # Interactive UI mode
npx playwright test --headed          # See browser
npx playwright test --debug           # Step through tests
```

---

## Bug Regression Workflow

### FAIL FIRST Protocol

1. **Create reproduction test** in `regression/bug-{N}-{desc}.spec.ts`
2. **Run test** - verify it FAILS (bug exists)
3. **Fix the bug** in application code
4. **Run test again** - verify it PASSES
5. **Run all tests** - verify no regressions
6. **Commit** both fix and test

### Template

```typescript
/**
 * Bug #N Regression Test: {Title}
 *
 * Original Issue: {description}
 * Root Cause: {what caused it}
 * Fix: {what was changed}
 * Fixed In: {commit hash or session}
 */
import { test, expect } from '@playwright/test';
import { TestLogger } from '../test-logger';

test.describe('Bug #N: {Title}', () => {
  test('reproduction scenario', async ({ page }) => {
    const logger = new TestLogger(page);

    // Exact steps that triggered the bug
    // This test should FAIL before the fix
    // This test should PASS after the fix
  });
});
```

---

## Test Data Expectations

### Automobile Domain Baseline

| Metric | Value | Notes |
|--------|-------|-------|
| Total records | 4,887 | Unfiltered count |
| Manufacturer: Chevrolet | 849 | |
| Manufacturer: Ford | ~600 | Approximate |
| Model: Camaro | 59 | |
| Year Range 2020-2024 | ~290 | |
| Manufacturer-Model combinations | 881 | |

---

## Best Practices

1. **Use `data-testid` attributes** - Prefer `[data-testid="..."]` over CSS classes
2. **Wait for stability** - Use `waitForSelector`, `waitForLoadState` appropriately
3. **Verify API calls** - Use TestLogger to check correct endpoints called
4. **Check console errors** - Every test should verify no errors
5. **Clean state** - Each test starts fresh (new page)
6. **Descriptive names** - Test names describe behavior and expectation
7. **Bundle related tests** - Use `test.describe()` for logical grouping
8. **FAIL FIRST for bugs** - Write failing test before implementing fix

---

## Implementation Roadmap

### Phase 1: Core Components (Current)
- [x] `test-logger.ts` - Console/network capture
- [x] `test-helpers.ts` - Shared utilities
- [x] `components/query-control.spec.ts` - Base implementation
- [x] `components/query-control-keyboard.spec.ts` - Keyboard tests
- [x] `components/results-table.spec.ts` - Table tests
- [ ] `components/statistics-panel.spec.ts` - Chart tests
- [ ] `components/picker.spec.ts` - Picker tests

### Phase 2: Integration
- [x] `integration/integration-suite.spec.ts` - API verification
- [ ] `integration/filter-propagation.spec.ts` - Filter → all components
- [ ] `integration/url-state-sync.spec.ts` - URL ↔ state
- [ ] `integration/cross-component.spec.ts` - Chart/picker interactions

### Phase 3: Pop-Out Windows
- [x] `popout/popout-sync.spec.ts` - Basic synchronization
- [ ] `popout/multi-popout.spec.ts` - Multiple simultaneous pop-outs

### Phase 4: Edge Cases & Coverage
- [ ] Error handling tests
- [ ] Performance tests
- [ ] Accessibility tests

---

## Lessons Learned

From Bug #14 case study and Monster Protocol sessions:

1. **Test integration scenarios** - Components may work alone but fail in combination
2. **Test pop-outs with BOTH windows active** - Don't test in isolation
3. **Comprehensive logging beats hypothesis** - Add TestLogger to everything
4. **Don't declare victory prematurely** - Verify with complete test cases
5. **If a test fails 3 times, ask for help** - Don't keep editing blindly

---

**Maintained by**: Claude (Monster Watch Protocol)
**Reference**: TEST-LIST.md for complete test case enumeration
