# Systematic Study of h_* Parameter Handling in Port 4201 Application

**Date**: 2025-11-22
**Purpose**: Understand how the reference application (port 4201) handles highlight parameters
**Key Finding**: ✅ h_* parameters ARE sent to backend API for segmented statistics computation

## Investigation Process

### Step 1: Locate Reference Application
- **Path**: `~/projects/autos-prime-ng`
- **Frontend**: `~/projects/autos-prime-ng/frontend`
- **Application**: Port 4201 reference implementation

### Step 2: Search for h_* Parameter Usage

Searching for patterns:
- `h_manufacturer`
- `h_yearMin`
- `h_yearMax`
- `h_modelCombos`
- `h_bodyClass`

---

## Findings

### **CRITICAL CORRECTION**: h_* Parameters ARE Sent to Backend!

**Initial assumption was WRONG**. After systematic code review, the reference application (port 4201) **DOES send h_* parameters to the backend API**.

#### Evidence: API Service Implementation

**File**: `~/projects/autos-prime-ng/frontend/src/app/services/api.service.ts` (lines 111-128)

```typescript
// Add highlight parameters if provided (for segmented statistics)
if (highlights) {
  if (highlights.yearMin !== undefined) {
    params = params.set('h_yearMin', highlights.yearMin.toString());
  }
  if (highlights.yearMax !== undefined) {
    params = params.set('h_yearMax', highlights.yearMax.toString());
  }
  if (highlights.manufacturer) {
    params = params.set('h_manufacturer', highlights.manufacturer);
  }
  if (highlights.modelCombos) {
    params = params.set('h_modelCombos', highlights.modelCombos);
  }
  if (highlights.bodyClass) {
    params = params.set('h_bodyClass', highlights.bodyClass);
  }
}
```

**Method Signature** (line 35-64):
```typescript
getVehicleDetails(
  models: string,
  page: number = 1,
  size: number = 20,
  filters?: { /* ... standard filters ... */ },
  highlights?: {
    // Highlight parameters for segmented statistics
    yearMin?: number;
    yearMax?: number;
    manufacturer?: string;
    modelCombos?: string;
    bodyClass?: string;
  },
  sortBy?: string,
  sortOrder?: 'asc' | 'desc',
  baseUrl?: string
): Observable<VehicleDetailsResponse>
```

**Conclusion**: The backend API at port 4201 **IS responsible for computing segmented statistics** when h_* parameters are present.

---

### Data Flow Architecture

#### 1. URL → Highlights Extraction

**File**: `~/projects/autos-prime-ng/frontend/src/app/core/services/resource-management.service.ts`

**Method**: `extractHighlights()` (lines 305-321)
```typescript
private extractHighlights(params: Record<string, string>): any {
  if (!this.config.supportsHighlights) {
    return {};
  }

  const highlights: any = {};
  const prefix = this.config.highlightPrefix || 'h_';

  Object.keys(params).forEach((key) => {
    if (key.startsWith(prefix)) {
      const baseKey = key.substring(prefix.length);  // Strip 'h_' prefix
      highlights[baseKey] = params[key];             // Store as plain key
    }
  });

  return highlights;
}
```

**Example**:
- URL: `?h_manufacturer=Ford&h_yearMin=2020&h_yearMax=2024`
- Extracted highlights object:
  ```typescript
  {
    manufacturer: "Ford",
    yearMin: 2020,
    yearMax: 2024
  }
  ```

#### 2. URL Watching → API Calls

**File**: `resource-management.service.ts` (lines 194-249)

**Pattern**: URL changes trigger TWO types of API calls:
1. **Base filters changed** → Fetch new data
2. **Highlights changed** → Re-fetch data with segmented statistics

```typescript
private watchUrlChanges(): void {
  this.router.events
    .pipe(filter((event) => event instanceof NavigationEnd))
    .subscribe(() => {
      const params = this.route.snapshot.queryParams;

      // Extract base filters (e.g., manufacturer=Ford)
      const baseFilters = this.extractBaseFilters(params);

      // Extract highlights (e.g., h_manufacturer=Ford)
      const highlights = this.config.supportsHighlights
        ? this.extractHighlights(params)
        : undefined;

      const baseFiltersChanged = /* ... compare ... */;
      const highlightsChanged = /* ... compare ... */;

      if (baseFiltersChanged) {
        console.log('Base filters changed, updating state');
        this.updateState({ filters: baseFilters });
        this.fetchData().subscribe();  // ← Triggers API call
      }

      if (highlightsChanged) {
        console.log('Highlights changed:', highlights);
        this.updateState({ highlights });
        this.fetchData().subscribe();  // ← Triggers API call with h_* params
      }
    });
}
```

