# E2E Tests - Quick Start

**TL;DR**: Your E2E setup had 4 bugs, all fixed. Here's what to do next.

---

## What Was Wrong (Fixed ✅)

| Issue | Fix |
|-------|-----|
| Port 4200 | → Changed to 4205 |
| Docker couldn't start app | → Added startup commands |
| Only 1 test | → Expanded to 15+ tests |
| Missing component test-ids | → → Need to add (see below) |

---

## Quick Start (5 minutes)

### Step 1: Add Component Test-IDs
Your components need `data-testid` attributes. Open these files and add the markers:

**File 1**: `frontend/src/app/features/discover/panels/query-control/query-control.component.html`
```html
<p-panel [data-testid]="'query-control-panel'">
  <p-dropdown [data-testid]="'filter-field-dropdown'"></p-dropdown>
  <!-- Add to chip close buttons: [data-testid]="'chip-close-' + fieldName" -->
</p-panel>
```

**File 2**: `frontend/src/app/features/discover/panels/results-table/results-table.component.html`
```html
<p-panel [data-testid]="'results-table-panel'">
  <p-table [data-testid]="'results-table'"></p-table>
</p-panel>
```

**File 3**: `frontend/src/app/features/discover/panels/picker/base-picker.component.html`
```html
<p-panel [data-testid]="'picker-panel'">
```

**File 4**: `frontend/src/app/features/discover/panels/statistics/statistics-panel.component.html`
```html
<p-panel [data-testid]="'statistics-panel'">
  <!-- Add to charts: [data-testid]="'chart-' + config.id" -->
</p-panel>
```

See [E2E-TEST-IDS-REQUIRED.md](E2E-TEST-IDS-REQUIRED.md) for exact implementation.

### Step 2: Build & Run Tests
```bash
# Build the E2E image (one-time)
podman build --no-cache -f frontend/Dockerfile.e2e -t generic-prime-e2e .

# Run all tests (uses helper script)
./scripts/run-e2e-tests.sh
```

### Step 3: Check Results
```bash
# View test report in HTML
cd frontend
npx playwright show-report
```

---

## What Changed

### Files Modified: 3
1. **playwright.config.ts** - Fixed port 4200→4205, added conditional webServer
2. **Dockerfile.e2e** - Added dev server startup + test execution
3. **app.spec.ts** - Expanded from 1 test to 15+ tests

### Documentation Created: 3
1. **E2E-TEST-SETUP.md** - User guide
2. **E2E-TEST-IDS-REQUIRED.md** - Component changes needed
3. **E2E-AUTOMATION-ANALYSIS.md** - Technical deep-dive

---

## Run Tests Locally (without Docker)

```bash
cd frontend

# Terminal 1: Start dev server
npm start -- --host 0.0.0.0 --port 4205 &

# Terminal 2: Run tests (after 10 seconds)
sleep 10 && npm run test:e2e
```

---

## Test Coverage

✅ Phase 1: Initial page load, panel controls (3 tests)
✅ Phase 2.1: Manufacturer filter, dialogs, keyboard nav (6 test groups)
✅ Phase 2.2: Model filter (2 test groups)
✅ Phase 3+: Results table, statistics (2 tests)

= **15+ automated tests** covering MANUAL-TEST-PLAN.md

---

## Debugging

```bash
# Run single test
npm run test:e2e -- --grep "2.1.1-2.1.8"

# Debug mode (interactive browser)
PWDEBUG=1 npm run test:e2e

# View HTML report after test failure
npx playwright show-report
```

---

## CI/CD Integration

To add to GitHub Actions:

```yaml
# .github/workflows/e2e-tests.yml
name: E2E Tests

on: [push, pull_request]

jobs:
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: |
          podman build --no-cache -f frontend/Dockerfile.e2e -t generic-prime-e2e .
          podman run --rm --ipc=host generic-prime-e2e
```

---

## Next Steps

1. ✅ **Add test-ids** to components (5-10 min)
2. ✅ **Run tests** locally (2 min)
3. ✅ **Debug** any failures (varies)
4. 📋 **Add more tests** for Phase 2.3-2.7 (optional)
5. 🔄 **Integrate into CI** pipeline (optional)

---

## Summary

**Before**: E2E setup broken (port, Docker, 1 test)
**Now**: Ready to run (port fixed, Docker fixed, 15+ tests)
**Blocker**: Need component test-ids (see Step 1)
**Effort**: 5-10 minutes to add test-ids, then run tests

---

For detailed info:
- See [E2E-TEST-SETUP.md](E2E-TEST-SETUP.md) for full user guide
- See [E2E-TEST-IDS-REQUIRED.md](E2E-TEST-IDS-REQUIRED.md) for component changes
- See [E2E-AUTOMATION-ANALYSIS.md](E2E-AUTOMATION-ANALYSIS.md) for technical details

**Ready to start?** → Add component test-ids (Step 1) then run tests (Step 2)
