# Tangents & Follow-up Topics

This document tracks discussion topics and questions that come up during sessions but aren't the current task. These are candidates for future work or clarification.

---

## Active Tangents

### 1. Authentication & User Credentials for Desktop-Only App
**Date Raised**: 2025-12-14
**Status**: Pending discussion
**Summary**:
- App is meant for desktop only
- Each user logs in and receives domain-specific credentials (certificates)
- Credentials must be saved to browser
- Question: How to implement this in "Halo Labs" environment?
- Also mentioned: Past discussion about dummy user authentication service, unclear how far implementation went

**Investigation Completed**: ✅
- Found comprehensive auth specifications (3,800+ lines) but ZERO implementation
- App is currently 100% public with no login required
- No references to "Halo Labs" in codebase
- Recommendations provided for mock vs full implementation

**Next Steps**:
- User to decide: Mock auth (quick, for dev) or Full auth (production-ready)
- Implement chosen approach
- Integrate credential/certificate storage for domains

**Related Files**:
- `/docs/specs/auth/authentication-service.md` (2,264 lines - ready for implementation)
- `/docs/specs/11-navigation-authorization.md` (1,578 lines - ready for implementation)
- `/frontend/src/framework/services/http-error.interceptor.ts` (partial infrastructure)

### 2. Smart Domain Navigation Dropdown Menu in Banner
**Date Raised**: 2025-12-14
**Status**: Implementation Complete - Proper TieredMenu with Flyout Submenus
**Summary**:
- User requested a smart dropdown menu in the app header/banner
- Should allow quick navigation between domains from any page
- No need to click "Home" then select another domain
- Should include flyout menus for sub-pages within domains (e.g., /automobiles, /automobiles/discover)

**Investigation Completed**: ✅
- Current app structure explored
- All routes documented: 5 domains with landing pages + discover routes + report page
- Researched PrimeNG menu components: found TieredMenu is designed for flyout submenus
- Banner location identified: `<header class="app-header">` in app.component.html

**Implementation Completed**: ✅ (Version 2 - Proper Implementation)
- Replaced initial dropdown implementation with **PrimeNG TieredMenu component**
- TieredMenu natively supports nested items with flyout overlay behavior
- Menu uses proper hierarchical structure with `items` array for submenus
- Navigation via `routerLink` property on MenuItem objects
- Dark theme styling with cyan accents on submenus
- Automatic flyout positioning and hover behavior

**Implementation Details**:
- **Component**: `p-tieredMenu` with `[model]="domainMenuItems"`
- **Structure**: Nested MenuItem array from `primeng/api`
  ```typescript
  {
    label: 'Automobiles',
    icon: '🚗',
    items: [
      { label: 'Autos Home', icon: '🏠', routerLink: '/automobiles' },
      { label: 'Autos Discover', icon: '🔍', routerLink: '/automobiles/discover' }
    ]
  }
  ```
