# Next Session: Implement Query Control Component

**Purpose**: Handoff document for implementing the Query Control component in generic-prime project

**Date Created**: 2025-11-22
**Status**: Ready for Implementation
**Estimated Effort**: 3-4 days (including tests)

---

## What Was Accomplished (This Session)

### ✅ Complete Specifications Created

1. **[Query Control Component Specification](./specification.md)**
   - Full wireframes (panel, dropdown, dialogs)
   - Complete user action flows
   - 12 Gherkin acceptance criteria scenarios
   - 10 detailed manual test cases
   - Edge cases and error handling
   - Accessibility requirements (WCAG 2.1 AA)
   - Performance targets

2. **[Service Dependencies Analysis](./SERVICE-DEPENDENCIES.md)**
   - Complete architecture for autos-prime-ng (reference implementation)
   - Elasticsearch → Backend → Frontend dependency chain
   - Quick start/stop commands for all services

3. **[Service Troubleshooting Guide](./SERVICE-TROUBLESHOOTING.md)**
   - Detailed startup sequence (Elasticsearch first!)
   - Common errors and solutions
   - Verification checklist
   - Success indicators

4. **[Draft Specification (Work in Progress)](./SPEC-DRAFT-IN-PROGRESS.md)**
   - Initial notes and observations from screenshots
   - Superseded by main specification.md

### 📸 Screenshots Captured

All screenshots from autos-prime-ng implementation (reference):
- Panel collapsed/expanded states
- Filter field dropdown with search
- Body Class filter dialog (multiselect)
- Model filter dialog with search filtering
- Manufacturer filter dialog
- Year range picker (grid-based decade navigation)
- Multiple active filter chips
- Empty state (no filters)
- "Clear All" button
- Edit filter tooltip behavior

### ⚙️ Services Configured

- Elasticsearch running in `data` namespace (4,887 vehicle specs)
- Backend API running in `autos` namespace (2 replicas)
- Frontend accessible at http://autos.minilab
- All services documented and ready for screenshots

---

## Current Project Status

### generic-prime (New Implementation)

**Version**: v0.1.0
**Architecture**: PrimeNG-first, domain-agnostic framework

**Completed Components** (2/7 panels):
1. ✅ **Manufacturer-Model Picker** - Working, integrated with results table
2. ✅ **Results Table** - Working, filtered by picker selections

**Not Yet Implemented** (5/7 panels):
3. ❌ **Query Control** ← **THIS IS WHAT WE'RE IMPLEMENTING NEXT**
4. ❌ Dual Picker variants (2 different implementations)
5. ❌ VIN Browser
6. ❌ Interactive Charts

**Framework Status**:
- ✅ F1-F10 milestones complete (all framework services)
- ✅ D1-D4 milestones complete (automobile domain)
- ✅ ResourceManagementService (660 lines, generic state management)
- ✅ UrlStateService (434 lines, URL synchronization)
- ✅ RequestCoordinatorService (265 lines, caching + retry)
- ✅ BasePickerComponent (reusable picker framework)
- ✅ ResultsTableComponent (uses PrimeNG Table directly)

---

## Implementation Task: Query Control Component

### Goal

Build a **domain-agnostic** Query Control component that allows manual filter management with:
- Dropdown to select filterable fields
- Modal dialogs for each filter type (multiselect, range)
- Active filter chips with edit/remove functionality
- Full URL-first state management
- Integration with existing ResourceManagementService

### Key Requirements

**Architecture**:
- **Domain-agnostic** - Works with any domain configuration
- **PrimeNG-first** - Use PrimeNG Dialog, Dropdown, Checkbox components
- **Configuration-driven** - Filter definitions from DomainConfig
- **URL-first** - All state via URL parameters
- **No custom wrappers** - Use PrimeNG components directly

**Integration Points**:
- **ResourceManagementService** - For state management and data fetching
- **UrlStateService** - For URL parameter manipulation
- **DomainConfig.filters** - For filter field definitions
- **FilterUrlMapper** - For filter serialization/deserialization

