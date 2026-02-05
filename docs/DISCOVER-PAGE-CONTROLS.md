# Discover Page Controls Reference

This document catalogs all UI controls on the Discover pages and identifies whether each control is provided by the **Framework** or is **Domain-Specific**.

## Discover Pages

| Page | Route | Component | Angular Pattern |
|------|-------|-----------|-----------------|
| Agriculture Discover | `/agriculture/discover` | `agriculture-discover.component` | NgModule (Angular 13) |
| Automobile Discover | `/automobiles/discover` | `automobile-discover.component` | Standalone (Angular 14+) |

---

## Control Inventory

| Control | Page | Source | Component/Library | Description |
|---------|------|--------|-------------------|-------------|
| **Query Control Panel** | Agriculture Discover | Framework | `app-query-control` | Filter management bar with dropdown and chips |
| **Add Filter Dropdown** | Agriculture Discover | Framework | `p-dropdown` (PrimeNG) via `app-query-control` | Field selection dropdown |
| **Filter Chips** | Agriculture Discover | Framework | `p-chip` (PrimeNG) via `app-query-control` | Active filter display with remove |
| **Highlight Chips** | Agriculture Discover | Framework | `p-chip` (PrimeNG) via `app-query-control` | Highlight filter display |
| **Multiselect Dialog** | Agriculture Discover (modal) | Framework | `p-dialog` + custom listbox via `app-query-control` | "Select Crop", "Select Region" |
| **Range Dialog** | Agriculture Discover (modal) | Framework | `p-dialog` + `p-inputNumber` via `app-query-control` | "Select Year", "Select Yield Range", "Select Acres" |
| **Statistics Cards** | Agriculture Discover | Domain-Specific | Custom HTML/CSS | Total Records, Total Acres, Avg Yield |
| **Distribution Charts** | Agriculture Discover | Framework | `app-base-chart` | "Distribution by Crop", "Distribution by Region" |
| **Pop-out Button** | Agriculture Discover | Domain-Specific | `pButton` (PrimeNG) | Button triggering chart popout |
| **Data Table** | Agriculture Discover | Domain-Specific | `p-table` (PrimeNG) | Crop data table with pagination |
| **Back Link** | Agriculture Discover | Domain-Specific | `routerLink` (Angular) | Link to Agriculture Home |
| **Manufacturer-Model Picker** | Automobile Discover | Framework | `app-base-picker` | Hierarchical make/model selector |
| **Statistics Panel** | Automobile Discover | Framework | `app-statistics-panel-2` | Manufacturer & Top Models charts |
| **Dockview Statistics Panel** | Automobile Discover | Framework | `app-dockview-statistics-panel` | Tabbed chart container |
| **Body Class Chart** | Automobile Discover | Framework | `app-base-chart` | "Vehicles by Body Class" |
| **Year Chart** | Automobile Discover | Framework | `app-base-chart` | "Vehicles by Year" |
| **Results Table** | Automobile Discover | Framework | `app-dynamic-results-table` | Vehicle data table with drag-drop columns |
| **Draggable Panels** | Automobile Discover | Domain-Specific | Angular CDK `cdkDropList` | Panel reordering |
| **Panel Collapse Toggle** | Automobile Discover | Domain-Specific | `pButton` (PrimeNG) | Expand/collapse panel |
| **Panel Pop-out Button** | Automobile Discover | Domain-Specific | `pButton` (PrimeNG) | Pop panel to separate window |
| **Chart (in popout)** | Panel Popout | Framework | `app-base-chart` | Same chart in separate window |
| **Picker (in popout)** | Panel Popout | Framework | `app-base-picker` | Same picker in separate window |

---

## Framework Components Used

### `app-query-control` (QueryControlComponent)

**Location:** `src/framework/components/query-control/`

The Query Control is a **framework component** that provides:

1. **Add Filter Dropdown** - PrimeNG `p-dropdown` for selecting filterable fields
2. **Active Filter Chips** - PrimeNG `p-chip` showing current filters
3. **Multiselect Dialog** - Custom dialog for selecting multiple values
4. **Range Dialog** - Dialog for min/max range selection

#### Is "Select Crop" Dialog a Framework Control?

