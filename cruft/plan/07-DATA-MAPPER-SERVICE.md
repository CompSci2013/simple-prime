# Data Mapper Service (Future Work)

**Status**: CATALOGUED - Not yet implemented
**Priority**: After backend verification complete
**Created**: 2025-11-27

---

## Architectural Requirements (Non-Negotiable)

### 1. Accept ANY Data Structure
The frontend MUST handle both flat and nested data from ANY API:
- Different backend APIs return different structures
- We have NO CONTROL over external domain APIs
- The application must gracefully transform data regardless of source format

### 2. Server-Side Pagination by Default
ALL controls (pickers, tables) MUST use server-side pagination:
- Expect datasets with **millions of rows**
- NEVER fetch "all data" with large size limits
- No hardcoded size limits (100, 1000, etc.)
- Backend APIs must support proper cursor/offset pagination

### 3. No In-Memory Pagination Disguised as Server-Side
Current anti-pattern to avoid:
```javascript
// WRONG: Fetches all data, then slices in memory
const allData = await fetchAll({ size: 10000 });
const page = allData.slice(start, end);
```

Correct pattern:
```javascript
// RIGHT: Backend returns only requested page
const page = await fetch({ page: 5, size: 20 });
```

---

## Context

The Generic Discovery Framework is designed to be **domain-agnostic**. Each data domain (automobile, agriculture, real estate, etc.) will connect to different backend APIs over which we have **no control**.

**Current situation (Automobile domain)**:
- We control the backend API (can modify)
- This is our ONLY opportunity to ensure correct data structure
- Backend MUST support true server-side pagination

**Future domains**:
- External APIs we cannot modify
- Must accept whatever data structure is provided
- Frontend must be flexible enough to handle variations

---

## Problem Statement

Different APIs return data in different structures:

### Flat List Response (Ideal for Pickers)
```json
{
  "total": 881,
  "data": [
    { "manufacturer": "Ford", "model": "F-150", "count": 147 },
    { "manufacturer": "Ford", "model": "Mustang", "count": 89 },
    { "manufacturer": "Chevrolet", "model": "Silverado", "count": 134 }
  ]
}
```

### Nested Response (Common from APIs)
```json
{
  "total": 72,
  "data": [
    {
      "manufacturer": "Ford",
      "count": 665,
      "models": [
        { "model": "F-150", "count": 147 },
        { "model": "Mustang", "count": 89 }
      ]
    },
    {
      "manufacturer": "Chevrolet",
      "count": 523,
      "models": [
        { "model": "Silverado", "count": 134 }
      ]
    }
  ]
}
```

---

## Proposed Solution: DataMapperService

A frontend service that transforms API responses into standardized formats for pickers and tables.

### Core Responsibilities

1. **Flatten nested data** → Convert nested structures to flat rows for pickers
2. **Preserve hierarchy** → Package data for expandable table rows
3. **Calculate totals** → Derive correct total counts from nested data
4. **Configuration-driven** → Transformation rules defined in domain config

### Interface Design (Draft)

```typescript
interface DataMapperConfig {
  // How to flatten nested data
  flattenStrategy?: {
    parentKey: string;           // e.g., 'manufacturer'
    childrenKey: string;         // e.g., 'models'
    childKey: string;            // e.g., 'model'
    outputKeys: string[];        // e.g., ['manufacturer', 'model', 'count']
  };

  // How to calculate totals
  totalStrategy?: 'useProvided' | 'countFlattened' | 'sumField';
  totalField?: string;           // Field to sum if strategy is 'sumField'

  // How to package for expandable rows
  expansionConfig?: {
    parentFields: string[];      // Fields for parent row
    childFields: string[];       // Fields for expanded children
    expansionKey: string;        // Key containing children array
  };
}

interface MappedResponse<T> {
  data: T[];
  total: number;
  originalStructure: 'flat' | 'nested';
  expansionData?: Map<string, any[]>;  // For expandable rows
}
```

### Usage in Picker Config

```typescript
const MANUFACTURER_MODEL_PICKER: PickerConfig = {
  id: 'manufacturer-model',
  api: {
    endpoint: '/api/specs/v1/manufacturer-model-combinations',
    // ... other config
  },
  dataMapper: {
    flattenStrategy: {
      parentKey: 'manufacturer',
      childrenKey: 'models',
      childKey: 'model',
      outputKeys: ['manufacturer', 'model', 'count']
    },
    totalStrategy: 'countFlattened'
  }
};
```

---

## Implementation Considerations

### 1. Detect Response Structure Automatically
```typescript
function detectStructure(response: any): 'flat' | 'nested' {
  if (Array.isArray(response.data) && response.data.length > 0) {
    const firstItem = response.data[0];
    // Check if any field is an array (nested structure)
    for (const key of Object.keys(firstItem)) {
      if (Array.isArray(firstItem[key])) {
        return 'nested';
      }
    }
  }
  return 'flat';
}
```

### 2. Handle Pagination with Nested Data
- Nested APIs paginate by parent (e.g., manufacturers)
- Flattened display needs pagination by children (e.g., combinations)
- Options:
  - Fetch all data and paginate client-side
  - Maintain separate pagination state
  - Accept pagination limitations in picker config

### 3. Expandable Row Support
- Table shows parent rows
- Click to expand shows children
- DataMapper provides:
  - `parentRows[]` - Main table data
  - `expansionMap: Map<parentKey, childRows[]>` - Expansion data

---

## Files to Create/Modify

### New Files
- `frontend/src/framework/services/data-mapper.service.ts`
- `frontend/src/framework/models/data-mapper.interface.ts`

### Modified Files
- `frontend/src/framework/components/base-picker/base-picker.component.ts`
  - Use DataMapperService before displaying data
- `frontend/src/domain-config/automobile/configs/automobile.picker-configs.ts`
  - Add dataMapper config to picker definitions

---

## Relationship to Current responseTransformer

Currently, each picker config has a `responseTransformer` function:

```typescript
responseTransformer: (response) => {
  const flatResults: ManufacturerModelRow[] = [];
  for (const mfr of response.data || []) {
    for (const model of mfr.models || []) {
      flatResults.push({
        manufacturer: mfr.manufacturer,
        model: model.model,
        count: model.count
      });
    }
  }
  return { results: flatResults, total: response.total ?? flatResults.length };
}
```

**DataMapperService would**:
- Standardize this pattern
- Make it configuration-driven (not code)
- Handle edge cases consistently
- Support expandable rows

---

## Action Items (After Backend Verification)

1. [ ] Design DataMapperService interface
2. [ ] Implement flatten strategies
3. [ ] Implement expansion data packaging
4. [ ] Add dataMapper config to PickerConfig interface
5. [ ] Refactor existing responseTransformers to use DataMapperService
6. [ ] Test with both flat and nested API responses
7. [ ] Document configuration options

---

## Current Priority

**DO NOT IMPLEMENT YET.**

First, complete:
1. Backend API verification for automobile domain
2. Fix any backend issues (we control this API)
3. Verify picker displays correct 881 combinations

Then implement DataMapperService to ensure future domains work regardless of API structure.

---

**End of Document**
