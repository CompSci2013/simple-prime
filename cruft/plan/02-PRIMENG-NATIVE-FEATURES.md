# PrimeNG Table Native Features
## Comprehensive Capability Reference

**Date**: 2025-11-20
**PrimeNG Version**: 14.2.3 (compatible with Angular 14)
**Official Docs**: https://primeng.org/table

---

## Overview

This document catalogs **all the features PrimeNG Table provides natively** that eliminate the need for custom code.

**Key Insight**: Almost everything needed for a data table is already built into `<p-table>`.

---

## 1. Core Table Features

### Basic Table

```html
<p-table [value]="data">
  <ng-template pTemplate="header">
    <tr>
      <th>Name</th>
      <th>Age</th>
    </tr>
  </ng-template>

  <ng-template pTemplate="body" let-item>
    <tr>
      <td>{{item.name}}</td>
      <td>{{item.age}}</td>
    </tr>
  </ng-template>
</p-table>
```

**Built-in**:
- Automatic rendering of rows
- Template-driven column definitions
- Type-safe with generics
- Change detection optimized

---

## 2. Pagination

### Attributes

```html
<p-table
  [value]="data"
  [paginator]="true"
  [rows]="20"
  [rowsPerPageOptions]="[10, 20, 50, 100]"
  [totalRecords]="totalRecords"
  [showCurrentPageReport]="true"
  currentPageReportTemplate="Showing {first} to {last} of {totalRecords} entries">
</p-table>
```

**Features**:
- ✅ Client-side pagination (automatic)
- ✅ Server-side pagination (with `[lazy]="true"`)
- ✅ Rows per page dropdown
- ✅ Page report template customization
- ✅ First/last/prev/next buttons
- ✅ Page links
- ✅ Jump to page

**No custom code needed for pagination!**

---

## 3. Sorting

### Single Column Sorting

```html
<p-table [value]="data">
  <ng-template pTemplate="header">
    <tr>
      <th [pSortableColumn]="'name'">
        Name
        <p-sortIcon [field]="'name'"></p-sortIcon>
      </th>
      <th [pSortableColumn]="'age'">
        Age
        <p-sortIcon [field]="'age'"></p-sortIcon>
      </th>
    </tr>
  </ng-template>
</p-table>
```

### Multi-Column Sorting

```html
<p-table
  [value]="data"
  sortMode="multiple">
  <!-- Ctrl+Click to multi-sort -->
</p-table>
```

### Custom Sort

```html
<p-table
  [value]="data"
  [customSort]="true"
  (onSort)="customSort($event)">
</p-table>
```

**Features**:
- ✅ Ascending/descending toggle
- ✅ Sort icons
- ✅ Multi-column sort (Ctrl+Click)
- ✅ Custom sort functions
- ✅ Unsorted state
- ✅ Server-side sort (lazy mode)

---

## 4. Filtering

### Column Filters

```html
<p-table [value]="data">
  <ng-template pTemplate="header">
    <tr>
      <!-- Text filter -->
      <th>
        Name
        <p-columnFilter type="text" field="name"></p-columnFilter>
      </th>

      <!-- Numeric filter -->
      <th>
        Age
        <p-columnFilter type="numeric" field="age"></p-columnFilter>
      </th>

      <!-- Date filter -->
      <th>
        Birthday
        <p-columnFilter type="date" field="birthday"></p-columnFilter>
      </th>

      <!-- Dropdown filter -->
      <th>
        Status
        <p-columnFilter field="status" matchMode="equals" [showMenu]="false">
          <ng-template pTemplate="filter" let-value let-filter="filterCallback">
            <p-dropdown
              [ngModel]="value"
              [options]="statuses"
              (onChange)="filter($event.value)">
            </p-dropdown>
          </ng-template>
        </p-columnFilter>
      </th>
    </tr>
  </ng-template>
</p-table>
```

### Global Filter

```html
<input
  pInputText
  type="text"
  (input)="dt.filterGlobal($any($event.target).value, 'contains')"
  placeholder="Global Search" />

<p-table #dt [value]="data" [globalFilterFields]="['name','status']">
</p-table>
```

### Filter Match Modes

```typescript
// Built-in match modes:
- 'startsWith'
- 'contains'
- 'endsWith'
- 'equals'
- 'notEquals'
- 'in'
- 'lt' (less than)
- 'lte' (less than or equal)
- 'gt' (greater than)
- 'gte' (greater than or equal)
- 'between'
- 'dateIs'
- 'dateIsNot'
- 'dateBefore'
- 'dateAfter'
```

