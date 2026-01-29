# API Architecture & Elasticsearch Integration Analysis

**Date**: 2025-11-23
**Purpose**: Explain API URL differences and Elasticsearch query mapping

---

## API URL Differences Explained

### Application Architecture Comparison

| Component | Port 4201 (Reference) | Port 4205 (Current) |
|-----------|----------------------|---------------------|
| **Frontend URL** | `http://autos.minilab:4201` | `http://auto-discovery.minilab:4205` |
| **API Base URL** | `http://autos.minilab/api/v1` | `http://auto-discovery.minilab/api/specs/v1` |
| **Backend Service** | `autos-backend` (monolithic) | `auto-discovery-specs-api` (microservice) |
| **Namespace** | `autos` | `auto-discovery` |
| **Service Port** | 3000 | 3000 |
| **Architecture** | Single service | Multiple services (specs, vins, auth) |

### DNS Resolution

Both hostnames resolve to the **SAME server** (`192.168.0.110` via alias "loki"):

```bash
$ host autos.minilab
autos.minilab is an alias for loki.
loki has address 192.168.0.110

$ host auto-discovery.minilab
auto-discovery.minilab is an alias for loki.
loki has address 192.168.0.110
```

**Key Insight**: Same physical server, different Kubernetes ingress routing!

---

## URL Structure Breakdown

### Port 4201 (Reference Application)

```
http://autos.minilab/api/v1/vehicles/details
│      │         │      │   │
│      │         │      │   └─ Endpoint path
│      │         │      └───── API version
│      │         └──────────── API prefix
│      └────────────────────── Hostname (DNS → 192.168.0.110)
└───────────────────────────── Protocol
```

**Routing Path**:
```
User Browser
  ↓
http://autos.minilab/api/v1/vehicles/details
  ↓
Traefik Ingress (Kubernetes)
  ↓ (matches Host: autos.minilab, PathPrefix: /api)
autos-backend.autos.svc.cluster.local:3000
  ↓
Express.js server
  ↓
GET /api/v1/vehicles/details handler
  ↓
Elasticsearch client
  ↓
elasticsearch.data.svc.cluster.local:9200
  ↓
POST /_search on index: autos-unified
```

---

### Port 4205 (Current Application)

```
http://auto-discovery.minilab/api/specs/v1/vehicles/details
│      │                 │    │     │   │
│      │                 │    │     │   └─ Endpoint path
│      │                 │    │     └───── API version
│      │                 │    └─────────── Service name (specs)
│      │                 └──────────────── API prefix
│      └────────────────────────────────── Hostname
└───────────────────────────────────────── Protocol
```

**Routing Path**:
```
User Browser
  ↓
http://auto-discovery.minilab/api/specs/v1/vehicles/details
  ↓
Traefik Ingress (Kubernetes)
  ↓ (matches Host: auto-discovery.minilab, PathPrefix: /api/specs)
auto-discovery-specs-api.auto-discovery.svc.cluster.local:3000
  ↓
Express.js server
  ↓
GET /api/specs/v1/vehicles/details handler
  ↓
Elasticsearch client
  ↓
elasticsearch.data.svc.cluster.local:9200
  ↓
POST /_search on index: autos-unified
```

---

## Kubernetes Ingress Configuration

### Port 4201 Ingress (Monolithic)

**File**: `~/projects/autos-prime-ng/k8s/ingress.yaml` (likely)

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: autos-backend-ingress
  namespace: autos
  annotations:
    traefik.ingress.kubernetes.io/router.entrypoints: web
spec:
  rules:
  - host: autos.minilab
    http:
      paths:
      - path: /api
        pathType: Prefix
        backend:
          service:
            name: autos-backend
            port:
              number: 3000
```

---

### Port 4205 Ingress (Microservices)

**File**: `~/projects/auto-discovery/k8s/ingress.yaml` (likely)

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: auto-discovery-ingress
  namespace: auto-discovery
  annotations:
    traefik.ingress.kubernetes.io/router.entrypoints: web
spec:
  rules:
  - host: auto-discovery.minilab
    http:
      paths:
      # Specs API
      - path: /api/specs
        pathType: Prefix
        backend:
          service:
            name: auto-discovery-specs-api
            port:
              number: 3000

      # VINs API
      - path: /api/vins
        pathType: Prefix
        backend:
          service:
            name: auto-discovery-vins-api
            port:
              number: 3001

      # Auth API
      - path: /api/auth
        pathType: Prefix
        backend:
          service:
            name: auto-discovery-auth-service
            port:
              number: 3002
```

