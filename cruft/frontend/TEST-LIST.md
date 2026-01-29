# Comprehensive E2E Test Case List for Generic Prime

This document provides an exhaustive enumeration of all test cases required for complete coverage of the Generic Prime Angular application. Each test case is specific, actionable, and measurable.

**Total Test Cases: 500+**

**Legend**:
- **[M]** = Main Window Test
- **[P]** = Pop-Out Window Test
- **[I]** = Integration/Cross-Component Test
- **[R]** = Regression Test (Bug-specific)

---

## 1. Initial Load & Navigation (25 tests)

### 1.1 Page Load
- [ ] 1.1.1 [M] Navigate to `/automobiles/discover` - page loads without errors
- [ ] 1.1.2 [M] Verify Query Control panel is visible on load
- [ ] 1.1.3 [M] Verify Picker panel is visible on load
- [ ] 1.1.4 [M] Verify Results Table panel is visible on load
- [ ] 1.1.5 [M] Verify Statistics panel is visible on load
- [ ] 1.1.6 [M] Verify URL has no query parameters on fresh load
- [ ] 1.1.7 [M] Verify Results Table shows 4,887 total records
- [ ] 1.1.8 [M] Verify no console errors on initial load
- [ ] 1.1.9 [M] Verify no console warnings on initial load
- [ ] 1.1.10 [M] Verify all API calls complete successfully (check network)

### 1.2 URL State Hydration
- [ ] 1.2.1 [M] Load with `?manufacturer=Chevrolet` - filter chip appears
- [ ] 1.2.2 [M] Load with `?model=Camaro` - filter chip appears
- [ ] 1.2.3 [M] Load with `?bodyClass=Sedan` - filter chip appears
- [ ] 1.2.4 [M] Load with `?yearMin=2020` - filter chip appears
- [ ] 1.2.5 [M] Load with `?yearMax=2024` - filter chip appears
- [ ] 1.2.6 [M] Load with `?yearMin=2020&yearMax=2024` - single Year chip appears
- [ ] 1.2.7 [M] Load with `?manufacturer=Ford,Chevrolet` - chip shows multiple values
- [ ] 1.2.8 [M] Load with `?page=2` - Results Table shows page 2
- [ ] 1.2.9 [M] Load with `?size=50` - Results Table shows 50 rows
- [ ] 1.2.10 [M] Load with multiple params - all filters applied correctly
- [ ] 1.2.11 [M] Load with invalid param value - app handles gracefully
- [ ] 1.2.12 [M] Load with unknown param - app ignores it
- [ ] 1.2.13 [M] Load with empty param value `?manufacturer=` - app handles gracefully
- [ ] 1.2.14 [M] Load with special characters in param - properly decoded
- [ ] 1.2.15 [M] Load with URL-encoded comma `?manufacturer=Ford%2CChevrolet` - handles correctly

---

## 2. Query Control Panel - Filter Dropdown (50 tests)

### 2.1 Dropdown Opening
- [ ] 2.1.1 [M] Click dropdown trigger - panel opens
- [ ] 2.1.2 [M] Click dropdown when open - panel closes
- [ ] 2.1.3 [M] Press Escape when dropdown open - panel closes
- [ ] 2.1.4 [M] Click outside dropdown when open - panel closes
- [ ] 2.1.5 [M] Tab to dropdown and press Enter - panel opens
- [ ] 2.1.6 [M] Tab to dropdown and press Space - panel opens
- [ ] 2.1.7 [M] Tab to dropdown and press ArrowDown - panel opens

### 2.2 Dropdown Options Display
- [ ] 2.2.1 [M] Dropdown shows "Manufacturer" option
- [ ] 2.2.2 [M] Dropdown shows "Model" option
- [ ] 2.2.3 [M] Dropdown shows "Body Class" option
- [ ] 2.2.4 [M] Dropdown shows "Year" option (or "Year Range")
- [ ] 2.2.5 [M] Options appear in expected order
- [ ] 2.2.6 [M] Each option has correct label text
- [ ] 2.2.7 [M] No duplicate options appear

### 2.3 Dropdown Filtering (Search)
- [ ] 2.3.1 [M] Type "man" - shows Manufacturer, hides others without "man"
- [ ] 2.3.2 [M] Type "mod" - shows Model, hides others
- [ ] 2.3.3 [M] Type "bod" - shows Body Class
- [ ] 2.3.4 [M] Type "year" - shows Year option
- [ ] 2.3.5 [M] Type "xyz" (no match) - shows empty or "no results"
- [ ] 2.3.6 [M] Clear filter text - all options reappear
- [ ] 2.3.7 [M] Type uppercase "MANUFACTURER" - case-insensitive match
- [ ] 2.3.8 [M] Type with leading/trailing spaces - still matches

### 2.4 Dropdown Selection - Mouse
- [ ] 2.4.1 [M] Click "Manufacturer" option - opens Manufacturer dialog
- [ ] 2.4.2 [M] Click "Model" option - opens Model dialog
- [ ] 2.4.3 [M] Click "Body Class" option - opens Body Class dialog
- [ ] 2.4.4 [M] Click "Year" option - opens Year Range dialog
- [ ] 2.4.5 [M] After selection, dropdown closes
- [ ] 2.4.6 [M] After selection, dropdown placeholder resets

### 2.5 Dropdown Selection - Keyboard (no filter)
- [ ] 2.5.1 [M] ArrowDown once - first option highlighted
- [ ] 2.5.2 [M] ArrowDown twice - second option highlighted
- [ ] 2.5.3 [M] ArrowUp after ArrowDown - previous option highlighted
- [ ] 2.5.4 [M] ArrowDown at last option - stays on last (or wraps)
- [ ] 2.5.5 [M] ArrowUp at first option - stays on first (or wraps)
- [ ] 2.5.6 [M] Enter on highlighted option - opens correct dialog
- [ ] 2.5.7 [M] Space on highlighted option - opens correct dialog
- [ ] 2.5.8 [M] Escape during navigation - closes dropdown without selection

