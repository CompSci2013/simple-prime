# Architecture Audit Remediation: Anti-Pattern #2 (Vendor Lock-in)

**Date**: December 27, 2025
**Subject**: Mitigating Implicit PrimeNG Dependency
**Status**: Proposed Fix
**Reference**: `ARCHITECTURE-AUDIT.md` (Anti-Pattern #2)

---

## 1. The Problem

The `FrameworkModule` and Feature Modules currently import `PrimengModule` directly. This creates a scattered, hard dependency on PrimeNG across the entire codebase.

```typescript
// CURRENT STATE (Scattered Imports)
import { PrimengModule } from './primeng.module'; // In Framework
import { TableModule } from 'primeng/table';      // In Feature A
import { ButtonModule } from 'primeng/button';    // In Feature B
```

**Risk**:
1.  **Version Coupling**: Upgrading PrimeNG requires checking every single module file.
2.  **Inconsistent Usage**: One feature might use `p-dropdown` while another uses `p-listbox` for the same purpose because the imports are ad-hoc.
3.  **Migration Nightmare**: Swapping a specific component (e.g., the DatePicker) requires a codebase-wide find-and-replace.

---

## 2. The Solution: The "UI Facade Module"

Since we intend to use PrimeNG extensively (Tables, Panels, Inputs), creating custom wrapper components for *everything* (e.g., `<app-button>` wrapping `<p-button>`) is **Over-Engineering**. It adds massive maintenance overhead.

Instead, we will use a **Facade Module Pattern**.

We will funnel all UI library access through a single `UiKitModule`. This module will re-export the underlying PrimeNG modules. This gives us a single point of control.

---

## 3. Implementation Plan

### Step 1: Create `UiKitModule` (Layer 1)

**File**: `frontend/src/framework/ui-kit/ui-kit.module.ts`

```typescript
import { NgModule } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
// ... other PrimeNG imports

@NgModule({
  imports: [
    ButtonModule,
    TableModule,
    DialogModule
  ],
  exports: [
    ButtonModule,
    TableModule,
    DialogModule
  ]
})
export class UiKitModule { }
```

### Step 2: Refactor Consumers

**File**: `frontend/src/framework/framework.module.ts`

**Before**:
```typescript
import { PrimengModule } from '../app/primeng.module'; // Bad: App-level import in Framework
```

**After**:
```typescript
import { UiKitModule } from './ui-kit/ui-kit.module'; // Good: Framework-level import
```

### Step 3: Deprecate `PrimengModule`

The existing `frontend/src/app/primeng.module.ts` should be effectively merged into `UiKitModule` and then deleted to prevent confusion.

---

## 4. Mitigation Strategy (The "Escape Hatch")

If a specific PrimeNG component (e.g., `p-calendar`) becomes problematic and we need to switch to a native HTML5 date picker or a different library:

1.  **Locate**: Go to `UiKitModule`.
2.  **Isolate**: Remove `CalendarModule` from `exports`.
3.  **Replace**: Create a new `AppDatePickerComponent` that wraps the new library.
4.  **Export**: Export `AppDatePickerComponent` from `UiKitModule`.
5.  **Refactor**: Update usage sites from `<p-calendar>` to `<app-date-picker>`.

This approach keeps the refactoring contained. We don't fix what isn't broken, but we maintain the *structure* to fix it if needed.

## 5. Benefits

1.  **Centralized Inventory**: We know exactly which PrimeNG components are in use by looking at one file.
2.  **Standardization**: Developers import `UiKitModule` instead of hunting for specific PrimeNG sub-modules.
3.  **Layer Integrity**: The Framework Layer (L1) no longer depends on an App Layer (L0) file (`primeng.module.ts`).
