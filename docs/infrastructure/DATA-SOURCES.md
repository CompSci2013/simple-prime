# Data Sources & Access Methods

**Last Updated**: 2025-11-26
**Purpose**: Complete documentation of data sources, how to access them, and their relationships

---

## Executive Summary

| Data Source | Location | Records | Access Method |
|-------------|----------|---------|---------------|
| `autos-unified` | Elasticsearch | 4,887 vehicle specs | Backend API or Kibana |
| `autos-vins` | Elasticsearch | 55,463 VIN records | Backend API or Kibana |

**Elasticsearch Cluster**: `elasticsearch.data.svc.cluster.local:9200` (K8s internal)

---

## 1. Infrastructure Overview

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     Host Machine (Thor)                          │
│                        192.168.0.244                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────┐     ┌──────────────────────────────────┐ │
│  │ Frontend Dev     │     │         K3s Cluster               │ │
│  │ Container        │     │         (loki: 192.168.0.110)     │ │
│  │ (Podman)         │     │                                    │ │
│  │                  │     │  ┌─────────────────────────────┐  │ │
│  │ Port: 4205       │────▶│  │ Namespace: generic-prime    │  │ │
│  │                  │     │  │   └─ Backend Pods (crashed) │  │ │
│  │ Container Name:  │     │  │                             │  │ │
│  │ generic-prime-   │     │  └─────────────────────────────┘  │ │
│  │ frontend-dev     │     │                                    │ │
│  │                  │     │  ┌─────────────────────────────┐  │ │
│  │ Source:          │     │  │ Namespace: data             │  │ │
│  │ ~/projects/      │     │  │   └─ Elasticsearch Pod      │  │ │
│  │ generic-prime/   │     │  │       Port: 9200            │  │ │
│  │ frontend         │     │  │                             │  │ │
│  └──────────────────┘     │  └─────────────────────────────┘  │ │
│                           │                                    │ │
│                           │  ┌─────────────────────────────┐  │ │
│                           │  │ Ingress Routes:             │  │ │
│                           │  │   generic-prime.minilab     │  │ │
│                           │  │   kibana.minilab            │  │ │
│                           │  └─────────────────────────────┘  │ │
│                           └──────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### Key Services

| Service | Namespace | Port | DNS Name |
|---------|-----------|------|----------|
| Elasticsearch | `data` | 9200 | `elasticsearch.data.svc.cluster.local` |
| Kibana | `data` | 5601 | `kibana.data.svc.cluster.local` |
| Backend API | `generic-prime` | 3000 | `generic-prime-backend.generic-prime.svc.cluster.local` |

### External URLs

| URL | Purpose |
|-----|---------|
| `http://192.168.0.244:4205/discover` | Frontend dev server |
| `http://generic-prime.minilab/api/specs/v1/...` | Backend API (via ingress) |
| `http://kibana.minilab` | Kibana UI |

---

## 2. Elasticsearch Indices

### Index: `autos-unified`

**Purpose**: Vehicle specifications (make/model/year combinations)
**Document Count**: 4,887

**Document Schema**:
```json
{
  "vehicle_id": "nhtsa-ford-f-150-2020",  // Primary key
  "manufacturer": "Ford",
  "model": "F-150",
  "year": 2020,
  "body_class": "Pickup",
  "data_source": "nhtsa_vpic_large_sample",
  "ingested_at": "2025-10-12T23:22:20.018715",
  "body_class_match_type": "fallback",
  "body_class_updated_at": "2025-11-02T07:32:25.128323"
}
```

**Field Mappings**:
```
manufacturer  → text (with keyword sub-field)
model         → text (with keyword sub-field)
year          → integer
body_class    → keyword
data_source   → keyword
vehicle_id    → keyword
```

---

### Index: `autos-vins`

**Purpose**: Individual VIN records (vehicle instances)
**Document Count**: 55,463

**Document Schema**:
```json
{
  "vin": "1PLBP40E9CF100000",           // Primary key
  "vehicle_id": "synth-plymouth-horizon-1982",  // Foreign key to autos-unified
  "manufacturer": "Plymouth",
  "model": "Horizon",
  "year": 1982,
  "body_class": "Hatchback",
  "condition_rating": 3,
  "condition_description": "Good",
  "mileage": 523377,
  "registered_state": "PA",
  "estimated_value": 33715,
  "exterior_color": "Gray",
  "title_status": "Clean",
  "registration_status": "Current",
  "data_source": "synthetic_historical"
}
```

---

## 3. Access Methods

### Method 1: Kibana Dev Tools Console (Recommended for Investigation)

