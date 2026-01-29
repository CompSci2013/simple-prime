# Angular Component Hierarchy - Exhaustive Analysis

**File**: `Modules.md` - Tab 3: "Angular component hierarchy"

---

## Overview

This graph displays the Angular component tree—the parent-child relationships of all components rendered in the DOM. Unlike the DI graph (which shows service dependencies) or module hierarchy (which shows code organization), this graph shows **what actually appears on the screen** and **how components are nested**.

The graph uses colored nodes:
- **Green nodes**: Components that handle state management or routing
- **Blue nodes**: Presentational/dumb components that receive inputs and emit outputs
- **Arrows**: Parent → Child relationships (containment in DOM)

---

## Component Tree Structure

```
app-root (green) [Root Bootstrap Component]
│
├── app-discover (green) [Main Discovery Interface Container]
│   │
│   ├── app-query-control (blue) [Filter Control Panel]
│   │
│   ├── app-base-picker (blue) [Manufacturer/Model Selection]
│   │
│   ├── app-statistics-panel (blue) [Aggregation Statistics]
│   │   └── app-base-chart (blue) [Chart Visualization]
│   │
│   ├── app-results-table (blue) [Vehicle Results Table]
│   │
│   └── app-panel-popout (green) [Pop-Out Window Handler]
│
├── app-report (green) [Test Results Display]
│
└── app-root (green) [Alternative: Pop-Out Window Root]
    └── app-panel-popout (green) [Child: Pop-Out Content]
```

---

## Detailed Component Analysis

### 1. app-root (GREEN - State/Routing Handler)

**Classification**: Root bootstrap component

**Location**: `frontend/src/app/app.component.ts`

**Responsibilities**:
- Bootstrap point for entire Angular application
- Initialize dependency injection container
- Set up routing outlet
- Load application-wide configuration
- Validate domain configuration (via `DomainConfigValidator`)
- Display loading state if configuration is missing

**Inputs**: None (root component)

**Outputs**: Router outlet to display routed components

**State Management**:
- Manages application initialization state
- May show loading spinner before `DomainConfigRegistry` is loaded
- Routes between main features: `/discover`, `/report`, `/panel/:id`

**Template Structure**:
```html
<div class="app-container">
  <!-- Application-wide header if present -->

  <!-- Router outlet - renders routed component -->
  <router-outlet></router-outlet>

  <!-- Global error/notification container -->
  <!-- Connected to ErrorNotificationService -->
</div>
```

**Styling**: Likely dark theme (lara-dark-blue) applied globally

**Marked Green Because**:
- Handles routing (state-based)
- Initializes global configuration
- Routes drive which child components render
- Not a presentational component

---

### 2. app-discover (GREEN - State/Routing Handler)

**Classification**: Feature container component

**Location**: `frontend/src/app/features/discover/discover.component.ts`

**Responsibilities**:
- Main application interface
- Render 4 draggable/collapsible panels
- Manage panel layout (drag-drop, collapse/expand)
- Coordinate state between child panels via `UrlStateService`
- Subscribe to URL changes and update child components
- Render `<router-outlet>` for pop-out windows (or handle dynamically)

**Inputs**: None (routed component)

**Outputs**:
- Filter changes → `UrlStateService`
- Panel open/close events → may broadcast to pop-out windows

**State Management**:
- **Primary State**: `UrlStateService`
  - Filters: `{ manufacturer, model, year, bodyClass, priceRange, mileage }`
  - Pagination: `{ page, size, sort }`
  - URL parameters synchronized bidirectionally
- **Secondary State**: Panel layout (which panels visible, sizes, positions)
- **Tertiary State**: Panel collapse/expand states (may be ephemeral, not URL-persisted)

**Child Components** (Direct Children):
1. `app-query-control` - Filter input panel
2. `app-base-picker` - Manufacturer/model selection
3. `app-statistics-panel` - Aggregation charts
4. `app-results-table` - Results grid
5. `app-panel-popout` - Pop-out window manager (or separate route)

