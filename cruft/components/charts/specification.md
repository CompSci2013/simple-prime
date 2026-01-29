# Statistics & Distribution Charts Specification

**Component Name**: Statistics & Distribution Charts (Plotly.js)
**Feature**: Discover Page - Panel #3 - Statistics & Distributions
**Spec Reference**: [specs/03-discover-feature-specification.md](../../../specs/03-discover-feature-specification.md) Section 4
**Last Updated**: 2025-11-23
**Status**: Implemented - Documentation Created Retroactively

---

## 1. COMPONENT OVERVIEW

### Purpose
The Statistics & Distribution Charts panel provides interactive Plotly.js visualizations of vehicle data aggregations. Charts support single-click and box selection for creating highlight filters, enabling users to visually explore data distributions and filter results by clicking chart elements.

### User Story
```
As a vehicle analyst
I want to click on chart bars to highlight specific subsets of data
So that I can visually filter results and understand data distributions
```

### Location in UI
- **Page**: Discover Page (`/discover`)
- **Panel**: Panel #3 - Statistics & Distributions (4 charts)
- **Position**: Below Results Table
- **Collapsible**: Yes (per chart)
- **Pop-out**: Yes (per chart)

---

## 2. WIREFRAME

### Statistics Panel with 4 Charts

```
┌─────────────────────────────────────────────────────────────────┐
│  📊 Statistics & Distributions (4 charts)                  [−] │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────┐  ┌──────────────────────────────┐ │
│  │ Vehicles by Manufacturer│  │ Top Models by VIN Count      │ │
│  │                     [📌]│  │                          [📌]│ │
│  │    ████ Highlighted     │  │    ████ Highlighted          │ │
│  │    ░░░░ Other           │  │    ░░░░ Other                │ │
│  │                         │  │                              │ │
│  │  800┤ ░     Blue=Bottom │  │  80┤ ░      Blue=Bottom      │ │
│  │  600┤ █░                │  │  60┤ █░                       │ │
│  │  400┤ ██░               │  │  40┤ ███░                     │ │
│  │  200┤ ███░              │  │  20┤ ████░                    │ │
│  │    0└───────────────    │  │   0└──────────────            │ │
│  │      Chevy Ford Buick   │  │     Chevy Sub Lincoln Cont   │ │
│  └─────────────────────────┘  └──────────────────────────────┘ │
│                                                                 │
│  ┌─────────────────────────┐  ┌──────────────────────────────┐ │
│  │ Vehicles by Year        │  │ Vehicles by Body Class       │ │
│  │                     [📌]│  │                          [📌]│ │
│  │    ████ Highlighted     │  │    ████ Highlighted          │ │
│  │    ░░░░ Other           │  │    ░░░░ Other                │ │
│  │                         │  │                              │ │
│  │  200┤ ░                 │  │ 400┤ ░                        │ │
│  │  150┤ █░                │  │ 300┤ █░                       │ │
│  │  100┤ ██░               │  │ 200┤ ██░                      │ │
│  │   50┤ ███░              │  │ 100┤ ███░                     │ │
│  │    0└───────────────    │  │   0└───────────               │ │
│  │      1960 1970 1980     │  │     Sedan SUV Truck           │ │
│  └─────────────────────────┘  └──────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘

IMPORTANT: ALL charts stack bars with:
  - Highlighted (blue #3B82F6) on BOTTOM
  - Other (gray #9CA3AF) on TOP
```

### Chart Interaction Modes

```
Normal Mode (default):
  Single Click → No action (reserved for future drill-down)
  Box Select → Add regular filter URL parameters (yearMin/yearMax, manufacturer, etc.)
              → Same as if selection was made via Query Control

Highlight Mode (hold 'h' key):
  Single Click → Add h_* URL parameter for clicked value
  Box Select → Add h_* URL parameter for range/multiple values

Visual Feedback:
  'h' key down → Cursor changes, "Highlight Mode" indicator
  'h' key up → Normal cursor restored
```

---

## 3. CHART SPECIFICATIONS

### Chart 1: Vehicles by Manufacturer