### 2.6 Dropdown Selection - Keyboard (with filter active) [Bug #15]
- [ ] 2.6.1 [R] Type "y" + ArrowDown to "Year" + Enter - opens Year dialog (not Model)
- [ ] 2.6.2 [R] Type "y" + ArrowDown to "Year" + Space - opens Year dialog (not Model)
- [ ] 2.6.3 [R] Type "b" + ArrowDown to "Body Class" + Enter - opens Body Class dialog
- [ ] 2.6.4 [R] Type "m" + ArrowDown to "Manufacturer" + Enter - opens Manufacturer dialog
- [ ] 2.6.5 [R] Type "m" + ArrowDown to "Model" + Enter - opens Model dialog
- [ ] 2.6.6 [M] Filter then clear, keyboard nav still works
- [ ] 2.6.7 [M] Rapid typing + immediate Enter - correct option selected
- [ ] 2.6.8 [M] Backspace to clear filter during nav - options restore correctly

---

## 3. Query Control - Multiselect Dialog (90 tests)

### 3.1 Manufacturer Dialog - Opening
- [ ] 3.1.1 [M] Dialog opens when Manufacturer selected from dropdown
- [ ] 3.1.2 [M] Dialog has correct title "Select Manufacturer"
- [ ] 3.1.3 [M] Dialog has subtitle explaining selection
- [ ] 3.1.4 [M] Dialog shows loading spinner initially
- [ ] 3.1.5 [M] Loading spinner disappears after API completes
- [ ] 3.1.6 [M] Dialog shows options after loading
- [ ] 3.1.7 [M] API call made to correct endpoint
- [ ] 3.1.8 [M] Focus automatically goes to search input

### 3.2 Manufacturer Dialog - Options Display
- [ ] 3.2.1 [M] Shows list of manufacturer options
- [ ] 3.2.2 [M] Each option has checkbox
- [ ] 3.2.3 [M] Each option has label with manufacturer name
- [ ] 3.2.4 [M] Options are alphabetically sorted
- [ ] 3.2.5 [M] "Chevrolet" option is present
- [ ] 3.2.6 [M] "Ford" option is present
- [ ] 3.2.7 [M] "Toyota" option is present
- [ ] 3.2.8 [M] "Brammo" option is present
- [ ] 3.2.9 [M] Multiple manufacturers are available (>10)

### 3.3 Manufacturer Dialog - Search
- [ ] 3.3.1 [M] Type "Chev" - shows Chevrolet
- [ ] 3.3.2 [M] Type "Chev" - hides non-matching options
- [ ] 3.3.3 [M] Type "Ford" - shows Ford
- [ ] 3.3.4 [M] Type "xyz" - shows "No options found" or empty
- [ ] 3.3.5 [M] Clear search - all options reappear
- [ ] 3.3.6 [M] Search is case-insensitive
- [ ] 3.3.7 [M] Partial match works ("che" matches "Chevrolet")
- [ ] 3.3.8 [M] Search with spaces handled correctly

### 3.4 Manufacturer Dialog - Selection
- [ ] 3.4.1 [M] Click checkbox - checkbox becomes checked
- [ ] 3.4.2 [M] Click checked checkbox - checkbox unchecks
- [ ] 3.4.3 [M] Click label - toggles checkbox
- [ ] 3.4.4 [M] Select multiple - all remain checked
- [ ] 3.4.5 [M] Selection summary updates "Selected (2)"
- [ ] 3.4.6 [M] Unselect one - summary updates "Selected (1)"
- [ ] 3.4.7 [M] Keyboard Space on focused checkbox - toggles
- [ ] 3.4.8 [M] Keyboard Tab moves through checkboxes
- [ ] 3.4.9 [M] Select all visible (if feature exists)

### 3.5 Manufacturer Dialog - Apply/Cancel
- [ ] 3.5.1 [M] Apply button visible
- [ ] 3.5.2 [M] Cancel button visible
- [ ] 3.5.3 [M] Apply disabled when no selection
- [ ] 3.5.4 [M] Apply enabled when selection made
- [ ] 3.5.5 [M] Click Apply - dialog closes
- [ ] 3.5.6 [M] Click Apply - URL updates with `manufacturer=`
- [ ] 3.5.7 [M] Click Apply - filter chip appears
- [ ] 3.5.8 [M] Click Cancel - dialog closes
- [ ] 3.5.9 [M] Click Cancel - URL unchanged
- [ ] 3.5.10 [M] Click Cancel - no chip added
- [ ] 3.5.11 [M] Click X button - same as Cancel
- [ ] 3.5.12 [M] Press Escape - same as Cancel
- [ ] 3.5.13 [M] Click outside dialog - same as Cancel

### 3.6 Model Dialog (similar pattern)
- [ ] 3.6.1 [M] Dialog opens when Model selected
- [ ] 3.6.2 [M] Dialog has correct title
- [ ] 3.6.3 [M] Shows model options
- [ ] 3.6.4 [M] Search works for models
- [ ] 3.6.5 [M] Selection works
- [ ] 3.6.6 [M] Apply updates URL with `model=`
- [ ] 3.6.7 [M] Cancel preserves state
- [ ] 3.6.8 [M] Model filter combined with Manufacturer in URL

### 3.7 Body Class Dialog (similar pattern)
- [ ] 3.7.1 [M] Dialog opens when Body Class selected
- [ ] 3.7.2 [M] Dialog has correct title
- [ ] 3.7.3 [M] Shows body class options (Sedan, Coupe, SUV, etc.)
- [ ] 3.7.4 [M] Search works for body classes
- [ ] 3.7.5 [M] Selection works
- [ ] 3.7.6 [M] Apply updates URL with `bodyClass=`
- [ ] 3.7.7 [M] Multiple body classes comma-separated in URL
- [ ] 3.7.8 [M] Cancel preserves state

