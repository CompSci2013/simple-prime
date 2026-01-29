# Backend API Updates - Quick Reference

**Last Updated:** 2025-12-22 (CORRECTED)
**Original:** 2025-11-23
**Purpose:** Quick guide for updating the Generic-Prime backend API

---

## ⚠️ IMPORTANT CORRECTION (2025-12-22)

**The backend is NOT in `~/projects/generic-prime/backend-specs/`**

**Correct Location:**
```
Backend Source:  ~/projects/data-broker/generic-prime/
K8s Configs:     ~/projects/data-broker/generic-prime/infra/k8s/
Frontend Source: ~/projects/generic-prime/frontend/
```

The backend is part of the **data-broker infrastructure project**, not the generic-prime project itself.

---

## Quick Update Process (CORRECTED)

### 1. Edit Backend Code

```bash
cd ~/projects/data-broker/generic-prime/src
nano routes/preferencesRoutes.js    # Example: preferences service
nano controllers/preferencesController.js
```

### 2. Build & Deploy

```bash
cd ~/projects/data-broker

# Build image (increment version: v1.5.0 → v1.6.0)
podman build -f generic-prime/infra/Dockerfile \
  -t localhost/generic-prime-backend-api:v1.6.0 generic-prime

# Export tar
podman save localhost/generic-prime-backend-api:v1.6.0 -o /tmp/backend-v1.6.0.tar

# Import to K3s
sudo k3s ctr images import /tmp/backend-v1.6.0.tar

# Update deployment
kubectl -n generic-prime set image deployment/generic-prime-backend-api \
  backend-api=localhost/generic-prime-backend-api:v1.6.0

# Watch rollout
kubectl -n generic-prime rollout status deployment/generic-prime-backend-api

# Clean up
rm /tmp/backend-v1.6.0.tar
```

### 3. Test Changes

```bash
# Test health endpoint
curl http://generic-prime.minilab/api/health | jq

# Test API endpoint
curl "http://generic-prime.minilab/api/specs/v1/vehicles/details?page=1&size=2" | jq

# Test new endpoints (if added)
curl http://generic-prime.minilab/api/preferences/v1/default | jq
```

---

## Current Backend Configuration

**Location:** `/home/odin/projects/data-broker/generic-prime/`
**Namespace:** `generic-prime`
**Service:** `generic-prime-backend-api`
**Pods:** 2 replicas
**Port:** 3000
**Current Version:** v1.5.0 (as of 2025-12-22, needs update for preferences)

**Image:** `localhost/generic-prime-backend-api:v1.X.X`
**Deployment File:** `~/projects/data-broker/generic-prime/infra/k8s/deployment.yaml`
**Service File:** `~/projects/data-broker/generic-prime/infra/k8s/service.yaml`

---

## Common Backend Tasks

### Add Comma-Separated Filter Support

**File:** `~/projects/generic-prime/backend-specs/src/services/elasticsearchService.js`

**Pattern to follow** (already implemented for `manufacturer` and `model`):

```javascript
if (filters.fieldName) {
  // Handle comma-separated values (OR logic)
  const values = filters.fieldName.split(',').map(v => v.trim()).filter(v => v);

  if (values.length === 1) {
    // Single value: exact match
    query.bool.filter.push({
      term: { 'field_name.keyword': values[0] }
    });
  } else if (values.length > 1) {
    // Multiple values: OR logic
    query.bool.filter.push({
      bool: {
        should: values.map(val => ({
          term: { 'field_name.keyword': val }
        })),
        minimum_should_match: 1,
      },
    });
  }
}
```

**Fields needing this pattern:**
- ✅ `manufacturer` (line 226-248) - Already implemented
- ✅ `model` (line 250-272) - Already implemented
- ⚠️ `bodyClass` (line 290-296) - **NEEDS UPDATE** (as of 2025-11-23)

---

## Testing Comma-Separated Filters

```bash
# Test single value
curl "http://generic-prime.minilab/api/vehicles/details?bodyClass=Sedan&size=1" | jq '.total'

# Test multiple values (should return combined count)
curl "http://generic-prime.minilab/api/vehicles/details?bodyClass=Sedan,SUV&size=1" | jq '.total'

# Test manufacturer
curl "http://generic-prime.minilab/api/vehicles/details?manufacturer=Ford,Chevrolet&size=1" | jq '.total'
```

**Expected Results:**
- Single value: Returns count for that value
- Multiple values: Returns OR combined count (sum of both)
- If returns 0: Backend code not updated or pods not restarted

---

## Troubleshooting

### Changes Not Taking Effect

**Check running image version:**
```bash
kubectl get pods -n generic-prime -o jsonpath='{.items[?(@.metadata.labels.app=="generic-prime-backend")].spec.containers[0].image}' | tr ' ' '\n'
```

**Force pod restart:**
```bash
kubectl rollout restart deployment/generic-prime-backend -n generic-prime
```

### Image Not Found in K3s

```bash
# List K3s images
sudo k3s ctr images list | grep generic-prime-backend

# If missing, rebuild and import
cd ~/projects/generic-prime/backend-specs
podman save localhost/generic-prime-backend:vX.X.X -o api.tar
sudo k3s ctr images import api.tar
rm api.tar
```

---

## Version Tracking

Keep versions in sync across:
1. Podman build tag
2. K3s imported image
3. Deployment manifest (`backend-deployment.yaml`)
4. This documentation

**Recommended versioning:**
- Bug fixes: v1.0.X
- New features: v1.X.0
- Breaking changes: vX.0.0

---

## See Also

- **[DEVELOPER-ENVIRONMENT.md](DEVELOPER-ENVIRONMENT.md)** - Complete setup guide
- **[../CLAUDE.md](../CLAUDE.md)** - Framework architecture reference
- **[API-COMPARISON.md](API-COMPARISON.md)** - API endpoint documentation (if exists)

---

**Quick Links:**
- Backend Source: `/home/odin/projects/generic-prime/backend-specs`
- K8s Configs: `/home/odin/projects/generic-prime/k8s`
- Frontend Source: `/home/odin/projects/generic-prime/frontend`