**Purpose**: Show distribution of vehicles across manufacturers
**Chart Type**: Vertical stacked bar chart
**Data Source**: `ManufacturerChartDataSource`
**Statistics Field**: `statistics.byManufacturer`

**URL Parameters**:
- **Normal Mode**:
  - Single click: No action
  - Box select: `manufacturer={value1},{value2},...` (e.g., `manufacturer=Ford,Buick,Chrysler`)
- **Highlight Mode (hold 'h' key)**:
  - Single click: `h_manufacturer={value}` (e.g., `h_manufacturer=Ford`)
  - Box select: `h_manufacturer={value1},{value2},...` (e.g., `h_manufacturer=Ford,Buick,Chrysler`)

**Limits**: Top 20 manufacturers by count

---

### Chart 2: Top Models by VIN Count

**Purpose**: Show top models ranked by instance count
**Chart Type**: Vertical stacked bar chart
**Data Source**: `TopModelsChartDataSource`
**Statistics Field**: `statistics.modelsByManufacturer` (segmented) or `statistics.topModels` (fallback)

**URL Parameters**:
- **Normal Mode**:
  - Single click: No action
  - Box select: `modelCombos={Mfr}:{Model},{Mfr}:{Model},...` (e.g., `modelCombos=Ford:F-150,Buick:Century`)
- **Highlight Mode (hold 'h' key)**:
  - Single click: `h_modelCombos={Mfr}:{Model}` (e.g., `h_modelCombos=Ford:F-150`)
  - Box select: `h_modelCombos={Mfr}:{Model},{Mfr}:{Model},...` (e.g., `h_modelCombos=Ford:F-150,Buick:Century`)

**Label Format Conversion**:
- Chart labels: `"Manufacturer Model"` (space-separated, e.g., `"Ford F-150"`)
- URL parameter: `"Manufacturer:Model"` (colon-separated, e.g., `"Ford:F-150"`)
- Conversion: `label.replace(' ', ':')` for first space only

**Limits**: Top 20 models by instance count

---

### Chart 3: Vehicles by Year

**Purpose**: Show distribution of vehicles across years
**Chart Type**: Vertical stacked bar chart
**Data Source**: `YearChartDataSource`
**Statistics Field**: `statistics.byYearRange`

**URL Parameters**:
- **Normal Mode**:
  - Single click: No action
  - Box select (range): `yearMin={min}&yearMax={max}` (e.g., `yearMin=1960&yearMax=1970`)
  - Box select (single): `yearMin={year}&yearMax={year}` (e.g., `yearMin=2020&yearMax=2020`)
- **Highlight Mode (hold 'h' key)**:
  - Single click: `h_yearMin={year}&h_yearMax={year}` (e.g., `h_yearMin=2020&h_yearMax=2020`)
  - Box select: `h_yearMin={min}&h_yearMax={max}` (e.g., `h_yearMin=1960&h_yearMax=1970`)

**Special Handling**:
- Single click → Returns year as string (e.g., `"2020"`)
- Box select → Returns pipe-delimited range (e.g., `"1960|1970"`)
- StatisticsPanelComponent splits pipe and creates two parameters (yearMin/yearMax OR h_yearMin/h_yearMax)

**Limits**: All years (no limit)

---

### Chart 4: Vehicles by Body Class

**Purpose**: Show distribution of vehicles across body classes
**Chart Type**: Vertical stacked bar chart
**Data Source**: `BodyClassChartDataSource`
**Statistics Field**: `statistics.byBodyClass`

**URL Parameters**:
- **Normal Mode**:
  - Single click: No action
  - Box select: `bodyClass={value1},{value2},...` (e.g., `bodyClass=Sedan,SUV,Truck`)
- **Highlight Mode (hold 'h' key)**:
  - Single click: `h_bodyClass={value}` (e.g., `h_bodyClass=Sedan`)
  - Box select: `h_bodyClass={value1},{value2},...` (e.g., `h_bodyClass=Sedan,SUV,Truck`)

**Limits**: All body classes (no limit)

---

## 4. DATA FLOW & ARCHITECTURE

### URL-First State Pattern (CRITICAL)

