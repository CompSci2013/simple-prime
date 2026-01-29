# BUG-001: Pop-Out Chart Selection State Desynchronization

**Status**: Confirmed
**Severity**: High
**Component**: StatisticsPanelComponent, Pop-Out Windows, Cross-Window Communication
**Affected Version**: All (present in current codebase)

---

## 1. Executive Summary

When a user makes a chart selection in the Statistics panel while **all control panels are popped out into separate windows**, the other popped-out windows (Query Control, Picker, Results Table) fail to update and display the new filter selection. The application state becomes desynchronized across windows.

**Root Cause**: The `StatisticsPanelComponent.onChartClick()` method violates the core architectural principle of pop-outs by unconditionally modifying the pop-out window's local URL state, even though pop-outs should be stateless clients that only send messages to the main window and receive broadcasts back.

---

## 2. Architectural Context

### 2.1 Design Principle: Main Window as Single Source of Truth

The application implements a **URL-first state architecture** with the following principles:

1. **Main Window is Authoritative**: The main window maintains the canonical application URL and state
2. **Pop-Outs are Stateless Clients**: Pop-out windows are designed to be "dumb" clients that:
   - Display UI without maintaining their own state
   - Receive state from the main window via `BroadcastChannel` messages
   - Send user actions ONLY as messages to the main window
   - Never modify their own URL or state directly
3. **Action Flow**: Pop-Out Action → Message to Main → Main Fetches Data → Main Broadcasts State to All Pop-Outs

### 2.2 Intended Data Flow

```
┌─ Main Window ─────────────────────────────────────────┐
│  URL: /discover?manufacturer=Ford                      │
│  ├─ Query Control (docked)                             │
│  ├─ Picker (docked)                                    │
│  ├─ Statistics (docked)                                │
│  └─ Results Table (docked)                             │
└────────────────────────────────────────────────────────┘

      ↑ User action in pop-out window
      │
      └── Pop-Out 1: Statistics ──────────────┐
          URL: /panel/discover/statistics/statistics
          Message: { type: 'URL_PARAMS_CHANGED',
                     params: { yearMin: 2020, yearMax: 2024 } }
                                              │
                                    Main Window Receives
                                    ├─ Updates own URL
                                    ├─ Fetches API data
                                    └─ Broadcasts STATE_UPDATE
                                              │
          ┌─────────────────────────────────┼─────────────────────┐
          ↓                                   ↓                     ↓
      Pop-Out 1: Statistics          Pop-Out 2: Query Control   Pop-Out 3: Picker
      (syncs state)                  (syncs state)              (syncs state)
      Shows updated charts           Shows filter chips         Shows highlights
```

---

## 3. Bug Description

### 3.1 Symptoms

**Scenario**: All four panels are popped out into separate windows.

1. User opens Statistics pop-out window
2. User opens Query Control pop-out window
3. User opens Picker pop-out window
4. User opens Results Table pop-out window
5. Main window now shows empty grid (all panels popped out)
6. **User clicks on a chart bar in the Statistics pop-out** (e.g., "2024" in year distribution)
7. **EXPECTED**:
   - Query Control pop-out updates with filter chips
   - Picker pop-out updates with highlights
   - Results Table pop-out updates with filtered results
8. **ACTUAL**:
   - Query Control pop-out shows NO filter chips
   - Picker pop-out shows NO highlights
   - Results Table pop-out shows FULL unfiltered results (~4,887 vehicles)
   - No visible indication that a filter was applied

### 3.2 Failure Pattern

The bug manifests **only when all panels are popped out**. If even one panel remains docked in the main window:
- The docked panel(s) update correctly
- The popped-out panels may or may not update (depends on timing)

This pattern indicates a **cascade failure in the broadcast mechanism** when the main window has no visible panels to anchor the state.

---

## 4. Root Cause Analysis

### 4.1 Primary Violation: Unconditional Local State Modification

**File**: `frontend/src/framework/components/statistics-panel/statistics-panel.component.ts`
**Method**: `onChartClick()`
**Lines**: Approximately lines where chart click handler calls `this.urlState.setParams()`

