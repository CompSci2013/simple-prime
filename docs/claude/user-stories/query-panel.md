# Query Panel Component - User Stories

**Created**: 2026-01-02
**Component**: Query Panel
**Location**: `frontend/src/framework/components/query-panel/`
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
- **Arrow keys**: Navigate within control (dropdown options, spinner buttons)
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
| BUG-003 | US-QP-020 | Query Panel Year Range inputs do not sync when year filter applied via Query Control. URL and Query Control chip show correct value but Query Panel inputs stay at "Min"/"Max". | Low | ✅ FIXED (Session 74) |

---

## Overview

The Query Panel component provides a domain-agnostic filter interface. It renders filter controls dynamically based on `domainConfig.filters` configuration. For the automobile domain, this includes:
- **Manufacturer** (autocomplete)
- **Model** (autocomplete)
- **Year Range** (min/max number inputs)
- **Body Class** (multiselect dropdown)
- **VIN Count Range** (min/max number inputs)
- **Clear Filters** button

The panel updates filters via `ResourceManagementService.updateFilters()` and syncs with URL state.

---

## Epic 1: Panel Layout and Visibility

### US-QP-001: View Query Panel
**Status**: UNVERIFIED

**As a** data analyst
**I want to** see the Query Panel on the Discover page
**So that** I can access filter controls

**Acceptance Criteria**:
- [ ] UNVERIFIED - Query Panel appears in panel list with title "Query Panel"
- [ ] UNVERIFIED - Panel header shows hamburger icon (drag handle), collapse button, pop-out button
- [ ] UNVERIFIED - Panel content displays filter grid
- [ ] UNVERIFIED - Panel is collapsible via chevron button
- [ ] UNVERIFIED - Panel supports pop-out to separate window

---

### US-QP-002: View Filter Grid Layout
**Status**: UNVERIFIED

**As a** data analyst
**I want to** see all filter controls organized in a responsive grid
**So that** I can find the filter I need

**Acceptance Criteria**:
- [ ] UNVERIFIED - Filters displayed in responsive grid (auto-fit, min 250px columns)
- [ ] UNVERIFIED - Each filter has label above the input
- [ ] UNVERIFIED - Labels are bold (font-weight 600) and properly colored
- [ ] UNVERIFIED - Grid adapts to panel width

---

### US-QP-003: View Filter Labels
**Status**: UNVERIFIED

**As a** data analyst
**I want to** see clear labels for each filter field
**So that** I know what each input controls

**Acceptance Criteria**:
- [ ] UNVERIFIED - "Manufacturer" label above manufacturer input
- [ ] UNVERIFIED - "Model" label above model input
- [ ] UNVERIFIED - "Year Range" label above year min input
- [ ] UNVERIFIED - "Year Range Max" label above year max input
- [ ] UNVERIFIED - "Body Class" label above body class dropdown
- [ ] UNVERIFIED - "VIN Count Range" label above VIN count min input
- [ ] UNVERIFIED - "VIN Count Range Max" label above VIN count max input

---

## Epic 2: Autocomplete Filters (Manufacturer, Model)

### US-QP-010: View Manufacturer Autocomplete
**Status**: UNVERIFIED

**As a** data analyst
**I want to** see a manufacturer search input
**So that** I can filter by vehicle manufacturer

**Acceptance Criteria**:
- [ ] UNVERIFIED - Text input with placeholder "Enter manufacturer name..."
- [ ] UNVERIFIED - Input styled consistently with dark theme
- [ ] UNVERIFIED - Clear button (X) appears when input has value

---

### US-QP-011: Search Manufacturer
**Status**: UNVERIFIED

**As a** data analyst
**I want to** search for manufacturers by typing
**So that** I can quickly find the manufacturer I need

**Acceptance Criteria**:
- [ ] UNVERIFIED - Typing triggers API call to `/api/specs/v1/filters/manufacturers?search=<query>&limit=10`
- [ ] UNVERIFIED - Suggestions dropdown appears with matching manufacturers
- [ ] UNVERIFIED - Search is debounced (300ms delay)
- [ ] UNVERIFIED - Up to 10 suggestions shown
- [ ] UNVERIFIED - Suggestions filter as user types more characters

