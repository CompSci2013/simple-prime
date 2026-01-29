# Generic-Prime Development Environment Setup

**Document Version:** 3.0 (UPDATED 2025-12-22)
**Date:** 2025-11-23 (Original), 2025-12-22 (Corrected)
**Purpose:** Complete procedure to build, deploy, and develop the Generic Discovery Framework (Port 4205)

**⚠️ CRITICAL: This document was updated on 2025-12-22 to correct architectural misunderstandings.**

**Project:** Generic-Prime - Domain-agnostic Angular 14 discovery framework
**Port:** 4205 (Development and Production)
**Frontend Location:** `/home/odin/projects/generic-prime/frontend/`
**Backend Location:** `/home/odin/projects/data-broker/generic-prime/` ← **NOT in generic-prime project**

---

## ARCHITECTURAL REALITY (Updated 2025-12-22)

**IMPORTANT:** The backend is NOT in `~/projects/generic-prime/backend-specs/`. That directory **does not exist**.

### Correct Architecture:
- **Frontend Source:** `~/projects/generic-prime/frontend/`
- **Backend Source:** `~/projects/data-broker/generic-prime/` (separate infrastructure project)
- **Backend Deployment:** `generic-prime-backend-api` (microservice in data-broker)
- **Frontend Dev Container:** Runs in Podman, calls backend via Traefik
- **Backend Production:** Runs in Kubernetes namespace `generic-prime`

### What This Means:
1. Frontend development uses `~/projects/generic-prime/frontend/`
2. Backend changes require rebuilding image from `~/projects/data-broker/generic-prime/`
3. Kubernetes deployment is centralized in data-broker, not generic-prime
4. K8s deployment manifests are in `~/projects/data-broker/generic-prime/infra/k8s/`, not `~/projects/generic-prime/k8s/`

---

## Overview

This document provides steps to:
1. ✅ Set up frontend dev container for ongoing development (IN generic-prime)
2. ❌ Build and deploy backend API (DO NOT - handled by data-broker project)
3. ⚠️ Call backend API from frontend (frontend calls data-broker backend)
4. 📋 When backend changes needed: See `/home/odin/projects/data-broker/generic-prime/docs/README.md`

**Architecture:**
- **Backend:** Specs API (Port 3000) - vehicle specifications + statistics
  - **Location:** `/home/odin/projects/data-broker/generic-prime/`
  - **Namespace:** `generic-prime`
  - **Service:** `generic-prime-backend-api:3000`
  - **Image:** `localhost/generic-prime-backend-api:v1.X.X`
- **Frontend:** Angular 14 with PrimeNG components (Port 4205)
  - **Location:** `/home/odin/projects/generic-prime/frontend/`
  - **Dev Container:** Podman on Thor
  - **Production:** Kubernetes namespace `generic-prime`
- **Data Store:** Elasticsearch (`elasticsearch.data.svc.cluster.local:9200`)
- **Ingress:** Traefik routing to `generic-prime.minilab`
- **Namespace:** `generic-prime`

**Prerequisites:**
- K3s cluster running with Traefik ingress
- Elasticsearch service available (index: `autos-unified`)
- Podman installed for container builds
- kubectl configured for cluster access

**Related Documentation:**
- **📄 [CLAUDE.md](../CLAUDE.md)** - Complete framework reference
- **📁 [plan/](../plan/)** - Architecture and implementation plans
- **📁 [specs/](../specs/)** - Component specifications
- **📁 [/home/odin/projects/data-broker/](../../../data-broker/)** - Backend infrastructure (separate project)

---

## Quick Reference

### Access Points

**Production (Kubernetes):**
- **Frontend:** http://generic-prime.minilab (port 80) or http://generic-prime.minilab:4205
- **Backend API:** http://generic-prime.minilab/api/... (via Traefik routing)
- **Backend Health:** http://generic-prime.minilab/api/health

**Development (Podman):**
- **Dev Frontend:** http://localhost:4205 or http://thor:4205
- **Backend API:** http://generic-prime.minilab/api/... (calls production K8s backend)

**Internal Services (Kubernetes):**
- **Backend:** http://generic-prime-backend-api.generic-prime.svc.cluster.local:3000
- **Frontend:** http://generic-prime-frontend.generic-prime.svc.cluster.local:80
- **Elasticsearch:** http://elasticsearch.data.svc.cluster.local:9200

