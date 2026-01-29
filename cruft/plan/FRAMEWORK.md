# Generic Discovery Framework - Milestone Plan
## Domain-Agnostic Architecture for Reusable Data Exploration

This milestone plan reflects the **true architectural goal**: building a **domain-agnostic framework** that can be reused for automobiles, agriculture, real estate, medical devices, or any other domain simply by providing different configuration.

**Version 2 Changes**: Removed all testing-related milestones and references.

---

## Critical Architectural Principle

**NO DOMAIN-SPECIFIC NAMING IN FRAMEWORK CODE**

❌ **WRONG**: `VehicleService`, `ManufacturerPicker`, `VinBrowser`
✅ **CORRECT**: `ResourceService<T>`, `HierarchicalPicker<T>`, `DetailBrowser<T>`

**All domain specifics live in configuration files, not code.**

---

## Three-Layer Architecture

### **Layer 1: Framework (Domain-Agnostic)**
Reusable services, components, and patterns. **Zero domain knowledge.**
- Built once, used forever
- No references to vehicles, agriculture, etc.
- All code uses generic types and configuration

### **Layer 2: Domain Configuration (Domain-Specific)**
Configuration files defining the domain.
- Automobile domain config (filters, endpoints, models)
- Agriculture domain config (different filters, endpoints, models)
- Real estate domain config (etc.)

### **Layer 3: Application Instance (Wiring)**
Thin layer that combines framework + domain config.
- Minimal code, mostly imports and wiring
- Environment-specific settings
- Deployment configuration

---

## Milestone Overview (26 Milestones)

### **Framework Milestones (F1-F19)**: Build the reusable framework
- 19 milestones to build domain-agnostic infrastructure
- Result: A framework that works for ANY domain

### **Domain Configuration Milestones (D1-D4)**: Configure for automobiles
- 4 milestones to configure the framework for the automobile domain
- Result: Auto-specific filters, endpoints, adapters

### **Application Instance Milestones (A1-A3)**: Deploy the instance
- 3 milestones to wire framework + domain config
- Result: Production-ready automobile discovery application

---

## FRAMEWORK MILESTONES (F1-F19)

These milestones build the **reusable, domain-agnostic framework**.

---

### **Tier 0: Foundation (Week 1)**

#### **F1: Project Foundation & Framework Structure**
**Type**: Foundation
**Dependencies**: None

**Deliverables**:
- Angular 14 project with strict typing
- **Three-layer folder structure**:
  ```
  src/
    framework/           ← Domain-agnostic code (F-milestones)
      core/
        services/
        models/
        interfaces/
      components/
        base-table/
        base-picker/
        base-chart/
      utils/

    domain-config/       ← Domain-specific config (D-milestones)
      automobile/
        models/
        adapters/
        configs/
      agriculture/       ← Future domain
      real-estate/       ← Future domain

    app/                 ← Application instance (A-milestones)
      features/
      config/
  ```
