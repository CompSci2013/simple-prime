# Revised Architecture - PrimeNG-First Approach
## Clean Domain-Agnostic Framework Using PrimeNG Table

**Date**: 2025-11-20
**Principle**: Use PrimeNG for UI, build only configuration layer

---

## Architecture Overview

### Three-Layer Design (Simplified)

```
┌──────────────────────────────────────────────────────────────┐
│ Layer 1: PrimeNG Table (UI Foundation)                       │
│                                                               │
│  <p-table                                                    │
│    [value]="data"                                            │
│    [reorderableColumns]="true"                               │
│    stateStorage="local"                                      │
│    [(expandedRowKeys)]="expandedRows"                        │
│    [paginator]="true"                                        │
│    [lazy]="true"                                             │
│    (onLazyLoad)="loadData($event)">                          │
│  </p-table>                                                  │
│                                                               │
│  ✅ No custom table component                                │
│  ✅ No column manager component                              │
│  ✅ No state persistence service                             │
└──────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────┐
│ Layer 2: Generic Framework (Domain-Agnostic)                 │
│                                                               │
│ ┌────────────────────────────────────────────────────────┐  │
│ │ URL-First State Management                             │  │
│ │  - ResourceManagementService<TFilters, TData>         │  │
│ │  - FilterUrlMapperService                              │  │
│ │  - RequestCoordinatorService                           │  │
│ └────────────────────────────────────────────────────────┘  │
│                                                               │
│ ┌────────────────────────────────────────────────────────┐  │
│ │ Configuration System                                    │  │
│ │  - DomainConfig<TFilters, TData, TStats>              │  │
│ │  - TableConfig<T> (PrimeNG column defs)               │  │
│ │  - PickerConfig<T>                                     │  │
│ └────────────────────────────────────────────────────────┘  │
│                                                               │
│ ┌────────────────────────────────────────────────────────┐  │
│ │ Multi-Window System                                     │  │
│ │  - PopOutContextService                                │  │
│ │  - BroadcastChannel coordination                       │  │
│ └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────┐
│ Layer 3: Domain Configuration (Domain-Specific)              │
│                                                               │
│  Automobile Domain                                           │
│  ├─ automobile.filters.ts (SearchFilters interface)         │
│  ├─ automobile.table-config.ts (PrimeNG columns)            │
│  ├─ automobile.adapters.ts (API adapters)                   │
│  └─ automobile.domain-config.ts (DomainConfig)              │
│                                                               │
│  Agriculture Domain (future)                                 │
│  ├─ agriculture.filters.ts                                   │
│  ├─ agriculture.table-config.ts                              │
│  ├─ agriculture.adapters.ts                                  │
│  └─ agriculture.domain-config.ts                             │
└──────────────────────────────────────────────────────────────┘
```

---

## Component Structure (Simplified)

### Old Approach (Wrong)

```
src/app/
├── shared/components/
│   ├── base-data-table/          ← 600 lines DELETED
│   │   ├── base-data-table.component.ts
│   │   ├── base-data-table.component.html
│   │   └── base-data-table.component.scss
│   ├── column-manager/           ← 300 lines DELETED
│   │   ├── column-manager.component.ts
│   │   ├── column-manager.component.html
│   │   └── column-manager.component.scss
│   └── (many more custom components...)
```

### New Approach (Correct)

```
src/app/
├── framework/                     ← Domain-agnostic
│   ├── services/
│   │   ├── resource-management.service.ts    (Keep - URL-first state)
│   │   ├── filter-url-mapper.service.ts      (Keep - URL serialization)
│   │   ├── request-coordinator.service.ts    (Keep - caching)
│   │   └── popout-context.service.ts         (Keep - multi-window)
│   ├── models/
│   │   ├── domain-config.interface.ts        (NEW - configuration schema)
│   │   ├── table-config.interface.ts         (NEW - PrimeNG wrapper)
│   │   └── picker-config.interface.ts        (Keep - picker configuration)
│   └── components/
│       ├── discover/                          (Keep - panel orchestration)
│       │   ├── discover.component.ts
│       │   └── discover.component.html       (Uses <p-table> directly)
│       └── panel-popout/                      (Keep - pop-out container)
│
├── domain-config/                 ← Domain-specific
│   ├── automobile/
│   │   ├── models/
│   │   │   ├── automobile.filters.ts
│   │   │   ├── automobile.data.ts
│   │   │   └── automobile.statistics.ts
│   │   ├── adapters/
│   │   │   ├── automobile-api.adapter.ts
│   │   │   └── automobile-url.mapper.ts
│   │   └── configs/
│   │       ├── automobile.table-config.ts
│   │       ├── automobile.picker-configs.ts
│   │       └── automobile.domain-config.ts
│   └── (future domains...)
│
└── app.module.ts                  (Wires framework + domain)
```

