# Auto Discovery Backend API Documentation

**Version**: 1.0
**Base URLs**:
- Specs API: `http://auto-discovery.minilab/api/specs/v1`
- VINs API: `http://auto-discovery.minilab/api/vins/v1`

**Last Updated**: 2025-11-21

---

## Table of Contents

1. [Specs API](#specs-api)
   - [GET /vehicles/details](#get-vehiclesdetails)
   - [GET /manufacturer-model-combinations](#get-manufacturer-model-combinations)
   - [GET /filters/:fieldName](#get-filtersfieldname)
2. [VINs API](#vins-api)
   - [GET /vins](#get-vins)
   - [GET /vehicles/:vehicleId/instances](#get-vehiclesvehicleidinstances)

---

## Specs API

### GET /vehicles/details

Returns paginated vehicle specification records with filtering, sorting, and statistics.

**Endpoint**: `http://auto-discovery.minilab/api/specs/v1/vehicles/details`

#### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `page` | integer | No | `1` | Page number (must be >= 1) |
| `size` | integer | No | `20` | Results per page (1-100) |
| `models` | string | No | - | Comma-separated manufacturer:model pairs<br>Example: `Ford:F-150,Chevrolet:Corvette` |
| `manufacturer` | string | No | - | Exact match on manufacturer field (Query Control filter) |
| `model` | string | No | - | Exact match on model field (Query Control filter) |
| `yearMin` | integer | No | - | Minimum year filter (inclusive) |
| `yearMax` | integer | No | - | Maximum year filter (inclusive) |
| `bodyClass` | string | No | - | Exact match on body_class field (Query Control filter) |
| `dataSource` | string | No | - | Exact match on data_source field |
| `manufacturerSearch` | string | No | - | Partial match on manufacturer (table column filter) |
| `modelSearch` | string | No | - | Partial match on model (table column filter) |
| `bodyClassSearch` | string | No | - | Partial match on body_class (table column filter) |
| `dataSourceSearch` | string | No | - | Partial match on data_source (table column filter) |
| `sortBy` | string | No | - | Field to sort by<br>Valid values: `manufacturer`, `model`, `year`, `body_class`, `data_source` |
| `sortOrder` | string | No | `asc` | Sort order<br>Valid values: `asc`, `desc` |
| `h_yearMin` | integer | No | - | Highlight parameter: minimum year for segmented statistics |
| `h_yearMax` | integer | No | - | Highlight parameter: maximum year for segmented statistics |
| `h_manufacturer` | string | No | - | Highlight parameter: manufacturer for segmented statistics |
| `h_modelCombos` | string | No | - | Highlight parameter: model combinations for segmented statistics |
| `h_bodyClass` | string | No | - | Highlight parameter: body class for segmented statistics |

#### Response Format

```json
{
  "total": 4887,
  "page": 1,
  "size": 20,
  "totalPages": 245,
  "query": {
    "modelCombos": [],
    "filters": {
      "manufacturer": "Ford",
      "yearMin": 2020
    },
    "sortBy": "year",
    "sortOrder": "desc"
  },
  "results": [
    {
      "vehicle_id": "nhtsa-ford-mustang-2024",
      "manufacturer": "Ford",
      "model": "Mustang",
      "year": 2024,
      "body_class": "Coupe",
      "data_source": "nhtsa_vpic_large_sample",
      "ingested_at": "2025-10-12T23:22:20.018715",
      "instance_count": 145,
      "first_seen": "2024-01-15",
      "last_seen": "2024-11-20",
      "drive_type": "RWD",
      "engine": "V8 5.0L",
      "transmission": "Automatic",
      "fuel_type": "Gasoline",
      "vehicle_class": "Sports Car"
    }
  ],
  "statistics": {
    "byManufacturer": {
      "Chevrolet": 849,
      "Ford": 665,
      "Buick": 480
    },
    "modelsByManufacturer": {
      "Ford": {
        "Mustang": 62,
        "F-150": 51,
        "Thunderbird": 44
      }
    },
    "byYearRange": {
      "1953": 107,
      "1955": 111,
      "2024": 3
    },
    "byBodyClass": {
      "Sedan": 2615,
      "SUV": 998,
      "Coupe": 494
    },
    "totalCount": 4887
  }
}
```

#### Example Requests

**Basic pagination**:
```bash
GET /vehicles/details?page=1&size=20
```

**Filter by manufacturer and year range**:
```bash
GET /vehicles/details?manufacturer=Ford&yearMin=2020&yearMax=2024&page=1&size=20
```

**Sort by year descending**:
```bash
GET /vehicles/details?sortBy=year&sortOrder=desc&page=1&size=20
```

**Combined filters and sorting**:
```bash
GET /vehicles/details?manufacturer=Ford&yearMin=2020&sortBy=year&sortOrder=desc&page=1&size=10
```

#### Response Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 400 | Bad request (invalid pagination parameters) |
| 500 | Internal server error |

---

### GET /manufacturer-model-combinations

Returns aggregated manufacturer-model data from Elasticsearch.

**Endpoint**: `http://auto-discovery.minilab/api/specs/v1/manufacturer-model-combinations`

#### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `page` | integer | No | `1` | Page number (must be >= 1) |
| `size` | integer | No | `50` | Results per page (1-100) |
| `search` | string | No | - | Search term for manufacturer/model/body_class |
| `manufacturer` | string | No | - | Filter by specific manufacturer |

#### Response Format

```json
{
  "total": 1234,
  "page": 1,
  "size": 50,
  "totalPages": 25,
  "results": [
    {
      "manufacturer": "Ford",
      "model": "Mustang",
      "vehicle_count": 62,
      "body_classes": ["Coupe", "Convertible"],
      "year_range": {
        "min": 1964,
        "max": 2024
      }
    }
  ]
}
```

#### Example Requests

**Get all combinations**:
```bash
GET /manufacturer-model-combinations?page=1&size=50
```

**Search for specific manufacturer**:
```bash
GET /manufacturer-model-combinations?manufacturer=Ford&page=1&size=50
```

**Search with text query**:
```bash
GET /manufacturer-model-combinations?search=Mustang&page=1&size=20
```

---

### GET /filters/:fieldName

Returns distinct values for the specified filter field.

**Endpoint**: `http://auto-discovery.minilab/api/specs/v1/filters/:fieldName`

#### Path Parameters

| Parameter | Required | Description |
|-----------|----------|-------------|
| `fieldName` | Yes | Field name to get distinct values for<br>Valid values: `manufacturers`, `models`, `body-classes`, `data-sources`, `year-range` |

#### Response Format

**For manufacturers**:
```json
{
  "manufacturers": [
    "Chevrolet",
    "Ford",
    "Toyota",
    "Honda"
  ]
}
```

**For models**:
```json
{
  "models": [
    "Mustang",
    "F-150",
    "Camry",
    "Accord"
  ]
}
```

**For body-classes**:
```json
{
  "body_classes": [
    "Sedan",
    "SUV",
    "Coupe",
    "Pickup",
    "Van"
  ]
}
```

**For data-sources**:
```json
{
  "data_sources": [
    "nhtsa_vpic_large_sample",
    "manual_entry",
    "third_party_api"
  ]
}
```

**For year-range**:
```json
{
  "min": 1908,
  "max": 2024
}
```

#### Example Requests

```bash
GET /filters/manufacturers
GET /filters/models
GET /filters/body-classes
GET /filters/data-sources
GET /filters/year-range
```

---

## VINs API

### GET /vins

Returns all VINs with pagination, filtering, and sorting.

**Endpoint**: `http://auto-discovery.minilab/api/vins/v1/vins`

#### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `page` | integer | No | `1` | Page number (must be >= 1) |
| `size` | integer | No | `20` | Results per page (1-100) |
| `manufacturer` | string | No | - | Filter by manufacturer |
| `model` | string | No | - | Filter by model |
| `yearMin` | integer | No | - | Minimum year |
| `yearMax` | integer | No | - | Maximum year |
| `bodyClass` | string | No | - | Filter by body class |
| `mileageMin` | integer | No | - | Minimum mileage |
| `mileageMax` | integer | No | - | Maximum mileage |
| `valueMin` | number | No | - | Minimum estimated value |
| `valueMax` | number | No | - | Maximum estimated value |
| `vin` | string | No | - | Filter by VIN (partial match) |
| `conditionDescription` | string | No | - | Filter by condition description |
| `registeredState` | string | No | - | Filter by registered state |
| `exteriorColor` | string | No | - | Filter by exterior color |
| `sortBy` | string | No | `vin` | Field to sort by |
| `sortOrder` | string | No | `asc` | Sort order (asc/desc) |

#### Response Format

```json
{
  "total": 55463,
  "page": 1,
  "size": 20,
  "totalPages": 2774,
  "results": [
    {
      "vin": "1HGBH41JXMN109186",
      "vehicle_id": "nhtsa-honda-accord-2021",
      "manufacturer": "Honda",
      "model": "Accord",
      "year": 2021,
      "body_class": "Sedan",
      "registration_date": "2021-03-15",
      "registration_state": "CA",
      "odometer_reading": 45123,
      "status": "active",
      "color": "Blue",
      "owner_id": "OWNER_12345",
      "last_updated": "2024-11-20T10:30:00Z"
    }
  ]
}
```

#### Example Requests

```bash
GET /vins?page=1&size=20
GET /vins?manufacturer=Ford&yearMin=2020
GET /vins?mileageMin=0&mileageMax=50000&sortBy=odometer_reading&sortOrder=asc
GET /vins?vin=1HGBH&page=1&size=10
```

---

### GET /vehicles/:vehicleId/instances

Returns VIN instances for a specific vehicle specification.

**Endpoint**: `http://auto-discovery.minilab/api/vins/v1/vehicles/:vehicleId/instances`

#### Path Parameters

| Parameter | Required | Description |
|-----------|----------|-------------|
| `vehicleId` | Yes | Vehicle specification ID<br>Example: `nhtsa-ford-mustang-2024` |

#### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `page` | integer | No | `1` | Page number |
| `pageSize` | integer | No | `20` | Results per page (1-100) |

#### Response Format

```json
{
  "vehicle_id": "nhtsa-ford-mustang-2024",
  "total": 145,
  "page": 1,
  "pageSize": 20,
  "totalPages": 8,
  "instances": [
    {
      "vin": "1FA6P8TH5R5123456",
      "vehicle_id": "nhtsa-ford-mustang-2024",
      "registration_date": "2024-01-15",
      "registration_state": "TX",
      "odometer_reading": 1250,
      "status": "active",
      "color": "Red",
      "owner_id": "OWNER_67890",
      "last_updated": "2024-11-20T15:45:00Z"
    }
  ]
}
```

#### Example Requests

```bash
GET /vehicles/nhtsa-ford-mustang-2024/instances?page=1&pageSize=20
GET /vehicles/nhtsa-chevrolet-corvette-2023/instances?page=2&pageSize=50
```

---

## Parameter Naming Conventions

### Backend API Parameters (As Expected by Server)

The backend API uses **camelCase** for parameter names:

- ✅ `sortBy` (not `sort`)
- ✅ `sortOrder` (not `sort_direction` or `sd`)
- ✅ `yearMin` (not `year_min` or `y_min`)
- ✅ `yearMax` (not `year_max` or `y_max`)
- ✅ `bodyClass` (not `body_class` or `bc`)
- ✅ `manufacturer` (not `mfr`)
- ✅ `model` (not `mdl`)
- ✅ `dataSource` (not `data_source`)
- ✅ `pageSize` (VINs API only)

### Frontend URL Parameters (User-Facing)

The frontend may use **abbreviated** parameter names for cleaner URLs, but must map them to the correct backend parameter names:

**URL → Backend Mapping**:
- `s` → `sortBy`
- `sd` → `sortOrder`
- `p` → `page`
- `sz` → `size` (or `pageSize` for VINs API)
- `mfr` → `manufacturer`
- `mdl` → `model`
- `y_min` → `yearMin`
- `y_max` → `yearMax`
- `bc` → `bodyClass`
- `q` → `search`

---

## Data Schema

### Vehicle Specification Record

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `vehicle_id` | string | Yes | Unique composite ID (format: `{source}-{manufacturer}-{model}-{year}`) |
| `manufacturer` | string | Yes | Vehicle manufacturer name |
| `model` | string | Yes | Vehicle model name |
| `year` | integer | Yes | Model year |
| `body_class` | string | Yes | Body class/type (Sedan, SUV, etc.) |
| `data_source` | string | Yes | Data source identifier |
| `instance_count` | integer | Yes | Count of VIN instances for this specification |
| `ingested_at` | string (ISO 8601) | Yes | Timestamp when record was ingested |
| `first_seen` | string (ISO 8601) | No | First appearance date |
| `last_seen` | string (ISO 8601) | No | Last appearance date |
| `drive_type` | string | No | Drive type (FWD, RWD, AWD, 4WD) |
| `engine` | string | No | Engine description |
| `transmission` | string | No | Transmission type |
| `fuel_type` | string | No | Fuel type |
| `vehicle_class` | string | No | Vehicle class |
| `body_class_match_type` | string | No | How body class was determined |
| `body_class_updated_at` | string (ISO 8601) | No | When body class was last updated |

### VIN Instance Record

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `vin` | string | Yes | 17-character VIN |
| `vehicle_id` | string | Yes | Links to vehicle specification |
| `manufacturer` | string | Yes | Vehicle manufacturer |
| `model` | string | Yes | Vehicle model |
| `year` | integer | Yes | Model year |
| `body_class` | string | Yes | Body class |
| `registration_date` | string (ISO 8601) | No | Registration date |
| `registration_state` | string | No | State of registration |
| `odometer_reading` | integer | No | Odometer reading (miles) |
| `status` | string | No | Vehicle status |
| `color` | string | No | Exterior color |
| `owner_id` | string | No | Owner identifier |
| `last_updated` | string (ISO 8601) | No | Last update timestamp |

---

## Error Responses

All API endpoints return errors in the following format:

```json
{
  "error": "Error type",
  "message": "Detailed error message"
}
```

**Common Error Codes**:

| Code | Error Type | Description |
|------|------------|-------------|
| 400 | Bad Request | Invalid parameters (e.g., invalid pagination values) |
| 404 | Not Found | Resource not found |
| 500 | Internal Server Error | Server-side error |

---

## Data Statistics

**Current Dataset Size** (as of 2025-11-21):
- **Total Vehicle Specifications**: 4,887
- **Total VIN Instances**: 55,463
- **Unique Manufacturers**: 70+
- **Year Range**: 1908 - 2024
- **Data Source**: NHTSA VPIC Large Sample

**Top Manufacturers** (by vehicle count):
1. Chevrolet: 849
2. Ford: 665
3. Buick: 480
4. Chrysler: 415
5. Dodge: 390

**Body Classes**:
- Sedan: 2,615 (54%)
- SUV: 998 (20%)
- Coupe: 494 (10%)
- Pickup: 290 (6%)
- Other: 490 (10%)

---

## Notes

1. **Pagination**: All paginated endpoints use 1-based page indexing
2. **Max Page Size**: 100 items per page across all endpoints
3. **Case Sensitivity**: Text filters are generally case-insensitive
4. **Partial Matching**: `*Search` parameters use partial matching, regular parameters use exact matching
5. **Sorting**: Default sort order is ascending unless specified
6. **Statistics**: Vehicle details endpoint includes aggregated statistics in response
7. **Highlight Parameters**: `h_*` parameters are used for segmented statistics (advanced feature)