- PrimeNG + Plotly.js integration
- ESLint rules **forbidding domain-specific terms in framework/**
- Architecture documentation

**Success Criteria**:
- Project structure enforces separation
- Linting prevents domain-specific naming in framework/

---

### **Tier 1: Core Framework Infrastructure (Weeks 2-4)**

#### **F2: Generic API Service**
**Type**: Framework - Architectural
**Dependencies**: F1

**Deliverables**:
- **Domain-agnostic** `ApiService` (no "vehicle" references)
- Generic `ApiResponse<T>` for paginated responses
- Generic `ApiRequest` interface
- HTTP interceptor infrastructure
- Error response models

**Key Interfaces**:
```typescript
// ✅ CORRECT: Generic naming
interface ApiResponse<TData> {
  results: TData[];
  total: number;
  page: number;
  size: number;
  totalPages: number;
}

interface ApiRequest {
  endpoint: string;
  params: Record<string, any>;
}

class ApiService {
  get<T>(endpoint: string, params?: Record<string, any>): Observable<ApiResponse<T>>;
  post<T>(endpoint: string, body: any): Observable<T>;
}
```

**Success Criteria**: API service works with ANY data type

---

#### **F3: URL State Management Service**
**Type**: Framework - Architectural (CRITICAL)
**Dependencies**: F1

**Deliverables**:
- **Domain-agnostic** `UrlStateService`
- Type-safe parameter management
- Bidirectional URL synchronization
- Observable streams for URL changes
- Browser history integration
- Parameter serialization/deserialization utilities

**Key Interfaces**:
```typescript
// ✅ CORRECT: No domain assumptions
class UrlStateService {
  getParams<TParams>(): TParams;
  setParams<TParams>(params: Partial<TParams>): void;
  watchParams<TParams>(): Observable<TParams>;
  clearParams(): void;
}

// Parameter serialization is generic
class UrlSerializer {
  serialize(params: Record<string, any>): string;
  deserialize(urlParams: string): Record<string, any>;
}
```

**Success Criteria**: URL state works for any parameter shape

---

#### **F4: Generic Resource Management Service**
**Type**: Framework - Architectural (CRITICAL)
**Dependencies**: F1, F3

**Deliverables**:
- **Fully generic** `ResourceManagementService<TFilters, TData, TStatistics>`
- Adapter interfaces (all domain-agnostic):
  - `IFilterUrlMapper<TFilters>`
  - `IApiAdapter<TFilters, TData, TStatistics>`
  - `ICacheKeyBuilder<TFilters>`
- State orchestration: URL → Filters → API → Data
- Reactive streams for all state
- Automatic URL synchronization

**Key Interfaces**:
```typescript
// ✅ CORRECT: Completely generic
class ResourceManagementService<TFilters, TData, TStatistics> {
  filters$: Observable<TFilters>;
  data$: Observable<TData[]>;
  statistics$: Observable<TStatistics>;
  loading$: Observable<boolean>;
  error$: Observable<Error | null>;

  constructor(
    private urlState: UrlStateService,
    private apiAdapter: IApiAdapter<TFilters, TData, TStatistics>,
    private urlMapper: IFilterUrlMapper<TFilters>,
    private cacheKeyBuilder: ICacheKeyBuilder<TFilters>
  ) {}

  updateFilters(filters: Partial<TFilters>): void;
  clearFilters(): void;
  refresh(): void;
}

// ✅ Adapter interfaces are generic
interface IFilterUrlMapper<TFilters> {
  filtersToParams(filters: TFilters): Record<string, any>;
  paramsToFilters(params: Record<string, any>): Partial<TFilters>;
}

interface IApiAdapter<TFilters, TData, TStatistics> {
  fetchData(filters: TFilters): Observable<ApiResponse<TData>>;
  fetchStatistics(filters: TFilters): Observable<TStatistics>;
}

interface ICacheKeyBuilder<TFilters> {
  buildKey(filters: TFilters): string;
}
```

**Success Criteria**: Service compiles with any generic type arguments

---

#### **F5: Request Coordination & Caching Service**
**Type**: Framework - Architectural
**Dependencies**: F2

**Deliverables**:
- **Domain-agnostic** `RequestCoordinatorService`
- Generic caching layer with configurable TTL
- Request deduplication
- Retry logic with exponential backoff
- Cache invalidation strategies

**Key Interfaces**:
```typescript
// ✅ CORRECT: Works with any request type
class RequestCoordinatorService {
  coordinate<T>(
    cacheKey: string,
    request: () => Observable<T>,
    options?: CoordinationOptions
  ): Observable<T>;

  invalidateCache(pattern?: string): void;
  clearCache(): void;
}

interface CoordinationOptions {
  ttl?: number;
  retries?: number;
  deduplication?: boolean;
}
```

**Success Criteria**: Works with any data type being requested

---

### **Tier 2: Reusable Component Framework (Weeks 5-6)**

#### **F6: Generic Base Table Component**
**Type**: Framework - Component
**Dependencies**: F1

**Deliverables**:
- **Completely generic** `BaseDataTableComponent<TData>`
- Configuration-driven columns: `TableColumn<TData>`
- Features: sorting, pagination, selection, expansion, filtering
- No assumptions about data structure
- Accessibility built-in

**Key Interfaces**:
```typescript
// ✅ CORRECT: Generic data type
interface TableColumn<TData> {
  field: keyof TData | string;  // Support nested paths
  header: string;
  sortable?: boolean;
  filterable?: boolean;
  width?: string;
  template?: TemplateRef<any>;
  formatter?: (value: any, row: TData) => string;
}

@Component({ selector: 'base-data-table' })
class BaseDataTableComponent<TData> {
  @Input() data: TData[];
  @Input() columns: TableColumn<TData>[];
  @Input() loading: boolean;
  @Input() totalRecords: number;
  @Output() sortChange = new EventEmitter<SortEvent>();
  @Output() pageChange = new EventEmitter<PageEvent>();
  @Output() rowExpand = new EventEmitter<TData>();
}
```

**Success Criteria**: Table works with Person, Product, Animal, etc. data

---

#### **F7: Generic Picker Component System**
**Type**: Framework - Component
**Dependencies**: F1

**Deliverables**:
- **Generic** `BasePickerComponent<TItem>`
- Configuration interface: `PickerConfig<TItem>`
- Picker registry service: `PickerConfigRegistry`
- Support for single/multi-select, search, cascading, lazy-load

**Key Interfaces**:
```typescript
// ✅ CORRECT: Works with any item type
interface PickerConfig<TItem> {
  id: string;
  label: string;
  apiEndpoint: string;
  displayField: keyof TItem | ((item: TItem) => string);
  valueField: keyof TItem;
  searchFields: (keyof TItem)[];
  multiSelect: boolean;
  cascading?: CascadingConfig<TItem>;
}

@Component({ selector: 'base-picker' })
class BasePickerComponent<TItem> {
  @Input() config: PickerConfig<TItem>;
  @Output() selectionChange = new EventEmitter<TItem[]>();
}
```

**Success Criteria**: Picker works for selecting countries, products, crops, etc.

---

#### **F8: Generic Chart Component Framework**
**Type**: Framework - Component
**Dependencies**: F1

**Deliverables**:
- **Generic** `BaseChartComponent<TStatistics>`
- Chart configuration: `ChartConfig`
- Plotly.js wrapper with generic data binding
- Chart types: bar, histogram, pie, line, scatter
- Interactive click-to-filter support

**Key Interfaces**:
```typescript
// ✅ CORRECT: Generic statistics type
interface ChartConfig {
  type: 'bar' | 'histogram' | 'pie' | 'line' | 'scatter';
  title: string;
  dataSource: string; // Path to data in statistics object
  xAxisField: string;
  yAxisField: string;
  clickEnabled: boolean;
}

@Component({ selector: 'base-chart' })
class BaseChartComponent<TStatistics> {
  @Input() statistics: TStatistics;
  @Input() config: ChartConfig;
  @Output() dataPointClick = new EventEmitter<any>();
}
```

**Success Criteria**: Chart renders agricultural yield data, sales data, etc.

---

#### **F9: Generic Error Handling System**
**Type**: Framework - Service
**Dependencies**: F1, F2

**Deliverables**:
- **Domain-agnostic** error handling services
- `ErrorNotificationService` for user messages
- `GlobalErrorHandler` for uncaught exceptions
- Error categorization (network, server, validation)
- PrimeNG Toast integration

**Success Criteria**: Error handling works regardless of domain

---

#### **F10: Generic State Persistence Service**
**Type**: Framework - Service
**Dependencies**: F1

**Deliverables**:
- **Generic** `StatePersistenceService`
- localStorage/sessionStorage abstraction
- Per-component state isolation
- State serialization/deserialization
- Clear state functionality

**Key Interfaces**:
```typescript
// ✅ CORRECT: Generic state type
class StatePersistenceService {
  save<TState>(key: string, state: TState): void;
  load<TState>(key: string): TState | null;
  clear(key: string): void;
  clearAll(prefix?: string): void;
}
```

**Success Criteria**: Persists table state, filter state, etc. generically

---

### **Tier 3: Advanced Framework Features (Weeks 7-8)**

#### **F11: Generic Filter Framework**
**Type**: Framework - Component
**Dependencies**: F1, F4

**Deliverables**:
- **Generic** filter UI components:
  - `BaseFilterComponent<TFilterValue>`
  - `MultiSelectFilterComponent`
  - `RangeFilterComponent`
  - `DateRangeFilterComponent`
  - `SearchFilterComponent`
- Filter registry: `FilterRegistry`
- Filter chip display component
- Dynamic filter builder

**Key Interfaces**:
```typescript
// ✅ CORRECT: Generic filter definition
interface FilterDefinition<TFilterValue> {
  id: string;
  label: string;
  type: 'multi-select' | 'range' | 'date-range' | 'search' | 'boolean';
  options?: any[];  // For select filters
  validation?: (value: TFilterValue) => boolean;
}

@Component({ selector: 'base-filter' })
class BaseFilterComponent<TFilterValue> {
  @Input() definition: FilterDefinition<TFilterValue>;
  @Output() valueChange = new EventEmitter<TFilterValue>();
}
```

**Success Criteria**: Filter components work for any domain's filter types

---

#### **F12: Generic Highlight System**
**Type**: Framework - Feature
**Dependencies**: F4, F6

**Deliverables**:
- **Generic** highlight filter system (separate from search filters)
- Highlight configuration: `HighlightConfig<TFilters>`
- Visual highlighting in tables/charts
- URL parameter support for highlights

**Key Interfaces**:
```typescript
// ✅ CORRECT: Generic highlight filters
interface HighlightConfig<TFilters> {
  enabled: boolean;
  filters: Partial<TFilters>;
  cssClass: string;
}

// Highlight service is generic
class HighlightService<TFilters> {
  highlightFilters$: Observable<Partial<TFilters>>;

  updateHighlight(filters: Partial<TFilters>): void;
  clearHighlight(): void;
}
```

**Success Criteria**: Highlighting works for any data type

---

#### **F13: Generic Pop-Out Window System**
**Type**: Framework - Feature
**Dependencies**: F3

**Deliverables**:
- **Generic** pop-out window component
- `PopOutContextService` for cross-window communication
- BroadcastChannel integration
- Window management utilities
- State synchronization via URL (automatic via F3)

**Key Interfaces**:
```typescript
// ✅ CORRECT: Generic pop-out system
@Component({ selector: 'popout-container' })
class PopOutContainerComponent {
  @Input() contentTemplate: TemplateRef<any>;
}

class PopOutContextService {
  openPopOut(route: string, params?: any): Window;
  syncState<TState>(state: TState): void;
  closeAll(): void;
}
```

**Success Criteria**: Pop-outs work regardless of data being displayed

---

#### **F14: Generic Panel System with Drag-Drop**
**Type**: Framework - Feature
**Dependencies**: F1

**Deliverables**:
- **Generic** panel container component
- Panel configuration: `PanelConfig`
- Angular CDK drag-drop integration
- Panel reorder persistence
- Collapsible panels

**Key Interfaces**:
```typescript
// ✅ CORRECT: Generic panel system
interface PanelConfig {
  id: string;
  title: string;
  component: Type<any>;
  collapsible: boolean;
  popOutEnabled: boolean;
}

@Component({ selector: 'panel-container' })
class PanelContainerComponent {
  @Input() panels: PanelConfig[];
}
```

**Success Criteria**: Panels work with any content type

---

#### **F15: Generic Hierarchical/Cascading Picker**
**Type**: Framework - Component
**Dependencies**: F7

**Deliverables**:
- **Generic** hierarchical picker (e.g., category → subcategory → item)
- Supports N-level cascading
- Parent-child relationship configuration
- Lazy loading of child items

**Key Interfaces**:
```typescript
// ✅ CORRECT: Generic hierarchy
interface HierarchicalConfig<TParent, TChild> {
  parentConfig: PickerConfig<TParent>;
  childConfig: PickerConfig<TChild>;
  relationshipField: keyof TChild;
  levels: number;  // Support N levels
}

@Component({ selector: 'hierarchical-picker' })
class HierarchicalPickerComponent<TParent, TChild> {
  @Input() config: HierarchicalConfig<TParent, TChild>;
  @Output() selectionChange = new EventEmitter<HierarchySelection<TParent, TChild>>();
}
```

**Success Criteria**: Works for make→model, country→state→city, category→subcategory→product

---

#### **F16: Generic Detail Browser with Row Expansion**
**Type**: Framework - Feature
**Dependencies**: F6

**Deliverables**:
- **Generic** row expansion system
- Detail loading configuration
- Lazy-load detail data
- Nested table support
- Custom detail templates

**Key Interfaces**:
```typescript
// ✅ CORRECT: Generic detail loading
interface DetailConfig<TParent, TDetail> {
  apiEndpoint: (parent: TParent) => string;
  detailColumns: TableColumn<TDetail>[];
  cacheDetails: boolean;
}

// Enhanced table with detail support
class BaseDataTableComponent<TData, TDetail = any> {
  @Input() detailConfig?: DetailConfig<TData, TDetail>;
  @Output() rowExpand = new EventEmitter<TData>();
}
```

**Success Criteria**: Works for vehicle→VINs, order→line items, farmer→crops

---

#### **F17: Generic Statistics Aggregation Service**
**Type**: Framework - Service
**Dependencies**: F4

**Deliverables**:
- **Generic** statistics calculation utilities
- Aggregation functions (count, sum, avg, min, max, group by)
- Histogram data preparation
- Chart data transformation utilities

**Key Interfaces**:
```typescript
// ✅ CORRECT: Generic statistics
class StatisticsService {
  aggregate<TData>(
    data: TData[],
    groupByField: keyof TData,
    aggregateField?: keyof TData,
    aggregateFunction?: 'count' | 'sum' | 'avg'
  ): AggregatedData[];

  prepareHistogramData<TData>(
    data: TData[],
    field: keyof TData,
    bins?: number
  ): HistogramData;
}
```

**Success Criteria**: Statistics work for any data type

---

#### **F18: Generic Column Management System**
**Type**: Framework - Feature
**Dependencies**: F6, F10

**Deliverables**:
- **Generic** column manager component
- Column visibility toggle
- Drag-drop column reordering
- Column width adjustment
- Column state persistence (via F10)

**Success Criteria**: Column management works for any table

---

#### **F19: Generic Configuration Schema & Validation**
**Type**: Framework - Infrastructure
**Dependencies**: All framework components

**Deliverables**:
- **Configuration schema** defining what a domain must provide:
  ```typescript
  interface DomainConfig<TFilters, TData, TStatistics> {
    // Required domain information
    domainName: string;
    domainLabel: string;

    // API configuration
    apiBaseUrl: string;
    apiEndpoints: EndpointConfig;

    // Data models (types only, defined by domain)
    filterModel: Type<TFilters>;
    dataModel: Type<TData>;
    statisticsModel: Type<TStatistics>;

    // Adapters (domain implements these)
    apiAdapter: IApiAdapter<TFilters, TData, TStatistics>;
    urlMapper: IFilterUrlMapper<TFilters>;
    cacheKeyBuilder: ICacheKeyBuilder<TFilters>;

    // UI Configuration
    tableColumns: TableColumn<TData>[];
    pickers: PickerConfig<any>[];
    filters: FilterDefinition<any>[];
    charts: ChartConfig[];
    panels: PanelConfig[];

    // Feature flags
    features: {
      highlighting: boolean;
      popOuts: boolean;
      rowExpansion: boolean;
      // etc.
    };
  }
  ```
- Configuration validator
- Type-safe configuration loading
- Configuration documentation generator

**Success Criteria**: Framework can consume any valid domain configuration

---

## DOMAIN CONFIGURATION MILESTONES (D1-D4)

These milestones configure the framework for the **automobile domain**.

---

### **Tier 4: Automobile Domain Configuration (Week 9)**

#### **D1: Automobile Domain Models**
**Type**: Domain Configuration
**Dependencies**: F19

**Deliverables**:
- Domain-specific models (in `domain-config/automobile/models/`):
  ```typescript
  // ✅ Domain-specific naming is OK here (in config layer)
  interface AutoSearchFilters {
    manufacturers?: string[];
    models?: string[];
    yearMin?: number;
    yearMax?: number;
    bodyClass?: string[];
    dataSource?: string[];
    vins?: string[];
    page: number;
    size: number;
    sortField?: string;
    sortOrder?: 'asc' | 'desc';
  }

  interface AutoData {
    id: string;
    manufacturer: string;
    model: string;
    year: number;
    bodyClass: string;
    vinCount: number;
  }

  interface AutoStatistics {
    manufacturerDistribution: DistributionData[];
    modelDistribution: DistributionData[];
    yearDistribution: DistributionData[];
    bodyClassDistribution: DistributionData[];
  }

  interface VinInstance {
    vin: string;
    condition: string;
    mileage: number;
    location: string;
    registrationState: string;
  }
  ```

**Success Criteria**: All automobile domain types defined

---

#### **D2: Automobile API Adapter**
**Type**: Domain Configuration
**Dependencies**: D1, F4

**Deliverables**:
- `AutoApiAdapter` implements `IApiAdapter<AutoSearchFilters, AutoData, AutoStatistics>`
- API endpoint mapping:
  ```typescript
  // ✅ Domain adapter (in domain-config/automobile/adapters/)
  @Injectable()
  class AutoApiAdapter implements IApiAdapter<AutoSearchFilters, AutoData, AutoStatistics> {
    private baseUrl = 'http://autos.minilab/api/v1';

    fetchData(filters: AutoSearchFilters): Observable<ApiResponse<AutoData>> {
      return this.api.get<AutoData>(`${this.baseUrl}/vehicles/details`, filters);
    }

    fetchStatistics(filters: AutoSearchFilters): Observable<AutoStatistics> {
      return this.api.get<AutoStatistics>(`${this.baseUrl}/vehicles/statistics`, filters);
    }
  }
  ```

**Success Criteria**: Adapter makes real automobile API calls

---

#### **D3: Automobile Filter URL Mapper**
**Type**: Domain Configuration
**Dependencies**: D1, F3, F4

**Deliverables**:
- `AutoFilterUrlMapper` implements `IFilterUrlMapper<AutoSearchFilters>`
- Bidirectional URL conversion specific to auto filters:
  ```typescript
  // ✅ Domain adapter (in domain-config/automobile/adapters/)
  @Injectable()
  class AutoFilterUrlMapper implements IFilterUrlMapper<AutoSearchFilters> {
    filtersToParams(filters: AutoSearchFilters): Record<string, any> {
      return {
        mfr: filters.manufacturers?.join(','),
        mdl: filters.models?.join(','),
        yMin: filters.yearMin,
        yMax: filters.yearMax,
        bc: filters.bodyClass?.join(','),
        ds: filters.dataSource?.join(','),
        vins: filters.vins?.join(','),
        p: filters.page,
        sz: filters.size,
        sort: filters.sortField,
        dir: filters.sortOrder
      };
    }

    paramsToFilters(params: Record<string, any>): Partial<AutoSearchFilters> {
      // Reverse mapping
    }
  }
  ```

**Success Criteria**: Auto filters sync to URL correctly

---

#### **D4: Automobile UI Configuration**
**Type**: Domain Configuration
**Dependencies**: D1, F6, F7, F8, F11

**Deliverables**:
- Complete UI configuration for automobile domain (in `domain-config/automobile/configs/`):
  ```typescript
  // ✅ Domain configuration

  // Table columns for automobile data
  export const AUTO_TABLE_COLUMNS: TableColumn<AutoData>[] = [
    { field: 'manufacturer', header: 'Manufacturer', sortable: true },
    { field: 'model', header: 'Model', sortable: true },
    { field: 'year', header: 'Year', sortable: true },
    { field: 'bodyClass', header: 'Body Class', sortable: true },
    { field: 'vinCount', header: 'VIN Count', sortable: true }
  ];

  // Picker configurations
  export const AUTO_PICKERS: PickerConfig<any>[] = [
    {
      id: 'manufacturer-model',
      label: 'Manufacturer & Model',
      apiEndpoint: '/manufacturer-model-combinations',
      displayField: (item) => `${item.manufacturer} - ${item.model}`,
      valueField: 'id',
      searchFields: ['manufacturer', 'model'],
      multiSelect: true,
      cascading: {
        parentField: 'manufacturer',
        childField: 'models'
      }
    },
    {
      id: 'vin-picker',
      label: 'VIN Search',
      apiEndpoint: '/vins',
      displayField: 'vin',
      valueField: 'vin',
      searchFields: ['vin'],
      multiSelect: true
    }
  ];

  // Filter definitions
  export const AUTO_FILTERS: FilterDefinition<any>[] = [
    {
      id: 'manufacturers',
      label: 'Manufacturers',
      type: 'multi-select',
      options: []  // Loaded dynamically
    },
    {
      id: 'year-range',
      label: 'Year Range',
      type: 'range'
    },
    // etc.
  ];

  // Chart configurations
  export const AUTO_CHARTS: ChartConfig[] = [
    {
      type: 'bar',
      title: 'Manufacturer Distribution',
      dataSource: 'manufacturerDistribution',
      xAxisField: 'manufacturer',
      yAxisField: 'count',
      clickEnabled: true
    },
    // etc.
  ];

  // Complete domain configuration
  export const AUTOMOBILE_DOMAIN_CONFIG: DomainConfig<AutoSearchFilters, AutoData, AutoStatistics> = {
    domainName: 'automobile',
    domainLabel: 'Automobile Discovery',
    apiBaseUrl: 'http://autos.minilab/api/v1',
    filterModel: AutoSearchFilters,
    dataModel: AutoData,
    statisticsModel: AutoStatistics,
    apiAdapter: AutoApiAdapter,
    urlMapper: AutoFilterUrlMapper,
    cacheKeyBuilder: AutoCacheKeyBuilder,
    tableColumns: AUTO_TABLE_COLUMNS,
    pickers: AUTO_PICKERS,
    filters: AUTO_FILTERS,
    charts: AUTO_CHARTS,
    features: {
      highlighting: true,
      popOuts: true,
      rowExpansion: true
    }
  };
  ```

**Success Criteria**: Complete automobile domain configuration ready

---

## APPLICATION INSTANCE MILESTONES (A1-A3)

These milestones wire the framework + domain configuration into a deployable application.

---

### **Tier 5: Application Instance (Week 10)**

#### **A1: Application Bootstrap & Wiring**
**Type**: Application Instance
**Dependencies**: F1-F19, D1-D4

**Deliverables**:
- Main application module (in `app/`):
  ```typescript
  // ✅ Application just wires framework + domain
  @NgModule({
    imports: [
      // Framework modules (from framework/)
      FrameworkCoreModule,
      FrameworkComponentsModule,

      // Domain configuration (from domain-config/automobile/)
      AutomobileDomainModule
    ],
    providers: [
      // Provide domain configuration to framework
      { provide: DOMAIN_CONFIG, useValue: AUTOMOBILE_DOMAIN_CONFIG }
    ]
  })
  export class AppModule {}
  ```
- Discover page component (thin wrapper):
  ```typescript
  // ✅ Generic discover page (works for any domain)
  @Component({
    selector: 'app-discover',
    template: `
      <panel-container [panels]="panels$ | async"></panel-container>
    `
  })
  class DiscoverComponent {
    panels$ = this.domainConfig.panels$;

    constructor(
      @Inject(DOMAIN_CONFIG) private domainConfig: DomainConfig<any, any, any>
    ) {}
  }
  ```
- Routing configuration
- Environment setup (dev, prod)

**Success Criteria**: Application loads with automobile domain

---

#### **A2: Feature Components (Domain-Agnostic)**
**Type**: Application Instance
**Dependencies**: A1

**Deliverables**:
- **Generic** feature components that use framework + domain config:
  ```typescript
  // ✅ Results component works for ANY domain
  @Component({
    selector: 'app-results',
    template: `
      <base-data-table
        [data]="data$ | async"
        [columns]="columns"
        [loading]="loading$ | async"
        (sortChange)="onSort($event)"
        (pageChange)="onPage($event)">
      </base-data-table>
    `
  })
  class ResultsComponent<TFilters, TData, TStats> {
    data$ = this.resourceService.data$;
    loading$ = this.resourceService.loading$;
    columns: TableColumn<TData>[];

    constructor(
      @Inject(DOMAIN_CONFIG) domainConfig: DomainConfig<TFilters, TData, TStats>,
      private resourceService: ResourceManagementService<TFilters, TData, TStats>
    ) {
      this.columns = domainConfig.tableColumns;
    }

    onSort(event: SortEvent) {
      this.resourceService.updateFilters({
        sortField: event.field,
        sortOrder: event.order
      } as any);
    }
  }
  ```

**Success Criteria**: Components work with automobile domain config

---

#### **A3: Production Deployment**
**Type**: Application Instance
**Dependencies**: A1, A2

**Deliverables**:
- Production build configuration
- Docker configuration
- Nginx SPA routing
- Environment-specific configs
- Deployment scripts

**Success Criteria**: Application deployed and accessible

---

## FUTURE DOMAIN CONFIGURATIONS

To prove the framework is truly reusable, demonstrate adding a new domain:

### **Agriculture Domain (Future)**

```typescript
// domain-config/agriculture/models/agriculture.models.ts
interface AgricultureSearchFilters {
  crops?: string[];
  regions?: string[];
  farmSize?: { min: number, max: number };
  certifications?: string[];
  // etc.
}

// domain-config/agriculture/agriculture.config.ts
export const AGRICULTURE_DOMAIN_CONFIG: DomainConfig<AgricultureSearchFilters, FarmData, AgricultureStats> = {
  domainName: 'agriculture',
  domainLabel: 'Agricultural Data Explorer',
  apiBaseUrl: 'https://ag-api.example.com/v1',
  // ... rest of config
};

// app/app.module.ts - JUST CHANGE THE IMPORT!
@NgModule({
  providers: [
    { provide: DOMAIN_CONFIG, useValue: AGRICULTURE_DOMAIN_CONFIG }  // ← Only change!
  ]
})
export class AppModule {}
```

**Result**: Same framework, completely different domain, minimal code changes!

---

## Key Architectural Validation

### **Framework Code Audit**
Before F19 is complete, audit `framework/` directory:

```bash
# ❌ FAIL if found:
grep -r "vehicle\|manufacturer\|vin\|automobile" framework/

# ✅ PASS if found:
grep -r "TData\|TFilters\|generic\|reusable" framework/
```

### **Domain Isolation Test**
```bash
# Copy framework to new project
cp -r src/framework/ ../agriculture-app/src/framework/

# Create agriculture domain config
# Wire up - should work with zero framework changes!
```

---

## Timeline Summary

| Weeks | Tier | Milestones | Result |
|-------|------|------------|--------|
| 1 | 0 | F1 | Foundation with three-layer structure |
| 2-4 | 1 | F2-F5 | Core framework infrastructure |
| 5-6 | 2 | F6-F10 | Reusable components |
| 7-8 | 3 | F11-F19 | Advanced features + config schema |
| 9 | 4 | D1-D4 | Automobile domain configuration |
| 10 | 5 | A1-A3 | Application instance deployed |

**Total: 10 weeks to production-ready, reusable framework**

---

## Success Criteria for True Reusability

The framework is successful if:

1. ✅ **No domain terms in framework code**: `grep -r "vehicle" framework/` returns nothing
2. ✅ **New domain in < 1 week**: Agriculture config can be created in days, not weeks
3. ✅ **Framework code unchanged**: Adding agriculture requires ZERO framework changes
4. ✅ **Configuration-driven**: 90%+ of domain specifics are in config files, not code
5. ✅ **Type-safe**: TypeScript enforces correct usage across all domains

---

*This milestone plan builds a truly reusable, domain-agnostic discovery framework that can power automobile, agriculture, real estate, medical device, or any other domain with minimal configuration.*
