# Session 38: Pop-Out URL Parameter Visibility Fix

**Date**: 2025-12-20
**Status**: ✅ COMPLETE - Ready for Testing

---

## Problem Statement

Pop-out windows were displaying query parameters in their URLs, violating the URL-First architecture:

```
❌ BEFORE: /panel/discover/query-control/query-control?yearMin=1970&yearMax=1983&bodyClass=SUV
✅ AFTER:  /panel/discover/query-control/query-control (clean)
```

### Root Cause

`PanelPopoutComponent.handleMessage()` was calling `urlState.setParams()` when receiving `URL_PARAMS_SYNC` messages, which navigated the router and added query parameters to the pop-out URL.

---

## Architecture Solution

**Key Principle**: Pop-out URLs should remain clean. All state flows through BroadcastChannel messages and @Input bindings.

### Implementation

#### 1. PanelPopoutComponent Changes

**File**: `frontend/src/app/features/panel-popout/panel-popout.component.ts`

- ✅ **Removed**: `urlState.setParams()` call from `URL_PARAMS_SYNC` handler
- ✅ **Added**: `state` property to store synced state from main window
- ✅ **Updated**: `STATE_UPDATE` handler to populate `this.state`

```typescript
// When STATE_UPDATE arrives
this.state = message.payload.state; // Store for child components
this.resourceService.syncStateFromExternal(message.payload.state); // Also sync service
```

#### 2. PanelPopoutComponent Template

**File**: `frontend/src/app/features/panel-popout/panel-popout.component.html`

- ✅ **Added**: `[popoutState]="state"` binding to QueryControl

```html
<app-query-control
  [domainConfig]="domainConfig"
  [popoutState]="state"
  (urlParamsChange)="onUrlParamsChange($event)"
  (clearAllFilters)="onClearAllFilters()">
</app-query-control>
```

#### 3. QueryControlComponent Changes

**File**: `frontend/src/framework/components/query-control/query-control.component.ts`

- ✅ **Added**: `@Input() popoutState` to receive state from pop-out parent
- ✅ **Updated**: `ngOnInit()` to detect pop-out mode and subscribe to different sources:
  - **Pop-out**: Uses `popoutState` @Input
  - **Main**: Uses `urlState.params$` (URL-first)
- ✅ **Added**: `ngOnChanges()` to handle `popoutState` updates
- ✅ **Added**: `syncFiltersFromPopoutState()` method to:
  1. Extract filters from state object
  2. Convert to URL parameter format
  3. Render filter chips using existing `syncFiltersFromUrl()` logic

```typescript
// In ngOnInit
if (this.popoutState) {
  // Pop-out mode: watch for state changes
  this.syncFiltersFromPopoutState(this.popoutState);
} else {
  // Main window mode: watch URL params
  this.urlState.params$.subscribe(params => {
    this.syncFiltersFromUrl(params);
  });
}
```

---

## Architecture Preserved

### URL-First State Management
- ✅ **Only main window URL is source of truth**
- ✅ Pop-out URLs remain clean (no query parameters)
- ✅ URL changes in main window trigger API calls via ResourceManagementService
- ✅ State is broadcast to pop-outs via BroadcastChannel

### Component Data Flow

```
Main Window:
  URL change → UrlStateService → ResourceManagementService → API call → state$
       ↓
       └→ DiscoverComponent broadcasts STATE_UPDATE via BroadcastChannel
              ↓
              Pop-out receives STATE_UPDATE
              ├→ PanelPopoutComponent.state = message.payload.state
              └→ Components read from @Input popoutState
```

### No Service Hacks
- ✅ **ResourceManagementService unchanged**
- ✅ **UrlStateService unchanged**
- ✅ **PopOutContextService unchanged**
- ✅ Clean component-level @Input/@Output communication

---

## Data Flow in Detail

### When Filter Changes in Pop-Out Query Control