### 3.8 Editing Existing Filter
- [ ] 3.8.1 [M] Click Manufacturer chip - dialog opens
- [ ] 3.8.2 [M] Dialog shows previous selection checked
- [ ] 3.8.3 [M] Uncheck previous, check new - Apply updates URL
- [ ] 3.8.4 [M] Add to selection (multi-select) - URL shows all
- [ ] 3.8.5 [M] Uncheck all - Apply removes filter
- [ ] 3.8.6 [M] Cancel preserves original selection

### 3.9 Dialog Error States
- [ ] 3.9.1 [M] API failure - shows error message
- [ ] 3.9.2 [M] API failure - shows Retry button
- [ ] 3.9.3 [M] Click Retry - API called again
- [ ] 3.9.4 [M] API timeout - shows appropriate error
- [ ] 3.9.5 [M] Network offline - shows offline message

---

## 4. Query Control - Year Range Dialog (40 tests)

### 4.1 Dialog Opening
- [ ] 4.1.1 [M] Dialog opens when Year selected
- [ ] 4.1.2 [M] Dialog has correct title "Select Year Range"
- [ ] 4.1.3 [M] Dialog shows min year input
- [ ] 4.1.4 [M] Dialog shows max year input
- [ ] 4.1.5 [M] Focus goes to min year input

### 4.2 Year Input Behavior
- [ ] 4.2.1 [M] Min year input accepts numeric input
- [ ] 4.2.2 [M] Max year input accepts numeric input
- [ ] 4.2.3 [M] Non-numeric input rejected or ignored
- [ ] 4.2.4 [M] Can enter 4-digit year (2020)
- [ ] 4.2.5 [M] Spinner buttons increment/decrement
- [ ] 4.2.6 [M] Clear min year input with backspace
- [ ] 4.2.7 [M] Clear max year input with backspace
- [ ] 4.2.8 [M] Tab moves between inputs

### 4.3 Year Validation
- [ ] 4.3.1 [M] Min year <= Max year (no error)
- [ ] 4.3.2 [M] Min year > Max year (shows validation error or disabled Apply)
- [ ] 4.3.3 [M] Year below minimum range - handled
- [ ] 4.3.4 [M] Year above maximum range - handled
- [ ] 4.3.5 [M] Year 0 - handled
- [ ] 4.3.6 [M] Negative year - handled

### 4.4 Year Apply/Cancel
- [ ] 4.4.1 [M] Apply disabled when both empty
- [ ] 4.4.2 [M] Apply enabled with only min year
- [ ] 4.4.3 [M] Apply enabled with only max year
- [ ] 4.4.4 [M] Apply enabled with both years
- [ ] 4.4.5 [M] Apply with min only - URL has `yearMin=`
- [ ] 4.4.6 [M] Apply with max only - URL has `yearMax=`
- [ ] 4.4.7 [M] Apply with both - URL has both params
- [ ] 4.4.8 [M] Cancel closes without changes
- [ ] 4.4.9 [M] X button same as Cancel
- [ ] 4.4.10 [M] Escape same as Cancel

### 4.5 Editing Existing Year Filter
- [ ] 4.5.1 [M] Click Year chip - dialog opens
- [ ] 4.5.2 [M] Dialog shows previous min year value
- [ ] 4.5.3 [M] Dialog shows previous max year value
- [ ] 4.5.4 [M] Change values and Apply - URL updates
- [ ] 4.5.5 [M] Clear both and Apply - filter removed

---

## 5. Query Control - Filter Chips (45 tests)

### 5.1 Chip Display
- [ ] 5.1.1 [M] Chip appears after filter applied
- [ ] 5.1.2 [M] Chip shows filter label (Manufacturer, Model, etc.)
- [ ] 5.1.3 [M] Chip shows selected value(s)
- [ ] 5.1.4 [M] Single value chip: "Manufacturer: Chevrolet"
- [ ] 5.1.5 [M] Multiple values chip: "Manufacturer: Ford, Chevrolet"
- [ ] 5.1.6 [M] Many values truncated: "Manufacturer: Ford, Chevrolet... +3"
- [ ] 5.1.7 [M] Year range chip: "Year: 2020 - 2024"
- [ ] 5.1.8 [M] Year min only chip: "Year: 2020+"
- [ ] 5.1.9 [M] Year max only chip: "Year: -2024"
- [ ] 5.1.10 [M] Chip has remove (X) button

### 5.2 Chip Removal
- [ ] 5.2.1 [M] Click X - chip removed
- [ ] 5.2.2 [M] Click X - URL param removed
- [ ] 5.2.3 [M] Click X - Results Table updates
- [ ] 5.2.4 [M] Click X - page resets to 1
- [ ] 5.2.5 [M] Remove last chip - all filters gone
- [ ] 5.2.6 [M] Keyboard: focus X button + Enter - removes chip

### 5.3 Chip Edit
- [ ] 5.3.1 [M] Click chip body (not X) - opens edit dialog
- [ ] 5.3.2 [M] Correct dialog opens for chip type
- [ ] 5.3.3 [M] Dialog shows current values pre-selected
- [ ] 5.3.4 [M] Keyboard: focus chip + Enter - opens dialog

### 5.4 Multiple Chips
- [ ] 5.4.1 [M] Multiple chips display correctly
- [ ] 5.4.2 [M] Chips don't overflow container (wrap or scroll)
- [ ] 5.4.3 [M] Remove one chip - others remain
- [ ] 5.4.4 [M] Edit one chip - others unchanged
- [ ] 5.4.5 [M] Order of chips is consistent

