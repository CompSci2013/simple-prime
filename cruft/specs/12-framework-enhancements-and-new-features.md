
# Spec & Design: Framework Enhancements & New Features

**Version**: 1.0
**Date**: 2025-12-06
**Author**: Gemini

## 1. Overview

This document outlines the specification and design for a set of proposed enhancements to the Generic Prime framework. The goal of these improvements is to increase the application's robustness, enhance the user experience, add critical new functionality, and improve performance.

The proposed enhancements are:

1.  **Graceful Backend Failure Handling**: Introduce component-level error boundaries.
2.  **Enhanced "No Results" UI**: Provide clear feedback when a query yields no data.
3.  **Data Export Implementation**: Complete the existing data export feature.
4.  **User Preferences & Saved Filters**: Allow users to save settings and filter sets.
5.  **Authentication & Authorization**: Add user login and role-based access control.
6.  **Virtual Scrolling for Large Datasets**: Improve performance for large tables.
7.  **UI Loading Skeletons**: Enhance the perceived performance during data loading.

---

## 2. Graceful Backend Failure Handling

### 2.1. Problem Statement

Currently, when a backend API call fails, the global `HttpErrorInterceptor` catches the error and the `ErrorNotificationService` displays a toast message. However, the UI component that initiated the request (e.g., `ResultsTableComponent`) is left in a loading or empty state, which provides a poor user experience.

### 2.2. Proposed Solution

We will create a new reusable `ErrorBoundaryComponent` that can wrap any data-driven component. This component will subscribe to the `error$` observable from the `ResourceManagementService` and display a user-friendly error message and a "Retry" button if an error is detected.

### 2.3. Technical Details

**1. `ErrorBoundaryComponent` Creation:**

*   **File:** `frontend/src/framework/components/error-boundary/error-boundary.component.ts`
*   **Inputs:**
    *   `error$: Observable<Error | null>`: The error stream to monitor.
    *   `loading$: Observable<boolean>`: The loading stream to prevent showing errors while loading.
*   **Outputs:**
    *   `retry`: An `EventEmitter` that fires when the user clicks the "Retry" button.
*   **Logic:**
    *   The component will have two content projection slots: `[content]` for the main content and `[error]` for a custom error template.
    *   It will use `*ngIf` to show the main content if there is no error, and the error template if an error is present and loading is false.
    *   It will provide a default error template with a generic message and a retry button.

**2. `ResourceManagementService` Enhancement:**

*   Add a `refresh()` method that re-triggers the last data fetch. The `ResultsTableComponent` already has a `refresh` method that does this, so we will ensure this pattern is robust.

**3. Component Integration:**

*   Modify the templates of `ResultsTableComponent`, `StatisticsPanelComponent`, and `BasePickerComponent` to wrap their primary content with the new `app-error-boundary` component.
*   The `error$` observable from the `ResourceManagementService` will be passed to the error boundary.
*   The `(retry)` event from the error boundary will be wired to the `resourceService.refresh()` method.

**Example Usage in `ResultsTableComponent` template:**

```html
<app-error-boundary [error$]="error$" [loading$]="loading$" (retry)="refresh()">
  <div content>
    <!-- Existing p-table and other content goes here -->
    <p-table ...></p-table>
  </div>
</app-error-boundary>
```

### 2.4. Impact Assessment

*   **UX:** Massively improved. Users will see contextual error messages instead of a broken or empty UI.
*   **DX:** Provides a standardized, reusable way to handle API errors at the component level.
*   **Performance:** Negligible impact.

---

## 3. Enhanced "No Results" UI

### 3.1. Problem Statement

When a query returns no data, the results table is simply empty. This is ambiguous and doesn't guide the user on what to do next.

### 3.2. Proposed Solution

We will enhance the `ResultsTableComponent` to display a dedicated "No Results" message when the data source is empty and the application is not in a loading or error state.

### 3.3. Technical Details

