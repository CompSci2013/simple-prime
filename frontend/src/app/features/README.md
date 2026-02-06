# Feature Modules

**Purpose**: Contains domain-specific feature modules that implement user-facing functionality. Each feature is a self-contained module with its own components, templates, and styles.

## Structure

```
features/
├── home/                     # Landing page and domain selector
│   ├── home.component.ts
│   ├── home.component.html
│   └── home.component.scss
├── automobile/               # Automobile domain feature
│   ├── automobile.component.ts
│   └── automobile-discover/  # Discovery page for automobiles
├── agriculture/              # Agriculture domain feature (NgModule pattern)
│   ├── agriculture.module.ts
│   └── agriculture-discover/
└── popout/                   # Pop-out window support
    ├── popout.component.ts   # Layout component for popouts
    └── popout.routes.ts      # Child routes for popout content
```

## Feature Types

### Domain Features
Domain features implement the UI for specific business domains:
- **automobile**: Vehicle data exploration (standalone components)
- **agriculture**: Crop/soil data exploration (NgModule pattern)

### Infrastructure Features
Infrastructure features support cross-cutting concerns:
- **home**: Application entry point and navigation
- **popout**: Multi-window support for panels

## Component Patterns

### Standalone Components (Preferred)
```typescript
@Component({
  selector: 'app-my-feature',
  standalone: true,
  imports: [CommonModule, ...],
  templateUrl: './my-feature.component.html'
})
export class MyFeatureComponent { }
```

### NgModule Pattern (Legacy)
```typescript
@NgModule({
  declarations: [MyFeatureComponent],
  imports: [CommonModule, RouterModule.forChild(routes)]
})
export class MyFeatureModule { }
```

## Adding New Features

1. Create feature directory: `features/my-feature/`
2. Create component files:
   - `my-feature.component.ts`
   - `my-feature.component.html`
   - `my-feature.component.scss`
3. Add route in `app/app.routes.ts`
4. For domain features:
   - Create corresponding domain config in `domain-config/my-domain/`
   - Register domain in `DomainConfigRegistry`

## Discovery Pattern

Domain discovery pages follow a consistent pattern:
1. Inject `DomainConfig` from the registry
2. Use framework components (`QueryControl`, `DynamicResultsTable`, etc.)
3. Coordinate state via `ResourceManagementService`
4. Handle popouts via `PopOutManagerService`