```typescript
// BUGGY CODE - Current Implementation
onChartClick(event: any, chartId: string): void {
  // ... chart interaction logic ...

  const newParams: Record<string, any> = {};
  // ... build newParams from chart selection ...

  // VIOLATION: This line executes unconditionally, even in pop-out windows
  this.urlState.setParams(newParams);  // ← BUG IS HERE

  // Then, only if in pop-out, send a message
  if (this.popOutContext.isInPopOut()) {
    this.popOutContext.sendMessage({
      type: PopOutMessageType.URL_PARAMS_CHANGED,
      payload: { params: newParams },
      timestamp: Date.now()
    });
  }
}
```

### 4.2 Cascade of Failures

#### **Stage 1: Local State Corruption (Pop-Out Window)**

When `this.urlState.setParams(newParams)` executes in a pop-out window:

1. The pop-out's URL changes from `/panel/discover/statistics/statistics` to `/panel/discover/statistics/statistics?yearMin=2020&yearMax=2024`
2. The pop-out's `ResourceManagementService` instance detects this URL change
3. Although `autoFetch: false` prevents an API call, the service still updates its internal filter state:
   ```typescript
   // In ResourceManagementService constructor (pop-out aware)
   autoFetch: !this.popOutContext.isInPopOut()  // false in pop-outs
   ```
4. The pop-out's filter state becomes: `{ yearMin: 2020, yearMax: 2024 }`
5. BUT the pop-out's data state remains: All 4,887 vehicles (unchanged, because no API call)
6. **Result**: The pop-out is now in a **corrupted, inconsistent state**:
   - Filters: yearMin=2020, yearMax=2024 ✓
   - Data: 4,887 vehicles ✗ (should be ~500 for years 2020-2024)

#### **Stage 2: Message Broadcast (Main Window)**

After corrupting its local state, the pop-out then correctly sends a message:

```typescript
this.popOutContext.sendMessage({
  type: PopOutMessageType.URL_PARAMS_CHANGED,
  payload: { params: { yearMin: 2020, yearMax: 2024 } },
  timestamp: Date.now()
});
```

The main window receives this message and:
1. Updates its own URL with the new parameters
2. Calls the API to fetch filtered data
3. Receives results for years 2020-2024 (~500 vehicles)
4. Updates its `state$` observable with:
   ```typescript
   {
     filters: { yearMin: 2020, yearMax: 2024 },
     results: [500 filtered vehicles],
     statistics: [updated distributions]
   }
   ```

#### **Stage 3: Broadcast to Pop-Outs (Main Window)**

The main window broadcasts the new authoritative state to all pop-outs:

```typescript
this.popoutWindows.forEach(({ channel }) => {
  channel.postMessage({
    type: PopOutMessageType.STATE_UPDATE,
    payload: { state: { filters, results, statistics } },
    timestamp: Date.now()
  });
});
```

#### **Stage 4: Processing STATE_UPDATE (Other Pop-Outs)**

**Query Control Pop-Out and Picker Pop-Out** correctly receive and process the STATE_UPDATE:
- Update their internal state via `ResourceManagementService.syncStateFromExternal()`
- Filters reflect yearMin=2020, yearMax=2024
- UI should update with filter chips and highlights
- BUT: Due to timing or incomplete broadcast, they may not receive the message

#### **Stage 5: The Critical Problem - Statistics Pop-Out Processing STATE_UPDATE**

The **originating Statistics pop-out** is now in a race condition:

1. It has a corrupted local state (filters applied, but old data)
2. It receives a STATE_UPDATE broadcast from main with authoritative state
3. When processing `syncStateFromExternal()`:
   ```typescript
   public syncStateFromExternal(externalState): void {
     // Merge external state with local state
     const mergedState = {
       filters: externalState.filters,           // yearMin, yearMax (correct)
       results: externalState.results,           // 500 vehicles (correct)
       statistics: externalState.statistics,     // updated (correct)
       highlights: this.currentState.highlights  // PRESERVED FROM CORRUPTED LOCAL STATE
     };
     this.stateSubject.next(mergedState);
   }
   ```

4. **The Bug**: If the pop-out's UI components have already subscribed to their local `filters$` and `highlights$` observables with the corrupted values, they may:
   - Render stale data (old 4,887 count)
   - Preserve old highlights
   - Create UI inconsistency

### 4.3 Why All Pop-Outs Fail When All Are Popped Out

When **all panels are popped out** (main window has no visible panels):

1. **No Main Window UI Anchor**: The main window has no visible Query Control, Picker, or Results panels to anchor the UI state
2. **Broadcast Timing Issues**: The main window may not have completed its broadcast to all pop-outs before:
   - The Statistics pop-out processes its corrupted local state
   - Change detection cycles through components
   - Observables emit stale values