---

### US-QP-012: Select Manufacturer from Suggestions
**Status**: UNVERIFIED

**As a** data analyst
**I want to** select a manufacturer from the suggestions
**So that** the filter is applied

**Acceptance Criteria**:
- [ ] UNVERIFIED - Clicking suggestion selects it and closes dropdown
- [ ] UNVERIFIED - Selected value appears in input
- [ ] UNVERIFIED - URL updates: `?manufacturer=<value>&page=1`
- [ ] UNVERIFIED - Results table refreshes with filtered data
- [ ] UNVERIFIED - Keyboard: Arrow keys navigate, Enter/Space selects

---

### US-QP-013: Apply Typed Manufacturer Value
**Status**: UNVERIFIED

**As a** data analyst
**I want to** apply a typed value even without selecting from dropdown
**So that** I can search for partial matches

**Acceptance Criteria**:
- [ ] UNVERIFIED - Blurring input with typed text applies the filter
- [ ] UNVERIFIED - URL updates with typed value
- [ ] UNVERIFIED - Filter uses "contains" operator by default

---

### US-QP-014: Clear Manufacturer Filter
**Status**: UNVERIFIED

**As a** data analyst
**I want to** clear the manufacturer filter
**So that** I can remove that filter criterion

**Acceptance Criteria**:
- [ ] UNVERIFIED - X button appears when input has value
- [ ] UNVERIFIED - Clicking X clears the input
- [ ] UNVERIFIED - URL parameter removed
- [ ] UNVERIFIED - Results refresh to show unfiltered data (for this field)

---

### US-QP-015: View Model Autocomplete
**Status**: UNVERIFIED

**As a** data analyst
**I want to** see a model search input
**So that** I can filter by vehicle model

**Acceptance Criteria**:
- [ ] UNVERIFIED - Text input with placeholder "Type to search models..."
- [ ] UNVERIFIED - Behaves identically to manufacturer autocomplete
- [ ] UNVERIFIED - API endpoint: `/api/specs/v1/filters/models?search=<query>&limit=10`

---

### US-QP-016: Autocomplete Focus Behavior
**Status**: UNVERIFIED

**As a** data analyst
**I want to** see suggestions when I focus an empty autocomplete
**So that** I can see available options

**Acceptance Criteria**:
- [ ] UNVERIFIED - Focusing empty input loads initial suggestions (empty query)
- [ ] UNVERIFIED - First 10 options displayed
- [ ] UNVERIFIED - User can type to filter or click to select

---

## Epic 3: Year Range Filter

### US-QP-020: View Year Range Inputs
**Status**: UNVERIFIED

**As a** data analyst
**I want to** see year range inputs
**So that** I can filter by vehicle year

**Acceptance Criteria**:
- [ ] UNVERIFIED - Two separate inputs: "Year Range" (min) and "Year Range Max" (max)
- [ ] UNVERIFIED - Both use p-inputNumber component with spin buttons
- [ ] UNVERIFIED - Min placeholder shows "Min"
- [ ] UNVERIFIED - Max placeholder shows "Max"
- [ ] UNVERIFIED - Years display without comma grouping (1980, not 1,980)

---

### US-QP-021: Enter Year Min Value
**Status**: UNVERIFIED

**As a** data analyst
**I want to** enter a minimum year
**So that** I can filter to vehicles from that year onward

**Acceptance Criteria**:
- [ ] UNVERIFIED - Typing numeric value in Year Range input works
- [ ] UNVERIFIED - Spin buttons increment/decrement by 1
- [ ] UNVERIFIED - URL updates: `?yearMin=<value>&page=1`
- [ ] UNVERIFIED - Results filtered to vehicles >= yearMin
- [ ] UNVERIFIED - Clear button (X) appears when value entered

---

### US-QP-022: Enter Year Max Value
**Status**: UNVERIFIED

**As a** data analyst
**I want to** enter a maximum year
**So that** I can filter to vehicles up to that year

