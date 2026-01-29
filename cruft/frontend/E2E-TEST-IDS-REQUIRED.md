# E2E Test-ID Attributes Required

**Purpose**: Document which test-id attributes the E2E tests expect

**Status**: Action needed - Add these to component templates before running tests

---

## Quick Summary

Add these `data-testid` attributes to your component templates:

```html
<!-- Query Control Panel -->
<p-panel [data-testid]="'query-control-panel'">
  <p-dropdown [data-testid]="'filter-field-dropdown'"></p-dropdown>
  <!-- For filter chips, they need close buttons with id pattern -->
  <button [data-testid]="'chip-close-' + filter.field" class="p-chip-remove-icon"></button>
</p-panel>

<!-- Picker Panel -->
<p-panel [data-testid]="'picker-panel'"></p-panel>

<!-- Results Table Panel -->
<p-panel [data-testid]="'results-table-panel'"></p-panel>

<!-- Statistics Panel -->
<p-panel [data-testid]="'statistics-panel'"></p-panel>

<!-- Chart elements (if needed) -->
<p-chart [data-testid]="'chart-' + config.id"></p-chart>
```

---

## Detailed List

### 1. Query Control Panel

**Component**: `src/app/features/discover/panels/query-control/query-control.component.html`

**Required attributes**:
```html
<!-- Main panel container -->
<p-panel [data-testid]="'query-control-panel'">

  <!-- Field selector dropdown -->
  <p-dropdown
    [data-testid]="'filter-field-dropdown'"
    [(ngModel)]="selectedField"
    [options]="filterFields"
    placeholder="Select filter...">
  </p-dropdown>

  <!-- Active filters container -->
  <div [data-testid]="'active-filters'">
    <!-- Each filter chip -->
    <p-chip *ngFor="let filter of activeFilters"
      [label]="filter.label"
      [removable]="true"
      (onRemove)="onRemoveFilter(filter)">

      <!-- Close button - must match pattern for tests -->
      <button [data-testid]="'chip-close-' + filter.field"
        class="p-chip-remove-icon"
        (click)="onRemoveFilter(filter)">
        ×
      </button>
    </p-chip>
  </div>

</p-panel>
```

**Expected test interactions**:
- Click `[data-testid="filter-field-dropdown"]` to open field selector
- Click chip to edit filter
- Click `[data-testid="chip-close-*"]` to remove filter

---

### 2. Picker Panel (Manufacturer-Model)

**Component**: `src/app/features/discover/panels/picker/base-picker.component.html`

**Required attributes**:
```html
<p-panel [data-testid]="'picker-panel'">

  <!-- Table with selections -->
  <p-table [data-testid]="'picker-table'"
    [value]="data"
    selectionMode="checkbox"
    [(selection)]="selectedRows">

    <ng-template pTemplate="header">
      <tr>
        <th>
          <p-tableHeaderCheckbox></p-tableHeaderCheckbox>
        </th>
        <th *ngFor="let col of columns">{{ col.header }}</th>
      </tr>
    </ng-template>
  </p-table>

</p-panel>
```

**Expected test interactions**:
- Verify table is visible
- Future tests will interact with rows/checkboxes

---

### 3. Results Table Panel

**Component**: `src/app/features/discover/panels/results-table/results-table.component.html`

**Required attributes**:
```html
<p-panel [data-testid]="'results-table-panel'">

  <!-- Results table -->
  <p-table [data-testid]="'results-table'"
    [value]="results"
    [paginator]="true"
    [rows]="pageSize"
    [totalRecords]="totalResults">

    <!-- Table definition -->
  </p-table>

</p-panel>
```

**Expected test interactions**:
- Verify table updates when filters change
- Click pagination buttons to test page changes
- PrimeNG paginator status: `.p-paginator-current` (built-in)

---

### 4. Statistics Panel

**Component**: `src/app/features/discover/panels/statistics/statistics-panel.component.html`

