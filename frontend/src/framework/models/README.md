# Framework Models

**Purpose**: Contains TypeScript interfaces and types that define the contracts between framework components, services, and domain configurations. These are the "shapes" that enable domain-agnostic code.

## Structure

```
models/
├── api-response.interface.ts       # API response wrapper types
├── domain-config.interface.ts      # Main domain configuration
├── error-notification.interface.ts # Error handling types
├── filter-definition.interface.ts  # Filter configuration
├── pagination.interface.ts         # Pagination types
├── picker-config.interface.ts      # Hierarchical picker config
├── popout.interface.ts             # Popout messaging types
├── resource-management.interface.ts # State management types
├── table-config.interface.ts       # Table column configuration
└── index.ts                        # Barrel export
```

## Key Interfaces

### DomainConfig
The master configuration interface that defines a complete domain:
```typescript
interface DomainConfig<TFilters, TData, TStatistics> {
  domainName: string;
  apiAdapter: ApiAdapter<TFilters, TData, TStatistics>;
  filterDefinitions: FilterDefinition[];
  tableConfig: TableConfig<TData>;
  chartDataSources?: Record<string, ChartDataSource>;
  // ...
}
```

### FilterDefinition
Defines a filter control's behavior:
```typescript
interface FilterDefinition {
  name: string;
  label: string;
  type: 'multiselect' | 'range' | 'text';
  urlParams: string | { min: string; max: string };
  optionsLoader?: (filters: any) => Observable<string[]>;
}
```

### TableConfig
Configures table columns and behavior:
```typescript
interface TableConfig<TData> {
  columns: ColumnDefinition<TData>[];
  defaultSort?: { field: keyof TData; order: 'asc' | 'desc' };
  pageSizeOptions?: number[];
}
```

### PopOutMessage
Messages sent between main window and popouts:
```typescript
interface PopOutMessage {
  type: PopOutMessageType;
  payload?: any;
  timestamp: number;
}

enum PopOutMessageType {
  PANEL_READY,
  STATE_UPDATE,
  URL_PARAMS_CHANGED,
  CLOSE_POPOUT,
  // ...
}
```

## Usage Patterns

### Generic Type Parameters
Models use generic types to remain domain-agnostic:
```typescript
// Framework defines the shape
interface ResourceState<TData, TStatistics> {
  data: TData[];
  statistics?: TStatistics;
  loading: boolean;
}

// Domain provides concrete types
type VehicleState = ResourceState<VehicleResult, VehicleStats>;
```

### Barrel Exports
Import from the index file:
```typescript
import {
  DomainConfig,
  FilterDefinition,
  TableConfig
} from '../../framework/models';
```

## Adding New Models

1. Create interface file: `models/my-type.interface.ts`
2. Use generic types where domain-specific data varies
3. Export from `index.ts`:
   ```typescript
   export * from './my-type.interface';
   ```
4. Document the interface with JSDoc comments
5. Avoid domain-specific terminology in names and properties

## Interface Design Guidelines

- **Generic over specific**: Use `TData` not `VehicleData`
- **Composition over inheritance**: Small, focused interfaces
- **Optional properties**: Use `?` for truly optional fields
- **Union types**: Use for finite sets of values
- **Documentation**: Add JSDoc for complex properties