1. User applies filter in pop-out Query Control
2. QueryControl emits `urlParamsChange` event
3. PanelPopoutComponent receives event and sends `URL_PARAMS_CHANGED` message to main
4. Main window DiscoverComponent receives message and calls `urlState.setParams()`
5. URL changes in main window
6. ResourceManagementService detects URL change and fetches new data
7. `state$` emits new state (filters + results)
8. DiscoverComponent broadcasts STATE_UPDATE to all pop-outs
9. Pop-out receives STATE_UPDATE:
   - `this.state = message.payload.state` (updates @Input)
   - QueryControl's `ngOnChanges()` fires
   - Calls `syncFiltersFromPopoutState()`
   - Renders updated filter chips

### When Filter Changes in Main Window Query Control

1. User applies filter in main Query Control
2. URL updates via `urlState.setParams()`
3. ResourceManagementService fetches new data
4. `state$` emits new state
5. DiscoverComponent broadcasts STATE_UPDATE to pop-outs
6. Pop-out receives and updates filter chips via `@Input popoutState`

---

## Files Modified

1. `frontend/src/app/features/panel-popout/panel-popout.component.ts`
   - Added `state` property
   - Modified `handleMessage()` to ignore `URL_PARAMS_SYNC` and populate `state`

2. `frontend/src/app/features/panel-popout/panel-popout.component.html`
   - Added `[popoutState]="state"` binding to QueryControl

3. `frontend/src/framework/components/query-control/query-control.component.ts`
   - Added `@Input() popoutState`
   - Added `ngOnChanges()` lifecycle hook
   - Updated `ngOnInit()` with pop-out detection logic
   - Added `syncFiltersFromPopoutState()` method

---

## Testing Checklist

### Test 1: Pop-Out URL Stays Clean
- [ ] Open pop-out Query Control
- [ ] Apply filter in main window
- [ ] Verify pop-out URL has NO query parameters
- [ ] Verify pop-out URL = `/panel/discover/query-control/query-control`

### Test 2: Filter Chips Render in Pop-Out
- [ ] Apply filters in main window
- [ ] Look at pop-out Query Control
- [ ] Verify all filter chips display correctly

### Test 3: Filter Chips Update Dynamically
- [ ] Pop-out Query Control window open
- [ ] Apply new filter in main window
- [ ] Verify new filter chip appears in pop-out immediately

### Test 4: Apply Filter from Pop-Out
- [ ] Apply filter in pop-out Query Control
- [ ] Verify filter chip appears in main window
- [ ] Verify results update in main window

### Test 5: Clear All Works from Pop-Out
- [ ] Apply multiple filters
- [ ] Click "Clear Filters" in pop-out Query Control
- [ ] Verify all filters disappear in both main and pop-out

### Test 6: Multiple Pop-Outs Stay in Sync
- [ ] Open 3 pop-outs: Query Control, Statistics, Results
- [ ] Apply filter in main window
- [ ] Verify all three pop-outs update simultaneously
- [ ] Apply filter from Query Control pop-out
- [ ] Verify Statistics and Results pop-outs update

---

## Browser Console Verification

When running tests, look for:

```
[PanelPopout] 🔵 Received URL_PARAMS_SYNC message (ignored - pop-outs use STATE_UPDATE)
[QueryControl] 📍 Pop-out mode detected
[QueryControl] 🔄 syncFiltersFromPopoutState() starting...
[QueryControl] ✅ Called syncFiltersFromUrl() from state
```

---

## Commit Message

```
fix: Pop-out URL parameters - use @Input state instead of URL mutations

- Remove URL_PARAMS_SYNC setParams() call from PanelPopoutComponent
- Pop-out URLs remain clean (no query parameters)
- PanelPopoutComponent stores state in property for child components
- QueryControl reads from @Input popoutState when in pop-out
- Converts state.filters to URL param format for rendering filter chips
- URL-First architecture preserved: only main window URL is source of truth
- ResourceManagementService not compromised with hacks
```

---

## Related Documentation

- [Pop-Out Architecture](./POP-OUT-ARCHITECTURE.md)
- [URL-First State Management](./ORIENTATION.md#url-first-state-management)
- [Resource Management Service](./ORIENTATION.md#framework-services-design-pattern)

---

**Status**: ✅ Ready for testing
**Next Session**: Manual testing of pop-out functionality
