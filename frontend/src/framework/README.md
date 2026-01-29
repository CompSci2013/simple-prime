# Framework Layer (Domain-Agnostic)

**Purpose**: Contains all domain-agnostic, reusable framework code.

**Rules**:
- ❌ **NO domain-specific terms** (vehicle, manufacturer, agriculture, etc.)
- ✅ **Generic types only** (`TFilters`, `TData`, `TStatistics`)
- ✅ **Configuration-driven** - Domain specifics come from config, not code
- ✅ **PrimeNG-first** - Use PrimeNG components directly, no custom wrappers

## Structure

```
framework/
├── services/           # Generic services (ResourceManagement, UrlState, etc.)
├── models/             # Generic interfaces (DomainConfig, TableConfig, etc.)
└── components/         # Thin wrappers only (discover panel orchestration)
```

## ESLint Enforcement

ESLint rules forbid domain-specific terms in this directory.

**Violation Example**:
```typescript
// ❌ BAD - domain-specific
class VehicleService { }

// ✅ GOOD - generic
class ResourceManagementService<TFilters, TData> { }
```
