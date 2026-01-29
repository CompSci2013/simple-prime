# Test Status - Master Index

**Version**: 1.0
**Last Updated**: 2025-12-25
**Purpose**: Single source of truth for all testing in Generic Prime

---

## Test Framework Configuration

| Framework | Version | Purpose | Location |
|-----------|---------|---------|----------|
| Playwright | 1.57.0 | E2E Testing | `frontend/e2e/` |
| Karma/Jasmine | - | Unit Testing (disabled) | `frontend/src/**/*.spec.ts` |

### Run Commands

```bash
# Run all E2E tests
cd frontend && npx playwright test

# Run specific test file
npx playwright test integration-suite.spec.ts

# Run with visible browser
npx playwright test --headed

# Run with UI mode
npx playwright test --ui
```

---

## E2E Test Suites

### Core Test Files

| File | Tests | Status | Purpose |
|------|-------|--------|---------|
| `app.spec.ts` | ~25 | Active | Main test suite - navigation, filters, pop-outs |
| `integration-suite.spec.ts` | 5 | Active | API/console capture verification |
| `popout-sync.spec.ts` | 2 | Active | Pop-out window BroadcastChannel sync |
| `query-control-keyboard.spec.ts` | 3 | Active | Keyboard navigation (Bug #13 regression) |

### Domain-Specific Tests

| File | Status | Purpose |
|------|--------|---------|
| `agriculture.spec.ts` | Placeholder | Agriculture domain tests |
| `chemistry.spec.ts` | Placeholder | Chemistry domain tests |
| `math.spec.ts` | Placeholder | Math domain tests |
| `physics.spec.ts` | Placeholder | Physics domain tests |

### Utility Files

| File | Purpose |
|------|---------|
| `test-logger.ts` | Console/network capture helper class |
| `gemini-pilot.spec.ts` | Pilot test for Gemini verification |

---

## Bug Regression Tests

| Bug | Test File | Status | Description |
|-----|-----------|--------|-------------|
| #10 | `bug-10-stats-popout.spec.ts` | **PASSING** | Stats charts render in pop-out (fixed) |
| #11 | `bug-11-picker-count.spec.ts` | **PASSING** | Picker shows 881 entries (verified) |
| #13 | `query-control-keyboard.spec.ts` | **PASSING** | Keyboard nav + dialog opening |
| #14 | (in app.spec.ts) | **PASSING** | ResourceManagementService lifecycle |
| #15 | `bug-15-dropdown-filter.spec.ts` | **PASSING** | Filtered dropdown correct selection |
| #7 | `bug-7-picker-clear.spec.ts` | **PASSING** | Pop-out picker checkboxes correctly clear |

---

## Test Coverage Status

### Fully Tested
- [x] Basic navigation to `/automobiles/discover`
- [x] Filter application via URL params
- [x] API call verification (TestLogger)
- [x] Console error detection
- [x] Pop-out window synchronization
- [x] Keyboard navigation in Query Control dropdown
- [x] BroadcastChannel STATE_UPDATE messages
- [x] Bug #11: Manufacturer-Model Picker count
- [x] Bug #15: Filtered dropdown selection
- [x] Bug #10: Statistics panel pop-out hydration
- [x] Bug #7: Pop-out picker checkbox clearing

### Needs Testing
- [ ] **Systemic**: Pop-out to Main message handling (CRITICAL)
- [ ] Pop-out to pop-out synchronization
- [ ] Year range filter edge cases
- [ ] Highlight filters vs regular filters
- [ ] Statistics chart click interactions

---

## Outstanding Bugs

### Critical

| Bug | Severity | Status | Description |
|-----|----------|--------|-------------|
| **Systemic** | CRITICAL | Discovered | Pop-out filter interactions ignored by Main window |

### Recently Fixed (Session 56-59)

| Bug | Fixed In | Description |
|-----|----------|-------------|
| #7 | Session 59 | Pop-out picker checkboxes correctly clear |
| #10 | Session 59 | Stats charts render in pop-out |
| #15 | Session 59 | Filtered dropdown correct selection |
| #11 | Session 59 | Picker total count verified |
| #14 | Session 58 | ResourceManagementService lifecycle |
| #13 | Session 56 | Keyboard navigation dialog opening |

---

## E2E Runbook

### Prerequisites
1. Development server running on `localhost:4205`
2. Backend API accessible at `generic-prime.minilab`
3. Playwright browsers installed: `npx playwright install`

### Running Tests

```bash
# Full suite
npx playwright test

# With reporter
npx playwright test --reporter=list

# Specific file
npx playwright test bug-11-picker-count.spec.ts

# Debug mode
npx playwright test --debug
```

### Viewing Reports

```bash
# HTML report
npx playwright show-report

# Trace viewer (after failed test)
npx playwright show-trace trace.zip
```

---

## Archived Documentation

The following files have been moved to `docs/test-archive/`:
- `E2E-SETUP-PLAN.md` - Initial setup (superseded)
- `E2E-TESTING-RUBRIC.md` - Verification checklist (superseded)
- `VERIFICATION-RUBRIC.md` - Old verification format

---

**Maintained By**: Claude Code Sessions
**Related Docs**:
- `docs/specs/09-testing-strategy.md` - Testing strategy
- `MANUAL-TEST-PLAN.md` - Manual verification checklist
