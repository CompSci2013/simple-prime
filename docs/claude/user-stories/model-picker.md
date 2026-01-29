# Manufacturer-Model Picker Component - User Stories

**Created**: 2026-01-02
**Component**: Base Picker (Manufacturer-Model Configuration)
**Location**: `frontend/src/framework/components/base-picker/`
**Configuration**: `frontend/src/domain-config/automobile/configs/automobile.picker-configs.ts`
**Purpose**: Comprehensive user stories for QA component testing

---

## Overview

The Manufacturer-Model Picker (also known as "Model Picker") is a configuration-driven multi-select table component for selecting manufacturer-model combinations. It is built on the generic `BasePickerComponent` framework and configured via `PickerConfig`. The component features:

- **Table Display**: PrimeNG Table with sortable columns (Manufacturer, Model, Count)
- **Multi-Select**: Checkbox selection with select-all capability
- **Search**: Server-side search filtering
- **Pagination**: Server-side pagination with configurable page sizes
- **URL Synchronization**: Selections persist to URL via `modelCombos` parameter
- **Pop-Out Support**: Works in both main window and pop-out windows via BroadcastChannel
- **Apply/Clear Actions**: Explicit apply and clear buttons for selection management

---

## Epic 1: Table Display and Data Loading

### US-MP-001: View Picker Table on Page Load
**As a** data analyst
**I want to** see the manufacturer-model picker table when the page loads
**So that** I can select specific vehicle combinations to filter

**Acceptance Criteria**:
- Picker panel displays with title "Manufacturer-Model Picker"
- Table shows three columns: Manufacturer, Model, Count
- Table loads data from API endpoint `/manufacturer-model-combinations`
- Skeleton loading indicators display while data loads
- Data displays in rows after loading completes

---

### US-MP-002: View Paginator with Total Count
**As a** data analyst
**I want to** see the total number of manufacturer-model combinations
**So that** I understand the full scope of available data

**Acceptance Criteria**:
- Paginator displays at bottom of table
- Shows current range: "Showing 1 to 20 of 881 entries"
- Total count matches API response total (> 800 entries expected)
- Page size dropdown shows options: 10, 20, 50, 100

---

### US-MP-003: View Column Headers with Sort Indicators
**As a** data analyst
**I want to** see which columns are sortable
**So that** I can organize data by different attributes

**Acceptance Criteria**:
- Manufacturer column header shows sort icon (sortable)
- Model column header shows sort icon (sortable)
- Count column header shows sort icon (sortable)
- Click on header sorts by that column
- Sort icon indicates current sort direction (asc/desc)

---

### US-MP-004: View Empty State
**As a** data analyst
**I want to** see a clear message when no data is available
**So that** I understand the picker is empty

**Acceptance Criteria**:
- Empty state shows icon (pi-inbox)
- Message displays: "No data available"
- Empty state spans full table width
- Occurs when API returns 0 results

---

### US-MP-005: View Loading State
**As a** data analyst
**I want to** see loading indicators during data fetch
**So that** I know data is being loaded

**Acceptance Criteria**:
- Skeleton rows display during API call
- 5 skeleton placeholder rows shown
- Skeleton spans full row width
- Skeletons replaced by real data when load completes

---

### US-MP-006: View Error State
**As a** data analyst
**I want to** see error information when data fails to load
**So that** I understand something went wrong

**Acceptance Criteria**:
- Error message displays below table
- PrimeNG Message component with severity "error"
- Shows error text or "An error occurred"
- Table shows empty/loading state during error

---

## Epic 2: Row Selection

### US-MP-010: Select Single Row
**As a** data analyst
**I want to** select a manufacturer-model combination by clicking its checkbox
**So that** I can filter data to that specific combination

**Acceptance Criteria**:
- Each row has a checkbox in the first column
- Clicking checkbox toggles selection state
- Selected row checkbox displays as checked
- Unselected row checkbox displays as unchecked

---

### US-MP-011: Deselect Single Row
**As a** data analyst
**I want to** remove a selection by clicking its checkbox again
**So that** I can adjust my selections

**Acceptance Criteria**:
- Clicking a checked checkbox unchecks it
- Row is removed from selection set
- Selection count updates immediately
- Other selections remain unchanged

---

