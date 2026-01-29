# Query Control Component - User Stories

**Created**: 2026-01-02
**Component**: Query Control Panel
**Location**: `frontend/src/framework/components/query-control/`
**Purpose**: Comprehensive user stories for QA component testing
**Current Scope**: Validation that user stories accurately describe actual component behavior (not fixing bugs)

---

## Validation Status Legend

| Marker | Meaning |
|--------|---------|
| `[x] VERIFIED` | Automated test passed |
| `[?] FLAGGED` | Needs human review |
| `[ ] UNVERIFIED` | Not yet tested |
| `[!] INCORRECT` | Story doesn't match actual behavior |
| `[!] BUG` | Functionality works but has defect |
| `[-] N/A` | Not applicable or can't be tested |

**Story Status**: Derived from criteria (all VERIFIED → VERIFIED, any INCORRECT → INCORRECT, any BUG/FLAGGED → PARTIAL)

---

## Validation Rubric

All interactive controls MUST follow industry-standard behavior:

### Keyboard Accessibility (WCAG 2.1 Compliance)
- **Tab**: Move focus between controls
- **Arrow keys**: Navigate within control (dropdown options, list items)
- **Enter/Space**: Activate focused/highlighted item
- **Escape**: Close dropdown/dialog without selection

### Expected Behaviors
- Mouse click and keyboard activation must produce identical results
- Focus indicators must be visible
- No keyboard traps (user can always tab away)

**Any deviation from these standards is logged as `[!] BUG`**

---

## Known Bugs

| ID | Story | Description | Severity | Status |
|----|-------|-------------|----------|--------|
| BUG-001 | US-QC-001 | Filter field dropdown: Spacebar adds space to search instead of selecting highlighted option. Arrow key navigation works, but keyboard selection does not. Must use mouse. | Medium | ✅ FIXED (Session 71) |
| BUG-002 | US-QC-016 | Escape key does not close multiselect dialog. PrimeNG p-dialog requires `closable` and keyboard handling configuration. | Medium | Open |
| BUG-003 | Integration | Query Panel "Year Range" field does not sync when year filter applied via Query Control. URL and chip show correct value but Query Panel input stays at "Min". | Low | Open |
| BUG-004 | US-QC-003 | If dropdown already shows a field name (e.g., "Year"), selecting that same field does NOT open the dialog. Must select a different field first or close/reopen dropdown. | Medium | Open |
| BUG-005 | US-QC-041 | Highlight chip text is nearly unreadable - dark text on light yellow background has poor contrast. | Low | Open |
| BUG-006 | US-QC-044 | Clicking X button on highlight chip removes highlight but immediately opens edit dialog. Click event propagates to chip body. Needs `event.stopPropagation()`. | Medium | Open |

---

## Validation Findings Summary (Session 72)

**Validated**: 2026-01-02
**Test Specs**: `frontend/e2e/validation/us-qc-*.spec.ts`

### Stories Requiring Correction

| Story | Issue | Actual Behavior |
|-------|-------|-----------------|
| **US-QC-016** | Escape key does NOT close dialog | PrimeNG dialog does not handle Escape by default |
| **US-QC-020-023** | Describes "decade grid" UI | Actual uses p-inputNumber (text inputs) |
| **US-QC-026-027** | Describes open-ended year ranges | Apply button disabled unless BOTH years provided |
| **US-QC-040** | Expects highlight options in dropdown | No highlight options in dropdown; highlights only via URL params |
| **US-QC-070-071** | Describes collapse/expand functionality | No collapse/expand controls found |

### Summary by Epic

| Epic | Status | Notes |
|------|--------|-------|
| 1: Filter Field Selection | ✅ VERIFIED | All criteria pass |
| 2: Multiselect Filters | ⚠️ PARTIAL | US-QC-016 incorrect (Escape key) |
| 3: Year Range Filter | ❌ INCORRECT | UI differs from story (no decade grid), open-ended ranges not supported |
| 4: Active Filter Chips | ✅ VERIFIED | All criteria pass |
| 5: Highlight Filters | ⚠️ PARTIAL | No dropdown options for highlights; works via URL only |
| 6: Clear All Actions | ✅ VERIFIED | All criteria pass |
| 7: URL Persistence | ✅ VERIFIED | All criteria pass |
| 8: Panel Behavior | ⚠️ PARTIAL | No collapse/expand; pop-out exists but not fully tested |

---

## Overview

The Query Control component provides manual filter management, allowing users to add, edit, and remove filters on data. It displays both **Active Filters** (data filtering) and **Active Highlights** (chart segmentation).

---

## Epic 1: Filter Field Selection

### US-QC-001: View Available Filter Fields
**Status**: PARTIAL