### Project Structure

```
~/projects/generic-prime/
├── frontend/               # Frontend source code (THIS PROJECT)
│   ├── src/
│   │   ├── app/
│   │   ├── framework/      # Domain-agnostic components
│   │   └── domain-config/  # Automobile domain config
│   ├── proxy.conf.js       # Dev server proxy to backend
│   ├── Dockerfile.dev      # Dev container
│   ├── Dockerfile.prod     # Production container
│   └── package.json
├── docs/
│   ├── infrastructure/     # Infrastructure documentation (this file)
│   │   └── DEVELOPER-ENVIRONMENT.md
│   └── [other docs]
└── [other frontend files]

~/projects/data-broker/     # SEPARATE PROJECT - Backend infrastructure
├── generic-prime/          # Backend source code
│   ├── src/
│   │   ├── routes/         # API route definitions
│   │   ├── controllers/    # Request handlers
│   │   ├── services/       # Business logic + ES queries
│   │   └── config/         # Elasticsearch config
│   ├── infra/
│   │   ├── Dockerfile      # Backend container image
│   │   └── k8s/            # Kubernetes manifests
│   ├── package.json
│   └── docs/
│       └── README.md       # Backend API reference
└── [other data-broker files]
```

---

## Phase 1: Initial Kubernetes Setup

### Step 1: Create Namespace

**Server:** Thor

```bash
cd ~/projects/generic-prime/k8s
kubectl apply -f namespace.yaml
```

**Expected Output:** "namespace/generic-prime created"

**Verify:**
```bash
kubectl get namespace generic-prime
```

---

## Phase 2: Backend Development and Deployment

### Step 2: Edit Backend Code

**Server:** Thor
**Directory:** `~/projects/generic-prime/backend-specs`

```bash
cd ~/projects/generic-prime/backend-specs/src/services
nano elasticsearchService.js
```

**Common Changes:**
- Add/update API endpoints
- Modify Elasticsearch queries
- Add comma-separated filter support (see example below)

**Example: Add Comma-Separated Support for `bodyClass`**

Find the `bodyClass` filter section (around line 290):

```javascript
// BEFORE (single value only)
if (filters.bodyClass) {
  query.bool.filter.push({
    term: {
      'body_class': filters.bodyClass
    }
  });
}
```

Replace with:

```javascript
// AFTER (comma-separated values with OR logic)
if (filters.bodyClass) {
  // Handle comma-separated body classes (OR logic)
  const bodyClasses = filters.bodyClass.split(',').map(b => b.trim()).filter(b => b);

  if (bodyClasses.length === 1) {
    // Single body class: exact match using term query
    query.bool.filter.push({
      term: {
        'body_class': bodyClasses[0]
      }
    });
  } else if (bodyClasses.length > 1) {
    // Multiple body classes: OR logic with exact matching
    query.bool.filter.push({
      bool: {
        should: bodyClasses.map(bc => ({
          term: { 'body_class': bc }
        })),
        minimum_should_match: 1,
      },
    });
  }
}
```

---

### Step 3: Build Backend Image

**Server:** Thor

```bash
cd ~/projects/generic-prime/backend-specs
podman build -t localhost/generic-prime-backend:v1.0.1 .
```

**Expected Output:**
- "STEP 1/X" through "STEP X/X"
- "Successfully tagged localhost/generic-prime-backend:v1.0.1"
- Final image hash

**Build Time:** ~1-2 minutes with clean cache

**Note:** Increment version number (v1.0.1 → v1.0.2) for each new build

---

### Step 4: Export Backend Image as Tar

**Server:** Thor

```bash
cd ~/projects/generic-prime/backend-specs
podman save localhost/generic-prime-backend:v1.0.1 -o generic-prime-backend-v1.0.1.tar
```

**Expected Output:**
- "Copying blob" messages
- "Copying config" message
- "Writing manifest to image destination"

**File Size:** ~150-200 MiB

---

### Step 5: Import Backend Image to K3s

**Server:** Thor (or Loki if transferring tar)

```bash
cd ~/projects/generic-prime/backend-specs
sudo k3s ctr images import generic-prime-backend-v1.0.1.tar
```

