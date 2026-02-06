# Dependency Injection Tokens

**Purpose**: Contains Angular `InjectionToken` definitions for dependency injection of primitive values and configuration objects that cannot be injected by type alone.

## Structure

```
tokens/
└── popout.token.ts    # IS_POPOUT_TOKEN for popout detection
```

## Current Tokens

### IS_POPOUT_TOKEN
Signals whether a component tree is running inside a popout window:

```typescript
// Definition
export const IS_POPOUT_TOKEN = new InjectionToken<boolean>('IS_POPOUT');

// Provided in popout layout
@Component({
  providers: [
    { provide: IS_POPOUT_TOKEN, useValue: true }
  ]
})
export class PopoutComponent { }

// Injected in child components
constructor(
  @Optional() @Inject(IS_POPOUT_TOKEN) private isPopout: boolean
) {
  if (this.isPopout) {
    // Running in popout window
  }
}
```

## When to Use Tokens

Use `InjectionToken` when you need to inject:

1. **Primitive values** (boolean, string, number)
2. **Configuration objects** without a class type
3. **Environment-specific values**
4. **Feature flags**

## Token Patterns

### Boolean Flags
```typescript
export const IS_FEATURE_ENABLED = new InjectionToken<boolean>('IS_FEATURE_ENABLED');

// Provide
providers: [{ provide: IS_FEATURE_ENABLED, useValue: true }]

// Inject
constructor(@Inject(IS_FEATURE_ENABLED) private enabled: boolean) { }
```

### Configuration Objects
```typescript
export const APP_CONFIG = new InjectionToken<AppConfig>('APP_CONFIG');

// Provide
providers: [{ provide: APP_CONFIG, useValue: { apiUrl: '...' } }]

// Inject
constructor(@Inject(APP_CONFIG) private config: AppConfig) { }
```

### Factory Functions
```typescript
export const LOGGER = new InjectionToken<Logger>('LOGGER', {
  providedIn: 'root',
  factory: () => new ConsoleLogger()
});
```

## Adding New Tokens

1. Create token in `tokens/` directory or add to existing file
2. Define with descriptive string identifier:
   ```typescript
   export const MY_TOKEN = new InjectionToken<MyType>('MY_TOKEN');
   ```
3. Document the token's purpose
4. Show example provider and injection usage
5. Use `@Optional()` when injection might not be provided

## Best Practices

- **Descriptive names**: Token name should indicate purpose
- **Type safety**: Always specify the generic type
- **Optional injection**: Use `@Optional()` for optional tokens
- **Default values**: Handle undefined in component logic
- **Scoped providers**: Provide at appropriate level (root, module, component)