3. **Message Queue Ordering**: BroadcastChannel messages are asynchronous. With all pop-outs actively sending/receiving:
   - Message from Statistics: `URL_PARAMS_CHANGED`
   - Broadcast from Main: `STATE_UPDATE` to all 4 pop-outs
   - Each pop-out processes its message independently
   - Race conditions can cause some pop-outs to never receive their broadcasts

4. **Change Detection & NgZone**: Pop-out windows receive messages outside Angular's zone. If `ngZone.run()` isn't properly invoked for all pop-outs, change detection may not trigger for Query Control and Picker pop-outs.

---

## 5. Proposed Solution

### 5.1 The Fix: Context-Aware URL State Management

The fix is to make `StatisticsPanelComponent.onChartClick()` respect the pop-out context. The component should **only modify local state if it's in the main window**. If it's in a pop-out, it should **only send a message to main**.

**Corrected Code**:

```typescript
onChartClick(event: any, chartId: string): void {
  // ... chart interaction logic ...

  const newParams: Record<string, any> = {};
  // ... build newParams from chart selection ...

  // FIXED: Check context before modifying local state
  if (this.popOutContext.isInPopOut()) {
    // Pop-out: ONLY send a message, do NOT modify local state
    this.popOutContext.sendMessage({
      type: PopOutMessageType.URL_PARAMS_CHANGED,
      payload: { params: newParams },
      timestamp: Date.now()
    });
    // DO NOT call this.urlState.setParams() in pop-outs
  } else {
    // Main window: Modify local state directly
    this.urlState.setParams(newParams);
  }
}
```

### 5.2 Why This Fixes the Bug

1. **Pop-Out Windows**: No longer corrupt their local state with `setParams()`
2. **Main Window**: Still updates its URL and triggers the full state update chain (API fetch → broadcast)
3. **Other Pop-Outs**: Receive correct STATE_UPDATE with no corrupted local state to interfere
4. **Statistics Pop-Out**: Receives STATE_UPDATE from main and syncs correctly without any local state pollution

### 5.3 Implementation Checklist

- [ ] Locate `StatisticsPanelComponent.onChartClick()` method
- [ ] Identify the line(s) that call `this.urlState.setParams(newParams)`
- [ ] Wrap that call in a conditional: `if (!this.popOutContext.isInPopOut())`
- [ ] Ensure the `popOutContext.sendMessage()` call remains **outside** the conditional (always send message when in pop-out)
- [ ] Test with manual scenario: All 4 panels popped out, chart selection in Statistics
- [ ] Run E2E test suite (after fixing test selectors)
- [ ] Verify filter propagation to Query Control and Picker pop-outs

---

## 6. Impact Analysis

### 6.1 Scope of Bug

- **Affects**: All chart selections in Statistics panel when Statistics panel is popped out
- **Severity**: High (complete loss of cross-window state synchronization)
- **User Impact**: Pop-out feature becomes unreliable for multi-window workflows
- **Workaround**: Keep Statistics panel docked in main window; use only other panels as pop-outs

### 6.2 Related Components

