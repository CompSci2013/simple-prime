# Development Decision Tree

**Purpose**: Quick decision-making guide for common implementation scenarios.

**How to use**: Start at the top, answer YES/NO questions, follow the arrows.

---

## Decision Tree 1: How Do I Subscribe to State?

```
START: I need to read filters, results, or statistics
│
├─ Q1: Will this component be used in pop-out windows?
│  │
│  ├─ YES → Q2: Can I inject ResourceManagementService?
│  │  │
│  │  ├─ YES → ✅ USE: ResourceManagementService.filters$ / results$ / statistics$
│  │  │         Pattern:
│  │  │           constructor(
│  │  │             @Optional() @Inject(RESOURCE_MANAGEMENT_SERVICE)
│  │  │             private resourceService?: ResourceManagementService
│  │  │           ) {}
│  │  │
│  │  │           ngOnInit() {
│  │  │             if (this.resourceService) {
│  │  │               this.resourceService.filters$.subscribe(...)
│  │  │             } else {
│  │  │               // Fallback for legacy mode
│  │  │               this.urlState.params$.subscribe(...)
│  │  │             }
│  │  │           }
│  │  │
│  │  │         Why: Pop-outs have no URL params. State comes via BroadcastChannel.
│  │  │         Bugs prevented: Query Control chips missing (#4)
│  │  │
│  │  └─ NO → ⚠️  REFACTOR: Component must support optional injection
│  │               Otherwise it won't work in pop-outs
│  │
│  └─ NO → Q3: Is this a legacy component (before ResourceManagementService)?
│     │
│     ├─ YES → ✅ USE: UrlStateService.params$
│     │         Pattern:
│     │           this.urlState.params$.subscribe(params => ...)
│     │
│     │         Note: Consider migrating to ResourceManagementService
│     │
│     └─ NO → ✅ USE: ResourceManagementService.filters$ / results$ / statistics$
│               Pattern:
│                 constructor(
│                   @Inject(RESOURCE_MANAGEMENT_SERVICE)
│                   private resourceService: ResourceManagementService
│                 ) {}
│
│                 ngOnInit() {
│                   this.resourceService.filters$.subscribe(...)
│                 }
```

---

## Decision Tree 2: How Do I Handle Pagination?

```
START: I'm implementing a paginated table/picker
│
├─ Q1: Do users select items across multiple pages?
│  │
│  ├─ YES → ✅ IMPLEMENT: Selection caching
│  │         Pattern:
│  │           private hydrateSelections(keys: string[]): void {
│  │             // 1. Update selectedKeys set
│  │             this.state.selectedKeys = new Set<string>(keys);
│  │
│  │             // 2. Build cache of existing selections
│  │             const existingItemsByKey = new Map<string, T>();
│  │             this.state.selectedItems.forEach(item => {
│  │               const key = this.config.row.keyGenerator(item);
│  │               existingItemsByKey.set(key, item);
│  │             });
│  │
│  │             // 3. Merge current page data with cache
│  │             const newSelectedItems: T[] = [];
│  │             keys.forEach(key => {
│  │               const itemInCurrentPage = this.state.data.find(...);
│  │               if (itemInCurrentPage) {
│  │                 newSelectedItems.push(itemInCurrentPage);
│  │               } else if (existingItemsByKey.has(key)) {
│  │                 newSelectedItems.push(existingItemsByKey.get(key)!);
│  │               }
│  │             });
│  │
│  │             this.state.selectedItems = newSelectedItems;
│  │           }
│  │
│  │         Why: Without caching, selections on non-visible pages are lost
│  │         Bugs prevented: Selection dropping (#1)
│  │
│  └─ NO → SKIP to Q2
│
├─ Q2: Can data loading trigger UI events (pagination, sort, filter)?
│  │
│  ├─ YES → ✅ ADD: Loading state guard
│  │         Pattern:
│  │           onPageChange(event: any): void {
│  │             // Guard against concurrent operations
│  │             if (this.state.loading) {
│  │               console.warn('Ignoring event while loading');
│  │               return;
│  │             }
│  │
│  │             this.state.currentPage = event.first / event.rows;
│  │             this.loadData();
│  │           }
│  │
│  │         Apply to: onPageChange, onSort, onFilter, etc.
│  │
│  │         Why: Hydration can trigger PrimeNG events, causing race conditions
│  │         Bugs prevented: Pagination stuck (#2)
│  │
│  └─ NO → DONE
```