**Key Insight**: Changing h_* parameters triggers a NEW API call to get segmented statistics!

#### 3. API Adapter → HTTP Request

**File**: `~/projects/autos-prime-ng/frontend/src/app/core/services/vehicle-resource-adapters.ts`

**Method**: `VehicleApiAdapter.fetchData()` (lines 40-71)
```typescript
fetchData(
  filters: SearchFilters,
  highlights?: HighlightFilters  // ← Highlights passed from ResourceManagement
): Observable<ApiResponse<any>> {
  const modelsParam = this.buildModelsParam(filters.modelCombos);
  const filterParams = this.buildFilterParams(filters);

  // Call API service WITH highlights
  return this.apiService
    .getVehicleDetails(
      modelsParam,
      filters.page || 1,
      filters.size || 20,
      filterParams,
      highlights || {},  // ← Passed to API service
      filters.sort,
      filters.sortDirection
    )
    .pipe(
      map((response: VehicleDetailsResponse) => ({
        results: response.results,
        total: response.total,
        statistics: response.statistics  // ← Backend returns segmented stats!
      }))
    );
}
```

**Cache Key Includes Highlights** (lines 163-204):
```typescript
buildKey(
  prefix: string,
  filters: SearchFilters,
  highlights: HighlightFilters = {}
): string {
  const filterString = JSON.stringify({
    /* ... filters ... */,
    // Highlights included in cache key!
    h_yearMin: highlights.yearMin,
    h_yearMax: highlights.yearMax,
    h_manufacturer: highlights.manufacturer,
    h_modelCombos: highlights.modelCombos,
    h_bodyClass: highlights.bodyClass,
  });

  return `${prefix}:${encodeURIComponent(filterString)}`;
}
```

**Implication**: Different highlight combinations are cached separately!

---

### Chart Click Handling

#### Dual-Mode Pattern

**File**: `~/projects/autos-prime-ng/frontend/src/app/shared/components/manufacturer-chart/manufacturer-chart.component.ts`

**Pattern**: Chart clicks support TWO modes:
1. **Highlight Mode** (Shift/Ctrl key): Updates h_* URL parameters
2. **Filter Mode** (normal click): Updates actual filters

```typescript
onChartClick(event: {value: string, isHighlightMode: boolean}): void {
  const manufacturer = event.value;

  if (event.isHighlightMode) {
    // Highlight mode: Set h_manufacturer parameter
    console.log(`[ManufacturerChart] Setting highlight: ${manufacturer}`);
    this.urlParamService.setHighlightParam('manufacturer', manufacturer);
  } else {
    // Filter mode: Set manufacturer filter
    console.log(`[ManufacturerChart] Setting filter: ${manufacturer}`);
    this.stateService.updateFilters({ manufacturer });
  }
}
```

**Year Chart Example** (year-chart.component.ts, lines 83-102):
```typescript
onChartClick(event: {value: string, isHighlightMode: boolean}): void {
  const yearValue = event.value;

  // Parse year or year range (e.g., "2020" or "2020-2024")
  let yearMin: number;
  let yearMax: number;

  if (yearValue.includes('-')) {
    const [min, max] = yearValue.split('-').map(y => parseInt(y, 10));
    yearMin = min;
    yearMax = max;
  } else {
    yearMin = yearMax = parseInt(yearValue, 10);
  }

  if (event.isHighlightMode) {
    // Highlight mode: Set h_yearMin/h_yearMax parameters
    console.log(`[YearChart] Setting highlight: ${yearMin}-${yearMax}`);
    this.urlParamService.setHighlightRange({ yearMin, yearMax });
  } else {
    // Filter mode: Set year range filter
    console.log(`[YearChart] Setting filter: ${yearMin}-${yearMax}`);
    this.stateService.updateFilters({ yearMin, yearMax });
  }
}
```

