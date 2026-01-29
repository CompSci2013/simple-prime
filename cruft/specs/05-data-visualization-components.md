# DATA VISUALIZATION COMPONENTS SPECIFICATION
## Tables, Charts, and Pickers (PrimeNG-First Approach)
### Branch: experiment/resource-management-service

**Status**: Revised - Aligned with PrimeNG-First Architecture
**Date**: 2025-11-20
**Purpose**: Specification for data visualization using PrimeNG native components

---

## EXECUTIVE SUMMARY

The application's data visualization system follows a **PrimeNG-First** architecture that leverages PrimeNG's native table capabilities instead of building custom wrapper components. This approach eliminates 1,150+ lines of unnecessary abstraction code while delivering superior functionality.

**Core Principle**: Use `<p-table>` directly with PrimeNG's built-in features. Only create custom components when PrimeNG doesn't provide the functionality.

**Key Components**:
1. **PrimeNG Table** - Used directly with native features (sorting, filtering, pagination, state persistence)
2. **BaseChartComponent** - Reusable Plotly.js container with data source pattern
3. **Chart Data Sources** - Manufacturer, Models, Year, BodyClass transformers
4. **Configuration System** - Declarative table and picker configurations

**What We DON'T Build**:
- ❌ BaseDataTableComponent (use `<p-table>` instead)
- ❌ ColumnManagerComponent (use `<p-multiSelect>` instead)
- ❌ TableStatePersistenceService (use `stateStorage="local"` instead)
- ❌ Custom filtering UI (use `<p-columnFilter>` instead)
- ❌ Custom row expansion tracking (use `expandedRowKeys` instead)

---

## TABLE OF CONTENTS

