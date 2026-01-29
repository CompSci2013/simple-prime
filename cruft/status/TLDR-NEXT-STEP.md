# TLDR-NEXT-STEP.md - Implementation Roadmap

**Last Updated:** 2025-11-26
**Purpose:** Machine-readable guide for implementing next features

---

## Quality Context (2025-11-26)

**Current Grade: B+ (84/100)** - See [GENERIC-PRIME-ASSESSMENT.md](GENERIC-PRIME-ASSESSMENT.md)

**⚠️ UNIT TESTING POLICY:** Do NOT write unit tests. Testing deferred to dedicated project. AI-generated tests proven brittle. Testing weight in rubric: 1%.

**When implementing new features, maintain these standards:**
- Architecture & Design: 22/25 - Keep config-driven, URL-first patterns
- Angular Best Practices: 22/25 - Use OnPush, proper RxJS, lifecycle cleanup
- Code Quality: 21/25 - Add JSDoc, avoid `any` types where possible

**Technical Debt to Address Opportunistically:**
- Replace `$any()` template casts with typed accessors
- Add `trackBy` to `*ngFor` loops
- ~~Use `combineLatest` instead of nested subscribes~~ ✅ Fixed in ResultsTableComponent (2025-11-26)
- Add debouncing to text filter inputs

---

## 🐳 Development Container Quick Reference

**⚠️ ALL npm/ng commands run INSIDE the container, NOT on host.**

```bash
# Start container + dev server
cd ~/projects/generic-prime/frontend
podman start generic-prime-frontend-dev 2>/dev/null || \
  podman run -d --name generic-prime-frontend-dev --network host \
    -v $(pwd):/app:z -w /app localhost/generic-prime-frontend:dev
podman exec -it generic-prime-frontend-dev npm start -- --host 0.0.0.0 --port 4205

# Run any command inside container
podman exec -it generic-prime-frontend-dev <command>
podman exec -it generic-prime-frontend-dev npm install
podman exec -it generic-prime-frontend-dev ng generate component features/foo
podman exec -it generic-prime-frontend-dev sh  # Interactive shell
```

**Full commands:** See [TLDR.md](TLDR.md) "Development Container Commands" section

---

## 🔥 Latest Session Summary (2025-11-26 - Reliability Improvements & Critical Bug Found)

**What Just Happened:**
- ✅ **RXJS ANTI-PATTERNS FIXED**: ResultsTableComponent now uses `combineLatest` + `takeUntil(destroy$)` instead of 4 separate subscriptions
- ✅ **CHART ERROR BOUNDARIES ADDED**: BaseChartComponent now catches Plotly.js errors gracefully with retry functionality
- ⚠️ **CRITICAL BUG #11 DISCOVERED**: Picker pagination shows inconsistent totals and truncated data (e.g., stops at Chevrolet instead of reaching Waterford Tank)
- ✅ **BUG DOCUMENTED**: Bug #11 added to KNOWN-BUGS.md with 3-phase investigation plan

**Files Modified:**
1. `results-table.component.ts` - RxJS fix (combineLatest pattern)
2. `base-chart.component.ts/html/scss` - Error boundary implementation
3. `automobile.picker-configs.ts` - sortOrder fix, total calculation improvement
4. `KNOWN-BUGS.md` - Bug #11 documented as CRITICAL
5. `TLDR.md` - Updated Known Active Bugs section

**Bug #11 Summary:**
- Picker total count changes incorrectly with page size (858→798→466→295 entries)
- Data truncates at Chevrolet instead of showing all manufacturers through Waterford Tank
- Root cause: Mismatch between server-side pagination (paginates manufacturer groups) and client-side flattening (expands to manufacturer-model rows)
- **Requires Elasticsearch data analysis** to establish expected values before fixing

**Deployment Status:**
- **Backend**: ✅ Deployed in `generic-prime` namespace, 2 replicas running
- **Frontend**: ✅ Dev server at `http://192.168.0.244:4205/discover`
- **API Endpoint**: `http://generic-prime.minilab/api/specs/v1/...`

⚠️ **CRITICAL**: This is the **generic-prime** project. Always test using:
- **Frontend Dev Server**: `http://192.168.0.244:4205/discover` (currently running)
- **Generic-Prime Backend**: Port-forward to test: `kubectl port-forward -n generic-prime svc/generic-prime-backend 3000:3000`
- **DO NOT TEST**: `auto-discovery.minilab` (different project - not relevant)

