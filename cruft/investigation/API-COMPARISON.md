# API Comparison: Port 4201 vs Port 4205 Applications

## Critical Finding (2025-11-22) - CORRECTED

**Initial Discovery**: The two applications appeared to be calling different backend API services.

**Correction**: Both hostnames resolve to the **SAME backend server** (`192.168.0.110` via alias "loki"). The difference is in the **API path structure**, not different services.

### DNS Resolution

```bash
$ host auto-discovery.minilab
auto-discovery.minilab is an alias for loki.
loki has address 192.168.0.110

$ host autos.minilab
autos.minilab is an alias for loki.
loki has address 192.168.0.110
```

**Conclusion**: Same backend server, different API paths (Kubernetes ingress routing).

### Application Architecture

1. **Port 4201 Application** (Reference Implementation)
   - **Namespace**: `autos`
   - **Backend Service**: `autos-backend` (port 3000)
   - **API Endpoint**: `http://autos.minilab/api/v1/*`
   - **Elasticsearch Index**: `autos-unified` (4,887 vehicle specifications)
   - **Server**: `192.168.0.110`
   - **Architecture**: Monolithic API
   - **Purpose**: Original implementation

2. **Port 4205 Application** (Our Generic Discovery Framework)
   - **Namespace**: `auto-discovery`
   - **Backend Services**:
     - Specs API: `auto-discovery-specs-api` (port 3000)
       - **Elasticsearch Index**: `autos-unified` (same as port 4201!)
       - **Endpoint**: `http://auto-discovery.minilab/api/specs/v1`
     - VINs API: `auto-discovery-vins-api` (port 3001)
       - **Elasticsearch Index**: `autos-vins` (55,463 VIN records)
       - **Endpoint**: `http://auto-discovery.minilab/api/vins/v1`
     - Auth API: `auto-discovery-auth-service` (port 3002)
       - **Endpoint**: `http://auto-discovery.minilab/api/auth/v1`
   - **Server**: `192.168.0.110` (same server as port 4201)
   - **Architecture**: Microservices
   - **Purpose**: Configuration-driven framework with separated endpoints

### Elasticsearch Configuration

**Cluster**: `elasticsearch.data.svc.cluster.local:9200` (shared by both applications)

**Indices**:
- `autos-unified`: 4,887 vehicle specifications
  - Used by: `autos-backend` (port 4201) AND `auto-discovery-specs-api` (port 4205)
- `autos-vins`: 55,463 individual VIN records
  - Used by: `auto-discovery-vins-api` (port 4205)

### Three Endpoints to Compare

1. **Original API** (Port 4201): `http://autos.minilab/api/v1/vehicles/`
2. **Specs API** (Port 4205): `http://auto-discovery.minilab/api/specs/v1/vehicles/details`
3. **VINs API** (Port 4205): `http://auto-discovery.minilab/api/vins/v1/vins`

### Why This Matters

**CRITICAL**: Both applications query the **EXACT SAME Elasticsearch index** (`autos-unified`)!

1. **Same Elasticsearch cluster**: `elasticsearch.data.svc.cluster.local:9200`
2. **Same data source**: Both backends query `autos-unified` index (4,887 documents)
3. **Different API implementations**:
   - Port 4201: Monolithic `autos-backend` service
   - Port 4205: Microservice `auto-discovery-specs-api`
4. **Different namespaces**: Kubernetes separates them into `autos` and `auto-discovery` namespaces
5. **Different ingress routing**: Traefik routes by hostname (`autos.minilab` vs `auto-discovery.minilab`)

**Implications**:
- **Data is identical**: Same Elasticsearch queries should return same data
- **Response format differences**: API implementations may format responses differently
- **Statistics calculation**: Both may compute statistics differently (client-side vs server-side)
- **Highlight support**: Need to verify if both support `h_*` parameters the same way

### Investigation Needed