**Acceptance Criteria**:
- [ ] UNVERIFIED - Typing numeric value in Year Range Max input works
- [ ] UNVERIFIED - Spin buttons increment/decrement by 1
- [ ] UNVERIFIED - URL updates: `?yearMax=<value>&page=1`
- [ ] UNVERIFIED - Results filtered to vehicles <= yearMax
- [ ] UNVERIFIED - Clear button (X) appears when value entered

---

### US-QP-023: Apply Combined Year Range
**Status**: UNVERIFIED

**As a** data analyst
**I want to** set both min and max year
**So that** I can filter to a specific year range

**Acceptance Criteria**:
- [ ] UNVERIFIED - Both values can be set independently
- [ ] UNVERIFIED - URL updates: `?yearMin=<min>&yearMax=<max>&page=1`
- [ ] UNVERIFIED - Results show vehicles where yearMin <= year <= yearMax

---

### US-QP-024: Clear Year Min Value
**Status**: UNVERIFIED

**As a** data analyst
**I want to** clear the minimum year filter
**So that** I can remove that bound

**Acceptance Criteria**:
- [ ] UNVERIFIED - X button next to Year Range input clears yearMin
- [ ] UNVERIFIED - URL parameter `yearMin` removed
- [ ] UNVERIFIED - Year Max remains if set
- [ ] UNVERIFIED - Results refresh accordingly

---

### US-QP-025: Clear Year Max Value
**Status**: UNVERIFIED

**As a** data analyst
**I want to** clear the maximum year filter
**So that** I can remove that bound

**Acceptance Criteria**:
- [ ] UNVERIFIED - X button next to Year Range Max input clears yearMax
- [ ] UNVERIFIED - URL parameter `yearMax` removed
- [ ] UNVERIFIED - Year Min remains if set
- [ ] UNVERIFIED - Results refresh accordingly

---

### US-QP-026: Year Input Bounds
**Status**: UNVERIFIED

**As a** data analyst
**I want to** understand valid year bounds
**So that** I enter sensible values

**Acceptance Criteria**:
- [ ] UNVERIFIED - Minimum allowed year: 1900
- [ ] UNVERIFIED - Maximum allowed year: current year + 1 (for upcoming models)
- [ ] UNVERIFIED - Spin buttons respect these bounds
- [ ] UNVERIFIED - Typed values outside bounds handled gracefully

---

### US-QP-027: Sync Year Range from URL
**Status**: UNVERIFIED

**As a** data analyst
**I want to** see year inputs populated from URL on page load
**So that** I know what filters are active

**Acceptance Criteria**:
- [ ] UNVERIFIED - Opening URL with `?yearMin=1980&yearMax=2000` shows "1980" in min input
- [ ] UNVERIFIED - Max input shows "2000"
- [ ] UNVERIFIED - Results are already filtered
- [ ] UNVERIFIED - URL state restored from Query Control also syncs to Query Panel

---

## Epic 4: Body Class Multiselect Filter

### US-QP-030: View Body Class Dropdown
**Status**: UNVERIFIED

**As a** data analyst
**I want to** see a body class dropdown
**So that** I can filter by vehicle body class

**Acceptance Criteria**:
- [ ] UNVERIFIED - p-multiSelect dropdown with placeholder "Select body classes..."
- [ ] UNVERIFIED - Dropdown shows count of selected items when selections made
- [ ] UNVERIFIED - Clear button available when selections exist

---

### US-QP-031: Load Body Class Options
**Status**: UNVERIFIED

**As a** data analyst
**I want to** see available body class options
**So that** I can choose which body classes to include

**Acceptance Criteria**:
- [ ] UNVERIFIED - Options loaded from API endpoint `/api/specs/v1/agg/body_class`
- [ ] UNVERIFIED - All body classes in data are available (12 options expected)
- [ ] UNVERIFIED - Options include: Convertible, Coupe, Hatchback, Limousine, Pickup, SUV, Sedan, Sports Car, Touring Car, Truck, Van, Wagon

---

### US-QP-032: Search Body Class Options
**Status**: UNVERIFIED

**As a** data analyst
**I want to** search within body class options
**So that** I can find specific body classes quickly