### 5.5 Chip Tooltips
- [ ] 5.5.1 [M] Hover chip - tooltip appears
- [ ] 5.5.2 [M] Tooltip shows full value list
- [ ] 5.5.3 [M] Tooltip shows "Click to edit"

---

## 6. Query Control - Clear All Button (20 tests)

### 6.1 Button State
- [ ] 6.1.1 [M] Button disabled when no filters
- [ ] 6.1.2 [M] Button enabled when one filter exists
- [ ] 6.1.3 [M] Button enabled when multiple filters exist
- [ ] 6.1.4 [M] Button text is "Clear All"

### 6.2 Button Action
- [ ] 6.2.1 [M] Click Clear All - all chips removed
- [ ] 6.2.2 [M] Click Clear All - URL params cleared
- [ ] 6.2.3 [M] Click Clear All - Results Table shows full count
- [ ] 6.2.4 [M] Click Clear All - page resets to 1
- [ ] 6.2.5 [M] Click Clear All - Statistics update
- [ ] 6.2.6 [M] Click Clear All - Picker clears selection

### 6.3 Clear All with Different Filter Combinations
- [ ] 6.3.1 [M] Clear with only Manufacturer filter
- [ ] 6.3.2 [M] Clear with only Year filter
- [ ] 6.3.3 [M] Clear with Manufacturer + Model
- [ ] 6.3.4 [M] Clear with all filter types
- [ ] 6.3.5 [M] Clear with pagination active (resets page)

---

## 7. Results Table Panel (80 tests)

### 7.1 Table Display
- [ ] 7.1.1 [M] Table renders on page load
- [ ] 7.1.2 [M] Table has header row
- [ ] 7.1.3 [M] Header shows correct column names
- [ ] 7.1.4 [M] Table has data rows
- [ ] 7.1.5 [M] Default page size is 20 rows
- [ ] 7.1.6 [M] Cells show correct data types
- [ ] 7.1.7 [M] Year column shows numeric year
- [ ] 7.1.8 [M] Manufacturer column shows text
- [ ] 7.1.9 [M] Model column shows text
- [ ] 7.1.10 [M] No empty rows at end

### 7.2 Pagination Display
- [ ] 7.2.1 [M] Paginator visible below table
- [ ] 7.2.2 [M] Shows current page info "Showing 1 to 20 of 4887"
- [ ] 7.2.3 [M] First page button visible
- [ ] 7.2.4 [M] Previous page button visible
- [ ] 7.2.5 [M] Next page button visible
- [ ] 7.2.6 [M] Last page button visible
- [ ] 7.2.7 [M] Page size dropdown visible
- [ ] 7.2.8 [M] Current page indicator visible

### 7.3 Pagination Navigation
- [ ] 7.3.1 [M] Click Next - shows page 2 data
- [ ] 7.3.2 [M] Click Next - URL updates `page=2`
- [ ] 7.3.3 [M] Click Previous - shows page 1
- [ ] 7.3.4 [M] Click First - goes to page 1
- [ ] 7.3.5 [M] Click Last - goes to last page
- [ ] 7.3.6 [M] On page 1, Previous disabled
- [ ] 7.3.7 [M] On last page, Next disabled
- [ ] 7.3.8 [M] Click page number - goes to that page
- [ ] 7.3.9 [M] Paginator text updates on navigation

### 7.4 Page Size
- [ ] 7.4.1 [M] Open page size dropdown
- [ ] 7.4.2 [M] Shows options: 10, 20, 50, 100
- [ ] 7.4.3 [M] Select 10 - shows 10 rows
- [ ] 7.4.4 [M] Select 50 - shows 50 rows
- [ ] 7.4.5 [M] Select 100 - shows 100 rows
- [ ] 7.4.6 [M] Change page size - URL updates `size=`
- [ ] 7.4.7 [M] Change page size - resets to page 1

### 7.5 Sorting
- [ ] 7.5.1 [M] Click Year header - sorts ascending
- [ ] 7.5.2 [M] Click Year header again - sorts descending
- [ ] 7.5.3 [M] Click Manufacturer header - sorts by manufacturer
- [ ] 7.5.4 [M] Sort indicator appears on column
- [ ] 7.5.5 [M] URL updates with sort params
- [ ] 7.5.6 [M] Sort combined with filter works
- [ ] 7.5.7 [M] Sort combined with pagination works
- [ ] 7.5.8 [M] Multiple column sort (if supported)

### 7.6 Filtered Data Display
- [ ] 7.6.1 [M] With Manufacturer filter - shows only that manufacturer
- [ ] 7.6.2 [M] With Year filter - shows only matching years
- [ ] 7.6.3 [M] With multiple filters - shows intersection
- [ ] 7.6.4 [M] Count updates to filtered total
- [ ] 7.6.5 [M] Pagination adjusts to filtered count

### 7.7 Empty State
- [ ] 7.7.1 [M] No results - shows "No records found"
- [ ] 7.7.2 [M] No results - pagination hidden or disabled
- [ ] 7.7.3 [M] Filter producing 0 results - handled gracefully

### 7.8 Row Expansion (if applicable)
- [ ] 7.8.1 [M] Click expand icon - row expands
- [ ] 7.8.2 [M] Expanded row shows detail content
- [ ] 7.8.3 [M] Click again - row collapses
- [ ] 7.8.4 [M] Expand one row, expand another - both open (or first closes)
- [ ] 7.8.5 [M] Expansion state not in URL

### 7.9 Row Selection (if applicable)
- [ ] 7.9.1 [M] Click row - row highlights
- [ ] 7.9.2 [M] Selection updates URL or detail panel
- [ ] 7.9.3 [M] Click another row - selection changes
- [ ] 7.9.4 [M] Multi-select with Ctrl+Click (if supported)

---