**Expected Output:**
- "unpacking localhost/generic-prime-backend:v1.0.1"
- "localhost/generic-prime-backend:v1.0.1 saved"
- Import completion with timing

---

### Step 6: Verify Backend Image in K3s

**Server:** Thor

```bash
sudo k3s ctr images list | grep generic-prime-backend
```

**Expected Output:** Line showing `localhost/generic-prime-backend:v1.0.1`

---

### Step 7: Update Backend Deployment Manifest (if needed)

**Server:** Thor

```bash
cd ~/projects/generic-prime/k8s
nano backend-deployment.yaml
```

**Change Required:**
Find the `image:` line (around line 25):

```yaml
        image: localhost/generic-prime-backend:v1.0.0
```

Change to:

```yaml
        image: localhost/generic-prime-backend:v1.0.1
```

**Save:** `Ctrl+O`, `Enter`, `Ctrl+X`

---

### Step 8: Apply Backend Deployment

**Server:** Thor

```bash
cd ~/projects/generic-prime/k8s
kubectl apply -f backend-deployment.yaml
kubectl apply -f backend-service.yaml
```

**Expected Output:**
- "deployment.apps/generic-prime-backend created" (or configured)
- "service/generic-prime-backend created" (or configured)

---

### Step 9: Watch Backend Rollout

**Server:** Thor

```bash
kubectl rollout status deployment/generic-prime-backend -n generic-prime
```

**Expected Output:**
- "Waiting for deployment rollout to finish..."
- "deployment 'generic-prime-backend' successfully rolled out"

**Rollout Time:** ~30-60 seconds

---

### Step 10: Verify Backend Deployment

**Server:** Thor

```bash
# Check pods are running
kubectl get pods -n generic-prime | grep backend

# Test health endpoint
kubectl run -n generic-prime curl-test --image=curlimages/curl:latest --rm -it --restart=Never -- \
  curl http://generic-prime-backend:3000/health
```

**Expected Output:**
- Two pods with "1/1 Running" status
- Health check: `{"status":"ok",...}`

---

### Step 11: Apply Ingress Configuration

**Server:** Thor

```bash
cd ~/projects/generic-prime/k8s
kubectl apply -f ingress.yaml
```

**Expected Output:** "ingress.networking.k8s.io/generic-prime-ingress created"

**Verify Ingress:**
```bash
kubectl get ingress -n generic-prime
```

---

### Step 12: Test Backend API Through Ingress

**Server:** Thor

```bash
# Test API through ingress
curl "http://generic-prime.minilab/api/vehicles/details?page=1&size=2" | jq '.total'
```

**Expected Output:** Total document count (e.g., 4887)

**If fails:** Check ingress routing and DNS resolution:
```bash
# Check ingress
kubectl describe ingress generic-prime-ingress -n generic-prime

# Test DNS
host generic-prime.minilab

# Test from within cluster
kubectl run -n generic-prime curl-test --image=curlimages/curl:latest --rm -it --restart=Never -- \
  curl http://generic-prime-backend:3000/health
```

---

### Step 13: Test Comma-Separated Filters

**Server:** Thor

```bash
# Test single bodyClass
curl "http://generic-prime.minilab/api/vehicles/details?bodyClass=Sedan&size=1" | jq '.total'

# Test comma-separated bodyClass (should work after update!)
curl "http://generic-prime.minilab/api/vehicles/details?bodyClass=Sedan,SUV&size=1" | jq '.total'

# Test manufacturer
curl "http://generic-prime.minilab/api/vehicles/details?manufacturer=Ford,Chevrolet&size=1" | jq '.total'
```

**Expected Results:**
- Single bodyClass: Returns count (e.g., 2615 for Sedan)
- Multiple bodyClass: Returns combined count (e.g., 3613 for Sedan+SUV)
- Multiple manufacturer: Returns combined count (e.g., 1514 for Ford+Chevrolet)

**If comma-separated values return 0:** Backend code update failed, repeat steps 2-9

---

### Step 14: Clean Up Backend Tar Archive

**Server:** Thor

```bash
cd ~/projects/generic-prime/backend-specs
rm generic-prime-backend-v1.0.1.tar
```

---

## Phase 3: Frontend Production Deployment

### Step 15: Build Frontend Production Image

**Server:** Thor

```bash
cd ~/projects/generic-prime/frontend
podman build -f Dockerfile.prod -t localhost/generic-prime-frontend:prod .
```

