# Query Control Component Specification

**Component Name**: Query Control Panel
**Feature**: Discover Page - Panel #1
**Spec Reference**: [specs/03-discover-feature-specification.md](../../../specs/03-discover-feature-specification.md)
**Last Updated**: 2025-11-22
**Status**: Draft - Gathering Requirements

---

## 1. COMPONENT OVERVIEW

### Purpose
The Query Control panel provides a manual filter management interface that allows users to add, edit, and remove filters on vehicle data. It complements the picker-based filtering by offering fine-grained control over individual data fields.

### User Story
```
As a vehicle analyst
I want to manually add and remove filters by field
So that I can refine my search beyond manufacturer-model selections
```

### Location in UI
- **Page**: Discover Page (`/discover`)
- **Panel**: Panel #1 - Query Control
- **Position**: Top of discover page, above Model Picker
- **Collapsible**: Yes (red collapse button on right)

---

## 2. WIREFRAME

### Panel Collapsed/Expanded State

```
┌─────────────────────────────────────────────────────────────────┐
│  Query Control                            [Clear All]       [−] │
├─────────────────────────────────────────────────────────────────┤
│  [Add filter by field...                                   ▼]  │
│                                                                 │
│  Active Filters:                                                │
│    [Manufacturer: Buick                                     ⊗]  │
│    [Model: Cascada, Century, Coachbuilder                   ⊗]  │
│    [Body Class                                           ▼  ⊗]  │
│                                                                 │
│  Active Highlights:                         [Clear All Highlights] │
│    [Highlight Models: Buick:Regal,Jeep:Cherokee,Ford:F-150  ⊗]  │
└─────────────────────────────────────────────────────────────────┘
```

### Filter Selection Dropdown (Expanded)

```
┌─────────────────────────────────────────────────────────┐
│  [Add filter by field...                           ▲]  │
│  ┌───────────────────────────────────────────────────┐ │
│  │ [🔍 Search fields...]                            │ │
│  ├───────────────────────────────────────────────────┤ │
│  │  Manufacturer                                     │ │
│  │  Model                                            │ │
│  │  Year                                             │ │
│  │  Body Class                                       │ │
│  │  Data Source                                      │ │
│  │  ... (more fields)                              ▼ │ │
│  └───────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### Body Class Filter Dialog (Modal - Multiselect)

```
        ╔══════════════════════════════════════════════╗
        ║  Select Body Classes                    [⊗] ║
        ╠══════════════════════════════════════════════╣
        ║  Select one or more body classes to filter   ║
        ║                                               ║
        ║  [🔍 Type to search body classes...]         ║
        ║  ┌────────────────────────────────────────┐ ║
        ║  │ ☐ Convertible                          │ ║
        ║  │ ☐ Coupe                                │ ║
        ║  │ ☐ Hatchback                            │ ║
        ║  │ ☐ Limousine                            │ ║
        ║  │ ☐ Pickup                               │ ║
        ║  │ ☐ SUV                                  │ ║
        ║  │ ☐ Sedan                                │ ║
        ║  │ ☐ Sports Car                           │ ║
        ║  │ ☐ Touring Car                          │ ║
        ║  │ ☐ Truck                                │ ║
        ║  │ ☐ Van                                  │ ║
        ║  │ ☐ Wagon                              ▼ │ ║
        ║  └────────────────────────────────────────┘ ║
        ║                                               ║
        ║                    [Cancel]  [Apply]          ║
        ╚══════════════════════════════════════════════╝
```

### Year Range Filter Dialog (Year Picker)

```
        ╔══════════════════════════════════════════════╗
        ║  Select Year Range                      [⊗] ║
        ╠══════════════════════════════════════════════╣
        ║  Year                                         ║
        ║  Select a year range to filter results.      ║
        ║  You can select just a start year, end year, ║
        ║  or both.                                     ║
        ║                                               ║
        ║  [Select Year Range                      📅] ║
        ║                                               ║
        ║       ◄        2020 - 2029        ►           ║
        ║                                               ║
        ║         2020           2021                   ║
        ║         2022           2023                   ║
        ║         2024           2025                   ║
        ║         2026           2027                   ║
        ║         2028           2029                   ║
        ║                                               ║
        ║                    [Cancel]  [Apply]          ║
        ╚══════════════════════════════════════════════╝