**Template Structure**:
```html
<div class="discover-container">
  <!-- PrimeNG Panel grid or custom layout -->
  <p-panel [header]="'Query Control'" [(collapsed)]="collapseState.queryControl">
    <app-query-control
      [config]="filterConfig"
      (filterChange)="onFilterChange($event)">
    </app-query-control>
  </p-panel>

  <p-panel [header]="'Picker'" [(collapsed)]="collapseState.picker">
    <app-base-picker
      [config]="pickerConfig"
      (selectionChange)="onSelectionChange($event)">
    </app-base-picker>
  </p-panel>

  <p-panel [header]="'Statistics'" [(collapsed)]="collapseState.statistics">
    <app-statistics-panel
      [data]="statisticsData"
      [config]="chartConfig">
    </app-statistics-panel>
  </p-panel>

  <p-panel [header]="'Results'" [(collapsed)]="collapseState.results">
    <app-results-table
      [data]="tableData"
      [columns]="tableColumns">
    </app-results-table>
  </p-panel>

  <!-- Pop-out handler -->
  <app-panel-popout
    [panelId]="popOutPanelId"
    (close)="onPopOutClosed()">
  </app-panel-popout>
</div>
```

**Drag-Drop Implementation**:
- Uses Angular CDK (Drag-Drop)
- Panel positions may be stored in `UrlStateService` or localStorage
- When user drags panel, position updates and may be persisted

**Panel Collapse/Expand**:
- PrimeNG `p-panel` manages collapse state
- Two-way binding: `[(collapsed)]="collapseState"`
- Collapse state may be ephemeral (lost on refresh) or persistent (in URL)

**Change Detection Strategy**: Likely `OnPush`
- Changes triggered when:
  - URL parameters change (detected by route subscription)
  - Child component events fire
  - Observables emit (via `async` pipe)

**Marked Green Because**:
- Directly tied to routing (`/discover` route)
- Manages state flow between children via `UrlStateService`
- Handles user interactions that affect URL state
- Coordinates between multiple domain features
- Not purely presentational

---

### 3. app-query-control (BLUE - Presentational)

**Classification**: Filter input panel

**Location**: `frontend/src/app/features/discover/query-control/query-control.component.ts`

**Bug Location**: **Bug #13 - Dropdown keyboard navigation broken here**

**Responsibilities**:
- Display filter input controls
- Render PrimeNG dropdowns and multiselects for:
  - Manufacturer (p-dropdown with filter) ← **Bug #13 is here**
  - Year range (p-inputNumber x 2 or p-slider)
  - Body Class (p-multiSelect) ← **Bug #7 is here**
  - Price Range (p-inputNumber x 2)
  - Search/Name text (p-inputText)
- Handle user input and emit filter changes
- Subscribe to `UrlStateService` to display current filter values
- Disable dropdowns while API request is in progress

**Inputs**:
- `filterConfig`: Filter definitions (from `DomainConfigRegistry`)
- Current filter values (from `UrlStateService` via subscription)

**Outputs**:
- `filterChange` event → Parent listens and updates `UrlStateService`
- Or directly updates `UrlStateService` (depending on implementation)

**State Management**:
- Local component state for form control values
- Reads from `UrlStateService` to populate dropdowns on load
- Updates `UrlStateService` on user input (typically debounced)

**Template Structure**:
```html
<div class="query-control-form">
  <!-- Manufacturer Dropdown -->
  <div class="form-group">
    <label>Manufacturer</label>
    <p-dropdown
      [options]="manufacturers"
      [(ngModel)]="selectedManufacturer"
      [filter]="true"
      [showToggleAll]="true"
      [editable]="true"
      (onChange)="onManufacturerChange($event)"
      placeholder="Select manufacturer">
    </p-dropdown>
  </div>

  <!-- Year Range -->
  <div class="form-group">
    <label>Year</label>
    <p-inputNumber
      [(ngModel)]="yearMin"
      (onBlur)="onYearChange()"
      placeholder="Min year">
    </p-inputNumber>
    <p-inputNumber
      [(ngModel)]="yearMax"
      (onBlur)="onYearChange()"
      placeholder="Max year">
    </p-inputNumber>
  </div>

  <!-- Body Class MultiSelect -->
  <div class="form-group">
    <label>Body Class</label>
    <p-multiSelect
      [options]="bodyClasses"
      [(ngModel)]="selectedBodyClasses"
      [showToggleAll]="true"
      [virtualScroll]="true"
      (onChange)="onBodyClassChange($event)"
      placeholder="Select body classes">
    </p-multiSelect>
  </div>

  <!-- Price Range, Mileage, etc. -->
  <!-- Similar input controls -->

  <!-- Reset Button -->
  <p-button
    label="Clear All"
    (onClick)="onClearFilters()">
  </p-button>
</div>
```