**Expected Output:**
- Multi-stage build (Node.js build → nginx serve)
- "Successfully tagged localhost/generic-prime-frontend:prod"

**Build Time:** ~3-5 minutes (first build), ~1-2 minutes (cached)

---

### Step 16: Export Frontend Image

**Server:** Thor

```bash
cd ~/projects/generic-prime/frontend
podman save localhost/generic-prime-frontend:prod -o generic-prime-frontend-prod.tar
```

---

### Step 17: Import Frontend Image to K3s

**Server:** Thor

```bash
cd ~/projects/generic-prime/frontend
sudo k3s ctr images import generic-prime-frontend-prod.tar
```

**Expected Output:** "localhost/generic-prime-frontend:prod saved"

---

### Step 18: Deploy Frontend to Kubernetes

**Server:** Thor

```bash
cd ~/projects/generic-prime/k8s
kubectl apply -f frontend-deployment.yaml
kubectl apply -f frontend-service.yaml
```

**Expected Output:**
- "deployment.apps/generic-prime-frontend created" (or configured)
- "service/generic-prime-frontend created" (or configured)

---

### Step 19: Watch Frontend Deployment

**Server:** Thor

```bash
kubectl get pods -n generic-prime -w | grep frontend
```

**Expected Output:** Pods transitioning to "1/1 Running"
**Press Ctrl+C** once running

---

### Step 20: Verify Production Application

**Server:** Thor

```bash
# Check all pods
kubectl get pods -n generic-prime

# Test frontend
curl -I http://generic-prime.minilab:4205

# Open in browser
firefox http://generic-prime.minilab:4205
```

**Expected:**
- Pods: 2 backend, 2 frontend (all Running)
- curl: HTTP 200 response
- Browser: Generic Discovery Framework UI loads

**Note:** If port 4205 doesn't work, the frontend should be accessible at http://generic-prime.minilab (port 80 through ingress)

---

### Step 21: Clean Up Frontend Tar

**Server:** Thor

```bash
cd ~/projects/generic-prime/frontend
rm generic-prime-frontend-prod.tar
```

---

## Phase 4: Frontend Development Container

### Step 22: Build Frontend Dev Image

**Server:** Thor

```bash
cd ~/projects/generic-prime/frontend
podman build -f Dockerfile.dev -t localhost/generic-prime-frontend:dev .
```

**Expected Output:** "Successfully tagged localhost/generic-prime-frontend:dev"

**Build Time:** ~2-3 minutes

**Note:** Dev image stays in Podman only (not deployed to K3s)

---

### Step 23: Start Frontend Dev Container

**Server:** Thor

```bash
cd ~/projects/generic-prime/frontend
podman run -d --name generic-prime-frontend-dev \
  --network host \
  -v $(pwd):/app:z \
  -w /app \
  localhost/generic-prime-frontend:dev
```

**Expected Output:** Container ID (64 character hash)

**Volume Mount:** Maps `~/projects/generic-prime/frontend` to `/app` in container
**SELinux Context:** `:z` flag sets proper permissions

---

### Step 24: Verify Dev Container

**Server:** Thor

```bash
podman ps | grep generic-prime-frontend-dev
```

**Expected Output:** Line showing container status "Up"

---

### Step 25: Start Angular Dev Server

**Server:** Thor

```bash
podman exec -it generic-prime-frontend-dev npm start -- --host 0.0.0.0 --port 4205
```

**Expected Output:**
- npm dependency installation (first run only)
- Angular CLI compilation messages
- "✔ Browser application bundle generation complete"
- "** Angular Live Development Server is listening on 0.0.0.0:4205 **"

**Access Dev Server:** http://localhost:4205 or http://thor:4205

**Hot Module Reloading:** Edit files → Save → Browser auto-reloads (~2-5 seconds)

**Stop Dev Server:** Press `Ctrl+C`

---

## Phase 5: Development Workflows

### Daily Frontend Development

