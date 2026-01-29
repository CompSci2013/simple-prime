# Refactoring for Scalability: Lazy Loading Implementation Guide

**Document ID**: `08-LAZY-LOADING-REFACTOR-GUIDE.md`
**Status**: Proposed
**Author**: Gemini

---

## 1. Overview & Goal

This document outlines the strategy for refactoring the Generic Prime application from an eager-loading to a lazy-loading module strategy.

The primary goal is to improve initial application performance (Time to Interactive) and create a more scalable architecture that supports future growth in features and code complexity.

## 2. Background

The current architecture is **eager-loaded**. All components and services are declared in the root `AppModule` and included in the initial JavaScript bundle downloaded by the user.

While this is simple and effective for the current application size, it does not scale well. As new features are added, the initial bundle size will grow, negatively impacting user-perceived performance.

## 3. Important Distinction: Code vs. Data Loading

This refactor addresses **Code Loading**, not data loading.

- **Code Loading (This Refactor):** Refers to how Angular loads the application's JavaScript code. By splitting code into lazy-loaded feature modules, we reduce the size of the initial download.
- **Data Loading (Handled Correctly):** Refers to how the application fetches data from the backend API. The application already uses an excellent server-side pagination strategy (`[lazy]="true"` on tables) to handle large datasets efficiently. **This data loading mechanism should not be changed.**

## 4. Action Plan: Refactoring to Lazy Loading

The refactor will involve creating dedicated feature modules for the main application routes and updating the router to load them on demand.

### Step 1: Create a `DiscoverModule`

This module will encapsulate all components related to the main `/discover` feature.

1.  **Create the file:** `frontend/src/app/features/discover/discover.module.ts`
2.  **Module Definition:**
    ```typescript
    import { NgModule } from '@angular/core';
    import { CommonModule } from '@angular/common';
    import { RouterModule, Routes } from '@angular/router';
    import { FormsModule } from '@angular/forms';
    import { DragDropModule } from '@angular/cdk/drag-drop';

    import { PrimengModule } from '../../primeng.module';
    import { FrameworkModule } from '../../../framework/framework.module';

    import { DiscoverComponent } from './discover.component';
    // Import child panel components if they are created
    // import { QueryControlComponent } from './panels/query-control/query-control.component';
    // ... etc.

    const routes: Routes = [
      { path: '', component: DiscoverComponent }
    ];

    @NgModule({
      declarations: [
        DiscoverComponent,
        // QueryControlComponent, ...etc
      ],
      imports: [
        CommonModule,
        FormsModule,
        DragDropModule,
        PrimengModule,
        FrameworkModule,
        RouterModule.forChild(routes)
      ]
    })
    export class DiscoverModule { }
    ```
    *Note: The panel components like `QueryControlComponent` are currently part of the `FrameworkModule`. For full encapsulation, they could be moved here, but for a first pass, importing `FrameworkModule` is sufficient.*

### Step 2: Create a `ReportModule`

This module will encapsulate the `/report` feature.

1.  **Create the file:** `frontend/src/app/features/report/report.module.ts`
2.  **Module Definition:**
    ```typescript
    import { NgModule } from '@angular/core';
    import { CommonModule } from '@angular/common';
    import { RouterModule, Routes } from '@angular/router';

    import { ReportComponent } from './report.component';

    const routes: Routes = [
      { path: '', component: ReportComponent }
    ];

    @NgModule({
      declarations: [ReportComponent],
      imports: [
        CommonModule,
        RouterModule.forChild(routes)
      ]
    })
    export class ReportModule { }
    ```

### Step 3: Update `AppModule`

With the components now declared in feature modules, they must be removed from the root `AppModule`.

**File to Edit:** `frontend/src/app/app.module.ts`

**Change:**
- Remove `DiscoverComponent` and `ReportComponent` from the `declarations` array.
- Remove their corresponding import statements.

```typescript
// Before
@NgModule({
  declarations: [
    AppComponent,
    DiscoverComponent, // <-- REMOVE
    PanelPopoutComponent,
    ReportComponent   // <-- REMOVE
  ],
  // ...
})

// After
@NgModule({
  declarations: [
    AppComponent,
    PanelPopoutComponent // Keep this here as it's a special case
  ],
  // ...
})
```

### Step 4: Update `AppRoutingModule` to Lazy Load

Modify the main router to use `loadChildren` for the `/discover` and `/report` routes.

**File to Edit:** `frontend/src/app/app-routing.module.ts`

**Change:**
- Update the routes array to point to the new modules.

```typescript
// Before
const routes: Routes = [
  { path: '', redirectTo: '/discover', pathMatch: 'full' },
  { path: 'discover', component: DiscoverComponent },
  { path: 'report', component: ReportComponent },
  { path: 'panel/:gridId/:panelId/:type', component: PanelPopoutComponent }
];

// After
const routes: Routes = [
  { path: '', redirectTo: '/discover', pathMatch: 'full' },
  {
    path: 'discover',
    loadChildren: () => import('./features/discover/discover.module').then(m => m.DiscoverModule)
  },
  {
    path: 'report',
    loadChildren: () => import('./features/report/report.module').then(m => m.ReportModule)
  },
  { path: 'panel/:gridId/:panelId/:type', component: PanelPopoutComponent }
];
```

## 5. Expected Outcome

- **Smaller Initial Bundle:** The `main.js` file will be significantly smaller, containing only the application shell.
- **Faster Initial Load:** Users will experience a faster Time to Interactive (TTI) because the browser has less JavaScript to download and parse on the first visit.
- **Improved Scalability:** The architecture will be better prepared for future growth. Any new top-level feature can be added as a self-contained, lazy-loaded module without impacting the performance of existing features.

## 6. Data Handling Strategy (No Change)

To reiterate, this refactor does not and should not alter the existing data-handling strategy. The use of server-side pagination via `[lazy]="true"` tables is correct and should be maintained to handle large datasets. Future scalability for data presentation can be achieved by implementing **virtual scrolling** as a separate task.
