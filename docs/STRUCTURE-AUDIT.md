# Project Structure Audit

**Audit Date**: 2026-02-05
**Compared Against**: Angular 13/14 Style Guide Recommendations
**Reference**: [ANGULAR-CANONICAL.md](./ANGULAR-CANONICAL.md)

---

## Executive Summary

This project uses a **domain-driven, configuration-centric architecture** that intentionally deviates from the canonical Angular style guide in several ways. Many deviations are **deliberate architectural decisions** that serve the project's specific needs (multi-domain data exploration platform).

| Category | Compliance | Notes |
|----------|------------|-------|
| File Naming | Partial | Custom patterns for domain configs |
| Feature Organization | High | Feature-based organization followed |
| Core/Shared Pattern | Modified | Uses `framework/` instead of `core/` + `shared/` |
| Module Organization | Hybrid | Mix of NgModule and Standalone |
| Single Responsibility | High | Good separation of concerns |

---

## Current Project Structure

```
simple-prime/
├── frontend/
│   └── src/
│       ├── app/
│       │   ├── features/              # Feature components
│       │   │   ├── agriculture/
│       │   │   ├── automobile/
│       │   │   ├── home/
│       │   │   └── panel-popout/
│       │   ├── app.component.ts
│       │   ├── app.config.ts
│       │   └── app.routes.ts
│       │
│       ├── framework/                 # Shared layer (non-standard location)
│       │   ├── components/
│       │   ├── services/
│       │   ├── models/
│       │   └── tokens/
│       │
│       ├── domain-config/             # Domain configurations (custom pattern)
│       │   ├── agriculture/
│       │   ├── automobile/
│       │   └── domain-providers.ts
│       │
│       ├── assets/
│       └── environments/
│
├── docs/
├── k8s/
├── scripts/
└── testing/
```

---

## Deviations from Canonical Structure

### 1. No `core/` or `shared/` Modules

**Canonical Recommendation**:
```
src/app/
├── core/       # Singleton services, guards, interceptors
└── shared/     # Reusable components, directives, pipes
```

**This Project**:
```
src/
└── framework/  # Combined core + shared functionality
    ├── components/
    ├── services/
    ├── models/
    └── tokens/
```

**Assessment**: ⚠️ INTENTIONAL DEVIATION

**Rationale**: The project combines `core` and `shared` into a single `framework/` layer. This works because:
- All services use `providedIn: 'root'` (no CoreModule needed)
- The framework layer is domain-agnostic
- Clear separation exists between framework and domain-specific code

**Impact**: Low - Structure is consistent and maintainable

---

### 2. `framework/` Outside `app/` Directory

**Canonical Recommendation**: All application code under `src/app/`

**This Project**: `src/framework/` is a sibling to `src/app/`

**Assessment**: ⚠️ INTENTIONAL DEVIATION

**Rationale**:
- Visually separates framework code from feature code
- Makes the reusable layer more prominent
- Follows a "layered architecture" mental model

**Impact**: Low - Paths work correctly, clear organization

---

### 3. `domain-config/` Pattern (Non-Standard)

**Canonical Recommendation**: Configuration lives within feature modules

**This Project**:
```
src/domain-config/
├── automobile/
│   ├── automobile.domain-config.ts
│   ├── adapters/
│   ├── chart-sources/
│   ├── configs/
│   └── models/
└── agriculture/
    └── ... (same structure)
```

**Assessment**: ⚠️ INTENTIONAL DEVIATION

**Rationale**:
- Enables configuration-driven UI (framework components are data-agnostic)
- Centralizes all domain configuration in one location
- Supports the Adapter pattern for API transformations
- Makes adding new domains straightforward

**Impact**: Medium - Non-standard but provides significant benefits for this architecture

---

### 4. File Naming: Custom Suffixes

**Canonical Recommendation**: `feature.type.ts` (e.g., `user.service.ts`)

**This Project Uses**:

| File | Standard Pattern | Project Pattern |
|------|------------------|-----------------|
| Domain config | N/A | `name.domain-config.ts` |
| API adapter | N/A | `name-api.adapter.ts` |
| URL mapper | N/A | `name-url-mapper.ts` |
| Cache builder | N/A | `name-cache-key-builder.ts` |
| Chart source | N/A | `name-chart-source.ts` |
| Filter definitions | N/A | `name.filter-definitions.ts` |
| Table config | N/A | `name.table-config.ts` |

