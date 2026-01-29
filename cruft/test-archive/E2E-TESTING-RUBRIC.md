# E2E Testing Environment Verification Rubric

## Overview
This rubric defines the checklist and verification steps for ensuring the E2E testing environment is properly configured and ready to execute tests.

## Architecture
- **Test Container**: `Dockerfile.e2e` (self-contained, includes app build + dev server + test execution)
- **Test Framework**: Playwright v1.57.0
- **Test Port**: 4205 (localhost within container)
- **Test Environment Variable**: `IN_DOCKER=true` (tells Playwright to skip webServer config)
- **Backend Dependency**: `http://generic-prime.minilab/api/specs/v1` (must be accessible)

---

## Pre-Flight Verification Checklist

### 1. Backend API Availability
**Purpose**: Verify the backend is running and accessible before building E2E image

- [ ] **1.1** Check backend pods are running in Kubernetes
  ```bash
  kubectl get pods -n generic-prime -l app=generic-prime-backend-api
  ```
  **Expected**: 2 pods with status `Running`

- [ ] **1.2** Verify backend API responds (health check)
  ```bash
  kubectl port-forward -n generic-prime svc/generic-prime-backend-api 3000:3000 &
  curl http://localhost:3000/health
  ```
  **Expected**: Status 200 with response

- [ ] **1.3** Verify Elasticsearch index exists and contains data
  ```bash
  kubectl logs -n generic-prime -l app=generic-prime-backend-api --tail=20 | grep "autos-unified"
  ```
  **Expected**: Line showing `✓ Index 'autos-unified' found with 4887 documents`

---

### 2. Frontend Source Code Configuration
**Purpose**: Verify all source files have correct test-id setup

- [ ] **2.1** Environment configuration has `includeTestIds` flag
  ```bash
  grep -n "includeTestIds" frontend/src/environments/environment.ts
  ```
  **Expected**: `includeTestIds: true` in development config

- [ ] **2.2** Environment prod has `includeTestIds: false`
  ```bash
  grep -n "includeTestIds" frontend/src/environments/environment.prod.ts
  ```
  **Expected**: `includeTestIds: false` in production config

- [ ] **2.3** Component TypeScript files import environment
  ```bash
  grep -l "import.*environment" frontend/src/framework/components/*/query-control.component.ts
  ```
  **Expected**: Environment imported in all 4 key components

- [ ] **2.4** Component templates have conditional test-id bindings
  ```bash
  grep -c "data-testid.*environment.includeTestIds" frontend/src/framework/components/*/*html
  ```
  **Expected**: Multiple matches across component templates

---

### 3. Dockerfile Configuration
**Purpose**: Verify Dockerfile.e2e is correctly configured

- [ ] **3.1** Dockerfile exists and uses correct Playwright image
  ```bash
  head -3 frontend/Dockerfile.e2e | grep "playwright"
  ```
  **Expected**: `FROM mcr.microsoft.com/playwright:v1.57.0-jammy`

- [ ] **3.2** Dockerfile builds the app
  ```bash
  grep "npm run build" frontend/Dockerfile.e2e
  ```
  **Expected**: `RUN npm run build` line present

- [ ] **3.3** Dockerfile starts dev server with correct port
  ```bash
  grep "npm start" frontend/Dockerfile.e2e
  ```
  **Expected**: `npm start -- --host 0.0.0.0 --port 4205` in CMD

- [ ] **3.4** Dockerfile sets IN_DOCKER environment variable for tests
  ```bash
  grep "IN_DOCKER" frontend/Dockerfile.e2e
  ```
  **Expected**: `IN_DOCKER=true` in test command

- [ ] **3.5** Dockerfile includes sleep for server startup
  ```bash
  grep "sleep" frontend/Dockerfile.e2e
  ```
  **Expected**: `sleep 5` (or longer) between server start and tests

---

### 4. Playwright Configuration
**Purpose**: Verify Playwright is configured to use the correct port and skip webServer setup in Docker

- [ ] **4.1** Playwright config has correct port
  ```bash
  grep "const PORT = " frontend/playwright.config.ts
  ```
  **Expected**: `const PORT = 4205;`

- [ ] **4.2** Playwright config checks IN_DOCKER environment variable
  ```bash
  grep -A 5 "IN_DOCKER" frontend/playwright.config.ts
  ```
  **Expected**: Conditional webServer config skipped when `IN_DOCKER=true`

- [ ] **4.3** Test timeout is sufficient
  ```bash
  grep "timeout:" frontend/playwright.config.ts
  ```
  **Expected**: `timeout: 30000` (30 seconds per test)

---

### 5. Docker Image Build
**Purpose**: Verify the E2E test image is built and ready

- [ ] **5.1** Check image exists
  ```bash
  podman images | grep "generic-prime-e2e"
  ```
  **Expected**: `generic-prime-e2e` image present with recent date

