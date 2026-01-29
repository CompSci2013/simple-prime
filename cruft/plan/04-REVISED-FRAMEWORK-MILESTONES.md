# Revised Framework Milestones - PrimeNG-First
## Avoid Over-Engineering by Using PrimeNG Table

**Date**: 2025-11-20
**Principle**: Build only what's truly generic, use PrimeNG for everything else

---

## Milestone Overview

### Original Plan (Too Many Milestones)

The original FRAMEWORK.md had **19 framework milestones** (F1-F19), many of which were **unnecessary** because they rebuilt PrimeNG features.

### Revised Plan (Streamlined)

**New total: 10 milestones** (F1-F10)

**Removed**: 9 milestones that were over-engineering PrimeNG functionality

---

## ❌ DELETED MILESTONES (Don't Build These)

### ~~F6: Generic Base Table Component~~ **DELETED**
**Why**: PrimeNG Table already exists
**Use Instead**: `<p-table>` directly

### ~~F11: Generic Filter Framework~~ **DELETED**
**Why**: PrimeNG has `<p-columnFilter>`
**Use Instead**: PrimeNG's built-in column filters

### ~~F12: Generic Highlight System~~ **DELETED**
**Why**: Can be done with CSS classes + PrimeNG row styling
**Use Instead**: `[ngClass]` with highlight conditions

### ~~F14: Generic Panel System with Drag-Drop~~ **DELETED**
**Why**: PrimeNG has panel components
**Use Instead**: `<p-panel>` with Angular CDK drag-drop for reordering

### ~~F16: Generic Detail Browser with Row Expansion~~ **DELETED**
**Why**: PrimeNG Table has row expansion
**Use Instead**: `expandedRowKeys` + `pRowexpansion` template

### ~~F17: Generic Statistics Aggregation Service~~ **DELETED**
**Why**: This is business logic, belongs in domain layer
**Move To**: Domain-specific adapters

### ~~F18: Generic Column Management System~~ **DELETED**
**Why**: PrimeNG has `reorderableColumns` + `<p-multiSelect>` for column toggle
**Use Instead**: PrimeNG attributes

### ~~F8: Generic Chart Component Framework~~ **SIMPLIFIED**
**Why**: Too generic - just wrap Plotly.js when needed
**Use Instead**: Domain-specific chart components

### ~~F10: Generic State Persistence Service~~ **DELETED**
**Why**: PrimeNG has `stateStorage="local"`
**Use Instead**: PrimeNG's built-in state management

---

## ✅ REVISED MILESTONES (Build These)

### Week 1: Foundation

#### **F1: Project Foundation & Three-Layer Structure**

**Deliverables**:
- Angular 14 project with strict typing
- **Three-layer folder structure**:
  ```
  src/
    framework/           ← Domain-agnostic (F-milestones)
      services/
      models/
      components/

    domain-config/       ← Domain-specific (D-milestones)
      automobile/
        models/
        adapters/
        configs/

    app/                 ← Application instance (A-milestones)
      discover/
      config/
  ```
- PrimeNG 14.2.3 installed and configured
- ESLint rules forbidding domain-specific terms in `framework/`
- Architecture documentation (this plan)

**Success Criteria**:
- ✅ Project compiles
- ✅ PrimeNG theme loads
- ✅ Folder structure enforces separation

**Time Estimate**: 1-2 days

---

#### **F2: Generic API Service**

**Deliverables**:
- Domain-agnostic `ApiService`
- Generic `ApiResponse<T>` interface
- HTTP interceptor for errors
- Request/response models

**Key Interfaces**:
```typescript
interface ApiResponse<TData> {
  results: TData[];
  total: number;
  page: number;
  size: number;
  totalPages: number;
}

class ApiService {
  get<T>(endpoint: string, params?: Record<string, any>): Observable<ApiResponse<T>>;
  post<T>(endpoint: string, body: any): Observable<T>;
}
```

**Success Criteria**:
- ✅ Works with any data type
- ✅ Error handling via interceptor

**Time Estimate**: 1 day

---

### Week 2: State Management

#### **F3: URL State Management Service**

**Deliverables**:
- Domain-agnostic `UrlStateService`
- Type-safe parameter management
- Bidirectional URL synchronization
- Observable streams for URL changes

