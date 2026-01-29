# Development Rubric

**Purpose**: Checklist-based verification for implementing components and features.

**When to use**: Review this checklist BEFORE writing code and DURING code review.

---

## 1. State Management

### 1.1 Component Subscribes to State

**Question**: Does this component need to read filters, results, or statistics?

- [ ] **YES** → Subscribe to `ResourceManagementService` observables (`filters$`, `results$`, `statistics$`)
- [ ] **NO** → Skip to next section

**Anti-Pattern**:
```typescript
// ❌ WRONG - Breaks in pop-outs (no URL params)
this.urlState.params$.subscribe(params => {
  this.activeFilters = this.parseFilters(params);
});
```

**Correct Pattern**:
```typescript
// ✅ CORRECT - Works in both main window and pop-outs
if (this.resourceService) {
  this.resourceService.filters$.subscribe(filters => {
    this.activeFilters = this.parseFilters(filters);
  });
} else {
  // Fallback for legacy mode
  this.urlState.params$.subscribe(params => {
    this.activeFilters = this.parseFilters(params);
  });
}
```

**Why**: Pop-out URLs have no query params (`/panel/discover/query-control/query-control`). State comes via BroadcastChannel → ResourceManagementService.

**Bugs Prevented**: Query Control chips missing in pop-outs (#4)

---

### 1.2 Component Updates State

**Question**: Does this component need to change filters or trigger data refresh?

- [ ] **YES** → Call `ResourceManagementService.updateFilters()` or `UrlStateService.setParams()`
- [ ] **NO** → Skip to next section

**Pattern**:
```typescript
// Update filters (triggers URL update → data fetch)
this.resourceService.updateFilters({
  manufacturer: 'Ford',
  yearMin: 2020
});

// OR for direct URL update (picker selections, pagination)
this.urlState.setParams({
  modelCombos: 'Ford:F-150,RAM:1500',
  page: 1
});
```

**Why**: Main window URL is single source of truth. Changes propagate: URL → ResourceManagementService → state$ → all subscribers (including pop-outs).

---

## 2. Pop-Out Window Compatibility

### 2.1 Component Can Be Popped Out

**Question**: Will this component be rendered in a pop-out window?

- [ ] **YES** → Follow pop-out compatibility checklist below
- [ ] **NO** → Skip to next section

**Pop-Out Compatibility Checklist**:

- [ ] **Inject ResourceManagementService** (optional injection with `@Optional()`)
  ```typescript
  constructor(
    @Optional() @Inject(RESOURCE_MANAGEMENT_SERVICE)
    private resourceService?: ResourceManagementService<TFilters, TData, TStatistics>
  ) {}
  ```

- [ ] **Subscribe to ResourceManagementService observables** (NOT URL params)
  ```typescript
  // ✅ Works in pop-outs
  this.resourceService.filters$.subscribe(...)

  // ❌ Breaks in pop-outs
  this.urlState.params$.subscribe(...)
  ```

- [ ] **Send action messages to main window** (for state changes)
  ```typescript
  // Picker selection
  this.popOutContext.sendMessage({
    type: PopOutMessageType.PICKER_SELECTION_CHANGE,
    payload: event,
    timestamp: Date.now()
  });
  ```

- [ ] **Send PANEL_READY on initialization** (to receive initial state)
  ```typescript
  ngOnInit(): void {
    if (this.popOutContext.isPopOut()) {
      this.popOutContext.sendMessage({
        type: PopOutMessageType.PANEL_READY,
        timestamp: Date.now()
      });
    }
  }
  ```

**Why**: Pop-outs receive state via BroadcastChannel, not URL. Must use ResourceManagementService observables.

**Bugs Prevented**: Picker selections missing (#3), Query Control chips missing (#4)

---

### 2.2 Main Window Broadcasts State

**Question**: Does main window need to send state to pop-outs?

- [ ] **PANEL_READY handler** → Broadcast current state immediately
  ```typescript
  case PopOutMessageType.PANEL_READY:
    const currentState = this.resourceService.getCurrentState();
    this.broadcastStateToPopOuts(currentState);
    break;
  ```

- [ ] **state$ subscription** → Broadcast on every state change
  ```typescript
  this.resourceService.state$
    .pipe(takeUntil(this.destroy$))
    .subscribe(state => {
      this.broadcastStateToPopOuts(state);
    });
  ```

**Why**: `state$` subscription only fires on changes, not initial subscription. Must explicitly broadcast on PANEL_READY.

**Bugs Prevented**: Pop-out missing initial state (#3)

---

## 3. Pagination & Multi-Page State

### 3.1 Selections Across Pages

**Question**: Does this component maintain selections across paginated data?

- [ ] **YES** → Implement selection caching
- [ ] **NO** → Skip to next section

**Required Pattern**:
```typescript
// When hydrating selections from URL/state
private hydrateSelections(keys: string[]): void {
  // 1. Update selectedKeys set
  this.state.selectedKeys = new Set<string>(keys);

  // 2. Build cache of existing selections BY KEY
  const existingItemsByKey = new Map<string, T>();
  this.state.selectedItems.forEach(item => {
    const key = this.config.row.keyGenerator(item);
    existingItemsByKey.set(key, item);
  });

  // 3. Merge current page data with cached selections
  const newSelectedItems: T[] = [];
  keys.forEach(key => {
    // Try current page first (fresh data)
    const itemInCurrentPage = this.state.data.find(
      row => this.config.row.keyGenerator(row) === key
    );

    if (itemInCurrentPage) {
      newSelectedItems.push(itemInCurrentPage);
    } else if (existingItemsByKey.has(key)) {
      // Fall back to cache (previous pages)
      newSelectedItems.push(existingItemsByKey.get(key)!);
    }
  });

  this.state.selectedItems = newSelectedItems;
}
```

**Why**: When user selects items on page 1, navigates to page 2, and selects more:
- URL has all keys: "A,B,C,D,E,F"
- Current page data only has: [D, E, F]
- Without caching: selectedItems = [D, E, F] (A, B, C lost!)
- With caching: selectedItems = [A, B, C, D, E, F] ✅

**Bugs Prevented**: Selection dropping across pages (#1)

---

### 3.2 Race Conditions During Loading

**Question**: Can async operations (data loading, hydration) trigger UI events?

- [ ] **YES** → Add loading state guards
- [ ] **NO** → Skip to next section

**Required Pattern**:
```typescript
onPageChange(event: any): void {
  // Guard: Ignore events while loading
  if (this.state.loading) {
    console.warn('[Component] Ignoring event while loading', event);
    return;
  }

  this.state.currentPage = event.first / event.rows;
  this.loadData();
}
```

**Common Scenarios Requiring Guards**:
- Pagination controls (`onPageChange`)
- Sort controls (`onSort`)
- Filter controls (`onFilterChange`)
- Selection controls (`onRowSelectionChange`)

**Why**: When data loads, hydration updates `selectedItems`, which can trigger PrimeNG to fire events (e.g., pagination change). Without guards, this creates cascading API calls.

**Example Failure**:
1. User clicks page 4 → `onPageChange` fires → API call for page 4
2. Page 4 data loads → `hydrateSelections()` updates `selectedItems`
3. PrimeNG detects selection change → fires `onPageChange` again → API call for page 3
4. Result: Two API calls, stuck on page 3

**Bugs Prevented**: Pagination stuck on page 3 (#2)

---

## 4. Observable Patterns

### 4.1 Need Current Value vs Changes

**Question**: Do you need the current value immediately, or only future changes?

**Decision Tree**:

```
Need current value immediately?
├─ YES → Use getCurrentState() or BehaviorSubject.getValue()
│         Example: PANEL_READY handler broadcasting initial state
│
└─ NO → Subscribe to observable (fires on changes only)
          Example: state$ subscription for ongoing updates
```

**Example - PANEL_READY Handler**:
```typescript
// ❌ WRONG - state$ subscription won't fire if state hasn't changed
case PopOutMessageType.PANEL_READY:
  // Nothing happens! state$ only fires on CHANGES
  break;

// ✅ CORRECT - Get current value and broadcast
case PopOutMessageType.PANEL_READY:
  const currentState = this.resourceService.getCurrentState();
  this.broadcastStateToPopOuts(currentState);
  break;
```

**Why**: RxJS BehaviorSubject stores current value but subscription only fires on changes. Use `getValue()` or `getCurrentState()` when you need the value NOW.

**Bugs Prevented**: Pop-out missing initial state (#3)

---

### 4.2 Prevent Duplicate Emissions

**Question**: Can the observable emit duplicate values?

- [ ] **YES** → Use `distinctUntilChanged()`
- [ ] **NO** → Skip

**Pattern**:
```typescript
this.resourceService.filters$
  .pipe(
    distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)),
    takeUntil(this.destroy$)
  )
  .subscribe(filters => { ... });
```

**Why**: Prevents unnecessary re-renders and API calls when state hasn't actually changed.

---

## 5. Change Detection

### 5.1 OnPush Components

**Question**: Does this component use `ChangeDetectionStrategy.OnPush`?

- [ ] **YES** → Follow OnPush checklist below
- [ ] **NO** → Skip to next section

**OnPush Checklist**:

- [ ] **Call markForCheck() after mutations**
  ```typescript
  this.state.selectedItems = newItems;
  this.cdr.markForCheck();  // REQUIRED!
  ```

- [ ] **Call markForCheck() in async callbacks**
  ```typescript
  this.apiService.fetchData().subscribe(data => {
    this.data = data;
    this.cdr.markForCheck();  // REQUIRED!
  });
  ```

- [ ] **Call markForCheck() in BroadcastChannel handlers**
  ```typescript
  channel.onmessage = (event) => {
    this.ngZone.run(() => {
      this.handleMessage(event.data);
      this.cdr.markForCheck();  // REQUIRED!
    });
  };
  ```

**Why**: OnPush components only update when:
1. Input changes (reference change)
2. Event handler fires
3. Observable emits
4. `markForCheck()` is called

Without `markForCheck()`, UI won't update after manual mutations.

---

## 6. Memory Management

### 6.1 Subscription Cleanup

**Question**: Does this component subscribe to observables?

- [ ] **YES** → Use `takeUntil(this.destroy$)` pattern
- [ ] **NO** → Skip

**Required Pattern**:
```typescript
export class MyComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.someService.someObservable$
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => { ... });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
```

**Why**: Prevents memory leaks and unexpected behavior after component destruction.

---

## 7. Pre-Implementation Checklist

**Before writing ANY component, answer these questions**:

### Component Type
- [ ] Is this a stateful component? (reads filters/results/statistics)
- [ ] Is this a stateless presentation component?
- [ ] Can this be popped out to a separate window?
- [ ] Does this manage paginated data?
- [ ] Does this maintain selections across pages?

### State Management
- [ ] What observables will I subscribe to?
  - [ ] `ResourceManagementService.filters$`
  - [ ] `ResourceManagementService.results$`
  - [ ] `ResourceManagementService.statistics$`
  - [ ] `ResourceManagementService.state$`
  - [ ] `UrlStateService.params$` (legacy only)

- [ ] How will I update state?
  - [ ] `ResourceManagementService.updateFilters()`
  - [ ] `UrlStateService.setParams()`
  - [ ] Send BroadcastChannel message (pop-outs)

### Pop-Out Compatibility
- [ ] Will this component work in pop-outs?
- [ ] Do I need optional `ResourceManagementService` injection?
- [ ] Do I need to send PANEL_READY message?
- [ ] Do I need to send action messages (PICKER_SELECTION_CHANGE, etc.)?

### Pagination & Async
- [ ] Does this component handle pagination?
- [ ] Do I need selection caching?
- [ ] Do I need loading state guards?
- [ ] Can async operations trigger UI events?

### Change Detection
- [ ] Am I using OnPush?
- [ ] Have I added `markForCheck()` after mutations?
- [ ] Have I added `markForCheck()` in async callbacks?

---

## 8. Code Review Checklist

**When reviewing code, verify**:

### State Management
- [ ] Components subscribe to `ResourceManagementService`, NOT `UrlStateService.params$`
- [ ] Pop-out components use optional `ResourceManagementService` injection
- [ ] PANEL_READY handler calls `getCurrentState()` (not just relying on `state$` subscription)

### Pagination
- [ ] Selection hydration preserves items from non-visible pages
- [ ] Event handlers have loading state guards
- [ ] No risk of race conditions or cascading API calls

### Observables
- [ ] Subscriptions use `takeUntil(this.destroy$)`
- [ ] `distinctUntilChanged()` used where appropriate
- [ ] Correct choice between `getValue()` vs subscription

### Change Detection
- [ ] `markForCheck()` called after mutations (OnPush components)
- [ ] `markForCheck()` called in async callbacks (OnPush components)
- [ ] BroadcastChannel handlers run in NgZone

---

## Summary: The 4 Bugs We Fixed

| Bug | Root Cause | Prevention Checklist |
|-----|------------|---------------------|
| **Selection dropping** | Hydration cleared cache, only searched current page | §3.1 - Selection caching pattern |
| **Pagination stuck** | Race condition, no loading guard | §3.2 - Loading state guards |
| **Pop-out missing state** | Relied on `state$` subscription (changes only) | §4.1 - Use `getCurrentState()` for initial value |
| **Query Control chips missing** | Watched `params$` instead of `filters$` | §1.1 - Subscribe to ResourceManagementService, §2.1 - Pop-out compatibility |

---

**Next Steps**:
1. Review this rubric before implementing any component
2. Use decision tree and flow chart as quick references
3. Include this checklist in PR templates
4. Update rubric as new patterns emerge