**PrimeNG Component Issues** (From Known Bugs):
1. **Bug #13** - `p-dropdown` with `[filter]="true"`:
   - Keyboard arrow keys don't highlight options
   - Enter/Space keys don't select highlighted option
   - Only mouse click works
   - Affects: Manufacturer, Model dropdowns

2. **Bug #7** - `p-multiSelect` visual state:
   - Checkboxes remain visually checked after clearing filters
   - Actual filtering works correctly
   - Only cosmetic issue
   - Affects: Body Class multiselect

**Change Detection Strategy**: `OnPush` (likely)
- Detect changes when:
  - Input properties change
  - Form value changes via user interaction
  - Observable subscriptions emit

**Marked Blue Because**:
- Receives configuration as input
- Emits user input as events
- No routing responsibility
- No global state ownership (reads from parent service)
- Presentational, logic is input → output

---

### 4. app-base-picker (BLUE - Presentational)

**Classification**: Selection/dropdown grid

**Location**: `frontend/src/app/features/discover/base-picker/base-picker.component.ts`

**Responsibilities**:
- Display available selections in paginated grid/table format
- Show manufacturer/model combinations
- Support filtering/searching within picker
- Handle selection events
- Display pagination controls
- Load data from API via `ApiService`

**Inputs**:
- `config`: Picker configuration (from `DomainConfigRegistry`)
- Current selections (from `UrlStateService`)

**Outputs**:
- `selectionChange` event → Parent updates `UrlStateService`

**State Management**:
- Local pagination state: current page, page size
- Subscriptions to `UrlStateService` for current selections
- Subscriptions to `ApiService` for available options

**Features**:
- **Pagination**: Navigate through large selection sets
- **Virtual Scroll** (optional): For very large datasets
- **Search**: Filter picker options by name
- **Multi-select**: Toggle multiple options (or single-select depending on domain)

**Data Flow**:
```
User clicks picker item
  ↓
Component emits selectionChange event
  ↓
Parent (app-discover) listens and updates UrlStateService
  ↓
URL parameters change
  ↓
URL updates in browser address bar
  ↓
All components subscribed to UrlStateService update
  ↓
app-results-table refetches data with new filters
```

**Template Structure**:
```html
<div class="picker-container">
  <!-- Search/filter input -->
  <p-inputText
    [(ngModel)]="searchTerm"
    (onInput)="onSearch($event)"
    placeholder="Search manufacturer/model">
  </p-inputText>

  <!-- Results grid or table -->
  <p-dataTable
    [value]="pickerItems"
    [rows]="10"
    [paginator]="true"
    [lazy]="true"
    [totalRecords]="totalRecords"
    (onLazyLoad)="loadData($event)">

    <p-column field="manufacturer" header="Manufacturer"></p-column>
    <p-column field="model" header="Model"></p-column>

    <!-- Selection checkbox or click handler -->
    <p-column header="Select">
      <ng-template let-row="rowData">
        <p-checkbox
          [(ngModel)]="row.selected"
          (onChange)="onItemToggle($event, row)">
        </p-checkbox>
      </ng-template>
    </p-column>
  </p-dataTable>
</div>
```

**Marked Blue Because**:
- Pure presentation of data
- Receives inputs from parent
- Emits user selections as events
- No awareness of global state
- No routing responsibility
- Logic is: load data → display → emit selection

---

### 5. app-statistics-panel (BLUE - Presentational)

**Classification**: Aggregation visualization panel

**Location**: `frontend/src/app/features/discover/statistics-panel/statistics-panel.component.ts`

**Responsibilities**:
- Display statistical aggregations of current data
- Render charts showing:
  - Manufacturer distribution
  - Body class distribution
  - Year distribution (histogram)
  - Price range distribution
  - Other computed statistics
- Update charts when filters change
- Load statistics data from API via `ApiService`
- Manage chart library integration (Plotly.js)

**Inputs**:
- `config`: Chart/statistics configuration
- Current filter values (from `UrlStateService`)

**Outputs**:
- No direct outputs (information only)
- May emit click events on chart elements (e.g., click manufacturer bar → filter)

