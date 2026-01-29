# Implementation Plan - Session 36

**Priority Level**: Three-Phase Implementation Plan

---

## Priority 1: Panel Order Persistence via UserPreferencesService

### Objective
Users can drag-drop panels to reorder them on the discover page. This order should persist across browser sessions via localStorage. Default order provided as fallback.

### Implementation Steps

#### Phase 1.1: Create UserPreferencesService
**File**: `frontend/src/framework/services/user-preferences.service.ts`

**Responsibilities**:
- Manage user preferences stored in localStorage
- Provide RxJS observables for reactive updates
- Support multiple preference types (panelOrder, collapsed panels, theme, etc.)
- Domain-aware: preferences may differ per domain

**Key Methods**:
```typescript
class UserPreferencesService {
  // Get preferences as observable (reactive updates)
  getPreference$<T>(key: string, defaultValue: T): Observable<T>

  // Set preference (auto-saves to localStorage)
  setPreference(key: string, value: any): void

  // Get preference once (for initialization)
  getPreference<T>(key: string, defaultValue: T): T

  // Clear all preferences
  clearAll(): void

  // Check if preference exists
  hasPreference(key: string): boolean
}
```

**Storage Keys**:
- `app:panelOrder` - Array of panel IDs in order
- `app:collapsedPanels` - Map of panel ID → collapsed state
- `domain:{domainName}:preferences` - Domain-specific preferences

**Implementation Details**:
- Use RxJS BehaviorSubject internally to track changes
- Auto-serialize/deserialize JSON
- Handle localStorage errors gracefully (quota exceeded, private browsing)
- Emit changes via Observable so components can react

#### Phase 1.2: Update DiscoverComponent to Use Preferences

**File**: `frontend/src/app/features/discover/discover.component.ts`

**Changes**:
1. **Constructor**: Inject UserPreferencesService
2. **ngOnInit()**:
   - Load panelOrder from preferences (or use default)
   - Load collapsedPanels from preferences (or use empty)
3. **onPanelDrop()**:
   - Call `userPrefs.setPreference('app:panelOrder', this.panelOrder)`
   - Keep existing moveItemInArray logic
4. **onPanelCollapse()**:
   - Call `userPrefs.setPreference('app:collapsedPanels', Object.fromEntries(this.collapsedPanels))`

**Code Pattern**:
```typescript
// In ngOnInit():
const defaultOrder = ['query-control', 'manufacturer-model-picker', 'statistics-panel', 'results-table'];
this.panelOrder = this.userPrefs.getPreference('app:panelOrder', defaultOrder);

// In onPanelDrop():
moveItemInArray(this.panelOrder, event.previousIndex, event.currentIndex);
this.userPrefs.setPreference('app:panelOrder', this.panelOrder);

// In onPanelCollapse():
this.userPrefs.setPreference('app:collapsedPanels', Object.fromEntries(this.collapsedPanels));
```

#### Phase 1.3: Update app.module.ts

**File**: `frontend/src/app/app.module.ts`

**Change**: Add UserPreferencesService to providers (providedIn: 'root')
- This ensures it's a singleton across the app
- Available to all components via dependency injection

### Testing Checklist for Priority 1
- [ ] Service creates/reads from localStorage correctly
- [ ] Default panel order appears on first load
- [ ] Drag-drop reorder saves to localStorage
- [ ] Refresh page → panel order persists
- [ ] Clear localStorage → default order shows
- [ ] localStorage errors handled gracefully (quota exceeded)
- [ ] Collapse/expand state persists
- [ ] Works across multiple tabs (if BroadcastChannel support added later)

---

## Priority 2: Remove Component-Level Provider Anti-Pattern

### Objective
Remove `providers: [ResourceManagementService]` from DiscoverComponent decorator. This anti-pattern creates a new instance per component instead of using the singleton from root.

### Current Problem
```typescript
@Component({
  selector: 'app-discover',
  templateUrl: './discover.component.html',
  styleUrls: ['./discover.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [ResourceManagementService]  // ❌ ANTI-PATTERN: Creates new instance per component
})
export class DiscoverComponent { ... }
```

### Why This is an Anti-Pattern
1. **Not Truly Singleton**: Each component instance gets its own ResourceManagementService
2. **Memory Leak Risk**: Multiple instances = multiple subscriptions to state$
3. **State Isolation**: If multiple DiscoverComponents exist, they don't share state
4. **Violates Dependency Injection Hierarchy**: Overrides root-level singleton unnecessarily
5. **Testing Nightmare**: Harder to mock service in tests

### Correct Pattern
ResourceManagementService should be `providedIn: 'root'` (singleton), not at component level.

### Investigation Before Removal
**Question**: Why was this added in the first place?
- Check git blame: `git blame -L 106,106 frontend/src/app/features/discover/discover.component.ts`
- Likely reason: To isolate state per panel configuration (domain-specific)

**Solution**: If isolation is needed, that's a legitimate use case, but it should be:
1. **Documented** with a comment explaining why
2. **Intentional** and not a mistake
3. **Necessary** for the architecture to work

### Implementation Steps

#### Step 2.1: Verify No Other Components Have This Pattern
```bash
grep -r "providers.*Service" frontend/src --include="*.ts" | grep -v "spec.ts"
```
Look for other components with component-level providers.

#### Step 2.2: Remove the Provider from DiscoverComponent
**File**: `frontend/src/app/features/discover/discover.component.ts`