- **Styling**:
  - Root menu items display horizontally in header
  - Submenu flyouts positioned as overlays with cyan border
  - Dark background (#3c3c3c) with hover highlights
  - Box shadow for depth: `0 4px 12px rgba(0, 0, 0, 0.5)`
- **Navigation**: routerLink directly on MenuItem - no custom handlers needed

**Flyout Menu Display**:
```
Header: [🏠 Home] [🚗 Automobiles] [🌾 Agriculture] [⚛️ Physics] [🧪 Chemistry] [📐 Mathematics] [📋 Test Reports]

Hovering on "Automobiles" shows flyout:
┌─────────────────────┐
│ 🏠 Autos Home       │
│ 🔍 Autos Discover   │
└─────────────────────┘
```

**Research Sources**:
- [PrimeNG Menu Component](https://primeng.org/menu)
- [PrimeNG TieredMenu Component](https://primeng.org/tieredmenu)
- [PrimeNG TieredMenu Methods](https://www.geeksforgeeks.org/angular-primeng-tieredmenu-methods/)
- [Angular UI Development with PrimeNG - TieredMenu Book Reference](https://www.oreilly.com/library/view/angular-ui-development/9781788299572/c8e8caeb-b956-4a44-a399-64bb6b0e1dcb.xhtml)

**Related Files**:
- `/frontend/src/app/app.component.ts` (MenuItem[] structure with nested items)
- `/frontend/src/app/app.component.html` (p-tieredMenu component)
- `/frontend/src/app/app.component.scss` (TieredMenu styling for root list and submenus)
- `/frontend/src/app/primeng.module.ts` (TieredMenuModule imported)

**Next Steps**:
- Build and test the TieredMenu in running app
- Verify flyout behavior on hover from all pages
- Verify navigation to all routes works correctly
- Confirm visual styling and dark theme consistency

### 3. Pop-Out Window Positioning for Multi-Monitor Support
**Date Raised**: 2025-12-24
**Status**: Identified - Ready for Future Implementation
**Summary**:
- During Session 56 testing, discovered that pop-out windows cannot be repositioned programmatically from the main window
- Browser security model prevents main window from manipulating separate pop-out window state (same-origin policy applies at window level, not just tab level)
- User requested ability to move pop-out panels to different monitors programmatically
- Currently, pop-out windows appear in default browser position and cannot be repositioned without manual user interaction

**Test Case That Identified This**:
- User requested: "Three monitors are in use. Popout the Query Control and move it 800px to the left. This should cause it to appear on the left monitor."
- Claude successfully opened pop-out window but could not execute `window.moveTo(800, 0)` from main window context
- Root cause: Application design does not store window reference from `window.open()` call

**Implementation Suggestions**:
1. **Window Reference Storage**:
   - Store window reference globally during `window.open()`:
     ```typescript
     const queryControlWindow = window.open(url, 'QueryControl');
     window.global_openWindows = window.global_openWindows || {};
     window.global_openWindows['QueryControl'] = queryControlWindow;
     ```
   - This enables reference-based positioning after window opens

2. **PostMessage API for Cross-Window Communication**:
   - Implement messaging protocol from main window to pop-out:
     ```typescript
     queryControlWindow.postMessage(
       { action: 'moveWindow', x: 800, y: 0 },
       window.location.origin
     );
     ```
   - Pop-out window listens and executes: `window.moveTo(data.x, data.y);`

3. **Window Layout Service**:
   - Create service to manage multi-window state and positioning
   - Store window positions in preferences API for restore on reload
   - Support window "layout presets" (e.g., "dual-monitor", "triple-monitor")

**Related Files**:
- `frontend/src/framework/services/pop-out-context.service.ts` (current pop-out implementation)
- `frontend/src/framework/components/query-control/query-control.component.ts` (Query Control component)
- `frontend/src/framework/components/results-table/results-table.component.ts` (Results Table component)

**Impact Assessment**:
- **User Experience**: Current limitation doesn't break functionality; pop-outs work correctly regardless of position
- **Workaround**: Users can manually move windows using mouse/OS window management
- **Priority**: Low - nice to have, not blocking any workflow

**Next Steps**:
- Include in future requirements if multi-monitor support becomes critical
- Would require: window reference storage + PostMessage listener implementation
- Estimated effort: 2-4 hours for basic implementation

---

### 4. UserPreferencesService Abstraction Leaks
**Date Raised**: 2026-01-02
**Status**: Documented - Awaiting Future Work
**Summary**:
- During Session 76 refactoring of QueryControlComponent, identified abstraction leaks in UserPreferencesService
- The service is a framework component but contains hardcoded domain-specific values
- These leaks should be fixed when multi-domain support is actually needed

**Abstraction Leaks Identified**:

1. **Hardcoded Panel Names** (`user-preferences.service.ts:54-60`):
   ```typescript
   private readonly DEFAULT_PANEL_ORDER = [
     'query-control',
     'query-panel',
     'manufacturer-model-picker',  // ← Automobile-specific
     'statistics-panel',
     'basic-results-table'
   ];
   ```

2. **Hardcoded Domain List** (`user-preferences.service.ts:338`):
   ```typescript
   ['automobiles', 'physics', 'agriculture', 'chemistry', 'math'].forEach(domain => {
   ```
   Adding a new domain requires modifying framework code.

3. **Default Domain Fallback** (`user-preferences.service.ts:469-470`):
   ```typescript
   // Default to 'automobiles' if extraction fails
   return 'automobiles';
   ```

**Recommended Fixes**:
1. **Panel Order**: Get from `DomainConfig.defaultPanelOrder` property
2. **Domain List**: Inject from routing config or domain registry
3. **Default Domain**: Make configurable via environment/app config

**Priority**: Low - service works correctly, just needs refactoring before adding second domain

**Related Files**:
- `frontend/src/framework/services/user-preferences.service.ts`
- `cruft/specs/10-user-preferences-service.md` (full specification, 1500+ lines)

**Related Context**:
- The full UserPreferences spec in `cruft/specs/` describes file-based preferences with backend API
- Current implementation uses localStorage as interim solution
- Backend API described but not yet implemented

---

### 5. CDK Mixed Orientation for Panel Grid Layout
**Date Raised**: 2026-01-02
**Status**: Research Complete - Ready for Implementation
**Summary**:
- User asked about Angular CDK drag-drop improvements after upgrading from Angular 14 to 21
- Research found current panel drag-drop implementation is already using best practices
- New feature available: `cdkDropListOrientation="mixed"` for grid/wrapped layouts (available since Angular Material v18.1.0)

**Current Implementation** (works correctly):
- `frontend/src/app/features/discover/discover.component.ts` uses `CdkDropList`, `CdkDrag`, `CdkDragHandle`
- Vertical panel list with `moveItemInArray()` utility
- Persists to UserPreferencesService

**New Option for Grid Layout**:
```html
<div cdkDropList cdkDropListOrientation="mixed" class="panel-grid">
  @for (panel of panelOrder; track panel) {
    <div cdkDrag>{{ panel }}</div>
  }
</div>
```

```scss
.panel-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}
```

**Caveat**: Mixed orientation disables sorting animations (elements move via DOM manipulation instead of CSS transforms).

**Research Sources**:
- [Angular Drag and Drop Guide](https://angular.dev/guide/drag-drop)
- [Angular CDK Drag-Drop API](https://material.angular.dev/cdk/drag-drop/api)
- [Mixed Orientation Support Issue #13372](https://github.com/angular/components/issues/13372)

**Related Files**:
- `frontend/src/app/features/discover/discover.component.ts`
- `frontend/src/app/features/discover/discover.component.html`

**Next Steps**:
- Explore if grid layout would benefit the discover page UX
- If yes, switch to `cdkDropListOrientation="mixed"` with flex-wrap styling

---

### 6. Zoneless Change Detection Migration
**Date Raised**: 2026-01-02
**Status**: Pending - Future Exploration
**Summary**:
- Angular 18+ introduced experimental zoneless change detection, stabilized in Angular 19+
- Current app still uses zone.js and requires `ngZone.run()` workarounds for browser APIs (setInterval, BroadcastChannel, etc.)
- Migration to zoneless would eliminate these workarounds and improve performance
- Codebase already uses signals in many places, which is a good foundation

**Current State**:
- zone.js is still in package.json
- No `provideExperimentalZonelessChangeDetection()` configuration
- Multiple `ngZone.run()` calls exist to handle browser API callbacks

**Migration Requirements**:
1. Add `provideExperimentalZonelessChangeDetection()` to app config
2. Remove zone.js from angular.json polyfills
3. Replace `ngZone.run()` calls with signal-based reactivity or explicit `markForCheck()`
4. Ensure all state changes use signals for automatic change detection
5. Test thoroughly - change detection behavior will be different

**Benefits**:
- Smaller bundle size (no zone.js)
- Better performance (no automatic dirty checking)
- Simpler code (no zone workarounds)
- Aligns with Angular's future direction

**Risks**:
- Breaking changes to change detection timing
- Third-party libraries may not be zoneless-compatible
- Requires careful testing of all async operations

**Related Files**:
- `frontend/src/app/app.config.ts` (would add zoneless provider)
- `frontend/angular.json` (would remove zone.js polyfill)
- `frontend/src/app/features/discover/discover.component.ts` (has ngZone.run() calls)

**Next Steps**:
- Complete current CDK mixed orientation work first
- Research PrimeNG zoneless compatibility
- Create migration plan with incremental steps

---

### 7. AI Integration - Natural Language Query Interface
**Date Raised**: 2026-01-03
**Status**: IN PROGRESS - Implementation Started
**Branch**: `feature/ai`

**Summary**:
User requested AI integration to allow natural language queries that get translated to backend API calls and present results in a chat interface.

#### Phase 1: Basic Chat Interface
- Add a chatbox component to accept user queries
- Connect to `llama3.1:7b` model running on Mimir (192.168.0.100:11434)
- Present AI responses in conversational format
- Simple Q&A without backend integration

#### Phase 2: Backend-Aware AI
- Provide the LLM with backend API endpoint documentation
- LLM translates natural language to API parameters
- Execute API calls using existing adapters
- Present structured results back to user

**Backend API Reference** (for LLM context):

**Base URL**: `http://generic-prime.minilab/api/specs/v1`

**Primary Endpoint**: `GET /vehicles/details`

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `manufacturer` | string | Exact manufacturer match | `Toyota` |
| `model` | string | Exact model match | `Camry` |
| `yearMin` | integer | Minimum year (inclusive) | `2020` |
| `yearMax` | integer | Maximum year (inclusive) | `2024` |
| `bodyClass` | string | Body class filter | `Sedan` |
| `instanceCountMin` | integer | Minimum VIN instances | `10` |
| `instanceCountMax` | integer | Maximum VIN instances | `1000` |
| `search` | string | Global search (all fields) | `Toyota Camry` |
| `models` | string | Comma-separated mfr:model pairs | `Ford:F-150,Toyota:Camry` |
| `page` | integer | Page number (1-indexed) | `1` |
| `size` | integer | Results per page (1-100) | `20` |
| `sortBy` | string | Sort field | `manufacturer` |
| `sortOrder` | string | Sort direction (asc/desc) | `desc` |

**Response Fields** (`VehicleResult`):
- `vehicle_id`, `manufacturer`, `model`, `year`, `body_class`
- `instance_count`, `first_seen`, `last_seen`
- `drive_type`, `engine`, `transmission`, `fuel_type`, `vehicle_class`

**Filter Endpoints**:
- `GET /filters/manufacturers` → `{ "manufacturers": [...] }`
- `GET /filters/models` → `{ "models": [...] }`
- `GET /filters/body-classes` → `{ "body_classes": [...] }`
- `GET /filters/year-range` → `{ "min": 1900, "max": 2025 }`

**Validation Rules**:
- Year: 1900 to current year + 1
- Instance Count: 0 to 10000
- Page: >= 1
- Size: 1 to 100

**LLM Configuration**:
- Model: `llama3.1:7b`
- Host: Mimir (192.168.0.100)
- Port: 11434 (Ollama default)
- Endpoint: `http://192.168.0.100:11434/api/generate`

**Key Considerations**:
- Local LLM via Ollama for privacy and speed
- Domain-specific prompt engineering (field names, data types)
- Fallback to manual query if AI translation fails
- Show generated query for user review before execution

**Related Files**:
- `frontend/src/framework/services/api.service.ts` - HTTP client
- `frontend/src/domain-config/automobile/adapters/automobile-api.adapter.ts` - API adapter
- `frontend/src/domain-config/automobile/models/automobile.filters.ts` - Filter model

**Implementation Files** (to be created):
- `frontend/src/framework/services/ai.service.ts` - Ollama communication
- `frontend/src/framework/components/ai-chat/` - Chat UI component
- `frontend/src/framework/models/ai.models.ts` - AI interfaces

---

## Historical Tangents (Resolved)

None yet - this is the first document.

---

## How to Use This Document

1. **When a tangent comes up**: I'll add it here with a description, date, and status
2. **After current task completion**: I'll remind you of pending tangents for prioritization
3. **When clarification needed**: I'll reference the relevant tangent to provide context
4. **Periodically**: This doc gets updated to show progress/status

---

## Template for New Tangents

```markdown
### N. [Short Title]
**Date Raised**: YYYY-MM-DD
**Status**: Pending / In Discussion / Investigating / Ready for Implementation
**Summary**: [2-3 sentence description of the issue/question]
**Related Files**: [List relevant files/docs]
**Next Steps**: [What would need to happen next]
```