*   **File to Modify:** `frontend/src/framework/components/results-table/results-table.component.html`
*   **Logic:**
    *   The `p-table` component in PrimeNG has a built-in template for handling empty states: `<ng-template pTemplate="emptymessage">`.
    *   We will use this template to display a message.
    *   The logic inside the template will differentiate between the initial loading state and a true "no results" state.

**Example Implementation:**

```html
<p-table [value]="results" ...>
  <!-- Column definitions -->
  ...
  <ng-template pTemplate="emptymessage" let-columns>
    <tr>
      <td [attr.colspan]="columns.length">
        <div *ngIf="!(loading$ | async) && !(error$ | async)">
          No results found for the selected criteria.
        </div>
        <div *ngIf="(loading$ | async)">
          Loading data...
        </div>
      </td>
    </tr>
  </ng-template>
</p-table>
```

### 3.4. Impact Assessment

*   **UX:** Provides clear, unambiguous feedback to the user.
*   **DX:** Simple change leveraging built-in features of the PrimeNG library.
*   **Performance:** No impact.

---

## 4. Data Export Implementation

### 4.1. Problem Statement

The domain configuration includes specifications for data export (CSV/Excel), but the functionality is not implemented in the UI.

### 4.2. Proposed Solution

We will add an "Export" button to the `ResultsTableComponent` that triggers a download of the currently filtered dataset. The export will respect the `export` feature flag and the column configuration from the `DomainConfig`.

### 4.3. Technical Details

**1. Library Installation:**

*   We will install `xlsx` for Excel export and rely on a simple manual serializer for CSV.
    ```bash
    npm install xlsx
    ```

**2. `ResultsTableComponent` Modifications:**

*   **File:** `frontend/src/framework/components/results-table/results-table.component.ts`
*   **UI:** Add a button group to the table's header toolbar. The "Export" button will be disabled if `domainConfig.features.export` is false.
*   **Logic:**
    *   Create an `exportData(format: 'csv' | 'excel')` method.
    *   This method will fetch the *entire* dataset for the current filters, not just the current page. This requires making a new API call with pagination disabled (or set to a very high limit).
    *   It will use the `domainConfig.tableConfig.exportConfig` to determine which columns to include.
    *   For CSV, it will manually build the CSV string and use a helper function to trigger a browser download.
    *   For Excel, it will use the `xlsx` library to create a worksheet and trigger a download.

**3. API Considerations:**

*   The backend API must support a way to fetch all results, bypassing pagination (e.g., a `size=-1` or a very large `size` parameter). The `AutomobileApiAdapter` will need to be updated to support this.

### 4.4. Impact Assessment

*   **UX:** Adds a highly requested and valuable feature for users who need to work with the data offline.
*   **DX:** Completes a half-implemented feature and provides a clear pattern for adding export functionality to other components.
*   **Performance:** The export action itself may be slow and memory-intensive for very large datasets, as it requires fetching all data. This should be communicated to the user with a loading indicator.

---

## 5. User Preferences & Saved Filters

### 5.1. Problem Statement

The application does not remember user-specific settings (like panel layouts) or allow users to save and reuse complex filter configurations.

### 5.2. Proposed Solution

We will create a new `UserPreferencesService` responsible for storing and retrieving user settings from the browser's `localStorage`. This service will manage saved filter sets and UI state like panel order and collapsed states.

### 5.3. Technical Details

**1. `UserPreferencesService` Creation:**

*   **File:** `frontend/src/framework/services/user-preferences.service.ts`
*   **Methods:**
    *   `saveSetting<T>(key: string, value: T): void`
    *   `getSetting<T>(key: string, defaultValue: T): T`
    *   `saveFilterSet(name: string, filters: TFilters): void`
    *   `getFilterSets(): { name: string, filters: TFilters }[]`
    *   `loadFilterSet(name: string): TFilters`
    *   `deleteFilterSet(name: string): void`

**2. `DiscoverComponent` Integration:**

*   Inject `UserPreferencesService`.
*   On `ngOnInit`, load the `panelOrder` and `collapsedPanels` from the service.
*   When the user reorders or collapses a panel, save the new state to the service.

