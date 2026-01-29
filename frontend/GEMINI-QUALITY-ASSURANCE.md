# Gemini Quality Assurance Guide

**Version**: 1.0 (Angular 21 Modernization)
**Date**: January 1, 2026

This document defines the testing methodology, verification rubrics, and quality standards for the Generic Prime Discovery Framework. It aggregates architectural specs, user stories, and debugging guides into a single source of truth for QA.

---

## 1. Testing Strategy: The Pyramid

We follow a strict division of labor between tools (per `docs/guides/Angular-Testing.md`).

| Layer | Tool | Scope | When to Run |
|-------|------|-------|-------------|
| **E2E / Integration** | **Playwright** | Full user journeys, Pop-out sync, API integration, Critical flows. | CI/CD, Pre-merge, Major refactors. |
| **Unit / Component** | **Vitest** | Business logic, Services, Isolated component state, Pure functions. | While coding (Watch mode), Pre-commit. |

**Rule**: Do NOT use Playwright for unit testing services. Do NOT use Vitest for testing browser interactions or routing.

---

## 2. Core Architecture Verification

### 2.1 URL-First State Management
**Source**: `docs/specs/04-state-management-specification.md`

**Principle**: The URL is the single source of truth. Components never mutate state directly; they update the URL, which triggers the service to fetch data and update components.

**Verification Rubric**:
1.  **Direct Navigation**: Loading `/discover?manufacturer=Ford` MUST immediately show filtered results without user interaction.
2.  **Back Button**: Clicking Browser Back MUST restore the previous filter state and results exactly.
3.  **No Hidden State**: Refreshing the page MUST restore the exact same UI state (except for transient UI like open dropdowns).

### 2.2 Pop-Out Window System
**Source**: `docs/POPOUT-ARCHITECTURE.md`

**Principle**: Pop-outs are independent windows synchronized via `BroadcastChannel`.

**Verification Rubric**:
1.  **State Sync (Main → Pop)**: Changing a filter in the Main window MUST update the Pop-out immediately.
2.  **State Sync (Pop → Main)**: Changing a selection in the Pop-out MUST update the Main window's URL.
3.  **Lifecycle**: Closing the Main window MUST close all Pop-outs. Refreshing the Main window MUST close all Pop-outs.
4.  **No API in Pop-out**: Pop-outs MUST NOT make API calls (Network tab should be quiet). They receive state from Main.

**Console Signatures (Automated Check)**:
-   Success (Main): `[Discover] Broadcasting state to all pop-outs`
-   Success (Pop): `[PanelPopout] Received STATE_UPDATE message`
-   Failure: `[StatisticsPanel] 🔵 In Main Window` (appearing inside a pop-out log) implies context failure.

### 2.3 Backend API Integration
**Source**: `docs/infrastructure/NEW-BACKEND-API-SPEC.md`

**Data Validation Standards**:
-   **Manufacturers**: Expect **72** items.
-   **Manufacturer-Models**: Expect **881** items (Flat list).
-   **Body Classes**: Expect **12** items.
-   **Total Vehicles**: Expect **4,887** records (unfiltered).

---

## 3. Key User Flows ("The Golden Paths")

Derived from `docs/storybook/Automobile Discovery - Feature Storybook.txt`.

### Flow 1: The Discovery Loop
1.  **Land**: User arrives at `/automobiles/discover`. Results: 4,887.
2.  **Filter**: User selects "Manufacturer: Chevrolet". Results: 849.
3.  **Refine**: User adds "Year Min: 2015". Results decrease.
4.  **Verify**: URL contains `manufacturer=Chevrolet&yearMin=2015`.

### Flow 2: The Pop-Out Analytics
1.  **Pop-out**: User pops out "Statistics Panel".
2.  **Interact**: User clicks "2020" bar in "Vehicles by Year" chart (in Pop-out).
3.  **Verify**:
    *   Pop-out sends `URL_PARAMS_CHANGED` message.
    *   Main window updates URL to include `h_yearMin=2020&h_yearMax=2020`.
    *   Main window broadcasts new state.
    *   Pop-out updates to show highlighted segment.

### Flow 3: Deep Linking
1.  **Link**: User pastes `http://.../discover?manufacturer=Ford&model=F-150`.
2.  **Verify**:
    *   Query Control shows "Ford" and "F-150" chips.
    *   Results table shows only F-150s.
    *   Statistics charts reflect F-150 data.

---

## 4. Debugging & Failure Analysis

### Common Failure Modes

| Symptom | Probable Cause | Fix |
|---------|----------------|-----|
| Pop-out makes API calls | `isInPopOut()` check failed in Service | Verify `PopOutContextService` initialization in `PanelPopoutComponent`. |
| Pop-out state "lags" | `ChangeDetectorRef` not triggered | Ensure `markForCheck()` is called after receiving `STATE_UPDATE`. |
| Infinite Loop | Pop-out updating its own URL | Ensure Pop-out uses `syncStateFromExternal` instead of `updateFilters`. |
| 404 on Refresh | Nginx/Dev Server config | Verify `proxy.conf.js` or `nginx.conf` handles SPA routing (fallback to index.html). |

### Console Log "Green Flags"
Look for these sequences in E2E logs to confirm health:
```text
[Discover] Initialized as parent window
[Discover] Created BroadcastChannel for panel: statistics-panel
[PanelPopout] Initialized as pop-out
[PanelPopout] Received STATE_UPDATE message
```

---

## 5. Artifacts & Documentation
-   **Screenshots**: Generated via Playwright in CI (`tests/generate-docs.spec.ts`).
-   **Reports**: Playwright HTML report (`playwright-report/index.html`).
-   **Trace**: On failure, check `trace.zip` in CI artifacts.