### US-MP-012: Select Multiple Rows
**As a** data analyst
**I want to** select multiple manufacturer-model combinations
**So that** I can filter data to several combinations at once

**Acceptance Criteria**:
- Can select 2+ rows by clicking multiple checkboxes
- Each selected row shows checked checkbox
- No limit on number of selections
- Selections from different manufacturers allowed

---

### US-MP-013: Select All Visible Rows
**As a** data analyst
**I want to** select all rows on the current page at once
**So that** I can quickly select a large set

**Acceptance Criteria**:
- Header row contains "select all" checkbox
- Clicking header checkbox selects all visible rows
- All row checkboxes become checked
- Header checkbox shows checked state

---

### US-MP-014: Deselect All Visible Rows
**As a** data analyst
**I want to** clear all selections on the current page at once
**So that** I can quickly reset my choices

**Acceptance Criteria**:
- Clicking checked header checkbox unchecks all visible rows
- All row checkboxes become unchecked
- Header checkbox shows unchecked state
- Selections from other pages preserved (if any)

---

### US-MP-015: View Selection Count
**As a** data analyst
**I want to** see how many items I have selected
**So that** I can track my selection progress

**Acceptance Criteria**:
- Apply button state indicates selections exist
- Clear button enabled when selections > 0
- Clear button disabled when selections = 0
- Apply button disabled when selections = 0

---

### US-MP-016: Preserve Selections Across Pages
**As a** data analyst
**I want to** keep my selections when navigating between pages
**So that** I don't lose selections when paginating

**Acceptance Criteria**:
- Selecting items on page 1, then navigating to page 2 preserves page 1 selections
- Returning to page 1 shows checkboxes still checked
- Total selection count includes items from all pages
- Selected items from all pages included when applying

---

## Epic 3: Search Functionality

### US-MP-020: Search for Manufacturer
**As a** data analyst
**I want to** search for a specific manufacturer
**So that** I can quickly find entries for that brand

**Acceptance Criteria**:
- Search input appears above table (in caption)
- Placeholder text: "Search manufacturer or model..."
- Typing triggers server-side search
- Results filtered to matching manufacturers
- Search is case-insensitive

---

### US-MP-021: Search for Model
**As a** data analyst
**I want to** search for a specific model name
**So that** I can find entries containing that model

**Acceptance Criteria**:
- Typing model name in search box filters results
- Server-side search includes model field
- Partial matches returned (e.g., "F-1" matches "F-150")
- Results update after input stops (debounced)

---

### US-MP-022: Clear Search
**As a** data analyst
**I want to** clear my search to see all results again
**So that** I can browse the full dataset

**Acceptance Criteria**:
- Clearing search input restores unfiltered results
- Table reloads with full dataset
- Paginator shows original total count
- Previous selections preserved after clearing search

---

### US-MP-023: Search Resets Pagination
**As a** data analyst
**I want to** return to page 1 when searching
**So that** I see results from the beginning

**Acceptance Criteria**:
- Entering search term resets to page 1
- Paginator shows "Showing 1 to X of Y"
- No blank page if search has fewer results than current page

---

### US-MP-024: Search with No Results
**As a** data analyst
**I want to** see feedback when my search has no matches
**So that** I know to try different terms

**Acceptance Criteria**:
- Empty state displayed when search returns 0 results
- Paginator shows "Showing 0 to 0 of 0 entries"
- Search input remains editable
- Can clear search to restore results

---

## Epic 4: Sorting

### US-MP-030: Sort by Manufacturer Ascending
**As a** data analyst
**I want to** sort by manufacturer name A-Z
**So that** I can find manufacturers alphabetically

**Acceptance Criteria**:
- Click Manufacturer header to sort ascending
- Sort icon shows ascending indicator
- Rows reordered with A at top, Z at bottom
- Server reloads data with sort parameter

---

### US-MP-031: Sort by Manufacturer Descending
**As a** data analyst
**I want to** sort by manufacturer name Z-A
**So that** I can see manufacturers in reverse order

**Acceptance Criteria**:
- Click Manufacturer header again to sort descending
- Sort icon shows descending indicator
- Rows reordered with Z at top, A at bottom
- URL or state reflects sort order

---

### US-MP-032: Sort by Model
**As a** data analyst
**I want to** sort by model name
**So that** I can find models alphabetically