**Acceptance Criteria**:
- [ ] UNVERIFIED - Filter input at top of dropdown
- [ ] UNVERIFIED - Typing filters checkbox list
- [ ] UNVERIFIED - Search is case-insensitive
- [ ] UNVERIFIED - Partial matches shown

---

### US-QP-033: Select Body Classes
**Status**: UNVERIFIED

**As a** data analyst
**I want to** select multiple body classes
**So that** I can include several body types in my search

**Acceptance Criteria**:
- [ ] UNVERIFIED - Clicking checkbox toggles selection
- [ ] UNVERIFIED - Multiple selections allowed
- [ ] UNVERIFIED - Selection reflected in dropdown display
- [ ] UNVERIFIED - URL updates: `?bodyClass=Sedan,SUV&page=1`
- [ ] UNVERIFIED - Results filtered to match selected body classes

---

### US-QP-034: Clear Body Class Filter
**Status**: UNVERIFIED

**As a** data analyst
**I want to** clear all body class selections
**So that** I can remove that filter

**Acceptance Criteria**:
- [ ] UNVERIFIED - Clear button in multiselect removes all selections
- [ ] UNVERIFIED - URL parameter `bodyClass` removed
- [ ] UNVERIFIED - Dropdown resets to placeholder state
- [ ] UNVERIFIED - Results refresh to show all body classes

---

## Epic 5: VIN Count Range Filter

### US-QP-040: View VIN Count Range Inputs
**Status**: UNVERIFIED

**As a** data analyst
**I want to** see VIN count range inputs
**So that** I can filter by number of associated VINs

**Acceptance Criteria**:
- [ ] UNVERIFIED - Two inputs: "VIN Count Range" (min) and "VIN Count Range Max" (max)
- [ ] UNVERIFIED - Both use p-inputNumber with spin buttons
- [ ] UNVERIFIED - Numbers display WITH comma grouping (1,000 not 1000)
- [ ] UNVERIFIED - Placeholder shows "Min" and "Max" respectively

---

### US-QP-041: Enter VIN Count Min
**Status**: UNVERIFIED

**As a** data analyst
**I want to** enter a minimum VIN count
**So that** I can filter to vehicles with at least that many VINs

**Acceptance Criteria**:
- [ ] UNVERIFIED - Typing numeric value works
- [ ] UNVERIFIED - Spin buttons increment/decrement by 1
- [ ] UNVERIFIED - URL updates: `?instanceCountRangeMin=<value>&page=1`
- [ ] UNVERIFIED - Results filtered accordingly
- [ ] UNVERIFIED - Clear button appears when value entered

---

### US-QP-042: Enter VIN Count Max
**Status**: UNVERIFIED

**As a** data analyst
**I want to** enter a maximum VIN count
**So that** I can filter to vehicles with at most that many VINs

**Acceptance Criteria**:
- [ ] UNVERIFIED - Typing numeric value works
- [ ] UNVERIFIED - Spin buttons increment/decrement by 1
- [ ] UNVERIFIED - URL updates: `?instanceCountRangeMax=<value>&page=1`
- [ ] UNVERIFIED - Results filtered accordingly
- [ ] UNVERIFIED - Clear button appears when value entered

---

### US-QP-043: VIN Count Input Bounds
**Status**: UNVERIFIED

**As a** data analyst
**I want to** understand valid VIN count bounds
**So that** I enter sensible values

**Acceptance Criteria**:
- [ ] UNVERIFIED - Minimum: 0
- [ ] UNVERIFIED - Maximum: 10000
- [ ] UNVERIFIED - Spin buttons respect bounds
- [ ] UNVERIFIED - Negative values not allowed

---

## Epic 6: Clear All Filters

### US-QP-050: View Clear Filters Button
**Status**: UNVERIFIED

**As a** data analyst
**I want to** see a Clear Filters button
**So that** I can reset all Query Panel filters at once

**Acceptance Criteria**:
- [ ] UNVERIFIED - "Clear Filters" button visible in filter grid
- [ ] UNVERIFIED - Button shows filter-slash icon (pi pi-filter-slash)
- [ ] UNVERIFIED - Button styled as outlined (p-button-outlined)

---

### US-QP-051: Clear All Filters Action
**Status**: UNVERIFIED