**Next Recommended Tasks**:
1. **PRIORITY 0**: Investigate Bug #11 (picker critical - Elasticsearch analysis first)
2. Bug #10: Pop-out statistics panel with pre-selected filters
3. VIN Browser Panel implementation (high value feature)

---

## 🎯 PRIORITY 0 - Data-First Investigation: Bug #11 & Table/Picker Architecture

**Estimated Time:** 4-6 hours (systematic data-first approach)
**Impact:** CRITICAL - Ensures all tables/pickers are correctly designed for actual data
**Status**: 🔴 NOT STARTED

**⚠️ CRITICAL METHODOLOGY: Data-First, Backend-Second, Frontend-Last**

Do NOT modify frontend code until Phases 1-3 are complete!

---

### Phase 1: Elasticsearch Data Analysis (DO FIRST)

**Goal:** Understand the TRUE data structure before touching any code.

**Questions to Answer:**
1. What is the actual schema of `autos-unified` index?
2. What is the actual schema of `autos-vins` index?
3. How many unique manufacturers exist?
4. How many unique manufacturer-model combinations exist?
5. How many total vehicle specifications exist?
6. How many total VIN records exist?
7. What is the relationship between specs and VINs?

**Elasticsearch Queries to Run:**
```bash
# Get index mappings
curl -X GET "elasticsearch:9200/autos-unified/_mapping?pretty"
curl -X GET "elasticsearch:9200/autos-vins/_mapping?pretty"

# Count documents
curl -X GET "elasticsearch:9200/autos-unified/_count?pretty"
curl -X GET "elasticsearch:9200/autos-vins/_count?pretty"

# Unique manufacturers
curl -X POST "elasticsearch:9200/autos-unified/_search?pretty" -H 'Content-Type: application/json' -d'
{
  "size": 0,
  "aggs": { "unique_manufacturers": { "cardinality": { "field": "manufacturer.keyword" } } }
}'

# Unique manufacturer-model combinations
curl -X POST "elasticsearch:9200/autos-unified/_search?pretty" -H 'Content-Type: application/json' -d'
{
  "size": 0,
  "aggs": {
    "manufacturers": {
      "terms": { "field": "manufacturer.keyword", "size": 1000 },
      "aggs": { "models": { "terms": { "field": "model.keyword", "size": 1000 } } }
    }
  }
}'
```

**Deliverable:** Document with actual counts and data structure.

---

### Phase 2: Define What Tables/Pickers Make Sense

**Based on Phase 1 data, answer:**

| Component Type | Data Source | Purpose | Feasible? |
|----------------|-------------|---------|-----------|
| **Manufacturer-Model Picker** | autos-unified | Select manufacturer-model combos for filtering | ? |
| **Results Table** | autos-unified | Display vehicle specifications | ? |
| **Results Table + VIN Expansion** | autos-unified + autos-vins | Specs with expandable VIN details | ? |
| **Standalone VIN Table** | autos-vins | Browse individual VINs | ? |
| **Manufacturer Picker (simple)** | autos-unified | Select manufacturers only | ? |
| **Body Class Picker** | autos-unified | Select body classes | ? |

**Questions:**
1. Does the current Manufacturer-Model Picker design match the actual data?
2. Should we have separate Manufacturer and Model pickers instead of combined?
3. Is the VIN data suitable for row expansion or standalone table?
4. Are there other logical groupings we're missing?

---

### Phase 3: Backend Routes Analysis

**Only after Phase 1-2 are complete!**

**Examine these backend files:**
- `backend-specs/src/routes/specs.js` - All specs routes
- `backend-specs/src/services/elasticsearchService.js` - ES queries

**Questions to Answer:**
1. Does `/manufacturer-model-combinations` return correct data structure?
2. What does `total` field represent (manufacturers? combinations? something else)?
3. Is pagination working correctly for the intended use case?
4. Do we need NEW routes for the tables/pickers identified in Phase 2?
5. Do existing routes need logic fixes?

**Backend Changes Checklist:**
- [ ] Route logic matches intended picker/table design
- [ ] Pagination returns correct totals
- [ ] Response structure is frontend-friendly
- [ ] New routes added if needed

**DO NOT PROCEED TO PHASE 4 UNTIL BACKEND IS VERIFIED CORRECT**

---

### Phase 4: Frontend Component Verification