---

## Decision Tree 3: Pop-Out Message Handling

```
START: I need to handle messages from pop-out windows
│
├─ Q1: What type of message?
│  │
│  ├─ PANEL_READY (pop-out initialized) → ✅ DO: Broadcast current state immediately
│  │                                        Pattern:
│  │                                          case PopOutMessageType.PANEL_READY:
│  │                                            // Get current value (don't wait for change)
│  │                                            const currentState = this.resourceService.getCurrentState();
│  │                                            this.broadcastStateToPopOuts(currentState);
│  │                                            break;
│  │
│  │                                        Why: state$ subscription only fires on CHANGES
│  │                                        Bugs prevented: Pop-out missing initial state (#3)
│  │
│  ├─ PICKER_SELECTION_CHANGE → ✅ DO: Update main window URL
│  │                             Pattern:
│  │                               case PopOutMessageType.PICKER_SELECTION_CHANGE:
│  │                                 this.onPickerSelectionChangeAndUpdateUrl(message.payload);
│  │                                 break;
│  │
│  │                             Flow: Pop-out sends message → Main window updates URL
│  │                                   → ResourceManagementService updates state
│  │                                   → state$ emits → broadcast to pop-outs
│  │
│  ├─ URL_PARAMS_CHANGED → ⚠️  DEPRECATED: Use specific action messages instead
│  │                        (PICKER_SELECTION_CHANGE, FILTER_ADD, FILTER_REMOVE)
│  │
│  └─ CLOSE_POPOUT → ✅ DO: Close window
│                     Pattern:
│                       case PopOutMessageType.CLOSE_POPOUT:
│                         window.close();
│                         break;
```

---

## Decision Tree 4: When to Use getCurrentState() vs Observable Subscription

```
START: I need to access state
│
├─ Q1: Do I need the value RIGHT NOW (immediately)?
│  │
│  ├─ YES → Q2: Why do I need it immediately?
│  │  │
│  │  ├─ Broadcasting to new pop-out (PANEL_READY) → ✅ USE: getCurrentState()
│  │  │                                                Pattern:
│  │  │                                                  const state = this.resourceService.getCurrentState();
│  │  │                                                  this.broadcastStateToPopOuts(state);
│  │  │
│  │  │                                                Why: state$ subscription won't fire if no change
│  │  │                                                Bugs prevented: Pop-out missing initial state (#3)
│  │  │
│  │  ├─ Synchronous method needs current value → ✅ USE: getCurrentState()
│  │  │                                            Example:
│  │  │                                              getCurrentFilters(): TFilters {
│  │  │                                                return this.resourceService.getCurrentState().filters;
│  │  │                                              }
│  │  │
│  │  └─ Initial render needs value → ✅ USE: Observable with async pipe
│  │                                   Pattern:
│  │                                     filters$ = this.resourceService.filters$;
│  │                                     <div>{{ filters$ | async }}</div>
│  │
│  └─ NO → Q3: Do I need to react to changes over time?
│     │
│     ├─ YES → ✅ USE: Observable subscription
│     │         Pattern:
│     │           this.resourceService.filters$
│     │             .pipe(takeUntil(this.destroy$))
│     │             .subscribe(filters => {
│     │               this.syncFiltersFromUrl(filters);
│     │               this.cdr.markForCheck();
│     │             });
│     │
│     │         Why: Automatically updates when state changes
│     │
│     └─ NO → ✅ USE: getCurrentState() for one-time reads
```

---

## Decision Tree 5: Change Detection Strategy

```
START: Should I use OnPush change detection?
│
├─ Q1: Is this a frequently-rendered component (inside loops, tables)?
│  │
│  ├─ YES → ✅ USE: OnPush (performance benefit)
│  │         Setup:
│  │           @Component({
│  │             changeDetection: ChangeDetectionStrategy.OnPush
│  │           })
│  │
│  │         → CONTINUE to Q2
│  │
│  └─ NO → Q2: Does this component have complex state logic?
│     │
│     ├─ YES → ✅ USE: OnPush (explicit control over updates)
│     │         → CONTINUE to Q2
│     │
│     └─ NO → ✅ USE: Default (simpler, automatic updates)
│               DONE
│
├─ Q2: Using OnPush - Do I mutate state directly?
│  │
│  ├─ YES → ✅ MUST: Call markForCheck() after mutations
│  │         Pattern:
│  │           this.state.selectedItems = newItems;
│  │           this.cdr.markForCheck();  // REQUIRED!
│  │
│  │         Common locations:
│  │           - After array mutations (push, splice, etc.)
│  │           - After object property updates
│  │           - In async callbacks (subscribe, setTimeout, etc.)
│  │           - In BroadcastChannel handlers
│  │
│  └─ NO → ✅ VERIFY: Using immutable patterns?
│            Pattern:
│              // Create new reference
│              this.state.selectedItems = [...this.state.selectedItems, newItem];
│              // OnPush detects reference change automatically
```