**As a** data analyst
**I want to** click Clear Filters to reset all inputs
**So that** I can start fresh

**Acceptance Criteria**:
- [ ] UNVERIFIED - Clicking button clears all Query Panel filter inputs
- [ ] UNVERIFIED - Manufacturer input cleared
- [ ] UNVERIFIED - Model input cleared
- [ ] UNVERIFIED - Year Range min/max cleared
- [ ] UNVERIFIED - Body Class dropdown cleared
- [ ] UNVERIFIED - VIN Count Range min/max cleared
- [ ] UNVERIFIED - URL parameters for these fields removed
- [ ] UNVERIFIED - Results show complete dataset (page 1)

---

### US-QP-052: Clear Filters vs Query Control
**Status**: UNVERIFIED

**As a** data analyst
**I want to** understand scope of Clear Filters button
**So that** I know what will be cleared

**Acceptance Criteria**:
- [ ] UNVERIFIED - Query Panel "Clear Filters" only clears Query Panel filters
- [ ] UNVERIFIED - Query Control filters (if any) remain unchanged
- [ ] UNVERIFIED - Highlight filters remain unchanged
- [ ] UNVERIFIED - Page size preference preserved

---

## Epic 7: URL State Synchronization

### US-QP-060: Filter Changes Update URL
**Status**: UNVERIFIED

**As a** data analyst
**I want to** see my filter selections reflected in the URL
**So that** I can bookmark or share my view

**Acceptance Criteria**:
- [ ] UNVERIFIED - Every filter change updates URL parameters immediately
- [ ] UNVERIFIED - URL parameter names match field IDs (manufacturer, model, yearMin, yearMax, bodyClass, instanceCountRangeMin, instanceCountRangeMax)
- [ ] UNVERIFIED - Page resets to 1 on any filter change

---

### US-QP-061: Restore Filters from URL
**Status**: UNVERIFIED

**As a** data analyst
**I want to** see filters restored from URL on page load
**So that** bookmarked views work correctly

**Acceptance Criteria**:
- [ ] UNVERIFIED - Opening URL with parameters populates Query Panel inputs
- [ ] UNVERIFIED - Year inputs show URL values
- [ ] UNVERIFIED - Body Class dropdown reflects URL selections
- [ ] UNVERIFIED - Results are already filtered on load
- [ ] UNVERIFIED - Works across browser sessions

---

### US-QP-062: Browser Back/Forward Navigation
**Status**: UNVERIFIED

**As a** data analyst
**I want to** use browser back/forward buttons
**So that** I can navigate my filter history

**Acceptance Criteria**:
- [ ] UNVERIFIED - Filter changes create history entries
- [ ] UNVERIFIED - Back button reverts to previous filter state
- [ ] UNVERIFIED - Query Panel inputs update to match URL
- [ ] UNVERIFIED - Results refresh accordingly

---

## Epic 8: Panel Behavior

### US-QP-070: Collapse Query Panel
**Status**: UNVERIFIED

**As a** data analyst
**I want to** collapse the Query Panel
**So that** I can save screen space

**Acceptance Criteria**:
- [ ] UNVERIFIED - Collapse button (chevron-down) in panel header
- [ ] UNVERIFIED - Clicking hides panel content, shows only header
- [ ] UNVERIFIED - Button changes to chevron-right when collapsed
- [ ] UNVERIFIED - Tooltip changes from "Collapse" to "Expand"

---

### US-QP-071: Expand Collapsed Panel
**Status**: UNVERIFIED

**As a** data analyst
**I want to** expand a collapsed panel
**So that** I can access the controls again

**Acceptance Criteria**:
- [ ] UNVERIFIED - Expand button (chevron-right) shown when collapsed
- [ ] UNVERIFIED - Clicking restores full panel content
- [ ] UNVERIFIED - Filter inputs retain their values after expand
- [ ] UNVERIFIED - Button changes back to chevron-down

---

### US-QP-072: Pop-Out Query Panel
**Status**: UNVERIFIED

**As a** data analyst
**I want to** pop out the Query Panel to a separate window
**So that** I can have more screen real estate