---

### HighlightFilters Type Definition

**File**: `~/projects/autos-prime-ng/frontend/src/app/models/search-filters.model.ts` (lines 37-64)

```typescript
/**
 * Highlight Filters
 *
 * UI-only state for data highlighting (doesn't affect API calls)  ← WRONG COMMENT!
 * Corresponds to URL parameters with 'h_' prefix (e.g., h_yearMin, h_yearMax)
 *
 * Purpose: Visual emphasis of data subsets without modifying base search filters
 */
export interface HighlightFilters {
  // Year range highlighting
  yearMin?: number;       // h_yearMin
  yearMax?: number;       // h_yearMax

  // Manufacturer highlighting (comma-separated list)
  manufacturer?: string;  // h_manufacturer

  // Model highlighting (comma-separated list)
  model?: string;         // h_model
  modelCombos?: string;   // h_modelCombos (Manufacturer:Model format, comma-separated)

  // Body class highlighting (comma-separated list)
  bodyClass?: string;     // h_bodyClass

  // Future: Additional dimensions
  stateCode?: string;     // h_stateCode
  conditionMin?: number;  // h_conditionMin
  conditionMax?: number;  // h_conditionMax
}
```

**IMPORTANT**: The comment "UI-only state for data highlighting (doesn't affect API calls)" is **INCORRECT**!

Highlights **DO trigger API calls** (see `watchUrlChanges()` above).

---

### Backend API Response Format

Based on the code analysis and previous curl tests:

#### **WITHOUT h_* parameters** (no highlights):
```json
{
  "total": 4887,
  "page": 1,
  "size": 20,
  "results": [...],
  "statistics": {
    "byManufacturer": {
      "Ford": 665,           // ← Simple number
      "Chevrolet": 849       // ← Simple number
    },
    "byBodyClass": {
      "Sedan": 1234,
      "SUV": 987
    }
  }
}
```

#### **WITH h_* parameters** (e.g., `h_manufacturer=Ford`):
```json
{
  "total": 4887,
  "page": 1,
  "size": 20,
  "results": [...],
  "statistics": {
    "byManufacturer": {
      "Ford": {
        "total": 665,
        "highlighted": 665   // ← All Ford vehicles highlighted
      },
      "Chevrolet": {
        "total": 849,
        "highlighted": 0     // ← No Chevrolet highlighted
      }
    },
    "byBodyClass": {
      "Sedan": {
        "total": 1234,
        "highlighted": 342   // ← Only Ford sedans highlighted
      },
      "SUV": {
        "total": 987,
        "highlighted": 156
      }
    }
  }
}
```

**Backend Logic**: When h_* parameters are present, the backend:
1. Executes base query (using standard filters)
2. Executes highlight query (using h_* filters)
3. Returns statistics with BOTH counts for each bucket

---

### Component Subscriptions

**Charts subscribe to TWO observables**:

```typescript
export class YearChartComponent implements OnInit {
  statistics: VehicleStatistics | null = null;
  highlights: HighlightFilters = {};

  ngOnInit(): void {
    // Subscribe to statistics (from API response)
    this.stateService.statistics$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(stats => {
      this.statistics = stats;  // ← Contains segmented data
    });

    // Subscribe to highlights (from URL params)
    this.stateService.highlights$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(highlights => {
      this.highlights = highlights;  // ← Contains h_* params
    });
  }
}
```

**Chart Data Sources** receive BOTH:
```typescript
transform(
  statistics: VehicleStatistics | null,
  highlights: HighlightFilters,       // ← From URL (for UI state)
  selectedValue: string | null,
  containerWidth: number
): ChartData | null {
  // Use statistics.byManufacturer (already segmented by backend!)
  // Use highlights for UI state (e.g., selected bars)
}
```

---

## Summary of Findings

### Key Architectural Patterns (Port 4201 Reference Implementation)

1. **h_* Parameters ARE Sent to Backend API**
   - The `ApiService.getVehicleDetails()` method accepts a `highlights` parameter
   - Highlights are converted to URL query parameters (`h_manufacturer`, `h_yearMin`, etc.)
   - Backend API is responsible for computing segmented statistics