---

## Step-by-Step Implementation Guide

### Phase 1: Component Structure (Day 1)

#### 1.1 Create Component Files

```bash
# Inside container
podman exec -it generic-prime-dev sh

cd /app
ng generate component framework/components/query-control --skip-tests
```

**Files created**:
- `framework/components/query-control/query-control.component.ts`
- `framework/components/query-control/query-control.component.html`
- `framework/components/query-control/query-control.component.scss`

#### 1.2 Define FilterDefinition Interface

**Location**: `framework/models/filter-definition.interface.ts`

```typescript
/**
 * Defines a filterable field in the domain
 */
export interface FilterDefinition<T = any> {
  /** Unique field identifier (matches filter model property) */
  field: keyof T;

  /** Display label for filter field */
  label: string;

  /** Filter type */
  type: 'multiselect' | 'range' | 'text' | 'date';

  /** API endpoint to fetch filter options (for multiselect) */
  optionsEndpoint?: string;

  /** Transform API response to option list */
  optionsTransformer?: (response: any) => FilterOption[];

  /** URL parameter name(s) */
  urlParams: string | { min: string; max: string };

  /** Placeholder text for search box */
  searchPlaceholder?: string;
}

export interface FilterOption {
  value: string | number;
  label: string;
  count?: number;
}
```

#### 1.3 Update DomainConfig Interface

**Location**: `framework/models/domain-config.interface.ts`

```typescript
export interface DomainConfig<TFilters, TData, TStatistics> {
  // ... existing fields ...

  /** Filterable field definitions for Query Control */
  filters: FilterDefinition<TFilters>[];
}
```

#### 1.4 Create Automobile Filter Definitions

**Location**: `domain-config/automobile/configs/automobile-filter-definitions.ts`

```typescript
import { FilterDefinition } from '../../../framework/models/filter-definition.interface';
import { AutoSearchFilters } from '../models/automobile.filters';
import { environment } from '../../../../environments/environment';

export const AUTOMOBILE_FILTER_DEFINITIONS: FilterDefinition<AutoSearchFilters>[] = [
  {
    field: 'manufacturer',
    label: 'Manufacturer',
    type: 'multiselect',
    optionsEndpoint: `${environment.apiBaseUrl}/filters/manufacturers`,
    optionsTransformer: (response) =>
      response.manufacturers.map((m: string) => ({ value: m, label: m })),
    urlParams: 'manufacturer',
    searchPlaceholder: 'Type to search manufacturers...'
  },
  {
    field: 'model',
    label: 'Model',
    type: 'multiselect',
    optionsEndpoint: `${environment.apiBaseUrl}/filters/models`,
    optionsTransformer: (response) =>
      response.models.map((m: string) => ({ value: m, label: m })),
    urlParams: 'model',
    searchPlaceholder: 'Type to search models...'
  },
  {
    field: 'bodyClass',
    label: 'Body Class',
    type: 'multiselect',
    optionsEndpoint: `${environment.apiBaseUrl}/filters/body-classes`,
    optionsTransformer: (response) =>
      response.body_classes.map((b: string) => ({ value: b, label: b })),
    urlParams: 'bodyClass',
    searchPlaceholder: 'Type to search body classes...'
  },
  {
    field: 'yearMin', // Special: range filter has two fields
    label: 'Year',
    type: 'range',
    optionsEndpoint: `${environment.apiBaseUrl}/filters/year-range`,
    urlParams: { min: 'yearMin', max: 'yearMax' }
  },
  {
    field: 'dataSource',
    label: 'Data Source',
    type: 'multiselect',
    optionsEndpoint: `${environment.apiBaseUrl}/filters/data-sources`,
    optionsTransformer: (response) =>
      response.data_sources.map((d: string) => ({ value: d, label: d })),
    urlParams: 'dataSource',
    searchPlaceholder: 'Type to search data sources...'
  }
];
```

---

### Phase 2: Basic UI Structure (Day 1-2)