**3. `QueryControlComponent` Integration:**

*   Add a new UI element (e.g., a dropdown with a "Save" button) to manage filter sets.
*   The dropdown will be populated by calling `userPreferencesService.getFilterSets()`.
*   When a user saves a filter set, the current filters from `ResourceManagementService` are passed to `userPreferencesService.saveFilterSet()`.
*   When a user loads a filter set, the component will call `urlStateService.setParams()` with the loaded filters.

### 5.4. Impact Assessment

*   **UX:** Significantly improves efficiency for repeat users.
*   **DX:** Centralizes user state management into a single, testable service.
*   **Performance:** Minimal impact, as it relies on fast `localStorage` access.

---

## 6. Authentication & Authorization

*This is a major epic and will be broken down into a simplified phase 1.*

### 6.1. Problem Statement

The application is entirely public. There is no concept of users, roles, or access control.

### 6.2. Proposed Solution (Phase 1)

We will introduce a mock authentication service and an `AuthGuard` to protect routes. This will lay the groundwork for a real authentication system without requiring a full backend implementation initially. We will control access based on a mock role stored in `localStorage`.

### 6.3. Technical Details

**1. `AuthService` Creation:**

*   **File:** `frontend/src/framework/auth/auth.service.ts`
*   **Logic:**
    *   Will not communicate with a backend in Phase 1.
    *   `login(username: string)`: For now, this will just store a mock user object with a role (e.g., `{ username: 'admin', role: 'admin' }`) in `localStorage`.
    *   `logout()`: Clears the user from `localStorage`.
    *   `isAuthenticated$`: An observable that emits `true` if a user is in `localStorage`.
    *   `hasRole(role: string)`: Checks if the current user has the specified role.

**2. `AuthGuard` Creation:**

*   **File:** `frontend/src/framework/auth/auth.guard.ts`
*   **Logic:** Implement `CanActivate`. It will use `AuthService` to check if the user is authenticated. If not, it will redirect to a new `/login` page.

**3. Route & Component Modifications:**

*   Create a simple `LoginComponent`.
*   Update `app-routing.module.ts` to protect the `/discover` route with the `AuthGuard`.
*   The `DomainConfigRegistry` will be enhanced to filter domains based on the user's role from `AuthService`.

### 6.4. Impact Assessment

*   **UX:** Introduces a login step, which adds friction but is necessary for security.
*   **DX:** Establishes the fundamental building blocks for security in the application.
*   **Architecture:** This is a significant but necessary architectural addition.

---

## 7. Virtual Scrolling for Large Datasets

### 7.1. Problem Statement

The `p-table` component currently uses pagination to handle large datasets. While effective, this UI pattern can feel clunky for very large result sets and requires users to click through pages. A smoother, continuous scrolling experience would improve usability and perceived performance.

### 7.2. Design Principle: A Configurable Choice of Lazy Loading UI

This feature is **not** about layering virtual scrolling on top of pagination. It is about making the `ResultsTableComponent` a configurable engine that can operate in one of two lazy-loading modes:

1.  **Pagination Mode (Default):** The table renders a paginator UI. User clicks on a page number trigger an `(onLazyLoad)` event to fetch the corresponding data chunk.
2.  **Virtual Scroll Mode (New):** The table renders a single, long scrollbar. As the user scrolls, the component automatically triggers an `(onLazyLoad)` event to fetch the necessary data chunks just-in-time.

The choice of which mode to use will be determined by a new boolean flag in the `TableConfig` of the domain configuration. This allows each domain to choose the best data-loading strategy for its specific needs without requiring any changes to the core framework component. The backend API does not need to change, as both modes rely on the same underlying pagination logic (fetching data in chunks).

### 7.3. Technical Details

**1. `TableConfig` Enhancement:**

The `TableConfig` interface will be updated to include optional properties for enabling and configuring virtual scrolling.

