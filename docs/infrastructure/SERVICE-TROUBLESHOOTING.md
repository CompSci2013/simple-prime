# Service Troubleshooting Guide
## Getting autos-prime-ng Services Running

**Date**: 2025-11-22
**Issue**: Network Error - Unable to connect to server
**Cause**: Kubernetes services scaled to 0 replicas
**Resolution**: Scale up Elasticsearch first, then backend services

---

## Problem Diagnosis

### Initial Symptoms

**Frontend Error**:
```
Network Error
Unable to connect to the server. Please check your internet connection.
```

**Backend Logs** (when attempted to start):
```
✗ Elasticsearch connection failed: connect ECONNREFUSED 10.43.133.216:9200
Failed to start server: connect ECONNREFUSED 10.43.133.216:9200
```

### Investigation Steps

1. **Check namespaces with auto-related services**:
```bash
kubectl get namespaces | grep -i auto
# Output:
# auto-discovery    Active   6d
# autos             Active   41d
# autos2            Active   27d
```

2. **Check pod status in auto-discovery namespace**:
```bash
kubectl get pods -n auto-discovery
# Output:
# auto-discovery-auth-service-78458d57f7-plmlv   0/1  ErrImageNeverPull
# auto-discovery-specs-api-786d596964-5qgt7      0/1  CrashLoopBackOff
# auto-discovery-vins-api-66578c6bfd-94vjg       0/1  CrashLoopBackOff
```

3. **Check deployments in auto-discovery**:
```bash
kubectl get deployments -n auto-discovery
# Output:
# auto-discovery-auth-service   0/0     0            0           5d23h
# auto-discovery-specs-api      0/0     0            0           6d
# auto-discovery-vins-api       0/0     0            0           6d
```

4. **Check autos namespace** (correct namespace for autos-prime-ng):
```bash
kubectl get deployments -n autos
# Output:
# autos-backend    0/0     0            0           41d
# autos-frontend   0/0     0            0           40d
```

5. **Check data namespace for Elasticsearch**:
```bash
kubectl get deployments -n data
# Output:
# elasticsearch   0/0     0            0           61d
# kibana          0/0     0            0           54d
```

### Root Cause

All services were **scaled to 0 replicas** (shutdown state). The dependency chain requires:
1. **Elasticsearch must be running** (provides data store)
2. **Backend API requires Elasticsearch** (fails health checks without it)
3. **Frontend requires Backend API** (shows network error without it)

---

## Resolution Steps (In Order)

### Step 1: Start Elasticsearch (Data Layer)

**CRITICAL**: Elasticsearch MUST be started FIRST. Backend will not start without it.

```bash
# Scale up Elasticsearch deployment
kubectl scale deployment elasticsearch -n data --replicas=1

# Wait for pod to become ready (takes ~30-60 seconds)
kubectl get pods -n data -w

# OR check status after waiting
sleep 30
kubectl get pods -n data
```

**Expected Output** (after waiting):
```
NAME                             READY   STATUS    RESTARTS   AGE
elasticsearch-5889744874-jcww6   1/1     Running   0          45s
```

**Verify Elasticsearch is healthy**:
```bash
# Check Elasticsearch cluster health (via NodePort)
curl http://thor:30398/_cluster/health

# Check indices exist
curl http://thor:30398/_cat/indices?v
```

**Expected Output**:
```
health status index         uuid   pri rep docs.count
green  open   autos-unified xyz123 1   0   4887
green  open   autos-vins    abc456 1   0   55463
```

---

### Step 2: Start Backend API (Application Layer)

**ONLY AFTER** Elasticsearch is running and healthy.

```bash
# Scale up backend deployment (2 replicas for HA)
kubectl scale deployment autos-backend -n autos --replicas=2

# Wait for pods to start and pass health checks (~30-45 seconds)
sleep 30
kubectl get pods -n autos
```

**Expected Output** (after health checks pass):
```
NAME                            READY   STATUS    RESTARTS      AGE
autos-backend-cf857bcd8-xtdr2   1/1     Running   1 (19s ago)   69s
autos-backend-cf857bcd8-z4cl5   1/1     Running   1 (19s ago)   69s
```

**Note**: `RESTARTS: 1` is expected - initial attempt fails until Elasticsearch connection succeeds, then pod restarts and becomes healthy.

**Verify Backend Logs**:
```bash
kubectl logs -n autos -l app=autos-backend --tail=20
```

**Expected Output**:
```
✓ Elasticsearch connection successful
  Cluster: tle-cluster, Status: green
✓ Index 'autos-unified' found with 4887 documents
AUTOS Backend API listening on port 3000
Health check: http://localhost:3000/health
API endpoint: http://localhost:3000/api/v1/manufacturer-model-combinations
```

**Test Backend API**:
```bash
# Test health endpoint
curl http://autos.minilab/api/health

# Test data endpoint
curl http://autos.minilab/api/v1/manufacturer-model-combinations?page=1&size=5
```

---

### Step 3: Start Frontend (Optional - if needed)

Frontend may already be running or can access backend at `autos.minilab`.

```bash
# Only if frontend needs to be started
kubectl scale deployment autos-frontend -n autos --replicas=2

# Verify
kubectl get pods -n autos
```

---

## Complete Startup Sequence (Copy-Paste)

```bash
# 1. Start Elasticsearch (wait for ready)
kubectl scale deployment elasticsearch -n data --replicas=1
sleep 30
kubectl get pods -n data

# 2. Verify Elasticsearch health
curl http://thor:30398/_cluster/health

# 3. Start Backend API (wait for ready)
kubectl scale deployment autos-backend -n autos --replicas=2
sleep 30
kubectl get pods -n autos

# 4. Verify backend logs
kubectl logs -n autos -l app=autos-backend --tail=20

# 5. Test API
curl http://autos.minilab/api/health
```

