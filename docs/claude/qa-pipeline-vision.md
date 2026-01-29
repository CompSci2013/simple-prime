# QA Pipeline Vision: Autonomous Test-Fix-Verify Loop

**Created**: 2026-01-02
**Status**: Vision Document (Not Yet Implemented)
**Purpose**: Define the ultimate goal for autonomous QA testing with Claude

---

## Overview

The goal is to evolve the simple `/qa` command into a full **autonomous pipeline** where Claude:

1. Runs E2E tests one at a time
2. Stops immediately when a test fails
3. Analyzes the failure and attempts to fix the source code
4. Re-runs the failed test to verify the fix
5. Repeats with escalating strategies if the fix fails
6. Marks unfixable bugs as DEFERRED and continues
7. Produces a final report of all fixes applied and deferred issues

---

## Pipeline Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     QA AUTONOMOUS PIPELINE                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────┐                                                        │
│  │ 1. RUN TEST  │◀─────────────────────────────────────┐                │
│  │   (single)   │                                       │                │
│  └──────┬───────┘                                       │                │
│         │                                               │                │
│         ▼                                               │                │
│  ┌──────────────┐     PASS                             │                │
│  │  Test Result │─────────────────────────────────────▶│ NEXT TEST     │
│  └──────┬───────┘                                       │                │
│         │ FAIL                                          │                │
│         ▼                                               │                │
│  ┌──────────────┐                                       │                │
│  │ 2. ANALYZE   │  Screenshot, console, API logs        │                │
│  │    FAILURE   │  Identify root cause                  │                │
│  └──────┬───────┘                                       │                │
│         │                                               │                │
│         ▼                                               │                │
│  ┌──────────────┐                                       │                │
│  │ 3. VALIDATE  │  Check against architecture rubric:   │                │
│  │    RUBRIC    │  - URL-First state management         │                │
│  │              │  - OnPush change detection            │                │
│  │              │  - No direct router.navigate()        │                │
│  │              │  - PrimeNG component patterns         │                │
│  └──────┬───────┘                                       │                │
│         │                                               │                │
│         ▼                                               │                │
│  ┌──────────────┐                                       │                │
│  │ 4. ATTEMPT   │  Attempt 1: Direct fix based on       │                │
│  │    FIX #1    │  error analysis + rubric              │                │
│  └──────┬───────┘                                       │                │
│         │                                               │                │
│         ▼                                               │                │
│  ┌──────────────┐     PASS                             │                │
│  │ 5. VERIFY    │─────────────────────────────────────▶│ LOG FIX       │
│  │    (re-run)  │                                       │ NEXT TEST     │
│  └──────┬───────┘                                       │                │
│         │ FAIL                                          │                │
│         ▼                                               │                │
│  ┌──────────────┐                                       │                │
│  │ 6. DEEP      │  Web search for:                      │                │
│  │    SEARCH    │  - Angular 21 + error message         │                │
│  │              │  - PrimeNG 21 + component issue       │                │
│  │              │  - Similar GitHub issues              │                │
│  └──────┬───────┘                                       │                │
│         │                                               │                │
│         ▼                                               │                │
│  ┌──────────────┐                                       │                │
│  │ 7. ATTEMPT   │  Attempt 2: Fix informed by           │                │
│  │    FIX #2    │  web search results                   │                │
│  └──────┬───────┘                                       │                │
│         │                                               │                │
│         ▼                                               │                │
│  ┌──────────────┐     PASS                             │                │
│  │ 8. VERIFY    │─────────────────────────────────────▶│ LOG FIX       │
│  │    (re-run)  │                                       │ NEXT TEST     │
│  └──────┬───────┘                                       │                │
│         │ FAIL                                          │                │
│         ▼                                               │                │
│  ┌──────────────┐                                       │                │
│  │ 9. ATTEMPT   │  Attempt 3: Alternative approach      │                │
│  │    FIX #3    │  or deeper investigation              │                │
│  └──────┬───────┘                                       │                │
│         │                                               │                │
│         ▼                                               │                │
│  ┌──────────────┐     PASS                             │                │
│  │ 10. VERIFY   │─────────────────────────────────────▶│ LOG FIX       │
│  │    (re-run)  │                                       │ NEXT TEST     │
│  └──────┬───────┘                                       │                │
│         │ FAIL (3rd attempt)                            │                │
│         ▼                                               │                │
│  ┌──────────────┐                                       │                │
│  │ 11. DEFER    │  Mark as DEFERRED                     │                │
│  │              │  Revert any partial changes          ─┼───────────────▶│
│  │              │  Document in report                   │ NEXT TEST     │
│  └──────────────┘                                       │                │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Architecture Rubric

