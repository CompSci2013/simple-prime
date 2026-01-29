# Fix Visual Bugs

**Cline command for fixing visual bugs detected by the pipeline.**

---

## Directive

Read and fix bugs from the visual testing pipeline report.

---

## Process

### 1. Load Bug Report

Read `frontend/reports/bug-reports/current-bugs.json` to get the list of active bugs.

### 2. For Each Bug with status "open" or "fixing"

Analyze the bug details:
- **bug_id**: Unique identifier
- **severity**: critical | high | medium | low
- **category**: layout | state | data | visual | sync
- **component**: Which Angular component is affected
- **description**: What's wrong
- **expected**: What should happen
- **actual**: What actually happens
- **screenshot_path**: Path to the screenshot showing the issue
- **suggested_fix**: High-level fix approach

### 3. Generate and Apply Fixes

For each bug:

1. **Read the screenshot** at `screenshot_path` to understand the visual issue
2. **Find the component** using the component name and category
3. **Apply the fix** following these patterns:

#### Common Fix Patterns

**Sync Issues** (`category: "sync"`):
- Check BroadcastChannel message handling in pop-out components
- Verify `STATE_UPDATE` messages are being sent when filters change
- Ensure `detectChanges()` is called after state updates (OnPush detection)

**Layout Issues** (`category: "layout"`):
- Check CSS flex/grid properties
- Verify responsive breakpoints
- Check z-index conflicts

**State Issues** (`category: "state"`):
- Check URL state synchronization via UrlStateService
- Verify signal updates trigger UI refresh
- Check for stale subscription data

**Data Issues** (`category: "data"`):
- Check Elasticsearch query parameters
- Verify filter chip state matches URL params
- Check results count display logic

**Visual Issues** (`category: "visual"`):
- Check PrimeNG component configurations
- Verify theme/style imports
- Check for missing icons or assets

### 4. Signal Completion

After applying all fixes:

```bash
touch frontend/reports/bug-reports/fixes-applied.flag
```

This signals the pipeline orchestrator that fixes are ready for verification.

---

## Key Files Reference

- **URL State**: `frontend/src/app/core/services/url-state.service.ts`
- **Resource Management**: `frontend/src/app/core/services/resource-management.service.ts`
- **Pop-out Communication**: Components using `BroadcastChannel`
- **Results Table**: `frontend/src/app/shared/components/basic-results-table/`
- **Statistics Panel**: `frontend/src/app/shared/components/statistics-panel/`
- **Query Control**: `frontend/src/app/shared/components/query-control-panel/`

---

## Constraints

- Use UrlStateService for all URL navigation (never `router.navigate()` directly)
- Use `detectChanges()` not `markForCheck()` for pop-out window updates
- Follow existing code patterns in the component being fixed
- Do not introduce new dependencies without necessity

---

## Example Bug Entry

```json
{
  "bug_id": "BUG-SYNC-001",
  "severity": "high",
  "category": "sync",
  "component": "statistics-panel",
  "description": "Pop-out statistics shows stale data after filter applied in main window",
  "expected": "Statistics should show 849 records matching Chevrolet filter",
  "actual": "Statistics shows 4887 records (total, ignoring filter)",
  "screenshot_id": "12-popout-synced",
  "screenshot_path": "screenshots/captures/12-popout-synced.png",
  "suggested_fix": "Verify BroadcastChannel STATE_UPDATE is sent when filters change",
  "fix_attempts": 0,
  "status": "open"
}
```

---

**After completing all fixes, always create the flag file to trigger verification.**
