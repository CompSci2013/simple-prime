# Generic Prime Manual Test Plan

**Application**: Generic Prime (Automobile Discovery)
**Ports**: 4205 (Main), 4201 (Reference autos-prime-ng)
**Focus**: URL-First State Management & Control Behavior (Main + Pop-Out)
**Date**: 2025-12-01

---

## Prerequisites & Test Methodology

### Test Data Setup
- [ ] **Action**: Ensure the backend database is seeded with the standard `v1` test dataset.
- [ ] **Verification**: The application should show a total of ~4,887 records on initial load.
- [ ] **Verification**: The manufacturer filter should list 72 unique manufacturers.

### URL-First Architecture
All state changes must be reflected in the URL and vice versa. Controls must update when URL changes, regardless of whether the control is in the main Discover page or popped out.

### Control Scope
- **Query Control Panel**: Dropdown filters (Manufacturer, Model, Body Class), Range (Year), Text (Search), Pagination (Size)
- **Results Table**: Custom filter panel (reusable filters), Pagination, Row expansion
- **Manufacturer-Model Picker**: Drag-drop, Column sorting, Selection, Pagination
- **Statistics Panel**: Charts (4 total), No direct filters but reflects URL state

### Test Flow
Tests are organized by control type, then by location (Main vs Pop-Out) to minimize context switching.

---

## PHASE 1: INITIAL STATE & BASIC NAVIGATION
**Priority**: P0-Critical (Smoke Test)
**Estimated Time**: 5 minutes

### 1.1 Initial Page Load
- [X] Navigate to http://localhost:4205/discover
- [X] Verify page loads without errors
- [X] Verify all 4 panels visible (Query Control, Picker, Results Table, Statistics)
- [X] Verify all panels expanded by default
- [X] Verify URL is clean: `http://localhost:4205/discover` (no query params)
- [X] Verify Results Table shows all records (~4,887 total)
- [X] Verify Statistics Panel shows all data aggregations (Manufacturers: 72, etc.)

### 1.2 Panel Collapse/Expand (Main Page)
- [X] Click collapse button on Query Control panel header
- [X] Verify panel collapses and content hidden
- [X] Verify collapse button changes to expand icon
- [X] Click to expand - verify content reappears
- [X] Repeat collapse/expand for each panel:
  - [X] Manufacturer-Model Picker
  - [X] Results Table
  - [X] Statistics Panel
- [X] Verify collapsed state does NOT affect URL

### 1.3 Panel Drag-Drop Reordering (Main Page)
- [X] Drag Query Control panel to bottom position
- [X] Verify panel reorders visually
- [X] Verify all controls still functional in new position
- [X] Drag Picker panel to top
- [X] Drag Results Table above Statistics
- [X] Verify drag-drop does NOT affect URL state
- [X] Refresh page - verify panels return to original order
  - They do, but this is a bug. Panels should remain in the order selected by user

---

## PHASE 2: QUERY CONTROL PANEL FILTERS (MAIN PAGE)
**Priority**: P0-Critical (Smoke Test)
**Estimated Time**: 15 minutes

### 2.1 Manufacturer Filter (Multiselect Dialog Workflow)

#### Single Selection Workflow
- [X] Click field selector dropdown in Query Control header
- [X] Select "Manufacturer" from dropdown
- [X] Verify multiselect dialog opens with title "Select Manufacturer"
- [X] Verify list shows available manufacturers (~72 options)
- [X] Click checkbox next to "Brammo" to select it
- [X] Verify checkbox becomes checked
- [X] Click "Apply" button in dialog
- [X] Verify dialog closes and chip appears: "Manufacturer: Brammo"
- [X] Verify URL updates: `?manufacturer=Brammo`
- [X] Verify Results Table updates to show only Brammo results
- [X] Verify Statistics Panel updates (charts reflect Brammo data only)

#### Dialog Cancel Behavior (Side Effect)
- [X] Test 2.1.12: Range Dialog Reopen - PASS
  - With "Manufacturer: Brammo" chip visible, opened Year dialog via dropdown
  - Verified Year Range dialog opened (not Manufacturer dialog)
  - Clicked Cancel - dialog closed correctly
  - Verified Manufacturer filter remained active
  - **Note**: Minor focus issue - after spacebar opens dialog, focus returned to search field instead of Start Year input
- [X] Test 2.1.13: Multiple Filters Active - PASS
  - Applied Year filter (yearMin=2020) with Manufacturer already active
  - Opened Model dialog - verified correct dialog opened (not Year or Manufacturer)
  - Confirmed multiple filters can coexist and correct dialogs open when switching