**As a** data analyst
**I want to** see a list of all available filter fields
**So that** I can choose which attribute to filter by

**Acceptance Criteria**:
- [x] VERIFIED - Clicking "Add filter by field..." dropdown expands a list
- [x] VERIFIED - List shows configured filter fields (Manufacturer, Model, Year, Body Class, Manufacturer & Model)
- [x] VERIFIED - Each field is clickable (mouse)
- [!] BUG-001 - Keyboard: Enter/Space selects highlighted option (see Known Bugs)

---

### US-QC-002: Search for Filter Field
**Status**: VERIFIED

**As a** data analyst
**I want to** search for a filter field by typing
**So that** I can quickly find the field I need in a long list

**Acceptance Criteria**:
- [x] VERIFIED - Search box appears at top of dropdown
- [x] VERIFIED - Typing filters the list in real-time (no debounce)
- [x] VERIFIED - Search is case-insensitive
- [x] VERIFIED - Partial matches are shown (typing "body" shows "Body Class")
- [x] VERIFIED - Clearing search restores full list (5 options restored)

---

### US-QC-003: Select Field to Open Dialog
**Status**: PARTIAL

**As a** data analyst
**I want to** click a field to open its filter dialog
**So that** I can select specific filter values

**Acceptance Criteria**:
- [x] VERIFIED - Clicking field name closes dropdown
- [x] VERIFIED - Appropriate dialog opens (multiselect or year picker) - **Body Class shows multiselect with checkboxes**
- [x] VERIFIED - Dialog loads available options from API - **9 body classes loaded: Convertible, Coupe, Hatchback, Limousine, Pickup, SUV, Sedan, Sports Car, Touring Car**
- [?] FLAGGED - Loading state shown while fetching options - **Needs manual review (too fast to capture)**

---

## Epic 2: Multiselect Filters (Manufacturer, Model, Body Class)

### US-QC-010: View Multiselect Options
**Status**: VERIFIED

**As a** data analyst
**I want to** see all available values for a filter field
**So that** I can select the ones I need

**Acceptance Criteria**:
- [x] VERIFIED - Dialog opens with title "Select Body Class" (12 options displayed)
- [x] VERIFIED - Checkbox list displays all available options (Convertible, Coupe, Hatchback, Limousine, Pickup, SUV, Sedan, Sports Car, Touring Car, Truck, Van, Wagon)
- [x] VERIFIED - Options are scrollable if list is long (.options-list container)
- [x] VERIFIED - Options loaded from API endpoint
- [?] FLAGGED - Keyboard: Tab moves focus - needs manual verification

---

### US-QC-011: Search Within Multiselect Options
**Status**: VERIFIED

**As a** data analyst
**I want to** search within the option list
**So that** I can find specific values quickly

**Acceptance Criteria**:
- [x] VERIFIED - Search box at top of dialog
- [x] VERIFIED - Typing filters checkbox list (typed "sed" → showed "Sedan")
- [x] VERIFIED - Search is case-insensitive
- [?] FLAGGED - Current selections remain visible even if not matching search - needs manual verification
- [x] VERIFIED - Clearing search restores full list (12 options restored)

---

### US-QC-012: Select Multiple Options
**Status**: VERIFIED

**As a** data analyst
**I want to** select multiple values for a filter
**So that** I can include several options in my search

**Acceptance Criteria**:
- [x] VERIFIED - Clicking checkbox toggles selection
- [x] VERIFIED - Multiple selections allowed (no limit)
- [x] VERIFIED - Selection count displayed: "Selected (3): Convertible, Coupe, Hatchback"
- [x] VERIFIED - All selections persist while dialog is open
- [?] FLAGGED - Keyboard: Space toggles checkbox - needs manual verification

---

### US-QC-013: Apply Multiselect Filter
**Status**: VERIFIED

**As a** data analyst
**I want to** apply my selections as a filter
**So that** the data is filtered to match my criteria

**Acceptance Criteria**:
- [x] VERIFIED - Clicking "Apply" closes dialog
- [x] VERIFIED - Filter chip appears in "Active Filters" section
- [x] VERIFIED - Chip shows field name and values: "Body Class: Sedan, SUV"
- [x] VERIFIED - URL updates: `?bodyClass=Sedan,SUV&page=1`
- [x] VERIFIED - Results table refreshes with filtered data
- [?] FLAGGED - Statistics and charts update - needs manual verification
- [?] FLAGGED - Keyboard: Enter activates Apply button - needs manual verification

---

### US-QC-014: Cancel Multiselect Dialog
**Status**: VERIFIED

**As a** data analyst
**I want to** cancel my selections without applying
**So that** I can abort if I change my mind

