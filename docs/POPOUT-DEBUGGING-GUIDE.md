# Pop-Out Functionality Debugging Guide

This guide explains how to manually test pop-out window functionality using browser console messages.

## Quick Start

1. Open the application at `http://localhost:4205/discover`
2. Open **Developer Tools** (`F12`) and go to the **Console** tab
3. Filter console output to show only logs starting with `[Discover]`, `[PanelPopout]`, `[StatisticsPanel]`, or `[QueryControl]`
4. Follow the step-by-step flows below

## Message Flow Overview

```
Main Window (Discover)
    ↓
  Opens Pop-out Window (PanelPopout)
    ↓
  User clicks chart in pop-out Statistics Panel
    ↓
  Pop-out sends URL_PARAMS_CHANGED message to main window
    ↓
  Main window updates URL via urlState.setParams()
    ↓
  Main window broadcasts STATE_UPDATE via BroadcastChannel
    ↓
  Pop-out receives STATE_UPDATE and renders new state
```

## Step-by-Step Testing

### Step 1: Open Main Window
**Expected Console Output:**
```
[Discover] ngOnInit() called
[Discover] Picker configs registered: X
[Discover] Initialized as parent window
[Discover] beforeunload handler attached
[Discover] Subscribed to popOutContext messages
[Discover] Subscribed to popoutMessages$ subject
[Discover] Subscribed to resourceService.state$ for broadcasting
```

**What to Check:**
- All 7 log lines appear in order
- No console errors

---

### Step 2: Click Pop-out Button for Statistics Panel
**Expected Console Output:**
```
[Discover] popOutPanel() called - panelId: statistics-panel, panelType: statistics
[Discover] Opening pop-out window at URL: /panel/discover/statistics-panel/statistics
[Discover] window.open() returned: SUCCESS
[Discover] Marked panel as popped out. Total popped out: 1
[Discover] Created BroadcastChannel for panel: statistics-panel
[Discover] Set up channel.onmessage listener for panel: statistics-panel
[Discover] Set up window close monitor for panel: statistics-panel
[Discover] Stored popout reference. Total popouts: 1
[Discover] ✅ Successfully popped out panel: statistics-panel
```

**In Pop-out Window (check BOTH console logs):**
```
[PanelPopout] ngOnInit() starting...
[PanelPopout] ✅ Registered picker configs
[PanelPopout] ✅ Route params received - Grid: discover, Panel: statistics-panel, Type: statistics
[PanelPopout] ✅ Initialized as pop-out in PopOutContextService
[PanelPopout] ✅ Triggered change detection via markForCheck()
[PanelPopout] ✅ Subscribed to PopOutContextService messages
[PanelPopout] ✅ ngOnInit() complete
```

**What to Check:**
- Main window: Window opens with SUCCESS
- Pop-out: Shows "Initialized as pop-out" messages
- Both windows: No console errors

---

### Step 3: Pop-out Query Control Panel
**Expected Console Output (Main Window):**
```
[Discover] popOutPanel() called - panelId: query-control, panelType: query-control
[Discover] Opening pop-out window at URL: /panel/discover/query-control/query-control
[Discover] window.open() returned: SUCCESS
[Discover] Marked panel as popped out. Total popped out: 2
[Discover] Created BroadcastChannel for panel: query-control
[Discover] Set up channel.onmessage listener for panel: query-control
[Discover] Set up window close monitor for panel: query-control
[Discover] Stored popout reference. Total popouts: 2
[Discover] ✅ Successfully popped out panel: query-control
```

**In Query Control Pop-out:**
```
[QueryControl] ngOnInit() starting...
[QueryControl] ✅ Initialized filter field options: X
[QueryControl] ✅ ngOnInit() complete, subscribed to URL params$
```

**What to Check:**
- Main window: Total popped out increases to 2
- Query Control pop-out: Shows initialization complete

---

### Step 4: Click Chart in Statistics Pop-out (THE KEY TEST)
**In Statistics Pop-out Console:**
```
[StatisticsPanel] 🎯 onChartClick() - chartId: year-distribution, isHighlightMode: true, value: 2024
[StatisticsPanel] Context: isInPopOut=true
[StatisticsPanel] Processing HIGHLIGHT MODE click
[StatisticsPanel] Parsed range: {h_yearMin: "2024", h_yearMax: "2024"}
[StatisticsPanel] 🟡 In Pop-Out - Broadcasting highlight params to main window: {h_yearMin: "2024", h_yearMax: "2024"}
[StatisticsPanel] ✅ Broadcast message sent via popOutContext.sendMessage()
[StatisticsPanel] ✅ onChartClick() complete
```

