# Domain Configuration Guide (F10)

Complete guide to creating and validating domain-specific configurations for the Generic Discovery Framework.

---

## Overview

The Domain Configuration System provides:

- **Type-Safe Configuration Schema** - Complete DomainConfig interface
- **Runtime Validation** - Catches missing fields and invalid values
- **Configuration Registry** - Manage multiple domains
- **Feature Flags** - Enable/disable framework features per domain
- **Extensible Schema** - Support for filters, charts, and custom metadata

---

## DomainConfig Interface

Complete configuration schema for a domain:

```typescript
interface DomainConfig<TFilters, TData, TStatistics = any> {
  // Identity
  domainName: string;           // Unique identifier (e.g., 'automobile')
  domainLabel: string;          // Display name (e.g., 'Automobile Discovery')
  apiBaseUrl: string;           // API base URL

  // Type Models
  filterModel: Type<TFilters>;
  dataModel: Type<TData>;
  statisticsModel?: Type<TStatistics>;

  // Adapters
  apiAdapter: IApiAdapter<TFilters, TData, TStatistics>;
  urlMapper: IFilterUrlMapper<TFilters>;
  cacheKeyBuilder: ICacheKeyBuilder<TFilters>;

  // UI Configuration
  tableConfig: TableConfig<TData>;
  pickers: PickerConfig<any>[];
  filters: FilterDefinition[];
  charts: ChartConfig[];

  // Feature Flags
  features: DomainFeatures;

  // Optional Metadata
  metadata?: DomainMetadata;
}
```

---

## Creating a Domain Configuration

### Step 1: Define Type Models

```typescript
// domain-config/automobile/models/automobile.filters.ts
export class AutoSearchFilters {
  manufacturer?: string;
  model?: string;
  yearMin?: number;
  yearMax?: number;
  bodyClass?: string;
  page?: number;
  size?: number;
  sort?: string;
  sortDirection?: 'asc' | 'desc';
}

// domain-config/automobile/models/automobile.data.ts
export class VehicleResult {
  vehicle_id!: string;
  manufacturer!: string;
  model!: string;
  year!: number;
  body_class!: string;
  instance_count!: number;
}

// domain-config/automobile/models/automobile.statistics.ts
export class VehicleStatistics {
  totalVehicles!: number;
  totalInstances!: number;
  manufacturerCount!: number;
  yearRange!: { min: number; max: number };
}
```

### Step 2: Create Adapters

```typescript
// domain-config/automobile/adapters/automobile-api.adapter.ts
export class AutomobileApiAdapter implements IApiAdapter<
  AutoSearchFilters,
  VehicleResult,
  VehicleStatistics
> {
  fetchData(
    filters: AutoSearchFilters,
    apiService: ApiService
  ): Observable<ApiResponse<VehicleResult>> {
    return apiService.get<VehicleResult>('/vehicles', filters);
  }

  fetchStatistics(
    filters: AutoSearchFilters,
    apiService: ApiService
  ): Observable<VehicleStatistics> {
    return apiService.get<VehicleStatistics>('/statistics', filters);
  }
}

// domain-config/automobile/adapters/automobile-url.mapper.ts
export class AutomobileUrlMapper implements IFilterUrlMapper<AutoSearchFilters> {
  toUrlParams(filters: AutoSearchFilters): Record<string, any> {
    return {
      mfr: filters.manufacturer,
      mdl: filters.model,
      y_min: filters.yearMin,
      y_max: filters.yearMax,
      bc: filters.bodyClass,
      p: filters.page,
      sz: filters.size,
      s: filters.sort,
      sd: filters.sortDirection
    };
  }

  fromUrlParams(params: Record<string, any>): AutoSearchFilters {
    return {
      manufacturer: params['mfr'],
      model: params['mdl'],
      yearMin: params['y_min'] ? Number(params['y_min']) : undefined,
      yearMax: params['y_max'] ? Number(params['y_max']) : undefined,
      bodyClass: params['bc'],
      page: params['p'] ? Number(params['p']) : undefined,
      size: params['sz'] ? Number(params['sz']) : undefined,
      sort: params['s'],
      sortDirection: params['sd'] as 'asc' | 'desc'
    };
  }
}
```

### Step 3: Create UI Configurations

