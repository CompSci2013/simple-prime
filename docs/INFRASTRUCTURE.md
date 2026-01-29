# Infrastructure Architecture & Configuration

**Last Updated**: 2025-12-20
**Status**: Cleaned up and consolidated (Session 21)

---

## Overview

Generic-prime uses **three distinct environments** with different deployment targets and access methods:

| Environment | Purpose | Deployment | Access | Location |
|---|---|---|---|---|
| **Development** | Active development with live reload | Docker/Podman (local) | `http://192.168.0.244:4205` | Thor host |
| **E2E Testing** | Automated browser testing | Podman container + dev server | Playwright framework | Thor host |
| **Production** | Deployed application | Kubernetes + Traefik Ingress | `http://generic-prime.minilab/` | Thor K3s cluster |

---

## Development Environment

### Access Method: IP Address + Port

**URL**: `http://192.168.0.244:4205`

### How It Works

1. **Frontend Application**
   - Runs inside development container: `localhost/generic-prime-frontend:dev`
   - Angular CLI dev server: `ng serve --host 0.0.0.0 --port 4205`
   - Container mounts source code for live reload

2. **Backend API Access**
   - Frontend is configured to call: `http://generic-prime.minilab/api/specs/v1`
   - This hostname maps to `192.168.0.244` (Thor) in `/etc/hosts`
   - Traefik ingress routes the `/api` requests to `generic-prime-backend-api:3000` (Kubernetes service)

### Development Container

**Image**: `localhost/generic-prime-frontend:dev`
**Location**: `frontend/Dockerfile.dev`

```dockerfile
# Features:
- Node 18-alpine base
- Angular CLI 14.2.13
- Playwright 1.57.0 (for E2E tests)
- Bash, chromium, and other dev tools
- Claude Code CLI
```

### Starting Development

**Manual method** (if not using IDE launch):
```bash
cd ~/projects/generic-prime

# Start development container (if not running)
podman start generic-prime-frontend-dev 2>/dev/null || \
  podman run -d --name generic-prime-frontend-dev --network host \
    -v $(pwd):/app:z -w /app localhost/generic-prime-frontend:dev

# Run dev server inside container
podman exec -it generic-prime-frontend-dev npm start -- --host 0.0.0.0 --port 4205
```

### Environment Configuration

**File**: `frontend/src/environments/environment.ts`

```typescript
export const environment = {
  production: false,
  apiBaseUrl: 'http://generic-prime.minilab/api/specs/v1',
  includeTestIds: true  // For E2E testing
};
```

---

## E2E Testing Environment

### Testing with Playwright

**Test Framework**: Playwright 1.57.0
**Test Location**: `frontend/e2e/` (TypeScript)
**Configuration**: `frontend/playwright.config.ts`

### Running Tests

**Full test run** (starts dev server automatically):
```bash
./scripts/run-e2e-tests.sh
```

**Test-only run** (assumes dev server already running on 4205):
```bash
./scripts/run-e2e-tests.sh --only-test
```

### How E2E Works

1. **Container Setup**
   - Starts `localhost/generic-prime-e2e:latest` (Playwright base image)
   - Mounts test files and source code
   - Uses `--network host` to access `localhost:4205`

2. **Dev Server**
   - Optionally starts Angular dev server (`ng serve`) on port 4205
   - Waits for "Compiled successfully" message
   - Timeout: 60 seconds

3. **Test Execution**
   - Runs `npm run test:e2e` inside container
   - Uses Chrome/Chromium headless browser
   - Generates HTML report: `frontend/playwright-report/`

### E2E Container

**Image**: `mcr.microsoft.com/playwright:v1.57.0-jammy`
**Location**: `frontend/Dockerfile.e2e`

Built on Microsoft's official Playwright image with:
- Chromium/Chrome browser
- System dependencies for browser automation
- Node.js and npm pre-installed
- Hostname mapping for backend access

### E2E Configuration

**File**: `frontend/playwright.config.ts`

```typescript
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:4205',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  webServer: !process.env.IN_DOCKER ? {
    command: 'npm start -- --host 0.0.0.0 --port 4205',
    url: 'http://localhost:4205',
    timeout: 120 * 1000,
    reuseExistingServer: !process.env.CI,
  } : undefined,
});
```

---

## Production Environment

### Access Method: Fully Qualified Domain Name

**URL**: `http://generic-prime.minilab/`
**Requires Windows hosts entry**: `192.168.0.244 generic-prime.minilab`

### How It Works

1. **Frontend Build**
   - Angular production build: `ng build --configuration production`
   - Output: `frontend/dist/frontend/` (optimized, minified, tree-shaken)

2. **Docker Image**
   - 2-stage Docker build (builder + nginx)
   - Builder: Compiles Angular app with Node 18
   - Runtime: Serves with nginx alpine

3. **Kubernetes Deployment**
   - Deployed to Thor K3s cluster
   - Namespace: `generic-prime`
   - Replicas: 2 (pod redundancy)
   - Node selector: `kubernetes.io/hostname: thor`