1. [PrimeNG Table Usage Patterns](#1-primeng-table-usage-patterns)
2. [Chart Components Architecture](#2-chart-components-architecture)
3. [Chart Data Sources](#3-chart-data-sources)
4. [Picker Configuration System](#4-picker-configuration-system)
5. [Observable Patterns](#5-observable-patterns)
6. [Pop-Out Window Support](#6-pop-out-window-support)
7. [Design Patterns](#7-design-patterns)
8. [Implementation Checklist](#8-implementation-checklist)

---

## 1. PRIMENG TABLE USAGE PATTERNS

### 1.1 Basic Table Setup

**Direct PrimeNG Table** (replaces BaseDataTableComponent):

```html
<p-table
  #dt
  [value]="vehicles"
  [columns]="selectedColumns"
  [paginator]="true"
  [rows]="20"
  [rowsPerPageOptions]="[10, 20, 50, 100]"
  [showCurrentPageReport]="true"
  currentPageReportTemplate="{first} - {last} of {totalRecords} vehicles"
  [globalFilterFields]="['manufacturer', 'model', 'year']"
  styleClass="p-datatable-sm"
  stateStorage="local"
  stateKey="vehicle-results-table"
  [reorderableColumns]="true"
  [resizableColumns]="true"
  columnResizeMode="expand">

  <!-- Column headers -->
  <ng-template pTemplate="header" let-columns>
    <tr>
      <th *ngFor="let col of columns"
          [pSortableColumn]="col.field"
          pReorderableColumn
          pResizableColumn>
        {{col.header}}
        <p-sortIcon [field]="col.field"></p-sortIcon>
      </th>
    </tr>
    <!-- Filter row -->
    <tr>
      <th *ngFor="let col of columns">
        <p-columnFilter
          *ngIf="col.filterable"
          type="text"
          [field]="col.field"
          display="menu">
        </p-columnFilter>
      </th>
    </tr>
  </ng-template>

  <!-- Data rows -->
  <ng-template pTemplate="body" let-vehicle let-columns="columns">
    <tr>
      <td *ngFor="let col of columns">
        {{vehicle[col.field]}}
      </td>
    </tr>
  </ng-template>
</p-table>
```

**Component Code**:
```typescript
@Component({
  selector: 'app-results-table',
  templateUrl: './results-table.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ResultsTableComponent implements OnInit {
  vehicles: VehicleResult[] = [];

  // Column definitions
  allColumns = [
    { field: 'manufacturer', header: 'Manufacturer', filterable: true },
    { field: 'model', header: 'Model', filterable: true },
    { field: 'year', header: 'Year', filterable: true },
    { field: 'bodyClass', header: 'Body Class', filterable: true },
    { field: 'count', header: 'Count', filterable: false }
  ];

  selectedColumns = this.allColumns;

  constructor(
    private stateService: VehicleResourceManagementService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.stateService.results$.subscribe(results => {
      this.vehicles = results;
      this.cdr.markForCheck();
    });
  }
}
```

**Benefits**:
- ✅ **85% less code** (25 lines vs 600+ lines of custom BaseDataTableComponent)
- ✅ **Built-in features**: sorting, filtering, pagination, state persistence
- ✅ **Native performance**: Optimized by PrimeNG team
- ✅ **Better documentation**: Official PrimeNG docs apply directly
- ✅ **Easier maintenance**: No custom code to debug

---

### 1.2 Column Management

**PrimeNG MultiSelect** (replaces ColumnManagerComponent):

```html
<!-- Column toggle -->
<p-multiSelect
  [options]="allColumns"
  [(ngModel)]="selectedColumns"
  optionLabel="header"
  selectedItemsLabel="{0} columns selected"
  placeholder="Choose Columns"
  [style]="{'width':'300px'}">
</p-multiSelect>

<!-- Table with dynamic columns -->
<p-table [value]="vehicles" [columns]="selectedColumns">
  <ng-template pTemplate="header" let-columns>
    <tr>
      <th *ngFor="let col of columns">{{col.header}}</th>
    </tr>
  </ng-template>
  <ng-template pTemplate="body" let-vehicle let-columns="columns">
    <tr>
      <td *ngFor="let col of columns">{{vehicle[col.field]}}</td>
    </tr>
  </ng-template>
</p-table>
```

**Benefits**:
- ✅ **95% less code** (10 lines vs 300+ lines of custom ColumnManagerComponent)
- ✅ **Native PrimeNG styling**: Consistent with rest of app
- ✅ **Search built-in**: PrimeNG MultiSelect has filtering
- ✅ **No drag-drop complexity**: Simple selection model

---

### 1.3 State Persistence

**PrimeNG Native State Storage** (replaces TableStatePersistenceService):

```html
<p-table
  stateStorage="local"
  stateKey="my-unique-table-id">
</p-table>
```

**What Gets Persisted Automatically**:
- ✅ Column order (if `reorderableColumns="true"`)
- ✅ Column widths (if `resizableColumns="true"`)
- ✅ Sort state
- ✅ Filter values
- ✅ Rows per page
- ✅ Current page

**Benefits**:
- ✅ **99% less code** (1 line vs 150+ lines of custom service)
- ✅ **Automatic**: No manual save/load logic
- ✅ **Reliable**: PrimeNG's tested implementation

---

### 1.4 Row Expansion

**PrimeNG Native Expansion** (replaces custom expansion tracking):

```html
<p-table
  [value]="vehicles"
  [(expandedRowKeys)]="expandedRows"
  dataKey="id">

  <ng-template pTemplate="body" let-vehicle let-expanded="expanded">
    <tr>
      <td>
        <button type="button" pButton pRipple
          [pRowToggler]="vehicle"
          [icon]="expanded ? 'pi pi-chevron-down' : 'pi pi-chevron-right'">
        </button>
      </td>
      <td>{{vehicle.manufacturer}}</td>
      <td>{{vehicle.model}}</td>
    </tr>
  </ng-template>

  <ng-template pTemplate="rowexpansion" let-vehicle>
    <tr>
      <td colspan="3">
        <div class="p-3">
          <h5>Details for {{vehicle.manufacturer}} {{vehicle.model}}</h5>
          <!-- Expanded content -->
        </div>
      </td>
    </tr>
  </ng-template>
</p-table>
```

**Component Code**:
```typescript
expandedRows: {[key: string]: boolean} = {};

expandAll(): void {
  this.expandedRows = {};
  this.vehicles.forEach(v => this.expandedRows[v.id] = true);
}

collapseAll(): void {
  this.expandedRows = {};
}
```

**Benefits**:
- ✅ **90% less code** (10 lines vs 100+ lines of custom tracking)
- ✅ **Type-safe**: Object-based expansion state
- ✅ **Built-in animations**: PrimeNG handles transitions

---

### 1.5 Advanced Filtering

**PrimeNG Column Filters**:

```html
<p-table [value]="vehicles">
  <ng-template pTemplate="header">
    <tr>
      <th>
        Manufacturer
        <p-columnFilter
          type="text"
          field="manufacturer"
          display="menu">
        </p-columnFilter>
      </th>
      <th>
        Year
        <p-columnFilter
          type="numeric"
          field="year"
          display="menu">
        </p-columnFilter>
      </th>
      <th>
        Body Class
        <p-columnFilter
          field="bodyClass"
          matchMode="in"
          display="menu"
          [showMatchModes]="false"
          [showOperator]="false"
          [showAddButton]="false">
          <ng-template pTemplate="filter" let-value let-filter="filterCallback">
            <p-multiSelect
              [ngModel]="value"
              [options]="bodyClassOptions"
              (onChange)="filter($event.value)">
            </p-multiSelect>
          </ng-template>
        </p-columnFilter>
      </th>
    </tr>
  </ng-template>
</p-table>
```

**Benefits**:
- ✅ **Built-in filter UI**: Menu overlay with operators
- ✅ **Multiple match modes**: contains, equals, startsWith, etc.
- ✅ **Custom templates**: Full control when needed
- ✅ **No custom code**: PrimeNG handles everything

---

### 1.6 Server-Side Operations

**Lazy Loading Pattern**:

```html
<p-table
  [value]="vehicles"
  [lazy]="true"
  [paginator]="true"
  [rows]="20"
  [totalRecords]="totalRecords"
  [loading]="loading"
  (onLazyLoad)="loadVehicles($event)">
</p-table>
```

**Component Code**:
```typescript
loadVehicles(event: LazyLoadEvent): void {
  this.loading = true;

  const params = {
    page: (event.first! / event.rows!) + 1,
    size: event.rows!,
    sortBy: event.sortField as string,
    sortOrder: event.sortOrder === 1 ? 'asc' : 'desc',
    filters: event.filters
  };

  this.apiService.getVehicles(params).subscribe(response => {
    this.vehicles = response.results;
    this.totalRecords = response.total;
    this.loading = false;
    this.cdr.markForCheck();
  });
}
```

**Benefits**:
- ✅ **Single event handler**: All operations trigger `onLazyLoad`
- ✅ **Comprehensive event object**: Contains sort, filter, pagination state
- ✅ **Loading indicator**: Built-in with `[loading]` binding

---

### 1.7 Selection

**Single and Multiple Selection**:

```html
<!-- Single selection -->
<p-table
  [value]="vehicles"
  [(selection)]="selectedVehicle"
  selectionMode="single"
  dataKey="id">
</p-table>

<!-- Multiple selection with checkboxes -->
<p-table
  [value]="vehicles"
  [(selection)]="selectedVehicles"
  dataKey="id">

  <ng-template pTemplate="header">
    <tr>
      <th style="width: 4rem">
        <p-tableHeaderCheckbox></p-tableHeaderCheckbox>
      </th>
      <th>Manufacturer</th>
      <th>Model</th>
    </tr>
  </ng-template>

  <ng-template pTemplate="body" let-vehicle>
    <tr>
      <td>
        <p-tableCheckbox [value]="vehicle"></p-tableCheckbox>
      </td>
      <td>{{vehicle.manufacturer}}</td>
      <td>{{vehicle.model}}</td>
    </tr>
  </ng-template>
</p-table>
```

**Component Code**:
```typescript
selectedVehicle: VehicleResult | null = null;
selectedVehicles: VehicleResult[] = [];

onSelectionChange(): void {
  // Automatically called when selection changes
  console.log('Selected:', this.selectedVehicles);
}
```

---

### 1.8 Complete Example: Results Table

**Full Implementation** (replaces 600+ lines of BaseDataTableComponent):

```typescript
@Component({
  selector: 'app-results-table',
  template: `
    <div class="card">
      <p-toolbar>
        <div class="p-toolbar-group-left">
          <h3>Vehicle Results</h3>
        </div>
        <div class="p-toolbar-group-right">
          <p-multiSelect
            [options]="allColumns"
            [(ngModel)]="selectedColumns"
            optionLabel="header"
            placeholder="Columns">
          </p-multiSelect>
        </div>
      </p-toolbar>

      <p-table
        #dt
        [value]="vehicles"
        [columns]="selectedColumns"
        [paginator]="true"
        [rows]="20"
        [rowsPerPageOptions]="[10, 20, 50, 100]"
        [showCurrentPageReport]="true"
        [globalFilterFields]="['manufacturer', 'model', 'year']"
        stateStorage="local"
        stateKey="vehicle-results-table"
        [reorderableColumns]="true"
        [resizableColumns]="true"
        [(expandedRowKeys)]="expandedRows"
        dataKey="id">

        <ng-template pTemplate="header" let-columns>
          <tr>
            <th style="width: 4rem"></th>
            <th *ngFor="let col of columns"
                [pSortableColumn]="col.field"
                pReorderableColumn>
              {{col.header}}
              <p-sortIcon [field]="col.field"></p-sortIcon>
            </th>
          </tr>
          <tr>
            <th></th>
            <th *ngFor="let col of columns">
              <p-columnFilter
                *ngIf="col.filterable"
                type="text"
                [field]="col.field">
              </p-columnFilter>
            </th>
          </tr>
        </ng-template>

        <ng-template pTemplate="body" let-vehicle let-columns="columns" let-expanded="expanded">
          <tr>
            <td>
              <button type="button" pButton pRipple
                [pRowToggler]="vehicle"
                [icon]="expanded ? 'pi pi-chevron-down' : 'pi pi-chevron-right'">
              </button>
            </td>
            <td *ngFor="let col of columns">{{vehicle[col.field]}}</td>
          </tr>
        </ng-template>

        <ng-template pTemplate="rowexpansion" let-vehicle>
          <tr>
            <td [attr.colspan]="selectedColumns.length + 1">
              <div class="p-3">
                <h5>Vehicle Details</h5>
                <p><strong>VIN:</strong> {{vehicle.vin}}</p>
                <p><strong>Data Source:</strong> {{vehicle.dataSource}}</p>
              </div>
            </td>
          </tr>
        </ng-template>
      </p-table>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ResultsTableComponent implements OnInit {
  vehicles: VehicleResult[] = [];
  expandedRows: {[key: string]: boolean} = {};

  allColumns = [
    { field: 'manufacturer', header: 'Manufacturer', filterable: true },
    { field: 'model', header: 'Model', filterable: true },
    { field: 'year', header: 'Year', filterable: true },
    { field: 'bodyClass', header: 'Body Class', filterable: true },
    { field: 'count', header: 'Count', filterable: false }
  ];

  selectedColumns = this.allColumns;

  constructor(
    private stateService: VehicleResourceManagementService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.stateService.results$.subscribe(results => {
      this.vehicles = results;
      this.cdr.markForCheck();
    });
  }
}
```

**Total Lines**: ~70 (vs 600+ for custom BaseDataTableComponent)
**Code Reduction**: **88%**

---

## 2. CHART COMPONENTS ARCHITECTURE

### 2.1 Composition Pattern

```
BaseChartComponent (Plotly.js container)
  ↓ (uses)
ChartDataSource (abstract transformer)
  ↓ (implemented by)
[ManufacturerChartDataSource, ModelsChartDataSource, YearChartDataSource, BodyClassChartDataSource]
  ↓ (wrapped by)
[ManufacturerChartComponent, ModelsChartComponent, YearChartComponent, BodyClassChartComponent]
```

**Note**: Chart components are KEPT because PrimeNG's chart library (p-chart) doesn't provide the same level of interactivity and customization as Plotly.js. This is a valid abstraction.

---

### 2.2 BaseChartComponent

**Location**: `shared/components/base-chart/`
**Purpose**: Reusable Plotly.js chart container

**Inputs**:
```typescript
@Input() dataSource!: ChartDataSource;
@Input() statistics: VehicleStatistics | null = null;
@Input() highlights: HighlightFilters = {};
@Input() selectedValue: string | null = null;
```

**Output**:
```typescript
@Output() chartClick = new EventEmitter<{
  value: string;
  isHighlightMode: boolean;
}>();
```

**Features**:
- **Highlight Mode**: Hold 'h' key to enable highlight mode
- **Resize Handling**: Window resize → `Plotly.Plots.resize()`
- **Pop-Out Support**: Extra resize with delay for layout
- **Click Routing**: Forward clicks to parent component

**Highlight Mode**:
```typescript
@HostListener('document:keydown.h')
onHighlightKeyDown(): void {
  this.isHighlightModeActive = true;
}

@HostListener('document:keyup.h')
onHighlightKeyUp(): void {
  this.isHighlightModeActive = false;
}
```

---

### 2.3 ChartDataSource Abstract Class

```typescript
abstract class ChartDataSource {
  abstract transform(
    statistics: VehicleStatistics | null,
    highlights: HighlightFilters,
    selectedValue: string | null,
    containerWidth: number
  ): ChartData | null;

  abstract getTitle(): string;
  abstract handleClick(event: any): string | null;
}

interface ChartData {
  traces: Plotly.Data[];
  layout: Partial<Plotly.Layout>;
  clickData?: any;
}
```

**Benefits**:
- Data transformation abstraction
- Testable in isolation
- Type-safe data flow
- Reusable across chart types

---

### 2.4 Concrete Chart Components

All follow same pattern:

```typescript
@Component({
  selector: 'app-manufacturer-chart',
  template: `
    <app-base-chart
      [dataSource]="dataSource"
      [statistics]="statistics"
      [highlights]="highlights"
      [selectedValue]="selectedValue"
      (chartClick)="onChartClick($event)">
    </app-base-chart>
  `
})
export class ManufacturerChartComponent {
  dataSource = new ManufacturerChartDataSource();
  statistics: VehicleStatistics | null = null;
  highlights: HighlightFilters = {};
  selectedValue: string | null = null;

  constructor(
    private stateService: VehicleResourceManagementService,
    private urlParamService: UrlParamService,
    private popOutContext: PopOutContextService
  ) {}

  ngOnInit(): void {
    this.stateService.statistics$.subscribe(stats => {
      this.statistics = stats;
    });

    this.stateService.highlights$.subscribe(highlights => {
      this.highlights = highlights;
    });
  }

  onChartClick(event: {value: string, isHighlightMode: boolean}): void {
    if (event.isHighlightMode) {
      this.urlParamService.setHighlightParam('manufacturer', event.value);
    } else {
      if (this.popOutContext.isInPopOut()) {
        this.popOutContext.sendMessage({
          type: 'set-manufacturer-filter',
          payload: {manufacturer: event.value}
        });
      } else {
        this.stateService.updateFilters({manufacturer: event.value});
      }
    }
  }
}
```

---

### 2.5 Chart Types

#### ManufacturerChartComponent

**Data**: `statistics.byManufacturer`
**Format**: Legacy `{name: count}` or Segmented `{name: {total, highlighted}}`
**Chart Type**: Horizontal bar chart (top 20)
**Click**: Set `manufacturer` filter or highlight

#### ModelsChartComponent

**Data**: `statistics.modelsByManufacturer`
**Filters**: By selected manufacturer
**Chart Type**: Bar chart (top 20 models)
**Click**: Set `modelCombos` filter or highlight

#### YearChartComponent

**Data**: `statistics.byYearRange`
**Chart Type**: Bar chart with linear x-axis
**Ticks**: Every 5 years
**Click**: Single year → both yearMin/Max, Box select → range

#### BodyClassChartComponent

**Data**: `statistics.byBodyClass`
**Chart Type**: Bar chart (top 15)
**Click**: Set `bodyClass` filter or highlight

---

## 3. CHART DATA SOURCES

### 3.1 Data Source Implementations

Each chart has dedicated data source:
- `ManufacturerChartDataSource`
- `ModelsChartDataSource`
- `YearChartDataSource`
- `BodyClassChartDataSource`

**Common Pattern**:
```typescript
transform(
  statistics: VehicleStatistics | null,
  highlights: HighlightFilters,
  selectedValue: string | null,
  containerWidth: number
): ChartData | null {
  if (!statistics) return null;

  // Extract data from statistics
  const data = this.extractData(statistics);

  // Apply highlights (segmented bars)
  const traces = this.createTraces(data, highlights);

  // Create layout (title, axes, colors)
  const layout = this.createLayout(containerWidth);

  return { traces, layout };
}
```

---

## 4. PICKER CONFIGURATION SYSTEM

### 4.1 Overview

Pickers use **PrimeNG Table directly** with a configuration-driven approach. The `BasePicker` component is a thin configuration wrapper around `<p-table>`, NOT a custom table implementation.

### 4.2 PickerConfig<T>

**Location**: `shared/models/picker-config.model.ts`
**Purpose**: Configuration for picker behavior

```typescript
interface PickerConfig<T = any> {
  id: string;
  displayName: string;
  columns: ColumnConfig[];        // Simple column definitions for p-table
  api: PickerApiConfig<T>;
  row: PickerRowConfig<T>;
  selection: PickerSelectionConfig<T>;
  pagination: PickerPaginationConfig;
  caching?: PickerCachingConfig;
}
```

**Key Difference from Old Spec**:
- ❌ OLD: Custom TableColumn<T> with complex filtering/sorting configs
- ✅ NEW: Simple column definitions, let PrimeNG handle features

---

### 4.3 Column Configuration

**Simple Column Config**:
```typescript
interface ColumnConfig {
  field: string;
  header: string;
  sortable?: boolean;
  filterable?: boolean;
  width?: string;
}
```

**Example**:
```typescript
columns: [
  { field: 'manufacturer', header: 'Manufacturer', sortable: true, filterable: true },
  { field: 'model', header: 'Model', sortable: true, filterable: true },
  { field: 'count', header: 'Count', sortable: true }
]
```

---

### 4.4 Picker Template

**BasePicker uses PrimeNG Table**:

```html
<!-- Inside BasePicker component template -->
<p-table
  [value]="data"
  [(selection)]="selectedRows"
  dataKey="{{config.row.keyGenerator}}"
  [paginator]="true"
  [rows]="config.pagination.defaultPageSize"
  stateStorage="local"
  [stateKey]="'picker-' + config.id">

  <ng-template pTemplate="header">
    <tr>
      <th style="width: 4rem">
        <p-tableHeaderCheckbox></p-tableHeaderCheckbox>
      </th>
      <th *ngFor="let col of config.columns" [pSortableColumn]="col.field">
        {{col.header}}
        <p-sortIcon [field]="col.field"></p-sortIcon>
      </th>
    </tr>
  </ng-template>

  <ng-template pTemplate="body" let-row>
    <tr>
      <td>
        <p-tableCheckbox [value]="row"></p-tableCheckbox>
      </td>
      <td *ngFor="let col of config.columns">{{row[col.field]}}</td>
    </tr>
  </ng-template>
</p-table>
```

**Benefits**:
- ✅ Uses native PrimeNG selection
- ✅ Built-in state persistence
- ✅ Native sorting/filtering
- ✅ Minimal custom code (~50 lines vs 300+)

---

### 4.5 Picker Configuration Examples

**Simple VIN Picker**:
```typescript
{
  id: 'vin-picker',
  displayName: 'VIN Picker',
  columns: [
    { field: 'vin', header: 'VIN', sortable: true, filterable: true },
    { field: 'manufacturer', header: 'Manufacturer', filterable: true },
    { field: 'model', header: 'Model', filterable: true },
    { field: 'year', header: 'Year', sortable: true }
  ],
  row: {
    keyGenerator: (row) => row.vin,
    keyParser: (key) => ({vin: key})
  },
  selection: {
    urlParam: 'selectedVins',
    serializer: (items) => items.map(i => i.vin).join(','),
    deserializer: (url) => url.split(',').map(vin => ({vin}))
  },
  pagination: {
    mode: 'client',
    defaultPageSize: 20
  }
}
```

**Composite Manufacturer-Model Picker**:
```typescript
{
  id: 'manufacturer-model-picker',
  displayName: 'Manufacturer-Model Picker',
  columns: [
    { field: 'manufacturer', header: 'Manufacturer', sortable: true },
    { field: 'model', header: 'Model', sortable: true },
    { field: 'count', header: 'Count', sortable: true }
  ],
  row: {
    keyGenerator: (row) => `${row.manufacturer}|${row.model}`,
    keyParser: (key) => {
      const [m, mo] = key.split('|');
      return {manufacturer: m, model: mo};
    }
  },
  selection: {
    urlParam: 'modelCombos',
    serializer: (items) =>
      items.map(i => `${i.manufacturer}:${i.model}`).join(','),
    deserializer: (url) => url.split(',').map(pair => {
      const [m, mo] = pair.split(':');
      return {manufacturer: m, model: mo};
    })
  },
  pagination: {
    mode: 'client',
    defaultPageSize: 20
  }
}
```

---

## 5. OBSERVABLE PATTERNS

### 5.1 Chart Rendering Flow

```
BaseChartComponent input changes
  ↓
ngOnChanges()
  ↓
renderChart()
  ↓
dataSource.transform(...)
  ↓
chartData = {traces, layout}
  ↓
Plotly.react(el, traces, layout, config)
  ↓
Chart rendered
  ↓
Click handlers attached
```

### 5.2 Highlight Mode Flow

```
User presses 'h' key
  ↓
isHighlightModeActive = true
  ↓
User clicks chart element
  ↓
chartClick.emit({value, isHighlightMode: true})
  ↓
Parent sets h_* URL param
  ↓
Components subscribed to highlights$
  ↓
Receive new highlights
  ↓
Charts re-render with highlights
```

---

## 6. POP-OUT WINDOW SUPPORT

### 6.1 Detection

```typescript
if (this.popOutContext.isInPopOut()) {
  // In pop-out window
  this.popOutContext.sendMessage({...});
} else {
  // In main window
  this.stateService.updateFilters({...});
}
```

### 6.2 Chart in Pop-Out

**Normal Mode**: Charts informational (no action)
**Pop-Out Mode**: Charts send messages to main window

```typescript
onChartClick(event): void {
  if (event.isHighlightMode) {
    // Always works (URL-based)
    this.urlParamService.setHighlightParam(...);
  } else if (this.popOutContext.isInPopOut()) {
    // Send to main window
    this.popOutContext.sendMessage({
      type: 'set-manufacturer-filter',
      payload: {manufacturer: event.value}
    });
  } else {
    // Update directly
    this.stateService.updateFilters(...);
  }
}
```

### 6.3 Picker in Pop-Out

```typescript
onApply(): void {
  if (this.popOutContext.isInPopOut()) {
    this.popOutContext.sendMessage({
      type: 'PICKER_SELECTION_CHANGE',
      payload: {configId, urlParam, urlValue}
    });
  } else {
    this.urlParamService.updateParam(urlParam, urlValue);
  }
}
```

---

## 7. DESIGN PATTERNS

### 7.1 Core Principles

1. **PrimeNG-First** - Use native PrimeNG components, don't wrap them
2. **Configuration Over Code** - Declarative configs for pickers/tables
3. **Composition for Charts** - BaseChart + DataSource pattern (valid abstraction)
4. **Observable/Reactive** - RxJS throughout
5. **OnPush Change Detection** - Performance optimization
6. **URL-First** - URL as source of truth
7. **Pop-Out Awareness** - `isInPopOut()` conditional behavior

### 7.2 When to Create Custom Components

✅ **DO create custom components when**:
- PrimeNG doesn't provide the functionality (e.g., Plotly.js charts)
- You need domain-specific business logic (e.g., chart click handling)
- Configuration-driven patterns reduce duplication

❌ **DON'T create custom components when**:
- PrimeNG already has the feature (tables, dialogs, menus)
- You're just wrapping PrimeNG with no added value
- The abstraction adds complexity without clear benefit

---

## 8. IMPLEMENTATION CHECKLIST

### 8.1 When Creating a New Table

- [ ] Use `<p-table>` directly, not a wrapper component
- [ ] Add `stateStorage="local"` for persistence
- [ ] Use `<p-columnFilter>` for filtering
- [ ] Use `[reorderableColumns]="true"` for drag-drop
- [ ] Use `<p-multiSelect>` for column visibility
- [ ] Use `[(expandedRowKeys)]` for row expansion
- [ ] Add `OnPush` change detection
- [ ] Subscribe to state service observables
- [ ] Handle pop-out mode if applicable

### 8.2 When Creating a New Chart

- [ ] Create a `ChartDataSource` implementation
- [ ] Implement `transform()` method
- [ ] Create component that uses `BaseChartComponent`
- [ ] Subscribe to `statistics$` and `highlights$`
- [ ] Implement `onChartClick()` handler
- [ ] Add highlight mode support (h key)
- [ ] Handle pop-out mode
- [ ] Add resize handling

### 8.3 When Creating a New Picker

- [ ] Define `PickerConfig<T>` with simple columns
- [ ] Implement `keyGenerator` and `keyParser`
- [ ] Implement `serializer` and `deserializer`
- [ ] Use `<p-table>` with selection in template
- [ ] Add `stateStorage="local"` for persistence
- [ ] Subscribe to URL state for hydration
- [ ] Handle pop-out mode
- [ ] Add OnPush change detection

---

## 9. MIGRATION FROM OLD SPECS

### 9.1 Code Removals

**DELETE these components** (per plan/01-OVER-ENGINEERED-FEATURES.md):
- ❌ `BaseDataTableComponent<T>` (~600 lines)
- ❌ `ColumnManagerComponent` (~300 lines)
- ❌ `TableStatePersistenceService` (~150 lines)
- ❌ Custom row expansion tracking (~100 lines)
- ❌ Custom filtering infrastructure (~200 lines)

**Total Lines Removed**: ~1,350 lines

### 9.2 Code Replacements

| Old Approach | New Approach | Lines Saved |
|--------------|--------------|-------------|
| BaseDataTableComponent | `<p-table>` directly | ~550 |
| ColumnManagerComponent | `<p-multiSelect>` | ~290 |
| TableStatePersistenceService | `stateStorage="local"` | ~149 |
| Custom row expansion | `[(expandedRowKeys)]` | ~90 |
| Custom filtering UI | `<p-columnFilter>` | ~180 |

**Total Code Reduction**: **~1,259 lines (85%)**

### 9.3 What We Keep

✅ **Chart Components** (valid abstraction):
- BaseChartComponent
- ChartDataSource pattern
- Concrete chart components

✅ **State Management** (truly generic):
- ResourceManagementService
- URL-first architecture
- Observable patterns

✅ **Configuration System** (reduces duplication):
- PickerConfig
- Declarative column definitions

---

**End of Specification**