**Acceptance Criteria**:
- Click Model header to sort
- Results sorted by model name
- Toggle between ascending/descending
- Manufacturer grouping not preserved (flat sort)

---

### US-MP-033: Sort by Count
**As a** data analyst
**I want to** sort by vehicle count
**So that** I can see most/least popular combinations

**Acceptance Criteria**:
- Click Count header to sort
- Ascending: lowest count first
- Descending: highest count first
- Useful for finding rare or common combinations

---

### US-MP-034: Sort Preserves Selections
**As a** data analyst
**I want to** keep my selections when sorting
**So that** I don't lose work when reordering

**Acceptance Criteria**:
- Changing sort does not clear selections
- Selected rows still checked after re-sort
- Selection count unchanged after sorting
- Header checkbox reflects correct state

---

## Epic 5: Pagination

### US-MP-040: Navigate to Next Page
**As a** data analyst
**I want to** view the next page of results
**So that** I can see more manufacturer-model combinations

**Acceptance Criteria**:
- Click right arrow or "Next" to advance page
- Table loads next set of rows
- Paginator updates: "Showing 21 to 40 of 881"
- Previous page selections preserved

---

### US-MP-041: Navigate to Previous Page
**As a** data analyst
**I want to** return to the previous page
**So that** I can review earlier results

**Acceptance Criteria**:
- Click left arrow or "Prev" to go back
- Table loads previous set of rows
- Paginator updates accordingly
- Selections on that page still visible

---

### US-MP-042: Jump to Specific Page
**As a** data analyst
**I want to** jump directly to a specific page number
**So that** I can quickly navigate large datasets

**Acceptance Criteria**:
- Page number input or links available in paginator
- Entering page number navigates directly
- Invalid page numbers handled gracefully
- Paginator updates to show current page

---

### US-MP-043: Change Page Size
**As a** data analyst
**I want to** change how many rows display per page
**So that** I can see more or fewer items at once

**Acceptance Criteria**:
- Dropdown shows options: 10, 20, 50, 100
- Selecting option reloads with new page size
- Paginator reflects new page size
- Current page resets to 1 on page size change

---

### US-MP-044: Handle Large Datasets
**As a** data analyst
**I want to** navigate efficiently through 800+ entries
**So that** performance remains acceptable

**Acceptance Criteria**:
- Server-side pagination (only current page loaded)
- Total count from API, not client-side calculation
- Navigation responsive even with large datasets
- No excessive memory usage

---

## Epic 6: Apply and Clear Actions

### US-MP-050: Apply Selections to Filter Data
**As a** data analyst
**I want to** apply my selections as a filter
**So that** the results table shows only matching vehicles

**Acceptance Criteria**:
- Click "Apply" button to apply selections
- URL updates with `modelCombos` parameter
- Format: `modelCombos=Ford:F-150,RAM:OEM Trailer`
- Results table refreshes with filtered data
- Statistics and charts update

---

### US-MP-051: Apply Button Disabled When Empty
**As a** data analyst
**I want to** see Apply disabled when nothing is selected
**So that** I don't accidentally apply empty filter

**Acceptance Criteria**:
- Apply button disabled when selectedItems.length === 0
- Button appears greyed out
- Clicking disabled button has no effect
- Button enables when first selection made

---

### US-MP-052: Clear All Selections
**As a** data analyst
**I want to** clear all my selections at once
**So that** I can start fresh

**Acceptance Criteria**:
- Click "Clear" button to remove all selections
- All checkboxes become unchecked
- Selection count goes to 0
- Emits selection change event with empty selections
- URL parameter removed

---

### US-MP-053: Clear Button Disabled When Empty
**As a** data analyst
**I want to** see Clear disabled when nothing is selected
**So that** the button state reflects the situation

**Acceptance Criteria**:
- Clear button disabled when selectedItems.length === 0
- Button appears greyed out
- Clicking disabled button has no effect
- Button enables when first selection made

---

### US-MP-054: Apply Updates Statistics and Charts
**As a** data analyst
**I want to** see statistics and charts update when I apply selections
**So that** all components reflect my filter

**Acceptance Criteria**:
- Statistics panel shows filtered counts
- Charts show data for selected combinations only
- Results table shows matching vehicles
- All components sync via URL state

---

## Epic 7: URL Synchronization and Persistence

