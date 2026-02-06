# Application Root

**Purpose**: Contains the Angular application bootstrap, configuration, routing, and feature modules.

## Structure

```
app/
├── app.component.ts          # Root component with global layout
├── app.component.html        # Root template (router-outlet container)
├── app.component.scss        # Global component styles
├── app.config.ts             # Application configuration (providers, imports)
├── app.routes.ts             # Top-level route definitions
└── features/                 # Feature modules (domain-specific UI)
```

## Key Files

| File | Purpose |
|------|---------|
| `app.component.ts` | Root component that bootstraps the application |
| `app.config.ts` | Angular application configuration with providers |
| `app.routes.ts` | Route definitions for lazy-loaded feature modules |

## Routing Architecture

The application uses a hybrid Angular 13/14 routing pattern:

- **Standalone Components** (Angular 14+): Home, Automobile, Popout
- **NgModule Pattern** (Angular 13): Agriculture (legacy simulation)

```typescript
// Standalone component route
{ path: 'automobiles', loadComponent: () => import('./features/automobile/...') }

// NgModule route (legacy)
{ path: 'agriculture', loadChildren: () => import('./features/agriculture/...') }
```

## Adding New Routes

1. Create your feature in `features/` directory
2. Add route to `app.routes.ts`:

```typescript
{
  path: 'your-feature',
  loadComponent: () =>
    import('./features/your-feature/your-feature.component')
      .then(m => m.YourFeatureComponent)
}
```

3. Use `loadComponent` for standalone components (preferred)
4. Use `loadChildren` only for NgModule-based legacy code
