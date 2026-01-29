# New Backend API Specification

**Last Updated**: 2025-11-26
**Purpose**: API design for generic-prime backend serving port 4205 frontend
**Status**: DRAFT - Phase 3 of Bug #11 resolution

---

## Design Principles

1. **Data-First**: API responses match Elasticsearch data structure
2. **Expected Counts**: Every endpoint documents expected row counts
3. **Flat Over Nested**: Prefer flat structures for pickers (easier for frontend)
4. **Pagination**: Server-side for large datasets, client-side for small
5. **Counts Included**: All pickers return counts with items

---

## Base URL

```
http://generic-prime.minilab/api/v1
```

---

## 1. Picker Endpoints

### 1.1 GET `/pickers/manufacturers`

**Purpose**: Manufacturer picker (72 items)
**Expected Rows**: **72**

**Request**:
```
GET /api/v1/pickers/manufacturers
```

**Response**:
```json
{
  "total": 72,
  "data": [
    { "manufacturer": "Chevrolet", "count": 849 },
    { "manufacturer": "Ford", "count": 665 },
    { "manufacturer": "Buick", "count": 480 },
    ...
  ]
}
```

**Elasticsearch Query**:
```json
{
  "size": 0,
  "aggs": {
    "manufacturers": {
      "terms": { "field": "manufacturer.keyword", "size": 100, "order": {"_key": "asc"} }
    }
  }
}
```

---

### 1.2 GET `/pickers/manufacturer-models`

**Purpose**: Flat manufacturer-model picker (881 combinations)
**Expected Rows**: **881**

**Request**:
```
GET /api/v1/pickers/manufacturer-models
GET /api/v1/pickers/manufacturer-models?search=ford
GET /api/v1/pickers/manufacturer-models?manufacturer=Ford
```

**Query Parameters**:
| Param | Type | Description |
|-------|------|-------------|
| `search` | string | Filter by manufacturer OR model (case-insensitive) |
| `manufacturer` | string | Filter by exact manufacturer |

**Response**:
```json
{
  "total": 881,
  "data": [
    { "manufacturer": "Chevrolet", "model": "Corvette", "count": 73 },
    { "manufacturer": "Chevrolet", "model": "Suburban", "count": 91 },
    { "manufacturer": "Ford", "model": "F-150", "count": 51 },
    { "manufacturer": "Ford", "model": "Mustang", "count": 62 },
    ...
  ]
}
```

**Elasticsearch Query** (Composite Aggregation):
```json
{
  "size": 0,
  "aggs": {
    "combos": {
      "composite": {
        "size": 1000,
        "sources": [
          { "manufacturer": { "terms": { "field": "manufacturer.keyword" } } },
          { "model": { "terms": { "field": "model.keyword" } } }
        ]
      }
    }
  }
}
```

**Important**: This endpoint returns a **FLAT** list, not nested. Total is 881, not 72.

---

### 1.3 GET `/pickers/body-classes`

**Purpose**: Body class picker (12 items)
**Expected Rows**: **12**

**Request**:
```
GET /api/v1/pickers/body-classes
```

**Response**:
```json
{
  "total": 12,
  "data": [
    { "bodyClass": "Sedan", "count": 2615 },
    { "bodyClass": "SUV", "count": 998 },
    { "bodyClass": "Coupe", "count": 494 },
    { "bodyClass": "Pickup", "count": 290 },
    { "bodyClass": "Van", "count": 167 },
    { "bodyClass": "Hatchback", "count": 109 },
    { "bodyClass": "Sports Car", "count": 109 },
    { "bodyClass": "Touring Car", "count": 38 },
    { "bodyClass": "Wagon", "count": 38 },
    { "bodyClass": "Convertible", "count": 21 },
    { "bodyClass": "Truck", "count": 5 },
    { "bodyClass": "Limousine", "count": 3 }
  ]
}
```

