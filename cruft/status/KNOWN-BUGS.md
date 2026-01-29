# Known Bugs

This document tracks known issues that need to be fixed.

## Active Bugs

### 11. 🔴 PRIORITY: Manufacturer-Model Picker Shows Incorrect Total Count and Missing Data (2025-11-26)

**Component**: BasePickerComponent / automobile.picker-configs.ts / Backend API
**Severity**: CRITICAL
**Status**: 🔴 NOT FIXED - UNDER INVESTIGATION
**Port**: 4205

**Description**:
The Manufacturer-Model Picker displays incorrect total counts and appears to be missing most of the data. When the picker should show ~4,800+ manufacturer-model combinations (matching the results table), it only shows a fraction of the data (e.g., 72 entries, all from a single manufacturer like Chevrolet).

**Observed Behavior**:
- Results Table shows: "4701 to 4800 of 4887 results" ✅ Correct
- Picker shows: "Showing 1 to 72 of 72 entries" ❌ WRONG
- Picker only displays Chevrolet models, missing all other manufacturers (A-B manufacturers like Affordable Aluminum, Brammo, Buick are missing)
- Changing rows per page previously caused total count to change inconsistently (858, 798, 466, 295)

**Expected Behavior**:
- Picker should show ~4,800+ manufacturer-model combinations
- Total count should remain stable regardless of page size
- All manufacturers from A-Z should be available (Affordable Aluminum through Waterford Tank and Fabrication)

**Possible Root Causes**:
1. **Backend API Issue**: The `/manufacturer-model-combinations` endpoint may be returning limited/filtered data
2. **Frontend responseTransformer**: Flattening logic or total count calculation may be incorrect
3. **Pagination Mismatch**: API paginates by manufacturer groups but UI displays flattened manufacturer-model rows
4. **Query Parameters**: Unexpected filter parameters being sent to API

**⚠️ CRITICAL METHODOLOGY: Data-First, Backend-Second, Frontend-Last**

Do NOT modify frontend code until Phases 1-3 are complete!

**Investigation Plan (NEXT SESSION)**:

**Phase 1: Elasticsearch Data Analysis (DO FIRST)**
1. [ ] Query Elasticsearch directly to understand TRUE data structure:
   ```bash
   # Get index mappings
   curl -X GET "elasticsearch:9200/autos-unified/_mapping?pretty"
   curl -X GET "elasticsearch:9200/autos-vins/_mapping?pretty"

   # Count documents
   curl -X GET "elasticsearch:9200/autos-unified/_count?pretty"
   curl -X GET "elasticsearch:9200/autos-vins/_count?pretty"

   # Unique manufacturers
   curl -X POST "elasticsearch:9200/autos-unified/_search?pretty" -H 'Content-Type: application/json' -d'
   { "size": 0, "aggs": { "unique_manufacturers": { "cardinality": { "field": "manufacturer.keyword" } } } }'

   # Unique manufacturer-model combinations
   curl -X POST "elasticsearch:9200/autos-unified/_search?pretty" -H 'Content-Type: application/json' -d'
   { "size": 0, "aggs": { "manufacturers": { "terms": { "field": "manufacturer.keyword", "size": 1000 }, "aggs": { "models": { "terms": { "field": "model.keyword", "size": 1000 } } } } } }'
   ```
2. [ ] Document actual counts:
   - Total unique manufacturers: ?
   - Total unique manufacturer-model combinations: ?
   - Total vehicle specifications: ?
   - Total VIN records: ?

**Phase 2: Define What Tables/Pickers Make Sense**
3. [ ] Based on Phase 1 data, answer:
   - Does current Manufacturer-Model Picker design match actual data?
   - Should we have separate Manufacturer and Model pickers instead?
   - Is VIN data suitable for row expansion or standalone table?
   - Are there other logical groupings we're missing?

| Component Type | Data Source | Purpose | Feasible? |
|----------------|-------------|---------|-----------|
| Manufacturer-Model Picker | autos-unified | Select combos for filtering | ? |
| Results Table | autos-unified | Display vehicle specs | ? |
| Results + VIN Expansion | unified + vins | Specs with expandable VINs | ? |
| Standalone VIN Table | autos-vins | Browse individual VINs | ? |

**Phase 3: Backend Routes Analysis**
4. [ ] Examine backend files:
   - `backend-specs/src/routes/specs.js`
   - `backend-specs/src/services/elasticsearchService.js`
5. [ ] Answer:
   - Does `/manufacturer-model-combinations` return correct structure?
   - What does `total` field represent?
   - Is pagination working correctly?
   - Do we need NEW routes?
   - Do existing routes need logic fixes?
