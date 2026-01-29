# Architecture Audit Remediation: Anti-Pattern #1 ("God Object")

**Date**: December 27, 2025
**Subject**: Interface Segregation of DomainConfig
**Status**: Proposed Fix
**Reference**: `ARCHITECTURE-AUDIT.md` (Anti-Pattern #1)

---

## 1. The Problem

The `DomainConfig` interface has become a "God Object," violating the **Interface Segregation Principle (ISP)**. It aggregates unrelated responsibilities into a single monolithic structure:

```typescript
// CURRENT STATE
export interface DomainConfig {
  // 1. Identity
  domainName: string;
  // 2. API Logic
  apiAdapter: IApiAdapter;
  urlMapper: IFilterUrlMapper;
  // 3. UI Configuration
  tableConfig: TableConfig;
  filters: FilterDefinition[];
  charts: ChartConfig[];
  // 4. Feature Flags
  features: DomainFeatures;
}
```

**Consequences**:
1.  **Testing Friction**: To unit test the `ResultsTableComponent` (which only needs `tableConfig`), developers must mock the entire API adapter and Chart configs.
2.  **Coupling**: Changes to the Charting engine structure force recompilation of the Table components.
3.  **Bloat**: The config object is becoming unmanageable to read and maintain.

---

## 2. The Solution: Interface Segregation

We will split `DomainConfig` into three focused injection tokens. The monolithic `DOMAIN_CONFIG` can remain as an aggregation for backward compatibility (optional), but components should inject only what they need.

### Proposed Interfaces

1.  **`DomainApiConfig`**: Core business logic.
2.  **`DomainUiConfig`**: Presentation details.
3.  **`DomainFeatureConfig`**: Toggles and identity.

---

## 3. Implementation Plan

### Step 1: Define New Interfaces

**File**: `frontend/src/framework/models/domain-config.interface.ts`

```typescript
export interface DomainApiConfig<TFilters, TData> {
  apiBaseUrl: string;
  apiAdapter: IApiAdapter<TFilters, TData>;
  urlMapper: IFilterUrlMapper<TFilters>;
  cacheKeyBuilder: ICacheKeyBuilder<TFilters>;
  defaultFilters?: Partial<TFilters>;
}

export interface DomainUiConfig {
  tableConfig: TableConfig<any>;
  filters: FilterDefinition[];
  queryControlFilters: QueryFilterDefinition<any>[];
  highlightFilters?: QueryFilterDefinition<any>[];
  pickers: PickerConfig<any>[];
  charts: ChartConfig[];
  chartDataSources?: Record<string, any>;
}

export interface DomainFeatureConfig {
  domainName: string;
  domainLabel: string;
  features: DomainFeatures;
  metadata?: DomainMetadata;
}
```

### Step 2: Define New Injection Tokens

**File**: `frontend/src/framework/services/domain-config-registry.service.ts`

```typescript
import { InjectionToken } from '@angular/core';

export const DOMAIN_API = new InjectionToken<DomainApiConfig>('DOMAIN_API');
export const DOMAIN_UI = new InjectionToken<DomainUiConfig>('DOMAIN_UI');
export const DOMAIN_FEATURES = new InjectionToken<DomainFeatureConfig>('DOMAIN_FEATURES');

// Deprecated: Kept for backward compatibility during migration
export const DOMAIN_CONFIG = new InjectionToken<DomainConfig>('DOMAIN_CONFIG');
```

### Step 3: Update Providers (Layer 0)

**File**: `frontend/src/app/app.module.ts`

We update how the domain is provided. Instead of one giant factory, we can have multiple (or one factory that returns an object splitting itself).

```typescript
providers: [
  // ...
  {
    provide: DOMAIN_API,
    useFactory: (injector: Injector) => createAutomobileApiConfig(injector),
    deps: [Injector]
  },
  {
    provide: DOMAIN_UI,
    useFactory: () => AUTOMOBILE_UI_CONFIG // Static constant
  },
  {
    provide: DOMAIN_FEATURES,
    useValue: AUTOMOBILE_FEATURE_CONFIG // Static constant
  }
]
```

### Step 4: Refactor Consumers (Layer 1)

**Example**: `ResultsTableComponent`

**Before**:
```typescript
constructor(@Inject(DOMAIN_CONFIG) private config: DomainConfig) {
  this.columns = config.tableConfig.columns;
}
```

**After**:
```typescript
constructor(@Inject(DOMAIN_UI) private uiConfig: DomainUiConfig) {
  this.columns = uiConfig.tableConfig.columns;
}
```

---

## 4. Verification

1.  **Compiler Check**: Ensure no circular dependencies are introduced.
2.  **Runtime Check**: Verify `ResultsTable` renders correctly with the new token.
3.  **Test Simplicity**: Verify that `ResultsTable` tests no longer require mocking `IApiAdapter`.

## 5. Benefits

1.  **Lazy Loading**: We could potentially load `DOMAIN_UI` lazily, while `DOMAIN_API` is loaded eagerly.
2.  **Clean Tests**: Mocking becomes trivial.
3.  **Strict Boundaries**: UI components are physically prevented from accessing API Adapters.