---

## Key Interfaces

### 1. DomainConfig<TFilters, TData, TStats>

**Purpose**: Complete domain configuration

```typescript
interface DomainConfig<TFilters, TData, TStats> {
  // Domain identity
  domainName: string;
  domainLabel: string;

  // API configuration
  apiBaseUrl: string;

  // Type models
  filterModel: Type<TFilters>;
  dataModel: Type<TData>;
  statisticsModel: Type<TStats>;

  // Adapters
  apiAdapter: IApiAdapter<TFilters, TData, TStats>;
  urlMapper: IFilterUrlMapper<TFilters>;
  cacheKeyBuilder: ICacheKeyBuilder<TFilters>;

  // UI Configuration
  tableConfig: TableConfig<TData>;
  pickers: PickerConfig<any>[];
  filters: FilterDefinition<any>[];
  charts: ChartConfig[];

  // Feature flags
  features: {
    highlights: boolean;
    popOuts: boolean;
    rowExpansion: boolean;
  };
}
```

---

### 2. TableConfig<T> (PrimeNG Wrapper)

**Purpose**: Configure PrimeNG Table for a domain

```typescript
interface TableConfig<T> {
  // Table identity
  tableId: string;
  stateKey: string;

  // PrimeNG column definitions
  columns: PrimeNGColumn<T>[];

  // Row configuration
  dataKey: string;                    // Unique row identifier
  expandable: boolean;
  selectable: boolean;
  selectionMode?: 'single' | 'multiple';

  // Pagination
  paginator: boolean;
  rows: number;
  rowsPerPageOptions: number[];

  // Lazy loading
  lazy: boolean;

  // State
  stateStorage: 'local' | 'session' | null;

  // Styling
  styleClass?: string;
  responsiveLayout?: 'scroll' | 'stack';
}

interface PrimeNGColumn<T> {
  field: keyof T;                     // Property name
  header: string;                     // Display header
  sortable?: boolean;
  filterable?: boolean;
  filterMatchMode?: string;
  reorderable?: boolean;
  resizable?: boolean;
  frozen?: boolean;
  width?: string;
  styleClass?: string;
  bodyTemplate?: TemplateRef<any>;    // Custom cell template
  headerTemplate?: TemplateRef<any>;  // Custom header template
}
```

---

### 3. Automobile Domain Example

**automobile.table-config.ts**:

```typescript
import { TableConfig } from '@/framework/models/table-config.interface';
import { VehicleResult } from './automobile.data';

export const AUTOMOBILE_TABLE_CONFIG: TableConfig<VehicleResult> = {
  tableId: 'automobile-vehicles',
  stateKey: 'auto-vehicles-state',

  columns: [
    {
      field: 'manufacturer',
      header: 'Manufacturer',
      sortable: true,
      filterable: true,
      filterMatchMode: 'contains',
      reorderable: true,
      width: '150px'
    },
    {
      field: 'model',
      header: 'Model',
      sortable: true,
      filterable: true,
      filterMatchMode: 'contains',
      reorderable: true,
      width: '150px'
    },
    {
      field: 'year',
      header: 'Year',
      sortable: true,
      filterable: true,
      filterMatchMode: 'equals',
      reorderable: true,
      width: '100px'
    },
    {
      field: 'body_class',
      header: 'Body Class',
      sortable: true,
      filterable: true,
      reorderable: true,
      width: '120px'
    },
    {
      field: 'instance_count',
      header: 'VIN Count',
      sortable: true,
      filterable: false,
      reorderable: true,
      width: '100px'
    }
  ],

  dataKey: 'vehicle_id',
  expandable: true,
  selectable: false,

  paginator: true,
  rows: 20,
  rowsPerPageOptions: [10, 20, 50, 100],

  lazy: true,

  stateStorage: 'local',
  styleClass: 'p-datatable-striped p-datatable-gridlines',
  responsiveLayout: 'scroll'
};
```

