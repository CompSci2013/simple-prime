# Pop-Out Windows - Requirements Rubric

**Session**: 39 (Next Session)
**Status**: Planning Document - Read Before Code Changes
**Criticality**: BLOCKING - Must be understood before any implementation changes

---

## Critical Constraint

**⚠️ POP-OUT WINDOWS CANNOT USE @INPUT() BINDINGS**

Pop-out windows run in separate browser contexts with separate Angular zones. `@Input()` bindings require parent-child component relationship in the same Angular zone, which is impossible for pop-outs.

**Solutions that do NOT work:**
- ❌ @Input() state from parent
- ❌ @ViewChild() references
- ❌ Direct component method calls

**Solution that DOES work:**
- ✅ BroadcastChannel messaging
- ✅ Subscription-based state synchronization
- ✅ Service observables available in both windows

---

## Expected State & Appearance Rubric

### Initial State (No Filters Applied)

#### Main Window
```
URL: /automobiles/discover
Query Control Panel:
  - Filter dropdown (empty state)
  - No "Active Filters" section visible
  - "Clear Filters" button (disabled or not visible)

Results Table:
  - 4,887 total vehicles displayed
  - All manufacturers shown

Statistics Panel:
  - All body classes shown
  - All years shown
  - All manufacturers shown
```

#### Pop-Out Query Control Window
```
URL: /panel/discover/query-control/query-control (CLEAN - NO QUERY PARAMS)
Query Control Panel:
  - Filter dropdown (empty state)
  - No "Active Filters" section visible
  - "Clear Filters" button (disabled or not visible)

Browser Console:
  - [QueryControl] ngOnInit() complete (pop-out mode)
  - [PopOut] Initialized as pop-out
```

---

### After Filtering (User Applies Filter in Main Window)

#### Main Window Actions
1. User clicks filter dropdown: "Year Range"
2. Selects: Min=1970, Max=1985
3. Clicks "Apply"

#### Main Window Observable Changes
```
URL BEFORE: /automobiles/discover
URL AFTER:  /automobiles/discover?yearMin=1970&yearMax=1985 ✅ URL CHANGED

Query Control Panel:
  - "Active Filters:" section VISIBLE
  - Filter chip displays: "Year: 1970 - 1985" ✅ CHIP VISIBLE

Results Table:
  - Count updates: 4,887 → 892 vehicles ✅ FILTERED
  - Only vehicles 1970-1985 shown

Statistics Panel:
  - Charts update to show only 1970-1985 data ✅ CHARTS UPDATED
```

#### Pop-Out Query Control Window Observable Changes
```
URL: /panel/discover/query-control/query-control (UNCHANGED - STILL CLEAN) ✅ CRITICAL
  → NO query parameters appear in pop-out URL

Query Control Panel:
  - "Active Filters:" section VISIBLE
  - Filter chip displays: "Year: 1970 - 1985" ✅ CHIP VISIBLE (from BroadcastChannel)

Browser Console (Main Window):
  - [ResourceManagementService] State changed
  - [Discover] Broadcasting state to pop-outs
  - [Discover] Sending STATE_UPDATE via BroadcastChannel

Browser Console (Pop-Out Window):
  - [PopOut] 🟢 Received STATE_UPDATE message
  - [QueryControl] 📨 Subscription received new filters
  - [QueryControl] 🔄 syncFiltersFromUrl() or equivalent
  - Filter chips re-render ✅ CHIP VISIBLE
```

#### Pop-Out Statistics Panel Observable Changes
```
URL: /panel/discover/statistics/statistics (UNCHANGED - STILL CLEAN) ✅ CRITICAL

Statistics Panel:
  - Charts update to show only 1970-1985 data ✅ CHARTS UPDATED (from BroadcastChannel)
  - Same filtered view as main window

Browser Console (Pop-Out):
  - [PopOut] 🟢 Received STATE_UPDATE message
  - [StatisticsPanel] Received new statistics data
  - Charts re-render with new data
```

#### Pop-Out Results Table Observable Changes
```
URL: /panel/discover/results/results (UNCHANGED - STILL CLEAN) ✅ CRITICAL

Results Table:
  - Count updates: 4,887 → 892 vehicles ✅ FILTERED
  - Same filtered results as main window

Browser Console (Pop-Out):
  - [PopOut] 🟢 Received STATE_UPDATE message
  - [ResultsTable] Received new results data
  - Table re-renders with filtered results
```

---

### After User Applies Filter in Pop-Out Query Control

#### Pop-Out Window Actions
1. User (in pop-out Query Control) clicks filter dropdown: "Manufacturer"
2. Selects: "Toyota"
3. Clicks "Apply"

