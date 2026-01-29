# Elasticsearch Data Reference

**Last Updated**: 2025-11-26
**Purpose**: Direct Elasticsearch queries and data statistics for the generic-prime project

---

## Quick Access

```bash
# Port-forward Elasticsearch (run from host machine)
kubectl port-forward -n data svc/elasticsearch 9200:9200 &

# Verify connection
curl -s "http://localhost:9200/_cluster/health" | jq '.status'
```

---

## 1. Indices Overview

### List All Indices

```bash
curl -s "http://localhost:9200/_cat/indices?v&s=index"
```

**Results**:

| Index | Documents | Size | Purpose |
|-------|-----------|------|---------|
| `autos-unified` | **4,887** | 536.4kb | Vehicle specifications (make/model/year) |
| `autos-vins` | **55,463** | 8.7mb | Individual VIN records |
| `transport-unified` | 4,607 | 2.1mb | Transport data (unrelated) |
| `tle-2025-09` | 858 | 410.7kb | Time-series logs |
| `tle-2025-10` | 866 | 425.4kb | Time-series logs |
| `tle-2025-11` | 869 | 428.7kb | Time-series logs |
| `vehicle-tracking` | 0 | 249b | Empty index |

---

## 2. `autos-unified` Index

### Document Count

```bash
curl -s "http://localhost:9200/autos-unified/_count" | jq '.'
```

**Result**: `{ "count": 4887 }`

### Field Mappings

```bash
curl -s "http://localhost:9200/autos-unified/_mapping" | jq '.["autos-unified"].mappings.properties | to_entries | map({field: .key, type: .value.type, has_keyword: (if .value.fields.keyword then true else false end)}) | sort_by(.field)'
```

**Result**:

| Field | Type | Has .keyword |
|-------|------|--------------|
| `body_class` | keyword | No |
| `body_class_match_type` | text | Yes |
| `body_class_updated_at` | date | No |
| `body_style` | keyword | No |
| `data_source` | keyword | No |
| `drive_type` | keyword | No |
| `engine_cylinders` | integer | No |
| `engine_displacement_l` | float | No |
| `engine_hp` | integer | No |
| `engine_type` | keyword | No |
| `ingested_at` | date | No |
| `manufacturer` | text | **Yes** |
| `model` | text | **Yes** |
| `synthesis_date` | date | No |
| `transmission_speeds` | integer | No |
| `transmission_type` | keyword | No |
| `vehicle_id` | keyword | No |
| `vin` | keyword | No |
| `year` | integer | No |

### Sample Documents

```bash
curl -s "http://localhost:9200/autos-unified/_search?size=2" | jq '.hits.hits[]._source'
```

**Result**:
```json
{
  "vehicle_id": "nhtsa-ford-crown-victoria-1953",
  "manufacturer": "Ford",
  "model": "Crown Victoria",
  "year": 1953,
  "body_class": "Sedan",
  "data_source": "nhtsa_vpic_large_sample",
  "ingested_at": "2025-10-12T23:22:19.933382",
  "body_class_match_type": "exact_match",
  "body_class_updated_at": "2025-11-02T07:32:25.127446"
}
```

### Aggregation Statistics

```bash
curl -s "http://localhost:9200/autos-unified/_search" -H 'Content-Type: application/json' -d '{
  "size": 0,
  "aggs": {
    "unique_manufacturers": { "cardinality": { "field": "manufacturer.keyword" } },
    "unique_models": { "cardinality": { "field": "model.keyword" } },
    "unique_body_classes": { "cardinality": { "field": "body_class" } },
    "unique_data_sources": { "cardinality": { "field": "data_source" } },
    "year_stats": { "stats": { "field": "year" } }
  }
}' | jq '{
  total_documents: .hits.total.value,
  unique_manufacturers: .aggregations.unique_manufacturers.value,
  unique_models: .aggregations.unique_models.value,
  unique_body_classes: .aggregations.unique_body_classes.value,
  unique_data_sources: .aggregations.unique_data_sources.value,
  year_min: .aggregations.year_stats.min,
  year_max: .aggregations.year_stats.max
}'
```

**Result**:
```json
{
  "total_documents": 4887,
  "unique_manufacturers": 72,
  "unique_models": 818,
  "unique_body_classes": 12,
  "unique_data_sources": 2,
  "year_min": 1908,
  "year_max": 2024
}
```

### Count Unique Manufacturer-Model Combinations

