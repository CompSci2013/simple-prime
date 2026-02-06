# Popout Implementation Status

**Date**: 2026-02-05
**Branch**: `popout`
**Status**: IN PROGRESS - Chart popout not displaying data

---

## What Was Accomplished

### 1. Library Research Complete
Created [docs/POPOUT-SOURCE-ANALYSIS.md](../POPOUT-SOURCE-ANALYSIS.md) with:
- Deep source code analysis of Golden Layout and Dockview
- Three-way comparison (Golden Layout vs Dockview vs SimplePrime)
- Assessment: SimplePrime's URL-First approach is correct
- Conclusion: `isInPopOut()` checks are necessary, not a flaw

### 2. Header Bug Fixed
- **Issue**: Popout windows showed the main app header (Home, Domains)
- **Fix**: Changed `app.component.ts` to detect popout via URL path instead of query params
- **File**: `frontend/src/app/app.component.ts`
```typescript
// Before (broken): checked query params
this.isPopOut = !!params['popout'];

// After (fixed): checks URL path
this.isPopOut = this.router.url.startsWith('/popout');
```

### 3. DomainConfig Fallback Added to Components
Components that use `@Input() domainConfig` now fall back to `DomainConfigRegistry.getActive()` when in popout:

**Fixed files**:
- `framework/components/query-control/query-control.component.ts`
- `framework/components/dynamic-results-table/dynamic-results-table.component.ts`
- `framework/components/statistics-panel-2/statistics-panel-2.component.ts`
- `framework/components/dockview-statistics-panel/dockview-statistics-panel.component.ts`

**Pattern applied**:
```typescript
ngOnInit(): void {
  // If domainConfig not provided via @Input (e.g., in popout), get from registry
  if (!this.domainConfig) {
    this.domainConfig = this.domainRegistry.getActive();
  }
  // ... rest of init
}
```

### 4. QueryControl Popout Working
- Opens correctly at `/popout/automobile-discover/query-control/query-control`
- No header shown
- Component renders properly
- No "Application Error" toast

---

## Current Bug: Chart Popout Shows "No data available"

### Symptoms
- URL: `/popout/automobile-discover/chart-year/chart`
- Chart component loads but shows "No data available"
- Console error: `BaseChartComponent: dataSource is required`

### Root Cause Analysis
`BaseChartComponent` requires two things:
1. `@Input() dataSource` - a `ChartDataSource` implementation
2. `@Input() statistics` - the data to visualize

When loaded via router-outlet in popout:
- These `@Input()` values are NOT passed
- Need to get `dataSource` from `DomainConfig.chartDataSources[chartId]`
- Need to get `statistics` from `ResourceManagementService`

### Attempted Fix (Not Working Yet)
Added fallback logic to `BaseChartComponent.ngOnInit()`:
```typescript
if (!this.dataSource && this.popOutContext?.isInPopOut() && this.route && this.domainRegistry) {
  const componentId = this.route.parent?.snapshot.paramMap.get('componentId') || '';
  const chartId = componentId.replace('chart-', '');
  this.dataSource = domainConfig.chartDataSources?.[chartId];
  // Subscribe to statistics...
}
```

### Why It's Not Working
Debug logs show the condition is failing. Either:
1. `popOutContext?.isInPopOut()` returns false
2. Or one of the `@Optional()` injected services is null

### Debug Logs Added
Added console logging to `BaseChartComponent.ngOnInit()`:
```typescript
console.log('[BaseChart] ngOnInit - dataSource:', !!this.dataSource);
console.log('[BaseChart] ngOnInit - popOutContext:', !!this.popOutContext);
console.log('[BaseChart] ngOnInit - isInPopOut:', this.popOutContext?.isInPopOut());
console.log('[BaseChart] ngOnInit - URL:', window.location.pathname);
```

**Next step**: Run test to see these logs and determine which condition is failing.

---

## Files Modified This Session

1. `frontend/src/app/app.component.ts` - Fixed isPopOut detection
2. `frontend/src/framework/components/query-control/query-control.component.ts` - Added DomainConfigRegistry fallback
3. `frontend/src/framework/components/dynamic-results-table/dynamic-results-table.component.ts` - Added DomainConfigRegistry fallback
4. `frontend/src/framework/components/statistics-panel-2/statistics-panel-2.component.ts` - Added DomainConfigRegistry fallback
5. `frontend/src/framework/components/dockview-statistics-panel/dockview-statistics-panel.component.ts` - Added DomainConfigRegistry fallback
6. `frontend/src/framework/components/base-chart/base-chart.component.ts` - Added popout fallback (NOT WORKING YET)
7. `frontend/playwright.config.ts` - Changed port from 4205 to 4200
8. `docs/POPOUT-SOURCE-ANALYSIS.md` - Created with library comparison
9. `docs/claude/POPOUT-LIBRARY-REFERENCE.md` - Deleted (superseded)

---

## Test Files Created

- `frontend/e2e/debug-popout.spec.ts` - Basic popout visual inspection
- `frontend/e2e/debug-popout-sync.spec.ts` - Sync testing (main↔popout)
- `frontend/e2e/debug-chart-popout.spec.ts` - Chart popout specific
- `frontend/e2e/debug-chart-popout-logs.spec.ts` - Chart with console log capture
- `frontend/e2e/debug-popout-full.spec.ts` - Full UI interaction test

---

## Next Steps for New Session

1. **Debug BaseChartComponent condition failure**
   - Run `npx playwright test e2e/debug-chart-popout-logs.spec.ts`
   - Check which condition is false: `popOutContext`, `isInPopOut()`, `route`, or `domainRegistry`

2. **Fix the failing condition**
   - If `isInPopOut()` is false: check `PopOutContextService` URL detection
   - If services are null: may need to remove `@Optional()` or check provider hierarchy

3. **Test main↔popout sync**
   - Once chart displays data, test STATE_UPDATE message flow
   - Main window should broadcast state on `PANEL_READY`
   - Popout should receive and update `ResourceManagementService`

4. **Remaining components to verify**
   - Picker popout
   - Results table popout
   - Statistics panel popout

5. **Document final architecture**
   - Update docs once everything works

---

## Architecture Summary

```
Main Window                          Popout Window
─────────────────                    ─────────────────
AutomobileDiscoverComponent          PopoutComponent
├── ResourceManagementService        ├── ResourceManagementService (own instance)
├── PopOutManagerService             ├── IS_POPOUT_TOKEN = true
│   ├── Opens window.open()          └── <router-outlet>
│   ├── Creates BroadcastChannel         └── QueryControlComponent
│   └── Listens for messages                 or BaseChartComponent
│                                            or DynamicResultsTable
│                                            etc.
└── On state change:
    broadcastState() → BroadcastChannel → popout receives STATE_UPDATE
```

**Key insight**: Each popout has its own `ResourceManagementService` instance that must be populated via `STATE_UPDATE` messages from the main window.