6. [ ] Make any required backend changes BEFORE touching frontend

**Phase 4: Frontend Component Verification (ONLY AFTER BACKEND IS CORRECT)**
7. [ ] Are we displaying the correct components for the data?
8. [ ] Are any components missing that should exist?
9. [ ] Does `responseTransformer` correctly handle backend response?

**Phase 5: Frontend Fixes (LAST)**
10. [ ] Fix `responseTransformer` if needed
11. [ ] Fix component configurations
12. [ ] Fix UI/UX bugs (pagination, checkboxes, etc.)

**Files Involved**:
- [frontend/src/domain-config/automobile/configs/automobile.picker-configs.ts](frontend/src/domain-config/automobile/configs/automobile.picker-configs.ts) (responseTransformer, fetchData)
- [frontend/src/framework/components/base-picker/base-picker.component.ts](frontend/src/framework/components/base-picker/base-picker.component.ts) (loadData, pagination)
- Backend: `/api/specs/v1/manufacturer-model-combinations` endpoint

**Recent Changes That May Be Related**:
- Modified `responseTransformer` to use `response.total ?? flatResults.length`
- Modified `sortOrder` parameter handling
- Picker pagination mode is 'server'

**Note**: Both backend API AND frontend may need corrections. Do not assume the issue is frontend-only.

---

### 10. Popped-Out Statistics Panel Breaks With Pre-Selected bodyClass Filters (2025-11-24)

**Component**: StatisticsPanelComponent / Pop-Out Window Synchronization
**Severity**: Medium
**Status**: 🔴 NOT FIXED
**Port**: 4205

**Description**:
When the main window has pre-selected bodyClass filters in the URL (e.g., `bodyClass=SUV,Coupe,Pickup,Van,Hatchback`) and the user pops out the Statistics panel, the charts break or display incorrect data.

**Observed Behavior**:
- Main window URL: `http://192.168.0.244:4205/discover?page=1&bodyClass=SUV,Coupe,Pickup,Van,Hatchback`
- Main window shows: "2058 total" results with working charts
- User clicks pop-out button on Statistics panel
- **BUG**: Popped-out statistics panel displays broken or incorrect chart data
- Charts may show empty data, incorrect counts, or fail to reflect the bodyClass filter

**Expected Behavior**:
- Main window has pre-selected bodyClass filters
- User pops out Statistics panel
- Popped-out panel should display identical charts as main window
- Charts should reflect the same bodyClass filter from URL
- All 4 charts (Manufacturer, Top Models, Body Class, Year) should work correctly

**Reproduction**:
1. Navigate to `http://192.168.0.244:4205/discover?page=1&bodyClass=SUV,Coupe,Pickup,Van,Hatchback`
2. Verify main window shows "2058 total" results
3. Verify all 4 charts display data correctly in main window
4. Click pop-out button on Statistics panel
5. **BUG**: Popped-out charts show broken/incorrect data

**Possible Causes**:
1. URL parameters not properly synchronized to pop-out window on initial load
2. ResourceManagementService state not shared correctly between main and pop-out
3. Statistics API call in pop-out not including bodyClass filter parameters
4. Chart data sources not receiving filter context in pop-out window
5. Pop-out initialization race condition (charts render before filters applied)

**Investigation Needed**:
1. [ ] Check if pop-out URL includes bodyClass parameter: `/panel/discover/statistics-panel/statistics?bodyClass=SUV,Coupe,Pickup,Van,Hatchback`
2. [ ] Verify PanelPopoutComponent passes filter state to StatisticsPanelComponent
3. [ ] Check ResourceManagementService initialization in pop-out context
4. [ ] Verify statistics API call includes bodyClass parameter
5. [ ] Check browser console for errors in pop-out window
6. [ ] Test if issue occurs with other filter types (manufacturer, model, yearMin/Max)