**Data Flow**:
```
UrlStateService filter changes
  ↓
app-statistics-panel subscribed to UrlStateService
  ↓
Component detects change and calls ApiService.getStatistics(filters)
  ↓
API returns aggregation data
  ↓
Component renders charts with new data
```

**Charts Rendered** (likely):
- **Bar charts**: Manufacturer/body class counts
- **Histograms**: Year or price ranges
- **Pie charts**: Proportional distribution (optional)

**Plotly.js Integration**:
```typescript
export class StatisticsPanelComponent implements OnInit {
  @ViewChild('chartContainer') chartContainer: ElementRef;

  ngOnInit() {
    this.urlStateService.filters$.subscribe(filters => {
      this.loadStatistics(filters);
    });
  }

  loadStatistics(filters: AutoSearchFilters) {
    this.apiService.getStatistics(filters).subscribe(stats => {
      const plotData = this.transformStatisticsToPlotly(stats);
      Plotly.newPlot(this.chartContainer.nativeElement, plotData);
    });
  }

  transformStatisticsToPlotly(stats) {
    // Convert API response to Plotly format
    return [{
      x: stats.manufacturers.map(m => m.name),
      y: stats.manufacturers.map(m => m.count),
      type: 'bar',
      name: 'Manufacturers'
    }];
  }
}
```

**Cleanup** (Resource Management):
- `ResourceManagementService` unsubscribes from observables
- Plotly chart instances destroyed when component is destroyed
- Prevents memory leaks in pop-out windows

**Change Detection Strategy**: `OnPush`
- Detect changes when filter subscription emits

**Marked Blue Because**:
- Receives filter config and current filters as inputs
- No direct outputs (read-only display)
- Pure visualization of data
- No state ownership
- No routing responsibility

---

### 6. app-base-chart (BLUE - Presentational)

**Classification**: Chart visualization subcomponent

**Location**: `frontend/src/app/features/discover/statistics-panel/base-chart/base-chart.component.ts`

**Responsibilities**:
- Low-level chart rendering wrapper
- Initialize Plotly.js chart
- Handle chart library lifecycle (create, update, destroy)
- Respond to window resize events
- Emit chart interaction events (click, hover)

**Inputs**:
- `chartData`: Pre-formatted Plotly data
- `chartLayout`: Plotly layout configuration
- `chartConfig`: Custom chart behavior config

**Outputs**:
- `click` event → Parent component (statistics-panel) handles and potentially filters data

**Key Responsibility**:
```typescript
export class BaseChartComponent implements OnInit, OnDestroy {
  @Input() chartData: Plotly.Data[];
  @Input() chartLayout: Partial<Plotly.Layout>;
  @ViewChild('chartElement') chartElement: ElementRef;
  @Output() click = new EventEmitter();

  ngOnInit() {
    Plotly.newPlot(
      this.chartElement.nativeElement,
      this.chartData,
      this.chartLayout,
      { responsive: true }
    );

    // Listen for clicks
    this.chartElement.nativeElement.on('plotly_click', (data) => {
      this.click.emit(data);
    });
  }

  ngOnDestroy() {
    // Cleanup Plotly
    Plotly.purge(this.chartElement.nativeElement);
  }
}
```

**Marked Blue Because**:
- Purely presentational wrapper around Plotly
- Receives chart data and layout as inputs
- Emits user interactions as events
- No business logic
- No state management

---

### 7. app-results-table (BLUE - Presentational)

**Classification**: Data grid display

**Location**: `frontend/src/app/features/discover/results-table/results-table.component.ts`

**Responsibilities**:
- Display paginated table of vehicle results
- Render vehicle data columns (manufacturer, model, year, price, mileage, etc.)
- Handle pagination: user selects page, size
- Handle sorting: user clicks column header
- Load data from API based on current filters and pagination
- Display loading spinner while fetching
- Show "no results" message if filter returns empty
- Support row selection (checkbox per row)

**Inputs**:
- `columns`: Column definitions (from `DomainConfigRegistry`)
- Current filter values (from `UrlStateService`)
- Current pagination state (from `UrlStateService`)

**Outputs**:
- Pagination/sort changes → Update `UrlStateService`
- Row selection changes → May emit, or update service