1. Compare actual API responses from all three endpoints
2. Document format differences, especially for:
   - Statistics structure (segmented format with `{total, highlighted}`)
   - Highlight parameter handling (`h_*` params)
   - Response pagination and metadata
   - Field naming conventions

---

## API Response Comparison

### 1. Original API - Vehicle Endpoint (Port 4201)

**Endpoint**: `GET http://autos.minilab/api/v1/vehicles/`

**Sample Request**:
```bash
curl "http://autos.minilab/api/v1/vehicles/?page=1&size=20&h_manufacturer=Ford"
```

**Status**: ❌ **NOT ACCESSIBLE**

**Error**: `Cannot GET /api/v1/vehicles/` (404 Not Found)

**Note**: The original API endpoint was not accessible during testing. This may be due to:
- Service not running
- Different path structure than expected
- Access restrictions
- Network configuration

**Action Required**: Investigate the actual endpoint used by port 4201 application by inspecting browser network traffic or application source code.

---

### 2. Specs API - Vehicle Details Endpoint (Port 4205)

**Endpoint**: `GET http://auto-discovery.minilab/api/specs/v1/vehicles/details`

**Sample Request**:
```bash
curl "http://auto-discovery.minilab/api/specs/v1/vehicles/details?page=1&size=2&h_manufacturer=Ford"
```

**Status**: ✅ **ACCESSIBLE**

**Response Format**: Server-side paginated with **segmented statistics**

**Top-Level Structure**:
```json
{
  "total": 4887,
  "page": 1,
  "size": 2,
  "totalPages": 2444,
  "query": {
    "modelCombos": [],
    "filters": {},
    "sortBy": null,
    "sortOrder": "asc"
  },
  "results": [ /* array of vehicle specifications */ ],
  "statistics": { /* segmented statistics object */ }
}
```

**Vehicle Specification Fields** (`results` array):
```json
{
  "vehicle_id": "nhtsa-ford-f-150-2020",
  "manufacturer": "Ford",
  "model": "F-150",
  "year": 2020,
  "body_class": "Pickup",
  "data_source": "nhtsa_vpic_large_sample",
  "ingested_at": "2025-10-12T23:22:20.018715",
  "body_class_match_type": "fallback",
  "body_class_updated_at": "2025-11-02T07:32:25.128323",
  "instance_count": 147
}
```

**Statistics Object Structure** (SEGMENTED FORMAT):
```json
{
  "statistics": {
    "byManufacturer": {
      "Ford": {
        "total": 665,
        "highlighted": 665
      },
      "Chevrolet": {
        "total": 849,
        "highlighted": 0
      }
    },
    "modelsByManufacturer": {
      "Ford": {
        "F-150": {
          "total": 147,
          "highlighted": 147
        },
        "Mustang": {
          "total": 89,
          "highlighted": 89
        }
      }
    },
    "byYearRange": {
      "2020": {
        "total": 234,
        "highlighted": 67
      }
    },
    "byBodyClass": {
      "Pickup": {
        "total": 290,
        "highlighted": 89
      }
    }
  }
}
```

**Key Characteristics**:
- ✅ **Segmented statistics**: Each statistic has `{total: number, highlighted: number}` format
- ✅ **Highlight parameter support**: `h_manufacturer=Ford` correctly highlights matching vehicles
- ✅ **Server-side pagination**: Handles large datasets efficiently
- ✅ **Nested model statistics**: `modelsByManufacturer` provides manufacturer → model → stats hierarchy
- ✅ **Query echo**: Returns the parsed query parameters for debugging

**Full response saved**: `/tmp/specs-api-response.json`

---

### 3. VINs API - Vehicle Instances Endpoint (Port 4205)

**Endpoint**: `GET http://auto-discovery.minilab/api/vins/v1/vins`

**Sample Request**:
```bash
curl "http://auto-discovery.minilab/api/vins/v1/vins?page=1&size=3&manufacturer=Ford"
```

**Status**: ✅ **ACCESSIBLE**