---

## Decision Tree 6: Observable Cleanup

```
START: I'm subscribing to an observable in ngOnInit
│
├─ Q1: Is this subscription long-lived (component lifecycle)?
│  │
│  ├─ YES → ✅ USE: takeUntil(destroy$) pattern
│  │         Setup:
│  │           export class MyComponent implements OnInit, OnDestroy {
│  │             private destroy$ = new Subject<void>();
│  │
│  │             ngOnInit() {
│  │               this.someService.observable$
│  │                 .pipe(takeUntil(this.destroy$))
│  │                 .subscribe(...);
│  │             }
│  │
│  │             ngOnDestroy() {
│  │               this.destroy$.next();
│  │               this.destroy$.complete();
│  │             }
│  │           }
│  │
│  │         Why: Prevents memory leaks
│  │
│  ├─ NO → Q2: Is this a one-time operation (take(1))?
│  │  │
│  │  ├─ YES → ✅ USE: take(1) or first()
│  │  │         Pattern:
│  │  │           this.apiService.fetchData()
│  │  │             .pipe(take(1))
│  │  │             .subscribe(...);
│  │  │
│  │  │         Auto-completes after first emission
│  │  │
│  │  └─ NO → ✅ USE: async pipe in template (auto-cleanup)
│  │            Pattern:
│  │              data$ = this.service.getData();
│  │              <div>{{ data$ | async }}</div>
│  │
│  └─ Q3: Do I still have takeUntil even with take(1)?
│     │
│     ├─ YES → ⚠️  REDUNDANT: Remove takeUntil
│     │         take(1) already completes the subscription
│     │
│     └─ NO → ✅ CORRECT
```

---

## Quick Reference: Common Scenarios

### Scenario 1: Implementing a New Picker
```
1. Does it need selections across pages? → YES
   └─ Implement selection caching (Tree 2, Q1)

2. Can loading trigger UI events? → YES
   └─ Add loading state guard (Tree 2, Q2)

3. Will it be used in pop-outs? → YES
   └─ Inject ResourceManagementService (Tree 1, Q1)
   └─ Subscribe to filters$ (Tree 1, Q1)

4. Using OnPush? → YES
   └─ Add markForCheck() calls (Tree 5, Q2)
```

### Scenario 2: Implementing Query Control Panel
```
1. Will it be used in pop-outs? → YES
   └─ Inject ResourceManagementService (Tree 1, Q1)
   └─ Subscribe to filters$ NOT params$ (Tree 1, Q1)

2. Does it send state changes? → YES
   └─ Send action messages (FILTER_ADD, etc.) (Tree 3)

3. Does it need initial state when popped out? → YES
   └─ Send PANEL_READY message (Tree 3, PANEL_READY)
```

### Scenario 3: Handling PANEL_READY in Main Window
```
1. Do I need current value immediately? → YES
   └─ Use getCurrentState() (Tree 4, Q1)

2. Should I also broadcast on state changes? → YES
   └─ Subscribe to state$ (Tree 4, Q3)
   └─ Both patterns needed for complete solution!
```

---

## Anti-Patterns to Avoid

| ❌ Anti-Pattern | ✅ Correct Pattern | Decision Tree Reference |
|----------------|-------------------|------------------------|
| `this.urlState.params$.subscribe(...)` (in pop-out component) | `this.resourceService.filters$.subscribe(...)` | Tree 1, Q1 |
| Rely on `state$` subscription for PANEL_READY | Use `getCurrentState()` | Tree 4, Q1 |
| Clear selections array without caching | Implement Map-based caching | Tree 2, Q1 |
| No loading guard in `onPageChange` | Add `if (loading) return` | Tree 2, Q2 |
| OnPush + mutation without `markForCheck()` | Call `markForCheck()` after mutation | Tree 5, Q2 |
| No `takeUntil` cleanup | Add `destroy$` pattern | Tree 6, Q1 |
