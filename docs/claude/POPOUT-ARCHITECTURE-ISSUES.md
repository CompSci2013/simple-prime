# Popout Architecture - Current State & Design Issues

## Problem Summary
The popout architecture has a fundamental design flaw: **components are aware they're in a popout** and behave differently based on that context. A component should just be a component - it receives inputs, emits outputs, and doesn't care about its container.

## What Was Accomplished This Session

1. **Simplified popout component** - Now ~100 lines with just:
   - `<router-outlet>` for child components
   - BroadcastChannel state sync
   - Provides `ResourceManagementService` and `IS_POPOUT_TOKEN`

2. **Created child routes** (`frontend/src/app/features/popout/popout.routes.ts`):
   - Each component type maps to a route path
   - URL structure: `/popout/:gridId/:componentId/:type`
   - Standard Angular routing, URL-First compliant

3. **Updated PopOutManagerService** to generate correct URLs

4. **Removed unnecessary abstractions**:
   - Deleted `ComponentRegistry` and `ComponentDefinition`
   - The popout no longer needs to know about component types

## Files Changed
- `frontend/src/app/features/popout/popout.component.ts` - Minimal layout with router-outlet
- `frontend/src/app/features/popout/popout.routes.ts` - Child route definitions
- `frontend/src/app/app.routes.ts` - Updated popout route structure
- `frontend/src/framework/services/popout-manager.service.ts` - Updated URL generation

## The Remaining Design Issue

**Components check `isInPopOut()` to decide behavior.** This is wrong.

To find these violations, search for:
```bash
grep -r "isInPopOut\|PopOutContextService\|IS_POPOUT_TOKEN" frontend/src/framework/components/
```

Components should NOT:
- Inject `PopOutContextService`
- Check `isInPopOut()`
- Send messages via BroadcastChannel directly
- Have different behavior based on container context

## The Correct Architecture

```
Main Window                          Popout Window
┌─────────────────────┐              ┌─────────────────────┐
│ DiscoverPage        │              │ PopoutComponent     │
│  ├─ QueryControl    │              │  └─ <router-outlet> │
│  │   @Input config  │              │       └─ QueryControl │
│  │   @Output events─┼──┐           │           @Input config │
│  └─ ...             │  │           │           @Output events─┼──┐
└─────────────────────┘  │           └─────────────────────┘    │
                         │                                       │
                         ▼                                       ▼
                    UrlStateService                    BroadcastChannel
                    (updates URL)                      (sends to main)
```

**The component is identical in both contexts.** The difference is:
- In main window: parent handles `@Output` by calling `UrlStateService`
- In popout: parent handles `@Output` by sending via BroadcastChannel

## What Needs To Happen Next

1. **Audit components** for `PopOutContextService` usage - remove it
2. **Make components pure** - only `@Input()` and `@Output()`
3. **Popout intercepts outputs** via a mechanism TBD:
   - Option A: Route resolver + shared service pattern
   - Option B: Event bubbling with custom events
   - Option C: Output binding via dynamic component creation

4. **Components get data via injection** when loaded as routed components:
   - `DomainConfigRegistry.getActive()` for domain config
   - `ResourceManagementService` for state (already works)

## Key Insight

The URL-First principle applies: a component routed to `/popout/automobile-discover/query-control/query-control` should work exactly like one rendered in the main window. The URL determines what's shown; the component doesn't need to know *where* it's being rendered.

## Branch Status

This work is on the `popout` branch. The build may not compile due to incomplete refactoring. The key issue is that child components loaded via router-outlet don't receive `@Input()` values - they need to either:
- Inject services to get their data
- Use route resolvers
- Have the popout use dynamic component creation with input binding

## Session Date
2026-02-05