```
User Interaction Flow:
1. User holds 'h' key + clicks chart bar
2. Chart's handleClick() returns formatted value
3. BaseChartComponent emits chartClick event
4. StatisticsPanelComponent.onChartClick() receives event
5. UrlStateService.setParams() updates URL ✅ CORRECT
6. URL change triggers ResourceManagementService
7. Service extracts h_* parameters
8. API request includes highlight parameters
9. Backend returns segmented statistics {total, highlighted}
10. Charts render with highlighting

❌ INCORRECT: router.navigate() - Bypasses URL-First pattern
✅ CORRECT: UrlStateService.setParams() - Maintains pattern
```

### Server-Side Segmented Statistics

**Detection Pattern**:
```typescript
const isSegmented = entries.length > 0 &&
  typeof entries[0][1] === 'object' &&
  'total' in entries[0][1];
```

**Data Formats**:
```typescript
// Simple counts (no highlights active)
{
  "Ford": 523,
  "Buick": 234,
  "Chrysler": 189
}

// Segmented statistics (highlights active)
{
  "Ford": { total: 523, highlighted: 89 },
  "Buick": { total: 234, highlighted: 0 },
  "Chrysler": { total: 189, highlighted: 45 }
}
```

**Usage**:
- If segmented: Use `stats.total` and `stats.highlighted` directly
- If simple: Use count value, no highlighting
- Charts MUST detect and handle both formats

---

## 5. VISUAL PRESENTATION RULES

### Stacking Order (CRITICAL - Must Be Consistent)

**ALL charts MUST use this exact order**:
```typescript
traces = [
  {
    type: 'bar',
    name: 'Highlighted',        // Trace 0 - BOTTOM layer
    y: highlightedCounts,
    marker: { color: '#3B82F6' }  // Blue
  },
  {
    type: 'bar',
    name: 'Other',              // Trace 1 - TOP layer
    y: otherCounts,
    marker: { color: '#9CA3AF' }  // Gray
  }
]
```

**Comment Convention**:
```typescript
// Create stacked bar traces (Highlighted first at bottom, then Other on top)
```

**Why This Matters**:
- Plotly renders traces in array order
- First trace = bottom layer, subsequent traces stack on top
- Consistent visual presentation across all charts
- User expectations: highlighted data more prominent (bottom)

### Color Scheme

| State | Color | Hex | Usage |
|-------|-------|-----|-------|
| Highlighted | Blue | `#3B82F6` | Selected/filtered data (bottom layer) |
| Other | Gray | `#9CA3AF` | Non-selected data (top layer) |
| Hover | N/A | Auto | Plotly default hover effect |

### Legend Display

```typescript
layout: {
  showlegend: isSegmented  // Show legend ONLY when highlights active
}
```

### Chart Dimensions

```typescript
layout: {
  height: 400,              // Fixed height
  width: '100%',            // Responsive width
  margin: {
    l: 60,    // Left (y-axis)
    r: 40,    // Right
    t: 40,    // Top
    b: 120    // Bottom (x-axis labels, may vary by chart)
  }
}
```

---

## 6. USER INTERACTIONS

### Action 1: Single Click (Highlight Mode)

**Trigger**: User holds 'h' key + clicks single bar
**Chart Detection**: `plotly_click` event
**Processing**: Delegate to `dataSource.handleClick(event)`
**Result**:
- Chart returns single value (e.g., `"Ford"`)
- StatisticsPanelComponent maps to parameter name (e.g., `'h_manufacturer'`)
- URL updates with single h_* parameter
- Page refreshes with highlighted data

**Example Flow**:
```
User: Hold 'h' + Click "Ford" bar
↓
ManufacturerChartDataSource.handleClick() returns "Ford"
↓
BaseChartComponent emits { value: "Ford", isHighlightMode: true }
↓
StatisticsPanelComponent: h_manufacturer = "Ford"
↓
UrlStateService.setParams({ h_manufacturer: "Ford" })
↓
URL: ?h_manufacturer=Ford
```

---

### Action 2: Box Selection (Normal Mode - WITHOUT 'h' key)