**Acceptance Criteria**:
- [ ] UNVERIFIED - Pop-out button (pi-external-link) in panel header
- [ ] UNVERIFIED - Tooltip shows "Pop out to separate window"
- [ ] UNVERIFIED - Clicking opens panel in new browser window
- [ ] UNVERIFIED - Pop-out URL: `/panel/discover/query-panel/query-panel?popout=query-panel`
- [ ] UNVERIFIED - Main page shows placeholder: "Query Panel is open in a separate window"

---

### US-QP-073: Sync Filter Changes in Pop-Out
**Status**: UNVERIFIED

**As a** data analyst
**I want to** change filters in the pop-out window
**So that** the main window updates accordingly

**Acceptance Criteria**:
- [ ] UNVERIFIED - Changing filter in pop-out emits urlParamsChange event
- [ ] UNVERIFIED - Main window URL updates
- [ ] UNVERIFIED - Main window Results Table refreshes
- [ ] UNVERIFIED - No manual refresh required (BroadcastChannel sync)

---

### US-QP-074: Drag to Reorder Panel
**Status**: UNVERIFIED

**As a** data analyst
**I want to** drag the Query Panel to reorder it
**So that** I can customize my layout

**Acceptance Criteria**:
- [ ] UNVERIFIED - Hamburger icon (pi-bars) is drag handle
- [ ] UNVERIFIED - Dragging panel repositions it in panel list
- [ ] UNVERIFIED - Panel order persists (localStorage or URL)
- [ ] UNVERIFIED - Drop indicator shows valid drop zones

---

## Epic 9: Integration with Other Components

### US-QP-080: Coordinate with Query Control
**Status**: UNVERIFIED

**As a** data analyst
**I want to** Query Panel filters to combine with Query Control filters
**So that** I can use both filter methods

**Acceptance Criteria**:
- [ ] UNVERIFIED - Query Panel and Query Control filters combine (AND logic)
- [ ] UNVERIFIED - URL contains parameters from both components
- [ ] UNVERIFIED - Results reflect intersection of both
- [ ] UNVERIFIED - Changing one component updates results immediately

---

### US-QP-081: Update Charts on Filter Change
**Status**: UNVERIFIED

**As a** data analyst
**I want to** see charts update when I filter
**So that** visualizations reflect current data

**Acceptance Criteria**:
- [ ] UNVERIFIED - Adding/removing Query Panel filter triggers chart update
- [ ] UNVERIFIED - Charts show filtered data subset
- [ ] UNVERIFIED - No manual refresh required

---

### US-QP-082: Update Statistics on Filter Change
**Status**: UNVERIFIED

**As a** data analyst
**I want to** see statistics update when I filter
**So that** I know the size of my filtered dataset

**Acceptance Criteria**:
- [ ] UNVERIFIED - Statistics component receives filtered data
- [ ] UNVERIFIED - Counts and distributions update
- [ ] UNVERIFIED - Matches results table row count

---

### US-QP-083: Results Table Pagination Reset
**Status**: UNVERIFIED

**As a** data analyst
**I want to** return to page 1 when filtering
**So that** I don't see an empty page

**Acceptance Criteria**:
- [ ] UNVERIFIED - Any Query Panel filter change resets to page 1
- [ ] UNVERIFIED - URL updates include `page=1`
- [ ] UNVERIFIED - Results show first page of filtered data

---

## Epic 10: Accessibility

### US-QP-090: Keyboard Navigation
**Status**: UNVERIFIED

**As a** keyboard user
**I want to** navigate Query Panel without a mouse
**So that** I can use the app accessibly

**Acceptance Criteria**:
- [ ] UNVERIFIED - Tab navigates through all interactive elements
- [ ] UNVERIFIED - Focus order: Manufacturer → Model → Year Min → Year Max → Body Class → VIN Min → VIN Max → Clear Filters
- [ ] UNVERIFIED - Enter activates buttons
- [ ] UNVERIFIED - Space toggles checkboxes in multiselect
- [ ] UNVERIFIED - Arrow keys work in dropdowns and spinners

---

### US-QP-091: Focus Indicators
**Status**: UNVERIFIED

