# Architecture Audit Remediation: Abstraction Leak #1

**Date**: December 27, 2025
**Subject**: Decoupling Highlight Logic from Core Framework
**Status**: Proposed Fix
**Reference**: `ARCHITECTURE-AUDIT.md` (Leak #1)

---

## 1. The Problem

The `ResourceManagementService` (Layer 1 - Framework) currently contains hardcoded logic to identify "Highlight Filters" by checking if URL parameters start with the prefix `h_`.

```typescript
// CURRENT STATE (ResourceManagementService.ts)
private extractHighlights(urlParams: Record<string, any>): any {
  const prefix = this.config.highlightPrefix || 'h_'; // <--- LEAK
  // ... string parsing logic ...
}
```

**Why this is fatal**: It forces *every* future domain to use the `h_` prefix strategy. If a domain (e.g., Physics) requires a nested object structure (e.g., `?highlights[node]=123`) or a different query parameter standard, the core Framework code must be modified, violating the Open/Closed Principle.

---

## 2. The Solution: Strategy Pattern

We will apply the **Strategy Pattern** by delegating the responsibility of "extracting highlights" to the existing `IFilterUrlMapper` interface. The Framework will simply ask the Mapper: *"Do you see any highlights in these params?"*

### Architecture Change
*   **Layer 2 (Interface)**: Add `extractHighlights?()` method to `IFilterUrlMapper`.
*   **Layer 1 (Framework)**: Remove string parsing logic from `ResourceManagementService`.
*   **Layer 3 (Domain)**: Implement `h_` parsing logic inside `AutomobileUrlMapper`.

---

## 3. Implementation Plan

### Step 1: Update the Interface (Layer 2)

**File**: `frontend/src/framework/models/resource-management.interface.ts`

```typescript
export interface IFilterUrlMapper<TFilters> {
  toUrlParams(filters: TFilters): Params;
  fromUrlParams(params: Params): TFilters;
  
  /**
   * Optional strategy for extracting highlight filters from URL parameters.
   * If not implemented, the framework assumes no highlights are present.
   */
  extractHighlights?(params: Params): any;
}
```

### Step 2: Refactor the Service (Layer 1)

**File**: `frontend/src/framework/services/resource-management.service.ts`

```typescript
private extractHighlights(urlParams: Record<string, any>): any {
  // Check if the domain-specific mapper has a strategy for this
  if (this.config.filterMapper.extractHighlights) {
    return this.config.filterMapper.extractHighlights(urlParams);
  }
  
  // Default: No highlights found (or feature disabled)
  return {};
}
```

*Note: We delete the `supportsHighlights` and `highlightPrefix` config options from the generic config, as they are now implementation details of the specific Mapper.*

### Step 3: Implement Domain Logic (Layer 3)

**File**: `frontend/src/domain-config/automobile/adapters/automobile-url-mapper.ts`

```typescript
export class AutomobileUrlMapper implements IFilterUrlMapper<AutoSearchFilters> {
  
  // ... existing methods ...

  /**
   * Automobile-specific strategy: Look for 'h_' prefix
   */
  extractHighlights(params: Params): any {
    const highlights: Record<string, any> = {};
    const prefix = 'h_';

    Object.keys(params).forEach(key => {
      if (key.startsWith(prefix)) {
        const highlightKey = key.substring(prefix.length);
        let value = params[key];

        // Normalize separators (Pipe -> Comma)
        if (typeof value === 'string' && value.includes('|')) {
          value = value.replace(/\|/g, ',');
        }

        highlights[highlightKey] = value;
      }
    });

    return highlights;
  }
}
```

---

## 4. Verification

After applying these changes, we verify the fix by running the existing test suite.

1.  **Regression Test**: Ensure Automobile domain still correctly highlights "Ford" when `h_manufacturer=Ford` is in the URL.
2.  **Scalability Test**: Create a mock `PhysicsUrlMapper` that uses `?node_highlight=123` to prove the Framework handles arbitrary strategies.

## 5. Benefits

1.  **Strict Decoupling**: The Framework Layer (L1) no longer contains string magic strings or assumptions about URL structure.
2.  **Domain Autonomy**: Each domain can invent its own URL schema for secondary filters.
3.  **Testability**: The highlight parsing logic can be unit tested in isolation within the Domain modules.
