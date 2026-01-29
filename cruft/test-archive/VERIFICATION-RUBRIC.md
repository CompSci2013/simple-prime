# VERIFICATION RUBRIC
## Generic-Prime Application - URL-First Architecture Compliance

**Purpose**: This rubric provides a standardized checklist for verifying that the generic-prime application adheres to URL-First architecture principles and maintains domain-agnostic framework services.

**Audience**: Developers, code reviewers, architects

**Usage**: Execute this verification process:
1. Before major releases
2. After adding new features
3. When integrating new domains
4. During code reviews for architecture-sensitive changes

---

## VERIFICATION PROCESS

### Step 1: Read Architectural Requirements

**Objective**: Understand the URL-First architecture specification

**Actions**:
1. Read section **5. ARCHITECTURAL PATTERNS** of [specs/01-architectural-analysis.md](specs/01-architectural-analysis.md#L323-L396)
2. Focus on **Section 5.1: URL-First State Management**
3. Understand the specified data flow:
   ```
   URL Query Parameters
     ↕ (sync)
   UrlStateService
     ↕
   ResourceManagementService<TFilters, TData>
     ↕
   Components (subscribe to observables)
   ```

**Success Criteria**:
- [ ] You understand that URL is the **single source of truth** for application state
- [ ] You understand the data flow: URL → Filters → API → Data → Components
- [ ] You understand that components must NOT make direct HTTP calls

---

### Step 2: Analyze Framework Services

**Objective**: Verify all framework services are domain-agnostic

**Actions**:
1. List all services in [frontend/src/framework/services/](frontend/src/framework/services/)
2. For each service, verify:
   - ✅ Uses TypeScript generics for type safety
   - ✅ Accepts configuration/data as parameters (not hardcoded)
   - ✅ Contains NO domain-specific logic (vehicles, automobiles, etc.)
   - ✅ Can be reused for ANY domain (agriculture, real estate, etc.)

**Services to Check**:
```
├── api.service.ts                      # Generic HTTP client
├── url-state.service.ts                # Generic URL management
├── resource-management.service.ts      # Generic state orchestration
├── request-coordinator.service.ts      # Generic caching/retry
├── domain-config-registry.service.ts   # Configuration registry
├── domain-config-validator.service.ts  # Configuration validation
├── picker-config-registry.service.ts   # Picker configuration registry
├── error-notification.service.ts       # Error handling
├── global-error.handler.ts             # Global error handler
├── http-error.interceptor.ts           # HTTP error interceptor
└── popout-context.service.ts           # Pop-out window coordination
```

**Verification Checklist**:
- [ ] **ApiService**:
  - [ ] Accepts `endpoint` as parameter (not hardcoded URLs)
  - [ ] Methods are generic: `get<TData>(endpoint, options)`
  - [ ] No domain-specific methods (e.g., `getVehicles()`)
- [ ] **UrlStateService**:
  - [ ] Generic parameter handling: `getParams<TParams>()`
  - [ ] No domain-specific parameter names
- [ ] **ResourceManagementService**:
  - [ ] Type parameters: `<TFilters, TData, TStatistics>`
  - [ ] Accepts adapters via configuration (dependency injection)
  - [ ] Plain TypeScript class (not Angular service)
- [ ] **RequestCoordinatorService**:
  - [ ] Generic request execution: `execute<T>(key, requestFn, config)`
  - [ ] No domain-specific caching logic
- [ ] **DomainConfigRegistry**:
  - [ ] Supports multiple domains: `register()`, `get()`, `setActive()`
  - [ ] Generic domain config: `DomainConfig<any, any, any>`

**Red Flags** (FAIL if found):
- ❌ Hardcoded API endpoints in framework services
- ❌ Domain-specific method names (e.g., `getVehicles()`, `fetchAutomobiles()`)
- ❌ Import statements referencing domain models in framework code
- ❌ Business logic specific to one domain

**Success Criteria**:
- [ ] All framework services are generic and domain-agnostic
- [ ] No red flags detected

---

### Step 3: Verify Domain Configuration

**Objective**: Ensure domain-specific configuration is properly isolated and uses environment variables

**Actions**:
1. Examine domain configuration file: [frontend/src/domain-config/automobile/automobile.domain-config.ts](frontend/src/domain-config/automobile/automobile.domain-config.ts)
2. Check for hardcoded values
3. Verify environment variable usage

**Verification Checklist**:
- [ ] **API Base URL**:
  - [ ] ✅ Read from `environment.apiBaseUrl` (NOT hardcoded)
  - [ ] ✅ Defined in [frontend/src/environments/environment.ts](frontend/src/environments/environment.ts)
  - [ ] ✅ Different values for different environments (dev, prod)
  - [ ] ❌ **FAIL**: `apiBaseUrl: 'http://...'` hardcoded in domain config
- [ ] **Domain Config Structure**:
  - [ ] Uses factory function: `createXxxDomainConfig(injector: Injector)`
  - [ ] Injects `ApiService` from Injector
  - [ ] Returns `DomainConfig<TFilters, TData, TStatistics>`
  - [ ] All adapters receive base URL from environment
- [ ] **Adapter Configuration**:
  - [ ] API adapter receives base URL in constructor
  - [ ] Endpoints are relative paths: `'/vehicles/details'`
  - [ ] Full URL constructed: `` `${this.baseUrl}${endpoint}` ``
- [ ] **No Hardcoded URLs**:
  - [ ] Search for `http://` in domain config → Only in environment imports
  - [ ] Search for `https://` in domain config → Only in environment imports
  - [ ] No hardcoded domain names (`.com`, `.net`, `.org`)

**Environment Configuration Checklist**:
```typescript
// environment.ts
export const environment = {
  production: false,
  apiBaseUrl: 'http://localhost:8080/api/v1'  // ✅ Development
};

// environment.prod.ts
export const environment = {
  production: true,
  apiBaseUrl: 'https://api.production.com/v1'  // ✅ Production
};
```

**Success Criteria**:
- [ ] API base URL comes from environment configuration
- [ ] No hardcoded URLs in domain config
- [ ] Different environments have different API URLs

---

### Step 4: Search for Architecture Violations

**Objective**: Find code that bypasses the URL-First architecture

**Actions**:

#### 4.1 Search for Direct HTTP Calls in Components
```bash
# From frontend/src/app directory
grep -r "HttpClient" --include="*.ts" --exclude-dir="node_modules"
grep -r "http\.get\|http\.post" --include="*.ts" --exclude-dir="node_modules"
```

**Expected Result**: ❌ No matches (except in test files)

**If matches found**:
- [ ] Examine each file
- [ ] Verify it's a test file (`.spec.ts`) → **OK**
- [ ] If in component/service → **VIOLATION**

#### 4.2 Search for Hardcoded API URLs
```bash
# Search for URLs in source code
grep -r "http://\|https://" --include="*.ts" --exclude-dir="node_modules" frontend/src/app
grep -r "http://\|https://" --include="*.ts" --exclude-dir="node_modules" frontend/src/domain-config
grep -r "/api/v1\|/api/" --include="*.ts" --exclude-dir="node_modules" frontend/src/app
```

**Expected Results**:
- ✅ No matches in `frontend/src/app/**/*.ts` (except test files)
- ✅ No matches in domain config (except environment imports)
- ✅ Relative paths like `'/vehicles/details'` in adapters are **OK**
- ❌ Full URLs like `'http://example.com/api'` are **VIOLATIONS**

#### 4.3 Search for Direct Router Navigation with Query Params
```bash
# Search for direct router usage with queryParams
grep -r "router\.navigate.*queryParams" --include="*.ts" --exclude-dir="node_modules" frontend/src/app
```

**Expected Result**:
- ✅ Only found in `UrlStateService` (correct location)
- ❌ Found in components → **VIOLATION** (must use UrlStateService)

#### 4.4 Search for ResourceManagementService Usage
```bash
# Verify components create ResourceManagementService instances
grep -r "new ResourceManagementService" --include="*.ts" --exclude-dir="node_modules" frontend/src/app
```

**Expected Result**:
- ✅ Found in feature components (correct)
- ✅ Receives `urlStateService` and domain config
- ❌ Components not using ResourceManagementService → **VIOLATION**

**Verification Checklist**:
- [ ] No direct HTTP calls from components
- [ ] No hardcoded API URLs in application code
- [ ] All URL navigation goes through UrlStateService
- [ ] Components use ResourceManagementService for state management

**Success Criteria**:
- [ ] No architecture violations found
- [ ] All components follow URL-First pattern

---

### Step 5: Examine Component Implementation

**Objective**: Verify components correctly implement URL-First architecture

**Actions**:
1. Identify all feature components in [frontend/src/app/features/](frontend/src/app/features/)
2. For each component, verify the pattern:

**Required Pattern**:
```typescript
export class MyFeatureComponent implements OnInit, OnDestroy {
  // 1. Inject domain config
  constructor(
    @Inject(DOMAIN_CONFIG) domainConfig: DomainConfig<TFilters, TData, TStats>,
    private urlStateService: UrlStateService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // 2. Create ResourceManagementService
    this.resourceService = new ResourceManagementService<TFilters, TData, TStats>(
      this.urlStateService,
      {
        filterMapper: this.domainConfig.urlMapper,
        apiAdapter: this.domainConfig.apiAdapter,
        cacheKeyBuilder: this.domainConfig.cacheKeyBuilder,
        defaultFilters: new TFilters()
      }
    );

    // 3. Subscribe to observables
    this.filters$ = this.resourceService.filters$;
    this.results$ = this.resourceService.results$;
    this.loading$ = this.resourceService.loading$;
  }

  // 4. Update filters through service
  onFilterChange(field: string, value: any): void {
    const newFilters = { ...this.currentFilters, [field]: value };
    this.resourceService.updateFilters(newFilters); // ✅ Updates URL
  }

  ngOnDestroy(): void {
    // 5. Clean up
    this.resourceService.destroy();
  }
}
```

**Component Verification Checklist**:

For each feature component, verify:
- [ ] **Dependency Injection**:
  - [ ] Injects `DOMAIN_CONFIG` token
  - [ ] Injects `UrlStateService`
  - [ ] Does NOT inject `HttpClient` directly
- [ ] **State Management**:
  - [ ] Creates `ResourceManagementService` instance in `ngOnInit()`
  - [ ] Subscribes to observable streams (`filters$`, `results$`, `loading$`)
  - [ ] Does NOT maintain state in component properties (except for template binding)
- [ ] **Filter Updates**:
  - [ ] All filter changes call `resourceService.updateFilters()`
  - [ ] Does NOT call `router.navigate()` directly
  - [ ] Does NOT call API service directly
- [ ] **Lifecycle Management**:
  - [ ] Calls `resourceService.destroy()` in `ngOnDestroy()`
  - [ ] Uses `takeUntil(destroy$)` for subscriptions (if manually subscribing)
- [ ] **Change Detection**:
  - [ ] Uses `ChangeDetectionStrategy.OnPush` (performance optimization)
  - [ ] Calls `cdr.markForCheck()` when needed
- [ ] **🔴 CRITICAL: Domain-Agnostic Template**:
  - [ ] Template uses `*ngFor` to dynamically render filters from `domainConfig.filters`
  - [ ] NO hardcoded filter field names (manufacturer, model, yearMin, etc.)
  - [ ] NO hardcoded filter types (specific to one domain)
  - [ ] Reads FilterDefinition properties: `id`, `label`, `type`, `placeholder`, `format`
  - [ ] Applies `format` configuration to PrimeNG components (useGrouping, etc.)
  - [ ] Works with ANY domain configuration, not just automobile

**Red Flags** (FAIL if found):
- ❌ Component imports `HttpClient`
- ❌ Component calls `this.http.get()` directly
- ❌ Component maintains complex state without using ResourceManagementService
- ❌ Component calls `router.navigate()` with `queryParams` directly
- ❌ Component has `apiService.getVehicles()` calls
- ❌ **CRITICAL**: Template has hardcoded field names like `currentFilters.manufacturer`
- ❌ **CRITICAL**: Template has hardcoded filters not from `domainConfig.filters`
- ❌ **CRITICAL**: Template only works with automobile domain

**Success Criteria**:
- [ ] All components follow the required pattern
- [ ] No red flags detected
- [ ] Components are "thin" (mostly subscribe and update)

---

### Step 6: Verify Domain Adapters

**Objective**: Ensure domain adapters correctly wrap framework services

**Actions**:
1. Examine API adapter: [frontend/src/domain-config/automobile/adapters/automobile-api.adapter.ts](frontend/src/domain-config/automobile/adapters/automobile-api.adapter.ts)
2. Examine URL mapper: [frontend/src/domain-config/automobile/adapters/automobile-url-mapper.ts](frontend/src/domain-config/automobile/adapters/automobile-url-mapper.ts)

**API Adapter Verification**:
```typescript
export class AutomobileApiAdapter implements IApiAdapter<TFilters, TData, TStats> {
  private baseUrl: string;
  private apiService: ApiService;

  // ✅ Constructor receives injected dependencies
  constructor(apiService: ApiService, baseUrl: string) {
    this.apiService = apiService;
    this.baseUrl = baseUrl;
  }

  // ✅ Uses generic ApiService
  fetchData(filters: TFilters): Observable<ApiAdapterResponse<TData, TStats>> {
    const params = this.filtersToApiParams(filters);

    // ✅ Constructs full URL from base + endpoint
    return this.apiService
      .get<TData>(`${this.baseUrl}${this.VEHICLES_ENDPOINT}`, { params })
      .pipe(map(response => this.transformResponse(response)));
  }
}
```

**API Adapter Checklist**:
- [ ] Implements `IApiAdapter<TFilters, TData, TStatistics>` interface
- [ ] Receives `ApiService` in constructor (injected)
- [ ] Receives `baseUrl` in constructor (from domain config)
- [ ] Endpoints are relative constants: `private readonly VEHICLES_ENDPOINT = '/vehicles/details'`
- [ ] Constructs full URLs: `` `${this.baseUrl}${endpoint}` ``
- [ ] Uses generic ApiService methods: `this.apiService.get<TData>()`
- [ ] No hardcoded full URLs

**URL Mapper Verification**:
```typescript
export class AutomobileUrlMapper implements IFilterUrlMapper<TFilters> {
  // ✅ Bidirectional conversion
  toUrlParams(filters: TFilters): Params {
    const params: Params = {};
    if (filters.manufacturer) params['manufacturer'] = filters.manufacturer;
    // ... other fields
    return params;
  }

  fromUrlParams(params: Params): TFilters {
    const filters = new TFilters();
    if (params['manufacturer']) filters.manufacturer = params['manufacturer'];
    // ... other fields
    return filters;
  }
}
```

**URL Mapper Checklist**:
- [ ] Implements `IFilterUrlMapper<TFilters>` interface
- [ ] Implements `toUrlParams()` method (filters → URL)
- [ ] Implements `fromUrlParams()` method (URL → filters)
- [ ] Parameter names match API expectations
- [ ] Type conversions handled correctly (string ↔ number)
- [ ] Null/undefined values filtered out in `toUrlParams()`

**Success Criteria**:
- [ ] API adapter correctly wraps ApiService
- [ ] API adapter uses base URL from constructor
- [ ] No hardcoded URLs in adapters
- [ ] URL mapper implements bidirectional conversion

---

### Step 7: Test Domain-Agnostic Claim

**Objective**: Verify framework can support multiple domains without modification

**Thought Experiment**:
Imagine adding a new domain (e.g., "agriculture" for crop discovery). Answer these questions:

1. **Can I create a new domain WITHOUT modifying framework services?**
   - [ ] ✅ YES → Domain-agnostic framework
   - [ ] ❌ NO → Framework has domain-specific logic (FAIL)

2. **What files would I need to create?** (All in `frontend/src/domain-config/agriculture/`):
   - [ ] `agriculture.domain-config.ts` - Domain configuration factory
   - [ ] `models/agriculture.filters.ts` - Filter model
   - [ ] `models/crop-result.ts` - Data model
   - [ ] `models/crop-statistics.ts` - Statistics model
   - [ ] `adapters/agriculture-api.adapter.ts` - API adapter
   - [ ] `adapters/agriculture-url-mapper.ts` - URL mapper
   - [ ] `adapters/agriculture-cache-key-builder.ts` - Cache key builder
   - [ ] `configs/agriculture.table-config.ts` - Table configuration
   - [ ] `configs/agriculture.picker-configs.ts` - Picker configurations
   - [ ] `configs/agriculture.filter-definitions.ts` - Filter definitions
   - [ ] `configs/agriculture.chart-configs.ts` - Chart configurations

3. **Would I need to modify ANY framework service?**
   - [ ] ✅ NO → Correct (domain-agnostic)
   - [ ] ❌ YES → Framework is NOT domain-agnostic (FAIL)

4. **Would I need to modify app.module.ts?**
   - [ ] ✅ YES → Only to switch domain config provider (acceptable)
   ```typescript
   // Change this:
   { provide: DOMAIN_CONFIG, useFactory: createAutomobileDomainConfig, deps: [Injector] }
   // To this:
   { provide: DOMAIN_CONFIG, useFactory: createAgricultureDomainConfig, deps: [Injector] }
   ```

5. **Could I register BOTH domains and switch between them?**
   - [ ] ✅ YES → Via `DomainConfigRegistry.setActive('agriculture')` (correct)
   - [ ] ❌ NO → Framework design issue (FAIL)

**Success Criteria**:
- [ ] Framework services require ZERO modifications for new domains
- [ ] All new code goes in `domain-config/[new-domain]/` folder
- [ ] Only `app.module.ts` provider needs updating (to inject new domain)

---

### Step 8: Pop-Out Window Architecture ⚠️ CRITICAL

**Objective**: Verify pop-out window patterns follow cross-window synchronization requirements

**Background**: Pop-out windows introduce unique challenges:
- Unfocused browser windows don't run scheduled Angular change detection
- State must synchronize bidirectionally (main ↔ pop-out)
- Components must initialize properly in pop-out context
- BroadcastChannel API enables cross-window messaging

**Importance**: 71% of recent bugs (5 out of 7) were pop-out related. This step catches critical issues that only manifest in multi-window scenarios.

---

#### 8.1 Bidirectional URL Synchronization

**Pattern**: Pop-out windows must update BOTH their own URL AND broadcast to main window.

**Required Implementation**:
```typescript
// ✅ CORRECT: Update own URL first, then broadcast
onUrlParamsChange(params: Params): void {
  // Step 1: Update pop-out's own URL (single source of truth)
  this.urlState.setParams(params);

  // Step 2: Broadcast to main window
  this.popOutContext.sendMessage({
    type: PopOutMessageType.URL_PARAMS_CHANGED,
    payload: { params },
    timestamp: Date.now()
  });
}

// ❌ WRONG: Only broadcast, don't update own URL
onUrlParamsChange(params: Params): void {
  this.popOutContext.sendMessage({
    type: PopOutMessageType.URL_PARAMS_CHANGED,
    payload: { params },
    timestamp: Date.now()
  });
  // Missing: this.urlState.setParams(params);
}
```

**Verification Checklist**:
- [ ] `PanelPopoutComponent.onUrlParamsChange()` calls `urlState.setParams()` first
- [ ] `PanelPopoutComponent.onUrlParamsChange()` sends BroadcastChannel message second
- [ ] `StatisticsPanelComponent.onChartClick()` updates URL when in pop-out context
- [ ] `StatisticsPanelComponent` broadcasts changes to main window when in pop-out
- [ ] Main window receives messages and updates its own URL
- [ ] Pop-out receives messages and updates its own URL

**Test Scenarios**:
1. Pop out Query Control → Click "Clear All" → Verify pop-out URL updates
2. Pop out Statistics → Click chart bar → Verify main window URL updates
3. Main window → Clear filter → Verify pop-out URL updates

---

#### 8.2 OnPush Change Detection in Unfocused Windows ⚠️ CRITICAL

**Pattern**: Unfocused windows require `detectChanges()` instead of `markForCheck()`.

**Why This Matters**:
- `markForCheck()` only **schedules** change detection for next cycle
- Unfocused browser windows **don't run** scheduled change detection cycles
- `detectChanges()` **forces immediate** execution regardless of focus

**Required Implementation**:
```typescript
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush  // Required for performance
})
export class BasePickerComponent {

  // ❌ WRONG: markForCheck() doesn't work in unfocused windows
  private subscribeToUrlChanges(): void {
    this.route.queryParams.subscribe(params => {
      this.selections = this.parseUrl(params);
      this.cdr.markForCheck();  // ❌ Only schedules - won't run if window unfocused
    });
  }

  // ✅ CORRECT: detectChanges() forces immediate update
  private subscribeToUrlChanges(): void {
    this.route.queryParams.subscribe(params => {
      this.selections = this.parseUrl(params);
      this.cdr.detectChanges();  // ✅ Forces immediate update, works in unfocused windows
    });
  }
}
```

**When to Use Each**:
- **`markForCheck()`**: Main window components (normal case)
  - Schedules change detection for next cycle
  - More efficient (batches updates)
  - Works fine for focused windows

- **`detectChanges()`**: Pop-out window components
  - Forces immediate change detection
  - Required for unfocused browser windows
  - Necessary for cross-window state synchronization

**Pop-Out-Specific Locations** (use `detectChanges()`):
1. **URL parameter change handlers** (when syncing from main window)
2. **BroadcastChannel message handlers** (cross-window communication)
3. **Selection hydration** (restoring state from URL)
4. **Pagination handlers** (loading new data)
5. **Data load completion** (after API calls)

**Verification Checklist**:
- [ ] Search for `markForCheck()` in components used in pop-outs:
  ```bash
  grep -n "markForCheck()" frontend/src/framework/components/base-picker/*.ts
  grep -n "markForCheck()" frontend/src/framework/components/statistics-panel/*.ts
  grep -n "markForCheck()" frontend/src/framework/components/query-control/*.ts
  ```
- [ ] For each `markForCheck()` found, verify:
  - [ ] Is this component used in pop-out windows? (Check `panel-popout.component.html`)
  - [ ] If YES → Must use `detectChanges()` instead
  - [ ] If NO (main window only) → `markForCheck()` is acceptable
- [ ] `BasePickerComponent.subscribeToUrlChanges()` uses `detectChanges()`
- [ ] `BasePickerComponent.hydrateFromUrl()` uses `detectChanges()`
- [ ] `BasePickerComponent.hydrateSelections()` uses `detectChanges()`
- [ ] `BasePickerComponent.onLazyLoad()` uses `detectChanges()` after data loads
- [ ] `StatisticsPanelComponent` uses `detectChanges()` in BroadcastChannel handlers
- [ ] `QueryControlComponent` uses `detectChanges()` when used in pop-out

**Test Scenarios** (CRITICAL):
1. Pop out picker → Don't focus it → Clear filter in main window → Verify picker updates immediately
2. Pop out picker → Don't focus it → Change page → Verify new page data displays
3. Pop out statistics → Don't focus it → Add highlight in main window → Verify charts update

**Red Flags** (FAIL if found):
- ❌ `markForCheck()` in URL sync handlers in pop-out components
- ❌ `markForCheck()` in BroadcastChannel message handlers
- ❌ `markForCheck()` in pagination handlers in pop-out components

---

#### 8.3 Component Initialization in Pop-Out Context

**Pattern**: All configurations must be registered in `PanelPopoutComponent.ngOnInit()`.

**Required Implementation**:
```typescript
// PanelPopoutComponent.ngOnInit()
ngOnInit(): void {
  // ✅ REQUIRED: Register picker configurations
  const pickerConfigs = createAutomobilePickerConfigs(this.injector);
  this.pickerRegistry.registerMultiple(pickerConfigs);

  // ✅ REQUIRED: Chart data sources registered via domain config
  // (Already handled by DOMAIN_CONFIG injection)

  // Extract route parameters and initialize
  this.route.params.subscribe(params => {
    this.gridId = params['gridId'];
    this.panelId = params['panelId'];
    this.panelType = params['type'];

    // ✅ Initialize as pop-out
    this.popOutContext.initializeAsPopOut(this.panelId);
  });
}
```

**Verification Checklist**:
- [ ] `PanelPopoutComponent` registers picker configs in `ngOnInit()`
- [ ] `PanelPopoutComponent` has `DOMAIN_CONFIG` injected
- [ ] `PanelPopoutComponent` provides `RESOURCE_MANAGEMENT_SERVICE` via factory
- [ ] `PanelPopoutComponent` calls `popOutContext.initializeAsPopOut()`
- [ ] All pop-out components can access same data as main window
- [ ] No "empty content" when pop-out opens (all data loads correctly)

**Test Scenarios**:
1. Pop out Manufacturer-Model Picker → Verify table shows data (not empty)
2. Pop out Statistics → Verify charts render (not blank)
3. Pop out Query Control → Verify filter options load in dialogs

**Red Flags** (FAIL if found):
- ❌ Pop-out shows empty content (white/blank area)
- ❌ Pop-out shows "Loading..." indefinitely
- ❌ Console errors about missing configurations

---

#### 8.4 BroadcastChannel Message Handling

**Pattern**: Pop-outs must subscribe to messages and respond appropriately.

**Required Implementation**:
```typescript
// Main window broadcasts URL changes
broadcastUrlParamsToPopOuts(params: Params): void {
  if (this.popOuts.size > 0) {
    this.popOutContext.sendMessage({
      type: PopOutMessageType.URL_PARAMS_SYNC,
      payload: { params },
      timestamp: Date.now()
    });
  }
}

// Pop-out subscribes to messages
ngOnInit(): void {
  this.popOutContext.getMessages$()
    .pipe(takeUntil(this.destroy$))
    .subscribe(message => this.handleMessage(message));
}

private handleMessage(message: PopOutMessage): void {
  switch (message.type) {
    case PopOutMessageType.CLOSE_POPOUT:
      window.close();
      break;
    case PopOutMessageType.URL_PARAMS_SYNC:
      this.syncUrlParams(message.payload.params);
      break;
    case PopOutMessageType.URL_PARAMS_CHANGED:
      this.syncUrlParams(message.payload.params);
      break;
  }
}
```

**Message Types** (verify all are defined):
- `CLOSE_POPOUT` - Main window requests pop-out to close
- `URL_PARAMS_SYNC` - Main window sends URL params to pop-out
- `URL_PARAMS_CHANGED` - Pop-out sends URL params to main window
- `PICKER_SELECTION_CHANGE` - Picker selection changed

**Verification Checklist**:
- [ ] `PopOutMessageType` enum defines all message types
- [ ] `PanelPopoutComponent` subscribes to `popOutContext.getMessages$()`
- [ ] `PanelPopoutComponent.handleMessage()` handles all message types
- [ ] Main window broadcasts URL changes when filters update
- [ ] Pop-out broadcasts URL changes when user interacts with charts/pickers
- [ ] Messages include `timestamp` field for debugging
- [ ] `takeUntil(destroy$)` pattern used for subscription cleanup

**Test Scenarios**:
1. Open pop-out → Main window adds filter → Pop-out receives message
2. Open pop-out → Pop-out adds highlight → Main window receives message
3. Open pop-out → Main window closes pop-out → Pop-out window closes

---

#### 8.5 Configuration Completeness

**Pattern**: All URL parameters must have corresponding filter definitions.

**Required Mappings**:
```typescript
// Picker URL parameter → Query Control filter definition
// Example: modelCombos parameter needs filter definition

// ✅ CORRECT: modelCombos filter defined
AUTOMOBILE_QUERY_CONTROL_FILTERS = [
  {
    field: 'modelCombos',
    label: 'Manufacturer & Model',
    type: 'multiselect',
    urlParams: 'modelCombos',
    optionsEndpoint: '${environment.apiBaseUrl}/manufacturer-model-combinations',
    // ... transformer and other config
  }
];

// ❌ WRONG: Picker uses modelCombos parameter but no filter definition exists
// Result: Query Control won't show chips when picker selection made
```

**Verification Checklist**:
- [ ] List all URL parameters used by pickers:
  ```bash
  grep -n "urlParams:" frontend/src/domain-config/*/configs/*.picker-configs.ts
  ```
- [ ] For each URL parameter, verify corresponding filter definition exists:
  ```bash
  grep -n "urlParams:" frontend/src/domain-config/*/configs/*.query-control-filters.ts
  ```
- [ ] All picker URL params have Query Control filter definitions
- [ ] All chart click parameters map to highlight filter definitions
- [ ] Filter definitions have correct `optionsEndpoint` (matches picker data source)
- [ ] Filter definitions have correct `optionsTransformer` (matches picker format)

**Common Missing Definitions**:
- `modelCombos` - Manufacturer-Model picker combinations
- Chart-specific highlight parameters (`h_manufacturer`, `h_modelCombos`, etc.)

**Test Scenarios**:
1. Select item in picker → Verify chip appears in Query Control
2. Click chart bar → Verify highlight chip appears in Query Control
3. Edit chip in Query Control → Verify picker/chart reflects change

**Red Flags** (FAIL if found):
- ❌ URL parameter exists but no chip displayed in Query Control
- ❌ Picker selection updates URL but Query Control doesn't reflect it
- ❌ Chart click adds highlight parameter but no chip shown

---

#### 8.6 Pop-Out State Persistence

**Pattern**: Pop-outs must survive browser unfocus and maintain state.

**Verification Checklist**:
- [ ] Pop-out URL is single source of truth (not component state)
- [ ] Pop-out reads URL on init to restore state
- [ ] Pop-out subscribes to URL changes continuously
- [ ] Pop-out selections persist when main window updates
- [ ] Pop-out doesn't lose data when window unfocused

**Test Scenarios**:
1. Open pop-out → Make selection → Switch to another app → Return → Verify selection persists
2. Open pop-out → Main window updates filter → Pop-out unfocused → Verify pop-out updates
3. Open pop-out → Refresh pop-out window → Verify state restored from URL

---

## Step 8 Success Criteria

**Must Pass All**:
- [ ] Pop-outs update own URL before broadcasting to main window
- [ ] Pop-outs use `detectChanges()` instead of `markForCheck()` in critical paths
- [ ] All configurations registered in `PanelPopoutComponent.ngOnInit()`
- [ ] BroadcastChannel messages handled correctly in both directions
- [ ] All URL parameters have corresponding filter definitions
- [ ] Pop-outs maintain state when unfocused
- [ ] No "empty content" bugs in pop-outs
- [ ] No "stale state" bugs (updates only on focus)

**Critical Red Flags** (FAIL immediately):
- ❌ Pop-out uses `markForCheck()` in URL sync handlers
- ❌ Pop-out doesn't update own URL (only broadcasts)
- ❌ Pop-out shows empty content on open
- ❌ Pop-out doesn't update when unfocused

---

## VERIFICATION RESULTS TEMPLATE

Use this template to document verification results:

```markdown
# Verification Results

**Date**: YYYY-MM-DD
**Verifier**: [Your Name]
**Branch/Commit**: [Git branch or commit hash]

## Step 1: Architectural Requirements
- [x] Read Section 5 of specs/01-architectural-analysis.md
- [x] Understand URL-First data flow
- [x] Understand no direct HTTP calls rule

## Step 2: Framework Services
- [x] All services are domain-agnostic: YES/NO
- [x] No domain-specific logic found: YES/NO
- [ ] Issues found: [List any issues]

## Step 3: Domain Configuration
- [x] API Base URL from environment: YES/NO
- [x] No hardcoded URLs: YES/NO
- [ ] Issues found: [List any issues]

## Step 4: Architecture Violations
- [x] No direct HTTP calls in components: YES/NO
- [x] No hardcoded URLs in app code: YES/NO
- [x] All navigation through UrlStateService: YES/NO
- [ ] Violations found: [List any violations]

## Step 5: Component Implementation
- [x] All components follow required pattern: YES/NO
- [x] All components use ResourceManagementService: YES/NO
- [ ] Issues found: [List any issues]

## Step 6: Domain Adapters
- [x] API adapter uses generic ApiService: YES/NO
- [x] API adapter receives base URL from config: YES/NO
- [x] URL mapper implements bidirectional conversion: YES/NO
- [ ] Issues found: [List any issues]

## Step 7: Domain-Agnostic Test
- [x] Can add new domain without modifying framework: YES/NO
- [x] Framework is truly domain-agnostic: YES/NO

## Step 8: Pop-Out Window Architecture ⚠️ CRITICAL
- [x] Pop-outs update own URL before broadcasting: YES/NO
- [x] Pop-outs use detectChanges() in critical paths: YES/NO
- [x] All configurations registered in PanelPopoutComponent: YES/NO
- [x] BroadcastChannel messages handled bidirectionally: YES/NO
- [x] All URL params have filter definitions: YES/NO
- [x] Pop-outs maintain state when unfocused: YES/NO
- [ ] Issues found: [List any issues]

## Overall Result
- [ ] ✅ PASS - All checks passed
- [ ] ⚠️ PASS WITH WARNINGS - Minor issues found
- [ ] ❌ FAIL - Critical issues found

## Issues to Fix
1. [Priority] Issue description - Location - Recommendation
2. [Priority] Issue description - Location - Recommendation

## Sign-off
- Verified by: [Name]
- Date: [Date]
- Approved for: Development / Staging / Production
```

---

## SEVERITY LEVELS

Use these severity levels to prioritize issues:

### 🔴 CRITICAL (Must fix immediately)
- Hardcoded API URLs in domain configuration
- Components making direct HTTP calls
- Framework services containing domain-specific logic
- Missing environment configuration
- Data flow bypassing URL-First architecture
- **Component templates with hardcoded domain-specific field names**
- **Component templates not dynamically rendering filters from config**
- **Components that only work with one specific domain**
- **⚠️ NEW: Pop-out windows using `markForCheck()` instead of `detectChanges()` in URL sync handlers**
- **⚠️ NEW: Pop-out windows not updating own URL (only broadcasting to main window)**
- **⚠️ NEW: Pop-out windows showing empty content on open (missing configuration registration)**
- **⚠️ NEW: Pop-out windows not updating when unfocused (stale state bug)**

### 🟡 HIGH (Fix before next release)
- Hardcoded configuration values (non-URL)
- Components not using ResourceManagementService
- Direct router navigation with queryParams
- Missing adapter implementations
- Incomplete domain configurations
- **⚠️ NEW: Missing filter definitions for picker URL parameters** (causes Query Control not to show chips)
- **⚠️ NEW: Missing highlight filter definitions for chart click parameters**

### 🟠 MEDIUM (Fix in next sprint)
- Incomplete picker configurations
- Missing documentation
- Suboptimal patterns (but still functional)
- Missing validation
- Code duplication in adapters

### 🔵 LOW (Fix when convenient)
- Code style issues
- Missing type annotations
- Incomplete test coverage
- Documentation improvements
- Performance optimizations

---

## AUTOMATION RECOMMENDATIONS

Consider automating these checks with linting rules:

### ESLint Rules to Add

```javascript
// .eslintrc.json
{
  "rules": {
    // Prevent HttpClient in components
    "no-restricted-imports": ["error", {
      "paths": [{
        "name": "@angular/common/http",
        "importNames": ["HttpClient"],
        "message": "Do not import HttpClient in components. Use ResourceManagementService instead."
      }]
    }],

    // Prevent hardcoded URLs (custom rule needed)
    "no-hardcoded-urls": "error"
  }
}
```

### Pre-commit Hooks

```bash
#!/bin/bash
# .git/hooks/pre-commit

# Search for hardcoded URLs in staged files
if git diff --cached --name-only | xargs grep -l "http://" 2>/dev/null; then
  echo "❌ ERROR: Hardcoded URLs found in staged files"
  echo "Please use environment.apiBaseUrl instead"
  exit 1
fi

# Search for HttpClient in components
if git diff --cached --name-only | grep "component.ts$" | xargs grep -l "HttpClient" 2>/dev/null; then
  echo "❌ ERROR: HttpClient found in component files"
  echo "Components should use ResourceManagementService"
  exit 1
fi

echo "✅ Pre-commit checks passed"
```

---

## QUICK REFERENCE

### Valid Patterns ✅

```typescript
// ✅ Domain config from environment
import { environment } from '../../environments/environment';
const baseUrl = environment.apiBaseUrl;

// ✅ API adapter using generic service
return this.apiService.get<TData>(`${this.baseUrl}/endpoint`, { params });

// ✅ Component updating filters
this.resourceService.updateFilters({ manufacturer: 'Toyota' });

// ✅ Relative endpoints in adapters
private readonly VEHICLES_ENDPOINT = '/vehicles/details';

// ✅ Generic framework service
export class ApiService {
  get<TData>(endpoint: string, options?: ApiRequestOptions): Observable<ApiResponse<TData>>
}
```

### Invalid Patterns ❌

```typescript
// ❌ Hardcoded URL in domain config
apiBaseUrl: 'http://auto-discovery.minilab/api/specs/v1'

// ❌ Direct HTTP call in component
this.http.get('http://api.example.com/vehicles').subscribe(...)

// ❌ Domain-specific framework service
export class VehicleApiService {
  getVehicles(): Observable<Vehicle[]>
}

// ❌ Direct router navigation with queryParams
this.router.navigate(['/discover'], { queryParams: { manufacturer: 'Ford' } });

// ❌ Full URL in adapter
return this.apiService.get('http://example.com/api/v1/vehicles');
```

---

## RELATED DOCUMENTS

- [specs/01-architectural-analysis.md](specs/01-architectural-analysis.md) - Architecture specification
- [IMPLEMENTATION-SUMMARY.md](IMPLEMENTATION-SUMMARY.md) - Detailed analysis of current implementation
- [framework/README.md](frontend/src/framework/README.md) - Framework documentation
- [domain-config/automobile/README.md](frontend/src/domain-config/automobile/README.md) - Domain configuration guide

---

**Document Version**: 2.0
**Last Updated**: 2025-11-23
**Changes in v2.0**:
- Added Step 8: Pop-Out Window Architecture (6 subsections, ~330 lines)
- Added pop-out specific severity levels (4 CRITICAL, 2 HIGH)
- Updated verification results template to include Step 8
- Addresses 71% of recent bugs (5 out of 7 were pop-out related)

**Next Review**: After major releases or architecture changes