Before applying any fix, Claude must validate against these rules:

### URL-First State Management
- [ ] All state changes go through `UrlStateService`
- [ ] Never call `router.navigate()` directly
- [ ] URL is single source of truth
- [ ] Filter state reflected in URL params

### Change Detection (OnPush)
- [ ] Pop-out windows use `detectChanges()`, not `markForCheck()`
- [ ] Async data updates trigger proper change detection
- [ ] No unnecessary change detection cycles

### PrimeNG Patterns
- [ ] Use PrimeNG components directly (no custom wrappers)
- [ ] Correct component names for PrimeNG 21 (p-select not p-dropdown)
- [ ] Proper event binding patterns

### Data Flow
- [ ] Understand full data flow before modifying
- [ ] Query Elasticsearch directly when debugging data issues
- [ ] Respect existing adapter patterns

### Code Style
- [ ] No over-engineering
- [ ] Minimal changes to fix the issue
- [ ] No unnecessary refactoring
- [ ] Preserve existing patterns

---

## Fix Attempt Strategy

### Attempt 1: Direct Analysis
- Read error message and stack trace
- Examine test screenshots
- Check console errors
- Review API call logs
- Apply fix based on local context

### Attempt 2: Web Search Informed
- Search for error message + Angular 21
- Search for component + PrimeNG 21
- Look for GitHub issues
- Apply fix based on community solutions

### Attempt 3: Deep Investigation
- Trace full data flow
- Compare with working similar components
- Consider architectural changes
- Try alternative implementation approach

### DEFERRED
- Revert all attempted changes
- Document the issue thoroughly:
  - Test ID and name
  - Error details
  - All attempted fixes
  - Potential root causes
  - Suggested manual investigation

---

## Output Report

After pipeline completion:

```markdown
# QA Pipeline Report

**Run Date**: 2026-01-02T12:00:00
**Duration**: 45 minutes
**Tests**: 60 total

## Summary
- Passed (no fix needed): 55
- Fixed (attempt 1): 3
- Fixed (attempt 2): 1
- Fixed (attempt 3): 0
- DEFERRED: 1

## Fixes Applied

### TEST-042: Filter in pop-out syncs to main
- **Attempt**: 1
- **Root Cause**: Missing detectChanges() after BroadcastChannel message
- **Fix**: Added detectChanges() in message handler
- **Files Changed**: `filter-sync.service.ts:142`

### TEST-087: Pagination state persists in URL
- **Attempt**: 2
- **Root Cause**: PrimeNG 21 changed paginator event structure
- **Fix**: Updated event handler to use new API
- **Files Changed**: `results-table.component.ts:88`
- **Reference**: https://github.com/primefaces/primeng/issues/12345

## Deferred Issues

### TEST-103: URL with encoded special characters
- **Error**: Ampersand not properly encoded in filter value
- **Attempts**:
  1. Added encodeURIComponent - still failed
  2. Tried URLSearchParams API - still failed
  3. Attempted custom encoder - still failed
- **Suggested Investigation**: May be backend issue, check API handler
```

---

## Implementation Phases

### Phase 1: Single Test Runner (Current)
- `/qa` command runs all tests
- Manual analysis of failures

### Phase 2: Stop-on-Failure Mode
- Run tests sequentially
- Stop on first failure
- Present analysis to user

### Phase 3: Auto-Fix with Rubric
- Attempt automatic fix
- Validate against rubric
- Re-run single test

### Phase 4: Multi-Attempt with Search
- Web search on failure
- Three attempt strategy
- DEFERRED handling

### Phase 5: Full Autonomous Pipeline
- Run entire suite unattended
- Generate comprehensive report
- Git commit fixes with context

---

## Integration with Existing Infrastructure

### Uses
- Playwright test infrastructure (`frontend/e2e/qa/`)
- TestContext for artifacts (screenshots, API logs, console errors)
- Existing test-utils helpers

### Extends
- Add single-test runner mode
- Add fix validation against rubric
- Add web search integration
- Add report generation

### Related Documents
- `docs/claude/qa-e2e-test-suite.md` - Test infrastructure docs
- `pending-pipeline/` - Original vision-based pipeline concept
- `CLAUDE.md` - Architecture rules (URL-First, OnPush, etc.)

---

**Next Steps**: Implement Phase 2 (stop-on-failure mode) as next iteration.