**Features**:
- ✅ Column-specific filters
- ✅ Global filter
- ✅ Filter menu with operators
- ✅ Multiple match modes
- ✅ Custom filter templates
- ✅ Filter constraints (AND/OR)
- ✅ Debouncing built-in
- ✅ Clear filter button

**No custom filter infrastructure needed!**

---

## 5. Selection

### Single Selection

```html
<p-table
  [value]="data"
  [(selection)]="selectedItem"
  selectionMode="single">
</p-table>
```

### Multiple Selection

```html
<p-table
  [value]="data"
  [(selection)]="selectedItems"
  selectionMode="multiple">
  <ng-template pTemplate="header">
    <tr>
      <th style="width: 3rem">
        <p-tableHeaderCheckbox></p-tableHeaderCheckbox>
      </th>
      <!-- columns -->
    </tr>
  </ng-template>
  <ng-template pTemplate="body" let-item>
    <tr>
      <td>
        <p-tableCheckbox [value]="item"></p-tableCheckbox>
      </td>
      <!-- cells -->
    </tr>
  </ng-template>
</p-table>
```

**Features**:
- ✅ Single selection
- ✅ Multiple selection
- ✅ Checkbox selection
- ✅ Select all checkbox
- ✅ Radio button selection
- ✅ Row click selection
- ✅ Programmatic selection

---

## 6. Row Expansion

### Basic Expansion

```html
<p-table
  [value]="data"
  dataKey="id"
  [(expandedRowKeys)]="expandedRows">

  <ng-template pTemplate="body" let-rowData let-expanded="expanded">
    <tr>
      <td>
        <button
          type="button"
          pButton
          pRipple
          [pRowToggler]="rowData"
          [icon]="expanded ? 'pi pi-chevron-down' : 'pi pi-chevron-right'">
        </button>
      </td>
      <td>{{rowData.name}}</td>
    </tr>
  </ng-template>

  <ng-template pTemplate="rowexpansion" let-rowData>
    <tr>
      <td colspan="2">
        <!-- Expanded content here -->
        <div>Details for {{rowData.name}}</div>
      </td>
    </tr>
  </ng-template>
</p-table>
```

**Component**:
```typescript
expandedRows: {[key: string]: boolean} = {};
```

**Features**:
- ✅ Expand/collapse rows
- ✅ Track expansion state
- ✅ Custom expansion content
- ✅ Programmatic expand/collapse
- ✅ Persist expansion in state
- ✅ `dataKey` for unique identification

**No manual expansion tracking needed!**

---

## 7. Column Reordering

### Enable Reordering

```html
<p-table
  [value]="data"
  [reorderableColumns]="true">

  <ng-template pTemplate="header">
    <tr>
      <th *ngFor="let col of columns" [pReorderableColumn]="col.field">
        {{col.header}}
      </th>
    </tr>
  </ng-template>
</p-table>
```

**Features**:
- ✅ Drag-drop column reordering
- ✅ Visual feedback during drag
- ✅ `(onColReorder)` event
- ✅ Disable reorder per column
- ✅ Save order in state

**No custom drag-drop logic needed!**

---

## 8. Column Resizing

```html
<p-table
  [value]="data"
  [resizableColumns]="true"
  columnResizeMode="expand">

  <ng-template pTemplate="header">
    <tr>
      <th *ngFor="let col of columns" [pResizableColumn]="col.field">
        {{col.header}}
      </th>
    </tr>
  </ng-template>
</p-table>
```

**Modes**:
- `expand` - Table width expands/contracts
- `fit` - Columns fit to table width

**Features**:
- ✅ Drag column borders to resize
- ✅ Min/max width constraints
- ✅ Resize event
- ✅ Persist widths in state

---

## 9. Column Toggle (Show/Hide)

### Using MultiSelect

```html
<p-multiSelect
  [options]="columns"
  [(ngModel)]="selectedColumns"
  optionLabel="header"
  placeholder="Choose Columns">
</p-multiSelect>

<p-table [value]="data">
  <ng-template pTemplate="header">
    <tr>
      <th *ngFor="let col of selectedColumns">
        {{col.header}}
      </th>
    </tr>
  </ng-template>
  <ng-template pTemplate="body" let-item>
    <tr>
      <td *ngFor="let col of selectedColumns">
        {{item[col.field]}}
      </td>
    </tr>
  </ng-template>
</p-table>
```

