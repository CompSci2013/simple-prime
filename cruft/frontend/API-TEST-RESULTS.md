# Backend API Parameter Testing Results

**Date**: 2025-11-21
**Backend**: `http://auto-discovery.minilab/api/specs/v1`
**Tested By**: Systematic curl testing

---

## Test Results Summary

### ✅ WORKING Parameters (camelCase)

| Parameter | Format | Test Result | Example |
|-----------|--------|-------------|---------|
| `page` | integer | ✅ Works | `page=1` |
| `size` | integer | ✅ Works | `size=20` |
| `sortBy` | string | ✅ Works | `sortBy=year` |
| `sortOrder` | string | ✅ Works | `sortOrder=desc` |
| `manufacturer` | string | ✅ Works | `manufacturer=Ford` |
| `model` | string | ✅ Works | `model=Mustang` |
| `yearMin` | integer | ✅ Works | `yearMin=2020` |
| `yearMax` | integer | ✅ Works | `yearMax=2024` |
| `bodyClass` | string | ✅ Works | `bodyClass=Sedan` |

### ❌ NOT WORKING Parameters (wrong format)

| Parameter | Format | Test Result | Notes |
|-----------|--------|-------------|-------|
| `s` | string | ❌ Ignored | Backend expects `sortBy` |
| `sd` | string | ❌ Ignored | Backend expects `sortOrder` |
| `year_min` | integer | ❌ Ignored | Backend expects `yearMin` (camelCase) |
| `year_max` | integer | ❌ Ignored | Backend expects `yearMax` (camelCase) |
| `body_class` | string | ❌ Ignored | Backend expects `bodyClass` (camelCase) |
| `mfr` | string | ❌ Ignored | Backend expects `manufacturer` |
| `mdl` | string | ❌ Ignored | Backend expects `model` |

---

## Detailed Test Cases

### Test 1: Basic Pagination ✅

**Request**:
```bash
curl "http://auto-discovery.minilab/api/specs/v1/vehicles/details?page=1&size=2"
```

**Response**:
```json
{
  "total": 4887,
  "page": 1,
  "size": 2,
  "query": {
    "modelCombos": [],
    "filters": {},
    "sortBy": null,
    "sortOrder": "asc"
  },
  "result_count": 2
}
```

**Result**: ✅ `page` and `size` parameters work correctly

---

### Test 2: Sorting with sortBy and sortOrder ✅

**Request**:
```bash
curl "http://auto-discovery.minilab/api/specs/v1/vehicles/details?page=1&size=2&sortBy=year&sortOrder=desc"
```

**Response**:
```json
{
  "query": {
    "sortBy": "year",
    "sortOrder": "desc"
  },
  "first_year": 2024,
  "second_year": 2024
}
```

**Result**: ✅ Sorting works, returns newest vehicles first

---

### Test 3: Wrong Parameters (s and sd) ❌

**Request**:
```bash
curl "http://auto-discovery.minilab/api/specs/v1/vehicles/details?page=1&size=2&s=year&sd=desc"
```

**Response**:
```json
{
  "query": {
    "sortBy": null,
    "sortOrder": "asc"
  },
  "first_year": 1970,
  "second_year": 1960
}
```

**Result**: ❌ Parameters `s` and `sd` are **IGNORED**. Backend uses default sort (oldest first).

---

### Test 4: Year Filter with camelCase ✅

**Request**:
```bash
curl "http://auto-discovery.minilab/api/specs/v1/vehicles/details?page=1&size=2&yearMin=2020&yearMax=2024"
```

**Response**:
```json
{
  "total": 290,
  "query": {
    "filters": {
      "yearMin": 2020,
      "yearMax": 2024
    }
  },
  "years": [2024, 2023]
}
```

**Result**: ✅ Year range filter works correctly (290 vehicles from 2020-2024)

---

### Test 5: Year Filter with snake_case ❌

**Request**:
```bash
curl "http://auto-discovery.minilab/api/specs/v1/vehicles/details?page=1&size=2&year_min=2020&year_max=2024"
```

**Response**:
```json
{
  "total": 4887,
  "query": {
    "filters": {}
  },
  "years": [1970, 1960]
}
```