**Key Difference**: Port 4205 uses **path-based routing** to split traffic across multiple microservices!

---

## Elasticsearch Index Mapping

### Determining Which Indices Are Queried

Both applications query the **SAME Elasticsearch index**: `autos-unified`

#### Method 1: Check Backend Configuration Files

**Port 4201**:
```bash
$ grep -r "ELASTICSEARCH_INDEX" ~/projects/autos-prime-ng/backend/
```

**Expected Output**:
```javascript
// File: ~/projects/autos-prime-ng/backend/src/config/elasticsearch.js
const ELASTICSEARCH_INDEX = 'autos-unified';
```

**Port 4205**:
```bash
$ grep -r "ELASTICSEARCH_INDEX" ~/projects/auto-discovery/backend-specs/
```

**Expected Output**:
```javascript
// File: ~/projects/auto-discovery/backend-specs/src/config/elasticsearch.js
const ELASTICSEARCH_INDEX = 'autos-unified';
```

---

#### Method 2: Check Backend Source Code

**Port 4201**: `/home/odin/projects/autos-prime-ng/backend/src/config/elasticsearch.js`

```javascript
const { Client } = require('@elastic/elasticsearch');

const esClient = new Client({
  node: process.env.ELASTICSEARCH_URL || 'http://elasticsearch.data.svc.cluster.local:9200',
  maxRetries: 5,
  requestTimeout: 30000,
});

const ELASTICSEARCH_INDEX = process.env.ELASTICSEARCH_INDEX || 'autos-unified';

module.exports = {
  esClient,
  ELASTICSEARCH_INDEX,
};
```

**Port 4205**: `/home/odin/projects/auto-discovery/backend-specs/src/config/elasticsearch.js`

```javascript
const { Client } = require('@elastic/elasticsearch');

const esClient = new Client({
  node: process.env.ELASTICSEARCH_URL || 'http://elasticsearch.data.svc.cluster.local:9200',
  maxRetries: 5,
  requestTimeout: 30000,
});

const ELASTICSEARCH_INDEX = process.env.ELASTICSEARCH_INDEX || 'autos-unified';

module.exports = {
  esClient,
  ELASTICSEARCH_INDEX,
};
```

✅ **Confirmed**: Both use `autos-unified` index by default!

---

#### Method 3: Kibana Index Management

**URL**: http://kibana.minilab/app/management/data/index_management/indices

**Steps**:
1. Navigate to Kibana → Management → Index Management
2. Search for indices matching `autos-*`
3. Check document counts

**Expected Indices**:
```
Index Name          Documents    Size
--------------------------------------
autos-unified       4,887       ~2.5 MB
autos-vins          55,463      ~15 MB
```

**Verification**:
- `autos-unified`: Vehicle specifications (used by BOTH port 4201 and 4205)
- `autos-vins`: Individual VIN records (only used by port 4205 VINs API)

---

## Elasticsearch Query Examples

### Backend Query Structure

When you call:
```
GET http://auto-discovery.minilab/api/specs/v1/vehicles/details?page=1&size=2&h_manufacturer=Ford
```

The backend executes this Elasticsearch query:

**File**: `/home/odin/projects/auto-discovery/backend-specs/src/services/elasticsearchService.js` (lines 396-450)

```javascript
const response = await esClient.search({
  index: ELASTICSEARCH_INDEX,  // 'autos-unified'
  from: 0,                     // (page - 1) * size
  size: 2,                     // size parameter
  query: {
    bool: {
      must: [{ match_all: {} }],
      filter: []
    }
  },
  sort: [
    { 'manufacturer.keyword': { order: 'asc' } },
    { 'model.keyword': { order: 'asc' } },
    { year: { order: 'desc' } }
  ],
  aggs: {
    by_manufacturer: {
      terms: {
        field: 'manufacturer.keyword',
        size: 100,
        order: { _count: 'desc' }
      },
      aggs: {
        highlighted: {
          filter: {
            bool: {
              filter: [
                { terms: { 'manufacturer.keyword': ['Ford'] } }
              ]
            }
          }
        }
      }
    },
    // ... other aggregations
  }
});
```