**Component**:
```typescript
columns = [
  { field: 'name', header: 'Name' },
  { field: 'age', header: 'Age' },
  { field: 'status', header: 'Status' }
];

selectedColumns = this.columns; // All visible by default
```

**Features**:
- ✅ MultiSelect UI for column toggle
- ✅ Persists in table state
- ✅ Dynamic column visibility

**No custom column manager needed!**

---

## 10. State Management

### Local Storage Persistence

```html
<p-table
  [value]="data"
  stateStorage="local"
  stateKey="my-table-state">
</p-table>
```

**What Gets Saved Automatically**:
- ✅ Page number
- ✅ Rows per page
- ✅ Sort field
- ✅ Sort order
- ✅ Multi-sort state
- ✅ Filter values
- ✅ Column order
- ✅ Column widths
- ✅ Selection
- ✅ Expanded rows

### Session Storage

```html
<p-table stateStorage="session" stateKey="my-table">
</p-table>
```

### Custom State

```html
<p-table
  [(stateStorage)]="customState"
  (onStateSave)="onStateSave($event)"
  (onStateRestore)="onStateRestore($event)">
</p-table>
```

**Features**:
- ✅ One attribute enables state
- ✅ localStorage or sessionStorage
- ✅ Custom state management
- ✅ State save/restore events
- ✅ Comprehensive state coverage

**No custom state persistence needed!**

---

## 11. Lazy Loading (Server-Side Data)

```html
<p-table
  [value]="data"
  [lazy]="true"
  [totalRecords]="totalRecords"
  [loading]="loading"
  (onLazyLoad)="loadData($event)">
</p-table>
```

**Component**:
```typescript
loadData(event: LazyLoadEvent): void {
  this.loading = true;

  // event.first = First row offset
  // event.rows = Number of rows per page
  // event.sortField = Sort field
  // event.sortOrder = Sort order (1 or -1)
  // event.filters = Filter values

  this.apiService.getData({
    page: event.first / event.rows,
    size: event.rows,
    sortField: event.sortField,
    sortOrder: event.sortOrder,
    filters: event.filters
  }).subscribe(response => {
    this.data = response.data;
    this.totalRecords = response.total;
    this.loading = false;
  });
}
```

**Features**:
- ✅ Server-side pagination
- ✅ Server-side sorting
- ✅ Server-side filtering
- ✅ Loading indicator
- ✅ One event for all operations

---

## 12. Virtual Scrolling

```html
<p-table
  [value]="data"
  [scrollable]="true"
  [scrollHeight]="'400px'"
  [virtualScroll]="true"
  [virtualScrollItemSize]="50">
</p-table>
```

**Features**:
- ✅ Render only visible rows
- ✅ Handle thousands of rows
- ✅ Smooth scrolling
- ✅ Lazy load on scroll

**Use Case**: Large datasets (10,000+ rows)

---

## 13. Responsive Table

### Responsive Scroll

```html
<p-table
  [value]="data"
  [scrollable]="true"
  responsiveLayout="scroll">
</p-table>
```

### Responsive Stack

```html
<p-table
  [value]="data"
  responsiveLayout="stack"
  [breakpoint]="'960px'">
</p-table>
```

**Features**:
- ✅ Mobile-friendly
- ✅ Horizontal scroll on small screens
- ✅ Stacked layout mode
- ✅ Custom breakpoints

---

## 14. Row Grouping

```html
<p-table
  [value]="data"
  [rowGroupMode]="'subheader'"
  groupRowsBy="category">

  <ng-template pTemplate="groupheader" let-rowData>
    <tr>
      <td colspan="3">
        <strong>{{rowData.category}}</strong>
      </td>
    </tr>
  </ng-template>

  <ng-template pTemplate="body" let-rowData>
    <tr>
      <td>{{rowData.name}}</td>
      <td>{{rowData.price}}</td>
    </tr>
  </ng-template>
</p-table>
```

**Modes**:
- `subheader` - Group header row
- `rowspan` - Rowspan for first column

---

## 15. Frozen Columns