**Response Format**: Server-side paginated with **NO statistics** (individual vehicle instances only)

**Top-Level Structure**:
```json
{
  "total": 7830,
  "instances": [ /* array of VIN records */ ],
  "pagination": {
    "page": 1,
    "size": 3,
    "totalPages": 2610,
    "hasMore": true
  }
}
```

**VIN Record Fields** (`instances` array):
```json
{
  "vin": "1FA003XU374R554363",
  "vehicle_id": "synth-ford-f-150-2004",
  "manufacturer": "Ford",
  "model": "F-150",
  "year": 2004,
  "body_class": "Pickup",
  "registered_state": "NV",
  "mileage": 292994,
  "mileage_verified": false,
  "exterior_color": "Gray",
  "condition_description": "Fair",
  "condition_rating": 5,
  "title_status": "Clean",
  "estimated_value": 1808,
  "matching_numbers": false,
  "registration_status": "Current",
  "data_source": "synthetic_historical"
}
```

**Key Characteristics**:
- ❌ **NO statistics object**: VINs API returns individual instances only
- ❌ **NO highlight support**: No `h_*` parameters (uses standard filters like `manufacturer`)
- ✅ **Rich instance data**: Includes condition, mileage, value, registration details
- ✅ **Different pagination format**: Uses nested `pagination` object instead of top-level fields
- ✅ **Server-side pagination**: Efficiently handles 55,463+ VIN records

**Full response saved**: `/tmp/vins-api-response.json`

---

## Data Format Differences

### Statistics Structure

| Endpoint | Statistics Support | Format |
|----------|-------------------|--------|
| **Original API** | ❓ Unknown (not accessible) | N/A |
| **Specs API** | ✅ **YES** - Segmented format | `{total: number, highlighted: number}` |
| **VINs API** | ❌ **NO** | No statistics object |

**Specs API Statistics Example**:
```json
{
  "byManufacturer": {
    "Ford": {"total": 665, "highlighted": 665},
    "Chevrolet": {"total": 849, "highlighted": 0}
  },
  "modelsByManufacturer": {
    "Ford": {
      "F-150": {"total": 147, "highlighted": 147}
    }
  }
}
```

**Critical Insight**: The Specs API returns **segmented statistics** with both `total` and `highlighted` counts. This is the format our chart data sources now expect and handle correctly.

---

### Highlight Parameter Handling

| Endpoint | Highlight Support | Parameters |
|----------|------------------|------------|
| **Original API** | ❓ Unknown | N/A |
| **Specs API** | ✅ **YES** | `h_manufacturer`, `h_modelCombos`, `h_yearMin`, `h_yearMax`, `h_bodyClass` |
| **VINs API** | ❌ **NO** | Standard filters only (`manufacturer`, `model`, `year`, etc.) |

**How Highlight Parameters Work (Specs API)**:
1. User clicks on a chart bar (e.g., "Ford")
2. Chart emits click event with value
3. URL updated with highlight parameter: `h_manufacturer=Ford`
4. API returns segmented statistics with `highlighted` counts
5. Charts render stacked bars (gray "Other" + blue "Highlighted")

**Example URL**: `http://localhost:4205/discover?h_manufacturer=Ford`

**Example API Response**:
```json
{
  "statistics": {
    "byManufacturer": {
      "Ford": {"total": 665, "highlighted": 665},    // All Ford vehicles highlighted
      "Chevrolet": {"total": 849, "highlighted": 0}  // No Chevrolet highlighted
    }
  }
}
```

---

### Pagination Format

| Endpoint | Format | Fields |
|----------|--------|--------|
| **Original API** | ❓ Unknown | N/A |
| **Specs API** | Top-level pagination | `total`, `page`, `size`, `totalPages` |
| **VINs API** | Nested pagination | `total`, `pagination: {page, size, totalPages, hasMore}` |