4. **Traefik Ingress Routing**
   - Hostname: `generic-prime.minilab`
   - Routes `/` → Frontend pods on port 80
   - Routes `/api` → Backend service on port 3000
   - LoadBalancer IPs: 192.168.0.110 (Loki) and 192.168.0.244 (Thor)

### Production Build Pipeline

**Build the frontend**:
```bash
cd ~/projects/generic-prime/frontend
ng build --configuration production
```

**Create Docker image**:
```bash
cd ~/projects/generic-prime
podman build -f frontend/Dockerfile.prod -t localhost/generic-prime-frontend:prod .
```

**Save and import into K3s**:
```bash
podman save localhost/generic-prime-frontend:prod -o /tmp/generic-prime-frontend.tar
sudo k3s ctr images import /tmp/generic-prime-frontend.tar
rm /tmp/generic-prime-frontend.tar
```

**Deploy to Kubernetes**:
```bash
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/frontend-deployment.yaml
kubectl apply -f k8s/frontend-service.yaml
kubectl apply -f k8s/ingress.yaml
```

### Production Dockerfile

**File**: `frontend/Dockerfile.prod`

```dockerfile
# Stage 1: Build (Node 18)
FROM node:18-alpine AS builder
# Installs dependencies, runs ng build --configuration production
# Output: /app/dist/frontend

# Stage 2: Runtime (nginx)
FROM nginx:alpine
# Copies nginx.conf for proper routing
# Copies built app from Stage 1
# Exposes port 80
# Starts nginx in foreground mode
```

### Production Nginx Configuration

**File**: `frontend/nginx.conf`

Features:
- Serves Angular app with proper cache control
- Static assets (JS/CSS) cached for 30 days (versioned by build)
- `index.html` never cached (always get fresh)
- Security headers (X-Frame-Options, X-Content-Type-Options, etc.)
- Gzip compression enabled
- API proxy: `/api` → backend service
- Angular routing: Redirects 404s to `index.html` for client-side routing
- Health check endpoint at `/health`

### Production Kubernetes Files

| File | Purpose |
|------|---------|
| `k8s/namespace.yaml` | Creates `generic-prime` namespace |
| `k8s/frontend-deployment.yaml` | Deploys frontend (2 replicas, health checks) |
| `k8s/frontend-service.yaml` | Exposes frontend on ClusterIP:80 |
| `k8s/ingress.yaml` | Traefik routing rules |

### Production Environment Configuration

**File**: `frontend/src/environments/environment.prod.ts`

```typescript
export const environment = {
  production: true,
  apiBaseUrl: 'http://generic-prime.minilab/api/specs/v1',
  includeTestIds: false  // Stripped from prod build
};
```

---

## Backend Infrastructure (Kubernetes)

The backend is deployed separately (see `~/projects/data-broker/generic-prime/`) but used by generic-prime.

### Backend Access

**Service**: `generic-prime-backend-api` (K8s namespace: `generic-prime`)
**Service Type**: ClusterIP
**Internal Address**: `10.43.254.90:3000`
**Replicas**: 2

### Backend API Endpoints

All accessible via Traefik ingress at: `http://generic-prime.minilab/api/specs/v1/...`

- `GET /health` - Health check
- `GET /ready` - Readiness check
- `GET /vehicles/details` - Vehicle search (supports pagination, filtering)
- `GET /manufacturer-model-combinations` - Available manufacturer/model pairs
- `GET /filters/:fieldName` - Filter options (body_class, year, price_range, etc.)

---

## Configuration Files & Cruft Cleanup

### What Was Cleaned Up (Session 21)

| Item | Status | Reason |
|------|--------|--------|
| ✅ Created `frontend/nginx.conf` | Was missing | Required by Dockerfile.prod |
| ✅ Fixed `Dockerfile.prod` | Had wrong path | Changed `dist/autos` → `dist/frontend` |
| ❌ Deleted `Dockerfile.dev` (root) | Was duplicate | `frontend/Dockerfile.dev` is the correct one |
| ❌ Deleted `proxy.conf.json` | Was cruft | Superseded by `proxy.conf.js` |
| ✅ Unified API hostname | Was inconsistent | Both dev and prod now use `generic-prime.minilab` |
| ✅ Added K8s health checks | Was missing | Added liveness and readiness probes |
| ✅ Consolidated E2E scripts | Two existed | `run-e2e-tests.sh` now handles both cases, removed `test.sh` |

### Current Configuration Files

**Angular Build**:
- `frontend/angular.json` - Output path: `dist/frontend` ✓
- `frontend/tsconfig.json` - TypeScript configuration
- `frontend/tsconfig.app.json` - App-specific TypeScript config

**Environment Variables**:
- `frontend/src/environments/environment.ts` - Development config
- `frontend/src/environments/environment.prod.ts` - Production config
- No `.env` files (configuration via environment files)