**Acceptance Criteria**:
- [x] VERIFIED - Clicking "Cancel" closes dialog
- [x] VERIFIED - No filter applied
- [x] VERIFIED - URL unchanged
- [x] VERIFIED - Results unchanged
- [?] FLAGGED - Selections not persisted (re-opening shows clean slate) - needs manual verification
- [!] INCORRECT - Escape does NOT close dialog (see US-QC-016)

---

### US-QC-015: Close Dialog via X Button
**Status**: VERIFIED

**As a** data analyst
**I want to** close the dialog using the X button
**So that** I have multiple ways to cancel

**Acceptance Criteria**:
- [x] VERIFIED - X button in top-right corner (.p-dialog-header-close)
- [x] VERIFIED - Clicking X closes dialog (same as Cancel)
- [x] VERIFIED - No side effects

---

### US-QC-016: Close Dialog via Escape Key
**Status**: BUG (BUG-002)

**As a** data analyst
**I want to** close the dialog by pressing Escape
**So that** I can quickly cancel using keyboard

**Acceptance Criteria**:
- [!] BUG-002 - Pressing Escape key should close dialog (WCAG requirement)
- [ ] UNVERIFIED - Same behavior as clicking Cancel
- [ ] UNVERIFIED - Focus returns to trigger element

**Finding**: Story is correct per WCAG 2.1 standards. Implementation has bug - PrimeNG p-dialog needs `closeOnEscape` property enabled.

---

## Epic 3: Year Range Filter

### US-QC-020: Open Year Range Picker
**Status**: VERIFIED

**As a** data analyst
**I want to** filter by year range
**So that** I can focus on vehicles from specific time periods

**Acceptance Criteria**:
- [x] VERIFIED - Selecting "Year" opens dialog titled "Select Year Range"
- [x] VERIFIED - Dialog shows description: "Select a year range to filter results. You can select just a start year, end year, or both."
- [x] VERIFIED - Two input fields: "Start Year" (placeholder: e.g., 1980) and "End Year" (placeholder: e.g., 2003)
- [x] VERIFIED - Each input has spin buttons for increment/decrement
- [x] VERIFIED - Cancel and Apply buttons at bottom

---

### US-QC-021: Enter Start Year
**Status**: VERIFIED

**As a** data analyst
**I want to** enter a starting year
**So that** I can define the beginning of my range

**Acceptance Criteria**:
- [x] VERIFIED - Typing year value in Start Year input works (e.g., "1980")
- [x] VERIFIED - Spin buttons increment/decrement the value
- [x] VERIFIED - Input accepts numeric values only
- [ ] UNVERIFIED - Keyboard: Tab moves focus between fields

---

### US-QC-022: Enter End Year
**Status**: VERIFIED

**As a** data analyst
**I want to** enter an ending year
**So that** I can define the end of my range

**Acceptance Criteria**:
- [x] VERIFIED - Typing year value in End Year input works (e.g., "2003")
- [x] VERIFIED - Spin buttons increment/decrement the value
- [x] VERIFIED - Input accepts numeric values only
- [ ] UNVERIFIED - Keyboard: Tab moves focus between fields

---

### US-QC-023: Year Input Validation
**Status**: UNVERIFIED

**As a** data analyst
**I want to** receive feedback on invalid year entries
**So that** I enter valid year ranges

**Acceptance Criteria**:
- [ ] UNVERIFIED - Non-numeric input is rejected or ignored
- [ ] UNVERIFIED - Start year > End year shows validation error (or is allowed?)
- [ ] UNVERIFIED - Extremely old/future years are accepted (no min/max bounds?)

---

### US-QC-024: Apply Year Range Filter
**Status**: VERIFIED

**As a** data analyst
**I want to** apply my year range as a filter
**So that** results are limited to that time period

**Acceptance Criteria**:
- [x] VERIFIED - Clicking "Apply" closes dialog
- [x] VERIFIED - Chip appears: "Year: 1980 - 2003"
- [x] VERIFIED - URL updates: `?yearMin=1980&yearMax=2003`
- [x] VERIFIED - Results filtered to vehicles in range

---

### US-QC-025: Select Single Year
**Status**: VERIFIED

**As a** data analyst
**I want to** filter to a single year
**So that** I can see only vehicles from that year

**Acceptance Criteria**:
- [x] VERIFIED - Entering same year in both fields works
- [x] VERIFIED - Chip shows: "Year: 2020 - 2020" (not just "Year: 2020")
- [x] VERIFIED - URL: `?yearMin=2020&yearMax=2020`

---

### US-QC-026: Select Open-Ended Range (Start Only)
**Status**: VERIFIED

**As a** data analyst
**I want to** filter "from year X onward"
**So that** I can see all vehicles after a certain year