**Specs API Pagination**:
```json
{
  "total": 4887,
  "page": 1,
  "size": 20,
  "totalPages": 245,
  "results": [...]
}
```

**VINs API Pagination**:
```json
{
  "total": 7830,
  "instances": [...],
  "pagination": {
    "page": 1,
    "size": 20,
    "totalPages": 392,
    "hasMore": true
  }
}
```

---

### Field Naming Conventions

#### Specs API (Vehicle Specifications)
- **Primary key**: `vehicle_id` (e.g., `"nhtsa-ford-f-150-2020"`)
- **Results array**: `results`
- **Count field**: `instance_count` (number of VINs for this specification)
- **Data fields**: `manufacturer`, `model`, `year`, `body_class`, `data_source`
- **Metadata**: `ingested_at`, `body_class_match_type`, `body_class_updated_at`

#### VINs API (Vehicle Instances)
- **Primary key**: `vin` (e.g., `"1FA003XU374R554363"`)
- **Results array**: `instances`
- **Foreign key**: `vehicle_id` (links to Specs API)
- **Data fields**: `manufacturer`, `model`, `year`, `body_class` (denormalized)
- **Additional fields**: `registered_state`, `mileage`, `condition_rating`, `estimated_value`, `exterior_color`, `title_status`, etc.

---

### Key Takeaways

1. **Different Purposes**:
   - **Specs API**: Vehicle specifications with aggregated statistics (what exists)
   - **VINs API**: Individual vehicle instances with detailed metadata (specific vehicles)

2. **Statistics & Highlighting**:
   - Only Specs API supports statistics and highlighting
   - VINs API is for detailed instance-level queries

3. **Data Relationship**:
   - One vehicle specification (`vehicle_id`) → Many VIN instances
   - Specs API shows `instance_count` per specification
   - VINs API provides the actual individual instances

4. **Frontend Usage**:
   - **Charts & Statistics Panel**: Use Specs API with `h_*` parameters
   - **VIN Details / Instance Browser**: Use VINs API for individual records
   - **Configuration-Driven**: Both APIs designed to support generic framework

5. **Original API Comparison**:
   - ❓ Cannot compare without access to port 4201 backend
   - Investigation needed to identify actual endpoint and format
   - **IMPORTANT**: Both apps use same backend server (`192.168.0.110`)
   - Difference is in API path structure, not backend service

---

**Date Created**: 2025-11-22
**Last Updated**: 2025-11-22
**Status**: ✅ **DOCUMENTED** - Elasticsearch indices verified, API endpoints compared

---

## Summary of Findings

### ✅ Confirmed: Same Data Source

Both applications query the **EXACT SAME Elasticsearch index**:

| Application | Namespace | Backend Service | Elasticsearch Index | Documents |
|-------------|-----------|----------------|---------------------|-----------|
| **Port 4201** | `autos` | `autos-backend` | `autos-unified` | 4,887 |
| **Port 4205** | `auto-discovery` | `auto-discovery-specs-api` | `autos-unified` | 4,887 |

**Elasticsearch Cluster**: `elasticsearch.data.svc.cluster.local:9200`

### Key Differences

1. **Architecture**:
   - Port 4201: Monolithic API (`autos-backend`)
   - Port 4205: Microservices (`specs-api` + `vins-api` + `auth-service`)

2. **Ingress Routing**:
   - Port 4201: `autos.minilab` → `autos-backend.autos.svc:3000`
   - Port 4205: `auto-discovery.minilab` → `auto-discovery-specs-api.auto-discovery.svc:3000`

3. **API Response Format**:
   - Port 4201: Unknown (endpoint not accessible via curl)
   - Port 4205: Documented below (segmented statistics with `{total, highlighted}`)

**CORRECTION**: Both hostnames (`autos.minilab` and `auto-discovery.minilab`) resolve to the **SAME backend server** at IP `192.168.0.110`. The difference is in Kubernetes namespaces and API path routing, not different backend servers or data sources.
