# Dockview Popout Considerations

## Overview

This document addresses the potential conflict between the application's custom PopOutManagerService and Dockview's built-in popout capabilities.

## Two Popout Systems

### 1. Custom PopOutManagerService (Application-Level)

- **Location**: `framework/services/popout-manager.service.ts`
- **Scope**: Full page panels (statistics panels, charts, pickers)
- **Mechanism**: `window.open()` with custom routes (`/popout/:panelId/:panelType`)
- **State Sync**: BroadcastChannel API for cross-window communication
- **Features**:
  - Panel-level popout (entire panels)
  - State synchronization with parent window
  - URL parameter propagation
  - Filter/highlight changes broadcast

### 2. Dockview Built-in Popout

- **Location**: `dockview-core` library
- **Scope**: Individual dockview panels/tabs only
- **Mechanism**: `api.addPopoutGroup()` method
- **URL**: Defaults to `/popout.html` (configurable via `popoutUrl` option)
- **Features**:
  - Tab-level popout (individual dockview panels)
  - Internal state management
  - Serialization support (`SerializedPopoutGroup`)
  - Events: `onDidPopoutGroupSizeChange`, `onDidPopoutGroupPositionChange`

## Conflict Analysis

| Aspect | Custom PopOutManager | Dockview Built-in |
|--------|---------------------|-------------------|
| Trigger | Explicit button click | API call or drag gesture |
| Granularity | Full panel | Individual tab |
| State sync | BroadcastChannel | Internal |
| URL routing | `/popout/:id/:type` | `/popout.html` |
| Angular integration | Full (components render in popout) | Requires DOM manipulation |

## Risk Assessment

### Current Risk: LOW

Dockview's popout is **not enabled by default**. It requires:
1. Explicit call to `api.addPopoutGroup()`
2. A valid `popoutUrl` endpoint

Since we don't call `addPopoutGroup()` and don't have a `/popout.html` endpoint, dockview popouts are effectively disabled.

### Potential Future Risks

1. **User Confusion**: If dockview UI hints at popout capability (e.g., drag to popout)
2. **Accidental Activation**: Future code changes might inadvertently enable popouts
3. **State Desync**: If both systems operate simultaneously, state could diverge

## Proposed Solution

### Option A: Explicit Disable (Recommended)

Disable dockview's floating/popout features in the component initialization:

```typescript
this.dockviewApi = createDockview(container, {
  createComponent: (options) => { /* ... */ },
  disableFloatingGroups: true,  // Prevent floating panels
  // Note: popouts require explicit API calls, so no disable flag needed
});
```

**Pros**: Clear intent, prevents accidental activation
**Cons**: Loses potential future floating panel feature

### Option B: Leave As-Is

Since popouts require explicit API calls and we don't make them, the current implementation is safe.

**Pros**: No code changes, retains flexibility
**Cons**: Implicit reliance on not calling certain APIs

### Option C: Integrate Systems (Future)

If dockview popouts become desirable, integrate with PopOutManagerService:
- Route dockview popouts through our BroadcastChannel system
- Maintain single source of truth for popout state

**Pros**: Best of both worlds
**Cons**: Significant implementation effort

## Decision

**Implement Option A** - Explicitly disable `disableFloatingGroups: true` to:
1. Prevent any floating panel behavior within dockview
2. Make the design decision explicit in code
3. Avoid future confusion

Dockview's tab-based popout (`addPopoutGroup`) doesn't have a disable flag, but since it requires explicit API calls, this is acceptable.

## Implementation

Update `dockview-statistics-panel.component.ts`:

```typescript
this.dockviewApi = createDockview(container, {
  createComponent: (options): IContentRenderer => {
    // ... existing implementation
  },
  disableFloatingGroups: true  // Explicitly disable floating panels
});
```

## Related Files

- `framework/services/popout-manager.service.ts` - Custom popout management
- `framework/services/popout-context.service.ts` - Popout window context detection
- `framework/models/popout.interface.ts` - Popout message types
- `app/popout/` - Popout window routes and components