#### Pop-Out Observable Changes
```
URL: /panel/discover/query-control/query-control (UNCHANGED - STILL CLEAN) ✅ CRITICAL
  → NO query parameters appear in pop-out URL

Query Control Panel (Pop-Out):
  - Filter chip displays: "Year: 1970 - 1985" (from previous filter)
  - NEW filter chip displays: "Manufacturer: Toyota" ✅ NEW CHIP VISIBLE

Browser Console (Pop-Out):
  - [QueryControl] Emit urlParamsChange event
  - [PanelPopout] onUrlParamsChange() received {manufacturer: 'Toyota'}
  - [PanelPopout] Send URL_PARAMS_CHANGED to main window
```

#### Main Window Observable Changes (Receives Message from Pop-Out)
```
URL BEFORE: /automobiles/discover?yearMin=1970&yearMax=1985
URL AFTER:  /automobiles/discover?yearMin=1970&yearMax=1985&manufacturer=Toyota ✅ URL UPDATED

Query Control Panel:
  - Filter chip 1: "Year: 1970 - 1985" ✅ VISIBLE
  - Filter chip 2: "Manufacturer: Toyota" ✅ NEW CHIP VISIBLE

Results Table:
  - Count updates: 892 → 156 vehicles ✅ DOUBLE-FILTERED

Statistics Panel:
  - Charts update to show Toyota vehicles 1970-1985 ✅ CHARTS UPDATED

Browser Console (Main):
  - [Discover] Received URL_PARAMS_CHANGED from pop-out
  - [ResourceManagementService] State changed
  - [Discover] Broadcasting updated state to pop-outs
  - [Discover] Sending STATE_UPDATE via BroadcastChannel
```

#### Pop-Out Windows Receive Update
```
Pop-Out Query Control URL: /panel/discover/query-control/query-control (STILL CLEAN) ✅
  - Filter chip 1: "Year: 1970 - 1985" ✅ VISIBLE
  - Filter chip 2: "Manufacturer: Toyota" ✅ VISIBLE

Pop-Out Statistics URL: /panel/discover/statistics/statistics (STILL CLEAN) ✅
  - Charts show Toyota vehicles 1970-1985 ✅ UPDATED

Pop-Out Results URL: /panel/discover/results/results (STILL CLEAN) ✅
  - Count: 156 vehicles ✅ UPDATED

Browser Console (Pop-Outs):
  - [PopOut] 🟢 Received STATE_UPDATE message
  - [QueryControl] Subscription received new state
  - [Statistics] Subscription received new state
  - [Results] Subscription received new state
  - All components re-render with updated filters ✅
```

---

### Clear All Filters (from any window)

#### Action: User Clicks "Clear Filters" in Pop-Out Query Control

#### Pop-Out Observable Changes
```
URL: /panel/discover/query-control/query-control (UNCHANGED) ✅

Query Control Panel:
  - "Active Filters:" section DISAPPEARS ✅
  - No filter chips visible

Browser Console (Pop-Out):
  - [QueryControl] Emit clearAllFilters event
  - [PanelPopout] onClearAllFilters() received
  - Send CLEAR_ALL_FILTERS to main window
```

#### Main Window Observable Changes
```
URL BEFORE: /automobiles/discover?yearMin=1970&yearMax=1985&manufacturer=Toyota
URL AFTER:  /automobiles/discover ✅ CLEANED

Query Control Panel:
  - "Active Filters:" section DISAPPEARS ✅
  - No filter chips visible

Results Table:
  - Count updates: 156 → 4,887 vehicles ✅ ALL VEHICLES SHOWN

Statistics Panel:
  - Charts reset to show all data ✅
```

#### Pop-Out Windows Receive Update
```
Pop-Out URLs: Still clean ✅

Pop-Out Query Control:
  - "Active Filters:" section DISAPPEARS ✅

Pop-Out Statistics & Results:
  - Reset to show all data ✅
```

---

## Architecture Rules (MUST BE OBEYED)

### Rule 1: URL-First State Management
- ✅ **Main window URL** is the ONLY source of truth for filter parameters
- ✅ When URL changes, ResourceManagementService fetches new data
- ✅ Pop-out URLs remain CLEAN (no query parameters)
- ✅ Pop-out state is derived from main window URL via STATE_UPDATE broadcasts

### Rule 2: BroadcastChannel as State Transport
- ✅ Main window broadcasts STATE_UPDATE when URL changes
- ✅ Pop-outs subscribe to BroadcastChannel messages
- ✅ Pop-outs update their local state from broadcasts
- ✅ NO direct @Input bindings between windows
- ✅ NO @ViewChild or direct method calls

### Rule 3: Filter Chip Rendering Logic
- ✅ **Main Window**: Reads filters from URL params via UrlStateService
  - Method: `syncFiltersFromUrl(params)` reading from `urlState.params$`
  - Source: URL query parameters

- ✅ **Pop-Out Window**: Reads filters from BroadcastChannel state
  - Method: Must subscribe to BroadcastChannel STATE_UPDATE messages
  - Must extract filters from message.payload.state.filters
  - Must convert TFilters object to URL-param-like format for rendering
  - Source: BroadcastChannel STATE_UPDATE message

