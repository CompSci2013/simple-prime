# Bug Assessment: Cross-Project Comparison (Project A vs Project B)

**Date**: 2025-12-01
**Session**: Verified source code comparison - CORRECTED after validation
**Scope**: Identify non-Dockview bugs fixed in Project B that need to be applied to Project A

---

## Key Finding: PROJECTS ARE ARCHITECTURALLY DIVERGENT

After examining actual source code (not assumptions from STATUS documents):

- **Project A**: Uses Angular CDK `drag-drop` for panel layout management
- **Project B**: Uses `dockview-core` library for full-page layout management

This fundamental architectural difference means the projects are no longer directly comparable for "bug fixes" - they're solving the same UI problem with different frameworks.

---

## Source Code Verification

### Confirmed Differences

**1. discover.component.html**
- **Project A (lines 7-107)**: Uses `<div cdkDropList>` wrapper with `*ngFor` over `panelOrder[]` array, each panel wrapped in `<div cdkDrag>`
- **Project B (lines 7-10)**: Uses `<div #dockviewContainer class="dockview-container">` - dockview manages everything

**2. app.module.ts**
- **Project A**: Imports `DragDropModule` from `@angular/cdk/drag-drop`
- **Project B**: Does NOT import DragDropModule (removed, uses dockview instead)

**3. discover.component.ts**
- Will have significant differences in panel management logic

### NOT Verified as Bugs

**Statistics Panel**:
- Neither current Project A nor Project B has an embedded statistics panel in `results-table.component.html`
- Both files end identically with no statistics-related code
- STATUS-HISTORY.md documented a fix for this, but it appears to have been applied to both projects already
- **User reports**: "I do not see this repeated statistics panel you speak of" in the running application
- **Conclusion**: Either this was already fixed in both, or the STATUS document is stale

**Debug Code**:
- No `debugUrlState` property found in either discover.component.ts
- **Conclusion**: Already removed from both or never existed in current branch

---

## Analysis: Why Comparison is Difficult

The fork commit `fb94fd3` was meant to create a dockview variant, but the branching strategy makes it problematic:

1. **Before fork**: Both projects shared identical code
2. **After fork**: Project B added dockview (changing the entire architecture)
3. **Currently**: Project A and B have completely different component structures
4. **Problem**: Any bug "fixed" after the fork in Project B is embedded in dockview-specific code

### Example
If Project B fixed a bug in picker interaction, the fix is likely in:
- `framework/components/dockview-panels/picker-panel.component.ts` (doesn't exist in A)
- Rather than in the shared `base-picker.component.ts` (which both use)

---

## Recommendations

### Option 1: Compare BEFORE Fork
Look at commits in the shared history BEFORE `fb94fd3`. Find bugs that were fixed in Project A AFTER the fork, and apply them to Project B.

### Option 2: Compare Shared Components Only
Identify which components are shared between both projects (picker, query-control, base-chart, statistics panel) and check if any bug fixes were applied to those ONLY in Project B.

### Option 3: Accept the Architectural Divergence
Projects A and B have diverged too much to be easily synchronized. Future bug fixes should be coordinated at the time they're made, not retroactively.

---

## Deliverable

No actionable bugs identified for direct porting based on:
1. **Verification against source code**: No embedded statistics panel observed in either project
2. **User report**: UI not showing reported duplicate panels
3. **Architecture mismatch**: Projects use different layout frameworks (CDK vs dockview)

**Recommendation**: Before proceeding with fixes, clarify:
- What bugs actually exist in Project A TODAY (from running application)
- Whether comparison should be based on shared framework components only
- Whether Project B is still intended to stay synchronized with Project A

---

**Status**: Assessment requires clarification from user