**Simultaneously in Main Window Console:**
```
[Discover] PopOutContextService message received: {type: "URL_PARAMS_CHANGED", payload: {...}, timestamp: XXXXX}
[Discover] Message from pop-out: URL_PARAMS_CHANGED {params: {h_yearMin: "2024", h_yearMax: "2024"}}
[Discover] URL params change from pop-out: {h_yearMin: "2024", h_yearMax: "2024"}
[Discover] State changed, broadcasting to pop-outs: {... filtered results ...}
[Discover] Broadcasting state to all pop-outs: {resultsCount: X, filters: {...}, popoutsCount: 2}
```

**In Query Control Pop-out Console (Should update):**
```
[QueryControl] 📨 URL params changed: {h_yearMin: "2024", h_yearMax: "2024"}
[QueryControl] 🔄 syncFiltersFromUrl() starting...
[QueryControl] Input params: {h_yearMin: "2024", h_yearMax: "2024"}
[QueryControl] Processing highlight filter: Highlight Year
[QueryControl] ✅ Highlight filters synced. Count: 1
[QueryControl] ✅ syncFiltersFromUrl() complete
[QueryControl] ✅ Called syncFiltersFromUrl(), marking for check
```

**In Statistics Pop-out Console (Should receive state):**
```
[PanelPopout] ⬇️  Message received from PopOutContextService: {type: "STATE_UPDATE", payload: {...}, ...}
[PanelPopout] 🟢 Received STATE_UPDATE message
[PanelPopout] State payload: {results: [...], filters: {...}, ...}
[PanelPopout] ✅ Called resourceService.syncStateFromExternal()
[PanelPopout] ✅ Triggered change detection
```

**What to Check:**
- ✅ Statistics panel shows `isInPopOut=true` (not setting URL directly)
- ✅ Statistics panel broadcasts message with correct params
- ✅ Main window receives URL_PARAMS_CHANGED message
- ✅ Main window broadcasts STATE_UPDATE to all pop-outs
- ✅ Query Control pop-out receives URL params and updates filters
- ✅ UI shows filter chip/highlight in Query Control pop-out

**If Something is Missing:**
1. Check which log line is NOT appearing
2. That tells you where the flow breaks
3. Common issues:
   - `isInPopOut=false` → Pop-out is modifying its own URL (wrong)
   - No BroadcastChannel message in main window → Message not being sent
   - No STATE_UPDATE in pop-outs → Main window not broadcasting
   - Filters not appearing → Change detection issue or QueryControl not receiving params

---

### Step 5: Verify Results Table Updates
**Expected in Results Table Pop-out:**
```
[PanelPopout] ⬇️  Message received from PopOutContextService: {type: "STATE_UPDATE", ...}
[PanelPopout] 🟢 Received STATE_UPDATE message
[PanelPopout] ✅ Called resourceService.syncStateFromExternal()
[PanelPopout] ✅ Triggered change detection
```

**What to Check:**
- Table row count decreases based on selected year
- Results reflect the filter that was selected

---

## Troubleshooting Checklist

### Issue: Statistics Panel Sets Its Own URL
**Symptom:** See `[StatisticsPanel] 🔵 In Main Window - Setting highlight params:` in pop-out
**Root Cause:** `isInPopOut()` returning false (context not initialized)
**Fix:** Check PanelPopoutComponent is calling `popOutContext.initializeAsPopOut()`

### Issue: Main Window Doesn't Receive Message
**Symptom:** No `[Discover] Message from pop-out:` log in main window
**Root Cause:** BroadcastChannel message not being sent or received
**Fix:**
1. Check channel is set up: `[Discover] Created BroadcastChannel for panel:`
2. Check listener is registered: `[Discover] Set up channel.onmessage listener`
3. Verify message is sent: `[StatisticsPanel] ✅ Broadcast message sent`

### Issue: Main Window Doesn't Broadcast to Pop-outs
**Symptom:** No STATE_UPDATE log in pop-out after chart click
**Root Cause:** State change not triggering broadcast
**Fix:**
1. Check state changed: `[Discover] State changed, broadcasting to pop-outs:`
2. Check pop-out count: `popoutsCount` should be > 0
3. Verify broadcast message: `[Discover] Broadcasting state to all pop-outs:`