**Result**: ❌ Parameters `year_min` and `year_max` are **IGNORED**. Returns all 4,887 vehicles.

---

### Test 6: Manufacturer Filter ✅

**Request**:
```bash
curl "http://auto-discovery.minilab/api/specs/v1/vehicles/details?page=1&size=2&manufacturer=Ford"
```

**Response**:
```json
{
  "total": 665,
  "query": {
    "filters": {
      "manufacturer": "Ford"
    }
  },
  "manufacturers": ["Ford", "Ford"]
}
```

**Result**: ✅ Returns 665 Ford vehicles

---

### Test 7: Body Class Filter with camelCase ✅

**Request**:
```bash
curl "http://auto-discovery.minilab/api/specs/v1/vehicles/details?page=1&size=2&bodyClass=Sedan"
```

**Response**:
```json
{
  "total": 2615,
  "query": {
    "filters": {
      "bodyClass": "Sedan"
    }
  },
  "body_classes": ["Sedan", "Sedan"]
}
```

**Result**: ✅ Returns 2,615 Sedans

---

### Test 8: Body Class Filter with snake_case ❌

**Request**:
```bash
curl "http://auto-discovery.minilab/api/specs/v1/vehicles/details?page=1&size=2&body_class=Sedan"
```

**Response**:
```json
{
  "total": 4887,
  "query": {
    "filters": {}
  }
}
```

**Result**: ❌ Parameter `body_class` is **IGNORED**. Returns all 4,887 vehicles.

---

### Test 9: Combined Filters and Sorting ✅

**Request**:
```bash
curl "http://auto-discovery.minilab/api/specs/v1/vehicles/details?page=1&size=3&manufacturer=Ford&yearMin=2020&sortBy=year&sortOrder=desc"
```

**Response**:
```json
{
  "total": 35,
  "query": {
    "filters": {
      "manufacturer": "Ford",
      "yearMin": 2020
    },
    "sortBy": "year",
    "sortOrder": "desc"
  },
  "results": [
    {"year": 2024, "manufacturer": "Ford", "model": "Mustang"},
    {"year": 2024, "manufacturer": "Ford", "model": "F-150"},
    {"year": 2024, "manufacturer": "Ford", "model": "Explorer"}
  ]
}
```

**Result**: ✅ All parameters work together correctly

---

## Conclusions

### 1. Parameter Format: **camelCase REQUIRED**

The backend API requires **camelCase** parameter names:
- ✅ `yearMin`, `yearMax`, `bodyClass`, `sortBy`, `sortOrder`
- ❌ NOT `year_min`, `year_max`, `body_class`, `s`, `sd`

### 2. No Abbreviations Accepted

The backend does **NOT** accept abbreviated parameter names:
- ✅ `manufacturer`, `model`, `sortBy`, `sortOrder`
- ❌ NOT `mfr`, `mdl`, `s`, `sd`

### 3. Invalid Parameters are Silently Ignored

When invalid parameters are sent:
- Backend ignores them completely
- No error is returned
- Query proceeds with default values
- This can make debugging difficult!

### 4. Required Parameter Names for Frontend

The frontend URL mapper and API adapter MUST use these exact parameter names:

| Filter Property | URL Parameter | API Parameter |
|-----------------|---------------|---------------|
| `manufacturer` | `manufacturer` | `manufacturer` |
| `model` | `model` | `model` |
| `yearMin` | `yearMin` | `yearMin` |
| `yearMax` | `yearMax` | `yearMax` |
| `bodyClass` | `bodyClass` | `bodyClass` |
| `search` | `search` | `search` |
| `page` | `page` | `page` |
| `size` | `size` | `size` |
| `sort` | `sortBy` | `sortBy` |
| `sortDirection` | `sortOrder` | `sortOrder` |

---

## Code Impact

### Files That Must Use Correct Parameters:

1. **automobile-url-mapper.ts** - Must map to correct URL parameter names
2. **automobile-api.adapter.ts** - Must send correct API parameter names
3. **API-DOCUMENTATION.md** - Must document correct parameter names

### Verification:

All three files have been updated to use the camelCase parameter names verified in these tests.