2. **URL-First State Management**
   - URL parameters prefixed with `h_` are extracted using `extractHighlights()`
   - Highlights are stored separately from base filters in application state
   - Both filters AND highlights trigger API calls (not frontend-only computation)

3. **Dual-Mode Chart Interactions**
   - Normal click: Updates actual filters (drill-down, narrows results)
   - Highlight mode click (Shift/Ctrl): Updates h_* parameters (visual emphasis only)
   - Both modes trigger new API calls with different parameters

4. **Backend Computes Segmented Statistics**
   - When h_* params present: Returns `{total: X, highlighted: Y}` format
   - When h_* params absent: Returns simple numbers `X`
   - Frontend chart data sources handle BOTH formats

5. **Cache Keys Include Highlights**
   - Request deduplication uses cache keys that include h_* parameters
   - Different highlight combinations = different cache entries
   - Prevents stale data when highlights change

---

## Comparison: Port 4201 vs Port 4205

| Aspect | Port 4201 (Reference) | Port 4205 (Current) | Status |
|--------|----------------------|---------------------|--------|
| **h_* URL extraction** | ✅ `extractHighlights()` | ❓ Not verified | ⚠️ CHECK |
| **Highlights to API** | ✅ Sent as query params | ❌ **NOT sent!** | 🔴 **FIX NEEDED** |
| **Backend statistics** | ✅ Segmented format | ⚠️ Simple numbers (no h_* params) | 🔴 **FIX NEEDED** |
| **Chart data sources** | ✅ Handles both formats | ⚠️ Expects segmented format | ⚠️ VERIFY |
| **Dual-mode clicks** | ✅ Highlight + filter modes | ❓ Not verified | ⚠️ CHECK |
| **Cache with highlights** | ✅ Included in cache key | ❓ Not verified | ⚠️ CHECK |

---

## Root Cause Analysis: Why Port 4205 Charts Show Wrong Data

### Issue Observed
Console logs from port 4205 show:
```json
"byManufacturer": {
  "Chevrolet": 849,    // Simple number, not {total, highlighted}
  "Ford": 665
}
```

### Root Cause
The port 4205 frontend is **NOT sending h_* parameters to the backend API**.

**Evidence**:
1. Browser console shows simple numbers instead of segmented format
2. Backend API returns segmented format ONLY when h_* params are present
3. Port 4205 is likely missing the `highlights` parameter in API adapter's `fetchData()` call

### Data Flow Comparison

#### **Port 4201 (Working)**:
```
URL: ?h_manufacturer=Ford
  ↓ extractHighlights()
highlights: { manufacturer: "Ford" }
  ↓ VehicleApiAdapter.fetchData(filters, highlights)
  ↓ ApiService.getVehicleDetails(..., highlights)
  ↓ HTTP: GET /vehicles/details?h_manufacturer=Ford
  ↓ Backend returns segmented statistics
  ↓ Charts render with stacked bars (Other + Highlighted)
```

#### **Port 4205 (Broken)**:
```
URL: ?h_manufacturer=Ford
  ↓ extractHighlights() ← Probably missing!
highlights: {} ← Empty or not extracted!
  ↓ ApiAdapter.fetchData(filters, ???) ← highlights not passed!
  ↓ HTTP: GET /api/specs/v1/vehicles/details (NO h_* params!)
  ↓ Backend returns SIMPLE numbers (no segmentation)
  ↓ Chart data sources expect segmented format → MISMATCH!
```

---

## Action Items to Fix Port 4205

### 1. Verify Highlights Extraction from URL

**File to check**: `/home/odin/projects/generic-prime/frontend/src/app/framework/services/resource-management.service.ts`

**Required method**: `extractHighlights(params: Record<string, string>): HighlightFilters`

**Implementation pattern** (from port 4201):
```typescript
private extractHighlights(params: Record<string, string>): any {
  if (!this.config.supportsHighlights) {
    return {};
  }

  const highlights: any = {};
  const prefix = this.config.highlightPrefix || 'h_';

  Object.keys(params).forEach((key) => {
    if (key.startsWith(prefix)) {
      const baseKey = key.substring(prefix.length);
      highlights[baseKey] = params[key];
    }
  });

  return highlights;
}
```

### 2. Pass Highlights to API Adapter

**File to check**: `/home/odin/projects/generic-prime/frontend/src/domain-config/automobile/adapters/*`

