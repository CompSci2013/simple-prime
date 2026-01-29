# Implementation Guide - PrimeNG-First Patterns
## Practical Code Examples for Building the Generic Framework

**Date**: 2025-11-20
**Principle**: Use PrimeNG where possible, custom only when necessary

---

## Pattern 1: PrimeNG Table Setup (No Custom Component)

### ❌ Wrong (Old Approach)

```html
<!-- DON'T build a custom wrapper -->
<app-base-data-table
  [tableId]="'vehicles'"
  [dataSource]="dataSource"
  [columns]="columns"
  [expandable]="true"
  [showColumnManagement]="true">
</app-base-data-table>
```

### ✅ Correct (New Approach)

**Template** (discover.component.html):

```html
<!-- Use PrimeNG Table directly -->
<p-table
  #dt
  [value]="(data$ | async) || []"
  [columns]="visibleColumns"
  dataKey="vehicle_id"
  [reorderableColumns]="true"
  [(expandedRowKeys)]="expandedRows"
  [paginator]="true"
  [rows]="20"
  [rowsPerPageOptions]="[10, 20, 50, 100]"
  [totalRecords]="(totalRecords$ | async) || 0"
  [lazy]="true"
  [loading]="loading$ | async"
  stateStorage="local"
  stateKey="vehicle-table-state"
  styleClass="p-datatable-striped p-datatable-gridlines"
  (onLazyLoad)="onLazyLoad($event)">

  <!-- Header with column filters -->
  <ng-template pTemplate="header" let-columns>
    <tr>
      <th></th> <!-- Expansion column -->
      <th *ngFor="let col of columns"
          [pSortableColumn]="col.sortable ? col.field : null"
          [pReorderableColumn]="col.field"
          [ngStyle]="{'width': col.width}">
        {{col.header}}
        <p-sortIcon *ngIf="col.sortable" [field]="col.field"></p-sortIcon>
      </th>
    </tr>
    <tr>
      <th></th>
      <th *ngFor="let col of columns">
        <p-columnFilter
          *ngIf="col.filterable"
          type="text"
          [field]="col.field"
          matchMode="contains">
        </p-columnFilter>
      </th>
    </tr>
  </ng-template>

  <!-- Body with expansion -->
  <ng-template pTemplate="body" let-rowData let-columns="columns" let-expanded="expanded">
    <tr>
      <td>
        <button
          type="button"
          pButton
          pRipple
          class="p-button-text p-button-rounded"
          [pRowToggler]="rowData"
          [icon]="expanded ? 'pi pi-chevron-down' : 'pi pi-chevron-right'">
        </button>
      </td>
      <td *ngFor="let col of columns">
        {{rowData[col.field]}}
      </td>
    </tr>
  </ng-template>

  <!-- Row expansion content -->
  <ng-template pTemplate="rowexpansion" let-rowData>
    <tr>
      <td [attr.colspan]="columns.length + 1">
        <div class="p-3">
          <h5>VIN Instances for {{rowData.manufacturer}} {{rowData.model}}</h5>
          <app-vin-instances-table [vehicleId]="rowData.vehicle_id">
          </app-vin-instances-table>
        </div>
      </td>
    </tr>
  </ng-template>

  <!-- Empty message -->
  <ng-template pTemplate="emptymessage">
    <tr>
      <td [attr.colspan]="columns.length + 1">
        No vehicles found.
      </td>
    </tr>
  </ng-template>
</p-table>

<!-- Column toggle (replaces custom column manager) -->
<div class="mb-3">
  <p-multiSelect
    [options]="allColumns"
    [(ngModel)]="visibleColumns"
    optionLabel="header"
    placeholder="Choose Columns"
    display="chip"
    [style]="{'width': '100%'}">
  </p-multiSelect>
</div>
```

**Component** (discover.component.ts):