- [ ] **5.2** Check image has reasonable size
  ```bash
  podman images generic-prime-e2e --format "{{.Size}}"
  ```
  **Expected**: Greater than 1GB (includes Playwright + browsers + app build)

- [ ] **5.3** Check image build includes dependencies
  ```bash
  podman inspect generic-prime-e2e | grep -i playwright
  ```
  **Expected**: Playwright version metadata present

---

### 6. Container Network Access
**Purpose**: Verify container can reach backend API

- [ ] **6.1** Container can resolve DNS for backend
  ```bash
  podman run --rm generic-prime-e2e nslookup generic-prime.minilab
  ```
  **Expected**: Resolves to IP address (not NXDOMAIN)

- [ ] **6.2** Container can reach backend health endpoint
  ```bash
  podman run --rm generic-prime-e2e curl -s http://generic-prime.minilab/api/specs/v1/health
  ```
  **Expected**: HTTP 200 response (or appropriate API response)

---

### 7. Test File Integrity
**Purpose**: Verify E2E test files exist and are valid

- [ ] **7.1** Test file exists
  ```bash
  ls -la frontend/e2e/*.spec.ts
  ```
  **Expected**: `app.spec.ts` present

- [ ] **7.2** Test file references correct selectors
  ```bash
  grep -c "data-testid=" frontend/e2e/app.spec.ts
  ```
  **Expected**: Multiple matches (tests looking for test-ids)

- [ ] **7.3** Test file has valid syntax
  ```bash
  grep -c "describe\|it\|test" frontend/e2e/app.spec.ts
  ```
  **Expected**: Multiple test blocks defined

---

## Pre-Test Execution Verification

### 8. Immediate Pre-Test Checks (Run Before Each Test Suite)

- [ ] **8.1** Backend is still healthy
  ```bash
  kubectl get pods -n generic-prime -l app=generic-prime-backend-api | grep Running
  ```
  **Expected**: Both pods show Running status

- [ ] **8.2** Docker daemon is accessible
  ```bash
  podman ps
  ```
  **Expected**: Command succeeds, shows running containers

- [ ] **8.3** Image is available locally
  ```bash
  podman images generic-prime-e2e --format "{{.Repository}}"
  ```
  **Expected**: `localhost/generic-prime-e2e`

---

## Test Execution Verification

### 9. During Test Execution

- [ ] **9.1** Container starts successfully
  - Monitor for: Container exits with error code
  - Expected: Container runs without immediate exit

- [ ] **9.2** Dev server starts within container
  - Monitor for: `Angular Live Development Server is listening on 0.0.0.0:4205`
  - Expected: Message appears in output after ~10 seconds

- [ ] **9.3** Dev server compiles successfully
  - Monitor for: `✔ Compiled successfully`
  - Expected: Success message before tests start

- [ ] **9.4** Tests find test-id elements
  - Monitor for: Zero "element(s) not found" errors for test-id selectors
  - Expected: Selectors are found (may have other functional test failures)

- [ ] **9.5** Tests complete within timeout
  - Monitor for: No `Test timeout of 30000ms exceeded` errors
  - Expected: Tests complete or fail with functional errors, not timeout

---

## Troubleshooting Decision Tree

### Issue: "element(s) not found" for test-ids
**Root Cause Options**:
1. `includeTestIds: false` in environment config
2. Component doesn't import environment
3. Template doesn't have `[attr.data-testid]` binding

**Resolution**:
- Verify step 2.1-2.4 of rubric
- Check git diff for any reverted changes

### Issue: "Cannot connect to http://generic-prime.minilab"
**Root Cause Options**:
1. Backend pods not running
2. Network/DNS issue in Docker
3. Backend API unhealthy

**Resolution**:
- Verify step 1.1-1.3 of rubric
- Check backend logs for errors
- Verify container network config

### Issue: "Test timeout of 30000ms exceeded"
**Root Cause Options**:
1. Dev server taking too long to start/compile
2. Browser not launching
3. Page not loading from backend

**Resolution**:
- Increase sleep in Dockerfile from 5s to 15-30s
- Check Playwright browser config
- Verify backend connectivity (step 6.2)

### Issue: Docker image build fails
**Root Cause Options**:
1. npm install failing
2. ng build failing (bundle too large?)
3. Source code syntax errors

**Resolution**:
- Check build output for specific error
- Verify frontend/package.json is valid
- Run `npm run build` locally first

---

## Success Criteria

**All tests pass OR test failures are functional, not infrastructure-related**:
- ✅ Containers start and run without errors
- ✅ Dev server compiles successfully
- ✅ Test-id selectors are found in HTML
- ✅ Tests reach application code (not timing out on startup)
- ✅ Backend is accessible from tests

**Test failures are acceptable if**:
- Application functionality issues (dialogs not opening, data not loading)
- Logic errors in application code
- Tests need adjustment to match new behavior

**Test failures are NOT acceptable if**:
- "element(s) not found" for test-ids
- Cannot connect to backend
- Container exits during startup
- Playwright timeout during setup phase
