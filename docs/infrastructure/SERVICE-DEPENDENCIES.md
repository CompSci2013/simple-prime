# Service Dependencies Analysis
## autos-prime-ng Application Architecture

**Date**: 2025-11-22
**Project**: autos-prime-ng (older implementation used for screenshots)
**Current Project**: generic-prime (new PrimeNG-first architecture)

---

## Application Stack (autos-prime-ng)

### **1. Data Layer (Namespace: `data`)**

#### Elasticsearch Cluster
- **Deployment**: `elasticsearch` (currently scaled to 0/0)
- **Service**: `elasticsearch.data.svc.cluster.local:9200`
- **ClusterIP**: `10.43.133.216:9200`
- **NodePort**: `30398` (accessible at `thor:30398`)
- **Purpose**: Document store for vehicle data
- **Indices**:
  - `autos-unified` - Vehicle specifications (4,887 documents)
  - `autos-vins` - Individual VIN records (55,463 documents)

**Setup Scripts** (in `~/projects/autos-prime-ng/data/scripts/`):
- `create_autos_index.py` - Creates `autos-unified` index
- `create_vins_index.py` - Creates `autos-vins` index
- `load_full_data.py` - Loads vehicle specifications
- `generate_vin_data.py` + `load_vin_data.py` - Generates and loads VIN data

#### Kibana (Optional - for debugging)
- **Deployment**: `kibana` (currently scaled to 0/0)
- **Purpose**: Elasticsearch UI for debugging queries

---

### **2. Backend API Layer (Namespace: `autos`)**

#### Backend Service
- **Deployment**: `autos-backend` (currently scaled to 0/0)
- **Service**: `autos-backend.autos.svc.cluster.local:3000`
- **Image**: `localhost/autos-prime-ng-backend:v1.6.4`
- **Replicas**: 2 (when scaled up)
- **Port**: 3000

**Environment Variables**:
```bash
ELASTICSEARCH_URL=http://elasticsearch.data.svc.cluster.local:9200
ELASTICSEARCH_INDEX=autos-unified
NODE_ENV=production
PORT=3000
```

**Health Checks**:
- **Liveness Probe**: `GET /health` (30s initial delay, 10s period)
- **Readiness Probe**: `GET /health` (10s initial delay, 5s period)

**Endpoints**:
- `GET /health` - Health check
- `GET /api/v1/manufacturer-model-combinations` - Main API endpoint

**Dependencies**:
- ✅ Requires Elasticsearch to be running
- ✅ Validates connection on startup (fails if Elasticsearch unavailable)

---

### **3. Frontend Layer (Namespace: `autos`)**

#### Frontend Service
- **Deployment**: `autos-frontend` (currently scaled to 0/0)
- **Service**: `autos-frontend.autos.svc.cluster.local:80`
- **Purpose**: Angular UI (this is where the Query Control screenshots came from)

---

### **4. Ingress Layer (Namespace: `autos`)**

#### Traefik Ingress
- **Host**: `autos.minilab` (resolves to `192.168.0.110` - loki node)
- **Routes**:
  - `/api/*` → `autos-backend:3000` (Backend API)
  - `/*` → `autos-frontend:80` (Frontend SPA)

---

## Current State Analysis

### What's Running
```bash
# ALL SERVICES ARE SCALED TO 0!
kubectl get deployments -n data
# elasticsearch   0/0     0            0           61d
# kibana          0/0     0            0           54d

kubectl get deployments -n autos
# autos-backend   0/0     0            0           41d
# autos-frontend  0/0     0            0           40d
```

### auto-discovery Namespace (Different Project)
```bash
kubectl get deployments -n auto-discovery
# auto-discovery-specs-api      0/1 (CrashLoopBackOff - Elasticsearch connection refused)
# auto-discovery-vins-api       0/1 (CrashLoopBackOff - Elasticsearch connection refused)
# auto-discovery-auth-service   0/1 (ErrImageNeverPull - Image not found)
```

**Note**: `auto-discovery` namespace appears to be a different/experimental version.

---

## Required Services for Query Control Screenshots

To run the autos-prime-ng application (which has the Query Control UI you showed):

### **Step 1: Start Elasticsearch**
```bash
# Scale up Elasticsearch
kubectl scale deployment elasticsearch -n data --replicas=1

# Wait for pod to be ready (may take 30-60 seconds)
kubectl wait --for=condition=ready pod -l app=elasticsearch -n data --timeout=120s

# Verify it's running
kubectl get pods -n data
kubectl logs -n data -l app=elasticsearch --tail=50
```

### **Step 2: Verify Elasticsearch Indices**
```bash
# Check if indices exist
curl http://thor:30398/_cat/indices?v

# Expected output:
# autos-unified  (yellow/green)  4,887 documents
# autos-vins     (yellow/green)  55,463 documents

# If indices don't exist, create them:
cd ~/projects/autos-prime-ng/data/scripts
python3 create_autos_index.py
python3 create_vins_index.py
python3 load_full_data.py
python3 generate_vin_data.py
python3 load_vin_data.py
```