**Trigger**: User drags box across multiple bars WITHOUT holding 'h' key
**Chart Detection**: `plotly_selected` event
**Processing**: Delegate to `dataSource.handleClick(event)` (SAME as click)
**Result**:
- Chart returns formatted multi-value (format depends on chart type)
- StatisticsPanelComponent maps to REGULAR parameter name (e.g., `'manufacturer'`, NOT `'h_manufacturer'`)
- URL updates with regular filter parameter (same as Query Control would create)
- Page refreshes with filtered data (NOT highlighted)

**Example Flow** (Year Chart):
```
User: Drag box across years 1960-1970 (NO 'h' key held)
↓
YearChartDataSource.handleClick() processes event.points
↓
Returns "1960|1970" (pipe-delimited range)
↓
BaseChartComponent emits { value: "1960|1970", isHighlightMode: false }
↓
StatisticsPanelComponent: yearMin = 1960, yearMax = 1970
↓
UrlStateService.setParams({ yearMin: 1960, yearMax: 1970 })
↓
URL: ?yearMin=1960&yearMax=1970
```

**Key Difference from Highlight Mode**:
- Uses regular parameter names (`manufacturer`, `modelCombos`, `bodyClass`, `yearMin`/`yearMax`)
- Behaves identically to adding filters via Query Control
- Data is FILTERED (not highlighted with segmented statistics)
- No blue/gray stacked bars - results table shows only filtered data

---

### Action 3: Box Selection (Highlight Mode - WITH 'h' key)

**Trigger**: User holds 'h' key + drags box across multiple bars
**Chart Detection**: `plotly_selected` event
**Processing**: Delegate to `dataSource.handleClick(event)` (SAME as click)
**Result**:
- Chart returns formatted multi-value (format depends on chart type)
- URL updates with h_* parameter containing multiple values
- Page refreshes with highlighted data

**Box Selection Handling**:
```typescript
handleClick(event: any): string | null {
  if (event.points && event.points.length > 0) {
    // Extract ALL selected values
    const values = event.points.map((point: any) => point.x as string);

    // Remove duplicates (stacked bars select both traces)
    const uniqueValues = [...new Set(values)];

    // Return chart-specific format
    return uniqueValues.join(',');  // OR special format for years
  }
  return null;
}
```

**Example Flow** (Manufacturer Chart):
```
User: Hold 'h' + Drag box across Ford, Buick, Chrysler bars
↓
ManufacturerChartDataSource.handleClick() processes event.points (6 points - 3 bars × 2 traces)
↓
Deduplication: ["Ford", "Ford", "Buick", "Buick", "Chrysler", "Chrysler"] → ["Ford", "Buick", "Chrysler"]
↓
Returns "Ford,Buick,Chrysler"
↓
URL: ?h_manufacturer=Ford,Buick,Chrysler
```

---

### Action 4: Clear Highlights

**Trigger**: User clicks "Clear All Highlights" button (if exists) OR manually removes h_* from URL
**Result**:
- All h_* parameters removed from URL
- Charts render with simple blue bars (no stacking)
- All data shown without highlighting

---

### Action 5: Clear Regular Filters

**Trigger**: User clicks "Clear All" button OR manually removes filter params from URL
**Result**:
- All non-highlight parameters removed from URL
- Charts and results table show full unfiltered dataset
- Highlight parameters (h_*) remain if present

---

## 7. CHART-SPECIFIC OUTPUT FORMATS

### Chart Output Format Matrix

| Chart | Mode | Single Click | Box Select | URL Parameter | Example |
|-------|------|-------------|------------|---------------|---------|
| **Manufacturer** | Normal | No action | `"Ford,Buick"` | `manufacturer` | `?manufacturer=Ford,Buick` |
| | Highlight | `"Ford"` | `"Ford,Buick"` | `h_manufacturer` | `?h_manufacturer=Ford,Buick` |
| **Top Models** | Normal | No action | `"Ford:F-150,Buick:Century"` | `modelCombos` | `?modelCombos=Ford:F-150,Buick:Century` |
| | Highlight | `"Ford:F-150"` | `"Ford:F-150,Buick:Century"` | `h_modelCombos` | `?h_modelCombos=Ford:F-150,Buick:Century` |
| **Year** | Normal | No action | `"1960\|1970"` (pipe!) | `yearMin` + `yearMax` | `?yearMin=1960&yearMax=1970` |
| | Highlight | `"2020"` | `"1960\|1970"` (pipe!) | `h_yearMin` + `h_yearMax` | `?h_yearMin=1960&h_yearMax=1970` |
| **Body Class** | Normal | No action | `"Sedan,SUV,Truck"` | `bodyClass` | `?bodyClass=Sedan,SUV,Truck` |
| | Highlight | `"Sedan"` | `"Sedan,SUV,Truck"` | `h_bodyClass` | `?h_bodyClass=Sedan,SUV,Truck` |