## 8. Manufacturer-Model Picker Panel (60 tests)

### 8.1 Picker Display
- [ ] 8.1.1 [M] Picker panel visible on load
- [ ] 8.1.2 [M] Shows grid/table of Manufacturer-Model combinations
- [ ] 8.1.3 [M] Shows Manufacturer column
- [ ] 8.1.4 [M] Shows Model column
- [ ] 8.1.5 [M] Shows Count column (optional)
- [ ] 8.1.6 [M] Shows checkbox column
- [ ] 8.1.7 [M] Shows pagination info "Showing 1 to 20 of 881"

### 8.2 Picker Pagination
- [ ] 8.2.1 [M] Paginator visible
- [ ] 8.2.2 [M] Click Next - shows more combinations
- [ ] 8.2.3 [M] Scroll/lazy load works (if applicable)
- [ ] 8.2.4 [M] Shows total count of combinations (881)

### 8.3 Picker Search
- [ ] 8.3.1 [M] Search input visible
- [ ] 8.3.2 [M] Type "Ford" - filters to Ford combinations
- [ ] 8.3.3 [M] Type "Camaro" - filters to Camaro
- [ ] 8.3.4 [M] Clear search - all combinations return
- [ ] 8.3.5 [M] Search is debounced (not on every keystroke)

### 8.4 Picker Selection
- [ ] 8.4.1 [M] Click checkbox - row selected
- [ ] 8.4.2 [M] Click row - toggles checkbox
- [ ] 8.4.3 [M] Multiple selections allowed
- [ ] 8.4.4 [M] Selection updates URL
- [ ] 8.4.5 [M] Selection shows in Query Control as chip
- [ ] 8.4.6 [M] Uncheck - removes selection
- [ ] 8.4.7 [M] Clear All in Query Control - clears picker selection

### 8.5 Picker with Filters
- [ ] 8.5.1 [M] Apply Year filter - picker shows filtered counts
- [ ] 8.5.2 [M] Apply Manufacturer filter - picker highlights matching rows
- [ ] 8.5.3 [M] Clear filters - picker resets
- [ ] 8.5.4 [M] Picker selection + other filter = combined results

### 8.6 Bug #11 Regression
- [ ] 8.6.1 [R] Picker shows >800 combinations (not ~72)
- [ ] 8.6.2 [R] API pagination works correctly
- [ ] 8.6.3 [R] "Showing 1 to 20 of 881" visible

---

## 9. Statistics Panel (55 tests)

### 9.1 Panel Display
- [ ] 9.1.1 [M] Statistics panel visible
- [ ] 9.1.2 [M] Shows multiple charts
- [ ] 9.1.3 [M] Charts have titles
- [ ] 9.1.4 [M] Charts have data

### 9.2 Chart Types
- [ ] 9.2.1 [M] Bar chart renders correctly
- [ ] 9.2.2 [M] Pie chart renders correctly
- [ ] 9.2.3 [M] Line chart renders correctly (if applicable)
- [ ] 9.2.4 [M] Chart has axis labels
- [ ] 9.2.5 [M] Chart has legend

### 9.3 Chart Data
- [ ] 9.3.1 [M] Manufacturer chart shows manufacturer distribution
- [ ] 9.3.2 [M] Year chart shows year distribution
- [ ] 9.3.3 [M] Body Class chart shows body class distribution
- [ ] 9.3.4 [M] Charts update when filter applied
- [ ] 9.3.5 [M] Charts show filtered data correctly

### 9.4 Chart Interaction - Cross-Filtering
- [ ] 9.4.1 [M] Click bar in Manufacturer chart - applies filter
- [ ] 9.4.2 [M] Click slice in pie chart - applies filter
- [ ] 9.4.3 [M] Chart click updates URL
- [ ] 9.4.4 [M] Chart click shows chip in Query Control
- [ ] 9.4.5 [M] Other charts update after click
- [ ] 9.4.6 [M] Results Table updates after chart click

### 9.5 Chart Interaction - Highlighting
- [ ] 9.5.1 [M] Shift+Click chart - applies highlight filter
- [ ] 9.5.2 [M] Highlight filter uses `h_` prefix in URL
- [ ] 9.5.3 [M] Chart shows highlighted segments differently
- [ ] 9.5.4 [M] Highlight + Filter work together

### 9.6 Chart Responsiveness
- [ ] 9.6.1 [M] Resize window - charts resize
- [ ] 9.6.2 [M] Collapse panel - charts hidden
- [ ] 9.6.3 [M] Expand panel - charts redraw correctly
- [ ] 9.6.4 [M] Very small window - charts remain usable

### 9.7 Chart API
- [ ] 9.7.1 [M] Correct aggregation endpoints called
- [ ] 9.7.2 [M] Charts handle API errors gracefully
- [ ] 9.7.3 [M] Charts show loading state during fetch

---

## 10. Panel Management (40 tests)

### 10.1 Panel Collapse/Expand
- [ ] 10.1.1 [M] Query Control - click collapse button - panel collapses
- [ ] 10.1.2 [M] Query Control - click again - panel expands
- [ ] 10.1.3 [M] Picker - collapse/expand works
- [ ] 10.1.4 [M] Results Table - collapse/expand works
- [ ] 10.1.5 [M] Statistics - collapse/expand works
- [ ] 10.1.6 [M] Collapse state not in URL
- [ ] 10.1.7 [M] Collapse state persists on refresh (via preferences)
- [ ] 10.1.8 [M] Collapse one panel - others unaffected

### 10.2 Panel Drag-Drop Reorder
- [ ] 10.2.1 [M] Drag Query Control below Picker - order changes
- [ ] 10.2.2 [M] Drag Results Table to top - order changes
- [ ] 10.2.3 [M] Order not in URL
- [ ] 10.2.4 [M] Order persists on refresh (via preferences)
- [ ] 10.2.5 [M] Drag and drop visual feedback works

