# Chart Highlights Fix - Summary

**Date**: 2025-11-23
**Issue**: Chart highlighting broken on port 4205 (working on port 4201)
**Root Cause**: Architecture violation - `router.navigate()` used directly instead of `UrlStateService`

---

## Problem Analysis

### Symptoms
- Clicking charts on port 4205 did NOT add `h_*` parameters to URL
- Backend never received highlight parameters (`h_manufacturer`, `h_yearMin`, etc.)
- Charts displayed simple data instead of segmented statistics (highlighted vs other)

### Root Cause
`StatisticsPanelComponent.onChartClick()` was calling `router.navigate()` directly:

```typescript
// ❌ WRONG - Architecture violation
this.router.navigate([], {
  relativeTo: this.route,
  queryParams: currentParams,
  queryParamsHandling: 'merge'
});
```

This bypassed the URL-First architecture and prevented:
1. URL parameter updates from triggering state changes
2. ResourceManagementService from extracting h_* parameters
3. API adapter from receiving highlights
4. Backend from returning segmented statistics

---

## Solution

### Fix #1: URL-First Architecture Compliance
Changed `StatisticsPanelComponent.onChartClick()` to use `UrlStateService`:

```typescript
// ✅ CORRECT - URL-First architecture
this.urlState.setParams(newParams);
```

**File Changed**: `/home/odin/projects/generic-prime/frontend/src/framework/components/statistics-panel/statistics-panel.component.ts`

**Lines Modified**: 173-202

**Changes**:
1. Replaced `router.navigate()` with `urlState.setParams()` (line 194)
2. Removed unused `Router` import (line 19)
3. Removed unused `router` constructor parameter (line 87)
4. Added debug logging (line 193)

### Fix #2: Server-Side Segmented Statistics
Chart data sources were doing **client-side highlighting** instead of using the **server-side segmented statistics** from the backend.

**Problem**: Client-side comparison `name === highlights.manufacturer` fails for:
- Comma-separated values (`h_manufacturer=Ford,Buick`)
- Multiple selections
- Year ranges (`h_yearMin`/`h_yearMax`)

**Solution**: Check if backend returned segmented format `{total, highlighted}` and use it directly.

**Files Changed**:
1. `manufacturer-chart-source.ts` - Lines 23-93
2. `body-class-chart-source.ts` - Lines 38-130
3. `year-chart-source.ts` - Lines 22-112
4. `top-models-chart-source.ts` - Already correct (no changes)

**Key Pattern**:
```typescript
// Check if data has server-side segmented format
const isSegmented = entries.length > 0 &&
  typeof entries[0][1] === 'object' &&
  'total' in entries[0][1];

if (isSegmented) {
  // Use backend data directly
  const highlightedCounts = sorted.map(([, stats]) => stats.highlighted || 0);
  const otherCounts = sorted.map(([, stats]) =>
    (stats.total || 0) - (stats.highlighted || 0)
  );
  // Create stacked bars
} else {
  // Simple blue bars for non-highlighted data
}
```

---

## How It Works Now

### Data Flow (Fixed)

```
1. User clicks chart bar (e.g., "Ford")
   ↓
2. StatisticsPanelComponent.onChartClick() fires
   ↓
3. Determines h_* parameter: { h_manufacturer: "Ford" }
   ↓
4. Calls urlState.setParams({ h_manufacturer: "Ford" })
   ↓
5. URL updates: ?h_manufacturer=Ford
   ↓
6. UrlStateService.params$ emits new params
   ↓
7. ResourceManagementService.watchUrlChanges() observes change
   ↓
8. ResourceManagementService.extractHighlights() extracts { manufacturer: "Ford" }
   ↓
9. ResourceManagementService.fetchData() called with highlights
   ↓
10. AutomobileApiAdapter.fetchData(filters, highlights)
    ↓
11. AutomobileApiAdapter.filtersToApiParams() adds h_manufacturer=Ford to query params
    ↓
12. HTTP GET /api/specs/v1/vehicles/details?h_manufacturer=Ford
    ↓
13. Backend receives h_manufacturer parameter
    ↓
14. Backend builds Elasticsearch sub-aggregations for segmented stats
    ↓
15. Backend returns: { "Ford": { total: 665, highlighted: 665 }, "Chevrolet": { total: 849, highlighted: 0 } }
    ↓
16. Frontend receives segmented statistics
    ↓
17. Chart data source transforms to stacked bars (gray "Other" + blue "Highlighted")
    ↓
18. Chart re-renders with highlighting!
```

---

## Architecture Compliance

### Before (Violation)
- ❌ Direct `router.navigate()` call in component
- ❌ Bypassed URL-First architecture
- ❌ State changes not observable by ResourceManagementService

### After (Compliant)
- ✅ Uses `UrlStateService.setParams()`
- ✅ Follows URL-First architecture: URL → State → API → Data → UI
- ✅ All state changes flow through observable streams
- ✅ Matches VERIFICATION-RUBRIC.md requirements

---

## Testing Instructions

### 1. Start Development Server

```bash
# Enter container
podman exec -it generic-prime-dev sh

# Start dev server (inside container)
npm start

# Access: http://auto-discovery.minilab:4205
```

### 2. Test Manufacturer Highlighting

1. Navigate to: `http://auto-discovery.minilab:4205/discover`
2. Wait for charts to load in Statistics panel
3. Click on "Ford" bar in Manufacturer chart
4. **Expected Results**:
   - URL updates to: `?h_manufacturer=Ford`
   - Browser console shows: `[StatisticsPanel] Setting highlight params: { h_manufacturer: "Ford" }`
   - Page reloads with new data
   - Charts show stacked bars:
     - Gray bars for "Other" manufacturers
     - Blue bars for "Ford" (highlighted)
   - All charts highlight Ford data