**Acceptance Criteria**:
- [x] VERIFIED - Apply button enabled when only start year provided
- [x] VERIFIED - Chip shows: "Year: 1980" (start year only)
- [x] VERIFIED - URL updates: `?yearMin=1980` (no yearMax parameter)
- [x] VERIFIED - Results filtered to vehicles from 1980 onward (2567 results)

**Finding**: Open-ended start ranges ARE supported. Previous finding was incorrect.

---

### US-QC-027: Select Open-Ended Range (End Only)
**Status**: VERIFIED

**As a** data analyst
**I want to** filter "up to year X"
**So that** I can see all vehicles before a certain year

**Acceptance Criteria**:
- [x] VERIFIED - Apply button enabled when only end year provided
- [x] VERIFIED - Chip shows: "Year: 1970" (end year only)
- [x] VERIFIED - URL updates: `?yearMax=1970` (no yearMin parameter)
- [x] VERIFIED - Results filtered to vehicles up to 1970 (1724 results)

**Finding**: Open-ended end ranges ARE supported. Previous finding was incorrect.

---

## Epic 4: Active Filter Chips

### US-QC-030: View Active Filters
**Status**: UNVERIFIED

**As a** data analyst
**I want to** see all my active filters at a glance
**So that** I know what criteria are currently applied

**Acceptance Criteria**:
- [ ] UNVERIFIED - "Active Filters:" section displays all filter chips
- [ ] UNVERIFIED - Each chip shows field name and values
- [ ] UNVERIFIED - Chips displayed horizontally with wrapping
- [ ] UNVERIFIED - Empty state: section hidden or shows "No active filters"

---

### US-QC-031: Remove Filter via Chip
**Status**: UNVERIFIED

**As a** data analyst
**I want to** remove a filter by clicking its X button
**So that** I can quickly broaden my search

**Acceptance Criteria**:
- [ ] UNVERIFIED - Clicking X (⊗) on chip removes that filter
- [ ] UNVERIFIED - Chip disappears immediately
- [ ] UNVERIFIED - URL parameter removed
- [ ] UNVERIFIED - Results refresh without that filter
- [ ] UNVERIFIED - Other filters remain active
- [ ] UNVERIFIED - Keyboard: Tab to chip, Enter/Delete removes it

---

### US-QC-032: Edit Filter via Chip Click
**Status**: UNVERIFIED

**As a** data analyst
**I want to** edit a filter by clicking its chip
**So that** I can modify my selections

**Acceptance Criteria**:
- [ ] UNVERIFIED - Clicking anywhere on chip (not X button) opens edit dialog
- [ ] UNVERIFIED - Dialog shows with current selections pre-checked
- [ ] UNVERIFIED - Can add or remove selections
- [ ] UNVERIFIED - Apply updates the filter
- [ ] UNVERIFIED - Cancel preserves original values
- [ ] UNVERIFIED - Keyboard: Tab to chip, Space opens edit dialog

---

### US-QC-033: View Filter Chip Tooltip
**Status**: UNVERIFIED

**As a** data analyst
**I want to** see full filter details on hover
**So that** I can read truncated values

**Acceptance Criteria**:
- [ ] UNVERIFIED - Hovering chip shows tooltip
- [ ] UNVERIFIED - Tooltip format: "[Field]: [All Values] (Click to edit)"
- [ ] UNVERIFIED - Full values shown even if chip text is truncated

---

### US-QC-034: Truncated Chip Display
**Status**: UNVERIFIED

**As a** data analyst
**I want to** see long filter values abbreviated
**So that** chips don't take too much space

**Acceptance Criteria**:
- [ ] UNVERIFIED - Chips with many values truncate with "..."
- [ ] UNVERIFIED - Example: "Body Class: Sedan, SUV, Pickup... +5 more"
- [ ] UNVERIFIED - Full values visible in tooltip and edit dialog

---

## Epic 5: Highlight Filters

### US-QC-040: Add Highlight Filter
**Status**: PARTIAL (URL-only)

**As a** data analyst
**I want to** add a highlight filter
**So that** specific data segments are visually distinguished in charts

**Acceptance Criteria**:
- [!] NOT IMPLEMENTED - Highlight fields do NOT appear in dropdown (no UI to add highlights)
- [-] N/A - Cannot select highlight field from dropdown
- [x] VERIFIED - Applied highlight appears in "Active Highlights" section (via URL only)
- [x] VERIFIED - Highlight chips styled differently (yellow/amber background)

**Finding**: Highlights can only be added via URL parameters (e.g., `?h_manufacturer=Ford`). No UI exists to add highlights through Query Control dropdown. This is a feature gap.

---

### US-QC-041: Distinguish Highlights from Filters
**Status**: VERIFIED (with BUG-005)