**Required attributes**:
```html
<p-panel [data-testid]="'statistics-panel'">

  <!-- Charts container -->
  <div class="charts-grid">

    <!-- Each chart -->
    <p-chart
      *ngFor="let config of chartConfigs"
      [data-testid]="'chart-' + config.id"
      type="bar"
      [data]="chartData[config.id]"
      [options]="config.options"
      (onDataSelect)="onChartClick($event, config.id)">
    </p-chart>

  </div>

</p-panel>
```

**Expected test interactions**:
- Verify panel is visible
- Verify charts exist (uses pattern `[data-testid*="chart"]`)
- Future tests: Click charts to add highlight filters

---

## Alternative: If You Can't Add Test-IDs

If modifying component templates is not possible, the tests can use alternative selectors:

```typescript
// Instead of: page.locator('[data-testid="query-control-panel"]')
// Use: page.locator('p-panel').first()

// Instead of: page.locator('[data-testid="filter-field-dropdown"]')
// Use: page.locator('p-dropdown').first()

// Instead of: page.locator('[data-testid="results-table-panel"]')
// Use: page.locator('p-panel').nth(2)
```

**However**, this approach is fragile and not recommended:
- Depends on DOM order (breaks if layout changes)
- Breaks if PrimeNG version changes selectors
- Makes tests hard to debug

**Recommendation**: Add explicit test-id attributes.

---

## Implementation Steps

1. **Identify component templates** that need test-ids
   - Look for `*.component.html` files mentioned above
   - Search for `<p-panel>` elements

2. **Add data-testid attributes** to main containers
   ```html
   <p-panel [data-testid]="'query-control-panel'">
   ```

3. **Add test-id to interactive elements**
   - Dropdowns: `[data-testid]="'filter-field-dropdown'"`
   - Chips/buttons: `[data-testid]="'chip-close-' + fieldName"`
   - Tables: `[data-testid]="'results-table'"`
   - Charts: `[data-testid]="'chart-' + chartId"`

4. **Run tests** to verify
   ```bash
   npm run test:e2e
   ```

5. **Adjust as needed** if test fails to find elements

---

## Why Test-IDs?

✅ **Stability**: Don't break when CSS changes
✅ **Clarity**: Express intent - "this element is tested"
✅ **Performance**: Faster queries than complex CSS selectors
✅ **Maintainability**: Self-documenting what's being tested
✅ **Accessibility**: Optional - doesn't affect users (hidden attribute)

---

## Best Practices

```html
<!-- ✅ GOOD: Descriptive test-id with semantic naming -->
<p-panel [data-testid]="'query-control-panel'">
<button [data-testid]="'chip-close-manufacturer'">

<!-- ❌ BAD: Vague or positional naming -->
<p-panel [data-testid]="'panel1'">
<button [data-testid]="'btn-5'">

<!-- ✅ GOOD: Dynamic test-ids with context -->
<button *ngFor="let filter of filters"
  [data-testid]="'chip-close-' + filter.field">

<!-- ❌ BAD: Hardcoded indices -->
<button [data-testid]="'chip-close-0'">
```

---

## Testing the Test-IDs

Once added, verify they exist:

```typescript
test('verify test-ids exist', async ({ page }) => {
  await page.goto('/discover');

  // Should find all expected test-id elements
  await expect(page.locator('[data-testid="query-control-panel"]')).toBeVisible();
  await expect(page.locator('[data-testid="filter-field-dropdown"]')).toBeVisible();
  await expect(page.locator('[data-testid="picker-panel"]')).toBeVisible();
  await expect(page.locator('[data-testid="results-table-panel"]')).toBeVisible();
  await expect(page.locator('[data-testid="statistics-panel"]')).toBeVisible();
});
```

---

## Files to Modify

Priority order:
1. `frontend/src/app/features/discover/panels/query-control/query-control.component.html`
2. `frontend/src/app/features/discover/panels/results-table/results-table.component.html`
3. `frontend/src/app/features/discover/panels/statistics/statistics-panel.component.html`
4. `frontend/src/app/features/discover/panels/picker/base-picker.component.html`

---

**Document Version**: 1.0
**Last Updated**: 2025-12-05
**Related**: [E2E-TEST-SETUP.md](E2E-TEST-SETUP.md)
