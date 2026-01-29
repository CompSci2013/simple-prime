# Development Flow Chart

**Purpose**: Visual diagrams of state flow, component interactions, and common patterns.

**How to use**: Reference these diagrams when implementing features to understand data flow.

---

## Flow Chart 1: URL-First State Management (Main Window)

```
┌─────────────────────────────────────────────────────────────────────┐
│                        USER INTERACTION                              │
│  (Add filter, select item, change page, etc.)                       │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
                ┌────────────────────────┐
                │  UrlStateService       │
                │  .setParams()          │
                │                        │
                │  Updates URL with      │
                │  new query params      │
                └────────┬───────────────┘
                         │
                         ▼
          ┌──────────────────────────────┐
          │  Browser URL Changes         │
          │  /discover?manufacturer=Ford │
          │           &yearMin=2020      │
          └──────────┬───────────────────┘
                     │
                     ▼
       ┌─────────────────────────────────┐
       │ UrlStateService.params$         │
       │ Observable emits new params     │
       └─────────┬───────────────────────┘
                 │
                 ▼
┌────────────────────────────────────────────┐
│ ResourceManagementService                  │
│                                            │
│ 1. watchUrlChanges() subscription fires   │
│ 2. Maps URL params → filters object       │
│ 3. Calls fetchData(filters)               │
│ 4. Updates stateSubject.next()            │
└────────────┬───────────────────────────────┘
             │
             ├─────────────────┬─────────────────┬─────────────────┐
             ▼                 ▼                 ▼                 ▼
    ┌────────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
    │ filters$       │ │ results$     │ │ statistics$  │ │ state$       │
    │ Observable     │ │ Observable   │ │ Observable   │ │ Observable   │
    └────┬───────────┘ └──────┬───────┘ └──────┬───────┘ └──────┬───────┘
         │                    │                │                │
         ▼                    ▼                ▼                ▼
  ┌─────────────┐     ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
  │ Query       │     │ Results     │  │ Statistics  │  │ Pop-Out     │
  │ Control     │     │ Table       │  │ Panel       │  │ Broadcast   │
  │ Component   │     │ Component   │  │ Component   │  │ Handler     │
  └─────────────┘     └─────────────┘  └─────────────┘  └─────────────┘
         │                    │                │                │
         ▼                    ▼                ▼                ▼
  ┌─────────────┐     ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
  │ Filter      │     │ Data        │  │ Charts      │  │ STATE_UPDATE│
  │ Chips       │     │ Rows        │  │ Render      │  │ Message     │
  │ Render      │     │ Render      │  │             │  │ to Pop-Outs │
  └─────────────┘     └─────────────┘  └─────────────┘  └─────────────┘
```