### US-MP-060: Serialize Selections to URL
**As a** data analyst
**I want to** see my selections reflected in the URL
**So that** I can bookmark or share my view

**Acceptance Criteria**:
- Applying selections updates URL parameter
- Format: `?modelCombos=Ford:F-150,Chevrolet:Silverado`
- Multiple selections comma-separated
- Manufacturer:Model colon-delimited pairs

---

### US-MP-061: Restore Selections from URL
**As a** data analyst
**I want to** restore selections when loading from a URL
**So that** bookmarks and shared links work correctly

**Acceptance Criteria**:
- Opening URL with `modelCombos=` parameter restores selections
- Checkboxes appear checked for URL values
- Selections hydrated after data loads
- Works even if selected items on different pages

---

### US-MP-062: Handle URL Hydration Before Data Load
**As a** data analyst
**I want to** see selections restored even if they arrive before data
**So that** the component handles async timing correctly

**Acceptance Criteria**:
- URL parameters stored in `pendingHydration` if data not yet loaded
- Hydration occurs when data arrives
- Selected items matched by key (Manufacturer:Model)
- Items not on current page remain in selectedKeys

---

### US-MP-063: Browser Navigation Updates Selections
**As a** data analyst
**I want to** use browser back/forward to navigate selection history
**So that** I can undo/redo filter changes

**Acceptance Criteria**:
- Browser back removes most recent selection from URL
- Picker checkboxes update to reflect URL state
- Browser forward re-applies selection
- No manual refresh required

---

### US-MP-064: Share Filtered View
**As a** data analyst
**I want to** share my current view with a colleague
**So that** they see the exact same filtered data

**Acceptance Criteria**:
- URL contains all selection state
- Pasting URL in new browser reproduces exact view
- Picker shows correct checkboxes
- Results show filtered data

---

## Epic 8: Pop-Out Window Support

### US-MP-070: Pop Out Picker to Separate Window
**As a** data analyst
**I want to** open the picker in a separate window
**So that** I have more screen space for selections

**Acceptance Criteria**:
- Pop-out button (external-link icon) in panel header
- Clicking opens picker in new browser window
- Main page shows placeholder: "Manufacturer-Model Picker is open in a separate window"
- Pop-out loads picker with current state

---

### US-MP-071: Select Items in Pop-Out Window
**As a** data analyst
**I want to** make selections in the pop-out window
**So that** I can use the extra space for complex selections

**Acceptance Criteria**:
- Pop-out picker is fully functional
- Checkboxes work as expected
- Search and pagination work
- Sorting works

---

### US-MP-072: Apply Selections from Pop-Out
**As a** data analyst
**I want to** apply selections from pop-out and see main window update
**So that** my selections affect the main view

**Acceptance Criteria**:
- Clicking Apply in pop-out sends message to main window
- Main window URL updates with selections
- Main window results table updates
- Message sent via BroadcastChannel

---

### US-MP-073: Sync Main Window Changes to Pop-Out
**As a** data analyst
**I want to** see pop-out update when main window changes
**So that** both windows stay synchronized

**Acceptance Criteria**:
- Main window filter changes broadcast to pop-out
- Pop-out picker hydrates from received state
- Checkboxes update without manual refresh
- STATE_UPDATE messages propagate via BroadcastChannel

---

### US-MP-074: Clear All from Main Window Updates Pop-Out
**As a** data analyst
**I want to** clear selections from main window and see pop-out update
**So that** clear actions sync bidirectionally

**Acceptance Criteria**:
- Clicking "Clear All" in main Query Control clears URL
- Pop-out receives state update
- Pop-out checkboxes become unchecked
- Bug #7 regression: Uses detectChanges() for zone boundary handling

---

### US-MP-075: Close Pop-Out Returns Panel to Main
**As a** data analyst
**I want to** close the pop-out and see the panel return to main window
**So that** I can dock the panel again

**Acceptance Criteria**:
- Closing pop-out window triggers cleanup
- Main window detects pop-out closed
- Placeholder replaced with actual picker
- Selection state preserved in URL

---

## Epic 9: Integration with Other Components

### US-MP-080: Coordinate with Query Control Filters
**As a** data analyst
**I want to** use both Query Control filters and Picker selections together
**So that** I can create complex filter combinations