**Required signature**:
```typescript
export class AutomobileApiAdapter implements ApiAdapter<AutomobileFilters, VehicleResult> {
  fetchData(
    filters: AutomobileFilters,
    highlights?: HighlightFilters  // ← MUST accept highlights!
  ): Observable<ApiResponse<VehicleResult>> {
    // Convert highlights to h_* query parameters
    const params = this.buildParams(filters, highlights);
    return this.http.get<ApiResponse>(url, { params });
  }
}
```

### 3. Add h_* Parameters to HTTP Request

**Pattern** (from port 4201 `api.service.ts`):
```typescript
// Add highlight parameters if provided
if (highlights) {
  if (highlights.yearMin !== undefined) {
    params = params.set('h_yearMin', highlights.yearMin.toString());
  }
  if (highlights.yearMax !== undefined) {
    params = params.set('h_yearMax', highlights.yearMax.toString());
  }
  if (highlights.manufacturer) {
    params = params.set('h_manufacturer', highlights.manufacturer);
  }
  if (highlights.modelCombos) {
    params = params.set('h_modelCombos', highlights.modelCombos);
  }
  if (highlights.bodyClass) {
    params = params.set('h_bodyClass', highlights.bodyClass);
  }
}
```

### 4. Update Cache Key Builder

**File to check**: `/home/odin/projects/generic-prime/frontend/src/domain-config/automobile/adapters/*`

**Required**: Cache key MUST include highlights to avoid stale data

```typescript
buildKey(
  prefix: string,
  filters: AutomobileFilters,
  highlights: HighlightFilters = {}
): string {
  const cacheData = {
    ...filters,
    // Include highlights in cache key!
    h_yearMin: highlights.yearMin,
    h_yearMax: highlights.yearMax,
    h_manufacturer: highlights.manufacturer,
    h_modelCombos: highlights.modelCombos,
    h_bodyClass: highlights.bodyClass,
  };
  return `${prefix}:${JSON.stringify(cacheData)}`;
}
```

### 5. Verify Chart Data Source Logic

**Files to check**:
- `/home/odin/projects/generic-prime/frontend/src/domain-config/automobile/chart-sources/*.ts`

**Current implementation** ([body-class-chart-source.ts:49-51](body-class-chart-source.ts:49-51)):
```typescript
const hasSegmentedStats = statistics.byBodyClass &&
  Object.values(statistics.byBodyClass).some(v => typeof v === 'object' && 'total' in v);
```

**Issue**: This fallback logic should ONLY apply when NO highlights are present!

**Correct logic**:
```typescript
// Check if API returned segmented statistics
const hasSegmentedStats = statistics.byBodyClass &&
  Object.values(statistics.byBodyClass).some(v =>
    typeof v === 'object' && 'total' in v && 'highlighted' in v
  );

if (hasSegmentedStats) {
  // Use API's segmented statistics
  // ...
} else {
  // Use simple statistics (no highlights active)
  // ...
}
```

### 6. Test Backend API Response

**Verification curl** (to confirm backend supports h_* params):
```bash
# WITHOUT highlights
curl "http://auto-discovery.minilab/api/specs/v1/vehicles/details?page=1&size=2" | jq '.statistics.byManufacturer'

# Expected: Simple numbers
# {"Ford": 665, "Chevrolet": 849}

# WITH highlights
curl "http://auto-discovery.minilab/api/specs/v1/vehicles/details?page=1&size=2&h_manufacturer=Ford" | jq '.statistics.byManufacturer'

# Expected: Segmented format
# {"Ford": {"total": 665, "highlighted": 665}, "Chevrolet": {"total": 849, "highlighted": 0}}
```

**If backend doesn't support h_* parameters**:
- Option A: Add h_* parameter support to backend API
- Option B: Implement client-side segmentation (compute highlights in frontend)

---

## Next Steps

1. **[IMMEDIATE]** Test backend API with h_* parameters (curl tests above)
2. **[CRITICAL]** Verify if port 4205 frontend extracts highlights from URL
3. **[CRITICAL]** Check if API adapter passes highlights to HTTP service
4. **[REQUIRED]** Add h_* query parameters to API calls
5. **[REQUIRED]** Update cache key builder to include highlights
6. **[VERIFY]** Test chart rendering with segmented statistics