**Yes.** The "Select Crop" dialog is part of the `app-query-control` framework component.

The dialog is rendered by `query-control.component.html` lines 72-176:
- Uses PrimeNG `p-dialog` for the modal container
- Contains a **custom WAI-ARIA listbox** implementation (not PrimeNG's multiselect)
- Custom keyboard navigation (Arrow keys, Space, Enter, Home, End)
- Custom checkbox rendering with focus/selection states

The dialog is **domain-agnostic** - it works for any domain (Crop, Make, Region, etc.) based on the `FilterDefinition` configuration passed to the component.

```typescript
// Domain config defines what appears in the dialog
{
  field: 'crop',
  label: 'Crop',
  type: 'multiselect',
  optionsTransformer: () => CROP_OPTIONS,  // Static options for Agriculture
  // OR
  optionsEndpoint: '/api/makes',           // API endpoint for Automobiles
}
```

### `app-base-chart` (BaseChartComponent)

**Location:** `src/framework/components/base-chart/`

Framework component wrapping Plotly.js for chart rendering. Accepts:
- `dataSource` - Configuration for transforming statistics to chart data
- `statistics` - Observable of domain statistics
- `highlights` - Observable of highlight filters

---

## Domain-Specific Controls

### Statistics Cards

The statistics cards are **domain-specific** HTML/CSS, not a framework component:

```html
<div class="statistics-row">
  <div class="stat-card">
    <div class="stat-icon">📊</div>
    <div class="stat-content">
      <span class="stat-value">{{ statistics?.totalRecords }}</span>
      <span class="stat-label">Total Records</span>
    </div>
  </div>
  <!-- ... -->
</div>
```

Each domain implements its own statistics display. A framework `app-statistics-panel` exists but is not used on the Discover page layout.

### Data Table

**Agriculture Discover** uses PrimeNG `p-table` **directly** in the domain component:

```html
<p-table
  [value]="(resourceService.results$ | async) || []"
  [loading]="(resourceService.loading$ | async) || false"
  [paginator]="true"
  ...>
```

**Automobile Discover** uses the framework component `app-dynamic-results-table`:

```html
<app-dynamic-results-table [domainConfig]="domainConfig"></app-dynamic-results-table>
```

Framework table components available:
- `app-results-table` - Basic table with sorting/pagination
- `app-dynamic-results-table` - Advanced table with drag-drop columns, resizable widths

---

## Summary: Framework vs Domain

| Category | Framework | Domain-Specific |
|----------|-----------|-----------------|
| Filter Management | `app-query-control` | - |
| Filter Dialogs | Multiselect, Range (in query-control) | - |
| Charts | `app-base-chart` | Chart config/placement |
| Statistics | `app-statistics-panel-2` | Custom cards layout (Agriculture) |
| Data Table | `app-dynamic-results-table` (Automobile) | Direct `p-table` usage (Agriculture) |
| Pop-out | Popout service (framework) | Pop-out buttons |
| Navigation | - | Back link, routing |

---

## File Locations

```
src/framework/components/
├── query-control/           # Filter management + dialogs
│   ├── query-control.component.ts
│   ├── query-control.component.html
│   └── query-control.component.scss
├── base-chart/              # Plotly.js wrapper
├── results-table/           # Generic results table (not used in Discover)
├── dynamic-results-table/   # Dynamic column table
└── statistics-panel-2/      # Statistics panel (not used in Discover)

src/app/features/agriculture/agriculture-discover/
├── agriculture-discover.component.ts
├── agriculture-discover.component.html   # Domain-specific layout
└── agriculture-discover.component.scss

src/app/features/automobile/automobile-discover/
├── automobile-discover.component.ts
├── automobile-discover.component.html    # Domain-specific layout
└── automobile-discover.component.scss

src/domain-config/agriculture/
├── configs/
│   └── agriculture.query-control-filters.ts  # Filter definitions
└── adapters/
    └── agriculture-api.adapter.ts            # Data fetching

src/domain-config/automobile/
├── configs/
│   └── automobile.picker-configs.ts          # Picker configurations
└── adapters/
    └── automobile-api.adapter.ts             # Data fetching
```