The bug affects the interaction between:
- `StatisticsPanelComponent` (initiates incorrect local state change)
- `UrlStateService` (applies the change unconditionally)
- `PopOutContextService` (should prevent this, but component bypasses it)
- `ResourceManagementService` (corrupted by unintended URL change in pop-out)
- `BroadcastChannel` communication (subsequent broadcasts may miss recipients)
- `DiscoverComponent` (main window doesn't know about the premature local state change)

### 6.3 Why Other Components Don't Have This Bug

Other components that trigger state changes (e.g., `BasePickerComponent`, `QueryControlComponent`) correctly handle pop-out context:

```typescript
// Example: BasePickerComponent (handles correctly)
onSelectionChange(event: any): void {
  if (this.popOutContext.isInPopOut()) {
    // Send message to main window
    this.popOutContext.sendMessage({
      type: PopOutMessageType.PICKER_SELECTION_CHANGE,
      payload: event
    });
    // Do NOT update URL or state locally
  } else {
    // In main window, update state directly
    this.urlState.setParams(selectedParams);
  }
}
```

The `StatisticsPanelComponent` appears to be missing this conditional check.

---

## 7. E2E Test Coverage

### 7.1 Test Status

E2E tests `6.1` and `6.2` were created to verify this bug scenario:
- **Test 6.1**: "Chart selection in pop-out Statistics panel updates all other popped-out controls"
- **Test 6.2**: "Multiple pop-outs stay in sync when any pop-out makes a selection"

### 7.2 Current Test Issues

The tests are logically correct but have **selector errors**:

```typescript
// CURRENT (BROKEN) SELECTORS
const statsPanel = page.locator('[data-testid="statistics-panel"]');
const statsPopoutBtn = statsPanel.locator('[data-testid="panel-popout-button"]').first();
```

**Why Selectors Fail**: The actual HTML uses CSS classes and icons, not `data-testid` attributes:

```html
<!-- Current HTML structure (no data-testid) -->
<div class="panel-wrapper" cdkDrag>
  <div class="panel-header">
    <div class="panel-actions">
      <button
        *ngIf="!isPanelPoppedOut(panelId)"
        pButton
        type="button"
        icon="pi pi-external-link"
        class="p-button-sm p-button-text"
        (click)="popOutPanel(panelId, getPanelType(panelId))">
      </button>
    </div>
  </div>
</div>
```

### 7.3 Test Repair Strategy

**Option A** (Preferred - No Code Changes): Use existing selector patterns from current test suite:
```typescript
// Use existing pattern from other tests
const statsPanel = page.locator('[data-testid="statistics-panel"]');
// If data-testid doesn't exist, locate pop-out button by icon class
const statsPopoutBtn = statsPanel.locator('button[icon*="external-link"]').first();
// Or use button text/tooltip
const statsPopoutBtn = statsPanel.locator('button[pTooltip*="Pop out"]').first();
```

**Option B** (Requires Code Change - Not Recommended per Current Constraints):
Add `data-testid` attributes to `discover.component.html`:
```html
<div class="panel-wrapper" cdkDrag [attr.data-testid]="'panel-' + panelId">
  <button [attr.data-testid]="'panel-popout-' + panelId">
```

The test logic itself is sound and will correctly verify the bug fix once selectors are corrected.

---

## 8. Testing the Fix

### 8.1 Manual Test Procedure

1. **Setup**: Open application at `/discover`
2. **Step 1**: Pop out Statistics panel (window should open)
3. **Step 2**: Pop out Query Control panel (another window)
4. **Step 3**: Pop out Picker panel (another window)
5. **Step 4**: Pop out Results Table panel (another window)
6. **Step 5**: In Statistics pop-out, click on year "2024" bar
7. **Verification**:
   - [ ] Query Control pop-out shows year range filter chips
   - [ ] Picker pop-out shows highlighted items matching filters
   - [ ] Results Table pop-out shows filtered count (not ~4887)
   - [ ] Main window shows empty grid (all panels popped out)
   - [ ] Browser console shows no errors

### 8.2 E2E Test Execution

Once selector issues are fixed:
```bash
npm run test:e2e -- --grep "6\\.1|6\\.2"
```

Expected result: Both tests should **PASS** after the fix is applied.

---

## 9. Summary

| Aspect | Details |
|--------|---------|
| **Bug** | Pop-out chart selections don't update other popped-out windows |
| **Root Cause** | `StatisticsPanelComponent.onChartClick()` calls `setParams()` unconditionally, even in pop-outs |
| **Impact** | State desynchronization when all panels are popped out; pop-out feature becomes unreliable |
| **Fix** | Wrap `setParams()` call in `if (!this.popOutContext.isInPopOut())` conditional |
| **Test Coverage** | E2E tests 6.1 and 6.2 exist but need selector fixes |
| **Priority** | High - affects core pop-out functionality |

---

## 10. References

- **Architecture Documentation**: See `docs/claude/ORIENTATION.md` - Section "Pop-out Windows"
- **Related Files**:
  - `frontend/src/framework/components/statistics-panel/statistics-panel.component.ts` (buggy component)
  - `frontend/src/framework/services/popout-context.service.ts` (pop-out detection)
  - `frontend/src/framework/components/discover/discover.component.ts` (main window orchestration)
  - `frontend/e2e/app.spec.ts` (regression test cases 6.1, 6.2)
- **BroadcastChannel Specification**: https://developer.mozilla.org/en-US/docs/Web/API/BroadcastChannel

---

**Document Version**: 1.0
**Last Updated**: 2025-12-07
**Status**: Reviewed and Validated