**Change**:
```typescript
@Component({
  selector: 'app-discover',
  templateUrl: './discover.component.html',
  styleUrls: ['./discover.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
  // providers: [ResourceManagementService]  // REMOVED: Now uses root singleton
})
```

#### Step 2.3: Verify ResourceManagementService is Singleton
**File**: `frontend/src/framework/services/resource-management.service.ts`

Confirm decorator has:
```typescript
@Injectable({
  providedIn: 'root'  // ✅ This is correct
})
```

#### Step 2.4: Test Integration
After removal:
- Run dev server: `npm run dev:server`
- Navigate to discover page
- Apply filters
- Verify state still updates correctly
- Check browser console for any service initialization errors

### Testing Checklist for Priority 2
- [ ] Component removes without compilation errors
- [ ] Dev server builds successfully
- [ ] Filters still work (Query Control, Picker, etc.)
- [ ] State updates propagate to all panels
- [ ] Pop-out windows still sync correctly
- [ ] No "Cannot find ResourceManagementService" errors in console
- [ ] Multiple panel opens don't create duplicate service instances

---

## Priority 3: Fix Dropdown Space Bar Selection (Bug #13)

### Objective
PrimeNG dropdown with `[filter]="true"` doesn't respond to Space bar for selection. Arrow keys also don't highlight options.

### Current Problem
**Component**: Query Control Manufacturer filter (p-dropdown with filter enabled)
**Behavior**:
- Mouse click works ✅
- Arrow keys DON'T highlight options ❌
- Space bar DON'T select option ❌
- Enter key doesn't work ❌

**Files Affected**:
- `frontend/src/framework/components/query-control/query-control.component.html`
- `frontend/src/framework/components/query-control/query-control.component.ts`

### Root Cause Analysis

**Hypothesis 1**: PrimeNG v14.2.3 has a bug with `[filter]="true"` + keyboard nav

**Hypothesis 2**: Missing keyboard event handlers

**Hypothesis 3**: Z-index or focus issues with filter input

### Investigation Steps

#### Step 3.1: Reproduce in Browser
1. Start dev server: `npm run dev:server`
2. Navigate to discover page
3. Click on Manufacturer filter dropdown
4. Try arrow keys → check if options highlight
5. Type a letter → check if filter works
6. Try Space bar → check if selection works
7. Open DevTools → inspect dropdown element for missing attributes

#### Step 3.2: Check PrimeNG Dropdown Documentation
- Version: 14.2.3
- Check PrimeNG release notes for keyboard nav issues
- Check if newer version (15+) fixes this

#### Step 3.3: Examine Dropdown Implementation
**Questions**:
- Is `[editable]="true"` being used? (might conflict with filter)
- Is `[showClear]="true"` affecting keyboard nav?
- Are there any custom event handlers overriding defaults?
- Is there a CSS selector preventing focus on options?

### Implementation Solutions

**Option A: PrimeNG Bug Workaround (Quick Fix)**
If it's a known PrimeNG 14.x bug:
```typescript
// In query-control.component.ts
@ViewChild('manufacturerDropdown') manufacturerDropdown: Dropdown;

onManufacturerKeydown(event: KeyboardEvent): void {
  if (event.code === 'Space') {
    event.preventDefault();
    // Trigger selection manually
    this.manufacturerDropdown.selectItem(event);
  }
}
```

**Option B: Custom Keyboard Handler**
```typescript
onDropdownKeydown(event: KeyboardEvent, dropdown: Dropdown): void {
  switch(event.code) {
    case 'ArrowDown':
      // Manually highlight next option
      break;
    case 'ArrowUp':
      // Manually highlight previous option
      break;
    case 'Space':
    case 'Enter':
      // Select current option
      break;
  }
}
```

**Option C: Use Different Filter Approach**
If filter dropdown is problematic, use `p-dropdown` + `p-inputText` for manual filtering:
```html
<input [(ngModel)]="filterText" placeholder="Search..." />
<p-dropdown [options]="filteredManufacturers$ | async" />
```

### Testing Checklist for Priority 3
- [ ] Manufacturer dropdown opens successfully
- [ ] Arrow keys highlight/navigate options
- [ ] Space bar selects option
- [ ] Enter key selects option
- [ ] Filter text input works
- [ ] Works with Body Class filter too
- [ ] No console errors
- [ ] Doesn't break mouse selection
- [ ] Tab navigation works
- [ ] Escape key closes dropdown

---

## Implementation Order

1. **Priority 1 First** (UserPreferencesService):
   - Takes 2-3 hours
   - High user value (persists UI state)
   - No dependencies on other changes
   - Low risk (isolated service)

2. **Priority 2 Second** (Remove Anti-Pattern):
   - Takes 1-2 hours
   - Code quality improvement
   - Depends on verifying Priority 1 doesn't need isolation
   - Medium risk (refactoring existing code)

3. **Priority 3 Last** (Dropdown Fix):
   - Takes 1-3 hours (investigation heavy)
   - Medium user value (UX improvement)
   - Might require PrimeNG upgrade research
   - Higher risk (if workaround breaks other dropdowns)

---

## Success Criteria

### Priority 1 ✅
- Panel order persists across page refresh
- Collapsed state persists
- Default order used if localStorage empty
- No localStorage quota errors

### Priority 2 ✅
- No component-level ResourceManagementService provider
- All tests still pass
- State management works as before
- No service initialization errors

### Priority 3 ✅
- Space bar selects dropdown option
- Arrow keys navigate options
- Works for all filter dropdowns
- No regression in mouse behavior
- No console errors

---

**Last Updated**: 2025-12-20
**Status**: Ready for Implementation