```typescript
// domain-config/automobile/configs/automobile.table-config.ts
export const AUTOMOBILE_TABLE_CONFIG: TableConfig<VehicleResult> = {
  tableId: 'automobile-vehicles',
  stateKey: 'auto-vehicles-state',
  dataKey: 'vehicle_id',

  columns: [
    {
      field: 'manufacturer',
      header: 'Manufacturer',
      sortable: true,
      filterable: true,
      width: '150px'
    },
    {
      field: 'model',
      header: 'Model',
      sortable: true,
      filterable: true,
      width: '150px'
    },
    {
      field: 'year',
      header: 'Year',
      sortable: true,
      filterable: true,
      width: '100px'
    }
  ],

  expandable: true,
  selectable: false,
  paginator: true,
  rows: 20,
  lazy: true,
  stateStorage: 'local'
};

// domain-config/automobile/configs/automobile.filter-definitions.ts
export const AUTOMOBILE_FILTER_DEFINITIONS: FilterDefinition[] = [
  {
    id: 'manufacturer',
    label: 'Manufacturer',
    type: 'text',
    placeholder: 'Enter manufacturer...',
    operators: ['contains', 'equals', 'startsWith']
  },
  {
    id: 'year',
    label: 'Year',
    type: 'range',
    min: 1900,
    max: new Date().getFullYear(),
    step: 1
  }
];

// domain-config/automobile/configs/automobile.chart-configs.ts
export const AUTOMOBILE_CHART_CONFIGS: ChartConfig[] = [
  {
    id: 'manufacturer-distribution',
    title: 'Vehicles by Manufacturer',
    type: 'bar',
    dataSourceId: 'manufacturer-stats',
    height: 400
  }
];
```

### Step 4: Assemble Domain Configuration

```typescript
// domain-config/automobile/automobile.domain-config.ts
import { DomainConfig } from '@/framework/models/domain-config.interface';

export const AUTOMOBILE_DOMAIN_CONFIG: DomainConfig<
  AutoSearchFilters,
  VehicleResult,
  VehicleStatistics
> = {
  // Identity
  domainName: 'automobile',
  domainLabel: 'Automobile Discovery',
  apiBaseUrl: 'http://auto-discovery.minilab/api/v1',

  // Type Models
  filterModel: AutoSearchFilters,
  dataModel: VehicleResult,
  statisticsModel: VehicleStatistics,

  // Adapters
  apiAdapter: new AutomobileApiAdapter(),
  urlMapper: new AutomobileUrlMapper(),
  cacheKeyBuilder: new DefaultCacheKeyBuilder(),

  // UI Configuration
  tableConfig: AUTOMOBILE_TABLE_CONFIG,
  pickers: AUTOMOBILE_PICKER_CONFIGS,
  filters: AUTOMOBILE_FILTER_DEFINITIONS,
  charts: AUTOMOBILE_CHART_CONFIGS,

  // Feature Flags
  features: {
    highlights: true,
    popOuts: true,
    rowExpansion: true,
    statistics: true,
    export: true,
    columnManagement: true,
    statePersistence: true
  },

  // Metadata (optional)
  metadata: {
    version: '1.0.0',
    description: 'Automobile vehicle discovery and analysis',
    author: 'Your Name',
    createdAt: '2025-11-20'
  }
};
```

---

## Validation

### Automatic Validation

Use `DomainConfigValidator` to validate configurations:

```typescript
import { DomainConfigValidator } from '@/framework/services/domain-config-validator.service';

const validator = new DomainConfigValidator();
const result = validator.validate(AUTOMOBILE_DOMAIN_CONFIG);

if (!result.valid) {
  console.error('Configuration validation failed:');
  result.errors.forEach(error => {
    console.error(`- ${error.field}: ${error.message}`);
  });
}
```

### Validation Rules

**Required String Fields**:
- `domainName` - Must be lowercase alphanumeric with hyphens
- `domainLabel` - Must be non-empty
- `apiBaseUrl` - Must be valid URL

**Required Fields**:
- `filterModel`, `dataModel` - Type constructors
- `apiAdapter`, `urlMapper`, `cacheKeyBuilder` - Adapter instances
- `tableConfig` - Table configuration object
- `features` - Feature flags object

**Arrays** (default to empty if missing):
- `pickers` - Picker configurations
- `filters` - Filter definitions
- `charts` - Chart configurations

**Validation Checks**:
- Adapter interfaces (must have required methods)
- Table config (must have `tableId`, `dataKey`, and non-empty `columns`)
- Duplicate IDs in pickers, filters, and charts
- Feature flag types (must be boolean)

### Sanitize and Validate

Use `validateAndSanitize()` to validate and apply defaults:

```typescript
const sanitizedConfig = validator.validateAndSanitize(AUTOMOBILE_DOMAIN_CONFIG);
// Throws error if invalid
// Returns config with defaults applied
```

