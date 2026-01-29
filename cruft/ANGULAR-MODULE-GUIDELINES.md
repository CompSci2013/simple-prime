# Angular Module Guidelines

**Status**: Active
**Last Updated**: 2025-12-18
**Scope**: All NgModule definitions in `frontend/src/`
**Enforcement**: Code review + automated checking

---

## Core Principle: Explicit Dependency Declaration

Every module must explicitly declare what it needs. Never rely on transitive imports from other modules.

```
Module A imports CommonModule
  ↓ IMPLICIT (wrong)
Module B imports Module A
  ↓ Gets CommonModule "for free"
Module B uses CommonModule features WITHOUT explicitly importing it
```

---

## What Modules Can Export

### ✅ ALLOWED

1. **Components declared in this module**
   ```typescript
   @NgModule({
     declarations: [MyComponent],
     exports: [MyComponent]  // ✅ Exported
   })
   ```

2. **Directives declared in this module**
   ```typescript
   @NgModule({
     declarations: [MyDirective],
     exports: [MyDirective]  // ✅ Exported
   })
   ```

3. **Pipes declared in this module**
   ```typescript
   @NgModule({
     declarations: [MyPipe],
     exports: [MyPipe]  // ✅ Exported
   })
   ```

4. **Services (via providers, NOT imports)**
   ```typescript
   @NgModule({
     providers: [MyService],
     // Services are automatically injectable - no export needed
   })
   ```

### ❌ NOT ALLOWED

1. **Re-export imported modules**
   ```typescript
   @NgModule({
     imports: [CommonModule],
     exports: [CommonModule]  // ❌ FORBIDDEN - Creates hidden dependencies
   })
   ```

2. **Re-export third-party UI libraries**
   ```typescript
   @NgModule({
     imports: [PrimengModule],
     exports: [PrimengModule]  // ❌ FORBIDDEN - Hides PrimeNG dependency
   })
   ```

3. **Re-export to hide implementation**
   ```typescript
   @NgModule({
     imports: [InternalModule],
     exports: [InternalModule]  // ❌ FORBIDDEN - Use barrel exports instead
   })
   ```

---

## Exception: Barrel Modules

A barrel module is acceptable when:

1. **It consolidates multiple internal exports** (same package/directory)
2. **Downstream modules explicitly know they're getting multiple things**
3. **It's clearly documented**

```typescript
// ✅ ACCEPTABLE: Consolidates PrimeNG imports
@NgModule({
  imports: [
    TableModule,
    ButtonModule,
    DropdownModule,
    // ... 15 more PrimeNG modules
  ],
  exports: [
    TableModule,
    ButtonModule,
    DropdownModule,
    // ... same 15 modules
  ]
})
export class PrimengModule { }

// Reason: Downstream modules explicitly know they import "PrimengModule"
// and understand they're getting the PrimeNG library bundled
```

---

## Common Mistakes

### Mistake 1: Re-exporting for Convenience

```typescript
// ❌ WRONG - "for convenience"
@NgModule({
  imports: [CommonModule, FormsModule, HttpClientModule],
  exports: [CommonModule, FormsModule, HttpClientModule]  // Too convenient!
})
export class SharedModule { }
```

**Why it's wrong**:
- Downstream modules don't know what they depend on
- If `SharedModule` changes, they break unexpectedly
- Difficult to refactor

**Fix**:
```typescript
// ✅ RIGHT - Only export what you declare
@NgModule({
  imports: [CommonModule, FormsModule, HttpClientModule],
  exports: [MyComponent, MyDirective]  // Only what you declare
})
export class SharedModule { }

// If downstream needs these modules, they import explicitly:
@NgModule({
  imports: [SharedModule, CommonModule, FormsModule]  // Explicit
})
export class FeatureModule { }
```

---

### Mistake 2: Assuming Transitive Imports Work

```typescript
// ❌ WRONG - Relies on transitive import
@Component({
  selector: 'app-my-component',
  template: '<p-button>Click</p-button>'  // Uses PrimeNG
})
export class MyComponent { }

// Module that uses this component
@NgModule({
  declarations: [MyComponent],
  imports: [FrameworkModule]  // Relies on FrameworkModule re-exporting PrimengModule
})
export class FeatureModule { }
```

**Problem**: If `FrameworkModule` stops exporting `PrimengModule`, code breaks

**Fix**:
```typescript
// ✅ RIGHT - Explicit about dependencies
@NgModule({
  declarations: [MyComponent],
  imports: [FrameworkModule, PrimengModule]  // Explicit import
})
export class FeatureModule { }
```

---

### Mistake 3: Hidden Circular Dependencies

```typescript
// ❌ WRONG - Creates circular dependency risk
// service-a.module.ts
@NgModule({
  imports: [ServiceBModule],
  exports: [ServiceBModule]
})
export class ServiceAModule { }

// service-b.module.ts
@NgModule({
  imports: [ServiceAModule],
  exports: [ServiceAModule]
})
export class ServiceBModule { }

// app.module.ts imports both → ✅ But hidden coupling makes this fragile
```

**Fix**:
```typescript
// ✅ RIGHT - Explicit one-way dependency
// service-a.module.ts
@NgModule({
  imports: [ServiceBModule],
  // NO re-export
})
export class ServiceAModule { }

// service-b.module.ts
@NgModule({
  // NO import of ServiceAModule - prevents circular coupling
})
export class ServiceBModule { }

// app.module.ts imports both explicitly
```

