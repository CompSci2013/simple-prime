# E2E Testing Setup Plan - Step by Step

## Objective
Get all required components configured and running before executing the actual E2E test suite.

## Timeline Assumptions
- Each step takes ~2 minutes unless otherwise noted
- Total estimated time: 30-40 minutes
- Critical path: Backend → Source code → Docker build → Container test

---

## Phase 1: Infrastructure Verification (5 minutes)

### Step 1: Verify Backend API is Running
```bash
# Check Kubernetes pods
kubectl get pods -n generic-prime -l app=generic-prime-backend-api

# Expected output:
# NAME                                         READY   STATUS    RESTARTS   AGE
# generic-prime-backend-api-695f7c47f4-ncw59   1/1     Running   1          6d8h
# generic-prime-backend-api-695f7c47f4-tj6kk   1/1     Running   1          6d8h
```

**Success Criteria**: Both pods show `Running` status

**If Failed**:
- Check: `kubectl describe pod -n generic-prime <pod-name>`
- Restart: `kubectl rollout restart deployment -n generic-prime generic-prime-backend-api`

---

### Step 2: Verify Backend API is Healthy
```bash
# Check backend health
kubectl logs -n generic-prime -l app=generic-prime-backend-api --tail=30 | grep -E "Elasticsearch|Index"

# Expected output:
# ✓ Elasticsearch connection successful
# ✓ Index 'autos-unified' found with 4887 documents
```

**Success Criteria**: Both success messages appear in logs

**If Failed**:
- Check Elasticsearch cluster status: `kubectl get pods -n tle-cluster -l app=elasticsearch`
- Check backend error logs: `kubectl logs -n generic-prime -l app=generic-prime-backend-api --tail=100`

---

## Phase 2: Source Code Verification (10 minutes)

### Step 3: Verify Environment Configuration
```bash
# Check development environment has includeTestIds
cat frontend/src/environments/environment.ts | grep -A 5 "export const"

# Expected output includes:
# includeTestIds: true
```

**Success Criteria**: `includeTestIds: true` in environment.ts

**If Failed**:
```bash
# Add missing flag
sed -i '/apiBaseUrl:/a\  includeTestIds: true' frontend/src/environments/environment.ts
```

---

### Step 4: Verify Production Environment (Test-IDs Stripped)
```bash
# Check production environment has includeTestIds false
cat frontend/src/environments/environment.prod.ts | grep -A 5 "export const"

# Expected output includes:
# includeTestIds: false
```

**Success Criteria**: `includeTestIds: false` in environment.prod.ts

**If Failed**:
```bash
# Add missing flag
sed -i '/apiBaseUrl:/a\  includeTestIds: false' frontend/src/environments/environment.prod.ts
```

---

### Step 5: Verify Component TypeScript Files Import Environment
```bash
# Check all 4 key components import environment
for component in query-control results-table statistics-panel base-picker; do
  echo "=== $component ==="
  grep "import.*environment" frontend/src/framework/components/$component/$component.component.ts
done

# Expected: import statement in each file
# import { environment } from '../../../environments/environment';
```

**Success Criteria**: All 4 components have the import

**If Failed**: Add import to missing components:
```typescript
import { environment } from '../../../environments/environment';
```

---

### Step 6: Verify Component Templates Have Test-ID Bindings
```bash
# Check for test-id bindings in templates
grep -n "data-testid.*environment.includeTestIds" \
  frontend/src/framework/components/query-control/query-control.component.html \
  frontend/src/framework/components/results-table/results-table.component.html \
  frontend/src/framework/components/statistics-panel/statistics-panel.component.html \
  frontend/src/framework/components/base-picker/base-picker.component.html

# Expected: Multiple matches showing conditional test-id attributes
```

**Success Criteria**: Multiple matches across all component templates

**If Failed**: Add conditional test-id bindings to component root elements:
```html
<div [attr.data-testid]="environment.includeTestIds ? 'component-name' : null">
```

---

### Step 7: Verify Test File Syntax
```bash
# Check test file is valid TypeScript
npx tsc --noEmit frontend/e2e/app.spec.ts 2>&1 | head -20

# Expected: No compilation errors
```

**Success Criteria**: No TypeScript errors reported

**If Failed**:
- Check: `cat frontend/e2e/app.spec.ts | head -50`
- Fix any syntax errors in test file

---

## Phase 3: Git Status Verification (2 minutes)

### Step 8: Verify Source Code Changes Are Staged
```bash
# See all changes
git status

# Expected output: All modified files listed, nothing unexpected
```

**Success Criteria**: Only expected component files, environment files, and test files are modified

**If Failed - Stray Changes**:
```bash
# Discard unintended changes
git checkout frontend/src/framework/components/unwanted-file.ts
```

**If Failed - Missing Changes**:
- Go back to Phase 2 and verify each file was properly modified

---

## Phase 4: Docker Image Preparation (15-20 minutes)

### Step 9: Verify Dockerfile.e2e Configuration
```bash
# Check Dockerfile uses correct Playwright image
head -5 frontend/Dockerfile.e2e

# Expected:
# FROM mcr.microsoft.com/playwright:v1.57.0-jammy
```

**Success Criteria**: Correct Playwright version

**If Failed**: Update Dockerfile.e2e image version if needed

---

