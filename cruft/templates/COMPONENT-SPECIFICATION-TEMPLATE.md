# Component Specification Template

**Component Name**: [Name of the UI component]
**Feature**: [Parent feature from specs/03-discover-feature-specification.md]
**Spec Reference**: [Link to section in specification]
**Last Updated**: [Date]
**Status**: [Draft | In Review | Approved | Implemented]

---

## 1. COMPONENT OVERVIEW

### Purpose
[Brief description of what this component does and why it exists]

### User Story
```
As a [role]
I want to [action]
So that [benefit]
```

### Location in UI
- **Page**: [e.g., Discover Page]
- **Panel**: [e.g., Panel #2 - Model Picker]
- **Position**: [e.g., Below Query Control, Above Results Table]

---

## 2. WIREFRAME

[Insert wireframe image or ASCII diagram]

```
┌─────────────────────────────────────────────────────────┐
│  Panel Title                           [Collapse] [Pop] │
├─────────────────────────────────────────────────────────┤
│  [Search field.................................]  [🔍]  │
├──────┬────────────────────────┬──────────┬──────────────┤
│  ☐   │ Manufacturer           │ Model    │ Count     ↕ │
├──────┼────────────────────────┼──────────┼──────────────┤
│  ☐   │ Ford                   │ F-150    │ 147          │
│  ☑   │ Toyota                 │ Camry    │ 89           │
│  ☐   │ Honda                  │ Accord   │ 72           │
└──────┴────────────────────────┴──────────┴──────────────┘
  [1] [2] [3] ... [12]    Showing 1-20 of 234
```

---

## 3. INPUTS & CONSTRAINTS

### Input Fields

| Field Name | Type | Required | Validation Rules | Default Value | Example |
|------------|------|----------|------------------|---------------|---------|
| Search | Text | No | Max 100 chars, alphanumeric + space | Empty | "Ford" |
| Selection | Checkbox | No | Multiple allowed | None selected | ["Ford:F-150", "Toyota:Camry"] |
| Page | Number | No | Min: 1, Max: totalPages | 1 | 5 |
| Page Size | Dropdown | No | Options: [10, 20, 50, 100] | 20 | 50 |

### URL Parameters

| Parameter | Format | Example | Description |
|-----------|--------|---------|-------------|
| `modelCombos` | Comma-separated `Manufacturer:Model` | `Ford:F-150,Toyota:Camry` | Selected items |
| `page` | Integer | `3` | Current page number |
| `size` | Integer | `50` | Items per page |

---

## 4. USER ACTIONS & RESULTS

### Action 1: Search for Items

**Trigger**: User types in search field
**Debounce**: 300ms
**Validation**: None (accepts any text)
**Result**:
- Table filters to show only rows matching search term
- Search applies to all visible columns (Manufacturer, Model)
- Case-insensitive partial match
- Pagination resets to page 1

**Error Handling**:
- No matches → Show "No results found" message
- API error → Show error toast, keep previous results

---

### Action 2: Select/Deselect Item

**Trigger**: User clicks checkbox in row
**Validation**: None (multiple selections allowed)
**Result**:
- Checkbox toggles checked/unchecked state
- URL updates immediately with new `modelCombos` parameter
- Results table refreshes with filtered data
- Selection persists across pagination

**Error Handling**:
- API error during fetch → Show error toast, revert selection

---

### Action 3: Change Page

**Trigger**: User clicks pagination button
**Validation**: Page number must be between 1 and totalPages
**Result**:
- Table displays new page of data
- URL updates with new `page` parameter
- Selections persist across pages
- Scroll to top of table

**Error Handling**:
- Invalid page number → Clamp to valid range [1, totalPages]

---

### Action 4: Change Page Size

**Trigger**: User selects new value from page size dropdown
**Validation**: Must be one of [10, 20, 50, 100]
**Result**:
- Table re-fetches data with new page size
- Pagination resets to page 1
- URL updates with new `size` parameter
- Total pages recalculated

---

### Action 5: Sort by Column

**Trigger**: User clicks column header
**Validation**: Column must be sortable
**Result**:
- First click: Sort ascending (↑ indicator)
- Second click: Sort descending (↓ indicator)
- Third click: Remove sort (no indicator)
- Table re-renders with sorted data
- Maintains current page and selections

---

## 5. OUTPUT & STATE

### Visual Feedback

| State | Visual Indicator | Example |
|-------|------------------|---------|
| Loading | Spinner overlay on table | [Loading icon] |
| No Data | Empty state message | "No manufacturer-model combinations found" |
| Error | Red error banner | "Failed to load data. Retry?" |
| Selected Rows | Checkbox checked, row highlighted | Row background: #e3f2fd |
| Search Active | Search field border blue | Border: 2px solid #2196f3 |

### Data Output

**Emitted Events**:
```typescript
(selectionChange): {
  selections: ManufacturerModelRow[],  // Array of selected items
  urlValue: string                      // Serialized for URL (e.g., "Ford:F-150,Toyota:Camry")
}
```

**Side Effects**:
1. URL parameter `modelCombos` updated
2. ResourceManagementService.updateFilters() called
3. Results table refreshes with filtered data

---

## 6. ACCEPTANCE CRITERIA (Gherkin)

```gherkin
Feature: Manufacturer-Model Picker
  As a vehicle analyst
  I want to select specific manufacturer-model combinations
  So that I can filter the results table to show only those vehicles

Background:
  Given the user is on the discover page
  And the manufacturer-model picker is loaded
  And the picker shows 234 total items across 12 pages

Scenario: Select single manufacturer-model pair
  When the user clicks the checkbox for "Ford:F-150"
  Then the checkbox should be checked
  And the URL should update to "?modelCombos=Ford:F-150"
  And the results table should refresh
  And the results table should show 147 total results
  And all results should have manufacturer "Ford" and model "F-150"

Scenario: Select multiple manufacturer-model pairs
  When the user clicks the checkbox for "Ford:F-150"
  And the user clicks the checkbox for "Toyota:Camry"
  Then both checkboxes should be checked
  And the URL should update to "?modelCombos=Ford:F-150,Toyota:Camry"
  And the results table should show 236 total results (147 + 89)

Scenario: Deselect item
  Given the user has selected "Ford:F-150" and "Toyota:Camry"
  And the URL contains "?modelCombos=Ford:F-150,Toyota:Camry"
  When the user clicks the checkbox for "Ford:F-150" to deselect
  Then the "Ford:F-150" checkbox should be unchecked
  And the URL should update to "?modelCombos=Toyota:Camry"
  And the results table should show 89 total results

Scenario: Search filters picker items
  When the user types "ford" in the search field
  Then the picker should show only items with "Ford" in manufacturer or model
  And the pagination should reset to page 1
  And the total count should update to match filtered results

Scenario: Search with no matches
  When the user types "zzzzz" in the search field
  Then the picker should show "No results found" message
  And the table should be empty

Scenario: Pagination preserves selections
  Given the user has selected "Ford:F-150" from page 1
  When the user navigates to page 2
  And the user selects "Honda:Accord" from page 2
  And the user navigates back to page 1
  Then the "Ford:F-150" checkbox should still be checked
  And the URL should contain both "Ford:F-150" and "Honda:Accord"

Scenario: Sort by Count column
  When the user clicks the "Count" column header
  Then the picker should sort by count ascending
  And the first row should show the manufacturer-model with lowest count
  When the user clicks the "Count" column header again
  Then the picker should sort by count descending
  And the first row should show the manufacturer-model with highest count

Scenario: Handle API error gracefully
  Given the API returns a 500 error
  When the picker attempts to load data
  Then an error toast should appear with message "Failed to load picker data"
  And the picker should display an error state with retry button
  When the user clicks the retry button
  Then the picker should re-attempt the API call
```

---

## 7. MANUAL TEST CASES

### TC-PICKER-001: Select Single Item

**Priority**: Critical
**Preconditions**:
- User is on `/discover` page
- Picker is loaded with data
- No items currently selected

**Test Data**: Manufacturer: "Ford", Model: "F-150"

| Step | Action | Expected Result | Actual Result | Pass/Fail |
|------|--------|-----------------|---------------|-----------|
| 1 | Locate "Ford:F-150" row in picker | Row is visible | | |
| 2 | Click checkbox in "Ford:F-150" row | Checkbox becomes checked | | |
| 3 | Observe browser URL | URL changes to `?modelCombos=Ford:F-150&page=1&size=20` | | |
| 4 | Observe results table | Table refreshes with loading indicator | | |
| 5 | Wait for results to load | Table shows 147 total results | | |
| 6 | Verify results content | All rows have Manufacturer="Ford", Model="F-150" | | |

**Expected Outcome**: Selection updates URL, filters results table
**Pass Criteria**: All steps show expected results

---

### TC-PICKER-002: Select Multiple Items

**Priority**: Critical
**Preconditions**:
- User is on `/discover` page
- Picker is loaded
- No items selected

**Test Data**:
- Item 1: "Ford:F-150"
- Item 2: "Toyota:Camry"

| Step | Action | Expected Result | Actual Result | Pass/Fail |
|------|--------|-----------------|---------------|-----------|
| 1 | Click checkbox for "Ford:F-150" | Checkbox checked, URL updates | | |
| 2 | Click checkbox for "Toyota:Camry" | Second checkbox checked | | |
| 3 | Check URL | Contains `modelCombos=Ford:F-150,Toyota:Camry` | | |
| 4 | Check results table total | Shows 236 total results (147 + 89) | | |
| 5 | Verify results content | Results contain only Ford F-150 or Toyota Camry | | |

---

### TC-PICKER-003: Search Functionality

**Priority**: High
**Preconditions**: Picker loaded with 234 items

**Test Data**: Search term: "ford"

| Step | Action | Expected Result | Actual Result | Pass/Fail |
|------|--------|-----------------|---------------|-----------|
| 1 | Click search field | Field gains focus, blue border | | |
| 2 | Type "ford" | Text appears in field | | |
| 3 | Wait 300ms (debounce) | Table filters to show only Ford rows | | |
| 4 | Check pagination | Resets to page 1 | | |
| 5 | Check total count | Updates to show filtered count | | |
| 6 | Clear search field | All items reappear | | |

---

### TC-PICKER-004: Pagination

**Priority**: High
**Preconditions**: Picker has 234 items (12 pages at 20/page)

| Step | Action | Expected Result | Actual Result | Pass/Fail |
|------|--------|-----------------|---------------|-----------|
| 1 | Verify initial state | Page 1 of 12, showing items 1-20 | | |
| 2 | Click "Next" button | Advances to page 2, shows items 21-40 | | |
| 3 | Click page "5" button | Jumps to page 5, shows items 81-100 | | |
| 4 | Click "Previous" button | Goes to page 4, shows items 61-80 | | |
| 5 | Select "50" from page size dropdown | Shows 50 items, recalculates to 5 total pages | | |

---

### TC-PICKER-005: Error Handling

**Priority**: Medium
**Preconditions**: None
**Note**: Requires ability to simulate API errors (network throttling or mock server)

| Step | Action | Expected Result | Actual Result | Pass/Fail |
|------|--------|-----------------|---------------|-----------|
| 1 | Simulate 500 error from API | Error toast appears: "Failed to load picker data" | | |
| 2 | Check picker state | Shows error state with retry button | | |
| 3 | Restore API functionality | — | | |
| 4 | Click retry button | Picker reloads data successfully | | |

---

## 8. EDGE CASES & ERROR STATES

### Edge Case 1: Empty Data Set
**Scenario**: API returns 0 results
**Expected Behavior**: Show "No manufacturer-model combinations found" message

### Edge Case 2: Very Long Manufacturer/Model Names
**Scenario**: Names exceed column width
**Expected Behavior**: Text truncates with ellipsis (…), full text on hover

### Edge Case 3: URL Manipulation
**Scenario**: User manually edits URL to invalid `modelCombos` value
**Expected Behavior**: Invalid selections ignored, only valid selections applied

### Edge Case 4: Network Timeout
**Scenario**: API request takes >10 seconds
**Expected Behavior**: Request times out, error toast shown, retry button available

### Edge Case 5: Concurrent Selection Changes
**Scenario**: User rapidly clicks multiple checkboxes
**Expected Behavior**: All selections debounced, final state reflected in URL and results

---

## 9. ACCESSIBILITY (WCAG 2.1 AA)

| Requirement | Implementation | Test Method |
|-------------|----------------|-------------|
| Keyboard Navigation | Tab through checkboxes, Enter to select | Tab through all interactive elements |
| Screen Reader Support | ARIA labels on checkboxes, table headers | Test with NVDA/JAWS |
| Color Contrast | 4.5:1 minimum for text | Use color contrast checker |
| Focus Indicators | Visible focus ring on all interactive elements | Tab through, verify focus visible |

---

## 10. PERFORMANCE CRITERIA

| Metric | Target | Measurement |
|--------|--------|-------------|
| Initial Load | < 1 second | Time to first render |
| Search Debounce | 300ms | Time between keypress and filter |
| Selection Response | < 100ms | Checkbox click → URL update |
| API Call Duration | < 2 seconds | Request → response |
| Re-render Time | < 500ms | State change → UI update |

---

## 11. DEPENDENCIES

### Framework Services
- `PickerConfigRegistry` - Provides picker configuration
- `UrlStateService` - Manages URL parameters
- `ResourceManagementService` - Handles state and data fetching

### Domain Configuration
- `createManufacturerModelPickerConfig()` - Picker config factory
- `ManufacturerModelRow` - Data model interface

### API Endpoints
- `GET /api/specs/v1/manufacturer-model-combinations?page=1&size=20`

### PrimeNG Components
- `<p-table>` - Data table
- `<p-checkbox>` - Selection checkboxes
- `<p-paginator>` - Pagination controls

---

## 12. OPEN QUESTIONS

- [ ] Should selections be limited to a maximum number? (e.g., max 10 selections)
- [ ] Should there be a "Select All" checkbox?
- [ ] Should we show count of selected items in panel header?
- [ ] Should search highlight matching text in results?

---

## 13. REVISION HISTORY

| Date | Version | Author | Changes |
|------|---------|--------|---------|
| 2025-11-22 | 1.0 | [Name] | Initial draft |

---

**End of Component Specification**