**Only after backend is confirmed correct!**

**Questions to Answer:**
1. Are we displaying the correct components for the data?
2. Are any components missing that should exist?
3. Are any components being displayed that don't make sense?
4. Does `responseTransformer` correctly handle the (now-verified) backend response?

**Component Audit:**
| Component | Exists? | Correct Design? | Needs Changes? |
|-----------|---------|-----------------|----------------|
| Manufacturer-Model Picker | Yes | ? | ? |
| Results Table | Yes | ? | ? |
| VIN Browser Panel | No | N/A | Create? |
| Body Class Picker | No | N/A | Create? |

---

### Phase 5: Frontend Fixes (LAST)

**Only after Phases 1-4 are complete!**

Fix bugs in this order:
1. Fix `responseTransformer` if backend is correct but frontend mishandles response
2. Fix component configurations if they don't match data structure
3. Fix UI/UX bugs (pagination display, checkbox state, etc.)

**Files to Modify:**
- [automobile.picker-configs.ts](frontend/src/domain-config/automobile/configs/automobile.picker-configs.ts)
- [base-picker.component.ts](frontend/src/framework/components/base-picker/base-picker.component.ts)
- Any new components identified in Phase 4

---

## ✅ COMPLETED: Deploy Generic-Prime to Kubernetes (2025-11-24)

**Status:** ✅ COMPLETED
**Testing:** ✅ VERIFIED - All comma-separated filters working

Backend deployed and tested successfully. All filter parameters support comma-separated values with OR logic.

### Task Breakdown

**1. Verify Backend Code** (5 minutes)

Check if bodyClass comma-separated logic is already in place:
```bash
cd ~/projects/generic-prime/backend-specs/src/services
grep -A 20 "if (filters.bodyClass)" elasticsearchService.js
```

If needed, ensure it has comma-separated support like manufacturer/model filters.

**2. Build and Deploy Backend** (30-45 minutes)

Follow `docs/DEVELOPER-ENVIRONMENT.md` Phase 1 & 2:

```bash
# Create namespace
cd ~/projects/generic-prime/k8s
kubectl apply -f namespace.yaml

# Build backend
cd ~/projects/generic-prime/backend-specs
podman build -t localhost/generic-prime-backend:v1.0.1 .

# Export and import to K3s
podman save localhost/generic-prime-backend:v1.0.1 -o generic-prime-backend-v1.0.1.tar
sudo k3s ctr images import generic-prime-backend-v1.0.1.tar

# Deploy backend
cd ~/projects/generic-prime/k8s
kubectl apply -f backend-deployment.yaml
kubectl apply -f backend-service.yaml
kubectl apply -f ingress.yaml

# Watch rollout
kubectl rollout status deployment/generic-prime-backend -n generic-prime

# Clean up
cd ~/projects/generic-prime/backend-specs
rm generic-prime-backend-v1.0.1.tar
```

**3. Test Backend API** (10 minutes)

⚠️ **CRITICAL**: Test against **generic-prime.minilab**, NOT auto-discovery.minilab

```bash
# Test health endpoint
curl http://generic-prime.minilab/api/health

# Test single bodyClass
curl "http://generic-prime.minilab/api/vehicles/details?bodyClass=Sedan&size=1" | jq '.total'

# Test comma-separated bodyClass
curl "http://generic-prime.minilab/api/vehicles/details?bodyClass=Sedan,SUV&size=1" | jq '.total'

# Test comma-separated manufacturer
curl "http://generic-prime.minilab/api/vehicles/details?manufacturer=Ford,Chevrolet&size=1" | jq '.total'

# Test comma-separated model
curl "http://generic-prime.minilab/api/vehicles/details?model=F-150,Mustang&size=1" | jq '.total'
```

**Expected Results:**
- Health check: `{"status":"ok",...}`
- All comma-separated filters should return combined counts
- If any return 0, check backend code for comma-separated support

**4. Deploy Frontend** (20-30 minutes)

Follow `docs/DEVELOPER-ENVIRONMENT.md` Phase 3:

```bash
cd ~/projects/generic-prime/frontend

# Build production image
podman build -f Dockerfile.prod -t localhost/generic-prime-frontend:prod .

# Export and import
podman save localhost/generic-prime-frontend:prod -o generic-prime-frontend-prod.tar
sudo k3s ctr images import generic-prime-frontend-prod.tar

# Deploy frontend
cd ~/projects/generic-prime/k8s
kubectl apply -f frontend-deployment.yaml
kubectl apply -f frontend-service.yaml

# Watch rollout
kubectl rollout status deployment/generic-prime-frontend -n generic-prime

# Clean up
cd ~/projects/generic-prime/frontend
rm generic-prime-frontend-prod.tar
```