### Parameter Name Mapping (StatisticsPanelComponent)

**Highlight Mode (hold 'h' key)**:
```typescript
private getHighlightParamName(chartId: string): string | null {
  const mapping: Record<string, string> = {
    'manufacturer-distribution': 'h_manufacturer',
    'top-models': 'h_modelCombos',           // NOT 'h_model'!
    'body-class-distribution': 'h_bodyClass'
    // 'year-distribution' handled separately (splits into h_yearMin + h_yearMax)
  };
  return mapping[chartId] || null;
}
```

**Normal Mode (no 'h' key)**:
```typescript
private getFilterParamName(chartId: string): string | null {
  const mapping: Record<string, string> = {
    'manufacturer-distribution': 'manufacturer',
    'top-models': 'modelCombos',             // NOT 'model'!
    'body-class-distribution': 'bodyClass'
    // 'year-distribution' handled separately (splits into yearMin + yearMax)
  };
  return mapping[chartId] || null;
}
```

### Separator Normalization (Backend Compatibility)

**Problem**: Legacy URLs or chart outputs may use pipe separators (`|`)
**Solution**: ResourceManagementService normalizes to commas

```typescript
private extractHighlights(urlParams: Record<string, any>): any {
  const highlights: Record<string, any> = {};
  Object.keys(urlParams).forEach(key => {
    if (key.startsWith('h_')) {
      let value = urlParams[key];
      // Normalize separators: Convert pipes to commas for backend compatibility
      if (typeof value === 'string' && value.includes('|')) {
        value = value.replace(/\|/g, ',');
      }
      highlights[key.substring(2)] = value;  // Remove 'h_' prefix
    }
  });
  return highlights;
}
```

**Exception**: Year ranges use pipes intentionally, but are split into separate params

---

## 8. CHART DATA SOURCE CONTRACT

### Required Methods

All chart data sources MUST implement:

```typescript
abstract class ChartDataSource<TStatistics = any> {
  /**
   * Transform statistics into Plotly-ready chart data
   *
   * @param statistics - Domain statistics (may be null)
   * @param highlights - Highlight filters (may be empty)
   * @param selectedValue - Currently selected value (may be null)
   * @param containerWidth - Chart container width in pixels
   * @returns ChartData or null if no data
   */
  abstract transform(
    statistics: TStatistics | null,
    highlights: any,
    selectedValue: string | null,
    containerWidth: number
  ): ChartData | null;

  /**
   * Get chart title
   */
  abstract getTitle(): string;

  /**
   * Handle click/selection events
   *
   * MUST handle both single-click and box selection
   * MUST remove duplicates from stacked bar selections
   * MUST return chart-specific format
   *
   * @param event - Plotly click or selection event
   * @returns Formatted value or null
   */
  abstract handleClick(event: any): string | null;
}
```

### Return Types

```typescript
interface ChartData {
  traces: Plotly.Data[];           // Array of chart traces
  layout: Partial<Plotly.Layout>;  // Chart layout configuration
}
```

---

## 9. STATISTICS TRANSFORMATION REQUIREMENTS

### Transform Limits (VehicleStatistics Model)

**CRITICAL**: Chart sources expect 20 items, transforms MUST match

```typescript
class VehicleStatistics {
  private static transformByManufacturer(...): ManufacturerStat[] {
    // ... processing ...
    return stats.slice(0, 20);  // MUST return 20, not 10
  }

  private static transformModelsByManufacturer(...): ModelStat[] {
    // ... processing ...
    return stats.slice(0, 20);  // MUST return 20, not 10
  }
}
```