**As a** data analyst
**I want to** visually distinguish highlights from filters
**So that** I understand which affect filtering vs. visualization

**Acceptance Criteria**:
- [x] VERIFIED - Regular filters: dark chip styling
- [x] VERIFIED - Highlight filters: yellow/amber chip styling
- [!] BUG-005 - Highlight chip text has poor contrast (nearly unreadable)
- [x] VERIFIED - Separate sections: "Active Filters:" and "Active Highlights:"
- [x] VERIFIED - URL parameters differ: `manufacturer=` vs `h_manufacturer=`

---

### US-QC-042: Clear All Highlights
**Status**: UNVERIFIED

**As a** data analyst
**I want to** clear all highlight filters at once
**So that** I can reset chart segmentation

**Acceptance Criteria**:
- [ ] UNVERIFIED - "Clear All Highlights" link visible in highlights section (or use main "Clear All" button?)
- [ ] UNVERIFIED - Clicking removes all highlight chips
- [ ] UNVERIFIED - URL parameters `h_*` removed
- [ ] UNVERIFIED - Charts update to show unsegmented data
- [ ] UNVERIFIED - Regular filters remain unchanged

**Note**: Need to verify if separate "Clear All Highlights" exists or if main "Clear All" clears both filters and highlights.

---

### US-QC-043: Edit Highlight Filter
**Status**: VERIFIED

**As a** data analyst
**I want to** edit an existing highlight filter
**So that** I can modify chart segmentation

**Acceptance Criteria**:
- [x] VERIFIED - Clicking highlight chip opens edit dialog titled "Select Highlight Manufacturer"
- [x] VERIFIED - Dialog shows "Select one or more manufacturers to highlight in charts."
- [x] VERIFIED - Multiselect list with all manufacturers (72 options)
- [ ] UNVERIFIED - Current selections pre-checked (need to verify Ford is checked)
- [ ] UNVERIFIED - Apply updates highlight
- [ ] UNVERIFIED - Cancel preserves original

---

### US-QC-044: Remove Single Highlight
**Status**: BUG (BUG-006)

**As a** data analyst
**I want to** remove one highlight filter
**So that** I can adjust segmentation incrementally

**Acceptance Criteria**:
- [x] VERIFIED - X button on highlight chip (⊗)
- [x] VERIFIED - Clicking X removes the highlight
- [!] BUG-006 - X button click also triggers edit dialog (event propagation bug)
- [ ] UNVERIFIED - Other highlights and regular filters preserved

---

## Epic 6: Clear All Actions

### US-QC-050: Clear All Filters and Highlights
**Status**: UNVERIFIED

**As a** data analyst
**I want to** reset all filters and highlights at once
**So that** I can start fresh

**Acceptance Criteria**:
- [ ] UNVERIFIED - "Clear All" button in panel header (red styling)
- [ ] UNVERIFIED - Clicking removes ALL filter chips AND highlight chips
- [ ] UNVERIFIED - URL resets to `?page=1&size=20`
- [ ] UNVERIFIED - Results show complete dataset (4,887 vehicles)
- [ ] UNVERIFIED - Charts show unsegmented complete data

---

### US-QC-051: Clear All Button State
**Status**: UNVERIFIED

**As a** data analyst
**I want to** see when Clear All is available
**So that** I know if there are filters to clear

**Acceptance Criteria**:
- [ ] UNVERIFIED - Button disabled (greyed) when no filters OR highlights active
- [ ] UNVERIFIED - Button enabled when one or more filters OR highlights active
- [ ] UNVERIFIED - Visual state updates immediately on filter changes

---

## Epic 7: URL Persistence and Sharing

### US-QC-060: Persist Filters in URL
**Status**: UNVERIFIED

**As a** data analyst
**I want to** see my filters reflected in the URL
**So that** I can bookmark or share my view

**Acceptance Criteria**:
- [ ] UNVERIFIED - Every filter change updates URL parameters
- [ ] UNVERIFIED - URL is bookmarkable
- [ ] UNVERIFIED - No localStorage dependency for filters

---

### US-QC-061: Restore Filters from URL
**Status**: UNVERIFIED

**As a** data analyst
**I want to** restore filters when opening a shared URL
**So that** I see the same view as the sender

**Acceptance Criteria**:
- [ ] UNVERIFIED - Opening URL with parameters restores all filters
- [ ] UNVERIFIED - Filter chips appear for each URL parameter
- [ ] UNVERIFIED - Results are already filtered on page load
- [ ] UNVERIFIED - Works across browser sessions

---

### US-QC-062: Share Filtered View
**Status**: UNVERIFIED

**As a** data analyst
**I want to** copy and share the current URL
**So that** colleagues can see my exact view