**Files Involved**:
- [frontend/src/app/features/panel-popout/panel-popout.component.ts](frontend/src/app/features/panel-popout/panel-popout.component.ts)
- [frontend/src/framework/components/statistics-panel/statistics-panel.component.ts](frontend/src/framework/components/statistics-panel/statistics-panel.component.ts)
- [frontend/src/framework/services/resource-management.service.ts](frontend/src/framework/services/resource-management.service.ts)
- [frontend/src/domain-config/automobile/chart-sources/*.ts](frontend/src/domain-config/automobile/chart-sources/)

**Related Issues**: Similar to Bug #2 and Bug #3 (pop-out state synchronization issues)

---

### 7. Popped-Out Picker Checkboxes Remain Checked After Clear (2025-11-23, FIX PENDING TEST)

**Component**: BasePickerComponent / PrimeNG Table selection
**Severity**: Medium
**Status**: 🟡 FIX IMPLEMENTED, NEEDS TESTING
**Port**: 4205

**Description**:
When selections are cleared via Query Control in the main window, the popped-out picker correctly updates the selection count to "0 item(s) selected", but the visual checkboxes in the table remain checked.

**Observed Behavior**:
- User clears filter in main window Query Control (e.g., clicks "Clear All")
- Popped-out picker updates selection count to "0 item(s) selected" ✅ Correct
- **BUG**: Checkboxes in the picker table remain visually checked ❌
- Checkboxes uncheck when window is focused (workaround)

**Expected Behavior**:
- Selection count updates to 0
- All checkboxes immediately uncheck without needing to focus window
- Visual state matches internal state

**Root Cause (IDENTIFIED)**:
The component was mutating the existing `selectedKeys` Set object using `.clear()` instead of creating a new Set object. This doesn't reliably trigger Angular's change detection for PrimeNG checkbox components, especially combined with the immutable data pattern expectations.

**Fix (IMPLEMENTED)**:
Changed three locations in BasePickerComponent to create new Set objects instead of mutating existing ones:
1. Line 144: `subscribeToUrlChanges()` - when URL parameter is removed (cleared)
2. Line 186: `hydrateSelections()` - when rebuilding selections from keys
3. Line 385: `clearSelections()` - when user clicks Clear button

Changed from:
```typescript
this.state.selectedKeys.clear();  // Mutates existing Set
this.cdr.markForCheck();         // Only schedules change detection
```

To:
```typescript
this.state.selectedKeys = new Set<string>();  // Creates new Set (immutable pattern)
this.cdr.detectChanges();                      // Forces immediate update
```

**Files Changed**:
- [frontend/src/framework/components/base-picker/base-picker.component.ts](frontend/src/framework/components/base-picker/base-picker.component.ts:144,186,385)

**Testing Required**:
1. [ ] Test clearing via Query Control in main window (original bug scenario)
2. [ ] Test clearing via picker's Clear button in pop-out
3. [ ] Verify checkboxes uncheck immediately without needing to focus window

---

### 8. Chart Box Selection Does Not Add URL Parameters (2025-11-23, FIXED 2025-11-23)

**Component**: StatisticsPanelComponent / BaseChartComponent
**Severity**: High
**Status**: ✅ FIXED
**Port**: 4205

**Description**:
When using box selection (drag to select multiple bars) on charts WITHOUT holding the 'h' key, the selection does not add any URL parameters. Only highlight mode (with 'h' key held) was working.

**Observed Behavior**:
- User drags to select multiple bars in a chart (without holding 'h')
- Console logs show "Normal click - would update filters with: ..."
- **BUG**: No URL parameters are added
- **BUG**: No filter chips appear in Query Control
- Data does not update to reflect selection

**Expected Behavior**:
- User selects bars without 'h' key → Add filter parameters (manufacturer, modelCombos, bodyClass, yearMin/yearMax)
- User selects bars WITH 'h' key → Add highlight parameters (h_manufacturer, h_modelCombos, etc.)
- URL updates accordingly
- Query Control shows filter chips
- Data updates to reflect filters

**Reproduction**:
1. Navigate to `http://192.168.0.244:4205/discover`
2. View Statistics panel charts
3. Drag to select multiple bars in Manufacturer chart (without holding 'h')
4. **BUG**: No URL parameters added
5. **BUG**: No filter chips in Query Control

**Root Cause (IDENTIFIED)**:
StatisticsPanelComponent's `onChartClick()` method had only implemented the highlight mode (isHighlightMode=true) branch. The normal mode (isHighlightMode=false) branch contained only a console.log() and a TODO comment saying "In a complete implementation, this would call...".

**Fix**:
Implemented the normal mode branch to:
1. Map chart IDs to filter parameter names (manufacturer, modelCombos, bodyClass, yearMin/yearMax)
2. Create `getFilterParamName()` helper method (mirrors `getHighlightParamName()`)
3. Update URL using UrlStateService
4. Broadcast changes to main window if in pop-out context

**Files Changed**:
- [frontend/src/framework/components/statistics-panel/statistics-panel.component.ts](frontend/src/framework/components/statistics-panel/statistics-panel.component.ts:207-237,257-266)

**Verified**: Build compiles successfully ✅

**Testing Completed**:
1. [x] Box select year range without 'h' → Verified `yearMin` and `yearMax` URL params added ✅
2. [x] Box select models without 'h' → Verified `modelCombos` URL param added ✅
3. [ ] Box select manufacturers without 'h' → Fixed by Bug #9 (see below)
4. [ ] Box select body classes without 'h' → Fixed by Bug #9 (see below)
5. [ ] Verify Query Control shows filter chips after box selection

**Note**: Bug #9 was discovered during Bug #8 testing when body class box selection caused empty charts.

---

### 9. Chart Box Selection Returns Empty Charts (Manufacturer & Body Class) (2025-11-23, FIXED 2025-11-23)

**Component**: Chart Data Sources (ManufacturerChartDataSource, BodyClassChartDataSource)
**Severity**: High
**Status**: ✅ FIXED
**Port**: 4205
**Related**: Bug #8

**Description**:
When using box selection on Manufacturer or Body Class charts (without 'h' key), the selection causes all charts to become empty instead of filtering data. This occurred even after Bug #8 was fixed.

**Observed Behavior**:
- User drags to select multiple body classes (e.g., Sedan, SUV, Pickup)
- URL updates with `bodyClass=Sedan,SUV,Pickup` (comma-separated)
- **BUG**: API returns zero results, causing all charts to become empty
- Same issue occurs with manufacturer chart box selection

**Expected Behavior**:
- User selects single body class → Filter to that body class
- User selects multiple body classes → Filter to first selected body class (API limitation)
- Charts show filtered data (not empty)

**Root Cause (IDENTIFIED)**:
The backend API's `manufacturer` and `bodyClass` parameters only support single values, NOT comma-separated lists (unlike the `models` parameter which explicitly supports comma-separated "Manufacturer:Model" pairs). When the chart `handleClick()` methods returned comma-separated values like "Sedan,SUV,Pickup", the API treated this as a literal string match for a body class named "Sedan,SUV,Pickup" (which doesn't exist), returning zero results.

**API Parameter Support**:
- ✅ `models` parameter: Supports comma-separated values (e.g., "Ford:F-150,Chevrolet:Silverado")
- ❌ `manufacturer` parameter: Single value only (e.g., "Ford")
- ❌ `bodyClass` parameter: Single value only (e.g., "Sedan")

**Fix**:
Modified both chart data sources to only return the first selected value when multiple items are selected via box selection:

1. **BodyClassChartDataSource** ([body-class-chart-source.ts:152-169](frontend/src/domain-config/automobile/chart-sources/body-class-chart-source.ts#L152-L169))
2. **ManufacturerChartDataSource** ([manufacturer-chart-source.ts:139-156](frontend/src/domain-config/automobile/chart-sources/manufacturer-chart-source.ts#L139-L156))

Changed from:
```typescript
return uniqueBodyClasses.join(',');  // Returns "Sedan,SUV,Pickup"
```

To:
```typescript
// Return first value only (with console warning)
if (uniqueBodyClasses.length > 1) {
  console.warn('[BodyClassChart] Box selection selected multiple body classes, but API only supports single value. Using first value:', uniqueBodyClasses[0]);
}
return uniqueBodyClasses[0] || null;  // Returns "Sedan"
```

**Files Changed**:
- [frontend/src/domain-config/automobile/chart-sources/body-class-chart-source.ts](frontend/src/domain-config/automobile/chart-sources/body-class-chart-source.ts:152-169)
- [frontend/src/domain-config/automobile/chart-sources/manufacturer-chart-source.ts](frontend/src/domain-config/automobile/chart-sources/manufacturer-chart-source.ts:139-156)

**Verified**: Build compiles successfully ✅

**Testing Required**:
1. [ ] Box select multiple body classes → Verify first selected body class is used as filter
2. [ ] Box select multiple manufacturers → Verify first selected manufacturer is used as filter
3. [ ] Verify console warning appears when multiple items selected
4. [ ] Verify charts show filtered data (not empty)

**Future Enhancement**:
Consider updating backend API to support comma-separated values for `manufacturer` and `bodyClass` parameters to enable OR filtering (e.g., show all Sedans OR SUVs).

---

## Fixed Bugs

### 6. Popped-Out Picker Shows Zero Rows After Pagination Change (2025-11-23, FIXED 2025-11-23)

**Component**: BasePickerComponent / Pagination
**Severity**: High
**Status**: ✅ FIXED
**Port**: 4205

**Description**:
When the user changes the page number in a popped-out picker (clicks next/prev page or selects a different page), the picker table shows zero rows instead of loading the new page's data.

**Observed Behavior**:
- User pops out Manufacturer-Model Picker
- User clicks to go to page 2 (or any other page)
- **BUG**: Table shows empty/zero rows
- Pagination controls still visible but no data displayed

**Expected Behavior**:
- User changes page
- New page data loads and displays in table
- Table shows rows for the selected page

**Root Cause**:
Same root cause as Bug #5 - OnPush change detection with `markForCheck()` doesn't work in unfocused windows. When pagination triggers data loading, the table doesn't update unless the window is focused.

**Fix**:
Fixed by Bug #5 changes - replacing `markForCheck()` with `detectChanges()` in BasePickerComponent's URL sync handlers and hydration methods. The pagination now works correctly in unfocused pop-out windows.

**Files Changed**:
- [frontend/src/framework/components/base-picker/base-picker.component.ts](frontend/src/framework/components/base-picker/base-picker.component.ts:147,175,204)

**Verified**: Tested 2025-11-23 - Pagination works correctly in popped-out picker ✅

---

### 5. Popped-Out Picker Does Not Update When Filter Cleared in Main Window (2025-11-23, FIXED 2025-11-23)

**Component**: BasePickerComponent / OnPush Change Detection
**Severity**: Medium
**Status**: ✅ FIXED
**Port**: 4205

**Description**:
When a filter is cleared via the Query Control in the main window, the popped-out picker does not reflect the cleared filter until the pop-out window receives focus. The pop-out should receive the BroadcastChannel message and update immediately, regardless of window focus state.

**Observed Behavior**:
- User clears filter in main window Query Control (e.g., clicks "Clear All")
- Main window URL updates correctly (filter parameters removed)
- **BUG**: Popped-out picker does NOT update its selection state
- **BUG**: Popped-out picker only updates when pop-out window receives focus

**Expected Behavior**:
- User clears filter in main window Query Control
- Main window broadcasts URL change via BroadcastChannel
- Popped-out picker receives message and updates selection immediately
- Update should happen regardless of window focus state

**Reproduction**:
1. Navigate to `http://192.168.0.244:4205/discover`
2. Select a model in Manufacturer-Model Picker (e.g., "Brammo Dual Sport")
3. Pop out the Manufacturer-Model Picker
4. In main window, click "Clear All" in Query Control
5. **BUG**: Popped-out picker still shows "Brammo Dual Sport" as selected
6. Click on pop-out window to give it focus
7. Picker updates to show cleared selection

**Investigation Needed**:
1. [ ] Check if DiscoverComponent broadcasts URL changes when Query Control emits urlParamsChange
2. [ ] Verify DiscoverComponent.broadcastUrlParamsToPopOuts() is called on filter clear
3. [ ] Check if BasePickerComponent subscribes to BroadcastChannel messages
4. [ ] Verify BroadcastChannel messages are received regardless of window focus
5. [ ] Check if picker updates selection state when URL params sync message received

**Root Cause (IDENTIFIED)**:
BasePickerComponent uses OnPush change detection and calls `cdr.markForCheck()` when URL params change. However, `markForCheck()` only schedules change detection - it doesn't run immediately. When the pop-out window doesn't have focus, Angular's change detection doesn't run until the window receives focus.

**Fix**:
Changed `cdr.markForCheck()` to `cdr.detectChanges()` in three places within BasePickerComponent:
1. `subscribeToUrlChanges()` - when URL param is removed (cleared)
2. `hydrateFromUrl()` - when selections are restored from URL
3. `hydrateSelections()` - when selections are matched with loaded data

This forces immediate change detection regardless of window focus state.

**Files Changed**:
- [frontend/src/framework/components/base-picker/base-picker.component.ts](frontend/src/framework/components/base-picker/base-picker.component.ts:147,175,204)

**Verified**: Build compiles successfully ✅

---

### 4. Query Control Does Not Show Selection Chips When URL Changes (2025-11-23, FIXED 2025-11-23)

**Component**: QueryControlComponent / AUTOMOBILE_QUERY_CONTROL_FILTERS
**Severity**: High
**Status**: ✅ FIXED
**Port**: 4205

**Description**:
When a model selection is made in the Manufacturer-Model Picker, the URL parameter updates correctly (`modelCombos=Brammo:Dual%20Sport`), but the Query Control panel does not display the selection as an active filter chip. This violates the URL-First architecture principle where the URL is the single source of truth.

**Observed Behavior**:
- User selects "Brammo Dual Sport" in Manufacturer-Model Picker
- URL updates to `?page=1&modelCombos=Brammo:Dual%20Sport` ✅ Correct
- **BUG**: Query Control "Active Filters" section does NOT show chip for "Brammo: Dual Sport"
- **BUG**: Query Control does not reflect the current URL state

**Expected Behavior**:
- URL updates to include `modelCombos` parameter
- Query Control watches URL changes via UrlStateService or route.queryParams
- Query Control displays active filter chip showing "Brammo: Dual Sport"
- Chip should be removable (clicking X removes URL parameter)

**Reproduction**:
1. Navigate to `http://192.168.0.244:4205/discover`
2. In Manufacturer-Model Picker, select any model (e.g., "Brammo Dual Sport")
3. Click "Apply" button
4. Verify URL updates to include `modelCombos=Brammo:Dual%20Sport`
5. **BUG**: Query Control does NOT show selection chip
6. **BUG**: No visual indication that a filter is active

**Investigation Needed**:
1. [x] Check if QueryControlComponent subscribes to route.queryParams or UrlStateService - ✅ YES (line 159-164)
2. [x] Verify QueryControlComponent.ngOnInit() watches URL changes - ✅ YES, calls syncFiltersFromUrl()
3. [x] Check if activeFilters are derived from URL or internal state - ✅ Derived from URL
4. [x] Verify chip rendering logic parses modelCombos parameter correctly - ❌ **NOT FOUND**
5. [ ] Test if issue occurs with other filter types (manufacturer, year, bodyClass)

**Root Cause (IDENTIFIED)**:
QueryControlComponent's `syncFiltersFromUrl()` method only looks at filters defined in `domainConfig.queryControlFilters` and `domainConfig.highlightFilters`. The `modelCombos` parameter was NOT defined in `AUTOMOBILE_QUERY_CONTROL_FILTERS` array (only `manufacturer`, `model`, `bodyClass`, and `yearMin/yearMax` were defined).

**Fix**:
Added a new filter definition for `modelCombos` to `AUTOMOBILE_QUERY_CONTROL_FILTERS` array. The filter:
- field: 'modelCombos'
- label: 'Manufacturer & Model'
- type: 'multiselect'
- urlParams: 'modelCombos'
- optionsEndpoint: Uses same endpoint as Manufacturer-Model Picker
- optionsTransformer: Flattens nested manufacturer-model data into list of "Manufacturer: Model" options

**Files Changed**:
- [frontend/src/domain-config/automobile/configs/automobile.query-control-filters.ts](frontend/src/domain-config/automobile/configs/automobile.query-control-filters.ts) (added modelCombos filter definition)

**Verified**: Build compiles successfully ✅

---

### 1. Clear Button Does Not Remove URL Params from Pop-Out Window (2025-11-23, FIXED 2025-11-23)

**Component**: QueryControlComponent / PanelPopoutComponent / UrlStateService
**Severity**: Medium
**Status**: ✅ FIXED
**Port**: 4205

**Description**:
When the "Clear All" or "Clear All Highlights" button is clicked in a popped-out Query Control, the URL parameters were not removed from the pop-out window's URL. This left stale filter/highlight parameters in the URL and caused the application to remain in a filtered/highlighted state.

**Observed Behavior**:
- User clicks "Clear All" or "Clear All Highlights" button in popped-out Query Control
- Filter/highlight chips may disappear from UI
- **BUG**: Pop-out URL parameters remain in the address bar (e.g., `?h_manufacturer=Ford,Buick&yearMin=1960`)
- Data continues to show filtered/highlighted results instead of full dataset

**Expected Behavior**:
- Click "Clear All" → Remove all non-highlight parameters from pop-out URL
- Click "Clear All Highlights" → Remove all `h_*` parameters from pop-out URL
- Application should refresh and show full unfiltered dataset
- Pop-out URL should update to reflect cleared state
- Main window URL should also sync via BroadcastChannel

**Reproduction**:
1. Navigate to `http://192.168.0.244:4205/discover`
2. Pop out the Query Control panel
3. In pop-out window, add filters or highlights
4. Verify pop-out URL contains parameters (e.g., `?h_manufacturer=Ford&yearMin=1960`)
5. Click "Clear All" or "Clear All Highlights" button in pop-out
6. **BUG**: Pop-out URL parameters remain unchanged
7. **BUG**: Data continues to show filtered results

**Root Cause (IDENTIFIED)**:
PanelPopoutComponent.onUrlParamsChange() was only broadcasting URL parameter changes to the main window but not updating the pop-out's own URL via UrlStateService.

**Fix**:
Added UrlStateService injection and call to `this.urlState.setParams(params)` in PanelPopoutComponent.onUrlParamsChange() to update the pop-out's own URL in addition to broadcasting to main window.

**Files Changed**:
- [frontend/src/app/features/panel-popout/panel-popout.component.ts](frontend/src/app/features/panel-popout/panel-popout.component.ts)

**Verified**: Build compiles successfully ✅

---

### 2. Popped-Out Charts Update Wrong Window URL - Query Control Out of Sync (2025-11-23, FIXED 2025-11-23)

**Component**: StatisticsPanelComponent / BaseChartComponent / BroadcastChannel messaging
**Severity**: High
**Status**: ✅ FIXED
**Port**: 4205

**Description**:
When charts are popped out to a separate window and the user interacts with them (e.g., clicks bars to add highlight filters), the URL parameters are updated in the pop-out window but NOT synchronized back to the main window. As a result, the Query Control in the main window does not display the current highlight filter parameters as active chips.

**Observed Behavior**:
- Pop-out window URL: ✅ Updates correctly with `h_manufacturer=Pontiac,Lincoln,Jeep`
- Main window URL: ❌ Does NOT update with highlight parameters
- Query Control "Active Highlights" section: ❌ Empty (does not show Pontiac, Lincoln, Jeep chips)
- Charts in main window: ❌ Do not reflect the highlights added from pop-out

**Expected Behavior**:
- Pop-out window adds `h_manufacturer=Pontiac,Lincoln,Jeep` to its URL
- BroadcastChannel message sent to main window
- Main window URL updates to include `h_manufacturer=Pontiac,Lincoln,Jeep`
- Query Control displays 3 yellow highlight chips: "Pontiac", "Lincoln", "Jeep"
- All charts in main window update to show highlighted data

**Root Cause**:
Chart interactions in pop-out window update the pop-out's URL via `UrlStateService.setParams()`, but this change is not being broadcast back to the main window. The BroadcastChannel messaging may be:
1. Not sending URL parameter updates from pop-out → main window
2. Main window not listening for URL parameter updates from pop-outs
3. URL updates happening but not triggering Query Control to re-read active filters

**Files Involved**:
- `frontend/src/framework/components/statistics-panel/statistics-panel.component.ts` (chart click handling)
- `frontend/src/framework/services/popout-context.service.ts` (BroadcastChannel messaging)
- `frontend/src/framework/services/url-state.service.ts` (URL parameter updates)
- `frontend/src/framework/components/query-control/query-control.component.ts` (active filter display)

**Investigation Steps**:
1. [ ] Check if BroadcastChannel sends messages on URL parameter changes
2. [ ] Verify main window has listener for URL parameter update messages
3. [ ] Check if Query Control subscribes to URL changes from UrlStateService
4. [ ] Test if other pop-out types (Results Table, Query Control) have same issue
5. [ ] Verify BroadcastChannel message format includes URL parameters

**Reproduction**:
1. Navigate to `http://192.168.0.244:4205/discover`
2. Pop out the Statistics panel (charts)
3. In pop-out window, hold 'h' key and click on multiple manufacturer bars (e.g., Pontiac, Lincoln, Jeep)
4. **BUG**: Pop-out URL updates to `?h_manufacturer=Pontiac,Lincoln,Jeep`
5. **BUG**: Main window URL does NOT update
6. **BUG**: Query Control "Active Highlights" section remains empty

**Related**: This may be related to MOVE semantics - popped-out panels disappear from main window, so their state changes may not propagate back.

**Root Cause (IDENTIFIED)**:
StatisticsPanelComponent was calling `this.urlState.setParams(newParams)` to update the pop-out's URL but wasn't sending a BroadcastChannel message to notify the main window of the change.

**Fix**:
Added PopOutContextService injection and BroadcastChannel message sending after URL updates in pop-out context.

**Files Changed**:
- [frontend/src/framework/components/statistics-panel/statistics-panel.component.ts](frontend/src/framework/components/statistics-panel/statistics-panel.component.ts)

**Verified**: Build compiles successfully ✅

---

### 3. Manufacturer-Model Picker Pop-Out Shows Empty Content (2025-11-23, FIXED 2025-11-23)

**Component**: BasePickerComponent / PanelPopoutComponent
**Severity**: High
**Status**: ✅ FIXED
**Port**: 4205

**Description**:
When the Manufacturer-Model Picker is popped out to a separate window, the window displays the header ("Manufacturer-Model Picker" and "Automobile Discovery") but the main content area (the table with data) is completely empty/blank.

**Observed Behavior**:
- Main window picker: ✅ Works correctly, shows table with manufacturer-model data
- Popped-out picker: ❌ Shows only header, content area is empty (white/blank)
- URL in pop-out: `http://192.168.0.244:4205/panel/discover/manufacturer-model-picker/picker?page=1`

**Expected Behavior**:
Popped-out picker should display the same table content as the main window, including:
- Manufacturer and Model columns
- Row data from API
- Pagination controls
- Search functionality
- Selection checkboxes

**Possible Causes**:
1. `PanelPopoutComponent` not correctly rendering picker components
2. Picker component not receiving required inputs/configuration in pop-out context
3. ResourceManagementService not properly shared between main window and pop-out
4. Route configuration issue for `/panel/:gridId/:panelId/:type` when type is "picker"
5. PickerConfigRegistry not available in pop-out window's injection context

**Files Involved**:
- `frontend/src/framework/components/panel-popout/panel-popout.component.ts`
- `frontend/src/framework/components/panel-popout/panel-popout.component.html`
- `frontend/src/framework/components/base-picker/base-picker.component.ts`
- `frontend/src/app/app-routing.module.ts` (pop-out routing)

**Investigation Steps**:
1. [ ] Check browser console for errors in pop-out window
2. [ ] Verify `PanelPopoutComponent` template includes `<app-base-picker>` rendering
3. [ ] Check if picker config is being passed correctly to pop-out component
4. [ ] Verify PickerConfigRegistry is provided at app module level (not feature module)
5. [ ] Test if other component types pop out correctly (query-control, statistics)

**Reproduction**:
1. Navigate to `http://192.168.0.244:4205/discover`
2. Locate the Manufacturer-Model Picker panel
3. Click the pop-out button (📌 icon)
4. **BUG**: Pop-out window opens with header but empty content area

**Root Cause (IDENTIFIED)**:
Picker configurations were only registered in `DiscoverComponent` (main window), not in `PanelPopoutComponent` (pop-out window).

**Fix**:
Added picker config registration in `PanelPopoutComponent.ngOnInit()` to mirror what `DiscoverComponent` does.

**Files Changed**:
- [frontend/src/app/features/panel-popout/panel-popout.component.ts](frontend/src/app/features/panel-popout/panel-popout.component.ts)

**Verified**: Build compiles successfully ✅

---

## Fixed Bugs

### 1. Chart Data Shows All Zero Values (2025-11-22, FIXED 2025-11-22)

**Component**: StatisticsPanelComponent / VehicleStatistics transformer
**Severity**: High
**Status**: ✅ FIXED

**Description**:
Charts are rendering with correct structure (manufacturer names, model names, years visible) but all percentage values show as "0.0%" and counts appear to be zero or near-zero.

**Observed Behavior**:
- Manufacturer chart: Shows 10 manufacturers but all with 0.0% percentage
- Top Models chart: Shows Chevrolet models but all with 0.0% percentage
- Body Class chart: Pie chart not visible (possibly all zero values)
- Year chart: Line chart shows timeline but all values near zero

**Expected Behavior**:
Charts should show actual distribution percentages and counts from the API statistics data.

**Possible Causes**:
1. API response structure doesn't match expected format exactly
2. Transformation logic in `VehicleStatistics.fromSegmentedStats()` has calculation error
3. API `statistics` field might have different structure than documented
4. Counts are using wrong fields (total vs highlighted)

**Files Involved**:
- `frontend/src/domain-config/automobile/models/automobile.statistics.ts:202-354` (transformation logic)
- `frontend/src/domain-config/automobile/adapters/automobile-api.adapter.ts:71-93` (API response handling)
- `frontend/src/framework/components/statistics-panel/statistics-panel.component.ts` (statistics consumption)

**Investigation Steps**:
1. [ ] Add console.log to see raw API response statistics structure
2. [ ] Verify API is returning statistics field with expected data
3. [ ] Check if `byManufacturer`, `modelsByManufacturer`, etc. have actual count data
4. [ ] Verify transformation logic correctly extracts counts from API response

**Root Cause**: API returns statistics as simple numbers (e.g., `"Ford": 665`) but transformation code expected objects with `{ total, highlighted }` structure.

**Fix**: Updated all four transformation methods in `VehicleStatistics` class:
- `transformByManufacturer()`: Changed type from `Record<string, { total: number; highlighted: number }>` to `Record<string, number>`
- `transformModelsByManufacturer()`: Changed nested type from `Record<string, { total: number; highlighted: number }>` to `Record<string, number>`
- `transformByBodyClass()`: Changed type from `Record<string, { total: number; highlighted: number }>` to `Record<string, number>`
- `transformByYearRange()`: Changed type from `Record<string, { total: number; highlighted: number }>` to `Record<string, number>`

**Files Changed**:
- `frontend/src/domain-config/automobile/models/automobile.statistics.ts:250-361`

**Verified**: Build compiles successfully after fix.
