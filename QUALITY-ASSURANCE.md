# Quality Assurance Guide

**Purpose**: Define expected behaviors and testing methodologies for Generic-Prime
**Version**: 21.1.0
**Last Updated**: January 2026

---

## Document Evaluation Rubric

This document was created by extracting QA-relevant content from project documentation using the following rubric:

| Criterion | Include? | Rationale |
|-----------|----------|-----------|
| Expected component behavior | YES | Defines what to test |
| Component interaction patterns | YES | Defines integration tests |
| State flow diagrams | YES | Documents data flow to verify |
| User stories/acceptance criteria | YES | Defines success conditions |
| Error handling behavior | YES | Edge cases to test |
| API contracts | YES | Integration points to verify |
| Implementation details | NO | Tests should verify behavior, not implementation |
| Historical decisions | NO | Not relevant to current testing |
| Deprecated patterns | NO | No longer testable |

---

## Part 1: Component Expected Behaviors

### 1.1 Query Control Panel

**Location**: `/discover` - Panel #1
**Purpose**: Manual filter management interface

#### Expected Behaviors

| Action | Expected Result |
|--------|-----------------|
| Click "Add filter by field" dropdown | Shows searchable list of available filter fields |
| Select a filter field | Opens appropriate dialog (text, multiselect, or range) |
| Apply filter in dialog | Filter chip appears in "Active Filters" section |
| Click (x) on filter chip | Filter removed, data refreshes |
| Click "Clear All" | All filters removed, URL cleared |
| Add multiple filters | All chips visible, URL contains all params |

#### Filter Field Types

| Field | Dialog Type | URL Parameter |
|-------|-------------|---------------|
| Manufacturer | Text autocomplete | `manufacturer=Ford` |
| Model | Text autocomplete | `model=F-150` |
| Year | Range picker (min/max) | `yearMin=2020&yearMax=2022` |
| Body Class | Multiselect checkboxes | `bodyClass=Truck,SUV` |
| Data Source | Multiselect checkboxes | `dataSource=NHTSA` |

#### Highlight Behaviors

| Action | Expected Result |
|--------|-----------------|
| Add highlight filter | h_* prefixed params in URL, chart bars highlighted |
| Click "Clear All Highlights" | All h_* params removed from URL |
| Remove individual highlight | Specific h_* param removed |

---

### 1.2 Results Table

**Location**: `/discover` - Main results panel
**Purpose**: Display paginated, sortable vehicle data

#### Expected Behaviors

| Action | Expected Result |
|--------|-----------------|
| Page loads with filters | Table shows filtered results |
| Click column header | Sort by that column (toggle asc/desc) |
| Click pagination control | Navigate to page, URL updates with `page=N` |
| Change page size | URL updates with `size=N`, table refreshes |
| No results for filter | "No results found" message displayed |
| Loading state | Spinner/skeleton shown during fetch |
| Error state | Error message with retry option |

#### Table Columns

| Column | Sortable | Data Type |
|--------|----------|-----------|
| Manufacturer | Yes | String |
| Model | Yes | String |
| Year | Yes | Number |
| Body Class | Yes | String |
| Count | Yes | Number |
| Data Source | No | String |

---

### 1.3 Interactive Charts (Plotly Histograms)

**Location**: `/discover` - Charts panel
**Purpose**: Visual data distribution with click-to-filter

#### Expected Behaviors

| Action | Expected Result |
|--------|-----------------|
| Page loads | Charts render with current filter data |
| Hover over bar | Tooltip shows count |
| Click chart bar | Filter applied for that value |
| Shift+click bar | Highlight applied (h_* param) |
| Resize panel | Charts reflow to fit |
| No data | "No data available" message |

#### Chart Types

| Chart | X-Axis | Y-Axis | Click Action |
|-------|--------|--------|--------------|
| Manufacturer Distribution | Manufacturer names | Count | Filter by manufacturer |
| Model Distribution | Model names | Count | Filter by model |
| Year Distribution | Years | Count | Filter by year range |
| Body Class Distribution | Body class names | Count | Filter by body class |

---

### 1.4 Model Picker (Dual Checkbox)

**Location**: `/discover` - Picker panel
**Purpose**: Select manufacturer-model combinations

#### Expected Behaviors

| Action | Expected Result |
|--------|-----------------|
| Expand manufacturer | Shows nested model checkboxes |
| Check manufacturer | All models selected, URL updates with `modelCombos` |
| Check individual model | Only that model selected |
| Uncheck all | Filter cleared |
| Search manufacturers | List filtered by search term |
| Apply selection | `modelCombos=Ford:F-150,Ford:Mustang` in URL |

---