### 10.3 Panel Pop-Out Button
- [ ] 10.3.1 [M] Each panel has pop-out button
- [ ] 10.3.2 [M] Pop-out button has correct icon
- [ ] 10.3.3 [M] Pop-out button has tooltip
- [ ] 10.3.4 [M] Pop-out button opens new window

---

## 11. Pop-Out Windows - Query Control (35 tests)

### 11.1 Pop-Out Opening
- [ ] 11.1.1 [P] Click pop-out button - new window opens
- [ ] 11.1.2 [P] Pop-out URL format: `/panel/discover/query-control/query-control`
- [ ] 11.1.3 [P] Pop-out URL has no query params
- [ ] 11.1.4 [P] Pop-out window has correct title
- [ ] 11.1.5 [P] Main window panel replaced by placeholder

### 11.2 Pop-Out Initial State
- [ ] 11.2.1 [P] Pop-out shows current filter chips immediately
- [ ] 11.2.2 [P] Pop-out dropdown works
- [ ] 11.2.3 [P] Pop-out dialogs open correctly
- [ ] 11.2.4 [P] No console errors in pop-out

### 11.3 Pop-Out Synchronization (Main -> Pop-Out)
- [ ] 11.3.1 [I] Add filter in Main - chip appears in Pop-out
- [ ] 11.3.2 [I] Remove filter in Main - chip disappears from Pop-out
- [ ] 11.3.3 [I] Clear All in Main - Pop-out chips cleared
- [ ] 11.3.4 [I] Edit filter in Main - Pop-out shows updated value
- [ ] 11.3.5 [I] Multiple rapid changes - Pop-out stays in sync

### 11.4 Pop-Out Synchronization (Pop-Out -> Main)
- [ ] 11.4.1 [I] Add filter in Pop-out - Main URL updates
- [ ] 11.4.2 [I] Add filter in Pop-out - Main shows chip
- [ ] 11.4.3 [I] Remove filter in Pop-out - Main URL updates
- [ ] 11.4.4 [I] Clear All in Pop-out - Main URL cleared
- [ ] 11.4.5 [I] Edit filter in Pop-out - Main URL updates

### 11.5 Pop-Out Closing
- [ ] 11.5.1 [P] Close pop-out window - Main panel reappears
- [ ] 11.5.2 [P] Close via X button - proper cleanup
- [ ] 11.5.3 [P] Close via keyboard Alt+F4 - proper cleanup
- [ ] 11.5.4 [P] State preserved after close

---

## 12. Pop-Out Windows - Results Table (30 tests)

### 12.1 Pop-Out Opening
- [ ] 12.1.1 [P] Click pop-out button - new window opens
- [ ] 12.1.2 [P] Pop-out shows table with data
- [ ] 12.1.3 [P] Pop-out shows correct filtered data

### 12.2 Pop-Out Functionality
- [ ] 12.2.1 [P] Pagination works in pop-out
- [ ] 12.2.2 [P] Sorting works in pop-out
- [ ] 12.2.3 [P] Row expansion works in pop-out
- [ ] 12.2.4 [P] Page size change works in pop-out

### 12.3 Pop-Out Synchronization
- [ ] 12.3.1 [I] Change page in Pop-out - Main URL updates
- [ ] 12.3.2 [I] Apply filter in Main - Pop-out table updates
- [ ] 12.3.3 [I] Sort in Pop-out - Main URL updates
- [ ] 12.3.4 [I] Clear filters - Pop-out shows all data

### 12.4 Bug #14 Regression (Multi-Window)
- [ ] 12.4.1 [R] Pop-out Query Control + Results Table simultaneously
- [ ] 12.4.2 [R] Apply filter in Query Control pop-out
- [ ] 12.4.3 [R] Results Table pop-out updates with filtered data
- [ ] 12.4.4 [R] Results Table shows correct count (not 4887)

---

## 13. Pop-Out Windows - Statistics Panel (25 tests)

### 13.1 Pop-Out Opening
- [ ] 13.1.1 [P] Click pop-out button - new window opens
- [ ] 13.1.2 [P] Pop-out shows all charts
- [ ] 13.1.3 [P] Charts render correctly in pop-out

### 13.2 Pop-Out Functionality
- [ ] 13.2.1 [P] Chart interactions work in pop-out
- [ ] 13.2.2 [P] Cross-filtering works in pop-out
- [ ] 13.2.3 [P] Charts responsive in pop-out window

### 13.3 Pop-Out Synchronization
- [ ] 13.3.1 [I] Apply filter in Main - Pop-out charts update
- [ ] 13.3.2 [I] Click chart in Pop-out - Main URL updates
- [ ] 13.3.3 [I] Other pop-outs update when chart clicked
- [ ] 13.3.4 [R] Highlight selection (h+click) in Pop-out Statistics - Main URL/QC updates

### 13.4 Bug #10 Regression
- [ ] 13.4.1 [R] Load with `?bodyClass=Coupe,Sedan`
- [ ] 13.4.2 [R] Pop-out Statistics panel
- [ ] 13.4.3 [R] Charts render correctly (not empty)
- [ ] 13.4.4 [R] Charts show filtered data

---

## 14. Pop-Out Windows - Picker Panel (25 tests)

### 14.1 Pop-Out Opening
- [ ] 14.1.1 [P] Click pop-out button - new window opens
- [ ] 14.1.2 [P] Pop-out shows picker grid
- [ ] 14.1.3 [P] Search works in pop-out

### 14.2 Pop-Out Functionality
- [ ] 14.2.1 [P] Selection works in pop-out
- [ ] 14.2.2 [P] Pagination works in pop-out
- [ ] 14.2.3 [P] Search works in pop-out