---

## Template Pattern (Discover Component)

**discover.component.html** (simplified):

```html
<!-- Direct PrimeNG Table usage - NO custom wrapper component -->
<p-table
  #dt
  [value]="(data$ | async) || []"
  [columns]="tableConfig.columns"
  [dataKey]="tableConfig.dataKey"
  [reorderableColumns]="true"
  [resizableColumns]="true"
  [(expandedRowKeys)]="expandedRows"
  [paginator]="tableConfig.paginator"
  [rows]="tableConfig.rows"
  [rowsPerPageOptions]="tableConfig.rowsPerPageOptions"
  [totalRecords]="totalRecords$ | async"
  [lazy]="tableConfig.lazy"
  [loading]="loading$ | async"
  stateStorage="local"
  [stateKey]="tableConfig.stateKey"
  [styleClass]="tableConfig.styleClass"
  [responsiveLayout]="tableConfig.responsiveLayout"
  (onLazyLoad)="onLazyLoad($event)"
  (onColReorder)="onColumnReorder($event)">

  <!-- Header with filters -->
  <ng-template pTemplate="header" let-columns>
    <tr>
      <th *ngFor="let col of columns"
          [pSortableColumn]="col.sortable ? col.field : null"
          [pReorderableColumn]="col.field"
          [pResizableColumn]="col.field"
          [ngStyle]="{'width': col.width}">
        {{col.header}}
        <p-sortIcon *ngIf="col.sortable" [field]="col.field"></p-sortIcon>
      </th>
    </tr>
    <tr>
      <th *ngFor="let col of columns">
        <p-columnFilter
          *ngIf="col.filterable"
          type="text"
          [field]="col.field"
          [matchMode]="col.filterMatchMode || 'contains'">
        </p-columnFilter>
      </th>
    </tr>
  </ng-template>

  <!-- Body with expansion -->
  <ng-template pTemplate="body" let-rowData let-columns="columns" let-expanded="expanded">
    <tr>
      <td *ngFor="let col of columns">
        <!-- Expansion toggle for first column -->
        <button
          *ngIf="col.field === columns[0].field && tableConfig.expandable"
          type="button"
          pButton
          pRipple
          [pRowToggler]="rowData"
          [icon]="expanded ? 'pi pi-chevron-down' : 'pi pi-chevron-right'">
        </button>

        <!-- Cell content -->
        <ng-container *ngIf="!col.bodyTemplate">
          {{rowData[col.field]}}
        </ng-container>
        <ng-container *ngIf="col.bodyTemplate"
                      [ngTemplateOutlet]="col.bodyTemplate"
                      [ngTemplateOutletContext]="{$implicit: rowData}">
        </ng-container>
      </td>
    </tr>
  </ng-template>

  <!-- Row expansion content -->
  <ng-template pTemplate="rowexpansion" let-rowData>
    <tr>
      <td [attr.colspan]="tableConfig.columns.length">
        <!-- VIN instances table -->
        <app-vin-instances-table [vehicleId]="rowData.vehicle_id">
        </app-vin-instances-table>
      </td>
    </tr>
  </ng-template>

  <!-- Empty message -->
  <ng-template pTemplate="emptymessage">
    <tr>
      <td [attr.colspan]="tableConfig.columns.length">
        No vehicles found.
      </td>
    </tr>
  </ng-template>
</p-table>

<!-- Column toggle -->
<p-multiSelect
  [options]="tableConfig.columns"
  [(ngModel)]="visibleColumns"
  optionLabel="header"
  placeholder="Choose Columns"
  display="chip">
</p-multiSelect>
```

---

## Component Code (Discover)

**discover.component.ts** (simplified):