**Why**: Consistency with reference application, adequate data visualization

---

## 10. DELEGATION PATTERN (BaseChartComponent)

### Single Click Handler

```typescript
gd.on('plotly_click', (data: any) => {
  const clickedValue = this.dataSource.handleClick(data);  // ✅ Delegate
  if (clickedValue) {
    this.chartClick.emit({
      value: clickedValue,
      isHighlightMode: this.isHighlightModeActive
    });
  }
});
```

### Box Selection Handler

```typescript
gd.on('plotly_selected', (data: any) => {
  const selectedValue = this.dataSource.handleClick(data);  // ✅ Delegate (same method!)
  if (selectedValue) {
    this.chartClick.emit({
      value: selectedValue,
      isHighlightMode: this.isHighlightModeActive
    });
  }
});
```

**Why Delegation**:
- Chart sources know their own data format
- Eliminates duplicate formatting logic in base component
- Supports different formats per chart (comma vs pipe)
- Single method handles both click and selection

---

## 11. ACCEPTANCE CRITERIA (Gherkin)

```gherkin
Feature: Chart Highlighting System
  As a vehicle analyst
  I want to click chart bars to filter results
  So that I can explore data distributions visually

Background:
  Given the user is on the discover page
  And the statistics panel is loaded with 4 charts
  And all charts show data without highlights (simple blue bars)

Scenario: Single click adds manufacturer highlight
  When the user holds the 'h' key
  And the user clicks the "Ford" bar in the Manufacturer chart
  Then the URL should update to "?h_manufacturer=Ford"
  And the Manufacturer chart should show stacked bars (blue + gray)
  And the "Ford" bar should show blue (highlighted) section
  And other bars should show only gray (other) sections
  And the results table should refresh with only Ford vehicles

Scenario: Box selection adds multiple manufacturer highlights (Highlight Mode)
  When the user holds the 'h' key
  And the user drags a box across "Ford", "Buick", "Chrysler" bars
  Then the URL should update to "?h_manufacturer=Ford,Buick,Chrysler"
  And all three bars should show blue highlighted sections
  And the results table should show only Ford, Buick, or Chrysler vehicles

Scenario: Box selection filters data like Query Control (Normal Mode)
  When the user drags a box across "Ford", "Buick", "Chrysler" bars WITHOUT holding 'h' key
  Then the URL should update to "?manufacturer=Ford,Buick,Chrysler"
  And the charts should show simple blue bars (no stacking, no highlighting)
  And the results table should show only Ford, Buick, or Chrysler vehicles
  And the behavior should be identical to adding filters via Query Control

Scenario: Year range box selection (Highlight Mode)
  When the user holds the 'h' key
  And the user drags a box across years 1960-1970 in the Year chart
  Then the URL should update to "?h_yearMin=1960&h_yearMax=1970"
  And the Year chart should show highlighted sections for years 1960-1970
  And the results table should show only vehicles from 1960-1970

Scenario: Year range box selection filters data (Normal Mode)
  When the user drags a box across years 1960-1970 WITHOUT holding 'h' key
  Then the URL should update to "?yearMin=1960&yearMax=1970"
  And the Year chart should show simple blue bars (no stacking, no highlighting)
  And the results table should show only vehicles from 1960-1970
  And the behavior should be identical to setting year range via Query Control

Scenario: Models chart click converts format correctly
  When the user holds the 'h' key
  And the user clicks the "Ford F-150" bar in the Top Models chart
  Then the URL should update to "?h_modelCombos=Ford:F-150"
  And the chart label "Ford F-150" should convert to URL format "Ford:F-150"
  And the results table should show only Ford F-150 vehicles

Scenario: Stacking order is consistent across charts
  Given the URL contains "?h_manufacturer=Ford"
  When the user views all 4 charts
  Then all charts should show blue (highlighted) sections on the BOTTOM
  And all charts should show gray (other) sections on the TOP
  And the legend should appear with "Highlighted" and "Other" labels

Scenario: Box selection removes duplicates from stacked bars
  Given the Year chart has stacked bars (2 traces per bar)
  When the user drags a box across 3 year bars
  Then the selection should contain 3 unique years (not 6 duplicate points)
  And the URL should show the correct year range

Scenario: Normal mode click does nothing
  When the user clicks a chart bar WITHOUT holding 'h' key
  Then the URL should NOT change
  And no highlight should be added
  And the charts should remain unchanged

Scenario: Legacy pipe separators are normalized
  Given the URL contains "?h_manufacturer=Ford|Buick" (pipe separator)
  When the page loads
  Then the ResourceManagementService should normalize to "Ford,Buick" (comma)
  And the API request should use comma-separated format
  And the charts should render correctly
```