**State Management**:
- Subscriptions to `UrlStateService` for:
  - Filters
  - Pagination state
  - Sort column and direction
- Subscriptions to `ApiService` for table data

**Data Flow**:
```
User clicks page 2
  ↓
Component emits paginationChange event
  ↓
Parent updates UrlStateService with new page
  ↓
URL updates: ?page=2&size=50
  ↓
app-results-table subscribed to pagination changes
  ↓
Component calls ApiService.search(filters, pagination)
  ↓
API returns results
  ↓
PrimeNG p-dataTable renders rows
```

**Template Structure**:
```html
<div class="results-container">
  <!-- Loading Spinner -->
  <p-progressSpinner *ngIf="isLoading"></p-progressSpinner>

  <!-- Results Table -->
  <p-dataTable
    [value]="results"
    [rows]="pageSize"
    [totalRecords]="totalRecords"
    [paginator]="true"
    [lazy]="true"
    [loading]="isLoading"
    [sortField]="sortField"
    [sortOrder]="sortOrder"
    (onLazyLoad)="onLazyLoad($event)"
    (onSort)="onSort($event)"
    (onPage)="onPage($event)">

    <!-- Checkboxes for row selection -->
    <p-tableHeaderCheckbox></p-tableHeaderCheckbox>
    <p-column selectionKey="vehicle_id">
      <ng-template let-row="rowData">
        <p-checkbox [(ngModel)]="row.selected"></p-checkbox>
      </ng-template>
    </p-column>

    <!-- Data columns -->
    <p-column field="manufacturer" header="Manufacturer" [sortable]="true"></p-column>
    <p-column field="model" header="Model" [sortable]="true"></p-column>
    <p-column field="year" header="Year" [sortable]="true"></p-column>
    <p-column field="body_class" header="Body Class"></p-column>
    <p-column field="price" header="Price" [sortable]="true"></p-column>
    <p-column field="mileage" header="Mileage" [sortable]="true"></p-column>
  </p-dataTable>

  <!-- No Results Message -->
  <div *ngIf="!isLoading && results.length === 0" class="no-results">
    No vehicles match your filters.
  </div>
</div>
```

**Pagination Logic**:
- PrimeNG `p-dataTable` with `[lazy]="true"` defers data loading to component
- Component's `onLazyLoad()` called when pagination/sort changes
- Component calls API with `{ page, size, sort }`
- API returns paginated results

**Virtual Scrolling** (Optional):
- If result set is large, use virtual scroll instead of pagination
- `scrollHeight` property on p-dataTable enables virtual scroll

**Marked Blue Because**:
- Pure presentation of table data
- Receives columns and current state as inputs
- Emits pagination/sort changes as events
- No business logic beyond data formatting
- No state ownership

---

### 8. app-panel-popout (GREEN - State/Routing Handler)

**Classification**: Pop-out window manager

**Location**: `frontend/src/app/features/discover/panel-popout/panel-popout.component.ts`

**Responsibilities**:
- Handle undocking/pop-out of individual panels into separate windows
- Open new browser window with specified panel
- Manage window lifecycle (close, resize, minimize)
- Synchronize state between main window and pop-out window via `PopOutContextService`
- Each pop-out window runs its own Angular instance
- Re-render specified panel (e.g., statistics panel in isolated window)

**Inputs**:
- `panelId`: Which panel to pop out (e.g., "statistics", "results")
- `position`: Window position/size (optional)

**Outputs**:
- `close` event → Parent (app-discover) notifies that pop-out closed

**State Management**:
- Uses `PopOutContextService` for inter-window communication
- Uses `BroadcastChannel` API to sync `UrlStateService` changes
- Each pop-out has own Angular instance (separate DI container)
- Cannot directly access parent window's services

**Window Communication Flow**:
```
Main Window                          Pop-Out Window
─────────────────────────────────────────────────────
app-discover                         app-panel-popout (root)
  ↓                                    ↓
UrlStateService (filters={...})      app-statistics-panel (or other)
  ↓                                    ↓
PopOutContextService.broadcast()     BroadcastChannel listener
  (via BroadcastChannel)              ↓
                                      UrlStateService (filters={...})
                                      ↓
                                      Charts update with new filters
```