---

## Verification Checklist

After running startup sequence, verify:

- [ ] **Elasticsearch pod**: `1/1 Running` in `data` namespace
- [ ] **Backend pods**: `2/2 Running` in `autos` namespace
- [ ] **Backend logs**: Show "✓ Elasticsearch connection successful"
- [ ] **Health check**: `curl http://autos.minilab/api/health` returns `{"status":"ok"}`
- [ ] **Frontend**: Can access `http://autos.minilab` with no network errors
- [ ] **Body Class dialog**: Populated with checkbox options (Sedan, SUV, Pickup, etc.)

---

## Shutdown Sequence (To Save Resources)

```bash
# Stop in reverse order
kubectl scale deployment autos-frontend -n autos --replicas=0
kubectl scale deployment autos-backend -n autos --replicas=0
kubectl scale deployment elasticsearch -n data --replicas=0

# Verify all stopped
kubectl get pods -n autos
kubectl get pods -n data
```

---

## Common Errors and Solutions

### Error 1: Backend CrashLoopBackOff

**Symptoms**:
```
autos-backend-xxx   0/1  CrashLoopBackOff
```

**Logs**:
```
Failed to start server: connect ECONNREFUSED 10.43.133.216:9200
```

**Cause**: Elasticsearch not running or not ready

**Solution**:
```bash
# Check Elasticsearch status
kubectl get pods -n data

# If not running, start it
kubectl scale deployment elasticsearch -n data --replicas=1

# Wait for it to become ready, then restart backend
kubectl rollout restart deployment autos-backend -n autos
```

---

### Error 2: Backend Running but Returns 500 Errors

**Symptoms**: Backend pod is `1/1 Running` but API returns errors

**Logs**:
```
Error querying Elasticsearch: index_not_found_exception
```

**Cause**: Elasticsearch indices not created or not populated

**Solution**:
```bash
# Check if indices exist
curl http://thor:30398/_cat/indices?v

# If missing, create and populate them
cd ~/projects/autos-prime-ng/data/scripts
python3 create_autos_index.py
python3 load_full_data.py
python3 create_vins_index.py
python3 generate_vin_data.py
python3 load_vin_data.py
```

---

### Error 3: Elasticsearch Won't Start

**Symptoms**:
```
elasticsearch-xxx   0/1  Pending  OR  CrashLoopBackOff
```

**Possible Causes**:
1. Insufficient memory on node
2. Persistent volume issues
3. Node resource constraints

**Check Logs**:
```bash
kubectl logs -n data -l app=elasticsearch
kubectl describe pod -n data -l app=elasticsearch
```

**Solutions**:
- Free up memory on thor node
- Check PVC status: `kubectl get pvc -n data`
- Reduce Elasticsearch memory request if needed (edit deployment)

---

### Error 4: Frontend Shows Network Error

**Symptoms**: Browser shows "Unable to connect to the server"

**Causes**:
1. Backend not running
2. Ingress misconfigured
3. Backend health checks failing

**Debug Steps**:
```bash
# 1. Check backend pods are running
kubectl get pods -n autos

# 2. Check backend logs for errors
kubectl logs -n autos -l app=autos-backend

# 3. Test backend directly (bypass ingress)
kubectl port-forward -n autos svc/autos-backend 3000:3000
curl http://localhost:3000/health

# 4. Check ingress
kubectl get ingress -n autos
kubectl describe ingress autos -n autos
```

---

## Service Dependencies Map

```
User Browser
    ↓
http://autos.minilab (Traefik Ingress)
    ↓
    ├─→ /api/*  → autos-backend:3000 (MUST be running)
    │               ↓
    │           Elasticsearch:9200 (MUST be running FIRST)
    │               ↓
    │           autos-unified index (4,887 docs)
    │           autos-vins index (55,463 docs)
    │
    └─→ /*      → autos-frontend:80 (optional)
```

**Startup Order**:
1. Elasticsearch (data layer)
2. Backend API (application layer)
3. Frontend (presentation layer)

**Reverse order for shutdown**.

---

## Quick Reference Commands

### Check Status
```bash
kubectl get pods -n data
kubectl get pods -n autos
kubectl get deployments -n data
kubectl get deployments -n autos
```

### View Logs
```bash
kubectl logs -n data -l app=elasticsearch --tail=50
kubectl logs -n autos -l app=autos-backend --tail=50
kubectl logs -n autos -l app=autos-frontend --tail=50
```

### Test Services
```bash
# Elasticsearch
curl http://thor:30398/_cluster/health

# Backend API
curl http://autos.minilab/api/health
curl http://autos.minilab/api/v1/manufacturer-model-combinations?page=1&size=5

# Frontend
open http://autos.minilab
```

---

## Success Indicators

When everything is working correctly, you should see:

### Console Logs (Browser)
```javascript
[BasePickerDataSource] Raw API response for 'manufacturer-model': {total: 72, page: 1, size: 100, ...}
[BasePickerDataSource] Loaded 858 rows for 'manufacturer-model'
resource-management.service.ts:471 fetchData response: {resultsCount: 20, total: 4887, ...}
```

### Body Class Dialog
- ✅ Modal opens with title "Select Body Classes"
- ✅ Search box present
- ✅ Checkbox list populated with options:
  - Convertible
  - Coupe
  - Hatchback
  - Limousine
  - Pickup
  - SUV
  - Sedan
  - Sports Car
  - Touring Car
  - Truck
  - Van
  - Wagon
- ✅ Cancel and Apply buttons visible
- ✅ No network errors in console

---

**End of Troubleshooting Guide**