#### 2.1 Query Control Component Template

**Location**: `framework/components/query-control/query-control.component.html`

```html
<div class="query-control-panel">
  <!-- Filter Field Selector -->
  <p-dropdown
    [options]="filterFieldOptions"
    [(ngModel)]="selectedField"
    placeholder="Add filter by field..."
    [filter]="true"
    filterPlaceholder="Search fields..."
    (onChange)="onFieldSelected($event)"
    [showClear]="false"
    styleClass="filter-field-dropdown">
  </p-dropdown>

  <!-- Active Filters -->
  <div class="active-filters" *ngIf="activeFilters.length > 0">
    <label>Active Filters:</label>
    <div class="filter-chips">
      <p-chip
        *ngFor="let filter of activeFilters"
        [label]="getChipLabel(filter)"
        [removable]="true"
        (onRemove)="removeFilter(filter)"
        (click)="editFilter(filter)"
        styleClass="filter-chip"
        [pTooltip]="getChipTooltip(filter)"
        tooltipPosition="top">
      </p-chip>
    </div>
  </div>

  <!-- Multiselect Filter Dialog -->
  <p-dialog
    [(visible)]="showMultiselectDialog"
    [header]="multiselectDialogTitle"
    [modal]="true"
    [style]="{width: '50vw'}"
    [closable]="true"
    (onHide)="onDialogHide()">

    <ng-template pTemplate="header">
      <span>{{ multiselectDialogTitle }}</span>
    </ng-template>

    <p>{{ multiselectDialogSubtitle }}</p>

    <!-- Search Box -->
    <span class="p-input-icon-left search-box">
      <i class="pi pi-search"></i>
      <input
        type="text"
        pInputText
        [(ngModel)]="searchQuery"
        [placeholder]="currentFilterDef?.searchPlaceholder || 'Search...'"
        (ngModelChange)="onSearchChange($event)"
      />
    </span>

    <!-- Options List -->
    <div class="options-list" *ngIf="!loadingOptions">
      <div *ngFor="let option of filteredOptions" class="option-item">
        <p-checkbox
          [(ngModel)]="selectedOptions"
          [label]="option.label"
          [value]="option.value"
          [binary]="false">
        </p-checkbox>
      </div>
    </div>

    <!-- Loading State -->
    <div *ngIf="loadingOptions" class="loading-state">
      <p-progressSpinner></p-progressSpinner>
      <p>Loading options...</p>
    </div>

    <!-- Selection Summary -->
    <div class="selection-summary" *ngIf="selectedOptions.length > 0">
      <span>Selected ({{ selectedOptions.length }}): {{ getSelectionSummary() }}</span>
    </div>

    <ng-template pTemplate="footer">
      <p-button label="Cancel" (onClick)="cancelDialog()" styleClass="p-button-text"></p-button>
      <p-button label="Apply" (onClick)="applyFilter()" styleClass="p-button-danger"></p-button>
    </ng-template>
  </p-dialog>

  <!-- Year Range Filter Dialog -->
  <p-dialog
    [(visible)]="showYearRangeDialog"
    header="Select Year Range"
    [modal]="true"
    [style]="{width: '500px'}"
    [closable]="true"
    (onHide)="onDialogHide()">

    <p>Select a year range to filter results. You can select just a start year, end year, or both.</p>

    <!-- Year Picker Component (TODO: Create custom year picker or use PrimeNG Calendar) -->
    <div class="year-picker-container">
      <!-- Implementation needed: Grid-based year picker -->
      <!-- For MVP: Use two number inputs -->
      <div class="year-inputs">
        <div class="p-field">
          <label for="yearMin">Start Year</label>
          <input
            id="yearMin"
            type="number"
            pInputText
            [(ngModel)]="yearMin"
            [min]="1900"
            [max]="2100"
            placeholder="e.g., 1980"
          />
        </div>
        <div class="p-field">
          <label for="yearMax">End Year</label>
          <input
            id="yearMax"
            type="number"
            pInputText
            [(ngModel)]="yearMax"
            [min]="yearMin || 1900"
            [max]="2100"
            placeholder="e.g., 2003"
          />
        </div>
      </div>
    </div>

    <ng-template pTemplate="footer">
      <p-button label="Cancel" (onClick)="cancelDialog()" styleClass="p-button-text"></p-button>
      <p-button label="Apply" (onClick)="applyYearRange()" styleClass="p-button-danger"></p-button>
    </ng-template>
  </p-dialog>
</div>
```