```typescript
@Component({
  selector: 'app-discover',
  templateUrl: './discover.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DiscoverComponent implements OnInit, OnDestroy {
  // Configuration (injected from domain config)
  tableConfig: TableConfig<VehicleResult>;

  // Observable data streams (from ResourceManagementService)
  data$: Observable<VehicleResult[]>;
  loading$: Observable<boolean>;
  totalRecords$: Observable<number>;

  // PrimeNG state (minimal)
  expandedRows: {[key: string]: boolean} = {};
  visibleColumns: PrimeNGColumn<VehicleResult>[];

  constructor(
    @Inject(DOMAIN_CONFIG) private domainConfig: DomainConfig<any, any, any>,
    private stateService: ResourceManagementService<SearchFilters, VehicleResult>,
    private cdr: ChangeDetectorRef
  ) {
    this.tableConfig = domainConfig.tableConfig;
    this.visibleColumns = [...this.tableConfig.columns];
  }

  ngOnInit(): void {
    // Subscribe to state observables
    this.data$ = this.stateService.results$;
    this.loading$ = this.stateService.loading$;
    this.totalRecords$ = this.stateService.totalResults$;
  }

  onLazyLoad(event: LazyLoadEvent): void {
    // PrimeNG lazy load event contains:
    // - event.first (offset)
    // - event.rows (page size)
    // - event.sortField
    // - event.sortOrder
    // - event.filters

    const filters: Partial<SearchFilters> = {
      page: (event.first / event.rows) + 1,
      size: event.rows,
      sort: event.sortField,
      sortDirection: event.sortOrder === 1 ? 'asc' : 'desc',
      // Extract filter values from event.filters
      ...this.extractFilters(event.filters)
    };

    this.stateService.updateFilters(filters);
  }

  onColumnReorder(event: {columns: any[]}): void {
    // PrimeNG handles the reorder, we just update our config
    this.tableConfig.columns = event.columns;
    this.cdr.markForCheck();
  }

  private extractFilters(primeNGFilters: any): Partial<SearchFilters> {
    // Convert PrimeNG filter format to domain filter format
    const filters: Partial<SearchFilters> = {};

    if (primeNGFilters.manufacturer) {
      filters.manufacturerSearch = primeNGFilters.manufacturer.value;
    }
    if (primeNGFilters.model) {
      filters.modelSearch = primeNGFilters.model.value;
    }
    // etc...

    return filters;
  }
}
```

---

## State Flow (Unchanged from Original)

The URL-first state management remains the same:

```
User interacts with table (sort/filter/page)
  ↓
PrimeNG emits (onLazyLoad) event
  ↓
Component extracts filter changes
  ↓
stateService.updateFilters(partial)
  ↓
FilterUrlMapper.filtersToParams()
  ↓
Router.navigate([], {queryParams})
  ↓
URL updates
  ↓
ResourceManagementService detects URL change
  ↓
API call via RequestCoordinator
  ↓
results$ emits new data
  ↓
PrimeNG table re-renders
```

---

## Code Comparison

### Before (Wrong)

**BaseDataTableComponent**: 600 lines
**ColumnManagerComponent**: 300 lines
**TableStatePersistenceService**: 150 lines
**Row expansion logic**: 100 lines
**Total**: ~1,150 lines of custom table code

### After (Correct)

**Discover component template**: ~100 lines (PrimeNG configuration)
**Discover component class**: ~80 lines (event handlers)
**TableConfig interface**: ~50 lines (type definitions)
**Total**: ~230 lines

**Reduction**: **80% less code!**

---

## Benefits

1. ✅ **Less code** - 80% reduction
2. ✅ **Less testing** - Test domain logic, not PrimeNG
3. ✅ **Leverage PrimeNG** - Bug fixes and updates for free
4. ✅ **Better docs** - Use PrimeNG documentation
5. ✅ **Community support** - Stack Overflow answers for PrimeNG
6. ✅ **Faster development** - Configure, don't code
7. ✅ **Easier maintenance** - Less custom code to maintain

---

## Migration Path

For existing code:

1. **Delete** `BaseDataTableComponent`
2. **Delete** `ColumnManagerComponent`
3. **Delete** `TableStatePersistenceService`
4. **Replace** `<app-base-data-table>` with `<p-table>`
5. **Move** column definitions to `TableConfig`
6. **Bind** PrimeNG events to state service
7. **Test** - Should work with less code

---

**Next**: Read `04-REVISED-FRAMEWORK-MILESTONES.md` for implementation order.