### Step 10: Verify Dockerfile Builds App and Sets Dev Server
```bash
# Check build steps
grep -n "npm run build\|npm start\|sleep\|IN_DOCKER" frontend/Dockerfile.e2e

# Expected output (approximate line numbers may vary):
# RUN npm run build
# npm start -- --host 0.0.0.0 --port 4205 &
# sleep 5
# IN_DOCKER=true npm run test:e2e
```

**Success Criteria**: All required steps present

**If Failed**: Update Dockerfile.e2e to include all steps

---

### Step 11: Clean Docker Build (No Cache)
```bash
# Remove old image to force fresh build
podman rmi localhost/generic-prime-e2e:latest

# Build new image without cache
podman build --no-cache -f frontend/Dockerfile.e2e -t generic-prime-e2e . 2>&1 | tee build.log

# Monitor output for:
# - "npm install" completing successfully
# - "ng build" completing (watch for bundle size warnings)
# - No errors in npm or build output
```

**Estimated Time**: 10-15 minutes

**Success Criteria**:
- Build completes without errors
- Final line shows: `Successfully tagged localhost/generic-prime-e2e:latest`

**If Failed - npm install fails**:
```bash
# Check specific error
tail -50 build.log | grep -A 5 "ERR\|error"
# Likely: peer dependency issue, try:
# npm install --legacy-peer-deps
```

**If Failed - ng build fails**:
```bash
# Check build error
tail -100 build.log | grep -A 10 "error"
# Possible: tsconfig issue, missing component, syntax error
```

---

### Step 12: Verify Built Image
```bash
# Check image exists and has reasonable size
podman images generic-prime-e2e

# Expected:
# REPOSITORY                    TAG       IMAGE ID      CREATED       SIZE
# localhost/generic-prime-e2e   latest    <hash>        30 seconds ago   ~7.5GB
```

**Success Criteria**:
- Image exists
- Size is reasonable (>5GB, should include Playwright + browsers + app build)
- Created timestamp is recent

---

## Phase 5: Network/Connectivity Testing (3 minutes)

### Step 13: Test Container Can Reach Backend
```bash
# Test DNS resolution from container
podman run --rm generic-prime-e2e nslookup generic-prime.minilab

# Expected: Resolves to IP address
```

**Success Criteria**: DNS resolution succeeds

**If Failed**:
- Check Docker network config
- Verify backend host is accessible from your machine

---

### Step 14: Test Backend API Connectivity from Container
```bash
# Test HTTP connectivity to backend API
podman run --rm generic-prime-e2e curl -s http://generic-prime.minilab/api/specs/v1/health

# Expected: HTTP response (200, 404, or JSON response)
```

**Success Criteria**: Gets response from backend API

**If Failed**:
- Check backend is running (Step 1)
- Check network connectivity between Docker and backend

---

## Phase 6: Pre-Test Execution Verification (2 minutes)

### Step 15: Final Checklist Before Test Execution
```bash
# Run all verification steps quickly

# 1. Backend still running?
kubectl get pods -n generic-prime -l app=generic-prime-backend-api | grep Running

# 2. Docker daemon accessible?
podman ps

# 3. Image available?
podman images generic-prime-e2e --format "{{.Repository}}"

# 4. Source code has changes?
git diff frontend/src/environments/environment.ts | grep includeTestIds
```

**Success Criteria**: All 4 checks pass

---

## Phase 7: E2E Test Execution

### Step 16: Run E2E Tests
```bash
# Execute the test suite
timeout 300 podman run --rm --ipc=host generic-prime-e2e 2>&1 | tee test-results.log

# Monitor for:
# - "Angular Live Development Server is listening on 0.0.0.0:4205" (dev server started)
# - "✔ Compiled successfully" (app built successfully)
# - "Running X tests" (tests starting)
# - Progress of individual tests
```

**Estimated Time**: 3-5 minutes

**Success Criteria**:
- Tests execute without container errors
- Dev server starts successfully
- Tests complete (pass or fail on app logic, not infrastructure)

**Expected Output Summary** at end:
```
X passed
Y failed
Running X tests using 1 worker
```

---

### Step 17: Analyze Test Results
```bash
# View HTML test report
open frontend/playwright/index.html

# Or view JSON results
cat frontend/test-results.json | jq '.stats'
```

**Expected Results**:
- Infrastructure tests pass (panels found with test-ids)
- Some functional tests may fail (data loading, dialogs, etc.)
- No timeout errors during startup

---

## Rollback Plan

If any phase fails, use these steps to rollback:

### Rollback Source Code Changes
```bash
git checkout frontend/src/environments/
git checkout frontend/src/framework/components/*/component.ts
git checkout frontend/src/framework/components/*/*.html
```

### Rollback Docker Image
```bash
podman rmi localhost/generic-prime-e2e:latest
```

### Full Reset
```bash
git clean -fd frontend/
git reset --hard HEAD
```

---

## Success Definition

**Setup is complete when**:
1. ✅ Backend API is running and healthy
2. ✅ All source code has correct test-id configuration
3. ✅ Docker image builds without errors
4. ✅ Container can reach backend API
5. ✅ Container starts and compiles app successfully
6. ✅ Tests execute and find test-id elements
7. ✅ Tests either pass or fail on application logic (not infrastructure)

**You are ready to debug application issues** when all 7 conditions are met.