---

## Kibana Dev Tools Console Queries

### Access Kibana Dev Tools

**URL**: http://kibana.minilab/app/dev_tools#/console

---

### Query 1: Basic Search (No Highlights)

**Replicates**: `GET /api/specs/v1/vehicles/details?page=1&size=2`

```json
POST /autos-unified/_search
{
  "from": 0,
  "size": 2,
  "query": {
    "bool": {
      "must": [{ "match_all": {} }]
    }
  },
  "sort": [
    { "manufacturer.keyword": { "order": "asc" } },
    { "model.keyword": { "order": "asc" } },
    { "year": { "order": "desc" } }
  ],
  "aggs": {
    "by_manufacturer": {
      "terms": {
        "field": "manufacturer.keyword",
        "size": 100,
        "order": { "_count": "desc" }
      }
    },
    "by_year_range": {
      "terms": {
        "field": "year",
        "size": 100,
        "order": { "_key": "asc" }
      }
    },
    "by_body_class": {
      "terms": {
        "field": "body_class",
        "size": 20,
        "order": { "_count": "desc" }
      }
    }
  }
}
```

**Expected Response**:
```json
{
  "hits": {
    "total": { "value": 4887 },
    "hits": [
      {
        "_source": {
          "vehicle_id": "nhtsa-acura-ilx-2013",
          "manufacturer": "Acura",
          "model": "ILX",
          "year": 2024
        }
      }
    ]
  },
  "aggregations": {
    "by_manufacturer": {
      "buckets": [
        { "key": "Chevrolet", "doc_count": 849 },
        { "key": "Ford", "doc_count": 665 }
      ]
    }
  }
}
```

---

### Query 2: Search with Highlights (Segmented Statistics)

**Replicates**: `GET /api/specs/v1/vehicles/details?page=1&size=2&h_manufacturer=Ford`

```json
POST /autos-unified/_search
{
  "from": 0,
  "size": 2,
  "query": {
    "bool": {
      "must": [{ "match_all": {} }]
    }
  },
  "sort": [
    { "manufacturer.keyword": { "order": "asc" } },
    { "model.keyword": { "order": "asc" } },
    { "year": { "order": "desc" } }
  ],
  "aggs": {
    "by_manufacturer": {
      "terms": {
        "field": "manufacturer.keyword",
        "size": 100,
        "order": { "_count": "desc" }
      },
      "aggs": {
        "highlighted": {
          "filter": {
            "bool": {
              "filter": [
                { "terms": { "manufacturer.keyword": ["Ford"] } }
              ]
            }
          }
        }
      }
    },
    "models_by_manufacturer": {
      "terms": {
        "field": "manufacturer.keyword",
        "size": 100
      },
      "aggs": {
        "models": {
          "terms": {
            "field": "model.keyword",
            "size": 50
          },
          "aggs": {
            "highlighted": {
              "filter": {
                "bool": {
                  "filter": [
                    { "terms": { "manufacturer.keyword": ["Ford"] } }
                  ]
                }
              }
            }
          }
        }
      }
    },
    "by_year_range": {
      "terms": {
        "field": "year",
        "size": 100,
        "order": { "_key": "asc" }
      },
      "aggs": {
        "highlighted": {
          "filter": {
            "bool": {
              "filter": [
                { "terms": { "manufacturer.keyword": ["Ford"] } }
              ]
            }
          }
        }
      }
    },
    "by_body_class": {
      "terms": {
        "field": "body_class",
        "size": 20,
        "order": { "_count": "desc" }
      },
      "aggs": {
        "highlighted": {
          "filter": {
            "bool": {
              "filter": [
                { "terms": { "manufacturer.keyword": ["Ford"] } }
              ]
            }
          }
        }
      }
    }
  }
}
```