### **Step 3: Start Backend API**
```bash
# Scale up backend
kubectl scale deployment autos-backend -n autos --replicas=2

# Wait for pods to be ready
kubectl wait --for=condition=ready pod -l app=autos-backend -n autos --timeout=60s

# Verify backend is running
kubectl get pods -n autos
kubectl logs -n autos -l app=autos-backend --tail=50

# Test backend health
curl http://autos.minilab/api/health
curl http://autos.minilab/api/v1/manufacturer-model-combinations?page=1&size=5
```

### **Step 4: Start Frontend**
```bash
# Scale up frontend
kubectl scale deployment autos-frontend -n autos --replicas=2

# Wait for pods
kubectl wait --for=condition=ready pod -l app=autos-frontend -n autos --timeout=60s

# Verify frontend is running
kubectl get pods -n autos

# Access application
open http://autos.minilab
```

---

## Service Dependency Chain

```
User Browser
    ↓
http://autos.minilab (Traefik Ingress)
    ↓
    ├─→ /api/*  → autos-backend:3000
    │               ↓
    │           Elasticsearch:9200
    │               ↓
    │           autos-unified index (vehicle specs)
    │           autos-vins index (VIN records)
    │
    └─→ /*      → autos-frontend:80
                    ↓
                Angular UI (Query Control, Pickers, Results Table)
```

---

## Resource Requirements

### Elasticsearch
- **Memory**: Typically 1-2 GB
- **CPU**: 0.5-1 core
- **Storage**: ~500 MB for current datasets

### Backend API (per pod)
- **Memory**: 128 MB request, 256 MB limit
- **CPU**: 100m request, 500m limit

### Frontend (per pod)
- **Memory**: ~50 MB (nginx serving static files)
- **CPU**: Minimal

---

## Troubleshooting

### Backend CrashLoopBackOff
**Symptom**: Backend pods crash immediately after starting
**Cause**: Cannot connect to Elasticsearch
**Log Message**: `Failed to start server: connect ECONNREFUSED 10.43.133.216:9200`
**Fix**: Ensure Elasticsearch is running first (Step 1 above)

### Elasticsearch Won't Start
**Symptom**: Pod stays in `Pending` or `CrashLoopBackOff`
**Causes**:
- Insufficient memory (needs ~1GB minimum)
- Persistent volume issues
- Node resource constraints
**Check Logs**: `kubectl logs -n data -l app=elasticsearch`

### Empty Indices
**Symptom**: Backend runs but returns 0 results
**Cause**: Elasticsearch indices not populated
**Check**: `curl http://thor:30398/_cat/indices?v`
**Fix**: Run data loading scripts (Step 2)

### Frontend 502 Bad Gateway
**Symptom**: Can't access http://autos.minilab
**Causes**:
- Backend not running
- Ingress misconfiguration
- Frontend pod not ready
**Check**: `kubectl get ingress -n autos`, `kubectl get pods -n autos`

---

## Quick Start Commands

```bash
# Start everything in order
kubectl scale deployment elasticsearch -n data --replicas=1
sleep 30  # Wait for Elasticsearch
kubectl scale deployment autos-backend -n autos --replicas=2
sleep 15  # Wait for backend
kubectl scale deployment autos-frontend -n autos --replicas=2

# Verify all running
kubectl get pods -n data
kubectl get pods -n autos

# Test
curl http://autos.minilab/api/health
open http://autos.minilab
```

## Shutdown Commands

```bash
# Stop all (to save resources)
kubectl scale deployment autos-frontend -n autos --replicas=0
kubectl scale deployment autos-backend -n autos --replicas=0
kubectl scale deployment elasticsearch -n data --replicas=0
kubectl scale deployment kibana -n data --replicas=0
```

---

## Comparison: autos-prime-ng vs generic-prime

| Aspect | autos-prime-ng (Old) | generic-prime (New) |
|--------|---------------------|---------------------|
| **Architecture** | Domain-specific | Domain-agnostic framework |
| **UI Library** | PrimeNG (custom wrappers) | PrimeNG-first (native components) |
| **Backend** | Single monolith API | Microservices (Specs, VINs, Auth) |
| **Namespace** | `autos` | `auto-discovery` |
| **Code Lines** | ~3,700 lines | ~1,500 lines (target) |
| **Query Control** | ✅ Implemented | ❌ Not yet built |
| **Status** | Production (scaled down) | Development (v0.1.0) |

**Note**: The screenshots you provided are from `autos-prime-ng` (old implementation). The new `generic-prime` project will reimplement Query Control using the specifications we're creating.

---

**End of Service Dependencies Analysis**