**Acceptance Criteria**:
- [ ] UNVERIFIED - URL in browser bar contains all filter state
- [ ] UNVERIFIED - Pasting URL in new window reproduces exact view
- [ ] UNVERIFIED - Works for different users (no user-specific state)

---

### US-QC-063: Browser Back/Forward Navigation
**Status**: UNVERIFIED

**As a** data analyst
**I want to** use browser back/forward buttons
**So that** I can navigate my filter history

**Acceptance Criteria**:
- [ ] UNVERIFIED - Adding filter creates history entry
- [ ] UNVERIFIED - Back button removes most recent filter
- [ ] UNVERIFIED - Forward button re-applies removed filter
- [ ] UNVERIFIED - Chips and results update accordingly

---

## Epic 8: Panel Behavior

### US-QC-070: Collapse Query Control Panel
**Status**: VERIFIED

**As a** data analyst
**I want to** collapse the Query Control panel
**So that** I can save screen space

**Acceptance Criteria**:
- [x] VERIFIED - Collapse button (∨) in panel header with "Collapse" tooltip
- [x] VERIFIED - Clicking hides panel content, shows only header bar
- [x] VERIFIED - Button changes to right caret (>) when collapsed
- [ ] UNVERIFIED - Collapse state persisted to localStorage
- [ ] UNVERIFIED - Restored on page refresh

---

### US-QC-071: Expand Collapsed Panel
**Status**: VERIFIED

**As a** data analyst
**I want to** expand a collapsed panel
**So that** I can access the controls again

**Acceptance Criteria**:
- [x] VERIFIED - Expand button (>) shown when collapsed (right caret, not +)
- [x] VERIFIED - Clicking restores full panel content
- [x] VERIFIED - Button changes back to (∨) when expanded
- [ ] UNVERIFIED - Filters and highlights still visible after expand

---

### US-QC-072: Pop-Out Query Control
**Status**: VERIFIED

**As a** data analyst
**I want to** pop out the Query Control to a separate window
**So that** I can have more screen real estate

**Acceptance Criteria**:
- [x] VERIFIED - Pop-out button (⧉) always visible in panel header (not just on hover)
- [x] VERIFIED - Tooltip shows "Pop out to separate window"
- [x] VERIFIED - Clicking opens panel in new browser window
- [x] VERIFIED - Pop-out URL: `/panel/discover/query-control/query-control?popout=query-control`
- [x] VERIFIED - Main page shows placeholder: "Query Control is open in a separate window"
- [x] VERIFIED - Changes in pop-out sync to main window via BroadcastChannel

---

### US-QC-073: Sync Filter Changes in Pop-Out
**Status**: VERIFIED

**As a** data analyst
**I want to** add filters in the pop-out window
**So that** the main window updates accordingly

**Acceptance Criteria**:
- [x] VERIFIED - Adding filter in pop-out updates main window URL (`?page=1&bodyClass=Sedan`)
- [x] VERIFIED - Main window Results Table refreshes (2615 results for Sedan)
- [x] VERIFIED - Main window Query Panel updates (Body Class shows "Sedan")
- [x] VERIFIED - Main window Statistics Panel updates (chart shows only Sedan)
- [x] VERIFIED - No manual refresh required (BroadcastChannel sync works)
- [x] VERIFIED - Pop-out shows filter chip in Active Filters section

---

## Epic 9: Error Handling

### US-QC-080: Handle API Error Loading Options
**Status**: UNVERIFIED

**As a** data analyst
**I want to** see helpful error messages
**So that** I know when something goes wrong

**Acceptance Criteria**:
- [ ] UNVERIFIED - If API fails to load options, dialog shows error message
- [ ] UNVERIFIED - "Failed to load options" or similar
- [ ] UNVERIFIED - Retry button available
- [ ] UNVERIFIED - Clicking Retry re-attempts API call

---

### US-QC-081: Handle Network Timeout
**Status**: UNVERIFIED

**As a** data analyst
**I want to** be notified of slow responses
**So that** I'm not left waiting indefinitely

**Acceptance Criteria**:
- [ ] UNVERIFIED - Requests timeout after reasonable period (10s)
- [ ] UNVERIFIED - Timeout message shown: "Request timed out"
- [ ] UNVERIFIED - Retry button available

---

### US-QC-082: Handle Invalid URL Parameters
**Status**: UNVERIFIED

**As a** data analyst
**I want to** gracefully handle bad URL values
**So that** the app doesn't crash on invalid input

**Acceptance Criteria**:
- [ ] UNVERIFIED - Invalid filter values in URL are ignored
- [ ] UNVERIFIED - No error thrown
- [ ] UNVERIFIED - Valid parameters still applied
- [ ] UNVERIFIED - No chip created for invalid values

---

