# Framework Layer (Domain-Agnostic)

**Purpose**: Contains all domain-agnostic, reusable framework code. This layer provides generic services, components, and models that work with ANY domain through configuration injection.

## Rules

- **NO domain-specific terms** (vehicle, manufacturer, agriculture, crop, etc.)
- **Generic types only** (`TFilters`, `TData`, `TStatistics`)
- **Configuration-driven** - Domain specifics come from `DomainConfig`, not code
- **PrimeNG-first** - Use PrimeNG components directly, no custom wrappers

## Structure

```
framework/
├── components/           # Reusable UI components
│   ├── base-chart/       # Chart visualization (ECharts wrapper)
│   ├── base-picker/      # Hierarchical selection component
│   ├── dynamic-results-table/  # Data table with configurable columns
│   ├── query-control/    # Filter/search controls
│   └── statistics-panel-2/     # Chart grid layout
├── models/               # TypeScript interfaces and types
│   ├── domain-config.interface.ts    # Main configuration interface
│   ├── filter-definition.interface.ts
│   ├── table-config.interface.ts
│   └── popout.interface.ts
├── services/             # Singleton services for state and coordination
│   ├── resource-management.service.ts  # Central state management
│   ├── url-state.service.ts            # URL-First state sync
│   ├── api.service.ts                  # HTTP client wrapper
│   └── popout-manager.service.ts       # Multi-window support
└── tokens/               # Angular dependency injection tokens
    └── popout.token.ts   # IS_POPOUT_TOKEN for popout detection
```

## Key Concepts

### URL-First Architecture
All application state lives in the URL. The `UrlStateService` is the single source of truth:
- Filters, pagination, sorting → URL parameters
- Components read from URL, never store local state
- Changes trigger URL updates, which cascade to components

### Configuration-Driven Components
Components receive configuration via `DomainConfig`:
```typescript
// Component uses generic types
class DynamicResultsTable<TData> {
  @Input() domainConfig: DomainConfig<any, TData, any>;
}

// Domain provides specific config
const automobileConfig: DomainConfig<VehicleFilters, VehicleResult, VehicleStats> = {
  tableConfig: { columns: [...] },
  filterDefinitions: [...],
  // ...
};
```

### ResourceManagementService
Central state coordinator that:
- Listens to URL changes
- Triggers API calls via domain adapters
- Broadcasts state to all subscribers
- Manages loading/error states

## ESLint Enforcement

ESLint rules forbid domain-specific terms in this directory:

```typescript
// BAD - domain-specific
class VehicleService { }
interface CarFilters { }

// GOOD - generic
class ResourceManagementService<TFilters, TData, TStats> { }
interface FilterDefinition { }
```

## Adding New Framework Code

1. Ensure it's truly domain-agnostic
2. Use generic types (`T`, `TFilters`, `TData`)
3. Accept configuration via `@Input()` or constructor injection
4. Add to appropriate subdirectory
5. Export from subdirectory's `index.ts` if applicable
6. Update this README if adding new concepts
