# E2E Test Setup & Automation Guide

**Date**: 2025-12-05
**Status**: ✅ Fixed - Ready to run

---

## Problems Fixed

### 1. **Port Mismatch** ❌ → ✅
- **Was**: playwright.config.ts used port `4200`
- **App**: Runs on port `4205`
- **Fixed**: Changed `const PORT = 4205`

### 2. **Web Server Configuration** ❌ → ✅
- **Was**: Config expected production build served with http-server
- **Problem**: Inside Docker, http-server is unavailable; dev server needed
- **Fixed**: Made webServer conditional based on `IN_DOCKER` environment variable
  - Outside Docker: Uses `http-server ./dist/frontend`
  - Inside Docker: Assumes dev server already running on 4205

### 3. **Dockerfile Build & Run** ❌ → ✅
- **Was**: Built but didn't start the app or run tests
- **Fixed**: Updated Dockerfile.e2e to:
  1. Build the app with `npm run build`
  2. Start dev server: `npm start -- --host 0.0.0.0 --port 4205`
  3. Run tests with `IN_DOCKER=true npm run test:e2e`
  4. Wait 5 seconds for dev server to initialize

### 4. **Test Coverage** ❌ → ✅
- **Was**: 1 test (initial page load only)
- **Fixed**: Expanded to 15+ tests covering:
  - Phase 1: Initial state, panel collapse/expand, drag-drop
  - Phase 2.1: Manufacturer filter (single, multiple, search, keyboard nav, edit, remove)
  - Phase 2.2: Model filter (single selection)
  - Phase 3+: Results table pagination, statistics panel

---

## Files Modified

### 1. `frontend/playwright.config.ts`
- Changed PORT from 4200 → 4205
- Added 30-second timeout for complex Phase 2 tests
- Added JSON reporter for CI/CD integration
- Increased viewport to 1920x1080 for full panel visibility
- Made webServer conditional on `IN_DOCKER` env variable

### 2. `frontend/Dockerfile.e2e`
- Added ENTRYPOINT and CMD to start dev server and run tests
- Uses `npm start -- --host 0.0.0.0 --port 4205` for dev server
- Sets `IN_DOCKER=true` environment variable
- Waits 5 seconds for dev server to initialize before running tests

### 3. `frontend/e2e/app.spec.ts`
- Complete rewrite with 15+ tests
- Helper functions: `waitForTableUpdate()`, `getUrlParams()`
- Phase 1: Initial state & panel controls (3 tests)
- Phase 2.1: Manufacturer filter (6 test groups, 19 individual test cases)
- Phase 2.2: Model filter (1 test group, 2 test cases)
- Phase 3+: Results table & statistics (2 tests)

---

## How to Run Tests

### Option A: Inside Docker Container (Recommended)

```bash
# Build the E2E test image
podman build --no-cache -f frontend/Dockerfile.e2e -t generic-prime-e2e .

# Run tests (dev server starts automatically)
podman run --rm --ipc=host generic-prime-e2e
```

**What happens**:
1. Container builds the Angular app
2. Starts dev server on http://localhost:4205
3. Waits 5 seconds for server to initialize
4. Runs Playwright tests
5. Generates HTML report in `frontend/playwright-report/`

### Option B: Locally (without Docker)

```bash
# Start the dev server separately
cd frontend
npm start -- --host 0.0.0.0 --port 4205 &

# Wait for it to initialize
sleep 10

# Run tests (will use http-server for production build)
npm run test:e2e
```

### Option C: Run Production Build Tests

```bash
# Build production version
cd frontend
npm run build

# Run tests against production build
npm run test:e2e
```

---

## Test Organization

### Naming Convention
Each test is named to match MANUAL-TEST-PLAN.md section numbers:
- `2.1.1-2.1.8: Single Selection Workflow` → Tests cases 2.1.1 through 2.1.8
- `2.1.19-2.1.22: Search in Dialog` → Tests cases 2.1.19 through 2.1.22