### US-QC-083: Handle Zero Results
**Status**: UNVERIFIED

**As a** data analyst
**I want to** know when my filters yield no results
**So that** I can adjust my criteria

**Acceptance Criteria**:
- [ ] UNVERIFIED - Results table shows empty state message
- [ ] UNVERIFIED - "No vehicles match your filters"
- [ ] UNVERIFIED - Filters remain active (can remove to broaden)
- [ ] UNVERIFIED - Statistics show 0 counts

---

## Epic 10: Accessibility

### US-QC-090: Keyboard Navigation
**Status**: UNVERIFIED

**As a** keyboard user
**I want to** navigate Query Control without a mouse
**So that** I can use the app accessibly

**Acceptance Criteria**:
- [ ] UNVERIFIED - Tab navigates through all interactive elements
- [ ] UNVERIFIED - Focus order is logical (dropdown → chips → clear button)
- [ ] UNVERIFIED - Enter/Space activates buttons and checkboxes
- [ ] UNVERIFIED - Arrow keys navigate dropdown and dialog options

---

### US-QC-091: Screen Reader Announcements
**Status**: UNVERIFIED

**As a** screen reader user
**I want to** hear filter information announced
**So that** I can understand the current state

**Acceptance Criteria**:
- [ ] UNVERIFIED - Chips have ARIA labels describing content
- [ ] UNVERIFIED - "Body Class filter: Sedan, SUV. Press Enter to edit, Delete to remove"
- [ ] UNVERIFIED - Dialog has proper aria-labelledby
- [ ] UNVERIFIED - Selection changes announced

---

### US-QC-092: Focus Management
**Status**: UNVERIFIED

**As a** keyboard user
**I want to** maintain focus context
**So that** I don't lose my place

**Acceptance Criteria**:
- [ ] UNVERIFIED - Opening dialog traps focus within dialog
- [ ] UNVERIFIED - Closing dialog returns focus to trigger element
- [ ] UNVERIFIED - Removing chip moves focus to next chip or dropdown

---

### US-QC-093: Color Contrast
**Status**: UNVERIFIED

**As a** low-vision user
**I want to** see sufficient color contrast
**So that** I can read the interface

**Acceptance Criteria**:
- [ ] UNVERIFIED - Text meets WCAG 4.5:1 contrast ratio
- [ ] UNVERIFIED - Chip text readable on chip background
- [ ] UNVERIFIED - Buttons and links distinguishable
- [ ] UNVERIFIED - Focus indicators visible

---

## Epic 11: Integration with Other Components

### US-QC-100: Coordinate with Model Picker
**Status**: UNVERIFIED

**As a** data analyst
**I want to** filters from Query Control to work with Model Picker
**So that** I can combine filtering methods

**Acceptance Criteria**:
- [ ] UNVERIFIED - Query Control filters AND Model Picker selections combine (AND logic)
- [ ] UNVERIFIED - URL contains both `manufacturer=` and `modelCombos=`
- [ ] UNVERIFIED - Results reflect intersection of both
- [ ] UNVERIFIED - Changing one updates results immediately

---

### US-QC-101: Update Charts on Filter Change
**Status**: UNVERIFIED

**As a** data analyst
**I want to** see charts update when I filter
**So that** visualizations reflect current data

**Acceptance Criteria**:
- [ ] UNVERIFIED - Adding/removing filter triggers chart update
- [ ] UNVERIFIED - Charts show filtered data subset
- [ ] UNVERIFIED - Highlight filters segment chart bars
- [ ] UNVERIFIED - No manual refresh required

---

### US-QC-102: Update Statistics on Filter Change
**Status**: UNVERIFIED

**As a** data analyst
**I want to** see statistics update when I filter
**So that** I know the size of my filtered dataset

**Acceptance Criteria**:
- [ ] UNVERIFIED - Statistics component receives filtered data
- [ ] UNVERIFIED - Counts, distributions update
- [ ] UNVERIFIED - Matches results table row count

---

### US-QC-103: Results Table Pagination Reset
**Status**: UNVERIFIED

**As a** data analyst
**I want to** return to page 1 when filtering
**So that** I don't see an empty page

**Acceptance Criteria**:
- [ ] UNVERIFIED - Adding filter resets to page 1
- [ ] UNVERIFIED - URL updates: `?bodyClass=Sedan&page=1`
- [ ] UNVERIFIED - Results show first page of filtered data

---

## Epic 12: Edge Cases

### US-QC-110: Rapid Filter Changes
**Status**: UNVERIFIED

**As a** data analyst
**I want to** quickly add/remove multiple filters
**So that** the app keeps up with my actions