**Start Session:**
```bash
# 1. Verify backend is running
kubectl get pods -n generic-prime | grep backend

# 2. Start dev container (if not running)
cd ~/projects/generic-prime/frontend
podman start generic-prime-frontend-dev 2>/dev/null || \
  podman run -d --name generic-prime-frontend-dev --network host \
    -v $(pwd):/app:z -w /app localhost/generic-prime-frontend:dev

# 3. Start Angular dev server
podman exec -it generic-prime-frontend-dev npm start -- --host 0.0.0.0 --port 4205

# 4. Edit files in VS Code or vim
# Watch terminal for automatic recompilation

# 5. Test at http://localhost:4205
```

**End Session:**
```bash
# Stop dev server: Ctrl+C

# Optional: Stop dev container
podman stop generic-prime-frontend-dev
```

---

### Deploy Frontend Changes to Production

**After testing in dev:**
```bash
# 1. Build new production image
cd ~/projects/generic-prime/frontend
podman build -f Dockerfile.prod -t localhost/generic-prime-frontend:prod-v2 .

# 2. Export and import to K3s
podman save localhost/generic-prime-frontend:prod-v2 -o generic-prime-frontend-prod-v2.tar
sudo k3s ctr images import generic-prime-frontend-prod-v2.tar

# 3. Update deployment manifest
cd ~/projects/generic-prime/k8s
nano frontend-deployment.yaml
# Change image tag to :prod-v2

# 4. Apply changes
kubectl apply -f frontend-deployment.yaml

# 5. Watch rollout
kubectl rollout status deployment/generic-prime-frontend -n generic-prime

# 6. Verify
firefox http://generic-prime.minilab:4205

# 7. Clean up
cd ~/projects/generic-prime/frontend
rm generic-prime-frontend-prod-v2.tar
```

---

### Backend Development

**Make code changes and redeploy:**
```bash
# 1. Edit backend code
cd ~/projects/generic-prime/backend-specs/src
nano services/elasticsearchService.js

# 2. Build new image (increment version)
cd ~/projects/generic-prime/backend-specs
podman build -t localhost/generic-prime-backend:v1.0.2 .

# 3. Export and import
podman save localhost/generic-prime-backend:v1.0.2 -o generic-prime-backend-v1.0.2.tar
sudo k3s ctr images import generic-prime-backend-v1.0.2.tar

# 4. Update deployment
cd ~/projects/generic-prime/k8s
nano backend-deployment.yaml
# Change image tag to :v1.0.2
kubectl apply -f backend-deployment.yaml

# 5. Verify rollout
kubectl rollout status deployment/generic-prime-backend -n generic-prime

# 6. Test API
curl "http://generic-prime.minilab/api/vehicles/details?page=1&size=1" | jq

# 7. Clean up
cd ~/projects/generic-prime/backend-specs
rm generic-prime-backend-v1.0.2.tar
```

---

## Troubleshooting

### Backend Pods Not Starting

**Symptom:**
```bash
kubectl get pods -n generic-prime | grep backend
# ErrImageNeverPull or ImagePullBackOff
```

**Solution:**
```bash
# Verify image exists in K3s
sudo k3s ctr images list | grep generic-prime-backend

# If missing, rebuild and import
cd ~/projects/generic-prime/backend-specs
podman build -t localhost/generic-prime-backend:v1.0.1 .
podman save localhost/generic-prime-backend:v1.0.1 -o generic-prime-backend-v1.0.1.tar
sudo k3s ctr images import generic-prime-backend-v1.0.1.tar

# Restart deployment
kubectl rollout restart deployment/generic-prime-backend -n generic-prime
```

---

### Frontend Dev Container Exits Immediately

**Solution:**
```bash
# Check logs
podman logs generic-prime-frontend-dev

# Remove and restart with proper flags
podman rm -f generic-prime-frontend-dev
cd ~/projects/generic-prime/frontend
podman run -d --name generic-prime-frontend-dev --network host \
  -v $(pwd):/app:z -w /app localhost/generic-prime-frontend:dev
```

---

### Permission Denied in Dev Container

**Cause:** Missing `:z` flag on volume mount (SELinux)

**Solution:**
```bash
# Restart with SELinux context
podman stop generic-prime-frontend-dev
podman rm generic-prime-frontend-dev
cd ~/projects/generic-prime/frontend
podman run -d --name generic-prime-frontend-dev --network host \
  -v $(pwd):/app:z -w /app localhost/generic-prime-frontend:dev
```

---

### Backend Cannot Connect to Elasticsearch