**Acceptance Criteria**:
- Query Control manufacturer filter AND Picker modelCombos combine (AND logic)
- URL contains both parameters
- Results reflect intersection of both filters
- Either can be removed independently

---

### US-MP-081: Update Results Table on Selection
**As a** data analyst
**I want to** see the results table update when I apply picker selections
**So that** I see matching vehicles

**Acceptance Criteria**:
- Applying picker selections triggers results refresh
- Results show only vehicles matching selected combinations
- Pagination resets to page 1
- Total count reflects filtered results

---

### US-MP-082: Update Charts on Selection
**As a** data analyst
**I want to** see charts update when I apply picker selections
**So that** visualizations reflect filtered data

**Acceptance Criteria**:
- Charts show data for selected combinations only
- Top Models chart reflects filtered subset
- Chart interactivity still works
- Highlight filters still apply within selection

---

### US-MP-083: Update Statistics on Selection
**As a** data analyst
**I want to** see statistics update when I apply picker selections
**So that** I see counts for my filtered data

**Acceptance Criteria**:
- Statistics panel shows filtered totals
- Manufacturer distribution based on selection
- Year distribution based on selection
- Body class distribution based on selection

---

### US-MP-084: Chart Click Adds Picker Selection
**As a** data analyst
**I want to** click a chart bar to add that item to picker selections
**So that** I can filter by clicking visualizations

**Acceptance Criteria**:
- Clicking bar on Top Models chart adds to modelCombos filter
- Picker checkboxes update to reflect chart click
- URL updates with new selection
- Works bidirectionally (chart and picker in sync)

---

## Epic 10: Edge Cases and Error Handling

### US-MP-090: Handle API Error During Load
**As a** data analyst
**I want to** see an error message when data fails to load
**So that** I know the component encountered a problem

**Acceptance Criteria**:
- API error triggers error state
- Error message displayed below table
- Can retry by refreshing page
- No console errors thrown to user

---

### US-MP-091: Handle Network Timeout
**As a** data analyst
**I want to** be notified when requests take too long
**So that** I'm not left waiting indefinitely

**Acceptance Criteria**:
- Slow requests show continued loading state
- Timeout eventually triggers error
- User can retry or refresh
- Loading indicators cleared on timeout

---

### US-MP-092: Handle Invalid URL Parameters
**As a** data analyst
**I want to** gracefully handle malformed URL values
**So that** the app doesn't crash on bad input

**Acceptance Criteria**:
- Invalid modelCombos format doesn't crash component
- Malformed pairs (missing colon) handled gracefully
- Valid portions of URL still applied
- Console warning for invalid values (not error)

---

### US-MP-093: Handle Missing Configuration
**As a** data analyst
**I want to** see a clear error when configuration is missing
**So that** developers know what to fix

**Acceptance Criteria**:
- Missing configId or config throws clear error
- Error message: "BasePickerComponent requires either configId or config input"
- Error visible in console during development
- Production gracefully degrades

---

### US-MP-094: Handle Special Characters in Values
**As a** data analyst
**I want to** filter by values containing special characters
**So that** all manufacturer-model combinations work

**Acceptance Criteria**:
- Values with colons handled (escape or alternate delimiter)
- Values with commas handled
- Values with ampersands handled (e.g., "Ram:OEM Trailer")
- URL encoding/decoding works correctly

---

### US-MP-095: Handle Rapid Selection Changes
**As a** data analyst
**I want to** quickly select/deselect multiple items
**So that** the app keeps up with my actions

**Acceptance Criteria**:
- Rapid checkbox clicks don't cause race conditions
- Final selection state is consistent
- No duplicate items in selection array
- UI reflects accurate state after rapid changes

---

### US-MP-096: Handle Page Navigation During Loading
**As a** data analyst
**I want to** navigate to other pages while data is loading
**So that** the app handles concurrent requests

**Acceptance Criteria**:
- Loading state prevents duplicate requests
- Lazy load events ignored while already loading
- Console debug message for ignored events
- Final state consistent after load completes

---

## Epic 11: Accessibility

### US-MP-100: Keyboard Navigation
**As a** keyboard user
**I want to** navigate the picker without a mouse
**So that** I can use the app accessibly

**Acceptance Criteria**:
- Tab navigates through search, checkboxes, buttons, pagination
- Space/Enter toggles checkbox selection
- Arrow keys navigate within pagination
- Focus indicators visible on all interactive elements