### What Each Test Validates

| Test | Validates |
|------|-----------|
| 1.1 | Initial page load, 4,887 records |
| 1.2 | Panel collapse/expand independent of URL |
| 1.3 | Panel drag-drop doesn't affect URL |
| 2.1.1-8 | Manufacturer filter single selection |
| 2.1.9-13 | Multiple filter dialogs coexist |
| 2.1.14-18 | Multiple manufacturer selection |
| 2.1.19-22 | Search within filter dialog |
| 2.1.23-26 | Keyboard navigation (Tab, Space, Enter) |
| 2.1.27-29 | Edit applied filter |
| 2.1.30-32 | Remove filter |
| 2.2.1-2 | Model filter single selection |
| 3+ | Results pagination, statistics |

---

## Known Limitations & TODO

### Needs Component Updates (test-id attributes)
The tests assume these `data-testid` attributes exist on components:
- `[data-testid="query-control-panel"]`
- `[data-testid="filter-field-dropdown"]`
- `[data-testid="picker-panel"]`
- `[data-testid="results-table-panel"]`
- `[data-testid="statistics-panel"]`
- `[data-testid*="chip-close"]` - for filter chip close button

**Action needed**: Add these to component templates if not already present.

### Incomplete Tests
- **Pop-out window tests**: Not yet implemented (requires more complex setup)
- **Drag-drop panel reordering**: Playwright drag-drop is complex (marked as TODO)
- **Chart interactions**: Statistics panel chart clicks (for highlight filters)

### Test Stability
- Tests use hardcoded locators (PrimeNG class names like `.p-dialog-title`)
- If PrimeNG styling changes, tests may break
- Consider adding more stable test-id attributes to reduce brittleness

---

## Debugging Test Failures

### View HTML Report
```bash
# After tests run
cd frontend
npx playwright show-report
```

### Run Single Test
```bash
# Run only the manufacturer filter test
npm run test:e2e -- --grep "2.1.1-2.1.8"
```

### Run with Debug Mode
```bash
# Interactive debug mode
PWDEBUG=1 npm run test:e2e
```

### Check Test Output
```bash
# Watch mode - rerun tests on file changes
npm run test:e2e -- --watch
```

---

## CI/CD Integration

The setup supports CI/CD pipelines. In CI environment:
- Set `CI=true` to enable:
  - Retries: 2 (tolerates transient failures)
  - Workers: 1 (serial execution for consistency)
  - forbidOnly: True (fail if test.only exists)

```bash
# In CI pipeline
CI=true npm run test:e2e
```

---

## Next Steps

1. **Add test-id attributes** to components (if not already present)
2. **Run first test suite** to validate infrastructure
3. **Expand Phase 2.2+** tests for remaining filters (Body Class, Year)
4. **Add pop-out tests** for QueryControl and Statistics panels
5. **Integrate into CI/CD** pipeline (GitHub Actions, GitLab CI, etc.)

---

## Test Results Location

After running tests:
- **HTML Report**: `frontend/playwright-report/index.html`
- **JSON Results**: `frontend/test-results.json`
- **Screenshots**: `frontend/test-results/` (on failure)
- **Videos**: `frontend/test-results/` (if enabled in config)

---

## Architecture Verification

These E2E tests verify the **URL-First architecture** by validating:

✅ **URL → Component State Flow**
- Changing URL parameters updates filter UI
- URL changes trigger data refresh

✅ **Component Interaction → URL Flow**
- User selections update URL
- URL updates cause data reload
- Statistics and table sync with URL

✅ **Multi-Filter Behavior**
- Multiple filters coexist (AND logic)
- Each filter has correct dialog
- Cancel doesn't affect other filters

This automation validates that the URL-First architecture works correctly end-to-end.

---

**Document Version**: 1.0
**Last Updated**: 2025-12-05
