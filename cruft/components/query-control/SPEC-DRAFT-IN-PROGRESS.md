# Query Control Component Specification (DRAFT - IN PROGRESS)

**Status**: 🚧 Gathering Requirements from Screenshots
**Date Started**: 2025-11-22
**Component**: Query Control Panel (Panel #1 from specs/03-discover-feature-specification.md)
**Based On**: Prior implementation screenshots

---

## OBSERVATIONS FROM SCREENSHOTS

### Screenshot 1 - Panel Collapsed View

**Panel Header:**
- Title: "Query Control"
- Collapse button: (—) on right side
- Collapsible panel component

**Filter Selection Dropdown:**
- Label: "Add filter by field..."
- Dropdown control (▼ icon)
- Triggers field selection process

**Active Filters Display:**
- Section label: "Active Filters:"
- Filter chips displayed horizontally
- Each chip format: `FieldName: value(s)` with remove button (⊗)

**Example Active Filters:**
- "Manufacturer: Buick" ⊗
- "Model: Cascada, Century, Coachbuilder" ⊗
  - Multi-value filters show comma-separated values

---

### Screenshot 2 - Dropdown Expanded (Field Selection)

**Dropdown Opened:**
- Search box at top of dropdown
  - Placeholder: (visible search icon)
  - Purpose: Filter the list of available fields

**Available Filter Fields (Visible):**
1. Manufacturer
2. Model
3. Year
4. Body Class
5. Data Source (partially visible, list continues)

**UI Details:**
- Scrollable list (scrollbar visible on right)
- Clean list layout
- Clicking a field opens the corresponding filter dialog

---

### Screenshot 3 - Body Class Filter Dialog (Modal)

**Dialog Structure:**

**Header:**
- Title: "Select Body Classes"
- Close button: (⊗) top right corner

**Instructions:**
- Subtitle: "Select one or more body classes to filter results."

**Search Box:**
- Input field with placeholder: "Type to search body classes..."
- Magnifying glass icon (🔍)
- Purpose: Filter long lists of options

**Selection Area:**
- Large scrollable area (white background)
- Presumably contains checkboxes for each body class option
- Scrollbar visible (list is scrollable)

**Action Buttons (Bottom):**
- **Cancel** (blue button, left) - Discard changes, close dialog
- **Apply** (red button, right) - Apply selections, close dialog, update URL

**Background (Visible Behind Modal):**
- Shows Query Control panel with active filters
- "Manufacturer: Buick" chip visible
- "Body Class" chip shows with both:
  - Remove button (X)
  - Dropdown arrow (▼) - suggests ability to re-edit filter
- "Model Picker (Single)" panel visible below
- "3 Items selected" status shown

---

## INFERRED BEHAVIOR (From Screenshots)

### User Flow 1: Add New Filter

```
1. User clicks "Add filter by field..." dropdown
   → Dropdown expands showing available fields with search

2. User optionally types in search box to narrow field list
   → List filters to matching fields

3. User clicks desired field (e.g., "Body Class")
   → Modal dialog opens for that specific filter type

4. Dialog shows:
   - Title specific to field
   - Instructions
   - Search box (for filtering options)
   - Selection UI (checkboxes for multiselect)
   - Cancel/Apply buttons

5. User makes selections in dialog
   - Can search to narrow options
   - Selects one or more items (checkboxes)

6. User clicks "Apply"
   → Dialog closes
   → New filter chip appears in Active Filters section
   → URL updates with new filter parameter
   → Results table refreshes with filtered data

7. User clicks "Cancel"
   → Dialog closes
   → No changes applied
```

### User Flow 2: Remove Filter

```
1. User sees active filter chip (e.g., "Manufacturer: Buick ⊗")

2. User clicks the X (⊗) button
   → Filter chip disappears
   → URL parameter removed
   → Results table refreshes with filter removed
```

### User Flow 3: Edit Existing Filter (Inferred)

```
1. User sees active filter chip with dropdown arrow (▼)

2. User clicks the dropdown arrow or chip itself
   → Filter dialog re-opens with current selections pre-checked

3. User modifies selections
   → Adds or removes items

4. User clicks "Apply"
   → Chip updates with new values
   → URL updates
   → Results table refreshes
```

---

## FILTER TYPES IDENTIFIED

### 1. Multiselect Filters (Confirmed)

**Examples**: Manufacturer, Model, Body Class, Data Source

**Dialog UI:**
- Title: "Select [Field Name]s" (plural)
- Search box for filtering options
- Checkbox list (scrollable)
- Cancel/Apply buttons

**URL Format**: Comma-separated values
- Example: `?manufacturer=Ford,Toyota,Honda`
- Example: `?bodyClass=Sedan,SUV,Pickup`

**Chip Display**: Shows all selected values comma-separated
- Example: "Model: Cascada, Century, Coachbuilder"

---

### 2. Range Filters (NEEDS CONFIRMATION)

**Expected for**: Year, Mileage, Value

**Expected Dialog UI** (not yet seen):
- Title: "Select [Field Name] Range"
- Min field: "Minimum [field]"
- Max field: "Maximum [field]"
- Validation: Min <= Max
- Cancel/Apply buttons

**Expected URL Format**: Separate min/max parameters
- Example: `?yearMin=2020&yearMax=2024`

**Expected Chip Display**: Shows range
- Example: "Year: 2020-2024"

**🚨 NEED SCREENSHOT**: Year filter dialog to confirm

---

## QUESTIONS REMAINING

### Critical Questions:

1. **Complete Field List**: What are ALL available filter fields?
   - Seen: Manufacturer, Model, Year, Body Class, Data Source
   - Possible: Mileage?, Value?, VIN?, Color?, Registered State?
   - **ACTION**: Scroll dropdown to see complete list

2. **Year Filter Type**: Range or multiselect?
   - **ACTION**: Screenshot of Year filter dialog

3. **Populated Checkbox List**: What do the body class options look like?
   - **ACTION**: Screenshot showing checkbox list with options

4. **Edit Filter Behavior**: Does clicking dropdown arrow on chip re-open dialog?
   - **ACTION**: Screenshot of clicking chip's dropdown arrow

5. **Clear All Button**: Is there a "Clear All Filters" option?
   - **ACTION**: Look for clear all button in panel

6. **Maximum Selections**: Any limit on number of items per filter?
   - Probably no limit for multiselect

7. **Empty State**: What shows when no filters are active?
   - Probably just the "Add filter by field..." dropdown

8. **Filter Persistence**: Do filters persist across page refreshes?
   - Yes (because URL-first architecture)

9. **Validation**: What happens with invalid filter values in URL?
   - Probably ignored or show error

---

## TECHNICAL DETAILS (Inferred from Project Architecture)

### Filter-URL Mapping (from automobile domain)

**Known URL Parameters** (from `automobile-url-mapper.ts`):
- `modelCombos` - From picker (Manufacturer:Model pairs)
- `manufacturer` - From query control filter
- `model` - From query control filter
- `yearMin`, `yearMax` - Range filter
- `bodyClass` - Multiselect filter
- `dataSource` - Multiselect filter
- `page`, `size` - Pagination

**Potential Additional Parameters** (from API docs):
- `mileageMin`, `mileageMax` - Range
- `valueMin`, `valueMax` - Range
- `vin` - Text search
- `conditionDescription` - Multiselect?
- `registeredState` - Multiselect?
- `exteriorColor` - Multiselect?

### Component Dependencies

**Framework Services:**
- `ResourceManagementService` - State management
- `UrlStateService` - URL synchronization
- `ApiService` - Fetch filter options

**Domain Configuration:**
- `FilterDefinition<T>` - Filter metadata
- `AutoSearchFilters` - Filter model
- `AutomobileUrlMapper` - Serialization/deserialization

**PrimeNG Components:**
- `<p-dropdown>` - Field selection
- `<p-dialog>` - Filter modal
- `<p-checkbox>` - Multiselect options
- `<p-button>` - Cancel/Apply buttons
- `<p-chip>` - Active filter chips (or custom chip)

---

## INPUTS & CONSTRAINTS (Preliminary)

### Filter Field Selection Dropdown

| Field | Type | Required | Validation | Default |
|-------|------|----------|------------|---------|
| Selected Field | Dropdown | No | Must be valid field from list | Empty |
| Search Query | Text | No | Max 100 chars | Empty |

### Multiselect Filter Dialog (e.g., Body Class)

| Field | Type | Required | Validation | Default |
|-------|------|----------|------------|---------|
| Search | Text | No | Max 100 chars | Empty |
| Selections | Checkbox[] | No | At least 1 for Apply to work | None |

### Range Filter Dialog (e.g., Year) - NOT YET CONFIRMED

| Field | Type | Required | Validation | Default |
|-------|------|----------|------------|---------|
| Min Value | Number | No | Must be <= Max | Empty |
| Max Value | Number | No | Must be >= Min | Empty |

---

## USER ACTIONS & RESULTS (Preliminary)

### Action 1: Open Field Selection Dropdown

**Trigger**: User clicks "Add filter by field..." dropdown
**Result**:
- Dropdown expands
- Shows list of available fields
- Search box allows filtering field list
- User can select a field to open its dialog

**Error Handling**: None (always works)

---

### Action 2: Search for Field in Dropdown

**Trigger**: User types in search box within dropdown
**Validation**: None
**Result**:
- Field list filters to show only matching fields
- Case-insensitive partial match
- Instant filtering (no debounce visible)

**Error Handling**:
- No matches → Show empty list or "No fields found" message

---

### Action 3: Select Field to Filter

**Trigger**: User clicks field name in dropdown (e.g., "Body Class")
**Result**:
- Dropdown closes
- Appropriate filter dialog opens (modal)
- Dialog pre-loads available options from API
- Loading state shown if API call in progress

**Error Handling**:
- API error → Show error message in dialog with retry option

---

### Action 4: Search Options in Filter Dialog

**Trigger**: User types in search box within dialog
**Debounce**: Probably 300ms
**Result**:
- Checkbox list filters to show only matching options
- Case-insensitive partial match
- Maintains current selections while filtering

---

### Action 5: Select/Deselect Options in Dialog

**Trigger**: User clicks checkboxes
**Validation**: None (multiple allowed)
**Result**:
- Checkbox toggles state
- Selection count may update
- Apply button remains enabled (even with 0 selections?)

---

### Action 6: Apply Filter from Dialog

**Trigger**: User clicks "Apply" button
**Validation**:
- At least 1 item selected? (TBD)
- Or allow empty to effectively "clear" filter?

**Result**:
- Dialog closes
- New filter chip appears in Active Filters section
- URL updates with new parameter
- Results table refreshes with filtered data
- If filter already exists, updates values

**Error Handling**:
- API error during refresh → Show error toast, keep filter chip

---

### Action 7: Cancel Filter Dialog

**Trigger**: User clicks "Cancel" button or X in dialog corner
**Result**:
- Dialog closes
- No changes applied
- URL unchanged
- Results unchanged

---

### Action 8: Remove Filter via Chip

**Trigger**: User clicks X (⊗) button on filter chip
**Result**:
- Chip disappears immediately
- URL parameter removed
- Results table refreshes without that filter

**Error Handling**:
- API error during refresh → Show error toast, chip already removed

---

### Action 9: Edit Existing Filter (Inferred - NEEDS CONFIRMATION)

**Trigger**: User clicks dropdown arrow (▼) on filter chip
**Result**:
- Filter dialog re-opens
- Current selections pre-checked
- User can modify selections
- Apply updates, Cancel discards changes

**🚨 NEED CONFIRMATION**: Screenshot of this interaction

---

## OUTPUTS & STATE

### Visual States

| State | Visual Indicator |
|-------|------------------|
| No Filters Active | Only "Add filter by field..." dropdown visible |
| Filters Active | Chip(s) displayed in "Active Filters:" section |
| Dialog Loading Options | Loading spinner in dialog |
| Dialog Error | Error message with retry button |
| Search Active (Dropdown) | Filtered field list |
| Search Active (Dialog) | Filtered checkbox list |

### Data Output

**Side Effects**:
1. URL parameters updated (via `UrlStateService`)
2. `ResourceManagementService.updateFilters()` called
3. Results table refreshes with filtered data
4. Statistics update to reflect filtered subset

**State Persistence**:
- Filters stored in URL (shareable, bookmarkable)
- Filters restored from URL on page load
- localStorage NOT used (URL is source of truth)

---

## NEXT STEPS TO COMPLETE SPEC

### Screenshots Needed:

1. ✅ Panel collapsed view (HAVE)
2. ✅ Dropdown expanded (HAVE)
3. ✅ Body Class filter dialog (HAVE)
4. ❌ **Body Class options populated** - Show checkbox list with actual options
5. ❌ **Year filter dialog** - Confirm if range or multiselect
6. ❌ **Complete field list** - Scroll dropdown to see all available fields
7. ❌ **Edit filter behavior** - Click dropdown arrow on active chip
8. ❌ **Clear All button** - If it exists
9. ❌ **Multiple active filters** - Show several chips at once
10. ❌ **Empty state** - No filters active

### Information Needed:

- Complete list of filterable fields
- Filter type for each field (multiselect vs range vs text)
- Validation rules for each filter type
- API endpoints for fetching filter options
- Maximum selection limits (if any)
- Error messages and error handling behavior

---

## PRELIMINARY ACCEPTANCE CRITERIA (Gherkin - DRAFT)

```gherkin
Feature: Query Control Panel
  As a vehicle analyst
  I want to add, edit, and remove filters manually
  So that I can refine my search beyond picker selections

Background:
  Given the user is on the discover page
  And the Query Control panel is visible

Scenario: Add multiselect filter (Body Class)
  When the user clicks "Add filter by field..." dropdown
  Then the dropdown should expand showing available fields
  When the user clicks "Body Class" from the list
  Then the "Select Body Classes" dialog should open
  When the user checks "Sedan" and "SUV"
  And the user clicks "Apply"
  Then the dialog should close
  And a chip "Body Class: Sedan, SUV" should appear in Active Filters
  And the URL should contain "?bodyClass=Sedan,SUV"
  And the results table should refresh showing only Sedans and SUVs

Scenario: Remove filter via chip
  Given the user has an active filter "Manufacturer: Ford"
  When the user clicks the X button on the "Manufacturer: Ford" chip
  Then the chip should disappear
  And the URL should no longer contain "manufacturer=Ford"
  And the results table should refresh showing all manufacturers

Scenario: Search for field in dropdown
  When the user clicks "Add filter by field..." dropdown
  And the user types "body" in the search box
  Then only "Body Class" should be visible in the list
  And other fields should be hidden

Scenario: Search for options in filter dialog
  Given the user has opened the "Body Class" filter dialog
  When the user types "suv" in the search box
  Then only body class options containing "SUV" should be visible
  And the user's current selections should remain checked

Scenario: Cancel filter dialog
  Given the user has opened the "Body Class" filter dialog
  And the user has checked "Sedan" and "SUV"
  When the user clicks "Cancel"
  Then the dialog should close
  And no new filter chip should appear
  And the URL should be unchanged

# MORE SCENARIOS TO ADD AFTER CONFIRMING BEHAVIOR:
# - Edit existing filter
# - Range filter (Year)
# - Clear all filters
# - Maximum selections
# - API errors
```

---

## OPEN QUESTIONS FOR USER

1. Can you show the checkbox list populated with actual body class options?
2. What does the Year filter dialog look like?
3. What happens when you click the dropdown arrow on an active filter chip?
4. What are ALL the available filter fields in the dropdown?
5. Is there a "Clear All Filters" button?
6. How does this Query Control interact with the Manufacturer-Model Picker?
   - Are they additive (both filters apply)?
   - Are they mutually exclusive?
   - Can you have both Manufacturer filter and modelCombos from picker?

---

**End of Draft Specification (In Progress)**

**Last Updated**: 2025-11-22
**Next**: Awaiting additional screenshots to complete specification