#### Multiple Selection Tests
- [X] Test 2.1.14-2.1.18: Multiple Selection - PASS
  - Selected 3 models: 1000, 166U, 214
  - Verified all 3 checkboxes checked
  - Applied filter - dialog closed
  - Verified URL: `?manufacturer=Brammo&yearMin=2020&model=1000,166U,214`
  - Verified Results Table updated immediately with filtered results (BUG #16 now fixed)
  - Verified Statistics Panel updated with filtered data

#### Search/Filter in Dialog
- [X] Test 2.1.19-2.1.22: Search/Filter in Dialog - PASS
  - Opened Manufacturer dialog
  - Typed "bra" in search box
  - Verified list filtered to show only matching manufacturers (Brammo visible)
  - Verified non-matching manufacturers hidden (Ford not visible)
  - Cleared search box
  - Verified all manufacturers reappeared
  - Dialog remained open for next tests

#### Keyboard Navigation in Dialog
- [X] Test 2.1.23-2.1.26: Keyboard Navigation - PASS
  - Opened Manufacturer dialog
  - Pressed Tab to focus first checkbox
  - Pressed Space to toggle checkbox - became checked
  - Pressed Shift+Tab to navigate to Apply button (Tab alone required many presses)
  - Pressed Enter to apply filter
  - Verified filter applied and URL updated
  - **Note**: Tab order inefficiency - Tab requires ~50 presses to reach Apply; Shift+Tab reaches it immediately

#### Clear/Edit Manufacturer Filter
- [X] Test 2.1.27-2.1.29: Clear/Edit Filter - PASS
  - Clicked on manufacturer chip to edit
  - Verified dialog reopened with previous selection pre-checked
  - Unchecked previous manufacturer and selected different one
  - Clicked "Apply"
  - Verified URL updated with new manufacturer
  - Verified Results Table updated with new filter

#### Remove Manufacturer Filter
- [X] Test 2.1.30-2.1.32: Remove Filter - PASS
  - Clicked X button on manufacturer chip
  - Verified chip removed from Active Filters
  - Verified URL no longer contains manufacturer parameter
  - Verified Results Table updated to show all manufacturers
  - Verified Statistics Panel updated to show all data

### 2.2 Model Filter (Multiselect Dialog Workflow)

#### Single Selection Workflow
- [ ] Click field selector dropdown
- [ ] Select "Model"
- [ ] Verify Model multiselect dialog opens
- [ ] Select single model (e.g., "Scooter")
- [ ] Click "Apply"
- [ ] Verify URL updates: `?model=Scooter`
- [ ] Verify Results Table filters to that model
- [ ] Verify Statistics Panel reflects model-filtered data

#### Combined Filters Test
- [ ] First, set Manufacturer to "Brammo" (using steps from 2.1)
- [ ] Then, click field selector dropdown and select "Model"
- [ ] In dialog, select "Scooter"
- [ ] Click "Apply"
- [ ] Verify URL shows both: `?manufacturer=Brammo&model=Scooter`
- [ ] Verify Results Table shows only Brammo Scooters
- [ ] Verify result count reflects intersection (not sum)

#### Edit Model Filter
- [ ] With both filters applied, click "Model: Scooter" chip
- [ ] Verify dialog reopens with "Scooter" checked
- [ ] Uncheck Scooter, select different model
- [ ] Click "Apply"
- [ ] Verify URL updates with new model
- [ ] Verify Manufacturer filter still active: `?manufacturer=Brammo&model=<NewModel>`

#### Remove Model Filter
- [ ] With both filters applied, click X on "Model: Scooter" chip
- [ ] Verify chip removed
- [ ] Verify URL keeps manufacturer: `?manufacturer=Brammo`
- [ ] Verify Results Table shows all Brammo models again

### 2.3 Body Class Filter (Multiselect Dialog Workflow)

#### Single Selection Workflow
- [ ] Click field selector dropdown
- [ ] Select "Body Class"
- [ ] Verify Body Class multiselect dialog opens
- [ ] Select single body class (e.g., "SUV")
- [ ] Click "Apply"
- [ ] Verify URL updates: `?bodyClass=SUV`
- [ ] Verify Results Table shows only SUVs
- [ ] Verify Statistics Panel reflects SUV data

#### Multiple Body Classes
- [ ] Click field selector dropdown, select "Body Class"
- [ ] In dialog, select multiple: SUV, Sedan, Truck
- [ ] Click "Apply"
- [ ] Verify URL shows: `?bodyClass=SUV,Sedan,Truck`
- [ ] Verify Results Table shows only those 3 body classes

#### Combined with Previous Filters
- [ ] Set: Manufacturer=Brammo (via 2.1)
- [ ] Set: Model=Scooter (via 2.2)
- [ ] Set: Body Class=SUV (via above)
- [ ] Verify URL shows all three: `?manufacturer=Brammo&model=Scooter&bodyClass=SUV`
- [ ] Verify Results Table shows Brammo Scooters that are SUVs
- [ ] Verify all Statistics reflect combined filters

#### Remove Body Class Filter
- [ ] Click X on "Body Class: SUV" chip
- [ ] Verify URL keeps other filters: `?manufacturer=Brammo&model=Scooter`
- [ ] Verify Results Table shows all body classes for filtered manufacturer/model

### 2.4 Year Range Filter (Range Dialog Workflow)

#### Minimum Year Tests
- [ ] Click field selector dropdown
- [ ] Select "Year"
- [ ] Verify Year Range dialog opens with "Start Year" and "End Year" inputs
- [ ] Enter minimum year (e.g., 2020) in "Start Year" field
- [ ] Leave "End Year" blank
- [ ] Click "Apply"
- [ ] Verify URL updates: `?yearMin=2020`
- [ ] Verify Results Table shows only cars from 2020+
- [ ] Verify Statistics reflect 2020+ data only

#### Maximum Year Tests
- [ ] With yearMin=2020 active, click "Year: 2020" chip
- [ ] Verify Year Range dialog reopens with "Start Year"=2020 pre-filled
- [ ] Enter maximum year (e.g., 2024) in "End Year" field
- [ ] Click "Apply"
- [ ] Verify URL updates to: `?yearMin=2020&yearMax=2024`
- [ ] Verify Results Table shows cars 2020-2024
- [ ] Verify Statistics reflect this range

#### Year Range Only (Min and Max)
- [ ] Click field selector dropdown
- [ ] Select "Year"
- [ ] Enter only "End Year"=2024, leave "Start Year" blank
- [ ] Click "Apply"
- [ ] Verify URL updates: `?yearMax=2024`
- [ ] Verify Results Table shows all cars up to 2024

#### Remove Year Range Filter
- [ ] With year filters active, click X on "Year: 2020-2024" chip
- [ ] Verify chip removed
- [ ] Verify URL removes yearMin and yearMax params
- [ ] Verify Results Table shows all years again
- [ ] Verify Statistics show all-time data

#### Invalid Range Tests
- [ ] Click field selector, select "Year"
- [ ] Enter yearMin=2024, yearMax=2020 (invalid - min > max)
- [ ] Click "Apply"
- [ ] Verify application either: rejects the input, swaps values, or shows error
- [ ] Verify URL reflects final state

### 2.5 Search/Text Filter

#### Basic Search Workflow
- [ ] In Query Control, locate "Search" text input field
- [ ] Enter search term (e.g., "Hybrid")
- [ ] Verify URL updates: `?search=Hybrid`
- [ ] Verify Results Table filters to matching rows (live/immediate)
- [ ] Verify result count updates
- [ ] Verify Statistics reflect search results

#### Search Combined with Other Filters
- [ ] Set Manufacturer=Brammo (using steps from 2.1)
- [ ] Then enter search term "Hybrid" in Search field
- [ ] Verify URL shows: `?manufacturer=Brammo&search=Hybrid`
- [ ] Verify Results Table shows only Brammo vehicles matching "Hybrid" search
- [ ] Verify Statistics reflect intersection (Brammo + Hybrid)

#### Clear Search
- [ ] With search active, click X button to clear search field
- [ ] Verify URL removes search param
- [ ] Verify Results Table returns to previous filter state (Brammo only)

### 2.6 Page Size Filter (Table Control)

#### Change Page Size
- [ ] In Results Table panel, locate "Size" selector (rows per page dropdown)
- [ ] Select size=10
- [ ] Verify URL updates: `?size=10`
- [ ] Verify Results Table shows 10 rows per page
- [ ] Verify pagination controls show proper page count (e.g., "1 of 489" for 4,887 records)

#### Page Size Options
- [ ] Test all available sizes: [10, 20, 50, 100] (or configured values)
- [ ] For each size, verify URL updates correctly with `?size=<N>`
- [ ] Verify table adjusts row count appropriately

#### Size with Query Filters
- [ ] Set Manufacturer=Brammo (using 2.1 steps)
- [ ] Then set page size to 20
- [ ] Verify URL shows both: `?manufacturer=Brammo&size=20`
- [ ] Verify table shows 20 filtered rows per page (Brammo only)

### 2.7 "Clear All" Button (Combined Dialog Workflow)

#### Clear All Filters
- [ ] Apply multiple filters using dialog workflow:
  - [ ] Manufacturer=Brammo (via 2.1)
  - [ ] Model=Scooter (via 2.2)
  - [ ] Year=2020-2024 (via 2.4)
  - [ ] Search="Hybrid" (via 2.5)
  - [ ] Size=20 (via 2.6)
- [ ] Verify chips displayed: "Manufacturer: Brammo", "Model: Scooter", "Year: 2020-2024"
- [ ] Verify Search field shows "Hybrid"
- [ ] Verify URL shows all params: `?manufacturer=Brammo&model=Scooter&yearMin=2020&yearMax=2024&search=Hybrid&size=20`
- [ ] Click "Clear All Filters" button
- [ ] Verify "Cancel" button exercised on any open dialog (no error)
- [ ] Verify ALL URL parameters removed (clean URL: `/discover`)
- [ ] Verify all filter chips removed
- [ ] Verify Search field cleared
- [ ] Verify page size reset to default
- [ ] Verify Results Table shows unfiltered data (~4,887 records)
- [ ] Verify Statistics show all-time data

---

## PHASE 3: RESULTS TABLE PANEL (MAIN PAGE)
**Priority**: P1-High
**Estimated Time**: 10 minutes

### 3.1 Results Table Filter Panel (Custom Filters)

#### Filter Panel Toggle
- [ ] Click "Filters" header in Results Table
- [ ] Verify filter section collapses
- [ ] Click again to expand
- [ ] Verify filter form reappears

#### Table Filters (Same as Query Control)
- [ ] Apply filter via table's filter panel
- [ ] Verify URL updates
- [ ] Verify results update
- [ ] Compare with Query Control filters (should have same effect)

### 3.2 Table Pagination

#### Forward Navigation
- [ ] Navigate to page 1 (default)
- [ ] Click "Next Page" or page 2 button
- [ ] Verify URL updates with `&first=10` or appropriate offset param
- [ ] Verify table rows change to next page
- [ ] Verify page indicator shows correct page
- [ ] Repeat for several pages

#### Backward Navigation
- [ ] On page 3, click "Previous" or page 2 button
- [ ] Verify URL updates with new offset
- [ ] Verify table shows previous page rows

#### Jump to Page
- [ ] If page selector available, click specific page number
- [ ] Verify URL updates
- [ ] Verify table jumps to that page
- [ ] Verify row numbers match expected page

#### Last Page Behavior
- [ ] Click last page button (if available)
- [ ] Calculate expected page based on ~4,887 total records
- [ ] Verify last page shows remaining rows (< full page size)

### 3.3 Row Expansion

#### Single Row Expansion
- [ ] Click expand arrow on first row
- [ ] Verify row expands to show details
- [ ] Verify detail display shows all fields for that record
- [ ] Verify expansion does NOT affect URL

#### Multiple Row Expansion
- [ ] Expand 3 different rows
- [ ] Verify all 3 remain expanded
- [ ] Verify pagination still works with expanded rows
- [ ] Scroll to see expanded rows work across page boundary

#### Close Expansion
- [ ] Click expand arrow again on expanded row
- [ ] Verify row collapses
- [ ] Verify other expanded rows remain expanded

### 3.4 Table Column Sorting (if available)

#### Sort by Column
- [ ] Click sortable column header
- [ ] Verify sort direction indicator appears (↑ or ↓)
- [ ] Verify URL updates with sort parameter (if supported)
- [ ] Verify table rows reorder

#### Reverse Sort
- [ ] Click same column header again
- [ ] Verify sort reverses (↓ to ↑)
- [ ] Verify URL updates
- [ ] Verify table shows reverse order

### 3.5 Table Pagination with Filters

#### Paginate Filtered Results
- [ ] Apply manufacturer filter (e.g., Brammo: 500 results)
- [ ] Verify page count updates based on filtered total
- [ ] Navigate to page 2
- [ ] Verify URL shows: `?manufacturer=Brammo&first=10` (or similar)
- [ ] Verify page 2 shows filtered results, not all manufacturers

---

## PHASE 4: MANUFACTURER-MODEL PICKER (MAIN PAGE)
**Priority**: P1-High
**Estimated Time**: 10 minutes

### 4.1 Picker Basic Interaction

#### Panel Display
- [ ] Verify Picker panel shows table of manufacturers
- [ ] Verify columns are visible (header labels)
- [ ] Verify all ~72 manufacturers listed

#### Single Selection
- [ ] Click on a manufacturer row (e.g., "Brammo")
- [ ] Verify row highlights (background color change)
- [ ] Verify URL updates: `?pickedManufacturer=Brammo` (or equivalent)
- [ ] Verify Results Table updates to show only Brammo

#### Deselection
- [ ] Click same manufacturer row again
- [ ] Verify row deselects (highlight removed)
- [ ] Verify URL clears picker parameter
- [ ] Verify Results Table shows all manufacturers again

### 4.2 Picker Column Sorting

#### Sort by Column (if applicable)
- [ ] Click on sortable column header (Manufacturer name)
- [ ] Verify rows reorder alphabetically
- [ ] Click again to reverse sort
- [ ] Verify URL updates if sort is reflected there

### 4.3 Picker Pagination

#### Paginate Through Manufacturers
- [ ] If picker has pagination (72 manufacturers, small page size):
  - [ ] Click next page
  - [ ] Verify new manufacturers appear
  - [ ] Verify URL updates (if pagination in URL)
  - [ ] Navigate back
  - [ ] Verify previous manufacturers reappear

### 4.4 Picker with Results Table Filters

#### Complex Filter Scenario
- [ ] In Query Control, set Year: 2020-2024
- [ ] In Picker, select Manufacturer: Brammo
- [ ] Verify URL shows: `?yearMin=2020&yearMax=2024&pickedManufacturer=Brammo`
- [ ] Verify Results Table shows Brammo cars from 2020-2024
- [ ] Verify Statistics reflect this intersection

---

## PHASE 5: STATISTICS PANEL (MAIN PAGE)
**Priority**: P2-Medium
**Estimated Time**: 5 minutes

### 5.1 Statistics Display

#### Initial Load
- [ ] Verify all 4 charts visible (or collapsed by default)
- [ ] Verify charts have proper titles
- [ ] Verify axes have labels
- [ ] Verify data displays without errors

#### Chart Types
- [ ] Chart 1 (Manufacturer): Bar chart showing manufacturer counts
- [ ] Chart 2 (Body Class): Bar chart showing body class distribution
- [ ] Chart 3 (Year): Bar chart showing vehicles by year
- [ ] Chart 4 (Top Models): Bar chart showing top models

### 5.2 Statistics Responsiveness to Filters

#### Filter → Stats Update
- [ ] Set Manufacturer=Brammo (Query Control)
- [ ] Verify Chart 1 (Manufacturer) shows only Brammo
- [ ] Verify Chart 4 (Top Models) shows only Brammo models
- [ ] Verify all charts reflect Brammo-only data

#### Multiple Filters
- [ ] Set Manufacturer=Brammo, Year=2020-2024
- [ ] Verify all charts show Brammo data from 2020-2024 only
- [ ] Verify totals in charts match filtered result count

#### Clear Filters
- [ ] Clear all filters
- [ ] Verify charts return to showing all data
- [ ] Verify chart totals match full dataset

### 5.3 Statistics Panel Collapse

#### Collapse/Expand
- [ ] Click collapse button on Statistics panel header
- [ ] Verify charts disappear
- [ ] Click expand
- [ ] Verify charts reappear with same data

---

## PHASE 6: POP-OUT TESTING (ALL CONTROLS)
**Priority**: P0-Critical (Smoke Test)
**Estimated Time**: 20 minutes

### 6.1 Pop-Out Button Visibility & Behavior

#### Pop-Out Button Appears
- [ ] Verify each panel header has pop-out button (↗ icon)
- [ ] Hover over button - verify tooltip appears
- [ ] Click pop-out button on Query Control panel

#### New Window Opens
- [ ] Verify new browser window/tab opens
- [ ] Verify Query Control component renders in new window
- [ ] Verify window shows only Query Control (not full page)
- [ ] Verify main window still shows all panels
- [ ] Note popped-out panel ID for reference: ____________

### 6.2 URL Synchronization (Pop-Out)

#### URL State Sync
- [ ] In main window, add manufacturer filter: Brammo
- [ ] Verify main window URL updates: `?manufacturer=Brammo`
- [ ] Switch to pop-out window
- [ ] Verify pop-out Query Control shows Brammo selected
- [ ] Verify pop-out window reflects main URL state

#### Pop-Out Filter Change
- [ ] In pop-out window, change to Brammo
- [ ] Verify pop-out shows Brammo selected
- [ ] Switch back to main window
- [ ] Verify main Results Table shows Brammo results
- [ ] Verify main URL shows: `?manufacturer=Brammo`
- [ ] Verify Statistics show Brammo data

#### Complex Sync Test
- [ ] In main window: Set Manufacturer=Brammo, Year=2020-2024
- [ ] In main Results Table: Change page size to 50
- [ ] Verify main URL: `?manufacturer=Brammo&yearMin=2020&yearMax=2024&size=50`
- [ ] Switch to pop-out Query Control window
- [ ] Verify all three filters visible/selected in pop-out
- [ ] Modify Year to 2022-2023 in pop-out
- [ ] Switch to main window
- [ ] Verify main URL updated: `?manufacturer=Brammo&yearMin=2022&yearMax=2023&size=50`
- [ ] Verify Results Table reflects new year range
- [ ] Verify page still shows 50 rows per page

### 6.3 Pop-Out Query Control Tests

#### All Filter Controls in Pop-Out
- [ ] Open Query Control in pop-out
- [ ] Test manufacturer dropdown: Select/deselect
  - [ ] Verify URL updates
  - [ ] Switch to main - verify Results Table updates
- [ ] Test model dropdown: Select multiple
  - [ ] Verify URL shows all selected
  - [ ] Switch to main - verify filtering works
- [ ] Test body class: Select option
  - [ ] Verify main Results Table updates
- [ ] Test year range: Set min and max
  - [ ] Verify main filters correctly
- [ ] Test search box: Enter search term
  - [ ] Verify main Results Table filters
- [ ] Test page size: Change to 20
  - [ ] Switch to main - verify pagination reflects size
- [ ] Test Clear All button in pop-out
  - [ ] Verify URL clears
  - [ ] Switch to main - verify unfiltered results

### 6.4 Pop-Out Results Table Tests

#### Open Results Table in Pop-Out
- [ ] Click pop-out button on Results Table
- [ ] Verify new window opens with Results Table
- [ ] Verify main window still shows full layout

#### Pagination in Pop-Out
- [ ] In main window, set manufacturer filter and page size
- [ ] Verify main URL has these params
- [ ] Switch to pop-out Results Table
- [ ] Verify pop-out shows filtered results with correct size
- [ ] Click next page in pop-out
- [ ] Verify pop-out URL updates with new page offset
- [ ] Switch to main window
- [ ] Verify main Results Table ALSO on new page (URL synced)

#### Row Expansion in Pop-Out
- [ ] In pop-out Results Table, expand a row
- [ ] Verify details appear
- [ ] Verify expansion does NOT affect URL
- [ ] Collapse row
- [ ] Switch to main window
- [ ] Verify row is NOT expanded (pop-out expansion doesn't sync)

### 6.5 Pop-Out Picker Tests

#### Open Picker in Pop-Out
- [ ] Click pop-out button on Manufacturer-Model Picker
- [ ] Verify new window opens with Picker table
- [ ] Verify main window still shows full layout

#### Selection in Pop-Out
- [ ] In pop-out Picker, select a manufacturer
- [ ] Verify pop-out URL updates: `?pickedManufacturer=Brammo`
- [ ] Switch to main window
- [ ] Verify main Results Table shows selected manufacturer
- [ ] Verify main URL updated

#### Pagination in Pop-Out
- [ ] If picker has pagination, navigate pages in pop-out
- [ ] Verify pop-out URL updates
- [ ] Switch to main - verify URL synced

### 6.6 Pop-Out Statistics Tests

#### Open Statistics in Pop-Out
- [ ] Click pop-out button on Statistics Panel
- [ ] Verify new window opens with charts only
- [ ] Verify charts render properly

#### Stats Reflect Main Filters
- [ ] In main window, set filter (e.g., Manufacturer=Brammo)
- [ ] Verify main Statistics show Brammo data
- [ ] Switch to pop-out Statistics
- [ ] Verify pop-out charts ALSO show Brammo data
- [ ] Verify charts match main window (same data)

#### Filter Change Updates Pop-Out Stats
- [ ] In pop-out, wait and monitor
- [ ] In main window (different browser window), change filter
- [ ] Verify pop-out Statistics update automatically
- [ ] Verify data now matches new filter (not Brammo)

### 6.7 Multiple Pop-Outs Simultaneously

#### Open Multiple Pop-Outs
- [ ] Pop out Query Control (keep open)
- [ ] Pop out Results Table (keep open)
- [ ] Pop out Picker (keep open)
- [ ] Pop out Statistics (keep open)
- [ ] Verify all 4 windows open with correct components

#### Multi-Window Filter Sync
- [ ] In pop-out Query Control: Set Manufacturer=Brammo
- [ ] Verify pop-out Query Control shows Brammo
- [ ] Verify pop-out Results Table shows Brammo results
- [ ] Switch to main window - verify filters applied
- [ ] In pop-out Picker: Select Brammo
- [ ] Verify pop-out Query Control NOW shows Brammo (overrides Brammo)
- [ ] Verify pop-out Results Table shows Brammo
- [ ] Verify pop-out Statistics show Brammo
- [ ] Verify main window updated to Brammo

#### Page Navigation Across Windows
- [ ] In pop-out Results Table: Go to page 3
- [ ] Verify pop-out Results Table shows page 3
- [ ] In pop-out Query Control window: Change page size to 20
- [ ] Verify pop-out Results Table RECALCULATES pages (goes back to first/nearest)
- [ ] Verify all windows show consistent state

### 6.8 Close Pop-Out Window

#### Close Single Pop-Out
- [ ] Click X or close button on Query Control pop-out
- [ ] Verify window closes
- [ ] Switch to main window
- [ ] Verify main window still shows all panels
- [ ] Verify Query Control visible again on main page

#### Close All Pop-Outs
- [ ] Close remaining pop-outs one by one
- [ ] Verify main window state unchanged
- [ ] Verify main Results Table still shows last filter state

---

## PHASE 7: EDGE CASES & ADVANCED SCENARIOS
**Priority**: P2-Medium
**Estimated Time**: 20 minutes

### 7.1 URL Direct Navigation

#### Manually Type URL with Params
- [ ] Type URL directly: `http://localhost:4205/discover?manufacturer=Brammo&yearMin=2020&yearMax=2024`
- [ ] Press Enter
- [ ] Verify page loads with Brammo, 2020-2024 year range pre-selected
- [ ] Verify Results Table shows filtered results
- [ ] Verify Statistics show filtered data
- [ ] Verify Query Control shows all filters applied

#### Invalid Parameters
- [ ] Type URL: `http://localhost:4205/discover?manufacturer=InvalidMake&size=999`
- [ ] Verify page loads gracefully (no errors)
- [ ] Verify invalid values ignored or handled
- [ ] Verify valid values (size=999 might cap to max) applied if possible

#### Query String Encoding
- [ ] Type URL with special characters: `?search=4x4%20Truck`
- [ ] Verify properly decoded
- [ ] Verify search finds matching results

### 7.2 Rapid Filter Changes

#### Quick Filter Switching
- [ ] Rapidly change manufacturer 3 times (Brammo → Brammo → Ford)
- [ ] Verify Results Table updates to final selection (Ford)
- [ ] Verify URL shows Ford
- [ ] Verify no orphaned/stale data displays

#### Concurrent Pop-Out Changes
- [ ] In pop-out Query Control: Change manufacturer
- [ ] While that's loading, click Results Table next page in main
- [ ] Verify final state consistent between windows
- [ ] Verify Results Table pagination matches URL

### 7.3 Pagination Edge Cases

#### Single Page Results
- [ ] Apply filter that returns < 10 results
- [ ] Verify pagination controls hidden or disabled
- [ ] Verify all results display on single page

#### Large Page Size with Small Results
- [ ] Apply filter returning 25 results
- [ ] Set page size to 100
- [ ] Verify all 25 display on page 1
- [ ] Verify pagination controls show 1 page

#### Page Doesn't Exist
- [ ] Manually type URL: `?manufacturer=Brammo&first=10000`
- [ ] Verify page either shows last valid page or empty results gracefully
- [ ] Verify no JavaScript errors

### 7.4 Persistence Across Navigation

#### Filter Persistence on Panel Toggle
- [ ] Set manufacturer=Brammo, expand and collapse Query Control
- [ ] Verify Brammo still selected
- [ ] Verify URL unchanged

#### Filter Persistence on Panel Drag
- [ ] Set manufacturer=Brammo
- [ ] Drag Query Control panel to different position
- [ ] Verify Brammo still selected
- [ ] Verify URL unchanged

#### Filter Persistence on Page Refresh
- [ ] Set: manufacturer=Brammo, year=2020-2024, size=20
- [ ] Verify URL: `?manufacturer=Brammo&yearMin=2020&yearMax=2024&size=20`
- [ ] Press F5 (refresh page)
- [ ] Verify page reloads with all filters still applied
- [ ] Verify Results Table shows Brammo 2020-2024
- [ ] Verify page size is 20

### 7.5 Browser Back/Forward

#### Filter History Navigation
- [ ] Start at clean URL (no filters)
- [ ] Apply manufacturer=Brammo
- [ ] Apply year=2020
- [ ] Click browser back button
- [ ] Verify URL reverts to: `?manufacturer=Brammo`
- [ ] Verify Results Table shows Brammo all years
- [ ] Click back again
- [ ] Verify URL becomes clean (no params)
- [ ] Verify Results Table unfiltered
- [ ] Click forward button
- [ ] Verify URL: `?manufacturer=Brammo`
- [ ] Click forward again
- [ ] Verify URL: `?manufacturer=Pontaic&yearMin=2020&yearMax=2024`

### 7.6 Component Interaction Sequences

#### Complex Workflow 1: Discover → Filter → Pop-Out → Modify → Sync Check
- [ ] Navigate to clean page
- [ ] Use Query Control to set: Manufacturer=Brammo, Year=2020-2024
- [ ] Verify Results Table shows 200 Brammo cars (estimate)
- [ ] Verify result count accurate
- [ ] Pop out Results Table to new window
- [ ] In pop-out, navigate to page 2
- [ ] Verify pop-out shows page 2 of Brammo results
- [ ] In main window, switch page size from default to 50
- [ ] Switch to pop-out Results Table
- [ ] Verify pop-out now shows 50 rows per page (page 1)
- [ ] Go back to main window
- [ ] Verify main shows 50 rows per page
- [ ] Verify both windows showing same URLs

#### Complex Workflow 2: Chained Filters via Multiple Controls
- [ ] Use Query Control: Set Model=Scooter
- [ ] Use Picker: Select Manufacturer=Brammo
- [ ] Verify URL: `?model=Scooter&pickedManufacturer=Brammo`
- [ ] Verify Results Table shows: Brammo Scooters only
- [ ] In Results Table filter panel: Add Year=2020-2024
- [ ] Verify URL: `?model=Scooter&pickedManufacturer=Brammo&yearMin=2020&yearMax=2024`
- [ ] Verify Results Table shows: Brammo Scooters 2020-2024
- [ ] Verify Statistics show same data (Brammo Scooters 2020-2024)
- [ ] Clear Model filter in Query Control
- [ ] Verify URL removes model param
- [ ] Verify Results Table now shows all Brammo models (2020-2024)
- [ ] Verify Statistics updated

---

## PHASE 8: ACCESSIBILITY (A11Y) TESTING
**Priority**: P1-High
**Estimated Time**: 15 minutes

### 8.1 Keyboard Navigation
- [ ] **Tab Order**: Start from the browser URL bar, press `Tab` repeatedly. Verify focus moves logically through all interactive elements (panel headers, buttons, filters, table rows, etc.) without getting stuck.
- [ ] **Filter Interaction**:
  - [ ] Navigate to a dropdown filter (e.g., Manufacturer) using `Tab`.
  - [ ] Press `Enter` or `Space` to open it.
  - [ ] Use arrow keys to navigate options.
  - [ ] Press `Enter` to select an option. Verify the filter applies.
  - [ ] Press `Escape` to close the dropdown without selection.
- [ ] **Button Interaction**:
  - [ ] Navigate to a button (e.g., "Clear All Filters", panel collapse, pop-out) using `Tab`.
  - [ ] Press `Enter` or `Space` to activate it. Verify the action occurs.
- [ ] **Table Pagination**:
  - [ ] Navigate to the pagination controls.
  - [ ] Use `Tab` to move between "Next", "Previous", and page numbers.
  - [ ] Press `Enter` to navigate to a different page.

### 8.2 Focus Management
- [ ] **Pop-Out Focus**:
  - [ ] Navigate to a pop-out button (e.g., on Query Control) and press `Enter`.
  - [ ] Verify focus is immediately moved to the new pop-out window, ideally on the first interactive element.
  - [ ] Press `Tab` within the pop-out. Verify focus is "trapped" and cycles only within the pop-out window's elements.
- [ ] **Focus Return**:
  - [ ] Close the pop-out window.
  - [ ] Verify focus returns to the main window, specifically to the pop-out button that opened the window.
- [ ] **Modal Dialogs**: If any filters open modal dialogs, repeat the focus trap and focus return tests for them.

---

## PHASE 9: FINAL VERIFICATION
**Priority**: P0-Critical (Smoke Test)
**Estimated Time**: 5 minutes

### 9.1 Consistency Check
- [ ] Main window and all pop-outs show consistent data for same filters
- [ ] URL always matches displayed filter state
- [ ] Filter state always matches URL
- [ ] No data mismatches between components

### 9.2 Visual Spot Check
- [ ] **Layout**: Verify panels and controls are aligned correctly and there are no obvious visual glitches or overlapping elements.
- [ ] **State Changes**: Apply a filter and verify that loading indicators appear and disappear correctly without getting stuck.
- [ ] **Font/Icons**: Verify that all text is readable and icons are rendered correctly.

### 9.3 Performance Check
- [ ] Filter changes should feel responsive and not lock up the UI.
- [ ] Page navigation should be quick and fluid.
- [ ] Pop-out windows should open without a significant delay.
- [ ] Check for and note any high CPU usage during basic operations.
- [ ] No console errors (F12 Developer Tools).

### 9.4 Reference Application Check
- [ ] Compare behavior with autos-prime-ng (port 4201) where applicable.
- [ ] Verify generic-prime behaves identically or better.
- [ ] Document any intentional differences.

### 9.5 Known Issues
- [ ] Bug #16: Results Table sync failure - **BLOCKING** (critical issue)
  - [ ] URL updates correctly when filter modified
  - [ ] Results Table doesn't update immediately (stale data shown)
  - [ ] Page refresh (F5) restores correct data
  - [ ] Fix required for URL-First architecture compliance
- [ ] Bug #15: Multiselect dialog reopen failure - **BLOCKING** (critical issue)
  - [ ] Dialog fails to open on second selection of same filter field
  - [ ] Workaround: Click on existing chip to edit filter (works for Multiple Selection tests)
  - [ ] Fix required before proceeding with Dialog Cancel Behavior tests
- [ ] Bug #13: Dropdown keyboard navigation - **Expected to fail** (known issue)
  - [ ] Verify dropdowns work with mouse.
  - [ ] Document if keyboard nav broken (as expected).
- [ ] Bug #7: Checkbox visual state - **Expected to fail** (known issue)
  - [ ] Verify checkboxes function with mouse.
  - [ ] Document if visual state persists after clear (as expected).

---

## TEST RESULTS SUMMARY

**Total Test Cases**: ~280+
**Start Time**: _____________
**End Time**: _____________
**Duration**: _____________

### Results by Phase
- [ ] Phase 1 (Initial State): _____ / _____ passed
- [ ] Phase 2 (Query Control): _____ / _____ passed
- [ ] Phase 3 (Results Table): _____ / _____ passed
- [ ] Phase 4 (Picker): _____ / _____ passed
- [ ] Phase 5 (Statistics): _____ / _____ passed
- [ ] Phase 6 (Pop-Out): _____ / _____ passed
- [ ] Phase 7 (Edge Cases): _____ / _____ passed
- [ ] Phase 8 (Accessibility): _____ / _____ passed
- [ ] Phase 9 (Verification): _____ / _____ passed

### Critical Issues Found
1. Bug #16 - Results Table doesn't update when filter modified (URL updates but components don't sync - requires page refresh) - BLOCKS Multiple Selection tests
2. Bug #15 - Multiselect dialog fails to reopen when filter already active (two-way binding issue with PrimeNG Dialog - BLOCKS Dialog Cancel Behavior tests)
3. Bug #14 - Field selector dropdown auto-opens dialog on arrow key navigation (not a bug, current design - use mouse click workaround)

### Minor Issues Found
1. None found during Phase 2.1 testing (Dialog Cancel Behavior blocked by Bug #15, Multiple Selection blocked by Bug #16)

### Notes
- **Phase 2.1 COMPLETE**: All 24 tests PASSED (2.1.1-2.1.32)
  - Single Selection Workflow (2.1.1-2.1.8): 8/8 PASSED ✓
  - Dialog Cancel Behavior (2.1.9-2.1.13): 5/5 PASSED ✓ (Previously [BLOCKED], now fixed)
  - Multiple Selection Tests (2.1.14-2.1.18): 5/5 PASSED ✓ (Previously [BLOCKED], now fixed)
  - Search/Filter in Dialog (2.1.19-2.1.22): 4/4 PASSED ✓
  - Keyboard Navigation (2.1.23-2.1.26): 4/4 PASSED ✓
  - Clear/Edit Filter (2.1.27-2.1.29): 3/3 PASSED ✓
  - Remove Filter (2.1.30-2.1.32): 3/3 PASSED ✓
- BUG #15 & #16 fixes VALIDATED - All blocked tests now executable
- Minor issues found (not blocking):
  - Focus management: Spacebar dialog open returns focus to search field instead of dialog first input
  - Tab order inefficiency: Requires ~50 Tab presses to reach Apply button; Shift+Tab works correctly

---

## REFERENCE LINKS

- **Main App**: http://localhost:4205/discover
- **Reference App**: http://localhost:4201
- **Backend API**: http://generic-prime.minilab/api/specs/v1 (Traefik ingress via /etc/hosts mapping to 192.168.0.244)
  - See [ORIENTATION.md - Backend API Testing](../claude/ORIENTATION.md#backend-api-testing-across-three-environments) for detailed access instructions across all environments (Thor SSH, dev container, E2E container)
  - ~~http://localhost:3000~~ (old reference - not used in current architecture)
- **Bug #13**: Dropdown keyboard navigation (arrow keys, Enter/Space)
- **Bug #7**: Checkbox visual state persistence

---

**Test Plan Version**: 1.1
**Last Updated**: 2025-12-01
**Test Executed By**: _____________
**Date Executed**: _____________
**Environment**: Development (Kubernetes)