**As a** keyboard user
**I want to** see visible focus indicators
**So that** I know where I am in the interface

**Acceptance Criteria**:
- [ ] UNVERIFIED - Focus ring visible on all interactive elements
- [ ] UNVERIFIED - Sufficient contrast on dark theme
- [ ] UNVERIFIED - Focus indicator follows tab navigation

---

### US-QP-092: Label Association
**Status**: UNVERIFIED

**As a** screen reader user
**I want to** labels properly associated with inputs
**So that** I can understand what each input controls

**Acceptance Criteria**:
- [ ] UNVERIFIED - Labels have `for` attribute matching input ID
- [ ] UNVERIFIED - Screen reader announces label when input focused
- [ ] UNVERIFIED - Each input has unique ID

---

## Epic 11: Error Handling

### US-QP-100: Handle API Error Loading Options
**Status**: UNVERIFIED

**As a** data analyst
**I want to** see helpful error handling
**So that** I know when something goes wrong

**Acceptance Criteria**:
- [ ] UNVERIFIED - If body class options API fails, error logged to console
- [ ] UNVERIFIED - Dropdown remains usable (empty options)
- [ ] UNVERIFIED - No crash or white screen

---

### US-QP-101: Handle Autocomplete API Error
**Status**: UNVERIFIED

**As a** data analyst
**I want to** graceful handling when autocomplete fails
**So that** I can still use the input

**Acceptance Criteria**:
- [ ] UNVERIFIED - If autocomplete API fails, error logged
- [ ] UNVERIFIED - Suggestions dropdown shows empty
- [ ] UNVERIFIED - User can still type and blur to apply filter

---

### US-QP-102: Handle Invalid URL Parameters
**Status**: UNVERIFIED

**As a** data analyst
**I want to** graceful handling of bad URL values
**So that** the app doesn't crash

**Acceptance Criteria**:
- [ ] UNVERIFIED - Invalid year values handled (e.g., "abc" for yearMin)
- [ ] UNVERIFIED - Non-existent body class values ignored
- [ ] UNVERIFIED - Valid parameters still applied

---

---

## Summary Statistics

| Epic | Stories | Status | Notes |
|------|---------|--------|-------|
| 1: Panel Layout | 3 | UNVERIFIED | Basic layout and visibility |
| 2: Autocomplete Filters | 7 | UNVERIFIED | Manufacturer/Model inputs |
| 3: Year Range Filter | 8 | UNVERIFIED | Min/max year inputs |
| 4: Body Class Multiselect | 5 | UNVERIFIED | Multiselect dropdown |
| 5: VIN Count Range | 4 | UNVERIFIED | Min/max VIN count |
| 6: Clear All Filters | 3 | UNVERIFIED | Clear button behavior |
| 7: URL State | 3 | UNVERIFIED | URL synchronization |
| 8: Panel Behavior | 5 | UNVERIFIED | Collapse/expand/pop-out |
| 9: Integration | 4 | UNVERIFIED | Coordination with other components |
| 10: Accessibility | 3 | UNVERIFIED | Keyboard/screen reader |
| 11: Error Handling | 3 | UNVERIFIED | API errors |
| **Total** | **48** | **UNVERIFIED** | Initial generation |

---

## Validation Progress

| Status | Count | Notes |
|--------|-------|-------|
| UNVERIFIED | 48 | All stories pending validation |
| VERIFIED | 0 | None yet |
| BUG | 0 | BUG-003 fixed in Session 74 |
| FLAGGED | 0 | None yet |
| INCORRECT | 0 | None yet |

**Last Generated**: 2026-01-02 (Session 75)
**Test Specs**: `frontend/e2e/validation/us-qp-*.spec.ts` (to be created)

---

## Sources Referenced

- Component code: `query-panel.component.ts`, `.html`, `.scss`
- Filter definitions: `domain-config/automobile/configs/automobile.filter-definitions.ts`
- Domain config interface: `framework/models/domain-config.interface.ts`
- Query Control user stories: `docs/claude/user-stories/query-control.md`
- Screenshot: Query Panel UI in Discover page

---

**Last Updated**: 2026-01-02