### Rule 4: No Service Hacks
- ✅ ResourceManagementService remains unchanged
- ✅ UrlStateService remains unchanged
- ✅ PopOutContextService remains unchanged
- ✅ Only component-level logic changes
- ✅ All synchronization via existing BroadcastChannel mechanism

---

## Component Responsibility Matrix

| Component | Location | Responsibility | Data Source |
|-----------|----------|-----------------|-------------|
| QueryControl | Main | Render filter chips | `urlState.params$` |
| QueryControl | Pop-Out | Render filter chips | BroadcastChannel STATE_UPDATE |
| Statistics Panel | Main | Render charts | `resourceService.statistics$` |
| Statistics Panel | Pop-Out | Render charts | BroadcastChannel STATE_UPDATE |
| Results Table | Main | Show results | `resourceService.results$` |
| Results Table | Pop-Out | Show results | BroadcastChannel STATE_UPDATE |

---

## State Object Structure (Broadcast)

When main window broadcasts STATE_UPDATE, it includes:

```typescript
{
  type: PopOutMessageType.STATE_UPDATE,
  payload: {
    state: {
      filters: {
        // TFilters object - automobile domain example:
        yearMin: 1970,
        yearMax: 1985,
        manufacturer: "Toyota",
        bodyClass: ["Sedan", "SUV"],
        // ... other filter fields
      },
      results: [
        // VehicleResult[] - actual data
      ],
      totalResults: 156,
      statistics: {
        // VehicleStatistics object
      },
      loading: false,
      error: null
    }
  },
  timestamp: Date.now()
}
```

---

## Testing Checklist (DO NOT CODE UNTIL THIS IS UNDERSTOOD)

Before implementing any code changes, ensure understanding of:

- [ ] Pop-out windows cannot use @Input() bindings
- [ ] Pop-out URLs must remain clean (no query parameters)
- [ ] Filter chips must render in pop-outs despite clean URLs
- [ ] Pop-out QueryControl must subscribe to BroadcastChannel (not URL)
- [ ] When main window URL changes, pop-outs receive STATE_UPDATE
- [ ] When pop-out applies filter, main window URL updates
- [ ] Multiple pop-outs stay in sync via BroadcastChannel
- [ ] Clear All works from any window
- [ ] No modifications to ResourceManagementService
- [ ] No modifications to UrlStateService
- [ ] Only component-level changes (subscriptions, event handlers)

---

## Implementation Approach (NEXT SESSION)

1. **Understand the Rubric** (30 min)
   - Read this entire document
   - Understand what "correct behavior" looks like

2. **Identify Data Flow Gaps** (30 min)
   - How does pop-out QueryControl currently get filter info?
   - What happens when STATE_UPDATE arrives?
   - Where do filter chips get rendered from?

3. **Design Subscription Logic** (30 min)
   - Pop-out QueryControl needs to subscribe to what exactly?
   - When should subscription be set up?
   - How to convert state.filters to URL-param format?

4. **Implement Pop-Out QueryControl Changes** (60 min)
   - Add BroadcastChannel subscription in ngOnInit
   - Extract filters from STATE_UPDATE message
   - Render filter chips from extracted filters

5. **Test Against Rubric** (90 min)
   - Does pop-out URL stay clean?
   - Do filter chips render correctly?
   - Do multiple pop-outs stay in sync?
   - Do filter changes propagate correctly?

6. **Document & Commit** (30 min)
   - Update status documents
   - Commit with clear message

---

## Why Previous Attempts Failed

1. **@Input() Approach**: Cannot work - separate Angular zones
2. **urlState.setParams()**: Added query params to pop-out URLs (wrong)
3. **Hacking ResourceManagementService**: Added fragile dependencies
4. **Manual state sync**: Didn't leverage existing BroadcastChannel

**Correct Approach**: Leverage existing BroadcastChannel that already broadcasts STATE_UPDATE. Pop-out QueryControl subscribes to this message and extracts filter information from the state object payload.

---

## Key Insights

1. **State is Already Being Broadcast**: DiscoverComponent already sends STATE_UPDATE
2. **Pop-Outs Already Have ResourceManagementService**: Gets synced via syncStateFromExternal()
3. **QueryControl Already Has Filter Rendering Logic**: syncFiltersFromUrl() works perfectly
4. **All We Need**: Bridge between BroadcastChannel STATE_UPDATE and QueryControl's filter rendering

The solution is not complex. We just need to:
- Let pop-out QueryControl subscribe to BroadcastChannel messages
- When STATE_UPDATE arrives, extract state.filters
- Convert to URL-param format (using same logic as URL parsing)
- Call existing syncFiltersFromUrl() with converted params

No service hacks. No @Input bindings. Just clean subscription logic.

---

**Last Updated**: 2025-12-20
**Created For**: Session 39 Implementation Phase
**Status**: Ready for Code Changes