**Elasticsearch Query**:
```json
{
  "size": 0,
  "aggs": {
    "body_classes": {
      "terms": { "field": "body_class", "size": 50, "order": {"_count": "desc"} }
    }
  }
}
```

---

### 1.4 GET `/pickers/year-range`

**Purpose**: Year range slider (1908-2024)
**Expected Values**: min=1908, max=2024

**Request**:
```
GET /api/v1/pickers/year-range
```

**Response**:
```json
{
  "min": 1908,
  "max": 2024
}
```

**Elasticsearch Query**:
```json
{
  "size": 0,
  "aggs": {
    "year_stats": { "stats": { "field": "year" } }
  }
}
```

---

### 1.5 GET `/pickers/data-sources`

**Purpose**: Data source picker (2 items)
**Expected Rows**: **2**

**Request**:
```
GET /api/v1/pickers/data-sources
```

**Response**:
```json
{
  "total": 2,
  "data": [
    { "dataSource": "synthetic_historical", "count": 4094 },
    { "dataSource": "nhtsa_vpic_large_sample", "count": 793 }
  ]
}
```

---

## 2. Results Endpoints

### 2.1 GET `/vehicles`

**Purpose**: Vehicle specs table (4,887 records)
**Expected Total**: **4,887** (without filters)

**Request**:
```
GET /api/v1/vehicles?page=1&size=20
GET /api/v1/vehicles?manufacturer=Ford&page=1&size=20
GET /api/v1/vehicles?manufacturer=Ford,Chevrolet&bodyClass=Sedan,SUV&yearMin=2000&yearMax=2020
```

**Query Parameters**:
| Param | Type | Description |
|-------|------|-------------|
| `page` | number | Page number (1-indexed, default: 1) |
| `size` | number | Page size (default: 20, max: 100) |
| `manufacturer` | string | Filter by manufacturer(s), comma-separated |
| `model` | string | Filter by model(s), comma-separated |
| `modelCombos` | string | Filter by manufacturer:model pairs, comma-separated |
| `bodyClass` | string | Filter by body class(es), comma-separated |
| `yearMin` | number | Minimum year (inclusive) |
| `yearMax` | number | Maximum year (inclusive) |
| `dataSource` | string | Filter by data source |
| `sortBy` | string | Sort field (manufacturer, model, year, bodyClass) |
| `sortOrder` | string | asc or desc (default: asc) |

**Response**:
```json
{
  "total": 4887,
  "page": 1,
  "size": 20,
  "totalPages": 245,
  "data": [
    {
      "vehicleId": "nhtsa-ford-f-150-2021",
      "manufacturer": "Ford",
      "model": "F-150",
      "year": 2021,
      "bodyClass": "Pickup",
      "dataSource": "nhtsa_vpic_large_sample",
      "vinCount": 12
    },
    ...
  ],
  "statistics": {
    "byManufacturer": {
      "Ford": { "total": 665, "highlighted": 0 },
      "Chevrolet": { "total": 849, "highlighted": 0 }
    },
    "byBodyClass": {
      "Sedan": { "total": 2615, "highlighted": 0 },
      "SUV": { "total": 998, "highlighted": 0 }
    },
    "byYear": {
      "2020": { "total": 55, "highlighted": 0 },
      "2021": { "total": 58, "highlighted": 0 }
    }
  }
}
```

**Note**: `vinCount` is aggregated from `autos-vins` index.

---

### 2.2 GET `/vehicles/:vehicleId/vins`

**Purpose**: VIN expansion (lazy-loaded)
**Expected Rows**: **~11 per vehicle** (average)

**Request**:
```
GET /api/v1/vehicles/nhtsa-ford-f-150-2021/vins
GET /api/v1/vehicles/nhtsa-ford-f-150-2021/vins?page=1&size=50
```

**Query Parameters**:
| Param | Type | Description |
|-------|------|-------------|
| `page` | number | Page number (1-indexed, default: 1) |
| `size` | number | Page size (default: 50, max: 100) |
| `sortBy` | string | Sort field (mileage, value, condition) |
| `sortOrder` | string | asc or desc |