---

## Registration

### Single Domain Application

Use `DOMAIN_CONFIG` injection token:

```typescript
// app.module.ts
import { DOMAIN_CONFIG } from '@/framework/services/domain-config-registry.service';
import { AUTOMOBILE_DOMAIN_CONFIG } from './domain-config/automobile/automobile.domain-config';

@NgModule({
  providers: [
    {
      provide: DOMAIN_CONFIG,
      useValue: AUTOMOBILE_DOMAIN_CONFIG
    }
  ]
})
export class AppModule {}

// component.ts
export class MyComponent {
  constructor(
    @Inject(DOMAIN_CONFIG) private domainConfig: DomainConfig<any, any, any>
  ) {
    console.log('Domain:', domainConfig.domainLabel);
  }
}
```

### Multi-Domain Application

Use `DomainConfigRegistry`:

```typescript
// app.module.ts
import { APP_INITIALIZER } from '@angular/core';
import { DomainConfigRegistry } from '@/framework/services/domain-config-registry.service';

function initializeDomains(registry: DomainConfigRegistry) {
  return () => {
    registry.register(AUTOMOBILE_DOMAIN_CONFIG);
    registry.register(AGRICULTURE_DOMAIN_CONFIG);
    registry.register(REAL_ESTATE_DOMAIN_CONFIG);

    // Set default active domain
    registry.setActive('automobile');
  };
}

@NgModule({
  providers: [
    {
      provide: APP_INITIALIZER,
      useFactory: initializeDomains,
      deps: [DomainConfigRegistry],
      multi: true
    }
  ]
})
export class AppModule {}

// component.ts
export class MyComponent {
  constructor(private registry: DomainConfigRegistry) {
    // Get active domain
    const config = registry.getActive();

    // List all domains
    const domains = registry.getAllDomainNames();

    // Switch domain
    registry.setActive('agriculture');
  }
}
```

---

## Feature Flags

Control framework features per domain:

```typescript
interface DomainFeatures {
  highlights: boolean;          // Highlight system
  popOuts: boolean;             // Pop-out windows
  rowExpansion: boolean;        // Table row expansion
  statistics?: boolean;         // Statistics panel
  export?: boolean;             // Data export
  columnManagement?: boolean;   // Column show/hide
  statePersistence?: boolean;   // Save user preferences
}
```

**Usage**:

```typescript
if (domainConfig.features.popOuts) {
  // Show pop-out button
}

if (domainConfig.features.export) {
  // Show export button
}
```

**Default Values**:

```typescript
const DEFAULT_DOMAIN_FEATURES: DomainFeatures = {
  highlights: true,
  popOuts: true,
  rowExpansion: true,
  statistics: true,
  export: true,
  columnManagement: true,
  statePersistence: true
};
```

---

## Filter Definitions

Define query controls in the UI:

```typescript
const MANUFACTURER_FILTER: FilterDefinition = {
  id: 'manufacturer',
  label: 'Manufacturer',
  type: 'text',
  placeholder: 'Enter manufacturer name...',
  operators: ['equals', 'contains', 'startsWith'],
  defaultOperator: 'contains',
  validation: {
    minLength: 2,
    maxLength: 50
  }
};

const YEAR_RANGE_FILTER: FilterDefinition = {
  id: 'yearRange',
  label: 'Year Range',
  type: 'range',
  min: 1900,
  max: 2025,
  step: 1
};

const BODY_CLASS_FILTER: FilterDefinition = {
  id: 'bodyClass',
  label: 'Body Class',
  type: 'select',
  options: [
    { value: 'sedan', label: 'Sedan' },
    { value: 'suv', label: 'SUV' },
    { value: 'truck', label: 'Truck' }
  ]
};
```

**Filter Types**:
- `text` - Text input
- `number` - Numeric input
- `date` - Date picker
- `daterange` - Date range picker
- `select` - Single select dropdown
- `multiselect` - Multi-select dropdown
- `boolean` - Checkbox
- `range` - Numeric range slider

### Filter Formatting

Control how filter values are displayed and processed using the `format` property:

#### Number Formatting

Customize number display (thousand separators, decimals):

```typescript
// Year filter - NO commas
{
  id: 'yearRange',
  label: 'Year Range',
  type: 'range',
  min: 1900,
  max: 2025,
  format: {
    number: {
      useGrouping: false,           // No commas: "1980" not "1,980"
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }
  }
}

// VIN count filter - WITH commas
{
  id: 'vinCount',
  label: 'VIN Count',
  type: 'range',
  min: 0,
  max: 10000,
  format: {
    number: {
      useGrouping: true,            // Show commas: "1,000"
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }
  }
}

// Price filter - currency format
{
  id: 'price',
  label: 'Price',
  type: 'number',
  format: {
    number: {
      useGrouping: true,
      minimumFractionDigits: 2,     // Always show 2 decimals
      maximumFractionDigits: 2
    }
  }
}
```