#### 2.2 Query Control Component TypeScript

**Location**: `framework/components/query-control/query-control.component.ts`

```typescript
import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, Input, ChangeDetectorRef } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { DomainConfig } from '../../models/domain-config.interface';
import { FilterDefinition, FilterOption } from '../../models/filter-definition.interface';
import { UrlStateService } from '../../services/url-state.service';
import { ApiService } from '../../services/api.service';

interface ActiveFilter {
  definition: FilterDefinition;
  values: (string | number)[];
  urlValue: string;
}

@Component({
  selector: 'app-query-control',
  templateUrl: './query-control.component.html',
  styleUrls: ['./query-control.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class QueryControlComponent<TFilters = any, TData = any, TStatistics = any> implements OnInit, OnDestroy {
  @Input() domainConfig!: DomainConfig<TFilters, TData, TStatistics>;

  // Dropdown options
  filterFieldOptions: { label: string; value: FilterDefinition }[] = [];
  selectedField: FilterDefinition | null = null;

  // Active filters
  activeFilters: ActiveFilter[] = [];

  // Dialog state
  showMultiselectDialog = false;
  showYearRangeDialog = false;
  currentFilterDef: FilterDefinition | null = null;
  multiselectDialogTitle = '';
  multiselectDialogSubtitle = '';

  // Multiselect dialog data
  loadingOptions = false;
  allOptions: FilterOption[] = [];
  filteredOptions: FilterOption[] = [];
  selectedOptions: (string | number)[] = [];
  searchQuery = '';

  // Year range dialog data
  yearMin: number | null = null;
  yearMax: number | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    private urlState: UrlStateService,
    private apiService: ApiService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Build filter field dropdown options
    this.filterFieldOptions = this.domainConfig.filters.map(f => ({
      label: f.label,
      value: f
    }));

    // Subscribe to URL changes to sync active filters
    this.urlState.params$
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        this.syncFiltersFromUrl(params);
        this.cdr.markForCheck();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * User selected a field from dropdown
   */
  onFieldSelected(event: any): void {
    const filterDef: FilterDefinition = event.value;
    this.currentFilterDef = filterDef;

    if (filterDef.type === 'multiselect') {
      this.openMultiselectDialog(filterDef);
    } else if (filterDef.type === 'range') {
      this.openYearRangeDialog(filterDef);
    }

    // Reset dropdown
    this.selectedField = null;
  }

  /**
   * Open multiselect dialog and load options
   */
  private openMultiselectDialog(filterDef: FilterDefinition): void {
    this.multiselectDialogTitle = `Select ${filterDef.label}s`;
    this.multiselectDialogSubtitle = `Select one or more ${filterDef.label.toLowerCase()}s to filter results.`;
    this.searchQuery = '';
    this.selectedOptions = [];
    this.loadingOptions = true;
    this.showMultiselectDialog = true;
    this.cdr.markForCheck();

    // Check if editing existing filter
    const existingFilter = this.activeFilters.find(f => f.definition.field === filterDef.field);
    if (existingFilter) {
      this.selectedOptions = [...existingFilter.values];
    }

    // Load options from API
    if (filterDef.optionsEndpoint) {
      this.apiService.get(filterDef.optionsEndpoint).subscribe({
        next: (response) => {
          this.allOptions = filterDef.optionsTransformer?.(response) || [];
          this.filteredOptions = [...this.allOptions];
          this.loadingOptions = false;
          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error('Failed to load filter options:', error);
          this.loadingOptions = false;
          // TODO: Show error message
          this.cdr.markForCheck();
        }
      });
    }
  }

  /**
   * Search options in multiselect dialog
   */
  onSearchChange(query: string): void {
    const lowerQuery = query.toLowerCase();
    this.filteredOptions = this.allOptions.filter(opt =>
      opt.label.toLowerCase().includes(lowerQuery)
    );
    this.cdr.markForCheck();
  }

  /**
   * Apply multiselect filter
   */
  applyFilter(): void {
    if (!this.currentFilterDef || this.selectedOptions.length === 0) {
      this.cancelDialog();
      return;
    }

    // Update URL with new filter
    const paramName = this.currentFilterDef.urlParams as string;
    const paramValue = this.selectedOptions.join(',');

    this.urlState.setQueryParams({ [paramName]: paramValue }).subscribe();

    this.showMultiselectDialog = false;
    this.cdr.markForCheck();
  }

  /**
   * Cancel dialog
   */
  cancelDialog(): void {
    this.showMultiselectDialog = false;
    this.showYearRangeDialog = false;
    this.currentFilterDef = null;
    this.selectedOptions = [];
    this.searchQuery = '';
    this.cdr.markForCheck();
  }

  /**
   * Remove filter chip
   */
  removeFilter(filter: ActiveFilter): void {
    const paramName = filter.definition.urlParams as string;
    this.urlState.clearQueryParam(paramName).subscribe();
  }

  /**
   * Edit existing filter
   */
  editFilter(filter: ActiveFilter): void {
    this.currentFilterDef = filter.definition;

    if (filter.definition.type === 'multiselect') {
      this.openMultiselectDialog(filter.definition);
    } else if (filter.definition.type === 'range') {
      this.openYearRangeDialog(filter.definition);
    }
  }

  /**
   * Sync active filters from URL params
   */
  private syncFiltersFromUrl(params: any): void {
    this.activeFilters = [];

    for (const filterDef of this.domainConfig.filters) {
      const paramName = typeof filterDef.urlParams === 'string'
        ? filterDef.urlParams
        : filterDef.urlParams.min; // For range filters

      const paramValue = params[paramName];

      if (paramValue) {
        const values = paramValue.split(',');
        this.activeFilters.push({
          definition: filterDef,
          values: values,
          urlValue: paramValue
        });
      }
    }
  }

  /**
   * Get chip label
   */
  getChipLabel(filter: ActiveFilter): string {
    if (filter.definition.type === 'range') {
      // TODO: Handle range display
      return `${filter.definition.label}: ${filter.values[0]} - ${filter.values[1]}`;
    }

    const displayValues = filter.values.slice(0, 3).join(', ');
    const remaining = filter.values.length - 3;
    return remaining > 0
      ? `${filter.definition.label}: ${displayValues}... +${remaining}`
      : `${filter.definition.label}: ${displayValues}`;
  }

  /**
   * Get chip tooltip
   */
  getChipTooltip(filter: ActiveFilter): string {
    return `${filter.definition.label}: ${filter.values.join(', ')} (Click to edit)`;
  }

  /**
   * Get selection summary for dialog footer
   */
  getSelectionSummary(): string {
    return this.selectedOptions.slice(0, 3).join(', ') +
      (this.selectedOptions.length > 3 ? '...' : '');
  }

  // Year range methods (TODO: Implement properly)
  private openYearRangeDialog(filterDef: FilterDefinition): void {
    this.showYearRangeDialog = true;
    // TODO: Load existing values if editing
    this.cdr.markForCheck();
  }

  applyYearRange(): void {
    // TODO: Implement year range application
    this.showYearRangeDialog = false;
    this.cdr.markForCheck();
  }

  onDialogHide(): void {
    // Cleanup when dialog closes
    this.currentFilterDef = null;
  }
}
```