**Key Methods**:
```typescript
class UrlStateService {
  getParams<TParams>(): TParams;
  setParams<TParams>(params: Partial<TParams>): void;
  watchParams<TParams>(): Observable<TParams>;
  clearParams(): void;
}
```

**Success Criteria**:
- ✅ URL updates trigger observables
- ✅ Browser back/forward works
- ✅ Type-safe

**Time Estimate**: 2-3 days

---

#### **F4: Generic Resource Management Service**

**Deliverables**:
- Fully generic `ResourceManagementService<TFilters, TData, TStatistics>`
- Adapter interfaces:
  - `IFilterUrlMapper<TFilters>`
  - `IApiAdapter<TFilters, TData, TStatistics>`
  - `ICacheKeyBuilder<TFilters>`
- State orchestration: URL → Filters → API → Data
- Reactive streams for all state

**Key Interfaces**:
```typescript
class ResourceManagementService<TFilters, TData, TStatistics> {
  filters$: Observable<TFilters>;
  data$: Observable<TData[]>;
  statistics$: Observable<TStatistics>;
  loading$: Observable<boolean>;
  error$: Observable<Error | null>;

  updateFilters(filters: Partial<TFilters>): void;
  clearFilters(): void;
  refresh(): void;
}
```

**Success Criteria**:
- ✅ Compiles with any generic type arguments
- ✅ URL-first behavior

**Time Estimate**: 3-4 days

---

#### **F5: Request Coordination & Caching Service**

**Deliverables**:
- Domain-agnostic `RequestCoordinatorService`
- Generic caching layer with configurable TTL
- Request deduplication
- Retry logic with exponential backoff

**Key Methods**:
```typescript
class RequestCoordinatorService {
  coordinate<T>(
    cacheKey: string,
    request: () => Observable<T>,
    options?: CoordinationOptions
  ): Observable<T>;

  invalidateCache(pattern?: string): void;
  clearCache(): void;
}
```

**Success Criteria**:
- ✅ Works with any request type
- ✅ Cache hit reduces API calls

**Time Estimate**: 2 days

---

### Week 3: UI Configuration

#### **F6: Table Configuration System** (**NEW - Replaces BaseDataTableComponent**)

**Deliverables**:
- `TableConfig<T>` interface (wraps PrimeNG column defs)
- `PrimeNGColumn<T>` interface
- Utility to convert config to PrimeNG bindings
- **NOT a component - just configuration**

**Key Interfaces**:
```typescript
interface TableConfig<T> {
  tableId: string;
  stateKey: string;
  columns: PrimeNGColumn<T>[];
  dataKey: string;
  expandable: boolean;
  selectable: boolean;
  paginator: boolean;
  rows: number;
  lazy: boolean;
  stateStorage: 'local' | 'session' | null;
}

interface PrimeNGColumn<T> {
  field: keyof T;
  header: string;
  sortable?: boolean;
  filterable?: boolean;
  filterMatchMode?: string;
  reorderable?: boolean;
  width?: string;
}
```

**Usage** (in template):
```html
<p-table
  [value]="data"
  [columns]="config.columns"
  [dataKey]="config.dataKey"
  [reorderableColumns]="true"
  [stateStorage]="config.stateStorage"
  [stateKey]="config.stateKey">
  <!-- PrimeNG handles everything -->
</p-table>
```

**Success Criteria**:
- ✅ Configuration drives PrimeNG Table
- ✅ No custom table component
- ✅ Works with any data type

**Time Estimate**: 1-2 days

---

#### **F7: Picker Configuration System**

**Deliverables**:
- `PickerConfig<T>` interface
- `PickerConfigRegistry` service
- **Base picker component** (thin wrapper around PrimeNG Table)

**Key Interfaces**:
```typescript
interface PickerConfig<T> {
  id: string;
  displayName: string;
  columns: PrimeNGColumn<T>[];
  api: PickerApiConfig<T>;
  row: PickerRowConfig<T>;
  selection: PickerSelectionConfig<T>;
  pagination: PickerPaginationConfig;
}
```

**Success Criteria**:
- ✅ Configuration-driven pickers
- ✅ Uses PrimeNG Table internally
- ✅ Type-safe

**Time Estimate**: 2-3 days

---

### Week 4: Advanced Features

