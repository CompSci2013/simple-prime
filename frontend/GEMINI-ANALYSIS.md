# Gemini Analysis: Angular 21 Upgrade Verification

**Date**: January 1, 2026
**Version**: Angular 21.0.0

## Executive Summary

The codebase has been upgraded to Angular 21.0.0, but significant "Old Patterns" remain. While the core framework (`framework/`) has adopted some modern practices (Signals in services), the feature layers and configuration largely reflect Angular 14-16 patterns.

**Critical Issue**: The application's HTTP Error Interceptor is **orphaned and inactive**.

## Verification Checklist

| Area | Status | Findings |
|------|--------|----------|
| **Core Version** | ✅ **Pass** | `package.json` confirms Angular 21, PrimeNG 21, TypeScript 5.9. |
| **Standalone** | ✅ **Pass** | All components checked are `standalone: true`. |
| **Control Flow** | ✅ **Pass** | **0** instances of `*ngIf`/`*ngFor`. Migration to `@if`/`@for` is complete. |
| **Signals (State)** | ✅ **Pass** | `ResourceManagementService` correctly uses Signals. |
| **Signals (IO)** | ❌ **Fail** | **18** instances of `@Input()`, **7** `@Output()`, **5** `@ViewChild()`. No usage of `input()`, `output()`, or `viewChild()`. |
| **Dependency Injection** | ⚠️ **Mixed** | **34** files use `constructor()` injection. `inject()` is only used in 2 core files. |
| **Interceptors** | ⛔ **Critical** | `HttpErrorInterceptor` is defined (class-based) but **NOT provided** in `app.config.ts`. |
| **Build System** | ❌ **Fail** | Uses legacy `browser` builder (Webpack) instead of `application` (esbuild). |
| **Lazy Loading** | ❌ **Fail** | Routes are eagerly loaded (identified by Claude). |
| **Polyfills** | ❌ **Fail** | `polyfills.ts` is used instead of inline config (identified by Claude). |

## Detailed Findings

### 1. Critical: Orphaned HttpErrorInterceptor
**File**: `src/framework/services/http-error.interceptor.ts`
**Issue**: The interceptor class exists but is not provided. `app.config.ts` calls `provideHttpClient()` without `withInterceptors()` or `withInterceptorsFromDi()`.
**Impact**: Global error handling (retries, logging, formatting) is currently **disabled**.
**Recommendation**: Convert to Functional Interceptor (`HttpInterceptorFn`) and register in `app.config.ts`.

```typescript
// Current (Orphaned Class)
export class HttpErrorInterceptor implements HttpInterceptor { ... }

// Recommended (Functional)
export const httpErrorInterceptor: HttpInterceptorFn = (req, next) => { ... };
// In app.config.ts:
provideHttpClient(withInterceptors([httpErrorInterceptor]))
```

### 2. Build System (Legacy Builder)
**File**: `angular.json`
**Issue**: Uses `@angular-devkit/build-angular:browser`.
**Recommendation**: Switch to `@angular-devkit/build-angular:application` for faster builds (esbuild) and proper SSR support (if needed later).

### 3. Component Inputs/Queries (Legacy Decorators)
**Files**: `KnowledgeGraphComponent`, `BasePickerComponent`, `BaseChartComponent`, etc.
**Issue**: Widespread usage of legacy decorators.
**Recommendation**: Systematic migration to Signal Inputs.

```typescript
// Current
@Input() graphData!: KnowledgeGraphData;
@ViewChild('container') containerRef!: ElementRef;

// Recommended
graphData = input.required<KnowledgeGraphData>();
containerRef = viewChild.required<ElementRef>('container');
```

### 4. Dependency Injection (Legacy Constructor)
**Files**: Most feature components and services (e.g., `UrlStateService`, `PhysicsComponent`).
**Issue**: Constructor-based DI is verbose and less flexible than `inject()`.
**Recommendation**: Adopt `inject()` pattern for consistency with `ResourceManagementService`.

```typescript
// Current
constructor(private router: Router) {}

// Recommended
private router = inject(Router);
```

### 5. Legacy Framework Module
**File**: `src/framework/framework.module.ts`
**Issue**: The `FrameworkModule` is an `NgModule` that re-exports standalone components.
**Analysis**: While functional, this is an "intermediate" pattern. In a fully modern Angular app, feature components should import what they need directly (or use a barrel file), rather than importing a heavy Module.

## Action Plan

1.  **Fix Interceptor**: Convert `HttpErrorInterceptor` to a function and wire it up. (High Priority)
2.  **Update Builder**: specific `angular.json` migration.
3.  **Modernize IO**: Bulk refactor of `@Input`/`@Output` to Signals.
4.  **Modernize DI**: Bulk refactor of `constructor` to `inject()`.
5.  **Lazy Load Routes**: Convert `app.routes.ts` to use `loadComponent`.
6.  **Inline Polyfills**: Remove `polyfills.ts`.