### 14.3 Pop-Out Synchronization
- [ ] 14.3.1 [I] Select in Pop-out - Main URL updates
- [ ] 14.3.2 [I] Clear in Main - Pop-out selections cleared
- [ ] 14.3.3 [I] Apply filter in Main - Pop-out counts update

### 14.4 Bug #7 Regression
- [ ] 14.4.1 [R] Select items in pop-out picker
- [ ] 14.4.2 [R] Clear All in Main window
- [ ] 14.4.3 [R] Pop-out checkboxes are unchecked

---

## 15. Multi-Window Integration Tests (45 tests)

### 15.1 Dual Pop-Out Scenarios
- [ ] 15.1.1 [I] Pop-out Query Control + Results Table
- [ ] 15.1.2 [I] Change filter in QC pop-out - Results pop-out updates
- [ ] 15.1.3 [I] Pop-out Query Control + Statistics
- [ ] 15.1.4 [I] Click chart in Stats pop-out - QC pop-out shows chip
- [ ] 15.1.5 [I] Pop-out Results Table + Statistics
- [ ] 15.1.6 [I] Paginate in Results - Stats remain consistent
- [ ] 15.1.7 [I] Pop-out Query Control + Picker
- [ ] 15.1.8 [I] Select in Picker - QC shows chip

### 15.2 Triple Pop-Out Scenarios
- [ ] 15.2.1 [I] Pop-out QC + Results + Stats
- [ ] 15.2.2 [I] Apply filter - all three update
- [ ] 15.2.3 [I] Clear All - all three clear
- [ ] 15.2.4 [I] Close one pop-out - others continue working

### 15.3 Full Pop-Out (All 4 Panels)
- [ ] 15.3.1 [I] Pop-out all 4 panels
- [ ] 15.3.2 [I] Main window shows 4 placeholders
- [ ] 15.3.3 [I] Apply filter via URL in Main - all pop-outs update
- [ ] 15.3.4 [I] Apply filter in any pop-out - all others update
- [ ] 15.3.5 [I] Clear All - all pop-outs clear
- [ ] 15.3.6 [I] Close all pop-outs - Main panels reappear

### 15.4 Rapid Operations
- [ ] 15.4.1 [I] Apply 5 filters quickly - final state correct
- [ ] 15.4.2 [I] Open/close pop-out rapidly - no errors
- [ ] 15.4.3 [I] Rapid filter changes - all windows in sync
- [ ] 15.4.4 [I] High-frequency navigation - state consistent

### 15.5 Edge Cases
- [ ] 15.5.1 [I] Main window navigates away - pop-outs close
- [ ] 15.5.2 [I] Main window refreshes - pop-outs close
- [ ] 15.5.3 [I] Pop-out loses connection to Main - handles gracefully
- [ ] 15.5.4 [I] Main window crashes - pop-outs handle gracefully

---

## 16. Cross-Component Integration (40 tests)

### 16.1 Filter -> Results Table
- [ ] 16.1.1 [I] Apply Manufacturer filter - table shows only that manufacturer
- [ ] 16.1.2 [I] Apply Model filter - table shows only that model
- [ ] 16.1.3 [I] Apply Body Class filter - table shows only that body class
- [ ] 16.1.4 [I] Apply Year filter - table shows only matching years
- [ ] 16.1.5 [I] Apply multiple filters - table shows intersection
- [ ] 16.1.6 [I] Remove filter - table shows more results

### 16.2 Filter -> Statistics
- [ ] 16.2.1 [I] Apply filter - charts update
- [ ] 16.2.2 [I] Charts show filtered distribution
- [ ] 16.2.3 [I] Clear filter - charts show full distribution

### 16.3 Filter -> Picker
- [ ] 16.3.1 [I] Apply Year filter - picker counts update
- [ ] 16.3.2 [I] Apply Manufacturer filter - picker highlights rows
- [ ] 16.3.3 [I] Clear filter - picker resets

### 16.4 Picker -> Other Components
- [ ] 16.4.1 [I] Select in Picker - Query Control shows chip
- [ ] 16.4.2 [I] Select in Picker - Results Table filters
- [ ] 16.4.3 [I] Select in Picker - Statistics update

### 16.5 Chart Click -> Other Components
- [ ] 16.5.1 [I] Click chart - Query Control shows chip
- [ ] 16.5.2 [I] Click chart - Results Table filters
- [ ] 16.5.3 [I] Click chart - Picker highlights

### 16.6 URL -> All Components
- [ ] 16.6.1 [I] Load URL with filters - all components hydrate
- [ ] 16.6.2 [I] Browser back - all components update
- [ ] 16.6.3 [I] Browser forward - all components update
- [ ] 16.6.4 [I] Copy/paste URL - identical state

---

## 17. Keyboard Navigation & Accessibility (35 tests)

### 17.1 Focus Management
- [ ] 17.1.1 [M] Tab navigates through interactive elements
- [ ] 17.1.2 [M] Shift+Tab navigates backwards
- [ ] 17.1.3 [M] Focus visible on focused element
- [ ] 17.1.4 [M] Focus trapped in open dialog
- [ ] 17.1.5 [M] Dialog close returns focus to trigger

### 17.2 Keyboard Shortcuts
- [ ] 17.2.1 [M] Escape closes dialogs
- [ ] 17.2.2 [M] Enter activates buttons
- [ ] 17.2.3 [M] Space activates checkboxes
- [ ] 17.2.4 [M] Arrow keys navigate lists
- [ ] 17.2.5 [M] Home/End in lists (if supported)

### 17.3 Screen Reader Support
- [ ] 17.3.1 [M] Panels have appropriate ARIA labels
- [ ] 17.3.2 [M] Dialogs have ARIA role="dialog"
- [ ] 17.3.3 [M] Buttons have accessible names
- [ ] 17.3.4 [M] Form inputs have labels
- [ ] 17.3.5 [M] Error messages announced

