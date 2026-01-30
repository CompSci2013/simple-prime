# Angular 14 to Angular 15 Upgrade Guide

**Project:** simple-prime (Generic Discovery Framework)
**Upgrade Date:** 2026-01-30
**Previous Version:** Angular 14.3.0
**New Version:** Angular 15.2.10

---

## Table of Contents

1. [Overview](#overview)
2. [Package Updates](#package-updates)
3. [Configuration Changes](#configuration-changes)
4. [Code Changes](#code-changes)
5. [Angular 15 Idioms Adopted](#angular-15-idioms-adopted)
6. [Deprecated Items Removed](#deprecated-items-removed)
7. [Build Verification](#build-verification)
8. [Migration Checklist](#migration-checklist)

---

## Overview

This document describes the upgrade of the simple-prime frontend application from Angular 14 to Angular 15. The project was already using standalone components (introduced in Angular 14), which made the upgrade straightforward. The primary changes involved updating to Angular 15's new provider functions and removing deprecated module-based patterns.

### Why Upgrade to Angular 15?

1. **Standalone APIs Stabilized** - Angular 15 marks standalone components, directives, and pipes as stable
2. **New Provider Functions** - `provideRouter()`, `provideHttpClient()`, `provideAnimations()` replace module imports
3. **Improved Tree-Shaking** - New provider functions enable better dead code elimination
4. **ES2022 Support** - Full support for ES2022 features including top-level await
5. **Zone.js Simplification** - Direct zone.js configuration in angular.json
6. **Performance Improvements** - Faster builds and smaller bundles

---

## Package Updates

### Dependencies

| Package | Old Version | New Version | Notes |
|---------|-------------|-------------|-------|
| `@angular/animations` | ^14.3.0 | ^15.2.10 | |
| `@angular/cdk` | ^14.2.7 | ^15.2.9 | Angular CDK for PrimeNG |
| `@angular/common` | ^14.3.0 | ^15.2.10 | |
| `@angular/compiler` | ^14.3.0 | ^15.2.10 | |
| `@angular/core` | ^14.3.0 | ^15.2.10 | |
| `@angular/forms` | ^14.3.0 | ^15.2.10 | |
| `@angular/platform-browser` | ^14.3.0 | ^15.2.10 | |
| `@angular/platform-browser-dynamic` | ^14.3.0 | ^15.2.10 | |
| `@angular/router` | ^14.3.0 | ^15.2.10 | |
| `primeng` | ^14.2.3 | ^15.4.1 | PrimeNG UI components |
| `rxjs` | ^7.5.7 | ^7.8.1 | Minor update |
| `tslib` | ^2.3.0 | ^2.6.2 | TypeScript helpers |
| `zone.js` | ~0.11.8 | ~0.12.0 | Zone.js for change detection |

### Dev Dependencies

| Package | Old Version | New Version | Notes |
|---------|-------------|-------------|-------|
| `@angular-devkit/build-angular` | ^14.2.13 | ^15.2.11 | Angular CLI build tools |
| `@angular/cli` | ~14.2.13 | ~15.2.11 | Angular CLI |
| `@angular/compiler-cli` | ^14.3.0 | ^15.2.10 | AOT compiler |
| `typescript` | ~4.8.4 | ~4.9.5 | TypeScript compiler |

### package.json Version

```json
{
  "version": "15.0.0"
}
```

---

## Configuration Changes

### angular.json

#### Polyfills Configuration

**Before (Angular 14):**
```json
{
  "polyfills": "src/polyfills.ts"
}
```

**After (Angular 15):**
```json
{
  "polyfills": [
    "zone.js"
  ]
}
```

**Why:** Angular 15 supports specifying polyfills directly as an array in angular.json, eliminating the need for a separate polyfills.ts file. This simplifies configuration and makes the zone.js dependency explicit.

### tsconfig.json

#### ECMAScript Target

**Before (Angular 14):**
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ES2020",
    "lib": ["ES2020", "dom"]
  }
}
```

**After (Angular 15):**
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "lib": ["ES2022", "dom"]
  }
}
```

**Why:** Angular 15 fully supports ES2022, enabling modern JavaScript features like:
- Class static initialization blocks
- Top-level await (in modules)
- `.at()` method on arrays and strings
- `Object.hasOwn()` method
- Error cause chaining

---

## Code Changes

### app.config.ts - Provider Migration

This is the most significant code change in the upgrade. Angular 15 introduces new standalone provider functions that replace the older module-based approach.

#### Before (Angular 14)

```typescript
import { ErrorHandler, importProvidersFrom, Injector } from '@angular/core';
import { RouterModule } from '@angular/router';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

export const appConfig = {
  providers: [
    importProvidersFrom(
      RouterModule.forRoot(routes),
      HttpClientModule,
      BrowserAnimationsModule
    ),
    {
      provide: HTTP_INTERCEPTORS,
      useClass: HttpErrorInterceptor,
      multi: true
    },
    // ... other providers
  ]
};
```

#### After (Angular 15)

```typescript
import { ErrorHandler, Injector } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptorsFromDi, HTTP_INTERCEPTORS } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';

export const appConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptorsFromDi()),
    provideAnimations(),
    {
      provide: HTTP_INTERCEPTORS,
      useClass: HttpErrorInterceptor,
      multi: true
    },
    // ... other providers
  ]
};
```

#### Provider Function Mapping

| Angular 14 (Module-based) | Angular 15 (Standalone) |
|---------------------------|-------------------------|
| `importProvidersFrom(RouterModule.forRoot(routes))` | `provideRouter(routes)` |
| `importProvidersFrom(HttpClientModule)` | `provideHttpClient()` |
| `importProvidersFrom(BrowserAnimationsModule)` | `provideAnimations()` |
| `importProvidersFrom(NoopAnimationsModule)` | `provideNoopAnimations()` |

### File Deletions

#### src/polyfills.ts - Removed

**Before:**
```typescript
// src/polyfills.ts
import 'zone.js';
```

**After:** File deleted. Zone.js is now configured directly in angular.json.

---

## Angular 15 Idioms Adopted

### 1. Standalone Provider Functions

The new provider functions are the recommended way to configure application-wide services in Angular 15+.

```typescript
// Router configuration
provideRouter(routes)

// HTTP client with DI-based interceptors
provideHttpClient(withInterceptorsFromDi())

// Animations
provideAnimations()
```

### 2. Functional HTTP Interceptors (Available but not adopted)

Angular 15 introduces functional interceptors as an alternative to class-based interceptors. This project continues using class-based interceptors with `withInterceptorsFromDi()` for backward compatibility.

**Functional interceptor pattern (for reference):**
```typescript
// New Angular 15 functional interceptor style
export const loggingInterceptor: HttpInterceptorFn = (req, next) => {
  console.log('Request:', req.url);
  return next(req);
};

// Usage
provideHttpClient(withInterceptors([loggingInterceptor]))
```

**This project's approach (class-based, preserved):**
```typescript
// Existing class-based interceptor preserved
@Injectable()
export class HttpErrorInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // ... implementation
  }
}

// Usage with DI compatibility
provideHttpClient(withInterceptorsFromDi())
```

### 3. Direct Zone.js Configuration

Angular 15 allows zone.js to be specified directly in angular.json rather than through a polyfills file.

```json
{
  "polyfills": ["zone.js"]
}
```

### 4. ES2022 Target

The upgrade adopts ES2022 as the compilation target, enabling modern JavaScript features while maintaining browser compatibility through the Angular build system.

### 5. Standalone Components (Already in use)

This project was already using standalone components from Angular 14. All 18 components have `standalone: true`:

```typescript
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, TieredMenuModule, ToastModule],
  templateUrl: './app.component.html'
})
export class AppComponent { }
```

---

## Deprecated Items Removed

### Summary of Removed Deprecations

| Item | Type | Replacement |
|------|------|-------------|
| `importProvidersFrom()` | Function | `provideRouter()`, `provideHttpClient()`, `provideAnimations()` |
| `RouterModule.forRoot()` | Module method | `provideRouter(routes)` |
| `HttpClientModule` | NgModule | `provideHttpClient()` |
| `BrowserAnimationsModule` | NgModule | `provideAnimations()` |
| `src/polyfills.ts` | File | Direct zone.js in angular.json |

### Detailed Deprecation Notes

#### 1. `importProvidersFrom()` - Deprecated Pattern

**Status:** Still functional but deprecated in favor of standalone provider functions.

**Why deprecated:** The `importProvidersFrom()` function was a bridge to allow NgModule-based libraries to work with standalone applications. Angular 15+ provides native standalone alternatives.

**Migration:**
```typescript
// Deprecated
importProvidersFrom(RouterModule.forRoot(routes))

// Replacement
provideRouter(routes)
```

#### 2. `HttpClientModule` - NgModule Pattern

**Status:** Still functional but replaced by functional alternative.

**Why deprecated:** NgModules add complexity and hurt tree-shaking. The new `provideHttpClient()` is more explicit and tree-shakeable.

**Migration:**
```typescript
// Deprecated
importProvidersFrom(HttpClientModule)

// Replacement
provideHttpClient()

// With DI-based interceptors (for existing interceptor classes)
provideHttpClient(withInterceptorsFromDi())

// With functional interceptors (new pattern)
provideHttpClient(withInterceptors([myInterceptorFn]))
```

#### 3. `BrowserAnimationsModule` - NgModule Pattern

**Status:** Still functional but replaced by functional alternative.

**Migration:**
```typescript
// Deprecated
importProvidersFrom(BrowserAnimationsModule)

// Replacement
provideAnimations()

// For apps that don't need animations
provideNoopAnimations()
```

#### 4. Polyfills File

**Status:** No longer required for zone.js.

**Why deprecated:** Angular 15 simplifies polyfill configuration by allowing direct specification in angular.json.

---

## Build Verification

### Build Output

```bash
$ npm run build

> frontend@15.0.0 build
> ng build

Initial Chunk Files           | Names         |  Raw Size | Transfer Size
main.1ef033e037a9be90.js      | main          |   4.96 MB |       1.14 MB
styles.93725a90ef486453.css   | styles        | 234.03 kB |      23.72 kB
polyfills.48032dd0403ca3fa.js | polyfills     |  33.09 kB |      10.65 kB
runtime.9e9b05b5d5cea1c6.js   | runtime       |   2.94 kB |       1.41 kB

Initial Total                 |               |   5.22 MB |       1.17 MB

Build at: 2026-01-30 - Time: 6973ms
```

### Warnings (Expected)

The build produces warnings about unused components. These are expected and indicate tree-shaking is working:

```
Warning: src/framework/components/basic-results-table/basic-results-table.component.ts
is part of the TypeScript compilation but it's unused.
```

These components are part of the framework but not currently imported in the application routes.

---

## Migration Checklist

### Pre-Migration

- [x] Backup current codebase (git branch)
- [x] Review Angular 15 release notes
- [x] Verify all components use `standalone: true`
- [x] Identify deprecated patterns in use

### Package Updates

- [x] Update `package.json` with Angular 15 versions
- [x] Update PrimeNG to compatible version (15.x)
- [x] Update TypeScript to 4.9.x
- [x] Update zone.js to 0.12.x
- [x] Remove `package-lock.json`
- [x] Run `npm install`

### Configuration Updates

- [x] Update `angular.json` polyfills to array format
- [x] Update `tsconfig.json` to ES2022 target
- [x] Delete `src/polyfills.ts`

### Code Updates

- [x] Replace `importProvidersFrom()` with standalone providers
- [x] Replace `RouterModule.forRoot()` with `provideRouter()`
- [x] Replace `HttpClientModule` with `provideHttpClient()`
- [x] Replace `BrowserAnimationsModule` with `provideAnimations()`
- [x] Update JSDoc comments to reflect Angular 15

### Verification

- [x] Run `npm run build` - No errors
- [x] Verify application loads in browser
- [x] Test API connectivity
- [x] Verify charts render correctly

---

## References

- [Angular 15 Release Notes](https://blog.angular.io/angular-v15-is-now-available-df7be7f2f4c8)
- [Standalone Components Guide](https://angular.io/guide/standalone-components)
- [HTTP Client Configuration](https://angular.io/guide/http-setup-server-communication)
- [Router Configuration](https://angular.io/guide/router)

---

## Appendix: Full File Diffs

### package.json Changes

```diff
-  "version": "14.0.0",
+  "version": "15.0.0",
   "dependencies": {
-    "@angular/animations": "^14.3.0",
-    "@angular/cdk": "^14.2.7",
-    "@angular/common": "^14.3.0",
-    "@angular/compiler": "^14.3.0",
-    "@angular/core": "^14.3.0",
-    "@angular/forms": "^14.3.0",
-    "@angular/platform-browser": "^14.3.0",
-    "@angular/platform-browser-dynamic": "^14.3.0",
-    "@angular/router": "^14.3.0",
+    "@angular/animations": "^15.2.10",
+    "@angular/cdk": "^15.2.9",
+    "@angular/common": "^15.2.10",
+    "@angular/compiler": "^15.2.10",
+    "@angular/core": "^15.2.10",
+    "@angular/forms": "^15.2.10",
+    "@angular/platform-browser": "^15.2.10",
+    "@angular/platform-browser-dynamic": "^15.2.10",
+    "@angular/router": "^15.2.10",
-    "primeng": "^14.2.3",
-    "rxjs": "^7.5.7",
-    "tslib": "^2.3.0",
-    "zone.js": "~0.11.8"
+    "primeng": "^15.4.1",
+    "rxjs": "^7.8.1",
+    "tslib": "^2.6.2",
+    "zone.js": "~0.12.0"
   },
   "devDependencies": {
-    "@angular-devkit/build-angular": "^14.2.13",
-    "@angular/cli": "~14.2.13",
-    "@angular/compiler-cli": "^14.3.0",
+    "@angular-devkit/build-angular": "^15.2.11",
+    "@angular/cli": "~15.2.11",
+    "@angular/compiler-cli": "^15.2.10",
-    "typescript": "~4.8.4"
+    "typescript": "~4.9.5"
   }
```

### app.config.ts Changes

```diff
-import { ErrorHandler, importProvidersFrom, Injector } from '@angular/core';
-import { RouterModule } from '@angular/router';
-import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
-import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
+import { ErrorHandler, Injector } from '@angular/core';
+import { provideRouter } from '@angular/router';
+import { provideHttpClient, withInterceptorsFromDi, HTTP_INTERCEPTORS } from '@angular/common/http';
+import { provideAnimations } from '@angular/platform-browser/animations';

 export const appConfig = {
   providers: [
-    importProvidersFrom(
-      RouterModule.forRoot(routes),
-      HttpClientModule,
-      BrowserAnimationsModule
-    ),
+    provideRouter(routes),
+    provideHttpClient(withInterceptorsFromDi()),
+    provideAnimations(),
     // ... rest unchanged
   ]
 };
```

### angular.json Changes

```diff
-            "polyfills": "src/polyfills.ts",
+            "polyfills": [
+              "zone.js"
+            ],
```

### tsconfig.json Changes

```diff
-    "target": "ES2020",
-    "module": "ES2020",
-    "lib": [
-      "ES2020",
-      "dom"
-    ],
+    "target": "ES2022",
+    "module": "ES2022",
+    "lib": [
+      "ES2022",
+      "dom"
+    ],
```