```

**Year Picker Behavior**:
- Click year once → Becomes start year
- Click another year → Becomes end year (forms range)
- Input field updates to show: "1980 - 2003"
- Left/Right arrows navigate decade ranges
- Can select single year (same start/end) or range

---

## 3. INPUTS & CONSTRAINTS

### Filter Field Selection Dropdown

| Field | Type | Required | Validation | Default | Example |
|-------|------|----------|------------|---------|---------|
| Search Query | Text | No | Max 100 chars | Empty | "body" |
| Selected Field | Single Select | No | Must be valid field from list | Empty | "Body Class" |

### Multiselect Filter Dialog (Body Class, Manufacturer, Model, Data Source)

| Field | Type | Required | Validation | Default | Example |
|-------|------|----------|------------|---------|---------|
| Search | Text | No | Max 100 chars | Empty | "suv" |
| Selections | Checkbox Array | No | At least 1 for Apply | None | ["Sedan", "SUV", "Pickup"] |

### Range Filter Dialog (Year)

**Type**: Year Range Picker (Grid Selection)

| Field | Type | Required | Validation | Default | Example |
|-------|------|----------|------------|---------|---------|
| Start Year | Single Select | No | Must be <= End Year | Empty | 1980 |
| End Year | Single Select | No | Must be >= Start Year | Empty | 2003 |
| Year Grid | Grid Display | N/A | Shows 10 years per page | Current decade | 2020-2029 |

**Selection Modes**:
- Select start year only → Filters from that year onward
- Select end year only → Filters up to that year
- Select both → Filters to range (inclusive)

### URL Parameters

| Parameter | Format | Example | Description |
|-----------|--------|---------|-------------|
| `manufacturer` | Comma-separated strings | `Buick,Brammo` | Manufacturer filter |
| `model` | Comma-separated strings | `Scooter` | Model filter |
| `yearMin` | Integer | `1980` | Minimum year (start of range) |
| `yearMax` | Integer | `2003` | Maximum year (end of range) |
| `bodyClass` | Comma-separated strings | `Sedan,SUV,Pickup` | Body class filter |
| `dataSource` | Comma-separated strings | `nhtsa_vpic` | Data source filter |

**URL Example** (from screenshot):
```
?manufacturer=Buick,Brammo&model=Scooter&yearMin=1980&yearMax=2003&page=1&size=20
```

---

## 4. USER ACTIONS & RESULTS

### Action 1: Open Filter Field Selection Dropdown

**Trigger**: User clicks "Add filter by field..." dropdown
**Validation**: None
**Result**:
- Dropdown expands downward
- Shows search box at top
- Displays scrollable list of available filter fields
- User can type to filter field list
- List filters in real-time (case-insensitive partial match)

**Error Handling**: None (always works)

---

### Action 2: Search for Field in Dropdown

**Trigger**: User types in search box within dropdown
**Debounce**: None (instant filtering)
**Validation**: None (accepts any text)
**Result**:
- Field list filters to show only matching fields
- Case-insensitive partial match on field name
- Shows "No fields found" if no matches (TBD)

**Error Handling**:
- No matches → Show empty list or "No fields found" message

---

### Action 3: Select Field from Dropdown

**Trigger**: User clicks a field name in the dropdown (e.g., "Body Class")
**Validation**: None
**Result**:
- Dropdown closes immediately
- Appropriate filter dialog opens as modal overlay
- Dialog loads available options from API
- Shows loading state if API call is in progress
- Dialog type depends on field:
  - **Multiselect fields** (Manufacturer, Model, Body Class, Data Source): Checkbox dialog
  - **Range fields** (Year): Min/Max input dialog (TBD)

**Error Handling**:
- API error → Show error message in dialog with retry button
- Network timeout → Show timeout message with retry option

---

### Action 4: Search Options in Filter Dialog

**Trigger**: User types in search box within filter dialog
**Debounce**: 300ms
**Validation**: None (accepts any text)
**Result**:
- Checkbox list filters to show only matching options
- Case-insensitive partial match on option text
- Maintains current selections while filtering view
- Scroll position resets to top

**Error Handling**:
- No matches → Show "No results found" message
- Search clears when dialog reopens

---

### Action 5: Select/Deselect Options in Dialog

**Trigger**: User clicks checkbox for an option
**Validation**: None (multiple selections allowed)
**Result**:
- Checkbox toggles checked/unchecked state
- Visual feedback (checkbox fills/empties)
- Selection count may update (if displayed)
- Apply button remains enabled

**Behavior**:
- Can select 0 or more items
- No maximum limit on selections
- Selections persist while dialog is open
- Selections cleared if Cancel is clicked

---

### Action 6: Apply Filter from Dialog

**Trigger**: User clicks "Apply" button
**Validation**:
- At least 1 item selected (TBD - may allow empty to clear filter)

**Result**:
- Dialog closes immediately
- If filter already exists:
  - Existing chip updates with new values
  - URL parameter updates
- If new filter:
  - New filter chip appears in "Active Filters" section
  - URL parameter added
- Results table refreshes with filtered data
- Statistics update to reflect new filter
- Charts update to highlight filtered subset

**Error Handling**:
- API error during refresh → Show error toast notification
- Filter chip remains visible (not reverted)

---

### Action 7: Cancel Filter Dialog

**Trigger**: User clicks "Cancel" button OR clicks X button in dialog corner OR presses Escape key
**Result**:
- Dialog closes immediately
- No changes applied
- URL unchanged
- Results unchanged
- Previous selections (if editing) remain unchanged

---

### Action 8: Remove Filter via Chip X Button

**Trigger**: User clicks X (⊗) button on right side of filter chip
**Validation**: None
**Result**:
- Chip disappears immediately (animated fade out)
- URL parameter removed
- Results table refreshes without that filter
- Statistics recalculate
- Charts update to show unfiltered data
- If last filter removed, shows all data

**Error Handling**:
- API error during refresh → Show error toast
- Chip already removed (no rollback)

---

### Action 9: Edit Existing Filter (Click on Chip)

**Trigger**: User clicks anywhere on the filter chip
**Validation**: None
**Result**:
- Filter dialog re-opens
- Current selections are pre-checked in dialog
- User can modify selections (add/remove items)
- Apply updates filter, Cancel discards changes

**Visual Feedback**:
- Hovering over chip shows tooltip: "[Field Name]: [Values] (Click to edit)"
- Chip itself is clickable (entire chip, not just dropdown arrow)
- No separate dropdown arrow - entire chip acts as edit button

**Behavior**:
- Dialog shows same options as initial filter creation
- Search box is empty (not persisted)
- Scroll position at top
- Previous selections remain checked

**Confirmed**: Screenshot shows tooltip "Manufacturer: Buick,Brammo (Click to edit)"

---

### Action 9b: Add Year Range Filter

**Trigger**: User selects "Year" from filter field dropdown
**Validation**: None on open
**Result**:
- "Select Year Range" dialog opens
- Shows year picker with calendar icon
- Displays current decade (2020-2029) initially
- Left/Right arrows to navigate decades
- Input field shows "Select Year Range"

**Year Selection Process**:
1. User clicks first year (e.g., 1980) → Becomes start year, field shows "1980 - "
2. User navigates decades using arrows (if needed)
3. User clicks second year (e.g., 2003) → Becomes end year, field shows "1980 - 2003"
4. User clicks Apply

**Alternative Flows**:
- **Single year**: Click same year twice OR click one year and Apply
- **Open-ended range**: Select start only (yearMin) or end only (yearMax)

**Result After Apply**:
- Dialog closes
- Chip appears: "Year: 1980 - 2003"
- URL updates: `?yearMin=1980&yearMax=2003`
- Results filtered to vehicles from 1980-2003 (inclusive)

**Validation**:
- Start year must be <= End year (enforced by picker behavior)
- Valid year range (picker shows available years only)

**Error Handling**:
- If user selects years in wrong order, picker auto-corrects (smaller becomes start)

---

### Action 10: Clear All Highlights

**Trigger**: User clicks "Clear All Highlights" link (in Active Highlights section)
**Location**: Top-right of Active Highlights section in Query Control panel
**Validation**: None (immediate action, no confirmation)
**Result**:
- All highlight filter chips disappear immediately
- URL highlight parameters removed (h_manufacturer, h_modelCombos, h_bodyClass, h_yearMin, h_yearMax)
- Regular filters remain unchanged
- Statistics recalculate without highlighting (charts show all data in single color)
- Charts update to remove highlighted segments

**Visual Feedback**:
- Link styled as blue text with underline
- Link only visible when one or more highlight filters active
- No visual change to regular filters

---

### Action 11: Clear All Filters

**Trigger**: User clicks "Clear All" button (red button in Query Control panel header)
**Location**: Top-right of Query Control panel header, next to collapse button
**Validation**: None (immediate action, no confirmation)
**Result**:
- All filter chips disappear immediately (both regular filters AND highlights)
- All highlight chips disappear immediately
- URL parameters reset to defaults (`?page=1&size=20`)
- Results table shows all 4,887 vehicles
- Statistics recalculate for full dataset
- Charts update to show complete distribution without highlighting

**Visual Feedback**:
- Button is red with white text
- Button disabled/greyed when no filters OR highlights active
- Button enabled when one or more filters OR highlights active

**Confirmed**: Screenshot shows "Clear All" button in Query Control header

---

## 5. OUTPUT & STATE

### Visual States

| State | Visual Indicator | Example |
|-------|------------------|---------|
| No Filters Active | Only "Add filter by field..." dropdown visible | Empty "Active Filters:" section |
| Filters Active | Chip(s) displayed in "Active Filters:" section | "Manufacturer: Buick ⊗" |
| Dropdown Open | Dropdown expanded with field list | Search box + field list visible |
| Dialog Loading | Loading spinner in dialog | "Loading body classes..." |
| Dialog Error | Error message with retry button | "Failed to load options [Retry]" |
| Search Active (Dropdown) | Filtered field list | Only "Body Class" visible when searching "body" |
| Search Active (Dialog) | Filtered checkbox list | Only "SUV" visible when searching "suv" |
| Chip Hover | Hover effect on chip | Background color change |
| Chip Edit Mode | Dropdown arrow visible on hover | ▼ appears on left side |

### Filter Chip Format

```
[Field Name: value1, value2, value3                    ⊗]
 \_________/  \____________________/                    |
  Field name   Values (comma-separated)              Remove
                                                   (entire chip is clickable for edit)
