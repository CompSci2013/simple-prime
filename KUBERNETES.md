# Simple-Prime Kubernetes Infrastructure

**Last Updated:** 2026-01-30

This document describes the exact Kubernetes pods and services required to run the simple-prime application.

---

## Required Pods Summary

| Pod | Namespace | Purpose | Dependencies |
|-----|-----------|---------|--------------|
| `generic-prime-backend-api` | `generic-prime` | Backend API server | Elasticsearch |
| `generic-prime-frontend` | `generic-prime` | Angular frontend (production) | Backend API |
| `elasticsearch` | `data` | Data store | None |

**Total: 3 pods minimum** (backend may run 2 replicas)

---

## Namespace: `generic-prime`

### Backend API

**Deployment:** `generic-prime-backend-api`
**Replicas:** 2
**Image:** `localhost/generic-prime-backend-api:v1.6.0`
**Port:** 3000

**Environment Variables:**
```yaml
NODE_ENV: production
PORT: "3000"
ELASTICSEARCH_URL: http://elasticsearch.data.svc.cluster.local:9200
ELASTICSEARCH_INDEX: autos-unified
```

**Health Endpoints:**
- Liveness: `GET /health` (port 3000)
- Readiness: `GET /ready` (port 3000)

**Node Selector:** `kubernetes.io/hostname=thor`

### Frontend

**Deployment:** `generic-prime-frontend`
**Replicas:** 1
**Port:** 80

**Node Selector:** `kubernetes.io/hostname=thor`

### Ingress

**Host:** `generic-prime.minilab`
**Routes:**
- `/api` → `generic-prime-backend-api:3000`
- `/` → `generic-prime-frontend:80`

---

## Namespace: `data`

### Elasticsearch

**Deployment:** `elasticsearch`
**Port:** 9200
**Internal DNS:** `elasticsearch.data.svc.cluster.local:9200`

**Node Selector:** `kubernetes.io/hostname=thor`

---

## Checking Status

### Quick Health Check

```bash
# Check all required pods
kubectl get pods -n generic-prime
kubectl get pods -n data | grep elasticsearch

# Expected: All pods should be Running, not Pending
```

### Full Status

```bash
# Backend API status
kubectl get deployment generic-prime-backend-api -n generic-prime

# Frontend status
kubectl get deployment generic-prime-frontend -n generic-prime

# Elasticsearch status
kubectl get deployment elasticsearch -n data

# Ingress status
kubectl get ingress -n generic-prime
```

### Test API Health

```bash
# Test backend health endpoint
curl http://generic-prime.minilab/api/health

# Test data endpoint
curl "http://generic-prime.minilab/api/specs/v1/vehicles/details?page=1&size=1" | jq '.total'
```

---

## Troubleshooting

### Pods Stuck in Pending

**Symptom:**
```
NAME                                             READY   STATUS    RESTARTS   AGE
generic-prime-backend-api-xxx                    0/1     Pending   0          10m
```

**Cause:** Thor node has reached its 110 pod limit.

**Diagnosis:**
```bash
# Check pod count on thor
kubectl get pods --all-namespaces --field-selector spec.nodeName=thor | wc -l

# Check why pod is pending
kubectl describe pod <pod-name> -n generic-prime | tail -20
```

**Solution:** Free pod slots by cleaning up failed/unused pods:
```bash
# Find failed pods on thor
kubectl get pods --all-namespaces --field-selector spec.nodeName=thor | grep -v Running

# Delete failed cronjob pods (example for tle namespace)
kubectl delete pods -n tle --field-selector=status.phase=Failed

# Or scale down unused deployments
kubectl scale deployment <unused-deployment> --replicas=0 -n <namespace>
```

### Elasticsearch Not Running

**Impact:** Backend API will fail health checks and return no data.

**Check:**
```bash
kubectl get pods -n data | grep elasticsearch
kubectl logs -n data deployment/elasticsearch --tail=50
```

### Backend CrashLoopBackOff

**Check logs:**
```bash
kubectl logs -n generic-prime deployment/generic-prime-backend-api --tail=100
```

**Common causes:**
1. Elasticsearch not accessible
2. Wrong index name
3. Memory limits too low

### Frontend Not Loading

**Check:**
```bash
# Verify frontend pod is running
kubectl get pods -n generic-prime | grep frontend

# Check ingress
kubectl describe ingress generic-prime-ingress -n generic-prime

# Test from within cluster
kubectl run -n generic-prime curl-test --image=curlimages/curl:latest --rm -it --restart=Never -- \
  curl -I http://generic-prime-frontend:80
```

---

## Restarting Services

### Restart Backend
```bash
kubectl rollout restart deployment/generic-prime-backend-api -n generic-prime
kubectl rollout status deployment/generic-prime-backend-api -n generic-prime
```