**Assessment**: ⚠️ INTENTIONAL DEVIATION

**Rationale**: Custom patterns for domain configuration files that don't exist in standard Angular. The naming is consistent and descriptive.

**Impact**: Low - Names are clear and follow consistent patterns

---

### 5. Hybrid NgModule + Standalone Components

**Canonical Recommendation**: Choose one approach consistently

**This Project**:
- `automobile/` - Uses standalone components (Angular 14 pattern)
- `agriculture/` - Uses NgModule (Angular 13 pattern)
- `home/`, `panel-popout/` - Uses standalone components

**Assessment**: ⚠️ TRANSITIONAL STATE

**Rationale**: Migration in progress from NgModule to standalone components

**Impact**: Medium - Inconsistency adds cognitive load

**Recommendation**: Complete migration to standalone components across all features

---

### 6. No Routing Modules

**Canonical Recommendation**: `feature-routing.module.ts` for each feature

**This Project**:
- Single `app.routes.ts` file
- No per-feature routing modules

**Assessment**: ✅ ACCEPTABLE (Angular 14+)

**Rationale**: With standalone components and `loadComponent`, separate routing modules are no longer necessary. The flat routes file is sufficient for this project's complexity.

**Impact**: None - Modern Angular approach

---

### 7. Services Not in Feature Folders

**Canonical Recommendation**: Feature-specific services in feature folders

**This Project**:
- Framework services in `src/framework/services/`
- Domain data services in `src/app/features/{domain}/services/`

**Assessment**: ✅ COMPLIANT (Hybrid approach works)

The split is logical:
- Domain-agnostic services → framework
- Domain-specific services → feature folders

---

### 8. Models/Interfaces Location

**Canonical Recommendation**: Models in feature folders or shared

**This Project**:
```
src/framework/models/           # Framework interfaces
src/domain-config/*/models/     # Domain-specific models
```

**Assessment**: ✅ COMPLIANT

Clear separation between framework contracts and domain models.

---

## Compliance Summary

### ✅ Fully Compliant

| Guideline | Status |
|-----------|--------|
| Feature-based organization | ✅ Features in `/features/` |
| Hyphenated file names | ✅ Consistent use of hyphens |
| Single responsibility | ✅ One component/service per file |
| Co-located component files | ✅ `.ts`, `.html`, `.scss` together |
| Lazy loading | ✅ Features lazy-loaded |
| Descriptive file names | ✅ Names indicate purpose |

### ⚠️ Intentional Deviations

| Guideline | Deviation | Justification |
|-----------|-----------|---------------|
| `core/` + `shared/` modules | `framework/` layer | Simpler for this architecture |
| All code under `app/` | `framework/` and `domain-config/` siblings | Layered architecture visibility |
| Standard file suffixes | Custom domain-config patterns | Domain-specific file types |
| Consistent module approach | NgModule + Standalone mix | Migration in progress |

### ❌ Potential Issues

| Issue | Severity | Recommendation |
|-------|----------|----------------|
| NgModule/Standalone mix | Medium | Complete migration to standalone |
| No explicit CoreModule guard | Low | Add guard if CoreModule created |

---

## Recommendations

### Short-Term

1. **Complete Standalone Migration**: Convert `agriculture/` module to standalone components for consistency

### Long-Term

1. **Document Custom Patterns**: The domain-config pattern is powerful but non-standard. Consider adding architecture documentation explaining the pattern.

2. **Consider Barrel Exports**: Add `index.ts` barrel exports to framework folders for cleaner imports:
   ```typescript
   // Instead of:
   import { ApiService } from '../framework/services/api.service';

   // Use:
   import { ApiService } from '../framework/services';
   ```

---

## Architecture Notes

This project implements a **Configuration-Driven Domain Architecture** that doesn't map directly to standard Angular patterns. Key characteristics:

1. **Framework Layer**: Provides domain-agnostic UI components that accept configuration
2. **Domain Config Layer**: Provides domain-specific configuration, adapters, and models
3. **Feature Layer**: Thin components that wire framework + domain-config together

This architecture enables:
- Adding new domains with minimal code
- Reusing complex UI across domains
- Centralized control of domain behavior

The deviations from Angular style guide are **intentional architectural choices** that support this design pattern.