**Expected Response** (Segmented Statistics):
```json
{
  "hits": {
    "total": { "value": 4887 },
    "hits": [ /* ... */ ]
  },
  "aggregations": {
    "by_manufacturer": {
      "buckets": [
        {
          "key": "Chevrolet",
          "doc_count": 849,
          "highlighted": {
            "doc_count": 0
          }
        },
        {
          "key": "Ford",
          "doc_count": 665,
          "highlighted": {
            "doc_count": 665
          }
        }
      ]
    }
  }
}
```

**Key Difference**: Each bucket now has a `highlighted` sub-aggregation showing how many documents match the highlight filter!

---

### Query 3: Multiple Highlight Filters

**Replicates**: `GET /api/specs/v1/vehicles/details?h_manufacturer=Ford&h_yearMin=2020&h_yearMax=2024`

```json
POST /autos-unified/_search
{
  "from": 0,
  "size": 20,
  "query": {
    "bool": {
      "must": [{ "match_all": {} }]
    }
  },
  "aggs": {
    "by_manufacturer": {
      "terms": {
        "field": "manufacturer.keyword",
        "size": 100
      },
      "aggs": {
        "highlighted": {
          "filter": {
            "bool": {
              "filter": [
                { "terms": { "manufacturer.keyword": ["Ford"] } },
                { "range": { "year": { "gte": 2020, "lte": 2024 } } }
              ]
            }
          }
        }
      }
    }
  }
}
```

**Result**: Only Ford vehicles from 2020-2024 will be counted in the `highlighted` bucket!

---

### Query 4: Check Index Mappings

**Purpose**: Verify field types and keyword sub-fields

```json
GET /autos-unified/_mapping
```

**Expected Response** (excerpt):
```json
{
  "autos-unified": {
    "mappings": {
      "properties": {
        "manufacturer": {
          "type": "text",
          "fields": {
            "keyword": {
              "type": "keyword"
            }
          }
        },
        "model": {
          "type": "text",
          "fields": {
            "keyword": {
              "type": "keyword"
            }
          }
        },
        "year": {
          "type": "integer"
        },
        "body_class": {
          "type": "keyword"
        },
        "vehicle_id": {
          "type": "keyword"
        }
      }
    }
  }
}
```

**Key Insight**:
- `manufacturer` and `model` are **text** fields with **keyword** sub-fields
- Text fields: Used for full-text search (analyzed, tokenized)
- Keyword fields: Used for exact matching, aggregations, sorting (not analyzed)

---

### Query 5: Check Document Count

**Purpose**: Verify index size

```json
GET /autos-unified/_count
```

**Expected Response**:
```json
{
  "count": 4887,
  "_shards": {
    "total": 1,
    "successful": 1,
    "skipped": 0,
    "failed": 0
  }
}
```

---

### Query 6: Sample Documents

**Purpose**: Inspect actual document structure

```json
GET /autos-unified/_search
{
  "size": 3,
  "query": {
    "term": { "manufacturer.keyword": "Ford" }
  }
}
```

**Expected Response**:
```json
{
  "hits": {
    "total": { "value": 665 },
    "hits": [
      {
        "_index": "autos-unified",
        "_id": "nhtsa-ford-f-150-2020",
        "_score": 1.0,
        "_source": {
          "vehicle_id": "nhtsa-ford-f-150-2020",
          "manufacturer": "Ford",
          "model": "F-150",
          "year": 2020,
          "body_class": "Pickup",
          "data_source": "nhtsa_vpic_large_sample",
          "ingested_at": "2025-10-12T23:22:20.018715",
          "body_class_match_type": "fallback",
          "body_class_updated_at": "2025-11-02T07:32:25.128323"
        }
      }
    ]
  }
}
```

---

## Network Flow Diagram