**URL**: http://kibana.minilab/app/dev_tools#/console

**Example Queries**:

```json
// Count documents
GET /autos-unified/_count

// Get index mapping
GET /autos-unified/_mapping

// Sample documents
GET /autos-unified/_search
{
  "size": 5
}

// Get manufacturer-model combinations count
GET /autos-unified/_search
{
  "size": 0,
  "aggs": {
    "manufacturers": {
      "terms": { "field": "manufacturer.keyword", "size": 100 },
      "aggs": {
        "models": {
          "terms": { "field": "model.keyword", "size": 100 }
        }
      }
    }
  }
}

// Count unique manufacturer-model combinations
GET /autos-unified/_search
{
  "size": 0,
  "aggs": {
    "unique_combos": {
      "cardinality": {
        "script": "doc['manufacturer.keyword'].value + ':' + doc['model.keyword'].value"
      }
    }
  }
}
```

---

### Method 2: kubectl Port-Forward (Direct ES Access)

```bash
# Port-forward Elasticsearch
kubectl port-forward -n data svc/elasticsearch 9200:9200 &

# Now curl directly
curl http://localhost:9200/autos-unified/_count
curl http://localhost:9200/autos-unified/_search?size=5 | jq
```

---

### Method 3: Backend API

**Base URL**: `http://generic-prime.minilab/api/specs/v1`

**Endpoints**:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/manufacturer-model-combinations` | GET | Nested manufacturer → models aggregation |
| `/vehicles/details` | GET | Paginated vehicle specs with statistics |
| `/filters/manufacturers` | GET | Distinct manufacturer list |
| `/filters/models` | GET | Distinct model list |
| `/filters/body-classes` | GET | Distinct body class list |
| `/filters/data-sources` | GET | Distinct data source list |
| `/filters/year-range` | GET | Min/max year |
| `/health` | GET | Health check |
| `/ready` | GET | Readiness check (pings ES) |

**Example Requests**:

```bash
# Health check
curl http://generic-prime.minilab/health

# Get manufacturer-model combinations
curl "http://generic-prime.minilab/api/specs/v1/manufacturer-model-combinations?page=1&size=10"

# Get vehicle details with filters
curl "http://generic-prime.minilab/api/specs/v1/vehicles/details?page=1&size=20&manufacturer=Ford"

# Get vehicle details with highlights (segmented stats)
curl "http://generic-prime.minilab/api/specs/v1/vehicles/details?page=1&size=20&h_manufacturer=Ford"
```

---

## 4. Backend Service Details

### Source Location

```
~/projects/generic-prime/backend-specs/
├── Dockerfile
├── package.json
└── src/
    ├── index.js                    # Express app entry point
    ├── config/
    │   └── elasticsearch.js        # ES client configuration
    ├── routes/
    │   └── specsRoutes.js          # Route definitions
    ├── controllers/
    │   └── specsController.js      # Request handlers
    └── services/
        └── elasticsearchService.js # ES query logic
```

### Configuration

**Environment Variables**:
```bash
PORT=3000                                              # Server port
ELASTICSEARCH_URL=http://elasticsearch.data.svc.cluster.local:9200
ELASTICSEARCH_INDEX=autos-unified
SERVICE_NAME=specs-api
```

### Deployment

```bash
# Build image
cd ~/projects/generic-prime/backend-specs
podman build -t localhost/generic-prime-backend:v1.0.2 .

# Export and import to K3s
podman save localhost/generic-prime-backend:v1.0.2 -o backend.tar
sudo k3s ctr images import backend.tar
rm backend.tar

# Apply deployment
cd ~/projects/generic-prime/k8s
kubectl apply -f backend-deployment.yaml