---

### Phase 3: Integration (Day 2)

#### 3.1 Add to Discover Component

**Location**: `app/features/discover/discover.component.html`

```html
<div class="discover-container">
  <div class="discover-header">
    <h1>{{ domainConfig.domainLabel }}</h1>
  </div>

  <hr/>

  <!-- ADD QUERY CONTROL HERE -->
  <app-query-control [domainConfig]="domainConfig"></app-query-control>

  <hr/>

  <!-- Existing Picker -->
  <app-base-picker
    [configId]="'manufacturer-model-picker'"
    (selectionChange)="onPickerSelectionChange($event)">
  </app-base-picker>

  <hr/>

  <!-- Existing Results Table -->
  <app-results-table [domainConfig]="domainConfig"></app-results-table>
</div>
```

#### 3.2 Update Automobile Domain Config

**Location**: `domain-config/automobile/automobile.domain-config.ts`

```typescript
import { AUTOMOBILE_FILTER_DEFINITIONS } from './configs/automobile-filter-definitions';

export const AUTOMOBILE_DOMAIN_CONFIG: DomainConfig<
  AutoSearchFilters,
  AutoVehicleResult,
  AutoStatistics
> = {
  // ... existing config ...

  filters: AUTOMOBILE_FILTER_DEFINITIONS, // ADD THIS LINE
};
```