---

## 18. Error Handling (30 tests)

### 18.1 API Errors
- [ ] 18.1.1 [M] 500 error - shows error message
- [ ] 18.1.2 [M] 404 error - shows appropriate message
- [ ] 18.1.3 [M] Network timeout - shows timeout message
- [ ] 18.1.4 [M] Network offline - shows offline message
- [ ] 18.1.5 [M] API returns invalid JSON - handles gracefully

### 18.2 Validation Errors
- [ ] 18.2.1 [M] Invalid year range - shows validation error
- [ ] 18.2.2 [M] Empty selection Apply - button disabled
- [ ] 18.2.3 [M] Invalid URL params - sanitized/ignored

### 18.3 Recovery
- [ ] 18.3.1 [M] Retry button works after API failure
- [ ] 18.3.2 [M] Network restored - app recovers
- [ ] 18.3.3 [M] Clear filters after error - returns to clean state

---

## 19. Performance (20 tests)

### 19.1 Load Performance
- [ ] 19.1.1 [M] Initial load < 3 seconds
- [ ] 19.1.2 [M] No duplicate API calls on load
- [ ] 19.1.3 [M] API calls have proper caching headers

### 19.2 Interaction Performance
- [ ] 19.2.1 [M] Filter application < 1 second
- [ ] 19.2.2 [M] Dialog opens < 500ms
- [ ] 19.2.3 [M] Chart updates < 1 second
- [ ] 19.2.4 [M] No jank during animations

### 19.3 Memory
- [ ] 19.3.1 [M] No memory leaks after repeated filter changes
- [ ] 19.3.2 [M] Pop-out close releases memory
- [ ] 19.3.3 [M] Long session doesn't degrade performance

---

## 20. Browser Compatibility (15 tests)

### 20.1 Chrome
- [ ] 20.1.1 All features work in Chrome latest
- [ ] 20.1.2 Pop-outs work in Chrome

### 20.2 Firefox
- [ ] 20.2.1 All features work in Firefox latest
- [ ] 20.2.2 Pop-outs work in Firefox

### 20.3 Safari
- [ ] 20.3.1 All features work in Safari latest
- [ ] 20.3.2 Pop-outs work in Safari

### 20.4 Edge
- [ ] 20.4.1 All features work in Edge latest
- [ ] 20.4.2 Pop-outs work in Edge

---

## 21. Domain-Specific Tests (40 tests)

### 21.1 Automobile Domain
- [ ] 21.1.1 [M] Route `/automobiles/discover` works
- [ ] 21.1.2 [M] Automobile filters configured correctly
- [ ] 21.1.3 [M] Automobile columns display correctly
- [ ] 21.1.4 [M] Automobile statistics show correct aggregations
- [ ] 21.1.5 [M] Manufacturer-Model picker shows auto data

### 21.2 Physics Domain
- [ ] 21.2.1 [M] Route `/physics/graph` works
- [ ] 21.2.2 [M] Physics graph renders
- [ ] 21.2.3 [M] Physics syllabus displays
- [ ] 21.2.4 [M] Node interactions work

### 21.3 Agriculture Domain
- [ ] 21.3.1 [M] Route `/agriculture/discover` works
- [ ] 21.3.2 [M] Agriculture stub loads

### 21.4 Chemistry Domain
- [ ] 21.4.1 [M] Route `/chemistry/discover` works
- [ ] 21.4.2 [M] Chemistry stub loads

### 21.5 Math Domain
- [ ] 21.5.1 [M] Route `/math/discover` works
- [ ] 21.5.2 [M] Math stub loads

### 21.6 Domain Isolation
- [ ] 21.6.1 [M] Auto filters don't affect Physics
- [ ] 21.6.2 [M] Preferences per domain work
- [ ] 21.6.3 [M] Domain switch clears state

---

## 22. User Preferences (25 tests)

### 22.1 Panel Order Persistence
- [ ] 22.1.1 [M] Reorder panels - order saved
- [ ] 22.1.2 [M] Refresh - order restored
- [ ] 22.1.3 [M] New session - order restored

### 22.2 Collapsed State Persistence
- [ ] 22.2.1 [M] Collapse panel - state saved
- [ ] 22.2.2 [M] Refresh - panel still collapsed
- [ ] 22.2.3 [M] New session - panel still collapsed

### 22.3 Domain Preferences
- [ ] 22.3.1 [M] Auto prefs don't affect Physics prefs
- [ ] 22.3.2 [M] Each domain has independent prefs

### 22.4 Preference API
- [ ] 22.4.1 [M] Preferences save to backend
- [ ] 22.4.2 [M] Preferences load from backend
- [ ] 22.4.3 [M] Fallback to localStorage if backend fails

---

## Summary

| Category | Test Count |
|----------|------------|
| Initial Load & Navigation | 25 |
| Query Control Dropdown | 50 |
| Multiselect Dialogs | 90 |
| Year Range Dialog | 40 |
| Filter Chips | 45 |
| Clear All Button | 20 |
| Results Table | 80 |
| Picker Panel | 60 |
| Statistics Panel | 55 |
| Panel Management | 40 |
| Pop-Out Query Control | 35 |
| Pop-Out Results Table | 30 |
| Pop-Out Statistics | 25 |
| Pop-Out Picker | 25 |
| Multi-Window Integration | 45 |
| Cross-Component Integration | 40 |
| Keyboard/Accessibility | 35 |
| Error Handling | 30 |
| Performance | 20 |
| Browser Compatibility | 15 |
| Domain-Specific | 40 |
| User Preferences | 25 |
| **TOTAL** | **~870** |

---

**Document Version**: 2.0
**Last Updated**: 2025-12-25
**Author**: Claude (Monster Watch Session)