```

**Examples (from screenshots)**:
- Single value: `Model: Scooter ⊗`
- Multiple values: `Manufacturer: Buick,Brammo ⊗`
- Range value: `Year: 1980 - 2003 ⊗`
- Many body classes: `Body Class: Sedan, SUV, Pickup, ... ⊗`

**Chip Interactions**:
- **Click chip** → Re-opens filter dialog to edit
- **Click X button** → Removes filter
- **Hover** → Shows tooltip: "[Field]: [Values] (Click to edit)"

### Data Output

**Side Effects**:
1. URL parameters updated (via `UrlStateService`)
2. `ResourceManagementService.updateFilters()` called
3. Results table refreshes with filtered data
4. Statistics recalculated for filtered subset
5. Charts update with highlighted segments

**State Persistence**:
- Filters stored in URL (shareable, bookmarkable)
- Filters restored from URL on page load
- Panel collapse state saved to localStorage
- No localStorage for filter values (URL is source of truth)

---

## 6. ACCEPTANCE CRITERIA (Gherkin)

```gherkin
Feature: Query Control Panel
  As a vehicle analyst
  I want to add, edit, and remove filters manually
  So that I can refine my search beyond picker selections

Background:
  Given the user is on the discover page
  And the Query Control panel is visible
  And the panel is expanded