## Part 2: State Management Flows

### 2.1 URL-First Architecture

**Core Principle**: URL is the single source of truth. State flows from URL to services to components.

```
URL Change → UrlStateService → ResourceManagementService → Components
     ↑                                                          │
     └──────────────────────────────────────────────────────────┘
                        (updateFilters triggers URL change)
```

#### Testable State Flows

| Flow | Trigger | Observable Changes |
|------|---------|-------------------|
| Filter Add | User clicks filter | URL params update, `filters$` emits, data fetches |
| Filter Remove | User removes chip | URL params update, `filters$` emits, data fetches |
| Browser Back | User clicks back | URL reverts, state syncs, UI updates |
| Direct URL | User pastes URL | State initializes from URL, UI reflects params |
| Page Refresh | Browser refresh | State rebuilds from URL, same view rendered |

### 2.2 Request Coordination

**Behavior**: Identical requests are deduplicated and cached

| Scenario | Expected Behavior |
|----------|-------------------|
| Same filter applied twice quickly | Only one HTTP request made |
| Cache hit (within 30s TTL) | No HTTP request, cached data returned |
| Cache miss | HTTP request made, response cached |
| Request failure | Retry up to 3 times with exponential backoff |
| Concurrent identical requests | Share single in-flight observable |

---

## Part 3: Pop-Out Window System

### 3.1 MOVE Semantics

**Behavior**: Panels MOVE to pop-out window, not copy

| Action | Main Window | Pop-Out Window |
|--------|-------------|----------------|
| Click pop-out button | Panel disappears, placeholder shown | Panel renders in new window |
| Close pop-out | Panel restored | Window closes |
| Apply filter in pop-out | State syncs via BroadcastChannel | Filter appears in pop-out |
| Apply filter in main | State broadcasts to pop-out | Filter appears in main |

### 3.2 Pop-Out URL Routing

| Panel | Pop-Out URL |
|-------|-------------|
| Query Control | `/panel/discover/query-control/query-control` |
| Model Picker | `/panel/discover/model-picker/picker` |
| Dual Picker | `/panel/discover/dual-picker/dual-picker` |
| Results Table | `/panel/discover/vehicle-results/results` |
| Charts | `/panel/discover/interactive-charts/plotly-charts` |

### 3.3 Synchronization Verification

| Test Scenario | Verification |
|---------------|--------------|
| Filter in main, check pop-out | Pop-out shows same filter chip |
| Filter in pop-out, check main | Main shows same filter chip |
| Close pop-out unexpectedly | Main window restores panel within 500ms |
| Pop-out with highlights in URL | Highlights preserved after main state sync |

---

## Part 4: Error Handling Behaviors

### 4.1 HTTP Error Interceptor

| HTTP Status | Error Code | User Message | Retry? |
|-------------|------------|--------------|--------|
| 0 | CLIENT_ERROR | "Unable to connect to server..." | No |
| 400 | BAD_REQUEST | "Invalid request..." | No |
| 401 | UNAUTHORIZED | "Authentication required..." | No |
| 403 | FORBIDDEN | "Access denied..." | No |
| 404 | NOT_FOUND | "Resource not found." | No |
| 429 | RATE_LIMIT_EXCEEDED | "Too many requests..." | Yes (2x) |
| 500 | INTERNAL_SERVER_ERROR | "Internal server error..." | Yes (2x) |
| 502 | BAD_GATEWAY | "Bad gateway..." | Yes (2x) |
| 503 | SERVICE_UNAVAILABLE | "Service unavailable..." | Yes (2x) |
| 504 | GATEWAY_TIMEOUT | "Gateway timeout..." | Yes (2x) |

### 4.2 Global Error Handler

| Error Type | Behavior |
|------------|----------|
| Unhandled promise rejection | Logged to console, toast shown |
| Component error | Error boundary catches, fallback UI shown |
| HTTP error (after retries) | Error state in component, retry button available |

---

## Part 5: E2E Test Categories

### Category 1: Basic Filters (Tests 001-020)

| Test ID | Description | Key Assertions |
|---------|-------------|----------------|
| 001 | Add manufacturer filter | URL contains `manufacturer=X`, chip visible |
| 002 | Remove filter via chip | URL cleared, chip removed |
| 003 | Clear all filters | URL has no filter params |
| 004 | Multiple filters | All params in URL, all chips visible |
| 005 | Year range filter | `yearMin` and `yearMax` in URL |

### Category 2: Pop-Out Lifecycle (Tests 021-040)