**Implementation Pattern**:
```typescript
export class PanelPopoutComponent implements OnInit {
  @Input() panelId: string;
  @Output() close = new EventEmitter();

  private popOutWindow: Window;

  ngOnInit() {
    // Open pop-out window
    this.popOutWindow = window.open(
      `/discover?panel=${this.panelId}`,
      '_blank',
      'width=800,height=600'
    );
  }

  ngAfterViewInit() {
    // Trigger change detection in OnPush mode
    this.changeDetectorRef.detectChanges();
  }

  ngOnDestroy() {
    this.popOutWindow?.close();
    this.close.emit();
  }
}
```

**Pop-Out Window Route**:
```typescript
// In app-routing.module.ts
const routes = [
  { path: 'discover', component: DiscoverComponent },
  { path: 'discover', component: DiscoverComponent,
    children: [
      { path: '', component: PanelPopoutComponent }
    ]
  }
];
```

**Change Detection in Pop-Outs**:
- Pop-out windows use `ChangeDetectionStrategy.OnPush`
- Must call `changeDetectorRef.detectChanges()` after initialization
- Not automatic like `Default` strategy

**Marked Green Because**:
- Manages window lifecycle (open/close)
- Handles routing within pop-out window
- Coordinates with parent via service (`PopOutContextService`)
- State-aware (needs to know which panel to display)
- Not purely presentational

---

### 9. app-report (GREEN - State/Routing Handler)

**Classification**: Test results display route

**Location**: `frontend/src/app/features/report/report.component.ts`

**Route**: `/report`

**Responsibilities**:
- Display Playwright test results
- Load HTML report from `playwright-report/index.html`
- Embed report in iframe or via direct redirect
- Current implementation: Direct redirect via `window.location.href`
- Alternative (attempted in Session 12): iframe with cache-busting

**Inputs**: None (routed component)

**Outputs**: None

**State Management**: None (stateless component)

**Implementation** (Current):
```typescript
export class ReportComponent implements OnInit {
  constructor(private router: Router) {}

  ngOnInit() {
    // Redirect to static report file
    window.location.href = '/report/index.html';
  }
}
```

**Alternative Implementation** (Session 12 - Attempted):
```typescript
// Embed report in iframe with cache-busting timestamp
export class ReportComponent implements OnInit {
  reportUrl: SafeResourceUrl;

  constructor(private sanitizer: DomSanitizer) {}

  ngOnInit() {
    const timestamp = new Date().getTime();
    const url = `/report/index.html?t=${timestamp}`;
    this.reportUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }
}

// Template:
// <iframe [src]="reportUrl" class="report-frame"></iframe>
```

**Issue**: Live report updates require Angular rebuild
- See PROJECT-STATUS.md Session 12 for detailed analysis
- Root cause: Browser HTTP caching + Webpack dev-server limitations
- Solution deferred (architectural issue, low priority)

**Marked Green Because**:
- Routed component (state-driven routing)
- Handles navigation
- Not purely presentational (has initialization logic)
- Though minimal logic, classification remains consistent with other routed components

---

## Component Tree Rendering Order

When user navigates to `/discover`:

1. **app-root** renders
2. Router resolves `/discover` → **app-discover** component
3. **app-discover** initializes:
   - Subscribes to `UrlStateService`
   - Loads `DomainConfigRegistry`
   - Renders child components
4. **app-query-control** initializes
   - Loads filter definitions
   - Subscribes to `UrlStateService.filters$`
   - Renders PrimeNG dropdowns/inputs
5. **app-base-picker** initializes
   - Loads available selections
   - Sets up pagination
6. **app-statistics-panel** initializes
   - Subscribes to filters
   - Loads statistics data
   - Initializes Plotly
7. **app-base-chart** (child of statistics-panel)
   - Renders Plotly chart
8. **app-results-table** initializes
   - Loads search results
   - Renders PrimeNG data table
9. **app-panel-popout** (if present in template)
   - Waits for user to click "pop out"
   - Opens new window on demand

---

## Data Flow Through Component Tree

**User Scenario: Filter by Manufacturer**

