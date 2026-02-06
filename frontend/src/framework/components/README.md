# Framework Components

**Purpose**: Reusable, domain-agnostic UI components that render based on configuration. These components have NO knowledge of specific domains - they receive all domain-specific behavior through `DomainConfig` and related interfaces.

## Structure

```
components/
├── base-chart/               # ECharts-based chart visualization
├── base-picker/              # Hierarchical tree selection
├── basic-results-table/      # Simple data table (legacy)
├── dockview-statistics-panel/# Tabbed chart container (Dockview)
├── dynamic-results-table/    # Configurable data table
├── query-control/            # Filter chips and controls
├── query-panel/              # Query panel container (legacy)
├── results-table/            # Results table (legacy)
└── statistics-panel-2/       # CDK drag-drop chart grid
```

## Component Overview

| Component | Purpose | Key Inputs |
|-----------|---------|------------|
| `BaseChartComponent` | Renders ECharts visualizations | `dataSource`, `statistics$` |
| `BasePickerComponent` | Hierarchical selection tree | `pickerConfig` |
| `DynamicResultsTableComponent` | Paginated data table | `domainConfig`, `tableConfig` |
| `QueryControlComponent` | Filter dropdown and chips | `filterDefinitions`, `activeFilters` |
| `StatisticsPanel2Component` | Draggable chart grid | `domainConfig`, `chartIds` |
| `DockviewStatisticsPanelComponent` | Tabbed chart panels | `domainConfig` |

## Component Patterns

### Configuration-Driven Rendering
```typescript
@Component({ ... })
export class DynamicResultsTableComponent {
  @Input() domainConfig!: DomainConfig<any, any, any>;

  // Columns come from config, not hardcoded
  get columns() {
    return this.domainConfig.tableConfig.columns;
  }
}
```

### Observable-Based Data Flow
```typescript
@Component({ ... })
export class BaseChartComponent {
  // Subscribes to data from ResourceManagementService
  @Input() statistics$!: Observable<Statistics>;

  // Renders when observable emits
}
```

### Popout Awareness
Components detect when running in popout windows:
```typescript
constructor(private popOutContext: PopOutContextService) {}

get isInPopOut(): boolean {
  return this.popOutContext.isInPopOut();
}

// In popout: send messages via BroadcastChannel
// In main: emit events to parent
```

## Adding New Components

1. Create component directory: `components/my-component/`
2. Create files:
   - `my-component.component.ts`
   - `my-component.component.html`
   - `my-component.component.scss`
3. Use standalone component pattern:
   ```typescript
   @Component({
     selector: 'app-my-component',
     standalone: true,
     imports: [CommonModule, ...],
     templateUrl: './my-component.component.html',
     changeDetection: ChangeDetectionStrategy.OnPush
   })
   export class MyComponentComponent {
     @Input() domainConfig!: DomainConfig<any, any, any>;
   }
   ```
4. Accept ALL domain-specific data via `@Input()` or injected services
5. Use `OnPush` change detection for performance
6. Handle popout context if the component can be popped out

## Popout Support

To make a component work in popout windows:

1. Add route in `popout.routes.ts`:
   ```typescript
   {
     path: 'my-component',
     loadComponent: () => import('./my-component/my-component.component')
       .then(m => m.MyComponentComponent)
   }
   ```

2. Inject `PopOutContextService` for message passing
3. Use `IS_POPOUT_TOKEN` to detect popout context
4. Send URL changes via `BroadcastChannel` instead of direct router calls