```typescript
@Component({
  selector: 'app-discover',
  templateUrl: './discover.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DiscoverComponent implements OnInit {
  // All columns (for column toggle)
  allColumns: PrimeNGColumn<VehicleResult>[] = [
    { field: 'manufacturer', header: 'Manufacturer', sortable: true, filterable: true, width: '150px' },
    { field: 'model', header: 'Model', sortable: true, filterable: true, width: '150px' },
    { field: 'year', header: 'Year', sortable: true, filterable: true, width: '100px' },
    { field: 'body_class', header: 'Body Class', sortable: true, filterable: true, width: '120px' },
    { field: 'instance_count', header: 'VIN Count', sortable: true, filterable: false, width: '100px' }
  ];

  // Visible columns (toggled by user)
  visibleColumns: PrimeNGColumn<VehicleResult>[];

  // PrimeNG expansion state
  expandedRows: {[key: string]: boolean} = {};

  // Observable streams
  data$: Observable<VehicleResult[]>;
  loading$: Observable<boolean>;
  totalRecords$: Observable<number>;

  constructor(
    private stateService: ResourceManagementService<SearchFilters, VehicleResult>,
    private cdr: ChangeDetectorRef
  ) {
    this.visibleColumns = [...this.allColumns]; // All visible by default
  }

  ngOnInit(): void {
    this.data$ = this.stateService.results$;
    this.loading$ = this.stateService.loading$;
    this.totalRecords$ = this.stateService.totalResults$;
  }

  onLazyLoad(event: LazyLoadEvent): void {
    const filters: Partial<SearchFilters> = {
      page: (event.first / event.rows) + 1,
      size: event.rows,
      sort: event.sortField as string,
      sortDirection: event.sortOrder === 1 ? 'asc' : 'desc'
    };

    // Extract PrimeNG filters
    if (event.filters) {
      Object.keys(event.filters).forEach(field => {
        const filterMeta = event.filters[field];
        if (filterMeta && filterMeta.value) {
          filters[`${field}Search`] = filterMeta.value;
        }
      });
    }

    this.stateService.updateFilters(filters);
  }
}
```

**Result**: ~100 lines (template) + ~60 lines (component) = **160 lines total** vs 600+ lines for custom component

---

## Pattern 2: Table Configuration (Domain-Specific)

### File Structure

```
domain-config/
└── automobile/
    └── configs/
        └── automobile.table-config.ts
```

### automobile.table-config.ts

```typescript
import { TableConfig, PrimeNGColumn } from '@/framework/models/table-config.interface';
import { VehicleResult } from '../models/automobile.data';

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
      resizable: true,
      width: '150px'
    },
    {
      field: 'model',
      header: 'Model',
      sortable: true,
      filterable: true,
      filterMatchMode: 'contains',
      reorderable: true,
      resizable: true,
      width: '150px'
    },
    {
      field: 'year',
      header: 'Year',
      sortable: true,
      filterable: true,
      filterMatchMode: 'equals',
      reorderable: true,
      resizable: true,
      width: '100px'
    },
    {
      field: 'body_class',
      header: 'Body Class',
      sortable: true,
      filterable: true,
      filterMatchMode: 'contains',
      reorderable: true,
      resizable: true,
      width: '120px'
    },
    {
      field: 'instance_count',
      header: 'VIN Count',
      sortable: true,
      filterable: false,
      reorderable: true,
      resizable: true,
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

**Usage** (inject in component):

```typescript
constructor(
  @Inject(AUTOMOBILE_TABLE_CONFIG) public tableConfig: TableConfig<VehicleResult>
) {}
```

**Result**: Configuration file drives PrimeNG Table, no custom logic

---

## Pattern 3: URL State Synchronization

### Integration with PrimeNG Events

```typescript
onLazyLoad(event: LazyLoadEvent): void {
  // Convert PrimeNG event to domain filters
  const filters = this.primeNGEventToFilters(event);

  // Update state (triggers URL update)
  this.stateService.updateFilters(filters);
}

private primeNGEventToFilters(event: LazyLoadEvent): Partial<SearchFilters> {
  const filters: Partial<SearchFilters> = {
    page: (event.first / event.rows) + 1,
    size: event.rows
  };

  // Sorting
  if (event.sortField) {
    filters.sort = event.sortField as string;
    filters.sortDirection = event.sortOrder === 1 ? 'asc' : 'desc';
  }

  // Filtering
  if (event.filters) {
    Object.keys(event.filters).forEach(field => {
      const filterMeta = event.filters[field];
      if (filterMeta && filterMeta.value != null) {
        // Map PrimeNG filter to domain filter
        filters[`${field}Search`] = filterMeta.value;
      }
    });
  }

  return filters;
}
```

**Flow**:
1. User sorts/filters in PrimeNG Table
2. `onLazyLoad` fires
3. Convert to domain filters
4. `updateFilters()` updates URL
5. ResourceManagementService detects URL change
6. API call fetched
7. `data$` emits
8. PrimeNG Table re-renders

---

## Pattern 4: Row Expansion (No Custom Tracking)

### ❌ Wrong (Old Approach)

```typescript
// DON'T manually track expansion
expandedRowSet = new Set<any>();
expandedRowsMap: {[key: string]: boolean} = {};

