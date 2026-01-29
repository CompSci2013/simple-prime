# QA E2E Test Runner

**Description**: Run the full QA E2E test suite agentically.

---

## Directive

Execute the QA E2E test suite with full automation:

### Step 1: Stop Existing Dev Server (if running)

```bash
# Check if port 4205 is in use
lsof -i :4205 | grep LISTEN
# If found, kill the process
```

### Step 2: Start Dev Server in Background

```bash
cd /home/odin/projects/generic-prime/frontend
npm run dev:server
```

Run this in background mode. Wait for "Application bundle generation complete" or HTTP 200 on port 4205.

### Step 3: Run QA E2E Tests

```bash
cd /home/odin/projects/generic-prime/frontend
npx playwright test e2e/qa/
```

Timeout: 5 minutes (tests typically complete in ~55 seconds)

### Step 4: Analyze and Report

After tests complete, provide:

1. **Summary**: X/60 tests passed
2. **By Category**: Pass/fail count per category (6 categories)
3. **Failures**: If any tests failed, list them with test ID and error
4. **Console Errors**: Note if any tests had console errors

### Step 5: Leave Server Running

Do NOT stop the dev server after tests complete.

---

## Test Categories Reference

| Category | Test IDs | Focus |
|----------|----------|-------|
| 1: Basic Filters | 001-010 | Filter add/remove/clear |
| 2: Pop-Out Lifecycle | 021-030 | Pop-out open/close |
| 3: Filter-PopOut Sync | 041-050 | BroadcastChannel sync |
| 4: Highlight Operations | 061-070 | URL h_* params |
| 5: URL Persistence | 081-090 | Back/forward/refresh |
| 6: Edge Cases | 101-110 | Error handling |

---

## Output Locations

- Test artifacts: `frontend/test-results/TEST-*/`
- HTML report: `frontend/test-results/qa-report.html`
- Generate report: `npx ts-node e2e/qa/generate-report.ts`