---

### US-MP-101: Screen Reader Support
**As a** screen reader user
**I want to** hear picker information announced
**So that** I understand the component state

**Acceptance Criteria**:
- Table has appropriate ARIA roles
- Checkboxes have accessible labels (Manufacturer: Model)
- Selection count announced on change
- Loading and error states announced

---

### US-MP-102: Focus Management
**As a** keyboard user
**I want to** maintain focus context
**So that** I don't lose my place

**Acceptance Criteria**:
- Focus remains in logical position after actions
- Pagination doesn't jump focus unexpectedly
- After applying, focus returns to appropriate element
- Pop-out opening/closing manages focus appropriately

---

### US-MP-103: Color Contrast
**As a** low-vision user
**I want to** see sufficient color contrast
**So that** I can read the interface

**Acceptance Criteria**:
- Text meets WCAG 4.5:1 contrast ratio
- Checkbox borders visible (2px solid #6b7280)
- Selected checkbox has visible highlight
- Dark theme colors work for visibility

---

## Epic 12: Panel Behavior

### US-MP-110: Collapse Picker Panel
**As a** data analyst
**I want to** collapse the picker panel
**So that** I can save screen space

**Acceptance Criteria**:
- Collapse button (chevron-down icon) in panel header
- Clicking hides table, shows only header
- Collapse state persisted to localStorage
- Restored on page refresh

---

### US-MP-111: Expand Collapsed Panel
**As a** data analyst
**I want to** expand a collapsed panel
**So that** I can access the picker again

**Acceptance Criteria**:
- Expand button (chevron-right icon) shown when collapsed
- Clicking restores full table
- Data may reload if needed
- Selections preserved across collapse/expand

---

### US-MP-112: Drag to Reorder Panels
**As a** data analyst
**I want to** drag the picker panel to a different position
**So that** I can customize my layout

**Acceptance Criteria**:
- Drag handle (bars icon) allows reordering
- Panel can be moved up/down in panel list
- New order persisted to localStorage
- Works with CDK drag-drop

---

### US-MP-113: Panel Title Display
**As a** data analyst
**I want to** see a clear panel title
**So that** I know what this panel contains

**Acceptance Criteria**:
- Title displays: "Manufacturer-Model Picker"
- Title from discover component's getPanelTitle()
- Consistent styling with other panels
- Title visible even when collapsed

---

---

## Summary Statistics

| Epic | Stories | Priority |
|------|---------|----------|
| 1: Table Display and Data Loading | 6 | Critical |
| 2: Row Selection | 7 | Critical |
| 3: Search Functionality | 5 | High |
| 4: Sorting | 5 | High |
| 5: Pagination | 5 | High |
| 6: Apply and Clear Actions | 5 | Critical |
| 7: URL Synchronization | 5 | Critical |
| 8: Pop-Out Window Support | 6 | High |
| 9: Integration with Other Components | 5 | High |
| 10: Edge Cases and Error Handling | 7 | Medium |
| 11: Accessibility | 4 | Medium |
| 12: Panel Behavior | 4 | Medium |
| **Total** | **64** | |

---

## Sources Referenced

- **Component Code**:
  - `frontend/src/framework/components/base-picker/base-picker.component.ts`
  - `frontend/src/framework/components/base-picker/base-picker.component.html`
  - `frontend/src/framework/components/base-picker/base-picker.component.scss`

- **Configuration**:
  - `frontend/src/framework/models/picker-config.interface.ts`
  - `frontend/src/framework/services/picker-config-registry.service.ts`
  - `frontend/src/domain-config/automobile/configs/automobile.picker-configs.ts`

- **Integration Points**:
  - `frontend/src/app/features/discover/discover.component.html`
  - `frontend/src/app/features/discover/discover.component.ts`
  - `frontend/src/app/features/panel-popout/panel-popout.component.ts`

- **Specifications**:
  - `cruft/specs/06-filter-picker-components.md`
  - `docs/POPOUT-ARCHITECTURE.md`

- **E2E Tests**:
  - `frontend/e2e/regression/bug-7-picker-clear.spec.ts`
  - `frontend/e2e/regression/bug-11-picker-count.spec.ts`

---

**Last Updated**: 2026-01-02