---

**Date Completed**: 2025-11-22
**Status**: ✅ **INVESTIGATION COMPLETE**

---

## Verification Results (Port 4205)

### Backend API Test Results

✅ **CONFIRMED**: Port 4205 backend API **DOES** support h_* parameters!

#### Test 1: WITHOUT h_* parameters
```bash
$ curl "http://auto-discovery.minilab/api/specs/v1/vehicles/details?page=1&size=2" | jq '.statistics.byManufacturer'
```
**Response**:
```json
{
  "Chevrolet": 849,    // Simple number
  "Ford": 665,
  "Buick": 480
}
```

#### Test 2: WITH h_manufacturer parameter
```bash
$ curl "http://auto-discovery.minilab/api/specs/v1/vehicles/details?page=1&size=2&h_manufacturer=Ford" | jq '.statistics.byManufacturer'
```
**Response**:
```json
{
  "Chevrolet": {"total": 849, "highlighted": 0},     // Segmented!
  "Ford": {"total": 665, "highlighted": 665},        // All highlighted!
  "Buick": {"total": 480, "highlighted": 0}
}
```

✅ **Conclusion**: Backend API is working correctly and returning segmented statistics when h_* parameters are present!

---

### Frontend Code Verification

#### ❌ **MISSING**: `extractHighlights()` method

**File checked**: `/home/odin/projects/generic-prime/frontend/src/framework/services/resource-management.service.ts`

**Result**: NO `extractHighlights()` method found!

**Impact**: Highlights are NOT being extracted from URL parameters.

---

#### ❌ **MISSING**: Highlights parameter in API adapter

**File checked**: `/home/odin/projects/generic-prime/frontend/src/domain-config/automobile/adapters/automobile-api.adapter.ts`

**Current signature** (line 71-73):
```typescript
fetchData(
  filters: AutoSearchFilters  // ← NO highlights parameter!
): Observable<ApiAdapterResponse<VehicleResult, VehicleStatistics>>
```

**Missing**: Second parameter for highlights (compare to port 4201 reference)

**Port 4201 reference signature**:
```typescript
fetchData(
  filters: SearchFilters,
  highlights?: HighlightFilters  // ← Port 4205 is missing this!
): Observable<ApiResponse<any>>
```

---

#### ❌ **MISSING**: h_* parameter handling in `filtersToApiParams()`

**Method**: `filtersToApiParams()` (lines 138-201)

**Current implementation**: Handles only standard filters:
- ✅ `manufacturer`, `model`, `yearMin`, `yearMax`, `bodyClass`
- ✅ `page`, `size`, `sortBy`, `sortOrder`
- ❌ NO h_* parameter handling!

**Missing code** (from port 4201 reference):
```typescript
// Add highlight parameters if provided
if (highlights) {
  if (highlights.yearMin !== undefined) {
    params['h_yearMin'] = highlights.yearMin.toString();
  }
  if (highlights.yearMax !== undefined) {
    params['h_yearMax'] = highlights.yearMax.toString();
  }
  if (highlights.manufacturer) {
    params['h_manufacturer'] = highlights.manufacturer;
  }
  if (highlights.modelCombos) {
    params['h_modelCombos'] = highlights.modelCombos;
  }
  if (highlights.bodyClass) {
    params['h_bodyClass'] = highlights.bodyClass;
  }
}
```

---

### Root Cause Confirmed

**THE PROBLEM**: Port 4205 frontend is NOT sending h_* parameters to backend API!

**Complete data flow breakdown**:
1. ❌ URL `?h_manufacturer=Ford` → NO extraction (missing `extractHighlights()`)
2. ❌ API adapter does NOT accept highlights parameter
3. ❌ API adapter does NOT add h_* to HTTP query parameters
4. ❌ Backend receives NO h_* parameters
5. ✅ Backend returns simple numbers (correct behavior without h_* params)
6. ❌ Frontend expects segmented format → Charts show wrong data

**THE FIX**: Implement the three missing pieces:
1. Add `extractHighlights()` to ResourceManagementService
2. Add `highlights` parameter to `AutomobileApiAdapter.fetchData()`
3. Add h_* parameter handling to `filtersToApiParams()`