toggleRowExpansion(row: T): void {
  // Complex manual tracking...
}
```

### ✅ Correct (New Approach)

```typescript
// PrimeNG handles it
expandedRows: {[key: string]: boolean} = {};
// That's it!
```

```html
<p-table
  dataKey="vehicle_id"
  [(expandedRowKeys)]="expandedRows">
  <!-- PrimeNG manages expansion state -->
</p-table>
```

**Result**: 2 lines vs 100 lines

---

## Pattern 5: Column Visibility (No Custom Manager)

### ❌ Wrong (Old Approach)

```html
<!-- DON'T build custom column manager dialog -->
<app-column-manager
  [columns]="columns"
  (columnsChange)="onColumnsChange()">
</app-column-manager>
```

### ✅ Correct (New Approach)

```html
<!-- Use PrimeNG MultiSelect -->
<p-multiSelect
  [options]="allColumns"
  [(ngModel)]="visibleColumns"
  optionLabel="header"
  placeholder="Choose Columns">
</p-multiSelect>
```

```typescript
allColumns = AUTOMOBILE_TABLE_CONFIG.columns;
visibleColumns = [...this.allColumns];
```

**Result**: PrimeNG component + 2 lines of code vs 300-line custom component

---

## Pattern 6: State Persistence (No Custom Service)

### ❌ Wrong (Old Approach)

```typescript
// DON'T create TableStatePersistenceService
saveTableState(tableId: string, state: TableState): void {
  localStorage.setItem(...);
}
loadTableState(tableId: string): TableState | null {
  return JSON.parse(localStorage.getItem(...));
}
```

### ✅ Correct (New Approach)

```html
<!-- One attribute -->
<p-table
  stateStorage="local"
  stateKey="vehicle-table">
  <!-- Automatically saves:
       - Column order
       - Column widths
       - Filters
       - Sorting
       - Pagination
       - Expanded rows
  -->
</p-table>
```

**Result**: 1 attribute vs 150 lines of custom service

---

## Pattern 7: Domain Configuration File

### Complete Domain Config Example

```typescript
// domain-config/automobile/automobile.domain-config.ts

import { DomainConfig } from '@/framework/models/domain-config.interface';
import { SearchFilters } from './models/automobile.filters';
import { VehicleResult } from './models/automobile.data';
import { VehicleStatistics } from './models/automobile.statistics';
import { AutomobileApiAdapter } from './adapters/automobile-api.adapter';
import { AutomobileUrlMapper } from './adapters/automobile-url.mapper';
import { AutomobileCacheKeyBuilder } from './adapters/automobile-cache.adapter';
import { AUTOMOBILE_TABLE_CONFIG } from './configs/automobile.table-config';
import { AUTOMOBILE_PICKER_CONFIGS } from './configs/automobile.picker-configs';

export const AUTOMOBILE_DOMAIN_CONFIG: DomainConfig<SearchFilters, VehicleResult, VehicleStatistics> = {
  domainName: 'automobile',
  domainLabel: 'Automobile Discovery',

  apiBaseUrl: 'http://auto-discovery.minilab/api/v1',

  filterModel: SearchFilters,
  dataModel: VehicleResult,
  statisticsModel: VehicleStatistics,

  apiAdapter: AutomobileApiAdapter,
  urlMapper: AutomobileUrlMapper,
  cacheKeyBuilder: AutomobileCacheKeyBuilder,

  tableConfig: AUTOMOBILE_TABLE_CONFIG,
  pickers: AUTOMOBILE_PICKER_CONFIGS,
  filters: [], // Query control filters
  charts: [], // Chart configs

  features: {
    highlights: true,
    popOuts: true,
    rowExpansion: true
  }
};
```

### Provide in AppModule

```typescript
@NgModule({
  providers: [
    {
      provide: DOMAIN_CONFIG,
      useValue: AUTOMOBILE_DOMAIN_CONFIG
    }
  ]
})
export class AppModule {}
```

---

## Pattern 8: Custom Cell Templates (When Needed)

Sometimes you need custom rendering. PrimeNG supports this:

```html
<p-table [value]="data" [columns]="columns">
  <ng-template pTemplate="body" let-rowData let-columns="columns">
    <tr>
      <td *ngFor="let col of columns">
        <!-- Default rendering -->
        <ng-container *ngIf="!col.bodyTemplate">
          {{rowData[col.field]}}
        </ng-container>

        <!-- Custom template -->
        <ng-container *ngIf="col.bodyTemplate"
                      [ngTemplateOutlet]="col.bodyTemplate"
                      [ngTemplateOutletContext]="{$implicit: rowData}">
        </ng-container>
      </td>
    </tr>
  </ng-template>