#### **F8: Pop-Out Window System**

**Deliverables**:
- `PopOutContextService`
- BroadcastChannel integration
- Window management utilities
- State synchronization via URL

**Key Methods**:
```typescript
class PopOutContextService {
  openPopOut(route: string, params?: any): Window;
  syncState<TState>(state: TState): void;
  closeAll(): void;
  isInPopOut(): boolean;
}
```

**Success Criteria**:
- ✅ Pop-outs work with URL-first approach
- ✅ State syncs across windows

**Time Estimate**: 2-3 days

---

#### **F9: Error Handling System**

**Deliverables**:
- `ErrorNotificationService`
- `GlobalErrorHandler`
- PrimeNG Toast integration
- Error categorization

**Success Criteria**:
- ✅ User-friendly error messages
- ✅ Network errors handled
- ✅ No duplicate errors

**Time Estimate**: 1 day

---

#### **F10: Domain Configuration Schema & Validation**

**Deliverables**:
- `DomainConfig<TFilters, TData, TStatistics>` interface
- Configuration validator
- Type-safe configuration loading

**Key Interface**:
```typescript
interface DomainConfig<TFilters, TData, TStatistics> {
  domainName: string;
  domainLabel: string;
  apiBaseUrl: string;

  // Type models
  filterModel: Type<TFilters>;
  dataModel: Type<TData>;
  statisticsModel: Type<TStatistics>;

  // Adapters
  apiAdapter: IApiAdapter<TFilters, TData, TStatistics>;
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

**Success Criteria**:
- ✅ Complete domain configuration schema
- ✅ Framework can consume any valid config
- ✅ Validation catches missing fields

**Time Estimate**: 2 days

---

## Domain Configuration Milestones (Unchanged)

**D1-D4** remain the same as original plan:
- D1: Automobile Domain Models
- D2: Automobile API Adapter
- D3: Automobile Filter URL Mapper
- D4: Automobile UI Configuration

---

## Application Instance Milestones (Unchanged)

**A1-A3** remain similar:
- A1: Application Bootstrap & Wiring
- A2: Feature Components (use PrimeNG Table directly)
- A3: Production Deployment

---

## Timeline Comparison

### Original (Wrong)

| Weeks | Milestones | Lines of Code |
|-------|-----------|---------------|
| 1-8 | F1-F19 | ~3,000 (includes custom table, column mgr, etc.) |
| 9 | D1-D4 | ~500 |
| 10 | A1-A3 | ~200 |
| **Total** | **10 weeks** | **~3,700 lines** |

### Revised (Correct)

| Weeks | Milestones | Lines of Code |
|-------|-----------|---------------|
| 1-4 | F1-F10 (PrimeNG-first) | ~800 (config layer only) |
| 5 | D1-D4 | ~500 |
| 6 | A1-A3 | ~200 |
| **Total** | **6 weeks** | **~1,500 lines** |

**Savings**:
- **40% faster** (6 weeks vs 10 weeks)
- **60% less code** (1,500 lines vs 3,700 lines)

---

## Key Architectural Validation

### Framework Code Audit

Before F10 is complete, audit `framework/` directory:

```bash
# ❌ FAIL if found:
grep -r "vehicle\|manufacturer\|vin\|automobile" framework/

# ❌ FAIL if found (over-engineering):
find framework/ -name "base-data-table*"
find framework/ -name "column-manager*"
find framework/ -name "table-state-persistence*"

# ✅ PASS if clean:
echo "No domain terms, no custom table code"
```

### PrimeNG Usage Test

```bash
# ✅ Should find many uses of PrimeNG Table:
grep -r "p-table" src/app/
grep -r "p-columnFilter" src/app/
grep -r "reorderableColumns" src/app/
```

---

## Success Criteria

Framework is successful if:

1. ✅ **No custom table component** - Use `<p-table>` directly
2. ✅ **No column manager** - Use PrimeNG's column toggle
3. ✅ **No state persistence service** - Use `stateStorage="local"`
4. ✅ **Configuration-driven** - 90%+ domain specifics in config
5. ✅ **< 1,500 lines** for framework (vs 3,700 original)
6. ✅ **Works for multiple domains** with only config changes

---

**Next**: Read `05-IMPLEMENTATION-GUIDE.md` for practical code patterns.