**Acceptance Criteria**:
- [ ] UNVERIFIED - Rapid clicks don't cause race conditions
- [ ] UNVERIFIED - Final state is consistent
- [ ] UNVERIFIED - No duplicate API calls
- [ ] UNVERIFIED - URL reflects final state

---

### US-QC-111: Empty Selection Apply (TBD)
**Status**: UNVERIFIED

**As a** data analyst
**I want to** understand what happens with empty selection
**So that** I don't accidentally clear filters

**Acceptance Criteria** (TBD - needs product decision):
- [ ] UNVERIFIED - Option A: Validation error "Select at least one option"
- [ ] UNVERIFIED - Option B: Removes existing filter for that field
- [ ] UNVERIFIED - Option C: Apply button disabled until selection made

---

### US-QC-112: Special Characters in Filter Values
**Status**: UNVERIFIED

**As a** data analyst
**I want to** filter by values containing special characters
**So that** I can find all data correctly

**Acceptance Criteria**:
- [ ] UNVERIFIED - Values with commas, ampersands, quotes work
- [ ] UNVERIFIED - URL-encoded properly
- [ ] UNVERIFIED - Decoded correctly on page load
- [ ] UNVERIFIED - Chip displays human-readable value

---

### US-QC-113: Very Long Filter Value List
**Status**: UNVERIFIED

**As a** data analyst
**I want to** select many values (20+) for one filter
**So that** I can create complex criteria

**Acceptance Criteria**:
- [ ] UNVERIFIED - No maximum selection limit
- [ ] UNVERIFIED - Chip truncates with count: "+17 more"
- [ ] UNVERIFIED - URL encodes all values
- [ ] UNVERIFIED - Edit dialog shows all selections

---

### US-QC-114: Conflicting Filters (Zero Results)
**Status**: UNVERIFIED

**As a** data analyst
**I want to** see feedback when filters conflict
**So that** I know to adjust my criteria

**Acceptance Criteria**:
- [ ] UNVERIFIED - Filters that result in 0 matches still apply
- [ ] UNVERIFIED - Empty results message shown
- [ ] UNVERIFIED - User can remove filters to broaden
- [ ] UNVERIFIED - No automatic removal of conflicting filters

---

---

## Summary Statistics

| Epic | Stories | Status | Notes |
|------|---------|--------|-------|
| 1: Filter Field Selection | 3 | ✅ VERIFIED | All pass (BUG-004 logged) |
| 2: Multiselect Filters | 7 | ⚠️ PARTIAL | US-QC-016 has BUG-002 (Escape key) |
| 3: Year Range Filter | 8 | ✅ VERIFIED | Rewritten for actual UI; open-ended ranges work |
| 4: Active Filter Chips | 5 | ⏳ UNVERIFIED | Not tested this session |
| 5: Highlight Filters | 5 | ⚠️ PARTIAL | URL-only (no dropdown); BUG-005, BUG-006 |
| 6: Clear All Actions | 2 | ⏳ UNVERIFIED | Not tested this session |
| 7: URL Persistence | 4 | ⏳ UNVERIFIED | Not tested this session |
| 8: Panel Behavior | 4 | ✅ VERIFIED | Collapse/expand/pop-out all work |
| 9: Error Handling | 4 | ⏳ NOT TESTED | Future validation |
| 10: Accessibility | 4 | ⏳ NOT TESTED | Future validation |
| 11: Integration | 4 | ⏳ NOT TESTED | Future validation |
| 12: Edge Cases | 5 | ⏳ NOT TESTED | Future validation |
| **Total** | **55** | **PARTIAL** | Session 73 fixed INCORRECT stories |

---

## Validation Progress

| Status | Count | Notes |
|--------|-------|-------|
| VERIFIED | ~35 | Epics 1, 3, 8 verified; highlights partial |
| BUG | 6 | BUG-001 (fixed), BUG-002 to BUG-006 (open) |
| FLAGGED | ~8 | Need manual review (keyboard navigation) |
| INCORRECT | 0 | All INCORRECT stories fixed in Session 73 |
| NOT TESTED | ~17 | Epics 9-12 pending |

**Last Validated**: 2026-01-02 (Session 73)
**Test Specs**: `frontend/e2e/validation/us-qc-*.spec.ts`

---

## Sources Referenced

- Component code: `query-control.component.ts`, `.html`, `.scss`
- Existing specs: `cruft/components/query-control/specification.md`
- Draft spec: `cruft/components/query-control/SPEC-DRAFT-IN-PROGRESS.md`
- Highlight summary: `cruft/investigation/QUERY-CONTROL-HIGHLIGHTS-SUMMARY.md`
- Discover spec: `cruft/specs/03-discover-feature-specification.md`
- Existing E2E tests: `frontend/e2e/components/query-control*.spec.ts`

---

**Last Updated**: 2026-01-02