### Issue: Query Control Doesn't Show Filter Chips
**Symptom:** URL params appear in console but no chips in UI
**Root Cause:** Change detection or QueryControl not receiving updates
**Fix:**
1. Check URL params received: `[QueryControl] 📨 URL params changed:`
2. Check filter synced: `[QueryControl] ✅ Highlight filters synced. Count: 1`
3. Check markForCheck called: `[QueryControl] ✅ Called syncFiltersFromUrl(), marking for check`

---

## Key Things to Look For

### In Main Window Console
- ✅ Popup open succeeds: `window.open() returned: SUCCESS`
- ✅ BroadcastChannel created: `Created BroadcastChannel for panel:`
- ✅ Message received from pop-out: `Message from pop-out: URL_PARAMS_CHANGED`
- ✅ State broadcasted: `Broadcasting state to all pop-outs:` with `popoutsCount` > 0

### In Pop-out Console
- ✅ Initialized as pop-out: `Initialized as pop-out in PopOutContextService`
- ✅ Message broadcast: `Broadcasting ... params to main window:` when clicking chart
- ✅ STATE_UPDATE received: `Received STATE_UPDATE message`
- ✅ Change detection triggered: `Triggered change detection`

### In UI
- ✅ Chart click in Statistics pop-out results in filter chip in Query Control pop-out
- ✅ Results Table pop-out updates to show filtered results
- ✅ Main window also shows same filters and results (for comparison)

---

## Console Filter Tips

### Filter by Component
In browser DevTools console, type:
```javascript
// Show only Discover logs
console.log = (function(log) { return function(...args) { if (args[0]?.includes('[Discover]')) log(...args); }; })(console.log);
```

Or use native filter (Most browsers have this):
- DevTools → Console → Input field at top: `[Discover]`
- This filters to show only matching logs

### Quick Test Script
Paste in console to summarize the test:
```javascript
const logs = [];
const origLog = console.log;
console.log = function(...args) {
  if (args[0]?.match?.(/\[(Discover|PanelPopout|StatisticsPanel|QueryControl)\]/)) {
    logs.push(args[0]);
  }
  origLog.apply(console, args);
};

// After test, run:
console.log('=== SUMMARY ===');
console.log('Messages sent:', logs.filter(l => l.includes('Broadcasting')).length);
console.log('Messages received:', logs.filter(l => l.includes('received')).length);
```

---

## Expected Behavior

### Success Case
When you click a chart in the Statistics pop-out:
1. Chart click fires → `onChartClick()` logs appear
2. Message sent → `Broadcasting ... to main window` log appears
3. Main window receives → `Message from pop-out:` log appears
4. URL updates → `State changed, broadcasting` log appears
5. All pop-outs updated → `STATE_UPDATE` logs in all pop-outs
6. UI updates → Filter chips appear in Query Control, Results Table shows fewer rows

### Failure Case
If any step is missing:
1. Check the console log for that step
2. If log is missing, that's the problem area
3. Check corresponding component code for that flow
4. Common causes:
   - Service not injected
   - Observable subscription failed
   - Message type constant mismatch
   - Change detection not called

---

## Contact Points for Debugging

If you need to add MORE debugging, here are the key methods:

### DiscoverComponent (`discover.component.ts`)
- `popOutPanel()` - Opening pop-out window
- `handlePopOutMessage()` - Receiving messages
- `broadcastStateToPopOuts()` - Sending state to pop-outs

### PanelPopoutComponent (`panel-popout.component.ts`)
- `ngOnInit()` - Pop-out initialization
- `handleMessage()` - Message reception

### StatisticsPanel (`statistics-panel.component.ts`)
- `onChartClick()` - Chart interaction

### QueryControl (`query-control.component.ts`)
- `syncFiltersFromUrl()` - Filter synchronization
- `ngOnInit()` - Initial subscription setup

---

## Related Services

### PopOutContextService
Manages BroadcastChannel creation and context

### ResourceManagementService
Synchronizes state across windows via `syncStateFromExternal()`

### UrlStateService
Manages URL parameters via `setParams()`

---

## Success Criteria

✅ Complete flow works when:
1. Pop-outs can be opened without errors
2. Chart clicks in Statistics pop-out send messages to main window
3. Main window receives and processes messages
4. Main window broadcasts state to all pop-outs
5. Query Control pop-out displays filter chips
6. Results Table pop-out shows filtered results
7. All console logs appear in correct sequence with no gaps
