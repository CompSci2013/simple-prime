# Angular Canonical Recommendations

**Reference**: Angular Style Guide for versions 13/14
**Last Updated**: 2026-02-05

This document captures the official Angular style guide recommendations and best practices for directory structure and code organization.

---

## Table of Contents

1. [LIFT Principle](#lift-principle)
2. [Directory Structure](#directory-structure)
3. [File Naming Conventions](#file-naming-conventions)
4. [Module Organization](#module-organization)
5. [Single Responsibility](#single-responsibility)
6. [Feature Modules](#feature-modules)

---

## LIFT Principle

The Angular style guide recommends structuring the application so you can:

| Letter | Meaning | Description |
|--------|---------|-------------|
| **L** | Locate | Quickly locate code |
| **I** | Identify | Identify what a file contains at a glance |
| **F** | Flat | Keep a flat structure as long as possible |
| **T** | Try to be DRY | Don't Repeat Yourself |

### Locate
- Structure the project so files are intuitive to find
- Use descriptive folder names that match features

### Identify
- Name files so their contents are immediately obvious
- Use consistent naming patterns across the codebase

### Flat
- Keep folder structure flat as long as practical
- Create subfolders when a folder reaches 7+ files
- Split when navigation becomes difficult

### Try to be DRY
- Avoid redundant code
- But don't sacrifice readability for DRY

---

## Directory Structure

### Canonical Structure (Angular 13/14)

```
project-root/
├── src/
│   ├── app/
│   │   ├── core/                    # Singleton services, guards, interceptors
│   │   │   ├── guards/
│   │   │   ├── interceptors/
│   │   │   ├── services/
│   │   │   └── core.module.ts
│   │   │
│   │   ├── shared/                  # Shared components, directives, pipes
│   │   │   ├── components/
│   │   │   ├── directives/
│   │   │   ├── pipes/
│   │   │   └── shared.module.ts
│   │   │
│   │   ├── features/                # Feature modules (lazy-loaded)
│   │   │   ├── feature-a/
│   │   │   │   ├── components/
│   │   │   │   ├── services/
│   │   │   │   ├── models/
│   │   │   │   ├── feature-a.component.ts
│   │   │   │   ├── feature-a.component.html
│   │   │   │   ├── feature-a.component.scss
│   │   │   │   ├── feature-a.module.ts
│   │   │   │   └── feature-a-routing.module.ts
│   │   │   │
│   │   │   └── feature-b/
│   │   │       └── ...
│   │   │
│   │   ├── app.component.ts
│   │   ├── app.component.html
│   │   ├── app.component.scss
│   │   ├── app.module.ts
│   │   └── app-routing.module.ts
│   │
│   ├── assets/                      # Static assets (images, fonts, etc.)
│   ├── environments/                # Environment configurations
│   ├── styles/                      # Global styles
│   ├── index.html
│   ├── main.ts
│   └── styles.scss
│
├── angular.json
├── package.json
├── tsconfig.json
└── ...
```

### Key Principles

#### 1. Feature-Based Organization (NOT Type-Based)

**DO organize by feature:**
```
src/app/
├── users/
│   ├── user-list.component.ts
│   ├── user-detail.component.ts
│   └── user.service.ts
├── products/
│   ├── product-list.component.ts
│   └── product.service.ts
```

**DON'T organize by type:**
```
src/app/
├── components/          # AVOID
│   ├── user-list.component.ts
│   └── product-list.component.ts
├── services/            # AVOID
│   ├── user.service.ts
│   └── product.service.ts
```

#### 2. Flat Structure Until Needed

Keep directories flat until they contain ~7+ files, then create subfolders.

#### 3. Co-locate Related Files

Keep component files together:
```
user-profile/
├── user-profile.component.ts
├── user-profile.component.html
├── user-profile.component.scss
└── user-profile.component.spec.ts
```

---

## File Naming Conventions

### Pattern: `feature.type.ts`

| Type | Pattern | Example |
|------|---------|---------|
| Component | `name.component.ts` | `user-list.component.ts` |
| Service | `name.service.ts` | `user.service.ts` |
| Module | `name.module.ts` | `user.module.ts` |
| Directive | `name.directive.ts` | `highlight.directive.ts` |
| Pipe | `name.pipe.ts` | `currency-format.pipe.ts` |
| Guard | `name.guard.ts` | `auth.guard.ts` |
| Interceptor | `name.interceptor.ts` | `error.interceptor.ts` |
| Resolver | `name.resolver.ts` | `user.resolver.ts` |
| Model/Interface | `name.model.ts` or `name.interface.ts` | `user.model.ts` |
| Routing Module | `name-routing.module.ts` | `user-routing.module.ts` |

### Word Separation

- Use **hyphens** (`-`) to separate words in filenames
- Use **PascalCase** for class names
- Use **camelCase** for method and property names

| Class Name | Filename |
|------------|----------|
| `UserProfileComponent` | `user-profile.component.ts` |
| `AuthGuard` | `auth.guard.ts` |
| `DataTransformPipe` | `data-transform.pipe.ts` |

### Spec Files

Place test files next to the code they test:
```
user.service.ts
user.service.spec.ts
```

---

## Module Organization

### Core Module

**Purpose**: Singleton services used app-wide

**Contains**:
- Authentication services
- HTTP interceptors
- Global guards
- App-wide singleton services

**Rules**:
- Import ONLY in `AppModule`
- Services should use `providedIn: 'root'` (Angular 6+)
- Throw error if imported elsewhere

```typescript
// core.module.ts
@NgModule({
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true }
  ]
})
export class CoreModule {
  constructor(@Optional() @SkipSelf() parentModule: CoreModule) {
    if (parentModule) {
      throw new Error('CoreModule is already loaded. Import it in AppModule only.');
    }
  }
}
```

### Shared Module

**Purpose**: Common components, directives, and pipes

**Contains**:
- Reusable UI components
- Common directives
- Common pipes
- Third-party module re-exports (CommonModule, FormsModule, etc.)

**Rules**:
- NO services (use Core or Feature modules)
- Import in any feature module that needs it
- Export everything that should be shared

```typescript
// shared.module.ts
@NgModule({
  imports: [CommonModule, FormsModule],
  declarations: [SpinnerComponent, HighlightDirective, TruncatePipe],
  exports: [
    CommonModule,
    FormsModule,
    SpinnerComponent,
    HighlightDirective,
    TruncatePipe
  ]
})
export class SharedModule {}
```

### Feature Modules

**Purpose**: Encapsulate a specific feature/domain

**Contains**:
- Feature-specific components
- Feature-specific services
- Feature-specific routing

**Rules**:
- Lazy load when possible
- Import SharedModule if needed
- Keep feature self-contained

---

## Single Responsibility

### One Thing Per File

Each file should have a single responsibility:
- One component per file
- One service per file
- One directive per file
- One pipe per file

### Small, Focused Functions

- Functions should do one thing
- Keep functions under 75 lines (guideline)
- Extract complex logic into separate functions

### Component Responsibilities

Components should:
- Handle view logic only
- Delegate data access to services
- Delegate complex logic to services

---

## Feature Modules

### Lazy Loading Structure

```
features/
└── admin/
    ├── admin.module.ts
    ├── admin-routing.module.ts
    ├── admin.component.ts
    ├── admin.component.html
    ├── dashboard/
    │   ├── dashboard.component.ts
    │   └── dashboard.component.html
    └── users/
        ├── user-list.component.ts
        └── user-edit.component.ts
```

### Routing Module Pattern

Each feature should have its own routing module:

```typescript
// admin-routing.module.ts
const routes: Routes = [
  {
    path: '',
    component: AdminComponent,
    children: [
      { path: 'dashboard', component: DashboardComponent },
      { path: 'users', component: UserListComponent }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdminRoutingModule {}
```

---

## Angular 14 Standalone Components

Angular 14 introduced standalone components as an alternative to NgModules.

### Standalone Structure

```
features/
└── user-profile/
    ├── user-profile.component.ts    # standalone: true
    ├── user-profile.component.html
    └── user-profile.component.scss
```

### Standalone Component Example

```typescript
@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './user-profile.component.html'
})
export class UserProfileComponent {}
```

### Lazy Loading Standalone Components

```typescript
// app-routing.module.ts
{
  path: 'profile',
  loadComponent: () => import('./features/user-profile/user-profile.component')
    .then(m => m.UserProfileComponent)
}
```

---

## References

- [Angular Style Guide (current)](https://angular.dev/style-guide)
- [Angular v17 Style Guide (legacy)](https://v17.angular.io/guide/styleguide)
- [Angular File Structure](https://angular.dev/reference/configs/file-structure)
- [John Papa's Angular Style Guide](https://github.com/johnpapa/angular-styleguide)

---

## See Also

- [STRUCTURE-AUDIT.md](./STRUCTURE-AUDIT.md) - Audit of this project's structure vs recommendations