# Verify
kubectl get pods -n generic-prime
kubectl logs -n generic-prime -l app=generic-prime-backend
```

---

## 5. Critical Finding: Bug #11 Root Cause

### The Problem

The `/manufacturer-model-combinations` endpoint returns a **NESTED** structure:

```json
{
  "total": 72,    // <-- Number of MANUFACTURERS, NOT manufacturer-model combos!
  "data": [
    {
      "manufacturer": "Chevrolet",
      "count": 849,
      "models": [
        { "model": "Corvette", "count": 23 },
        { "model": "Camaro", "count": 18 }
      ]
    }
  ]
}
```

### What The Frontend Expects

The picker component expects a **FLAT** list of manufacturer-model combinations with a total count:

```json
{
  "total": 4887,    // Total number of manufacturer-model combinations
  "data": [
    { "manufacturer": "Chevrolet", "model": "Corvette", "count": 23 },
    { "manufacturer": "Chevrolet", "model": "Camaro", "count": 18 }
  ]
}
```

### Root Cause Analysis

1. **Backend returns NESTED**: `{ manufacturers: [{ models: [] }] }`
2. **Total count is MANUFACTURER count**: 72 manufacturers, not ~4,800 combos
3. **Frontend interprets incorrectly**: Shows 72 "entries" thinking they're combos
4. **Aggregation limits**: `size: 100` for manufacturers AND `size: 100` for models per manufacturer

### Solution Options

**Option A: Change Backend API**
- Create new endpoint that returns flat list
- Or add `format=flat` query parameter

**Option B: Transform in Frontend**
- Frontend adapter flattens the nested structure
- Calculates true total from sum of all models

**Option C: Use `/vehicles/details` Instead**
- This endpoint returns flat list of vehicle specs
- Could be used for picker with appropriate transformation

---

## 6. Elasticsearch Query Reference

### Count All Records

```json
GET /autos-unified/_count
// Response: { "count": 4887 }
```

### Count Unique Manufacturer-Model Combinations

```json
GET /autos-unified/_search
{
  "size": 0,
  "aggs": {
    "combo_count": {
      "cardinality": {
        "script": "doc['manufacturer.keyword'].value + '|' + doc['model.keyword'].value"
      }
    }
  }
}
// Response: { "aggregations": { "combo_count": { "value": ~4800 } } }
```

### Get All Manufacturer-Model Combinations (Flat)

```json
GET /autos-unified/_search
{
  "size": 0,
  "aggs": {
    "combos": {
      "composite": {
        "size": 10000,
        "sources": [
          { "manufacturer": { "terms": { "field": "manufacturer.keyword" } } },
          { "model": { "terms": { "field": "model.keyword" } } }
        ]
      }
    }
  }
}
```

### Get Statistics with Segmented Highlights

```json
GET /autos-unified/_search
{
  "size": 0,
  "aggs": {
    "by_manufacturer": {
      "terms": { "field": "manufacturer.keyword", "size": 100 },
      "aggs": {
        "highlighted": {
          "filter": {
            "term": { "manufacturer.keyword": "Ford" }
          }
        }
      }
    }
  }
}
```

---

## 7. Verification Commands

### Check Elasticsearch Health

```bash
# Via kubectl
kubectl exec -n data deploy/elasticsearch -- curl -s localhost:9200/_cluster/health | jq

# Via port-forward
kubectl port-forward -n data svc/elasticsearch 9200:9200 &
curl localhost:9200/_cluster/health | jq
```

### List Indices

```bash
curl localhost:9200/_cat/indices?v
```

### Check Document Counts

```bash
curl localhost:9200/autos-unified/_count | jq
curl localhost:9200/autos-vins/_count | jq
```

### Check Backend Pods

```bash
kubectl get pods -n generic-prime
kubectl logs -n generic-prime -l app=generic-prime-backend --tail=50
```

---

## 8. Known Issues

### Issue 1: Backend Pods CrashLoopBackOff

**Status**: Backend pods in `generic-prime` namespace are crashing

**Diagnosis**:
```bash
kubectl get pods -n generic-prime
kubectl describe pod -n generic-prime <pod-name>
kubectl logs -n generic-prime <pod-name> --previous
```

**Common Causes**:
- Elasticsearch not reachable
- Index doesn't exist
- Configuration error

### Issue 2: Nested vs Flat Data Structure (Bug #11)

**Status**: Manufacturer-Model picker shows incorrect total count

**Root Cause**: Backend returns nested structure, frontend expects flat list

**See**: Section 5 above for full analysis

---

## 9. Quick Reference

### Start Development

```bash
# Start frontend container
podman exec -it generic-prime-frontend-dev npm start -- --host 0.0.0.0 --port 4205

# Access frontend
open http://192.168.0.244:4205/discover
```

### Query Elasticsearch Directly

```bash
# Port-forward ES
kubectl port-forward -n data svc/elasticsearch 9200:9200 &

# Test connection
curl localhost:9200

# Count documents
curl localhost:9200/autos-unified/_count | jq
```

### Deploy Backend

```bash
cd ~/projects/generic-prime/backend-specs
podman build -t localhost/generic-prime-backend:v1.0.2 .
podman save localhost/generic-prime-backend:v1.0.2 | sudo k3s ctr images import -
kubectl rollout restart deployment/generic-prime-backend -n generic-prime
```

---

**Document Created**: 2025-11-26
**Author**: Claude Code Analysis
**Status**: Complete