---

## Best Practices

### 1. Keep Exports Minimal

```typescript
// ❌ Over-exports
@NgModule({
  declarations: [ComponentA, ComponentB, ComponentC],
  imports: [CommonModule, FormsModule, PrimengModule],
  exports: [ComponentA, ComponentB, ComponentC, CommonModule, FormsModule, PrimengModule]
})

// ✅ Only export what's needed
@NgModule({
  declarations: [ComponentA, ComponentB, ComponentC],
  imports: [CommonModule, FormsModule, PrimengModule],
  exports: [ComponentA, ComponentB]  // Only public API
})
```

---

### 2. Document Public vs Private Components

```typescript
@NgModule({
  declarations: [
    // Public components (exported)
    PublicComponent,

    // Private implementation details (not exported)
    PrivateInternalComponent,
    PrivateHelperComponent
  ],
  imports: [CommonModule],
  exports: [
    PublicComponent
  ]
})
export class FeatureModule { }
```

---

### 3. Use Barrel Exports (index.ts) for Internal Organization

```typescript
// src/app/features/user/index.ts
export { UserComponent } from './user.component';
export { UserService } from './user.service';
export { UserModule } from './user.module';

// Then in other modules:
import { UserComponent, UserService } from './features/user';  // Clean import
```

**Note**: This is about file organization, not module re-exports.

---

### 4. Group Related Imports

```typescript
// ✅ Good organization
@NgModule({
  imports: [
    // Angular core
    CommonModule,
    FormsModule,
    HttpClientModule,

    // Third-party
    PrimengModule,

    // Internal
    FrameworkModule,
    SharedModule
  ]
})
```

---

### 5. Document Why Re-exports Exist

If you must re-export (and it's justified), document it:

```typescript
/**
 * PrimeNG Barrel Module
 *
 * Re-exports 18 PrimeNG component modules for convenience.
 * Downstream modules import this single module instead of 18 individual imports.
 *
 * Example:
 * ```
 * @NgModule({
 *   imports: [PrimengModule]  // Replaces 18 individual imports
 * })
 * ```
 *
 * NOTE: Consumers should be aware they depend on PrimeNG when importing this module.
 */
@NgModule({
  imports: [...PRIMENG_MODULES],
  exports: [...PRIMENG_MODULES]
})
export class PrimengModule { }
```

---

## Module Organization Pattern (Recommended)

```
src/
├── app/
│   ├── app.module.ts              # Root module
│   ├── app-routing.module.ts      # Routing configuration
│   ├── primeng.module.ts          # ✅ Barrel: PrimeNG modules
│   │
│   ├── features/                  # Feature modules
│   │   ├── user/
│   │   │   ├── user.module.ts
│   │   │   ├── user.component.ts
│   │   │   ├── user.service.ts
│   │   │   └── index.ts           # Barrel export
│   │   └── product/
│   │
│   └── shared/                    # Shared utilities
│       ├── shared.module.ts       # ⚠️ Export only declared items
│       ├── components/
│       ├── directives/
│       ├── pipes/
│       ├── services/
│       └── index.ts               # Barrel export
│
└── framework/
    ├── framework.module.ts        # Core framework
    ├── components/
    ├── services/
    └── models/
```

**Principle**:
- `primeng.module.ts` → Re-exports PrimeNG (acceptable barrel)
- `shared.module.ts` → Only exports what it declares
- `framework.module.ts` → Only exports what it declares
- `app.module.ts` → Root, no exports

---

## Validation: Automated Checking

### Quick Check: Manual Inspection

```bash
# List all modules
grep -r "@NgModule" frontend/src --include="*.ts" | grep -v node_modules | cut -d: -f1 | sort -u

# Inspect each module
cat frontend/src/framework/framework.module.ts
```

### Automated Check: Run Script

```bash
npm run check:modules
```

**Output**:
```
✅ No module re-export anti-patterns detected!
```

or

```
⚠️  Found 1 module(s) with re-export anti-patterns:

📄 /home/odin/projects/generic-prime/frontend/src/framework/framework.module.ts
   Re-exports: CommonModule, FormsModule, PrimengModule
   ...
```

### CI/CD Integration

Add to `package.json`:
```json
{
  "scripts": {
    "check:modules:strict": "node scripts/check-module-reexports.js frontend/src || exit 1"
  }
}
```

Run before commit:
```bash
npm run check:modules:strict
```

---

## Refactoring Checklist

When removing re-exports from a module:

- [ ] Identify which downstream modules use the re-exported items
- [ ] Add explicit imports to each downstream module
- [ ] Remove re-export from the module
- [ ] Run `ng build` to verify compilation
- [ ] Run `npm run check:modules` to verify
- [ ] Run E2E tests: `npm run test:e2e`
- [ ] Test in browser: `npm start`
- [ ] Regenerate Compodoc to verify module structure

---

## Related Documentation

- [MODULE-ARCHITECTURE-AUDIT.md](./claude/MODULE-ARCHITECTURE-AUDIT.md) - Detailed audit findings
- [ORIENTATION.md](./claude/ORIENTATION.md) - Project architecture overview
- [Angular NgModules Guide](https://angular.dev/guide/ngmodules/overview)
- [Angular Style Guide](https://v19.angular.dev/style-guide)

---

**Questions?** Refer to the audit document for detailed examples and reasoning.