```bash
curl -s "http://localhost:9200/autos-unified/_search" -H 'Content-Type: application/json' -d '{
  "size": 0,
  "aggs": {
    "manufacturer_model_combos": {
      "cardinality": {
        "script": "doc[\"manufacturer.keyword\"].value + \"|\" + doc[\"model.keyword\"].value"
      }
    }
  }
}' | jq '.aggregations.manufacturer_model_combos.value'
```

**Result**: `881`

### Summary Table

| Metric | Value |
|--------|-------|
| Total Documents | 4,887 |
| Unique Manufacturers | **72** |
| Unique Models | **818** |
| Unique Manufacturer-Model Combos | **881** |
| Unique Body Classes | 12 |
| Unique Data Sources | 2 |
| Year Range | 1908 - 2024 |

---

## 3. `autos-vins` Index

### Document Count

```bash
curl -s "http://localhost:9200/autos-vins/_count" | jq '.'
```

**Result**: `{ "count": 55463 }`

### Field Mappings

```bash
curl -s "http://localhost:9200/autos-vins/_mapping" | jq '.["autos-vins"].mappings.properties | to_entries | map({field: .key, type: .value.type}) | sort_by(.field)'
```

**Result**:

| Field | Type |
|-------|------|
| `body_class` | keyword |
| `condition_description` | keyword |
| `condition_rating` | integer |
| `data_source` | text |
| `estimated_value` | integer |
| `exterior_color` | text |
| `factory_options` | text |
| `last_service_date` | date |
| `manufacturer` | keyword |
| `matching_numbers` | boolean |
| `mileage` | integer |
| `mileage_verified` | boolean |
| `model` | keyword |
| `registered_state` | keyword |
| `registration_status` | keyword |
| `title_status` | keyword |
| `vehicle_id` | keyword |
| `vin` | keyword |
| `year` | integer |

### Sample Documents

```bash
curl -s "http://localhost:9200/autos-vins/_search?size=2" | jq '.hits.hits[]._source | {vin, vehicle_id, manufacturer, model, year, mileage, condition_rating, estimated_value}'
```

**Result**:
```json
{
  "vin": "1PLBP40E9CF100000",
  "vehicle_id": "synth-plymouth-horizon-1982",
  "manufacturer": "Plymouth",
  "model": "Horizon",
  "year": 1982,
  "mileage": 523377,
  "condition_rating": 3,
  "estimated_value": 33715
}
```

### Aggregation Statistics

```bash
curl -s "http://localhost:9200/autos-vins/_search" -H 'Content-Type: application/json' -d '{
  "size": 0,
  "aggs": {
    "unique_vehicle_ids": { "cardinality": { "field": "vehicle_id" } },
    "unique_manufacturers": { "cardinality": { "field": "manufacturer" } },
    "mileage_stats": { "stats": { "field": "mileage" } },
    "value_stats": { "stats": { "field": "estimated_value" } }
  }
}' | jq '{
  total_documents: .hits.total.value,
  unique_vehicle_ids: .aggregations.unique_vehicle_ids.value,
  unique_manufacturers: .aggregations.unique_manufacturers.value,
  avg_mileage: .aggregations.mileage_stats.avg,
  avg_value: .aggregations.value_stats.avg
}'
```

### Summary Table

| Metric | Value |
|--------|-------|
| Total Documents | 55,463 |
| Unique Vehicle IDs | 4,886 |
| Average VINs per Vehicle | ~11.3 |

---

## 4. Data Relationships

```
autos-unified (4,887 specs)          autos-vins (55,463 VINs)
┌─────────────────────┐              ┌─────────────────────┐
│ vehicle_id (PK)     │◄────────────▶│ vehicle_id (FK)     │
│ manufacturer        │              │ vin (PK)            │
│ model               │              │ manufacturer        │
│ year                │              │ model               │
│ body_class          │              │ year                │
│ data_source         │              │ mileage             │
└─────────────────────┘              │ condition_rating    │
                                     │ estimated_value     │
                                     │ registered_state    │
                                     └─────────────────────┘

Relationship: 1 vehicle spec → ~11 VIN instances (average)
```

### Join Query Example

Get VIN counts per vehicle specification:

```bash
curl -s "http://localhost:9200/autos-vins/_search" -H 'Content-Type: application/json' -d '{
  "size": 0,
  "aggs": {
    "by_vehicle": {
      "terms": {
        "field": "vehicle_id",
        "size": 10,
        "order": { "_count": "desc" }
      }
    }
  }
}' | jq '.aggregations.by_vehicle.buckets'
```