</p-table>
```

Define custom template:

```html
<ng-template #vinCountTemplate let-rowData>
  <a [routerLink]="['/vins', rowData.vehicle_id]">
    {{rowData.instance_count}} VINs
  </a>
</ng-template>
```

```typescript
columns = [
  // ...
  {
    field: 'instance_count',
    header: 'VIN Count',
    bodyTemplate: this.vinCountTemplate
  }
];
```

---

## Pattern 9: Lazy Loading Integration

```typescript
onLazyLoad(event: LazyLoadEvent): void {
  // PrimeNG provides all parameters
  console.log('First:', event.first);         // Offset
  console.log('Rows:', event.rows);           // Page size
  console.log('Sort Field:', event.sortField);
  console.log('Sort Order:', event.sortOrder);
  console.log('Filters:', event.filters);     // All active filters

  // Convert to API call
  this.stateService.updateFilters({
    page: (event.first / event.rows) + 1,
    size: event.rows,
    sort: event.sortField as string,
    sortDirection: event.sortOrder === 1 ? 'asc' : 'desc',
    ...this.extractFilters(event.filters)
  });
}
```

---

## Pattern 10: Highlights (CSS-Based)

### ❌ Wrong (Old Approach)

Custom highlight service with complex state tracking

### ✅ Correct (New Approach)

Use CSS classes with PrimeNG row styling:

```html
<p-table [value]="data">
  <ng-template pTemplate="body" let-rowData>
    <tr [ngClass]="{'highlight': isHighlighted(rowData)}">
      <!-- cells -->
    </tr>
  </ng-template>
</p-table>
```

```typescript
isHighlighted(row: VehicleResult): boolean {
  const highlights = this.stateService.getCurrentState().highlights;
  if (!highlights) return false;

  return (
    (!highlights.manufacturer || row.manufacturer === highlights.manufacturer) &&
    (!highlights.yearMin || row.year >= highlights.yearMin) &&
    (!highlights.yearMax || row.year <= highlights.yearMax)
  );
}
```

```css
tr.highlight {
  background-color: #fffacd !important;
}
```

---

## Testing Patterns

### Test PrimeNG Integration (Not PrimeNG Itself)

```typescript
describe('DiscoverComponent', () => {
  it('should call updateFilters when lazy load fires', () => {
    const event: LazyLoadEvent = {
      first: 0,
      rows: 20,
      sortField: 'manufacturer',
      sortOrder: 1
    };

    spyOn(stateService, 'updateFilters');

    component.onLazyLoad(event);

    expect(stateService.updateFilters).toHaveBeenCalledWith({
      page: 1,
      size: 20,
      sort: 'manufacturer',
      sortDirection: 'asc'
    });
  });

  it('should toggle column visibility', () => {
    component.visibleColumns = [component.allColumns[0]];

    expect(component.visibleColumns.length).toBe(1);

    component.visibleColumns = [...component.allColumns];

    expect(component.visibleColumns.length).toBe(5);
  });
});
```

**Don't test**: PrimeNG's sorting, filtering, state persistence (trust the library)

**Do test**: Your integration code, event handlers, filter conversions

---

## Summary

### What to Build

1. ✅ **Domain configuration** (`TableConfig`, `DomainConfig`)
2. ✅ **URL state sync** (ResourceManagementService, FilterUrlMapper)
3. ✅ **Event handlers** (convert PrimeNG events to domain filters)
4. ✅ **Pop-out coordination** (BroadcastChannel)

### What NOT to Build

1. ❌ **Custom table component**
2. ❌ **Column manager**
3. ❌ **State persistence service**
4. ❌ **Expansion tracking**
5. ❌ **Filter UI components**
6. ❌ **Pagination controls**
7. ❌ **Sorting logic**

---

**Next**: Read `06-MIGRATION-SUMMARY.md` for change summary.
