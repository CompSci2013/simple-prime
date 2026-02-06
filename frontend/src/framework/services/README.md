# Framework Services

**Purpose**: Singleton services that provide application-wide functionality. These services coordinate state, handle HTTP requests, manage URL state, and orchestrate cross-window communication.

## Structure

```
services/
├── api.service.ts                    # HTTP client wrapper
├── domain-config-registry.service.ts # Domain configuration registry
├── domain-config-validator.service.ts# Configuration validation
├── error-notification.service.ts     # Error display and logging
├── filter-options.service.ts         # Filter options caching
├── global-error.handler.ts           # Global error boundary
├── http-error.interceptor.ts         # HTTP error interception
├── picker-config-registry.service.ts # Picker configuration registry
├── popout-context.service.ts         # Popout detection and messaging
├── popout-manager.service.ts         # Popout window management
├── request-coordinator.service.ts    # Request deduplication
├── resource-management.service.ts    # Central state management
├── url-state.service.ts              # URL-First state synchronization
├── user-preferences.service.ts       # User settings persistence
└── index.ts                          # Barrel export
```

## Core Services

### ResourceManagementService
Central state coordinator. Listens to URL changes, triggers API calls, broadcasts state:
```typescript
@Injectable()
export class ResourceManagementService<TFilters, TData, TStats> {
  readonly state$: Observable<ResourceState<TData, TStats>>;
  readonly data$: Observable<TData[]>;
  readonly statistics$: Observable<TStats>;
  readonly loading$: Observable<boolean>;

  // Initialize with domain config
  initialize(config: DomainConfig<TFilters, TData, TStats>): void;

  // Sync state from external source (popout)
  syncStateFromExternal(state: ResourceState<TData, TStats>): void;
}
```

### UrlStateService
URL-First architecture implementation. Single source of truth for application state:
```typescript
@Injectable({ providedIn: 'root' })
export class UrlStateService {
  readonly params$: Observable<Params>;

  // Set URL parameters (triggers state cascade)
  setParams(params: { [key: string]: any }): Promise<boolean>;

  // Clear all parameters
  clearParams(): Promise<boolean>;

  // Get current parameter value
  getParam(key: string): string | null;
}
```

### PopOutManagerService
Manages popout windows and BroadcastChannel communication:
```typescript
@Injectable()
export class PopOutManagerService {
  // Open a panel in a new window
  openPopOut(panelId: string, componentType: string): void;

  // Check if panel is popped out
  isPoppedOut(panelId: string): boolean;

  // Broadcast state to all popouts
  broadcastState(state: ResourceState, cache?: FilterOptionsCache): void;
}
```

### PopOutContextService
Detects popout context and provides messaging:
```typescript
@Injectable({ providedIn: 'root' })
export class PopOutContextService {
  isInPopOut(): boolean;
  initializeAsPopOut(componentId: string): void;
  sendMessage(message: PopOutMessage): void;
  getMessages$(): Observable<PopOutMessage>;
}
```

## Service Patterns

### Provided in Root
Most services are application singletons:
```typescript
@Injectable({ providedIn: 'root' })
export class UrlStateService { }
```

### Provided per Component
Some services are scoped to component trees:
```typescript
// In component providers
@Component({
  providers: [ResourceManagementService]
})
```

### Generic Services
Services use generics for domain-agnostic operation:
```typescript
@Injectable()
export class ResourceManagementService<TFilters, TData, TStats> { }
```

## Adding New Services

1. Create service file: `services/my-feature.service.ts`
2. Decide scope:
   - `providedIn: 'root'` for app-wide singletons
   - Component `providers` for scoped instances
3. Use generic types if handling domain-specific data
4. Export from `index.ts`:
   ```typescript
   export * from './my-feature.service';
   ```
5. Inject dependencies via constructor
6. Use RxJS for reactive state management

## Service Guidelines

- **Single Responsibility**: One clear purpose per service
- **Observable Outputs**: Expose state as observables
- **Immutable Updates**: Never mutate state directly
- **Error Handling**: Use `catchError` and error notification service
- **Cleanup**: Implement `ngOnDestroy` if subscribing