---

## 5. Useful Queries

### Get All Manufacturers (Sorted)

```bash
curl -s "http://localhost:9200/autos-unified/_search" -H 'Content-Type: application/json' -d '{
  "size": 0,
  "aggs": {
    "manufacturers": {
      "terms": {
        "field": "manufacturer.keyword",
        "size": 100,
        "order": { "_key": "asc" }
      }
    }
  }
}' | jq '.aggregations.manufacturers.buckets | map({name: .key, count: .doc_count})'
```

### Get All Body Classes

```bash
curl -s "http://localhost:9200/autos-unified/_search" -H 'Content-Type: application/json' -d '{
  "size": 0,
  "aggs": {
    "body_classes": {
      "terms": {
        "field": "body_class",
        "size": 50
      }
    }
  }
}' | jq '.aggregations.body_classes.buckets | map({name: .key, count: .doc_count})'
```

### Get Manufacturer-Model Combinations (Nested)

```bash
curl -s "http://localhost:9200/autos-unified/_search" -H 'Content-Type: application/json' -d '{
  "size": 0,
  "aggs": {
    "manufacturers": {
      "terms": {
        "field": "manufacturer.keyword",
        "size": 100,
        "order": { "_key": "asc" }
      },
      "aggs": {
        "models": {
          "terms": {
            "field": "model.keyword",
            "size": 100,
            "order": { "_key": "asc" }
          }
        }
      }
    }
  }
}' | jq '.aggregations.manufacturers.buckets[:3]'
```

### Get Manufacturer-Model Combinations (Flat - using Composite)

```bash
curl -s "http://localhost:9200/autos-unified/_search" -H 'Content-Type: application/json' -d '{
  "size": 0,
  "aggs": {
    "combos": {
      "composite": {
        "size": 20,
        "sources": [
          { "manufacturer": { "terms": { "field": "manufacturer.keyword" } } },
          { "model": { "terms": { "field": "model.keyword" } } }
        ]
      }
    }
  }
}' | jq '.aggregations.combos.buckets | map({manufacturer: .key.manufacturer, model: .key.model, count: .doc_count})'
```

### Search by Manufacturer

```bash
curl -s "http://localhost:9200/autos-unified/_search" -H 'Content-Type: application/json' -d '{
  "size": 10,
  "query": {
    "term": { "manufacturer.keyword": "Ford" }
  }
}' | jq '.hits.hits[]._source | {vehicle_id, manufacturer, model, year}'
```

### Year Range Query

```bash
curl -s "http://localhost:9200/autos-unified/_search" -H 'Content-Type: application/json' -d '{
  "size": 10,
  "query": {
    "range": {
      "year": { "gte": 2020, "lte": 2024 }
    }
  }
}' | jq '.hits.total.value'
```

---

## 6. Key Findings for Bug #11

The Manufacturer-Model Picker issue is explained by these counts:

| What Frontend Shows | Actual ES Value | Why |
|---------------------|-----------------|-----|
| "72 entries" | 72 manufacturers | Backend returns nested structure with manufacturer count as `total` |
| Expected ~4,800 | 4,887 vehicle specs | This includes year variants (Ford F-150 2020, 2021, etc.) |
| Should show | **881** | Unique manufacturer-model combinations (ignoring year) |

**Root Cause**: The `/manufacturer-model-combinations` API returns:
```json
{
  "total": 72,        // ← This is MANUFACTURER count
  "data": [
    {
      "manufacturer": "Ford",
      "count": 849,
      "models": [...]  // ← Models are NESTED, not flat
    }
  ]
}
```

**Solution Options**:
1. Backend: Add `format=flat` parameter to return flat list with correct total
2. Backend: Use composite aggregation for true manufacturer-model list
3. Frontend: Transform nested structure and calculate correct total

---

## 7. Cluster Health

```bash
curl -s "http://localhost:9200/_cluster/health" | jq '.'
```

**Expected Result**:
```json
{
  "cluster_name": "tle-cluster",
  "status": "green",
  "number_of_nodes": 1,
  "number_of_data_nodes": 1,
  "active_primary_shards": 46,
  "active_shards": 46,
  "active_shards_percent_as_number": 100.0
}
```

---

**Document Created**: 2025-11-26
**Source**: Direct Elasticsearch queries via `kubectl port-forward`