### Complete Request Path (Port 4205 with h_* parameters)

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. User Browser (Port 4205)                                    │
│    http://auto-discovery.minilab:4205/discover?h_manufacturer=Ford │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. Frontend JavaScript (Angular)                                │
│    ❌ MISSING: extractHighlights() method                      │
│    ❌ NOT SENDING: h_manufacturer parameter to API             │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼ (HTTP GET)
┌─────────────────────────────────────────────────────────────────┐
│ 3. Traefik Ingress Controller (192.168.0.110)                  │
│    Host: auto-discovery.minilab                                 │
│    Path: /api/specs/v1/vehicles/details                        │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼ (Route to service)
┌─────────────────────────────────────────────────────────────────┐
│ 4. Kubernetes Service                                           │
│    auto-discovery-specs-api.auto-discovery.svc.cluster.local:3000│
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│ 5. Express.js Backend (Node.js)                                │
│    GET /api/specs/v1/vehicles/details handler                  │
│    ✅ READY: Accepts h_* query parameters                      │
│    ✅ READY: Builds highlight filter for Elasticsearch         │
│    ❌ PROBLEM: Frontend not sending h_* params!                │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼ (Elasticsearch query)
┌─────────────────────────────────────────────────────────────────┐
│ 6. Elasticsearch Cluster                                        │
│    elasticsearch.data.svc.cluster.local:9200                    │
│    POST /autos-unified/_search                                  │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼ (Query response)
┌─────────────────────────────────────────────────────────────────┐
│ 7. Elasticsearch Response                                       │
│    WITH h_* params: {total: X, highlighted: Y}                 │
│    WITHOUT h_* params: X (simple number)                       │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼ (Transform & return)
┌─────────────────────────────────────────────────────────────────┐
│ 8. Backend Response to Frontend                                 │
│    JSON with statistics object                                  │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│ 9. Frontend Charts                                              │
│    ❌ Expects segmented format: {total, highlighted}           │
│    ❌ Receives simple numbers: X                               │
│    ❌ Charts show wrong data                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Verification Commands

### Check Elasticsearch Cluster Health

```bash
curl -X GET "http://elasticsearch.data.svc.cluster.local:9200/_cluster/health?pretty"
```

**Or from outside cluster** (if port-forwarded):
```bash
kubectl port-forward -n data svc/elasticsearch 9200:9200
curl -X GET "http://localhost:9200/_cluster/health?pretty"
```

---

### List All Indices

```bash
curl -X GET "http://elasticsearch.data.svc.cluster.local:9200/_cat/indices?v"
```

**Expected Output**:
```
health status index         uuid                   pri rep docs.count docs.deleted store.size pri.store.size
yellow open   autos-unified hVq9xKj3R0eZ_9xYz3gkxQ   1   1       4887            0      2.5mb          2.5mb
yellow open   autos-vins    mNk2jLp4TQy8_7xWz4hlyR   1   1      55463            0       15mb           15mb
```

---

### Check Index Document Count

```bash
curl -X GET "http://elasticsearch.data.svc.cluster.local:9200/autos-unified/_count?pretty"
```

**Expected Output**:
```json
{
  "count": 4887,
  "_shards": {
    "total": 1,
    "successful": 1,
    "skipped": 0,
    "failed": 0
  }
}
```

---

## Summary

### Key Findings

1. **Same Data Source**: Both port 4201 and 4205 query the **SAME** Elasticsearch index (`autos-unified`)

2. **Same Backend Logic**: Both backends have **IDENTICAL** code for handling h_* parameters

3. **Different URL Paths**: URLs differ due to:
   - Kubernetes namespace separation (`autos` vs `auto-discovery`)
   - Ingress routing configuration (path-based routing for microservices)
   - Architectural choice (monolithic vs microservices)

4. **Problem Location**: Frontend (port 4205) not sending h_* parameters to backend

### Elasticsearch Query Pattern

When h_* parameters are present:
```
Main Query (returns documents)
  +
Aggregations (compute statistics)
  +
Sub-Aggregations (highlighted filter)
  =
Segmented Statistics: {total: X, highlighted: Y}
```

When h_* parameters are absent:
```
Main Query (returns documents)
  +
Aggregations (compute statistics)
  =
Simple Statistics: X
```

### Testing in Kibana Dev Tools

Use the queries above in Kibana Dev Tools Console to:
1. Verify Elasticsearch is accessible
2. Check index mappings and document structure
3. Test queries with and without highlight filters
4. Understand the difference in response format

**URL**: http://kibana.minilab/app/dev_tools#/console

---

**Document Created**: 2025-11-23
**Author**: System Analysis
**Status**: ✅ **COMPLETE**