### Restart Frontend
```bash
kubectl rollout restart deployment/generic-prime-frontend -n generic-prime
kubectl rollout status deployment/generic-prime-frontend -n generic-prime
```

### Restart Elasticsearch
```bash
kubectl rollout restart deployment/elasticsearch -n data
kubectl rollout status deployment/elasticsearch -n data
```

---

## Development vs Production

| Environment | Frontend | Backend | Notes |
|-------------|----------|---------|-------|
| Development | `localhost:4205` (ng serve) | `generic-prime.minilab/api` | Frontend runs locally, proxies to K8s backend |
| Production | `generic-prime.minilab` | `generic-prime.minilab/api` | Both run in Kubernetes |

**Development Proxy:** See `frontend/proxy.conf.js` - proxies `/api` requests to `generic-prime.minilab`

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        Browser/Client                            │
│                   http://generic-prime.minilab                   │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Traefik Ingress (Loki)                       │
│                      generic-prime-ingress                       │
│  ┌─────────────────────┐    ┌────────────────────────────────┐  │
│  │ /api/* → backend:3000│    │ /* → frontend:80              │  │
│  └─────────────────────┘    └────────────────────────────────┘  │
└─────────────────────────────┬───────────────────────────────────┘
                              │
          ┌───────────────────┴───────────────────┐
          │                                       │
          ▼                                       ▼
┌─────────────────────┐               ┌─────────────────────┐
│   Backend API       │               │   Frontend          │
│   Namespace:        │               │   Namespace:        │
│   generic-prime     │               │   generic-prime     │
│   Port: 3000        │               │   Port: 80          │
│   Replicas: 2       │               │   Replicas: 1       │
└──────────┬──────────┘               └─────────────────────┘
           │
           ▼
┌─────────────────────┐
│   Elasticsearch     │
│   Namespace: data   │
│   Port: 9200        │
│   Index: autos-unified │
└─────────────────────┘
```

---

## Known Issues & Fixes (2026-01-30)

### Pod Limit Exhaustion After Reboot

**Symptom:** After server reboot, pods stuck in Pending with "Too many pods" error.

**Root Cause:** The `tle-ingestion-es` cronjob was not being properly suspended during spindown due to a **typo in the script** (used `tle-ingestion` instead of `tle-ingestion-es`). This caused:

1. Cronjob kept running during downtime
2. Jobs failed with `ErrImageNeverPull` (image not in containerd)
3. Failed jobs stayed in "Running" status indefinitely
4. Pod slots accumulated (94 stuck pods observed)
5. Thor hit 110/110 pod limit

**Fix Applied:**
1. Fixed cronjob name in `/home/odin/halo-shutdown-v5.sh` and `/home/odin/halo-startup-v5.sh`
2. Added job cleanup to spindown script
3. Scaled down orphaned deployments not managed by spinup/spindown

**Orphaned Deployments Identified:**
These deployments were not in spinup/spindown scripts and consumed pod slots:
- `autos2-backend`, `autos2-frontend` (namespace: autos2)
- `generic-prime-dockview-backend-api` (namespace: generic-prime-dockview)
- `transport-api`, `transport-frontend` (namespace: transportation)
- `angular-dockview-dev` (namespace: apps)
- `llamacc` (namespace: llm)

**Prevention:**
The spindown script now:
1. Uses correct cronjob name: `tle-ingestion-es`
2. Deletes all TLE jobs on shutdown: `kubectl delete jobs -n tle --all`

### Quick Recovery Commands

If pods are stuck in Pending after reboot:

```bash
# 1. Check pod count on thor
kubectl get pods --all-namespaces --field-selector spec.nodeName=thor | wc -l

# 2. If over 100, clean up TLE jobs
kubectl delete jobs -n tle --all

# 3. Scale down orphaned deployments
kubectl scale deployment --replicas=0 -n autos2 autos2-backend autos2-frontend
kubectl scale deployment --replicas=0 -n generic-prime-dockview generic-prime-dockview-backend-api
kubectl scale deployment --replicas=0 -n transportation transport-api transport-frontend
kubectl scale deployment --replicas=0 -n apps angular-dockview-dev
kubectl scale deployment --replicas=0 -n llm llamacc

# 4. Check pod count again (should be under 50)
kubectl get pods --all-namespaces --field-selector spec.nodeName=thor | wc -l

# 5. Verify simple-prime pods are running
kubectl get pods -n generic-prime
kubectl get pods -n data | grep elasticsearch
```

---

## Related Documentation

- [DEVELOPER-ENVIRONMENT.md](docs/infrastructure/DEVELOPER-ENVIRONMENT.md) - Full development setup guide
- [service-design.md](service-design.md) - URL-First architecture overview
- Frontend environment: `frontend/src/environments/environment.ts`
- Spinup/Spindown scripts: `/home/odin/halo-startup-v5.sh`, `/home/odin/halo-shutdown-v5.sh`