---

## 12. EDGE CASES & ERROR STATES

### Edge Case 1: Empty Statistics
**Scenario**: API returns null or empty statistics
**Expected Behavior**: Chart returns `null` from `transform()`, shows "No data" state

### Edge Case 2: Statistics Format Detection Fails
**Scenario**: Statistics have unexpected structure
**Expected Behavior**: Falls back to simple count format, shows blue bars without highlighting

### Edge Case 3: Very Long Label Names
**Scenario**: Manufacturer/model names exceed chart width
**Expected Behavior**: Plotly auto-rotates labels (-45°), truncates with ellipsis

### Edge Case 4: Box Selection with Single Bar
**Scenario**: User drags box but only captures one bar
**Expected Behavior**: Treated as single click, returns single value

### Edge Case 5: Rapid Click/Selection Changes
**Scenario**: User rapidly clicks multiple bars
**Expected Behavior**: Each click updates URL immediately, latest state wins

### Edge Case 6: Missing Chart ID in Mapping
**Scenario**: New chart added but not in `getHighlightParamName()` mapping
**Expected Behavior**: Returns `null`, chart click does nothing (fails silently)

---

## 13. PERFORMANCE CRITERIA

| Metric | Target | Measurement |
|--------|--------|-------------|
| Chart Render Time | < 500ms | Time from data → Plotly render complete |
| Click Response | < 100ms | Click → URL update |
| Box Selection | < 200ms | Selection end → URL update |
| Legend Toggle | < 50ms | Show/hide based on segmented data |
| Re-render on Highlight | < 300ms | URL change → chart re-render with new colors |

---

## 14. DEPENDENCIES

### Framework Services
- `UrlStateService` - URL parameter management
- `ResourceManagementService` - State management, API calls
- `BaseChartComponent` - Chart rendering, event delegation

### Domain Configuration
- `AUTOMOBILE_CHART_CONFIGS` - Chart configuration array
- `ManufacturerChartDataSource`, `TopModelsChartDataSource`, `YearChartDataSource`, `BodyClassChartDataSource`

### External Libraries
- `plotly.js-dist-min` - Chart rendering library

### API Endpoints
- `GET /api/specs/v1/vehicles/details` - Returns segmented statistics

---

## 15. KNOWN ISSUES & TECHNICAL DEBT

### Issue 1: Highlight Mode UX
**Status**: Not Implemented
**Description**: No visual indicator when 'h' key is held down
**Impact**: Users may not know when highlight mode is active
**Proposed Solution**: Add cursor change or banner indicator

### Issue 2: Clear Highlights Button
**Status**: Not Implemented
**Description**: No UI button to clear all highlights
**Impact**: Users must manually edit URL to remove highlights
**Proposed Solution**: Add "Clear All Highlights" button in panel header

### Issue 3: Multi-Chart Highlight Conflicts
**Status**: Not Addressed
**Description**: Unclear behavior when highlights conflict across dimensions
**Impact**: May confuse users (e.g., h_manufacturer=Ford AND h_bodyClass=Sedan)
**Proposed Solution**: Document AND/OR logic for multiple highlight dimensions

---

## 16. REVISION HISTORY

| Date | Version | Author | Changes |
|------|---------|--------|---------|
| 2025-11-23 | 1.0 | Claude Code | Initial specification (retroactive documentation of 10 fixes) |
| 2025-11-23 | 1.1 | Claude Code | Added box selection in Normal Mode (without 'h' key) - sends regular filter params like Query Control |

---

**End of Chart Component Specification**