---

### Phase 4: Testing (Day 3-4)

#### 4.1 Unit Tests

**Location**: `framework/components/query-control/query-control.component.spec.ts`

Create tests for:
- ✅ Component initializes with filter definitions
- ✅ Dropdown shows all filter fields
- ✅ Clicking field opens appropriate dialog
- ✅ Multiselect dialog loads options from API
- ✅ Search filters options correctly
- ✅ Apply updates URL parameters
- ✅ Cancel closes dialog without changes
- ✅ Remove filter clears URL parameter
- ✅ Edit filter re-opens dialog with selections
- ✅ Active filters sync from URL on init

#### 4.2 E2E Tests

**Location**: `e2e/query-control.spec.ts`

Create Playwright tests for:
- ✅ Add manufacturer filter workflow
- ✅ Add multiple different filters
- ✅ Remove filter via chip
- ✅ Edit existing filter
- ✅ Clear all filters (if button integrated)
- ✅ URL persistence across page refresh

---

## Key Implementation Notes

### ⚠️ Critical Requirements

1. **Domain-Agnostic**: Component MUST work with any domain configuration
2. **No Hardcoding**: All filter definitions come from `DomainConfig.filters`
3. **URL-First**: All state changes via `UrlStateService`
4. **PrimeNG Components**: Use PrimeNG Dialog, Dropdown, Checkbox directly
5. **OnPush Change Detection**: Call `cdr.markForCheck()` after async updates

### 🎯 Testing Requirements

- **Test-Driven Development**: Write tests FIRST, then implement
- **DO NOT modify tests to pass**: Fix implementation, not tests
- **Coverage Targets**: 80% minimum for services, 70% for components

### 📦 PrimeNG Modules Needed

Add to `app.module.ts`:
```typescript
import { DropdownModule } from 'primeng/dropdown';
import { DialogModule } from 'primeng/dialog';
import { CheckboxModule } from 'primeng/checkbox';
import { ChipModule } from 'primeng/chip';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TooltipModule } from 'primeng/tooltip';
```

---

## Reference Materials

### Specifications

1. **[Query Control Specification](./specification.md)** - PRIMARY REFERENCE
   - Complete user flows
   - Acceptance criteria (Gherkin)
   - Manual test cases
   - Edge cases and error handling

2. **[Discover Feature Spec](../../../specs/03-discover-feature-specification.md)**
   - 7-panel system overview
   - Query Control as Panel #1

3. **[Component Template](../../templates/COMPONENT-SPECIFICATION-TEMPLATE.md)**
   - Standard format for component specs

### Architecture References

1. **[PrimeNG-First Plan](../../../plan/02-PRIMENG-NATIVE-FEATURES.md)**
   - Why we use PrimeNG directly
   - What NOT to build