**Solution:**
```bash
# Check Elasticsearch status
kubectl get pods -n data | grep elasticsearch

# Test connectivity from backend pod
kubectl exec -n generic-prime deployment/generic-prime-backend -- \
  curl -s http://elasticsearch.data.svc.cluster.local:9200/_cluster/health | jq
```

---

### Comma-Separated Filters Return 0 Results

**Symptom:**
```bash
curl "http://generic-prime.minilab/api/vehicles/details?bodyClass=Sedan,SUV" | jq '.total'
# Output: 0
```

**Cause:** Backend code not updated or pods running old image

**Solution:**
```bash
# 1. Verify code changes in elasticsearchService.js
cd ~/projects/generic-prime/backend-specs/src/services
grep -A 15 "if (filters.bodyClass)" elasticsearchService.js
# Should show split(',') logic

# 2. Check which image pods are running
kubectl get pods -n generic-prime -o jsonpath='{.items[?(@.metadata.labels.app=="generic-prime-backend")].spec.containers[0].image}'

# 3. Rebuild and redeploy (Steps 3-9 in Phase 2)
```

---

### Frontend Not Accessible at Port 4205

**Cause:** Port 4205 is for dev server only. Production frontend uses port 80 through ingress.

**Solution:**
```bash
# Access production frontend via ingress (port 80)
firefox http://generic-prime.minilab

# OR access dev server (if running)
firefox http://localhost:4205
```

---

## Version History

| Version | Date | Backend | Frontend | Changes |
|---------|------|---------|----------|---------|
| v1.0.0 | 2025-11-23 | v1.0.0 | prod | Initial deployment with copied backend from auto-discovery |
| v1.0.1 | 2025-11-23 | v1.0.1 | prod | Add comma-separated filter support (manufacturer, model, bodyClass) |

**Update this table** when deploying new versions

---

## Key Configuration Details

### Backend Environment Variables

Located in: `k8s/backend-deployment.yaml`

```yaml
env:
  - name: ELASTICSEARCH_URL
    value: "http://elasticsearch.data.svc.cluster.local:9200"
  - name: ELASTICSEARCH_INDEX
    value: "autos-unified"
  - name: NODE_ENV
    value: "production"
  - name: PORT
    value: "3000"
```

### Frontend Development Container

- **Image:** `localhost/generic-prime-frontend:dev`
- **Base:** node:20-alpine
- **Volume Mount:** `~/projects/generic-prime/frontend:/app:z`
- **Network:** host (access backend at generic-prime.minilab)
- **Dev Port:** 4205
- **Purpose:** Hot module reloading for Angular + PrimeNG development

### Frontend Production Container

- **Image:** `localhost/generic-prime-frontend:prod`
- **Base:** Multi-stage (node:20-alpine → nginx:alpine)
- **Deployment:** Kubernetes pods with ClusterIP service
- **Purpose:** Compiled Angular app served by nginx

### Ingress Routing

```yaml
Host: generic-prime.minilab
Routes:
  /api → generic-prime-backend:3000
  /    → generic-prime-frontend:80
```

---

## Notes

### Image Architecture
- **Backend:** Runs in Kubernetes (independent from auto-discovery)
- **Frontend Dev:** Runs in Podman with volume mounts for HMR workflow
- **Frontend Prod:** Runs in Kubernetes (static files + nginx)

### Image Stores
- **Podman:** User-level rootless image store (`podman images`)
- **K3s:** System-level containerd store (`sudo k3s ctr images list`)
- **No sharing:** Must export tar and import between stores

### All Files in One Project
**Important:** All source code, configs, and deployments are now in `~/projects/generic-prime/`

- Backend: `~/projects/generic-prime/backend-specs/` ✓
- Frontend: `~/projects/generic-prime/frontend/` ✓
- K8s configs: `~/projects/generic-prime/k8s/` ✓
- Documentation: `~/projects/generic-prime/docs/` ✓

### Development vs Production
- **Development:** Edit → Save → HMR reload (2-5 seconds)
- **Production:** Edit → Build → Export → Import → Deploy (3-5 minutes)
- **Test both:** Always verify changes work in production build

---

**Document Created:** 2025-11-23
**Maintained By:** odin + Claude
**Version:** 2.0 (Self-Contained Generic-Prime)
**All Source:** ~/projects/generic-prime/
**Next Review:** After significant infrastructure changes