*   **File to Modify:** `frontend/src/framework/models/table-config.interface.ts`
*   **Excerpt Example:**
    ```typescript
    export interface TableConfig<TData> {
      // ... existing properties like tableId, dataKey, columns ...

      /**
       * If true, the table will use virtual scrolling instead of pagination.
       * Defaults to false.
       */
      virtualScroll?: boolean;

      /**
       * The height of the scrollable viewport. Must be set for virtual scrolling.
       * e.g., '70vh', '600px'.
       */
      scrollHeight?: string;

      /**
       * The number of rows to be rendered as a buffer for virtual scrolling.
       */
      virtualScrollBuffer?: number;
    }
    ```

**2. `ResultsTableComponent` Template Modification:**

The component's template will read the new `virtualScroll` flag from its domain configuration and conditionally set the appropriate properties on the `p-table` component.

*   **File to Modify:** `frontend/src/framework/components/results-table/results-table.component.html`
*   **Excerpt Example:**
    ```html
    <p-table
      [value]="results"
      [lazy]="true"
      (onLazyLoad)="onLazyLoad($event)"

      <!-- Conditionally enable EITHER pagination OR virtual scrolling -->
      [paginator]="!domainConfig.tableConfig.virtualScroll"
      [rows]="domainConfig.tableConfig.rows"

      [virtualScroll]="domainConfig.tableConfig.virtualScroll"
      [scrollHeight]="domainConfig.tableConfig.scrollHeight"
      [virtualScrollBuffer]="domainConfig.tableConfig.virtualScrollBuffer || domainConfig.tableConfig.rows"
    >
      <!-- Column and other templates remain the same -->
      ...
    </p-table>
    ```
*   **Component Logic:** The `ResultsTableComponent`'s TypeScript file will already have a method to handle the `(onLazyLoad)` event (or a similar method for `onPageChange` that can be easily adapted). This single method will now seamlessly handle data loading requests originating from either a paginator click or a virtual scroll action.

### 7.4. Impact Assessment

*   **Performance:** Drastic improvement for tables with thousands of rows by rendering only visible DOM elements.
*   **UX:** Provides a much smoother and more modern "infinite scroll" experience as an alternative to pagination.
*   **DX:** Enhances the power and flexibility of the `ResultsTableComponent`, making it more reusable. It reinforces the configuration-driven architecture of the framework.

---

## 8. UI Loading Skeletons

### 8.1. Problem Statement

The application currently shows a generic spinner while data is loading, which is not a modern or user-friendly experience.

### 8.2. Proposed Solution

We will use the `p-skeleton` component from PrimeNG (which is already imported in `PrimengModule`) to display a skeleton UI that mimics the layout of the content being loaded.

### 8.3. Technical Details

*   **Files to Modify:** `ResultsTableComponent`, `StatisticsPanelComponent`, `BasePickerComponent`.
*   **Logic:** In each component, we will create a "skeleton template" that is displayed when the `loading$` observable is `true`.
*   **`ResultsTableComponent`:** The skeleton will show a few rows of `p-skeleton` components, matching the column layout.
*   **`StatisticsPanelComponent`:** The skeleton will show `p-skeleton` blocks in the shape of the charts.

**Example in `ResultsTableComponent`:**

```html
<div *ngIf="(loading$ | async); else dataContent">
  <p-table [value]="[{}, {}, {}]"> <!-- Mock array for skeleton rows -->
    <ng-template pTemplate="header">...</ng-template>
    <ng-template pTemplate="body" let-rowData>
      <tr>
        <td><p-skeleton></p-skeleton></td>
        <td><p-skeleton></p-skeleton></td>
        ...
      </tr>
    </ng-template>
  </p-table>
</div>

<ng-template #dataContent>
  <!-- Existing p-table for actual data -->
</ng-template>
```

### 8.4. Impact Assessment

*   **UX:** Greatly improves perceived performance and provides a modern, polished feel.
*   **DX:** Adds some boilerplate to component templates but is straightforward to implement.
*   **Performance:** Negligible impact.