**5. Test Complete Application** (10 minutes)

```bash
# Check all pods
kubectl get pods -n generic-prime

# Test in browser
firefox http://generic-prime.minilab
```

**Expected:**
- 2 backend pods running
- 2 frontend pods running
- Browser: Generic Discovery Framework loads
- Query Control: Body Class multiselect works with comma-separated values

**Deliverables:**
- ✅ Backend API supports comma-separated filters for all fields
- ✅ generic-prime namespace deployed to K3s
- ✅ Frontend and backend running in production
- ✅ Full application accessible at http://generic-prime.minilab

---

## Alternative Tasks (If Not Doing PRIORITY 0)

### Option 1: Investigate Bug #10 - Pop-Out Statistics Panel (1-2 hours)

**Bug #10**: Pop-out statistics panel shows broken/incorrect data with pre-selected filters
- When main window has pre-selected bodyClass filters (e.g., `bodyClass=SUV,Coupe,Pickup,Van,Hatchback`)
- Pop-out Statistics panel charts show broken/incorrect data
- Location: `panel-popout.component.ts`, `statistics-panel.component.ts`
- Investigation: Check if pop-out URL includes bodyClass parameter on initialization

### Option 2: Fix Active Pop-Out Bugs (1-2 hours)

**Bug #6**: Popped-out picker shows zero rows after pagination change
- Location: `frontend/src/framework/components/base-picker/base-picker.component.ts`
- Fix: Add `this.cdr.detectChanges()` in pagination handler (line ~220)
- Pattern: Same as Bug #5 fix (use detectChanges() not markForCheck())

**Bug #7**: Checkboxes remain visually checked after clearing selections
- Location: `frontend/src/framework/components/base-picker/base-picker.component.ts`
- Issue: PrimeNG Table selection state not syncing with empty array
- Fix: Force table re-render or reset selection object

### Option 3: VIN Browser Panel (3-4 days, HIGH value)

**Purpose:** Drill-down from vehicle specifications to individual VIN instances

**Key Features:**
- Click on row in results table → Opens VIN browser for that vehicle
- Shows all individual VINs for selected vehicle specification
- Displays VIN-specific data: condition, mileage, value, location, etc.
- Uses `/api/vins/v1/vehicles/:vehicleId/instances` endpoint
- Supports pagination, sorting, filtering of VIN instances
- Pop-out capable (like other panels)

**Implementation:**
1. Create `VinBrowserComponent` (3-4 hours)
2. Add VIN models and interfaces (1 hour)
3. Create VIN API adapter (2 hours)
4. Add row click handler in ResultsTableComponent (1 hour)
5. Integrate with pop-out system (2 hours)
6. Testing and refinement (4-6 hours)

### Option 4: Row Expansion Details (1-2 days)

Implement detailed view when clicking expand button on results table row.

### Option 5: Column Management (1 day)

Add column visibility toggle using PrimeNG MultiSelect.

### Option 6: Export Functionality (1-2 days)

Add CSV/JSON export for filtered results.

---

## Current State (What's Done)

### ✅ Framework Components Implemented (5/7 Panels)

1. **BasePickerComponent** - Configuration-driven multi-select table
   - Server/client pagination support
   - Search and sorting
   - URL synchronization
   - Template: 157 lines of PrimeNG markup
   - **Known Issues**: Bug #6 (pagination) and Bug #7 (checkbox visual state) in pop-out mode

2. **ResultsTableComponent** - Domain-agnostic data table
   - Dynamic filter panel (renders from FilterDefinition[])
   - PrimeNG Table with lazy loading, pagination, sorting
   - Row expansion
   - Statistics panel support
   - Template: 233 lines

3. **QueryControlComponent** - Manual filter management via dialogs
   - Dropdown field selector (dynamically populated from domain config)
   - Multiselect dialog for list-based filters
   - Range dialog for numeric filters
   - Active filter chips with edit/remove functionality
   - Separate highlights section (v0.3.0)
   - URL-first architecture
   - Fully domain-agnostic
   - Template: 179 lines, TypeScript: 467 lines
   - **Unit tests purposefully skipped** (not cost-effective for UI components)