### 3. Test Year Range Highlighting

1. Click on a year in Year Distribution chart (e.g., "2020")
2. **Expected Results**:
   - URL updates to: `?h_yearMin=2020&h_yearMax=2020`
   - Charts show only 2020 data highlighted

### 4. Test Body Class Highlighting

1. Click on a body class in Body Class chart (e.g., "Sedan")
2. **Expected Results**:
   - URL updates to: `?h_bodyClass=Sedan`
   - Charts show only Sedan vehicles highlighted

### 5. Verify API Calls

Open browser DevTools → Network tab:

1. Filter by XHR
2. Click a chart bar
3. Find request to `/api/specs/v1/vehicles/details`
4. Check query parameters:
   - Should include `h_manufacturer=Ford` (or other h_* params)
5. Check response:
   - `statistics.byManufacturer` should have format:
     ```json
     {
       "Ford": { "total": 665, "highlighted": 665 },
       "Chevrolet": { "total": 849, "highlighted": 0 }
     }
     ```

### 6. Compare with Reference App (Port 4201)

Test the same scenarios on port 4201:

```bash
# Access reference app
http://autos.minilab:4201/discover
```

**Expected**: Both apps should behave identically for chart highlighting.

---

## Key Components Involved

### Framework Services
1. **UrlStateService** (`framework/services/url-state.service.ts`)
   - Manages URL query parameters
   - Provides `setParams()` method for updates
   - Emits `params$` observable for URL changes

2. **ResourceManagementService** (`framework/services/resource-management.service.ts`)
   - Lines 221-237: `extractHighlights()` method
   - Lines 258-272: `watchUrlChanges()` subscription
   - Lines 279-319: `fetchData()` with highlights

3. **AutomobileApiAdapter** (`domain-config/automobile/adapters/automobile-api.adapter.ts`)
   - Lines 72-104: `fetchData()` accepts highlights
   - Lines 141-228: `filtersToApiParams()` adds h_* query params

4. **AutomobileCacheKeyBuilder** (`domain-config/automobile/adapters/automobile-cache-key-builder.ts`)
   - Lines 53-87: `buildKey()` includes highlights in cache key

### Framework Components
1. **StatisticsPanelComponent** (`framework/components/statistics-panel/statistics-panel.component.ts`)
   - Lines 173-202: `onChartClick()` handler (FIXED)
   - Lines 207-216: `getHighlightParamName()` mapping

2. **BaseChartComponent** (`framework/components/base-chart/base-chart.component.ts`)
   - Emits `chartClick` events with `{ value, isHighlightMode }`

### Chart Data Sources
1. **ManufacturerChartDataSource** (`domain-config/automobile/chart-sources/manufacturer-chart-source.ts`)
   - Lines 23-118: `transform()` method (handles segmented vs simple data)
   - Lines 38-75: Stacked bar rendering for highlights

---

## Configuration

### Domain Config
File: `domain-config/automobile/automobile.domain-config.ts`

```typescript
features: {
  highlights: true,  // ✅ ENABLED
  // ...
}
```

### Resource Management Config
Files: `discover.component.ts`, `panel-popout.component.ts`

```typescript
{
  provide: RESOURCE_MANAGEMENT_SERVICE,
  useFactory: (urlState: UrlStateService, domainConfig: DomainConfig<any, any, any>) => {
    return new ResourceManagementService(urlState, {
      filterMapper: domainConfig.urlMapper,
      apiAdapter: domainConfig.apiAdapter,
      cacheKeyBuilder: domainConfig.cacheKeyBuilder,
      defaultFilters: {} as any,
      supportsHighlights: domainConfig.features?.highlights ?? false,  // ✅ TRUE
      highlightPrefix: 'h_'
    });
  },
  deps: [UrlStateService, DOMAIN_CONFIG]
}
```

### Chart Configs
File: `domain-config/automobile/configs/automobile.chart-configs.ts`

Chart IDs must match mapping in `getHighlightParamName()`:

| Chart ID | Highlight Parameter |
|----------|-------------------|
| `manufacturer-distribution` | `h_manufacturer` |
| `top-models` | `h_model` |
| `body-class-distribution` | `h_bodyClass` |
| `year-distribution` | `h_yearMin` + `h_yearMax` |

---

## Known Issues (Unrelated)

These issues existed before the fix and are still present:

1. **Chart Data Shows Zeros** (KNOWN-BUGS.md #1)
   - Statistics transformation may have incorrect field mapping
   - Investigate VehicleStatistics.fromApiResponse() method

---

## Verification Checklist

- [x] Router import removed from StatisticsPanelComponent
- [x] router parameter removed from constructor
- [x] onChartClick() uses urlState.setParams()
- [x] Debug logging added
- [x] TypeScript compiles without errors
- [x] Follows URL-First architecture (VERIFICATION-RUBRIC.md)
- [ ] Manual testing completed (see Testing Instructions above)
- [ ] Highlights work on all 4 charts
- [ ] API receives h_* parameters
- [ ] Backend returns segmented statistics
- [ ] Charts display stacked bars

---

## Related Documentation

- [VERIFICATION-RUBRIC.md](VERIFICATION-RUBRIC.md) - Architecture compliance rules
- [docs/API-ARCHITECTURE-ELASTICSEARCH.md](docs/API-ARCHITECTURE-ELASTICSEARCH.md) - API URL differences
- [docs/BACKEND-COMPARISON-ANALYSIS.md](docs/BACKEND-COMPARISON-ANALYSIS.md) - Backend implementation details
- [TLDR.md](TLDR.md) - Project status
- [CLAUDE.md](CLAUDE.md) - Architecture guide

---

**Status**: ✅ **FIX APPLIED**
**Next Step**: Manual testing required (see Testing Instructions)