2. **[Revised Architecture](../../../plan/03-REVISED-ARCHITECTURE.md)**
   - Clean architecture principles
   - Framework vs. Domain separation

3. **[Implementation Guide](../../../plan/05-IMPLEMENTATION-GUIDE.md)**
   - Code patterns
   - Best practices

### Existing Components (Examples)

1. **[BasePickerComponent](../../../frontend/src/framework/components/base-picker/)**
   - Shows configuration-driven approach
   - URL-first pattern
   - Dialog usage

2. **[ResultsTableComponent](../../../frontend/src/framework/components/results-table/)**
   - PrimeNG Table integration
   - State management

---

## Troubleshooting

### If Backend Services Are Down

See [SERVICE-TROUBLESHOOTING.md](./SERVICE-TROUBLESHOOTING.md) for complete instructions.

**Quick Start**:
```bash
# 1. Start Elasticsearch
kubectl scale deployment elasticsearch -n data --replicas=1
sleep 30

# 2. Start Backend
kubectl scale deployment autos-backend -n autos --replicas=2
sleep 30

# 3. Verify
kubectl get pods -n data
kubectl get pods -n autos
curl http://autos.minilab/api/health
```

### If Frontend Container Isn't Running

```bash
# Start development container
cd ~/projects/generic-prime
podman run -d --name generic-prime-dev \
  --network host \
  -v $(pwd)/frontend:/app:z \
  -w /app \
  localhost/generic-prime-frontend:dev

# Enter container
podman exec -it generic-prime-dev sh

# Start dev server (inside container)
npm start
```

Access at: http://192.168.0.244:4201

---

## Success Criteria

### MVP (Minimum Viable Product)

- ✅ Query Control panel renders with dropdown
- ✅ Can add Manufacturer filter (multiselect)
- ✅ Can add Body Class filter (multiselect)
- ✅ Can add Year filter (range - simple inputs OK for MVP)
- ✅ Active filters display as chips
- ✅ Can remove filters via chip X button
- ✅ Can edit filters by clicking chip
- ✅ URL updates correctly for all filter types
- ✅ Results table filters based on Query Control filters
- ✅ Filters persist across page refresh

### Full Implementation

- ✅ All MVP features
- ✅ Year range picker with grid UI (like reference implementation)
- ✅ Search functionality in multiselect dialogs
- ✅ Loading states and error handling
- ✅ Accessibility (keyboard navigation, screen reader support)
- ✅ Unit tests (80%+ coverage)
- ✅ E2E tests (all major workflows)
- ✅ "Clear All" button integration (if at page level, not component)

---

## Estimated Timeline

| Phase | Tasks | Time |
|-------|-------|------|
| **Day 1** | Setup, interfaces, basic UI structure | 6-8 hours |
| **Day 2** | Multiselect dialogs, integration, basic functionality | 6-8 hours |
| **Day 3** | Year range picker, polish, unit tests | 6-8 hours |
| **Day 4** | E2E tests, bug fixes, documentation updates | 4-6 hours |

**Total**: 3-4 days (22-30 hours)

---

## Final Notes

### What Makes This Different from Picker?

- **Picker**: Configuration-driven, reusable component for specific selection UI (table + checkboxes)
- **Query Control**: Panel that orchestrates multiple filter types (multiselect, range, text) using dialogs

### Why Not Reuse BasePickerComponent?

- Query Control needs **different UI** (chips vs. table)
- Query Control manages **multiple filter types** (not just multiselect)
- Query Control is **panel-level orchestration**, not a reusable picker

### Remember: PrimeNG-First!

- ✅ Use `<p-dialog>` for modals
- ✅ Use `<p-dropdown>` for field selection
- ✅ Use `<p-checkbox>` for multiselect options
- ✅ Use `<p-chip>` for active filters
- ❌ Don't build custom modal component
- ❌ Don't build custom dropdown component
- ❌ Don't build custom chip component

---

**Good luck! 🚀**

**Questions?** Refer to specifications first, then ask user for clarification.