| Test ID | Description | Key Assertions |
|---------|-------------|----------------|
| 021 | Open pop-out | New window opens, correct URL |
| 022 | Placeholder shown | Main window shows placeholder |
| 023 | Close pop-out | Panel restored in main |
| 024 | Multiple pop-outs | Each tracked independently |
| 025 | Pop-out blocked | Warning toast shown |

### Category 3: Filter-PopOut Sync (Tests 041-060)

| Test ID | Description | Key Assertions |
|---------|-------------|----------------|
| 041 | Filter in main, sync to pop-out | Pop-out shows filter |
| 042 | Filter in pop-out, sync to main | Main shows filter |
| 043 | Clear in main, sync to pop-out | Pop-out cleared |
| 044 | Highlight preserved in pop-out | URL h_* params unchanged |

### Category 4: Highlight Operations (Tests 061-080)

| Test ID | Description | Key Assertions |
|---------|-------------|----------------|
| 061 | Add highlight via chart | h_* param in URL |
| 062 | Chart bars highlighted | Visual highlight applied |
| 063 | Clear highlights | All h_* params removed |
| 064 | Highlight + filter combo | Both active simultaneously |

### Category 5: URL Persistence (Tests 081-100)

| Test ID | Description | Key Assertions |
|---------|-------------|----------------|
| 081 | Browser back | Previous state restored |
| 082 | Browser forward | Next state restored |
| 083 | Bookmark URL | Filters restored on visit |
| 084 | Page refresh | State preserved |
| 085 | Share URL | Other user sees same view |

### Category 6: Edge Cases (Tests 101-120)

| Test ID | Description | Key Assertions |
|---------|-------------|----------------|
| 101 | Invalid URL params | Graceful fallback to defaults |
| 102 | Empty results | "No results" message shown |
| 103 | API timeout | Error state, retry available |
| 104 | Very long filter values | URL encoding works |

---

## Part 6: Manual Test Checklist

### Pre-Release Verification

- [ ] **Navigation**: All menu items navigate correctly
- [ ] **Filters**: Add, remove, clear all work
- [ ] **Pop-outs**: Open, sync, close work
- [ ] **Charts**: Render, click-to-filter works
- [ ] **Table**: Pagination, sorting work
- [ ] **URL State**: Back/forward, refresh, bookmark work
- [ ] **Responsive**: Works at 1280px and 1920px widths
- [ ] **Error States**: API errors show appropriate messages

### Browser Compatibility

| Browser | Minimum Version | Test Priority |
|---------|-----------------|---------------|
| Chrome | 90+ | High |
| Firefox | 88+ | High |
| Safari | 15.4+ | Medium |
| Edge | 90+ | Medium |

---

## Part 7: Performance Expectations

### Page Load

| Metric | Target | Maximum |
|--------|--------|---------|
| First Contentful Paint | < 1.5s | < 3s |
| Time to Interactive | < 3s | < 5s |
| Initial Bundle Size | < 300KB | < 500KB |

### Runtime

| Operation | Target | Maximum |
|-----------|--------|---------|
| Filter apply to results | < 500ms | < 2s |
| Chart render | < 300ms | < 1s |
| Pop-out open | < 1s | < 2s |
| State sync (BroadcastChannel) | < 100ms | < 500ms |

---

## Part 8: Data Contracts

### API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/v1/vehicles/details` | GET | Paginated vehicle results |
| `/api/v1/vehicles/statistics` | GET | Aggregated counts |
| `/api/v1/manufacturers` | GET | Manufacturer list |
| `/api/v1/models` | GET | Model list by manufacturer |

### Response Shapes

**Vehicle Results**:
```typescript
{
  results: VehicleResult[];
  total: number;
  page: number;
  size: number;
  statistics?: VehicleStatistics;
}
```

**Statistics**:
```typescript
{
  manufacturerCounts: Record<string, number>;
  modelCounts: Record<string, number>;
  yearCounts: Record<string, number>;
  bodyClassCounts: Record<string, number>;
}
```

---

## Source Documents

The following documents were evaluated and content extracted:

| Document | Useful Content |
|----------|----------------|
| `docs/specs/04-state-management-specification.md` | State flows, service behaviors |
| `docs/specs/07-popout-window-system.md` | Pop-out lifecycle, sync patterns |
| `cruft/specs/03-discover-feature-specification.md` | Component behaviors |
| `cruft/specs/09-testing-strategy.md` | Test categories, patterns |
| `cruft/test-archive/E2E-TESTING-RUBRIC.md` | Pre-flight checks |
| `cruft/components/query-control/specification.md` | Query control behaviors |
| `cruft/MANUAL-TEST-PLAN.md` | Manual test checklist |

Documents NOT used (failed rubric):
- Architecture decision records (historical, not testable)
- Migration guides (deprecated)
- Session logs (implementation details)
