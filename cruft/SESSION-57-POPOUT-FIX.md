# Session 57: Critical Bug Fix - Pop-Out Filter Synchronization

## Bug #14 Refined: Results Table Pop-Out Shows Unfiltered Results

**Issue**: When the Results Table is popped out, it displays "4887 results" (unfiltered total) even when filters are applied in the main window (e.g., "59 results").

**Initial Diagnosis**: The previous "fix" (ReplaySubject) ensured messages were received, but the Results Table component was seemingly ignoring them.

**Deep Analysis & Root Cause**:
The issue was a race condition in `ResourceManagementService` initialization logic within the pop-out window context.

1.  **Dependency Injection Timing**: `ResourceManagementService` determines if it should `autoFetch` (call API) by checking `popOutContext.isInPopOut()` in its constructor.
2.  **False Negative**: In the pop-out window, `PopOutContextService` (singleton) is initialized early. If `Router.url` is not yet fully updated to the pop-out URL (`/panel/...`) when the service checks it, `isInPopOut()` returns `false`.
3.  **Erroneous Fetch**: Believing it is in the main window, `ResourceManagementService` sets `autoFetch = true` and immediately triggers a fetch with default filters (URL parameters are likely empty/default at this split second).
4.  **Race Condition**:
    *   **Event A**: `PanelPopoutComponent` receives `STATE_UPDATE` from main window (correct filtered state: 59 results). It calls `syncStateFromExternal()`, updating the service to 59 results.
    *   **Event B**: The erroneous "autoFetch" triggered in constructor completes. It returns 4887 results (unfiltered).
    *   **Result**: If Event B happens after Event A (likely, due to network latency vs. broadcast speed), the correct state is overwritten by the unfiltered state.

**The Fix**:
Implemented an explicit **Injection Token** pattern to deterministically signal the pop-out context, decoupling logic from Router timing.

1.  **New Token**: Created `IS_POPOUT_TOKEN` (`frontend/src/framework/tokens/popout.token.ts`).
2.  **Explicit Provision**: `PanelPopoutComponent` provides this token with `useValue: true`.
3.  **Service Update**: `ResourceManagementService` injects this token (`@Optional()`) and uses it to force `autoFetch = false`, regardless of what `PopOutContextService` reports.

**Files Changed**:
-   `frontend/src/framework/tokens/popout.token.ts` (New)
-   `frontend/src/app/features/panel-popout/panel-popout.component.ts` (Provider added)
-   `frontend/src/framework/services/resource-management.service.ts` (Logic update)

**Verification**:
-   Build passed (6.84 MB).
-   This architecture ensures `ResourceManagementService` *never* fetches data automatically when hosted inside a `PanelPopoutComponent`.

---