**Key Points**:
- URL is single source of truth
- All state changes flow through URL → ResourceManagementService → Observables
- Components are reactive subscribers (don't mutate state directly)
- Pop-outs receive state via BroadcastChannel (see Flow Chart 2)

**Bug Prevention**: Following this flow prevents components from getting out of sync.

---

## Flow Chart 2: Pop-Out Window State Synchronization

```
┌──────────────────────────────────────────────────────────────────────┐
│                         MAIN WINDOW                                   │
│                                                                       │
│  User Action → URL Change → ResourceManagementService → state$       │
└───────────────────────────────┬───────────────────────────────────────┘
                                │
                                ▼
                  ┌─────────────────────────────┐
                  │ state$ subscription         │
                  │ .subscribe(state => {       │
                  │   broadcastStateToPopOuts() │
                  │ })                          │
                  └──────────┬──────────────────┘
                             │
                             ▼
              ┌──────────────────────────────┐
              │ BroadcastChannel.postMessage │
              │ {                            │
              │   type: 'STATE_UPDATE',      │
              │   payload: { state }         │
              │ }                            │
              └──────────┬───────────────────┘
                         │
                         │ (Browser API - crosses window boundaries)
                         │
                         ▼
┌────────────────────────────────────────────────────────────────────────┐
│                         POP-OUT WINDOW                                  │
│                                                                         │
│                    ┌────────────────────────────┐                       │
│                    │ BroadcastChannel.onmessage │                       │
│                    │ NgZone.run(() => {         │                       │
│                    │   handleMessage(event)     │                       │
│                    │ })                         │                       │
│                    └──────────┬─────────────────┘                       │
│                               │                                         │
│                               ▼                                         │
│                  ┌────────────────────────────┐                         │
│                  │ switch (message.type) {    │                         │
│                  │   case STATE_UPDATE:       │                         │
│                  │     sync state             │                         │
│                  │ }                          │                         │
│                  └──────────┬─────────────────┘                         │
│                             │                                           │
│                             ▼                                           │
│         ┌───────────────────────────────────────────┐                   │
│         │ ResourceManagementService                 │                   │
│         │ .syncStateFromExternal(state)             │                   │
│         │                                           │                   │
│         │ - Updates stateSubject.next(state)       │                   │
│         │ - NO API calls (state already computed)  │                   │
│         └──────────┬────────────────────────────────┘                   │
│                    │                                                    │
│                    ├─────────────┬──────────────┬─────────────┐         │
│                    ▼             ▼              ▼             ▼         │
│            ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐      │
│            │ filters$ │  │ results$ │  │ state$   │  │ etc.     │      │
│            └────┬─────┘  └────┬─────┘  └────┬─────┘  └──────────┘      │
│                 │             │             │                           │
│                 ▼             ▼             ▼                           │
│         ┌──────────┐  ┌──────────┐  ┌──────────┐                       │
│         │ Query    │  │ Picker   │  │ Charts   │                       │
│         │ Control  │  │ Table    │  │ Panel    │                       │
│         └──────────┘  └──────────┘  └──────────┘                       │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

**Key Points**:
- Pop-out URL has NO query params (`/panel/discover/query-control/query-control`)
- State comes from main window via BroadcastChannel
- `syncStateFromExternal()` updates observables WITHOUT making API calls
- Components subscribe to same observables (filters$, results$) - works identically!

**Bug Prevention**: This architecture ensures pop-out components work identically to main window.

**Bugs Prevented**: Pop-out missing initial state (#3), Query Control chips missing (#4)

---

## Flow Chart 3: PANEL_READY - Initial State Broadcast

```
┌─────────────────────────────────────────────────────────────────┐
│                      POP-OUT WINDOW                              │
│                                                                  │
│  ┌────────────────────────┐                                     │
│  │ PanelPopoutComponent   │                                     │
│  │ ngOnInit() {           │                                     │
│  │   initializeAsPopOut() │                                     │
│  │   sendMessage(         │                                     │
│  │     PANEL_READY        │                                     │
│  │   )                    │                                     │
│  │ }                      │                                     │
│  └───────┬────────────────┘                                     │
│          │                                                      │
└──────────┼──────────────────────────────────────────────────────┘
           │
           │ BroadcastChannel.postMessage({
           │   type: 'PANEL_READY',
           │   timestamp: Date.now()
           │ })
           │
           ▼
┌──────────────────────────────────────────────────────────────────┐
│                       MAIN WINDOW                                 │
│                                                                   │
│  ┌────────────────────────────────────────────┐                  │
│  │ DiscoverComponent                          │                  │
│  │ handlePopOutMessage(message) {             │                  │
│  │   switch (message.type) {                  │                  │
│  │     case PANEL_READY:                      │                  │
│  │       // ❌ WRONG - won't fire if no change│                  │
│  │       // (waiting for state$ subscription) │                  │
│  │       break;                                │                  │
│  │   }                                         │                  │
│  │ }                                           │                  │
│  └────────────────────────────────────────────┘                  │
│                                                                   │
│                     ❌ BUG RESULT:                                │
│              Pop-out opens with empty state                       │
│              (no chips, no selections, no data)                   │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘

                              VS.

┌──────────────────────────────────────────────────────────────────┐
│                       MAIN WINDOW                                 │
│                                                                   │
│  ┌────────────────────────────────────────────┐                  │
│  │ DiscoverComponent                          │                  │
│  │ handlePopOutMessage(message) {             │                  │
│  │   switch (message.type) {                  │                  │
│  │     case PANEL_READY:                      │                  │
│  │       // ✅ CORRECT - Get current value    │                  │
│  │       const currentState =                 │                  │
│  │         this.resourceService               │                  │
│  │           .getCurrentState();              │                  │
│  │       this.broadcastStateToPopOuts(        │                  │
│  │         currentState                       │                  │
│  │       );                                    │                  │
│  │       break;                                │                  │
│  │   }                                         │                  │
│  │ }                                           │                  │
│  └────────┬───────────────────────────────────┘                  │
│           │                                                       │
│           ▼                                                       │
│  ┌────────────────────────┐                                      │
│  │ BroadcastChannel       │                                      │
│  │ .postMessage({         │                                      │
│  │   type: STATE_UPDATE,  │                                      │
│  │   payload: { state }   │                                      │
│  │ })                     │                                      │
│  └────────┬───────────────┘                                      │
│           │                                                       │
└───────────┼───────────────────────────────────────────────────────┘
            │
            ▼
    ┌───────────────────┐
    │ POP-OUT WINDOW    │
    │ Receives state    │
    │ Renders correctly │
    │ ✅                │
    └───────────────────┘
```

**Key Lesson**:
- `state$` subscription only fires on **changes**
- PANEL_READY needs **current value immediately**
- Use `getCurrentState()` for synchronous value access

**Bug Prevented**: Pop-out missing initial state (#3)

---

## Flow Chart 4: Selection Hydration with Pagination Caching

```
USER SELECTS ITEMS ACROSS MULTIPLE PAGES

Page 1: Select A, B, C
Page 2: Select D, E, F
Page 3: Navigate here

URL: ?modelCombos=A,B,C,D,E,F

┌────────────────────────────────────────────────────────────────┐
│                   WRONG IMPLEMENTATION                          │
│                                                                 │
│  hydrateSelections(keys: ['A','B','C','D','E','F']) {         │
│    // ❌ Clear everything                                      │
│    this.state.selectedKeys = new Set();                        │
│    this.state.selectedItems = [];                              │
│                                                                 │
│    // ❌ Only search current page                              │
│    keys.forEach(key => {                                       │
│      const item = this.state.data.find(                        │
│        row => keyGenerator(row) === key                        │
│      );                                                         │
│      if (item) {                                               │
│        this.state.selectedItems.push(item);                    │
│      }                                                          │
│    });                                                          │
│  }                                                              │
│                                                                 │
│  CURRENT PAGE DATA: [D, E, F]                                  │
│  RESULT: selectedItems = [D, E, F]  ❌ Lost A, B, C!          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

                              VS.

┌────────────────────────────────────────────────────────────────┐
│                   CORRECT IMPLEMENTATION                        │
│                                                                 │
│  hydrateSelections(keys: ['A','B','C','D','E','F']) {         │
│    // ✅ Update keys set                                       │
│    this.state.selectedKeys = new Set(keys);                    │
│                                                                 │
│    // ✅ Build cache from EXISTING selections                  │
│    const cache = new Map<string, T>();                         │
│    this.state.selectedItems.forEach(item => {                  │
│      cache.set(keyGenerator(item), item);                      │
│    });                                                          │
│    // cache = { 'A': itemA, 'B': itemB, 'C': itemC }          │
│                                                                 │
│    // ✅ Merge current page + cache                            │
│    const newSelectedItems: T[] = [];                           │
│    keys.forEach(key => {                                       │
│      // Try current page first (fresh data)                    │
│      const inCurrentPage =                                     │
│        this.state.data.find(row => keyGenerator(row) === key); │
│      if (inCurrentPage) {                                      │
│        newSelectedItems.push(inCurrentPage); // D, E, F        │
│      } else if (cache.has(key)) {                              │
│        newSelectedItems.push(cache.get(key)!); // A, B, C      │
│      }                                                          │
│    });                                                          │
│                                                                 │
│    this.state.selectedItems = newSelectedItems;                │
│  }                                                              │
│                                                                 │
│  CURRENT PAGE DATA: [D, E, F]                                  │
│  CACHE: [A, B, C]                                              │
│  RESULT: selectedItems = [A, B, C, D, E, F] ✅                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Key Lesson**:
- URL contains ALL selected keys (across all pages)
- Current page data only has SOME of those keys
- Must preserve cached items from previous pages
- Use Map for efficient key-based lookup

**Bug Prevented**: Selection dropping across pages (#1)

---

## Flow Chart 5: Pagination Race Condition

```
USER CLICKS PAGE 4 BUTTON

┌────────────────────────────────────────────────────────────────┐
│                   WRONG IMPLEMENTATION                          │
│                                                                 │
│  onPageChange(event) {                                         │
│    // ❌ No guard - always processes event                     │
│    this.state.currentPage = 4;                                 │
│    this.loadData();  // → API call for page 4                 │
│  }                                                              │
│                                                                 │
│  Timeline:                                                      │
│  t=0ms:  onPageChange fires → API call for page 4 starts      │
│  t=100ms: Page 4 data returns                                  │
│  t=101ms: hydrateSelections() updates selectedItems            │
│  t=102ms: PrimeNG detects selection change                     │
│  t=103ms: PrimeNG fires onPageChange AGAIN → API call page 3! │
│  t=200ms: Page 3 data overwrites page 4                        │
│                                                                 │
│  RESULT: Stuck on page 3 ❌                                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

                              VS.

┌────────────────────────────────────────────────────────────────┐
│                   CORRECT IMPLEMENTATION                        │
│                                                                 │
│  onPageChange(event) {                                         │
│    // ✅ Guard against concurrent operations                   │
│    if (this.state.loading) {                                   │
│      console.warn('Ignoring page change while loading');       │
│      return;  // Reject event                                  │
│    }                                                            │
│                                                                 │
│    this.state.currentPage = 4;                                 │
│    this.loadData();                                            │
│  }                                                              │
│                                                                 │
│  Timeline:                                                      │
│  t=0ms:  onPageChange fires → API call for page 4 starts      │
│          (loading = true)                                       │
│  t=100ms: Page 4 data returns                                  │
│  t=101ms: hydrateSelections() updates selectedItems            │
│  t=102ms: PrimeNG detects selection change                     │
│  t=103ms: PrimeNG fires onPageChange AGAIN                     │
│  t=104ms: Guard rejects (loading = true) ✅                    │
│  t=105ms: loading = false                                      │
│                                                                 │
│  RESULT: Correctly shows page 4 ✅                             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Key Lesson**:
- Async operations (data loading, hydration) can trigger UI events
- Must guard against processing events during loading
- Apply to: onPageChange, onSort, onFilter, etc.

**Bug Prevented**: Pagination stuck on page 3 (#2)

---

## Flow Chart 6: Component Lifecycle with ResourceManagementService

```
┌─────────────────────────────────────────────────────────────────┐
│                    COMPONENT LIFECYCLE                           │
└─────────────────────────────────────────────────────────────────┘

     ┌──────────────┐
     │ constructor  │
     │              │
     │ Inject       │
     │ dependencies │
     └──────┬───────┘
            │
            ▼
     ┌──────────────┐
     │ ngOnInit     │
     └──────┬───────┘
            │
            ├─────────────────────────────────────────────┐
            │                                             │
            ▼                                             ▼
  ┌─────────────────────┐                    ┌─────────────────────┐
  │ Subscribe to        │                    │ Send PANEL_READY    │
  │ ResourceManagement  │                    │ (if pop-out)        │
  │ observables         │                    └──────┬──────────────┘
  │                     │                           │
  │ filters$            │                           │
  │ results$            │                           │
  │ statistics$         │                           │
  │                     │                           │
  │ .pipe(              │                           │
  │   takeUntil(        │                           │
  │     destroy$        │◄──────────────────────────┘
  │   )                 │
  │ )                   │
  │ .subscribe(...)     │
  └─────────┬───────────┘
            │
            │ (Observable emissions trigger updates)
            │
            ▼
  ┌─────────────────────┐
  │ Update component    │
  │ state               │
  │                     │
  │ this.data = data;   │
  │ this.cdr            │
  │   .markForCheck();  │
  └─────────┬───────────┘
            │
            │ (User interactions)
            │
            ▼
  ┌─────────────────────┐
  │ User changes state  │
  │                     │
  │ Main window:        │
  │   urlState          │
  │     .setParams()    │
  │                     │
  │ Pop-out:            │
  │   popOutContext     │
  │     .sendMessage()  │
  └─────────┬───────────┘
            │
            │ (Cycle continues)
            │
            ▼
     ┌──────────────┐
     │ ngOnDestroy  │
     │              │
     │ destroy$     │
     │   .next()    │
     │ destroy$     │
     │   .complete()│
     └──────────────┘
```

**Key Points**:
- Always use `takeUntil(destroy$)` for cleanup
- Call `markForCheck()` in OnPush components
- Pop-outs send PANEL_READY to get initial state
- State updates flow through observables (reactive)

---

## Summary: Visual Guide to Bug Prevention

| Bug | Flow Chart Reference | Key Visual |
|-----|---------------------|------------|
| **Selection dropping** | Flow Chart 4 | Map-based caching merges current page + cache |
| **Pagination stuck** | Flow Chart 5 | Loading guard rejects concurrent events |
| **Pop-out missing state** | Flow Chart 3 | PANEL_READY → getCurrentState() → broadcast |
| **Query Control chips** | Flow Chart 2 | Pop-out subscribes to filters$, not params$ |

---

## Quick Reference Diagrams

### State Flow (One-Liner)
```
URL → ResourceManagementService → Observables → Components → UI
      ↑                                                        │
      └────────────────────────────────────────────────────────┘
                    (User interactions update URL)
```

### Pop-Out Communication (One-Liner)
```
Main: state$ → BroadcastChannel → Pop-out: syncStateFromExternal() → Observables
Pop-out: Action → BroadcastChannel → Main: Update URL → Cycle repeats
```

### Observable Patterns (One-Liner)
```
Need current value NOW? → getCurrentState()
Need to react to changes? → Observable subscription
```