4. **BaseChartComponent** - Generic Plotly.js chart container
   - ChartDataSource pattern for domain-specific data transformation
   - Supports any Plotly.js chart type (bar, line, pie, scatter, etc.)
   - Interactive click events for filtering/highlighting (single-click and box selection)
   - Responsive resizing with window resize handler
   - Delegation pattern for chart-specific formatting
   - Template: 14 lines, TypeScript: 298 lines

5. **StatisticsPanelComponent** - Statistics visualization panel
   - Injects shared ResourceManagementService instance (proper Angular DI)
   - Renders multiple BaseChartComponents based on domain config
   - Collapsible PrimeNG Panel
   - Automatically fetches statistics from API
   - URL-First architecture for chart interactions
   - Template: 40 lines, TypeScript: 215 lines
   - ✅ **Fully functional** (v0.2.0 - 2025-11-23)

### ✅ Framework Services Complete (9 Services, ~3,139 Lines)

All F1-F10 milestones complete:
- UrlStateService (289 lines)
- RequestCoordinatorService (304 lines)
- ResourceManagementService (302 lines)
- ApiService (282 lines)
- PopOutContextService (366 lines)
- PickerConfigRegistry (207 lines)
- DomainConfigRegistry (281 lines)
- DomainConfigValidator (540 lines)
- ErrorNotificationService (368 lines)

### ✅ Automobile Domain Complete (D1-D5 Milestones)

- Models: AutoSearchFilters, VehicleResult, VehicleStatistics (with segmented stats transformation)
- Adapters: AutomobileApiAdapter, AutomobileUrlMapper, AutomobileCacheKeyBuilder
- Configs: Table, Picker, Filters, Charts
- Chart Data Sources: ManufacturerChartDataSource, TopModelsChartDataSource, BodyClassChartDataSource, YearChartDataSource
- Domain factory: createAutomobileDomainConfig() with chartDataSources map

### ✅ Pop-Out Window System Complete (with learnings)

**Architecture:**
- BroadcastChannel for cross-window messaging
- URL-First in pop-outs (each window has independent URL)
- MOVE semantics (panel disappears from main, appears in pop-out)
- Close detection via polling + visibility API

**Critical Pattern Discovered (2025-11-23):**
```typescript
// ❌ WRONG for pop-out windows (unfocused browser windows)
this.cdr.markForCheck();  // Only schedules change detection, doesn't run if window unfocused

// ✅ CORRECT for pop-out windows
this.cdr.detectChanges();  // Forces immediate update, works even in unfocused windows
```

**Bugs Fixed:**
- ✅ Bug #1: Pop-out Query Control Clear button URL update
- ✅ Bug #4: Query Control modelCombos chips display
- ✅ Bug #5: Pop-out picker unfocused window updates (CRITICAL detectChanges() discovery)

**Active Bugs:**
- ❌ Bug #6: Popped-out picker shows zero rows after pagination change
- ❌ Bug #7: Checkboxes remain visually checked after clearing selections

### ✅ Backend Deployment Infrastructure Ready

**Documentation:**
- `docs/DEVELOPER-ENVIRONMENT.md` (v2.0) - Complete build/deploy guide (880 lines)
- `docs/BACKEND-API-UPDATES.md` - Quick reference for backend updates

**Kubernetes Configs:**
- `k8s/namespace.yaml` - generic-prime namespace
- `k8s/backend-deployment.yaml` - Backend deployment (2 replicas)
- `k8s/backend-service.yaml` - Backend ClusterIP service
- `k8s/frontend-deployment.yaml` - Frontend deployment (2 replicas)
- `k8s/frontend-service.yaml` - Frontend ClusterIP service
- `k8s/ingress.yaml` - Traefik ingress (generic-prime.minilab)

**Backend Source:**
- `backend-specs/` - Complete API source code (copied from auto-discovery)
- Ready to build: `localhost/generic-prime-backend:v1.0.1`

**Frontend Dockerfiles:**
- `frontend/Dockerfile.dev` - Development container
- `frontend/Dockerfile.prod` - Production build

**Status:** All infrastructure ready, needs deployment (see PRIORITY 0)

---

## Known Issues & Learnings

### OnPush Change Detection in Pop-Out Windows

**Critical Discovery (2025-11-23):**

Unfocused browser windows with OnPush change detection don't run scheduled change detection:

```typescript
// This doesn't work in unfocused pop-out windows
this.cdr.markForCheck();  // Only schedules, never runs

// This works correctly
this.cdr.detectChanges();  // Forces immediate update
```

**Why This Matters:**
- Pop-out windows are often unfocused (user looking at main window)
- OnPush components in unfocused windows won't update with markForCheck()
- Must use detectChanges() for any state changes triggered by BroadcastChannel

**Where Applied:**
1. `base-picker.component.ts:147` - URL state hydration
2. `base-picker.component.ts:175` - URL parameter changes
3. `base-picker.component.ts:204` - Selection hydration

### Backend Testing - Critical Lesson (2025-11-24)

**ALWAYS TEST GENERIC-PRIME ENDPOINTS, NOT AUTO-DISCOVERY**

**Correct Test Endpoints:**
- ✅ Frontend: `http://192.168.0.244:4205/discover`
- ✅ Backend (when deployed): `http://generic-prime.minilab/api/...`
- ❌ WRONG: `http://auto-discovery.minilab/api/...` (different project)

**Verified Status:**
- ✅ Frontend comma-separated filters work: `?bodyClass=SUV,Coupe,Pickup`
- ✅ Backend deployed and tested: All comma-separated filters working
- ✅ Backend source code in `backend-specs/`

### Code Quality Patterns (from Assessment 2025-11-26)

**Patterns to Follow (scored well):**
- OnPush change detection on ALL components (5/5)
- `takeUntil(destroy$)` for subscription cleanup (5/5)
- JSDoc on public APIs with `@example` blocks (5/5)
- Configuration-driven UI via `domainConfig.filters` (5/5)

**Patterns to Improve (technical debt):**
- Avoid `$any()` in templates - create typed component methods instead
- Avoid `Object = Object` exposure - use pipes or component methods
- Add `trackBy` functions to all `*ngFor` loops
- Use `combineLatest` instead of multiple separate subscriptions
- Add 300ms debounce to text filter inputs

**Files with Known Debt:**
- ~~`results-table.component.ts:96-114` - nested subscribes~~ ✅ Fixed (2025-11-26) - now uses `combineLatest`
- `results-table.component.html` - `Object` exposure, missing trackBy
- `statistics-panel.component.html` - `$any()` casts

---

## Version History

| Version | Date | Components | Backend | Changes |
|---------|------|------------|---------|---------|
| v0.1.0 | 2025-11-20 | BasePickerComponent, ResultsTableComponent | N/A | Initial framework components |
| v0.2.0 | 2025-11-23 | + BaseChartComponent, StatisticsPanelComponent | N/A | Charts & highlighting complete |
| v0.3.0 | 2025-11-23 | + QueryControlComponent highlights | N/A | Separate highlights section |
| v1.0.0 | 2025-11-23 | Same | v1.0.0 | Backend infrastructure ready |
| v1.0.1 | 2025-11-24 | Same | v1.0.1 | Backend deployed, all filters verified working |
| v1.0.2 | 2025-11-26 | Same | v1.0.1 | Quality assessment completed (B+, 84/100) |
| v1.0.3 | 2025-11-26 | + Error boundaries, RxJS fixes | v1.0.1 | Chart error handling, combineLatest pattern, Bug #11 documented |

---

**Last Session:** 2025-11-26 - Reliability improvements & Bug #11 discovery
**Assessment Grade:** B+ (84/100) - Production-ready
**Next Priorities:**
1. **CRITICAL**: Investigate Bug #11 (picker pagination - Elasticsearch analysis first)
2. Bug #10: Pop-out statistics panel with pre-selected filters
3. VIN Browser Panel (high value feature)

**Session Achievements (2025-11-26):**
- ✅ RxJS anti-patterns fixed (combineLatest in ResultsTableComponent)
- ✅ Chart error boundaries added (try/catch + retry in BaseChartComponent)
- ⚠️ Critical Bug #11 discovered and documented

**Documentation:**
- [GENERIC-PRIME-ASSESSMENT.md](GENERIC-PRIME-ASSESSMENT.md) - Full assessment
- [ASSESSMENT-RUBRIC.md](ASSESSMENT-RUBRIC.md) - Scoring criteria
- [KNOWN-BUGS.md](KNOWN-BUGS.md) - Bug #11 investigation plan
- `docs/DEVELOPER-ENVIRONMENT.md` - Deployment guide