**Response**:
```json
{
  "vehicleId": "nhtsa-ford-f-150-2021",
  "total": 12,
  "page": 1,
  "size": 50,
  "data": [
    {
      "vin": "1FTFW1E50MFA12345",
      "mileage": 45000,
      "conditionRating": 4,
      "conditionDescription": "Good",
      "estimatedValue": 28500,
      "registeredState": "CA",
      "exteriorColor": "White",
      "titleStatus": "Clean"
    },
    ...
  ]
}
```

**Elasticsearch Query**:
```json
{
  "index": "autos-vins",
  "size": 50,
  "query": {
    "term": { "vehicle_id": "nhtsa-ford-f-150-2021" }
  },
  "sort": [{ "mileage": "asc" }]
}
```

---

## 3. Highlight Endpoints

### 3.1 GET `/vehicles` with Highlight Parameters

**Purpose**: Statistics with segmented highlighting for charts

**Additional Query Parameters**:
| Param | Type | Description |
|-------|------|-------------|
| `h_manufacturer` | string | Highlight manufacturer(s) |
| `h_modelCombos` | string | Highlight manufacturer:model pairs |
| `h_bodyClass` | string | Highlight body class(es) |
| `h_yearMin` | number | Highlight year range min |
| `h_yearMax` | number | Highlight year range max |

**Example**:
```
GET /api/v1/vehicles?h_manufacturer=Ford,Chevrolet&h_yearMin=2015&h_yearMax=2020
```

**Response** (statistics section):
```json
{
  "statistics": {
    "byManufacturer": {
      "Ford": { "total": 665, "highlighted": 89 },
      "Chevrolet": { "total": 849, "highlighted": 112 },
      "Buick": { "total": 480, "highlighted": 0 }
    },
    "byYear": {
      "2015": { "total": 52, "highlighted": 52 },
      "2016": { "total": 55, "highlighted": 55 },
      "2020": { "total": 58, "highlighted": 0 }
    }
  }
}
```

---

## 4. Health Endpoints

### 4.1 GET `/health`

**Response**:
```json
{
  "status": "ok",
  "timestamp": "2025-11-26T10:30:00Z"
}
```

### 4.2 GET `/ready`

**Response** (checks Elasticsearch connection):
```json
{
  "status": "ready",
  "elasticsearch": "connected",
  "indices": {
    "autos-unified": 4887,
    "autos-vins": 55463
  }
}
```

---

## 5. Expected Row Counts Summary

| Endpoint | Expected Total |
|----------|---------------|
| `/pickers/manufacturers` | **72** |
| `/pickers/manufacturer-models` | **881** |
| `/pickers/body-classes` | **12** |
| `/pickers/year-range` | min=1908, max=2024 |
| `/pickers/data-sources` | **2** |
| `/vehicles` (no filters) | **4,887** |
| `/vehicles/:id/vins` | **~11 per vehicle** |

---

## 6. Differences from Current Backend

| Current Backend | New Backend | Reason |
|-----------------|-------------|--------|
| `/manufacturer-model-combinations` returns nested with `total: 72` | `/pickers/manufacturer-models` returns flat with `total: 881` | Bug #11 fix |
| `/vehicles/details` | `/vehicles` | Simplified path |
| No separate picker endpoints | Dedicated `/pickers/*` namespace | Clear separation |
| `/filters/:fieldName` generic | Explicit `/pickers/body-classes` etc. | Clearer API |

---

## 7. Implementation Order

1. **Health endpoints** - Verify ES connection
2. **Picker endpoints** - Start with `/pickers/manufacturer-models` (Bug #11 fix)
3. **Vehicle details** - Main results table
4. **VIN expansion** - Lazy-loaded detail
5. **Highlight support** - Chart interactions

---

**Document Created**: 2025-11-26
**Next Step**: Phase 4 - Build backend API from scratch