Scenario: View available filter fields
  When the user clicks "Add filter by field..." dropdown
  Then the dropdown should expand
  And the dropdown should show a search box
  And the dropdown should show available filter fields:
    | Field         |
    | Manufacturer  |
    | Model         |
    | Year          |
    | Body Class    |
    | Data Source   |

Scenario: Search for filter field in dropdown
  Given the filter field dropdown is open
  When the user types "body" in the search box
  Then only "Body Class" should be visible in the list
  And other fields should be hidden

Scenario: Add multiselect filter (Body Class)
  Given the filter field dropdown is open
  When the user clicks "Body Class" from the list
  Then the "Select Body Classes" dialog should open
  And the dialog should show a search box
  And the dialog should show checkbox options:
    | Option        |
    | Convertible   |
    | Coupe         |
    | Hatchback     |
    | Limousine     |
    | Pickup        |
    | SUV           |
    | Sedan         |
    | Sports Car    |
    | Touring Car   |
    | Truck         |
    | Van           |
    | Wagon         |
  When the user checks "Sedan" and "SUV"
  And the user clicks "Apply"
  Then the dialog should close
  And a chip "Body Class: Sedan, SUV" should appear in Active Filters
  And the URL should contain "?bodyClass=Sedan,SUV"
  And the results table should refresh showing only Sedans and SUVs

Scenario: Search for options in filter dialog
  Given the user has opened the "Body Class" filter dialog
  When the user types "suv" in the search box
  Then only options containing "SUV" should be visible
  And the search should be case-insensitive
  And previously selected items should remain checked

Scenario: Apply filter with no selections
  Given the user has opened the "Body Class" filter dialog
  And no checkboxes are selected
  When the user clicks "Apply"
  Then [BEHAVIOR TBD]
    Option A: Dialog shows validation error "Please select at least one option"
    Option B: Filter is removed from active filters (if editing)
    Option C: Nothing happens (Apply disabled until selection made)

Scenario: Cancel filter dialog
  Given the user has opened the "Body Class" filter dialog
  And the user has checked "Sedan" and "SUV"
  When the user clicks "Cancel"
  Then the dialog should close
  And no new filter chip should appear
  And the URL should be unchanged
  And the results should be unchanged

Scenario: Remove filter via chip
  Given the user has an active filter "Body Class: Sedan, SUV"
  When the user clicks the X button on the chip
  Then the chip should disappear
  And the URL should no longer contain "bodyClass" parameter
  And the results table should refresh showing all body classes

Scenario: Edit existing filter
  Given the user has an active filter "Body Class: Sedan, SUV"
  When the user clicks the dropdown arrow on the chip
  Then the "Select Body Classes" dialog should re-open
  And "Sedan" and "SUV" should be pre-checked
  When the user additionally checks "Pickup"
  And the user clicks "Apply"
  Then the chip should update to "Body Class: Sedan, SUV, Pickup"
  And the URL should update to "?bodyClass=Sedan,SUV,Pickup"
  And the results should refresh with the new filter

Scenario: Add multiple different filters
  When the user adds filter "Manufacturer: Ford, Toyota"
  And the user adds filter "Body Class: Sedan, SUV"
  And the user adds filter "Year: 2020-2024"
  Then three chips should be visible in Active Filters
  And the URL should contain all three parameters
  And the results should be filtered by ALL criteria (AND logic)

Scenario: Clear all filters (if button exists)
  Given the user has multiple active filters:
    | Filter       | Values          |
    | Manufacturer | Ford, Toyota    |
    | Body Class   | Sedan, SUV      |
    | Year         | 2020-2024       |
  When the user clicks "Clear All" button
  Then all filter chips should disappear
  And the URL should reset to "?page=1&size=20"
  And the results table should show all 4887 vehicles

Scenario: Handle API error when loading filter options
  Given the API is unavailable
  When the user selects "Body Class" from the dropdown
  Then the dialog should open
  And an error message should appear: "Failed to load body class options"
  And a "Retry" button should be visible
  When the API becomes available
  And the user clicks "Retry"
  Then the checkbox options should load successfully