```
User Input
  ↓
app-query-control detects dropdown change
  ↓
Component calls: this.urlStateService.setFilters({manufacturer: "Toyota"})
  ↓
UrlStateService updates internal state AND browser URL
  ↓
URL changes to: /discover?manufacturer=Toyota
  ↓
All components subscribed to UrlStateService.filters$ receive notification
  ↓
app-results-table unsubscribes, reloads with new filter
  ↓
ApiService.search({manufacturer: "Toyota"}) called
  ↓
API returns filtered results (e.g., 150 Toyota vehicles)
  ↓
app-results-table updates PrimeNG data table
  ↓
app-statistics-panel also triggered, reloads statistics
  ↓
New charts rendered showing only Toyota data distribution
  ↓
User sees updated results and charts within 200-500ms
```

---

## Component Visibility & DOM Structure

### Always Visible
- **app-root**: Always in DOM (root)
- **app-discover**: Always rendered (main route)
- **app-query-control**: Always rendered (inside app-discover)
- **app-statistics-panel**: Always rendered (unless collapsed)
- **app-base-chart**: Visible when statistics-panel not collapsed
- **app-results-table**: Always rendered (unless collapsed)
- **app-base-picker**: Always rendered (unless collapsed)

### Conditionally Visible
- **app-panel-popout**: Only when user clicks "pop out" button on a panel
- **app-report**: Only when user navigates to `/report` route

### Multiple Instances Possible
- **app-panel-popout**: Could have multiple instances
  - One statistics panel pop-out
  - One results table pop-out
  - Etc.
  - Each runs independent Angular instance

---

## Hierarchy Summary

```
app-root (ROOT)
│
├── Route: /discover
│   └── app-discover (CONTAINER)
│       ├── app-query-control (PRESENTATIONAL)
│       ├── app-base-picker (PRESENTATIONAL)
│       ├── app-statistics-panel (PRESENTATIONAL)
│       │   └── app-base-chart (PRESENTATIONAL)
│       ├── app-results-table (PRESENTATIONAL)
│       └── app-panel-popout (LIFECYCLE MANAGER)
│           └── window.open() → NEW BROWSER WINDOW
│               └── app-discover (in pop-out)
│                   └── [Specified panel component]
│
└── Route: /report
    └── app-report (ROUTING HANDLER)
```

---

## Component Communication Patterns

### Parent → Child Communication
- **Inputs**: Pass configuration, filter values, column definitions
- **Example**:
  ```typescript
  <app-query-control [filterConfig]="filterDefs"></app-query-control>
  ```

### Child → Parent Communication
- **Events (Output)**: Emit user interactions
- **Example**:
  ```typescript
  <app-query-control (filterChange)="onFilterChange($event)"></app-query-control>
  ```

### Sibling → Sibling Communication
- **Via Service (UrlStateService)**:
  ```typescript
  // Component A (app-query-control)
  this.urlStateService.setFilters(newFilters);

  // Component B (app-results-table)
  this.urlStateService.filters$.subscribe(filters => {
    this.search(filters);
  });
  ```

### Pop-Out Window Communication
- **Via BroadcastChannel API**:
  ```typescript
  // Main window (app-discover)
  this.popOutContext.broadcast('filters-changed', newFilters);

  // Pop-out window (separate Angular instance)
  this.popOutContext.onMessage('filters-changed').subscribe(filters => {
    this.updateStatistics(filters);
  });
  ```

---

## Summary

The component hierarchy shows:

**Strengths**:
- ✅ Clean parent-child relationships
- ✅ Appropriate separation of concerns (containers vs. presentational)
- ✅ Unidirectional data flow (parent → child via inputs)
- ✅ Service-based sibling communication (decoupled)
- ✅ Pop-out support through routing and BroadcastChannel

**Characteristics**:
- 📊 9 total components (3 green containers, 6 blue presentational)
- 📊 2 main routes (`/discover`, `/report`)
- 📊 4 main panels in discovery interface
- 📊 Support for dynamic pop-out windows

**Architecture Alignment**:
- Aligns with **URL-First State** pattern
- Supports **domain-agnostic framework** design
- Enables **Pop-out windows** via routing
- Maintains **OnPush change detection** strategy

**Known Issues**:
- ⚠️ Bug #13: Dropdown keyboard navigation in app-query-control
- ⚠️ Bug #7: Checkbox visual state in app-query-control multiselect
- ⚠️ Live report updates in app-report (deferred, architectural issue)

The component tree is well-structured for a production-grade discovery interface supporting vehicle data exploration, filtering, statistics, and pop-out analysis windows.
