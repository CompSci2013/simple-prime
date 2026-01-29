# Known Bugs

## Chart Highlighting - Cross-Dimension Support

**Date Reported**: 2025-11-22
**Severity**: Medium
**Status**: Open

### Description
When h_yearMin/h_yearMax parameters are set (e.g., by clicking on the Year chart), only the Year chart shows proper highlighting. The other charts (Manufacturer, Models, Body Class) do not update to show which items fall within the selected year range.

### Expected Behavior
When year range is highlighted (e.g., 1982-1994):
- **Manufacturer chart** should show which manufacturers have vehicles in that year range (highlighted) vs outside (other)
- **Models chart** should show which models have vehicles in that year range
- **Body Class chart** should show which body classes have vehicles in that year range

### Current Behavior
- Year chart: ✅ Works correctly (highlights 1982-1994 in blue)
- Manufacturer chart: ❌ Shows all manufacturers as "Other" (gray)
- Models chart: ❌ Shows all models as "Other" (gray)
- Body Class chart: ❌ Shows all body classes as "Other" (gray)

### Root Cause
Chart data sources currently only check for their own highlight dimension:
- `ManufacturerChartDataSource`: Only checks `highlights.manufacturer`
- `BodyClassChartDataSource`: Only checks `highlights.bodyClass`
- `YearChartDataSource`: Only checks `highlights.yearMin/yearMax`

They do not compute cross-dimensional highlighting (e.g., "show manufacturers within a year range").

### Reproduction
1. Navigate to `http://localhost:4205/discover`
2. Click on a bar in the "Vehicles by Year" chart (e.g., years 1982-1994)
3. URL updates to include `?h_yearMin=1982&h_yearMax=1994`
4. Year chart shows correct highlighting
5. **BUG**: Other charts do not show which items fall within that year range

### Possible Solutions

**Option A: Backend Multi-Dimensional Statistics** (Requires backend changes)
- Backend API accepts multiple h_* parameters simultaneously
- Returns segmented statistics across dimensions
- Example: `?h_yearMin=1982&h_yearMax=1994` returns `{"Ford": {total: 665, highlighted: 245}}` where 245 is Ford vehicles in 1982-1994

**Option B: Client-Side Cross-Dimensional Filtering** (Frontend only)
- Fetch detailed data broken down by multiple dimensions
- Compute intersections client-side
- More complex, requires loading more detailed statistics

**Option C: Disable Cross-Dimensional Highlighting** (Document limitation)
- Only highlight within the same dimension
- Year highlights only affect year chart
- Manufacturer highlights only affect manufacturer chart
- Document this as a known limitation

### Reference Implementation
Port 4201 application handles this correctly - all charts update when any h_* parameter changes.

### Files Involved
- `/frontend/src/domain-config/automobile/chart-sources/manufacturer-chart-source.ts`
- `/frontend/src/domain-config/automobile/chart-sources/body-class-chart-source.ts`
- `/frontend/src/domain-config/automobile/chart-sources/top-models-chart-source.ts`
- `/frontend/src/domain-config/automobile/chart-sources/year-chart-source.ts`

---