Scenario: Persist filters across page refresh
  Given the user has active filters in the URL: "?bodyClass=Sedan&manufacturer=Ford"
  When the user refreshes the page
  Then the filter chips should restore:
    | Chip          | Values |
    | Body Class    | Sedan  |
    | Manufacturer  | Ford   |
  And the results should be filtered accordingly

Scenario: Share filtered view via URL
  Given the user has filtered to "?bodyClass=SUV&yearMin=2020&yearMax=2024"
  When the user copies the URL
  And opens it in a new browser window
  Then the filters should be applied automatically
  And the results should match the original filtered view
```

---

## 7. MANUAL TEST CASES

### TC-QC-001: Open Filter Field Dropdown

**Priority**: Critical
**Preconditions**:
- User is on `/discover` page
- Query Control panel is expanded

**Test Data**: None

| Step | Action | Expected Result | Actual Result | Pass/Fail |
|------|--------|-----------------|---------------|-----------|
| 1 | Locate "Add filter by field..." dropdown | Dropdown is visible | | |
| 2 | Click the dropdown | Dropdown expands | | |
| 3 | Observe dropdown contents | Shows search box at top | | |
| 4 | Check field list | Lists: Manufacturer, Model, Year, Body Class, Data Source (minimum) | | |
| 5 | Check scrollability | List is scrollable if more than ~5 fields | | |

**Expected Outcome**: Dropdown opens with searchable field list
**Pass Criteria**: All steps show expected results

---

### TC-QC-002: Search for Filter Field

**Priority**: High
**Preconditions**:
- Filter field dropdown is open

**Test Data**: Search term: "body"

| Step | Action | Expected Result | Actual Result | Pass/Fail |
|------|--------|-----------------|---------------|-----------|
| 1 | Click in search box | Search box gains focus | | |
| 2 | Type "body" | Text appears in box | | |
| 3 | Observe field list | Filters to show only "Body Class" | | |
| 4 | Type "xyz123" (no matches) | Shows empty list or "No results" | | |
| 5 | Clear search box | All fields reappear | | |

**Expected Outcome**: Field list filters in real-time based on search
**Pass Criteria**: Filtering works correctly, handles no matches gracefully

---

### TC-QC-003: Add Body Class Filter

**Priority**: Critical
**Preconditions**:
- Filter field dropdown is open
- No Body Class filter currently active

**Test Data**: Selections: "Sedan", "SUV"

| Step | Action | Expected Result | Actual Result | Pass/Fail |
|------|--------|-----------------|---------------|-----------|
| 1 | Click "Body Class" in dropdown | Dialog opens: "Select Body Classes" | | |
| 2 | Verify dialog has search box | Search box visible at top | | |
| 3 | Verify checkbox list loaded | Shows options: Convertible, Coupe, Hatchback, etc. | | |
| 4 | Click checkbox for "Sedan" | Checkbox becomes checked | | |
| 5 | Click checkbox for "SUV" | Second checkbox becomes checked | | |
| 6 | Click "Apply" button | Dialog closes | | |
| 7 | Check Active Filters section | Chip appears: "Body Class: Sedan, SUV" | | |
| 8 | Check URL | Contains "?bodyClass=Sedan,SUV" | | |
| 9 | Check results table | Refreshes, shows only Sedan and SUV vehicles | | |
| 10 | Note total count | Count is less than 4887 (all vehicles) | | |

**Expected Outcome**: Body Class filter applied, results filtered
**Pass Criteria**: All steps complete successfully, results match filter

---

### TC-QC-004: Search Options in Filter Dialog

**Priority**: Medium
**Preconditions**:
- Body Class filter dialog is open

**Test Data**: Search term: "suv"

| Step | Action | Expected Result | Actual Result | Pass/Fail |
|------|--------|-----------------|---------------|-----------|
| 1 | Click search box in dialog | Search box gains focus | | |
| 2 | Type "suv" | Text appears | | |
| 3 | Observe checkbox list | Filters to show only "SUV" | | |
| 4 | Verify case-insensitive | Typing "SUV" or "suv" both work | | |
| 5 | Check a checkbox | Checkbox can be selected while searching | | |
| 6 | Clear search | All options reappear, selection persists | | |

**Expected Outcome**: Search filters options without losing selections
**Pass Criteria**: Search works, selections persist across search changes

---

### TC-QC-005: Cancel Filter Dialog

**Priority**: High
**Preconditions**:
- Body Class filter dialog is open
- User has made selections

**Test Data**: Selections: "Sedan", "SUV" (not yet applied)

| Step | Action | Expected Result | Actual Result | Pass/Fail |
|------|--------|-----------------|---------------|-----------|
| 1 | Check "Sedan" and "SUV" | Checkboxes become checked | | |
| 2 | Click "Cancel" button | Dialog closes | | |
| 3 | Check Active Filters section | No new chip appears | | |
| 4 | Check URL | Unchanged from before dialog opened | | |
| 5 | Check results | Unchanged | | |
| 6 | Re-open dialog | Previous selections are NOT persisted (checkboxes unchecked) | | |

**Expected Outcome**: Cancel discards changes, no side effects
**Pass Criteria**: No filter applied, state unchanged

---

### TC-QC-006: Remove Filter via Chip

**Priority**: Critical
**Preconditions**:
- Active filter exists: "Body Class: Sedan, SUV"
- Results are filtered (e.g., 1200 vehicles)

**Test Data**: None

| Step | Action | Expected Result | Actual Result | Pass/Fail |
|------|--------|-----------------|---------------|-----------|
| 1 | Hover over "Body Class" chip | X button becomes visible (if hidden) | | |
| 2 | Click X button on right side of chip | Chip disappears | | |
| 3 | Check Active Filters section | Chip is removed from list | | |
| 4 | Check URL | "bodyClass" parameter removed | | |
| 5 | Check results table | Refreshes with loading indicator | | |
| 6 | Verify results count | Returns to 4887 (or filtered by other criteria) | | |
| 7 | Check results content | No longer limited to Sedan/SUV | | |

**Expected Outcome**: Filter removed, results update accordingly
**Pass Criteria**: Filter removed cleanly, data refreshes correctly

---

### TC-QC-007: Edit Existing Filter

**Priority**: High
**Preconditions**:
- Active filter exists: "Body Class: Sedan, SUV"

**Test Data**: Additional selection: "Pickup"

| Step | Action | Expected Result | Actual Result | Pass/Fail |
|------|--------|-----------------|---------------|-----------|
| 1 | Hover over "Body Class" chip | Dropdown arrow (▼) appears | | |
| 2 | Click dropdown arrow | "Select Body Classes" dialog re-opens | | |
| 3 | Verify pre-selections | "Sedan" and "SUV" are pre-checked | | |
| 4 | Check "Pickup" | Third checkbox becomes checked | | |
| 5 | Click "Apply" | Dialog closes | | |
| 6 | Check chip | Updates to "Body Class: Sedan, SUV, Pickup" | | |
| 7 | Check URL | Updates to "?bodyClass=Sedan,SUV,Pickup" | | |
| 8 | Check results | Includes Pickup trucks in addition to Sedans and SUVs | | |

**Expected Outcome**: Filter updated with additional selection
**Pass Criteria**: Existing selections preserved, new selection added

**🚨 NEEDS CONFIRMATION**: Verify dropdown arrow behavior with screenshot

---

### TC-QC-008: Add Multiple Different Filters

**Priority**: High
**Preconditions**:
- No active filters

**Test Data**:
- Filter 1: Manufacturer = "Ford, Toyota"
- Filter 2: Body Class = "Sedan, SUV"

| Step | Action | Expected Result | Actual Result | Pass/Fail |
|------|--------|-----------------|---------------|-----------|
| 1 | Add Manufacturer filter with "Ford, Toyota" | Chip appears | | |
| 2 | Add Body Class filter with "Sedan, SUV" | Second chip appears | | |
| 3 | Count active chips | Shows 2 chips | | |
| 4 | Check URL | Contains both "manufacturer" and "bodyClass" parameters | | |
| 5 | Check results | Shows only Ford/Toyota Sedans and SUVs (AND logic) | | |
| 6 | Note total count | Significantly reduced from 4887 | | |

**Expected Outcome**: Multiple filters work together with AND logic
**Pass Criteria**: Both filters active, results match intersection

---

### TC-QC-009: Handle API Error

**Priority**: Medium
**Preconditions**:
- Ability to simulate API failure (network throttling or kill backend)

**Test Data**: None

| Step | Action | Expected Result | Actual Result | Pass/Fail |
|------|--------|-----------------|---------------|-----------|
| 1 | Simulate API unavailable | Backend returns 500 or times out | | |
| 2 | Open "Body Class" filter dialog | Dialog opens | | |
| 3 | Observe dialog content | Shows error message (not blank) | | |
| 4 | Verify error message | Describes problem: "Failed to load options" | | |
| 5 | Check for retry button | "Retry" button present | | |
| 6 | Restore API availability | Backend becomes healthy | | |
| 7 | Click "Retry" button | Options load successfully | | |
| 8 | Verify checkbox list | Shows all body class options | | |

**Expected Outcome**: Error handled gracefully with retry option
**Pass Criteria**: User can recover from error without closing dialog

---

### TC-QC-010: Year Range Filter

**Priority**: High
**Preconditions**:
- Filter field dropdown is open

**Test Data**: Start Year: 1980, End Year: 2003

| Step | Action | Expected Result | Actual Result | Pass/Fail |
|------|--------|-----------------|---------------|-----------|
| 1 | Click "Year" in dropdown | "Select Year Range" dialog opens | | |
| 2 | Verify dialog components | Shows year picker grid, left/right arrows, input field | | |
| 3 | Check initial decade | Shows current decade (e.g., 2020-2029) | | |
| 4 | Click left arrow twice | Navigates to 2000-2009, then 1980-1989 | | |
| 5 | Click year "1980" | Input field shows "1980 - " | | |
| 6 | Click right arrow | Navigates to 2000-2009 | | |
| 7 | Click year "2003" | Input field shows "1980 - 2003" | | |
| 8 | Click "Apply" | Dialog closes | | |
| 9 | Check chip | Shows "Year: 1980 - 2003" | | |
| 10 | Check URL | Contains "?yearMin=1980&yearMax=2003" | | |
| 11 | Check results | Shows only vehicles from 1980-2003 (inclusive) | | |

**Expected Outcome**: Year range filter works with grid picker
**Pass Criteria**: Range selection via grid works, URL updates correctly, results filtered

**Confirmed**: Screenshots verify year picker grid implementation

---

## 8. EDGE CASES & ERROR STATES

### Edge Case 1: Empty Filter Selection

**Scenario**: User opens dialog, makes no selections, clicks Apply
**Expected Behavior**: [TBD - NEEDS CONFIRMATION]
- Option A: Show validation error "Please select at least one option"
- Option B: Close dialog, no filter added (no-op)
- Option C: Apply button disabled until selection made

### Edge Case 2: Very Long Filter Values

**Scenario**: User selects many options (e.g., 20 body classes)
**Expected Behavior**:
- Chip truncates display: "Body Class: Sedan, SUV, Pickup... +17 more"
- Full list visible when editing
- All values passed to API correctly

### Edge Case 3: URL Manipulation - Invalid Filter Values

**Scenario**: User manually edits URL to invalid value (e.g., `?bodyClass=InvalidClass`)
**Expected Behavior**:
- Invalid values ignored
- Results show unfiltered data
- OR error message shown
- Chip does not appear for invalid filter

### Edge Case 4: Network Timeout

**Scenario**: API request takes >10 seconds
**Expected Behavior**:
- Request times out
- Error message shown: "Request timed out. Please try again."
- Retry button available

### Edge Case 5: Concurrent Filter Changes

**Scenario**: User rapidly adds/removes multiple filters
**Expected Behavior**:
- Changes queued or debounced
- Final state reflected in URL and results
- No race conditions or lost updates

### Edge Case 6: Filter Conflicts

**Scenario**: User filters to criteria with 0 results (e.g., "Manufacturer: Ford" + "Model: Camry")
**Expected Behavior**:
- Results table shows empty state
- Message: "No vehicles match your filters"
- Filters remain active (user can remove to broaden search)

### Edge Case 7: Browser Back/Forward

**Scenario**: User adds filters, navigates back, navigates forward
**Expected Behavior**:
- Back removes most recent filter
- Forward re-applies filter
- URL history works correctly

---

## 9. ACCESSIBILITY (WCAG 2.1 AA)

| Requirement | Implementation | Test Method |
|-------------|----------------|-------------|
| **Keyboard Navigation** | Tab through dropdown, dialog, chips | Press Tab, verify focus order |
| **Chip Focus** | Chips focusable, X button activatable via Enter/Space | Tab to chip, press Enter/Space to remove |
| **Dialog Focus Trap** | Focus stays within dialog when open | Tab through dialog, verify no escape |
| **Escape to Close** | Escape key closes dropdown/dialog | Press Escape, verify close |
| **Screen Reader** | ARIA labels on all interactive elements | Test with NVDA/JAWS |
| **Chip Announcement** | Screen reader announces "Body Class: Sedan, SUV. Remove button" | Navigate to chip with screen reader |
| **Dialog Title** | Dialog has aria-labelledby pointing to title | Inspect dialog element |
| **Checkbox Labels** | Each checkbox has associated label | Click label text, verify checkbox toggles |
| **Color Contrast** | 4.5:1 minimum for text | Use color contrast checker |
| **Focus Indicators** | Visible focus ring on all interactive elements | Tab through UI, verify focus visible |

---

## 10. PERFORMANCE CRITERIA

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Dropdown Open** | < 100ms | Time from click to dropdown visible |
| **Field Search** | < 50ms | Time from keystroke to filtered list |
| **Dialog Open** | < 500ms | Time from field click to dialog visible |
| **Option Load** | < 2 seconds | API call to populate checkboxes |
| **Option Search** | 300ms debounce | Delay between keystroke and filter |
| **Apply Filter** | < 100ms | Dialog close to chip appear |
| **Results Refresh** | < 2 seconds | Filter change to updated results |
| **Remove Filter** | < 100ms | Chip click to disappear |

---

## 11. DEPENDENCIES

### Framework Services

- **ResourceManagementService** - State management, data fetching
- **UrlStateService** - URL parameter manipulation
- **ApiService** - HTTP requests for filter options
- **ErrorNotificationService** - Toast notifications for errors
- **PopOutContextService** - Pop-out window support (if applicable)

### Domain Configuration

- **FilterDefinition<T>** - Filter metadata (field name, type, label)
- **AutoSearchFilters** - Filter model with all filter fields
- **AutomobileUrlMapper** - Serialization/deserialization of filters to/from URL
- **AutomobileApiAdapter** - Converts filters to API query parameters

### API Endpoints

**For Body Class Options**:
```
GET /api/specs/v1/filters/body-classes?limit=1000
Response: { success: true, body_classes: ["Sedan", "SUV", ...] }
```

**For Manufacturer Options**:
```
GET /api/specs/v1/filters/manufacturers?limit=1000
Response: { success: true, manufacturers: ["Ford", "Toyota", ...] }
```

**For Model Options**:
```
GET /api/specs/v1/filters/models?limit=1000
Response: { success: true, models: ["F-150", "Camry", ...] }
```

**For Year Range**:
```
GET /api/specs/v1/filters/year-range
Response: { success: true, min: 1908, max: 2024 }
```

### PrimeNG Components

- **p-dropdown** OR custom dropdown - Field selection
- **p-dialog** - Filter modal dialogs
- **p-checkbox** - Multiselect options
- **p-chip** OR custom chip - Active filter display
- **p-button** - Cancel/Apply buttons
- **p-inputtext** - Search boxes

---

## 12. RESOLVED QUESTIONS (From Screenshots)

### ✅ Confirmed via Screenshots

1. **Year Filter Type**: Year range picker with grid selection (NOT text inputs)
   - **CONFIRMED**: Dialog shows decade grid with left/right arrow navigation
   - Users click years to select start and end of range

2. **Complete Field List**: Visible fields are:
   - **CONFIRMED**: Model, Year, Body Class, Data Source (4 visible in dropdown)
   - Note: "Manufacturer" field also exists but not shown in screenshot

3. **Edit Filter Behavior**: Click entire chip to edit (no separate dropdown arrow)
   - **CONFIRMED**: Tooltip shows "Manufacturer: Buick,Brammo (Click to edit)"
   - Entire chip is clickable, re-opens dialog with pre-selections

4. **Clear All Button**: Yes, exists in page header
   - **CONFIRMED**: Red "Clear All" button in top-right, next to "Reset Panel Order"
   - Removes all filters instantly, resets URL to `?page=1&size=20`

5. **Empty State**: Clean panel with just dropdown, no filters
   - **CONFIRMED**: Shows "Add filter by field..." dropdown only
   - "Clear All" button likely disabled when no filters active

6. **Multiple Filters**: Display horizontally in "Active Filters:" section
   - **CONFIRMED**: Shows "Manufacturer: Buick,Brammo", "Model: Scooter", "Year: 1980 - 2003"
   - Each chip has X button on right for removal

7. **Selected Count in Dialog**: Shows at bottom of multiselect dialogs
   - **CONFIRMED**: Model dialog shows "Selected (1): Scooter" in red bar at bottom

8. **Search Filtering in Dialog**: Works with live filtering
   - **CONFIRMED**: Model dialog searching "sc" filters to SCHRAMM, Scamp, Scooter

## 12. REMAINING OPEN QUESTIONS

### Implementation Details (To Be Tested)

1. **Empty Filter Validation**: What happens when Apply is clicked with 0 selections?
   - **NEEDS TESTING**: Validate behavior in multiselect dialogs

2. **Maximum Selections**: Is there a limit on number of items per filter?
   - **ASSUMPTION**: No limit (to be confirmed with stress test)

3. **Chip Truncation**: How are very long filter values (20+ items) displayed?
   - **ASSUMPTION**: Truncate with "..." after ~3-4 items

4. **Error Messages**: Exact wording of API error messages?
   - **NEEDS TESTING**: Simulate API failure to capture error UI

5. **Filter Chip Order**: Are chips displayed in order added or alphabetical?
   - **OBSERVATION**: Screenshot shows Manufacturer, Model, Year (may be order added)

6. **Year Picker Validation**: What if user selects end year before start year?
   - **ASSUMPTION**: Picker auto-corrects to ensure start <= end

7. **Search Debounce Timing**: Exact debounce delay for dialog search?
   - **SPECIFICATION**: Assuming 300ms (standard UX practice)

8. **Selection Limit Warning**: Do dialogs warn if selecting too many items?
   - **ASSUMPTION**: No warning, all selections allowed

---

## 13. ADDITIONAL SCREENSHOTS NEEDED

### High Priority

1. **Year Filter Dialog** (if different from multiselect)
   - Shows whether it's range input or multiselect
   - Validation rules (min <= max)

2. **Complete Filter Field List**
   - Scroll dropdown to see all available fields
   - Confirms total number of filterable fields

3. **Edit Filter Interaction**
   - Click dropdown arrow on existing chip
   - Shows dialog re-opening with pre-selections

4. **Multiple Active Filters**
   - 3-4 different filters active simultaneously
   - Shows chip layout and spacing

5. **Empty State (No Filters)**
   - Panel with no active filters
   - Baseline state

### Medium Priority

6. **Clear All Button** (if exists)
   - Location and styling
   - Behavior when clicked

7. **Long Filter Values**
   - Chip with many selections (10+)
   - Shows truncation behavior

8. **Error States**
   - API error in dialog
   - Network timeout
   - Retry button

9. **Loading States**
   - Dialog loading options
   - Spinner or skeleton screen

10. **Search with No Matches**
    - "No results found" message
    - In both dropdown and dialog

---

## 14. REVISION HISTORY

| Date | Version | Author | Changes |
|------|---------|--------|---------|
| 2025-11-22 | 0.1 | Claude Code | Initial draft from screenshots 1-4 |

---

**End of Query Control Component Specification (Draft)**

**Status**: Awaiting additional screenshots and clarifications before finalization.