```html
<p-table [value]="data" [frozenColumns]="frozenCols" [scrollable]="true">
  <ng-template pTemplate="frozenbody" let-item>
    <tr>
      <td>{{item.id}}</td>
    </tr>
  </ng-template>
  <ng-template pTemplate="body" let-item>
    <tr>
      <td>{{item.name}}</td>
      <td>{{item.status}}</td>
    </tr>
  </ng-template>
</p-table>
```

**Features**:
- ✅ Freeze left columns
- ✅ Horizontal scroll
- ✅ Sticky column headers

---

## 16. Row Editing

### Cell Editing

```html
<p-table [value]="data" dataKey="id">
  <ng-template pTemplate="body" let-rowData let-editing="editing" let-ri="rowIndex">
    <tr [pEditableRow]="rowData">
      <td pEditableColumn>
        <p-cellEditor>
          <ng-template pTemplate="input">
            <input pInputText type="text" [(ngModel)]="rowData.name">
          </ng-template>
          <ng-template pTemplate="output">
            {{rowData.name}}
          </ng-template>
        </p-cellEditor>
      </td>
      <td>
        <button pButton pInitEditableRow icon="pi pi-pencil"></button>
        <button pButton pSaveEditableRow icon="pi pi-check"></button>
        <button pButton pCancelEditableRow icon="pi pi-times"></button>
      </td>
    </tr>
  </ng-template>
</p-table>
```

**Features**:
- ✅ Inline cell editing
- ✅ Row editing mode
- ✅ Save/cancel edit
- ✅ Edit validation

---

## 17. Export

```html
<p-table #dt [value]="data">
  <!-- table content -->
</p-table>

<button (click)="dt.exportCSV()">Export CSV</button>
```

**Features**:
- ✅ Export to CSV
- ✅ Export selected rows
- ✅ Custom export

---

## 18. Context Menu

```html
<p-table
  [value]="data"
  [(contextMenuSelection)]="selectedItem"
  [contextMenu]="cm">
</p-table>

<p-contextMenu #cm [model]="menuItems"></p-contextMenu>
```

**Features**:
- ✅ Right-click menu
- ✅ Row-specific actions
- ✅ PrimeNG Menu integration

---

## 19. Loading State

```html
<p-table [value]="data" [loading]="loading">
  <ng-template pTemplate="emptymessage">
    <tr>
      <td colspan="3">No data found.</td>
    </tr>
  </ng-template>
</p-table>
```

**Features**:
- ✅ Loading spinner overlay
- ✅ Empty message template
- ✅ Custom loading template

---

## 20. Styling & Theming

### Row Styling

```html
<p-table [value]="data">
  <ng-template pTemplate="body" let-rowData>
    <tr [ngClass]="{'highlight': rowData.important}">
      <!-- cells -->
    </tr>
  </ng-template>
</p-table>
```

### Striped Rows

```html
<p-table [value]="data" styleClass="p-datatable-striped">
</p-table>
```

### Grid Lines

```html
<p-table [value]="data" styleClass="p-datatable-gridlines">
</p-table>
```

### Small Table

```html
<p-table [value]="data" styleClass="p-datatable-sm">
</p-table>
```

---

## Summary: What PrimeNG Provides

| Feature | Built-In | Custom Code Needed |
|---------|----------|-------------------|
| Pagination | ✅ | No |
| Sorting | ✅ | No |
| Filtering | ✅ | No |
| Selection | ✅ | No |
| Row Expansion | ✅ | No |
| Column Reordering | ✅ | No |
| Column Resizing | ✅ | No |
| Column Toggle | ✅ | No (use p-multiSelect) |
| State Persistence | ✅ | No |
| Lazy Loading | ✅ | No |
| Virtual Scroll | ✅ | No |
| Responsive | ✅ | No |
| Row Grouping | ✅ | No |
| Frozen Columns | ✅ | No |
| Cell Editing | ✅ | No |
| Export | ✅ | No |
| Loading State | ✅ | No |

**Conclusion**: **Everything you need is already there.**

---

## What You Should Build

Given all these native features, you should only build:

1. **Domain configuration layer** - `TableConfig<T>` for different domains
2. **URL state synchronization** - Bidirectional URL ↔ table state
3. **Pop-out window coordination** - Multi-window state sync
4. **Domain-specific adapters** - API integration for each domain

**Don't build**: Table infrastructure, column management, state persistence, filtering, sorting, pagination, etc.

---

**Next**: Read `03-REVISED-ARCHITECTURE.md` to see how to structure the application using PrimeNG properly.