**Proxy & Development**:
- `frontend/proxy.conf.js` - Dev server proxy for `/report` path (ACTIVE)
- `frontend/nginx.conf` - Production Nginx configuration (REQUIRED)

**Testing**:
- `frontend/playwright.config.ts` - E2E test configuration
- `frontend/karma.conf.js` - Configured but unused (no unit tests per project policy)

**Kubernetes**:
- `k8s/namespace.yaml` - K8s namespace
- `k8s/frontend-deployment.yaml` - Frontend deployment
- `k8s/frontend-service.yaml` - Frontend service
- `k8s/ingress.yaml` - Traefik ingress rules

---

## Network Configuration

### Windows Client `/etc/hosts`

```
192.168.0.244 thor generic-prime.minilab
```

Maps both:
- `thor` - Reference to host machine (optional)
- `generic-prime.minilab` - Production access (when K8s deployment is active)

### Thor K3s `/etc/hosts`

```
192.168.0.244 thor thor.minilab
192.168.0.244 generic-prime-dockview.minilab
```

### DNS Flow

```
User browser request to: http://generic-prime.minilab/
↓
Windows /etc/hosts resolves to: 192.168.0.244 (Thor)
↓
Request hits Thor port 80 (Traefik ingress)
↓
Traefik routes based on hostname + path
  / → generic-prime-frontend:80 (Kubernetes service)
  /api → generic-prime-backend-api:3000 (Kubernetes service)
↓
Request reaches pod
```

---

## Deployment Checklist

### Before Production Deployment

- [ ] Update `environment.prod.ts` with correct API hostname (currently: `generic-prime.minilab`)
- [ ] Verify backend Kubernetes deployment is running
- [ ] Test backend endpoints manually
- [ ] Build and test frontend locally: `npm run build`
- [ ] Create/verify Docker image: `podman build -f frontend/Dockerfile.prod`
- [ ] Verify image exists in local registry: `podman images | grep generic-prime-frontend`

### Kubernetes Deployment Steps

```bash
# 1. Create namespace and initial setup
kubectl apply -f k8s/namespace.yaml

# 2. Import frontend image into K3s
podman save localhost/generic-prime-frontend:prod -o /tmp/frontend.tar
sudo k3s ctr images import /tmp/frontend.tar
rm /tmp/frontend.tar

# 3. Deploy frontend
kubectl apply -f k8s/frontend-deployment.yaml
kubectl apply -f k8s/frontend-service.yaml

# 4. Create ingress (routes traffic)
kubectl apply -f k8s/ingress.yaml

# 5. Verify everything is running
kubectl get pods -n generic-prime
kubectl get svc -n generic-prime
kubectl get ingress -n generic-prime

# 6. Test the deployment
curl http://generic-prime.minilab/
```

### Updating a Deployment

```bash
# 1. Build new image
podman build -f frontend/Dockerfile.prod -t localhost/generic-prime-frontend:prod .

# 2. Import into K3s
podman save localhost/generic-prime-frontend:prod -o /tmp/frontend.tar
sudo k3s ctr images import /tmp/frontend.tar
rm /tmp/frontend.tar

# 3. Restart pods (will pull new image)
kubectl rollout restart deployment/generic-prime-frontend -n generic-prime

# 4. Watch rollout
kubectl rollout status deployment/generic-prime-frontend -n generic-prime
```

---

## Troubleshooting

### Development: Port 4205 Not Responding

```bash
# Check if container is running
podman ps | grep generic-prime-frontend-dev

# If not running, start it
podman run -d --name generic-prime-frontend-dev --network host \
  -v $(pwd):/app:z -w /app localhost/generic-prime-frontend:dev

# Check dev server logs
podman logs -f generic-prime-frontend-dev

# Test direct connection
curl http://192.168.0.244:4205
```

### Production: Ingress Not Routing

```bash
# Verify ingress exists
kubectl get ingress -n generic-prime
kubectl describe ingress generic-prime-ingress -n generic-prime

# Check frontend pods are running
kubectl get pods -n generic-prime -l app=generic-prime-frontend

# Check frontend service exists
kubectl get svc -n generic-prime generic-prime-frontend

# Test from inside cluster
kubectl exec -it <pod-name> -n generic-prime -- curl http://localhost:80/
```

### E2E Tests Failing

```bash
# Run with verbose output
./scripts/run-e2e-tests.sh --verbose

# Check container logs
podman logs generic-prime-e2e

# Verify dev server is running inside container
podman exec generic-prime-e2e curl http://localhost:4205

# Re-run tests only (dev server assumed running)
./scripts/run-e2e-tests.sh --only-test
```

---

## Related Documentation

- `docs/claude/ORIENTATION.md` - Architecture and static infrastructure
- `docs/claude/PROJECT-STATUS.md` - Current session status and known bugs
- `docs/POPOUT-ARCHITECTURE.md` - Pop-out window architecture
- `docs/claude/DATA-BROKER-INTEGRATION.md` - Backend integration details

---

**End of Infrastructure Documentation**