#### Case-Insensitive Matching

Make text/select filters case-insensitive:

```typescript
{
  id: 'bodyClass',
  label: 'Body Class',
  type: 'select',
  format: {
    caseSensitive: false,     // Match "Coupe", "coupe", "COUPE" equally
    transform: 'titlecase'    // Normalize to "Coupe" before sending to API
  },
  options: [
    { value: 'Sedan', label: 'Sedan' },
    { value: 'Coupe', label: 'Coupe' },
    { value: 'SUV', label: 'SUV' }
  ]
}
```

#### Text Transformation

Transform filter values before sending to API:

```typescript
{
  id: 'manufacturer',
  label: 'Manufacturer',
  type: 'text',
  format: {
    transform: 'uppercase'    // Convert to uppercase before API call
  }
}
```

**Available Transforms**:
- `lowercase` - Convert to lowercase
- `uppercase` - Convert to UPPERCASE
- `titlecase` - Convert to Title Case
- `trim` - Remove leading/trailing whitespace
- `none` - No transformation (default)

#### Date Formatting

Customize date display patterns:

```typescript
{
  id: 'registrationDate',
  label: 'Registration Date',
  type: 'date',
  format: {
    date: {
      pattern: 'MM/DD/YYYY',  // US format
      locale: 'en-US',
      includeTime: false
    }
  }
}

// European format
{
  id: 'inspectionDate',
  label: 'Inspection Date',
  type: 'date',
  format: {
    date: {
      pattern: 'DD.MM.YYYY',
      locale: 'de-DE'
    }
  }
}
```

#### Custom Formatters

Use custom functions for advanced formatting:

```typescript
{
  id: 'vin',
  label: 'VIN',
  type: 'text',
  format: {
    // Custom display formatter
    displayFormatter: (value: string) => {
      // Format VIN in groups: ABC-123-XYZ-456
      return value.match(/.{1,3}/g)?.join('-') || value;
    },

    // Custom value parser (reverse of display)
    valueParser: (input: string) => {
      // Remove dashes before sending to API
      return input.replace(/-/g, '');
    }
  }
}
```

#### Format Options Reference

```typescript
interface FilterFormat {
  // Number formatting
  number?: {
    useGrouping?: boolean;           // Thousand separators (default: true)
    minimumFractionDigits?: number;  // Min decimals (default: 0)
    maximumFractionDigits?: number;  // Max decimals (default: 0)
    locale?: string;                 // Locale (default: 'en-US')
    pattern?: string;                // Custom pattern: '#,##0.00'
  };

  // Date formatting
  date?: {
    pattern?: string;       // Date pattern: 'YYYY-MM-DD'
    locale?: string;        // Locale (default: 'en-US')
    includeTime?: boolean;  // Show time (default: false)
  };

  // Text matching
  caseSensitive?: boolean;  // Case-sensitive matching (default: true)
  transform?: 'lowercase' | 'uppercase' | 'titlecase' | 'trim' | 'none';

  // Custom formatters
  displayFormatter?: (value: any) => string;
  valueParser?: (input: string) => any;
}
```

---

## Chart Configurations

Define charts and their data sources:

```typescript
const MANUFACTURER_CHART: ChartConfig = {
  id: 'manufacturer-distribution',
  title: 'Vehicles by Manufacturer',
  type: 'bar',
  dataSourceId: 'manufacturer-stats',
  options: {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true }
    }
  },
  height: 400,
  visible: true,
  collapsible: true
};
```

**Chart Types**:
- `bar`, `line`, `pie`, `doughnut`
- `scatter`, `histogram`
- `heatmap`, `treemap`, `sunburst`

---

## Validation Errors

Error types returned by validator:

```typescript
enum ConfigErrorType {
  MISSING_REQUIRED    // Required field missing
  INVALID_TYPE        // Wrong type (e.g., string instead of number)
  INVALID_VALUE       // Invalid value (e.g., empty string, bad URL)
  EMPTY_ARRAY         // Array is empty when it shouldn't be
  DUPLICATE_ID        // Duplicate ID in pickers/filters/charts
}
```

**Example Validation Result**:

```typescript
{
  valid: false,
  errors: [
    {
      type: ConfigErrorType.MISSING_REQUIRED,
      field: 'domainName',
      message: "Required field 'domainName' is missing",
      expected: 'string'
    },
    {
      type: ConfigErrorType.INVALID_VALUE,
      field: 'apiBaseUrl',
      message: 'API base URL is not a valid URL',
      expected: 'valid URL (e.g., "http://api.example.com")',
      actual: 'not-a-url'
    }
  ],
  warnings: []
}
```

---

## Best Practices

### 1. Use Type-Safe Generics

```typescript
// ✅ Correct - Type-safe
const config: DomainConfig<AutoSearchFilters, VehicleResult, VehicleStatistics> = {
  // TypeScript will enforce correct types
};

// ❌ Wrong - Loses type safety
const config: DomainConfig<any, any, any> = {
  // No type checking
};
```

### 2. Validate During Development

```typescript
// In domain config file
if (!environment.production) {
  const validator = new DomainConfigValidator();
  const result = validator.validate(AUTOMOBILE_DOMAIN_CONFIG);
  if (!result.valid) {
    console.error('Domain config validation failed:', result.errors);
  }
}
```

### 3. Use Feature Flags

```typescript
// ✅ Check feature flags before rendering
<button *ngIf="domainConfig.features.export" (click)="export()">
  Export
</button>

// ❌ Don't hardcode features
<button (click)="export()">Export</button>
```

### 4. Provide Metadata

```typescript
metadata: {
  version: '1.0.0',
  description: 'Automobile vehicle discovery',
  author: 'Team Name',
  createdAt: '2025-11-20',
  updatedAt: '2025-11-20'
}
```

### 5. Keep Domain Name Consistent

```typescript
// ✅ Consistent naming
domainName: 'automobile'
apiBaseUrl: 'http://auto-discovery.minilab/api/v1'
tableConfig.stateKey: 'auto-vehicles-state'

// ❌ Inconsistent naming
domainName: 'automobile'
apiBaseUrl: 'http://vehicle-api.minilab/api/v1'
tableConfig.stateKey: 'cars-table'
```

---

## Testing

### Test Configuration Validation

```typescript
describe('AutomobileDomainConfig', () => {
  let validator: DomainConfigValidator;

  beforeEach(() => {
    validator = new DomainConfigValidator();
  });

  it('should be valid', () => {
    const result = validator.validate(AUTOMOBILE_DOMAIN_CONFIG);
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('should have required fields', () => {
    expect(AUTOMOBILE_DOMAIN_CONFIG.domainName).toBe('automobile');
    expect(AUTOMOBILE_DOMAIN_CONFIG.apiBaseUrl).toBeTruthy();
  });

  it('should have valid adapters', () => {
    expect(typeof AUTOMOBILE_DOMAIN_CONFIG.apiAdapter.fetchData).toBe('function');
    expect(typeof AUTOMOBILE_DOMAIN_CONFIG.urlMapper.toUrlParams).toBe('function');
  });
});
```

---

## Troubleshooting

### Configuration Validation Failed

**Error**: "Required field 'domainName' is missing"
- **Fix**: Add `domainName: 'your-domain'` to config

**Error**: "Domain name must be lowercase"
- **Fix**: Change `domainName: 'Automobile'` to `domainName: 'automobile'`

**Error**: "API base URL is not a valid URL"
- **Fix**: Ensure URL includes protocol: `http://` or `https://`

### TypeScript Errors

**Error**: "Type 'string' is not assignable to type 'Type<AutoSearchFilters>'"
- **Fix**: Use class constructor, not instance:
  ```typescript
  filterModel: AutoSearchFilters,     // ✅ Correct (class)
  filterModel: new AutoSearchFilters() // ❌ Wrong (instance)
  ```

### Runtime Errors

**Error**: "Cannot read property 'fetchData' of undefined"
- **Fix**: Ensure adapters are instantiated:
  ```typescript
  apiAdapter: new AutomobileApiAdapter()  // ✅ Correct
  apiAdapter: AutomobileApiAdapter        // ❌ Wrong (not instantiated)
  ```

---

## Related Documentation

- [F4: Resource Management Service](../services/resource-management.service.ts)
- [F6: Table Configuration](./table-config.interface.ts)
- [F7: Picker Configuration](./picker-config.interface.ts)
- [Domain Config Validator](../services/domain-config-validator.service.ts)
- [Domain Config Registry](../services/domain-config-registry.service.ts)

---

**Implementation Status**: ✅ Complete (Milestone F10)
**Last Updated**: 2025-11-20
