# Service Architecture Flow Diagram

This document shows how the framework services interact to implement the URL-First architecture.

## High-Level Data Flow

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                 MAIN WINDOW                                      │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌──────────┐     ┌────────────────┐     ┌──────────────────────────────┐       │
│  │  Router  │────▶│ UrlStateService│────▶│ ResourceManagementService    │       │
│  │  (URL)   │◀────│                │     │ (State Coordinator)          │       │
│  └──────────┘     └────────────────┘     └───────────────┬──────────────┘       │
│       ▲                                                  │                       │
│       │                                                  ▼                       │
│       │                              ┌───────────────────────────────────┐       │
│       │                              │      DomainConfig.apiAdapter      │       │
│       │                              │      (Domain-Specific)            │       │
│       │                              └───────────────┬───────────────────┘       │
│       │                                              │                           │
│       │                              ┌───────────────▼───────────────────┐       │
│       │                              │   RequestCoordinatorService       │       │
│       │                              │   (Cache + Dedup + Retry)         │       │
│       │                              └───────────────┬───────────────────┘       │
│       │                                              │                           │
│       │                              ┌───────────────▼───────────────────┐       │
│       │                              │          ApiService               │       │
│       │                              │          (HTTP Client)            │       │
│       │                              └───────────────┬───────────────────┘       │
│       │                                              │                           │
│       │                                              ▼                           │
│       │                              ┌───────────────────────────────────┐       │
│       │                              │       Backend API Server          │       │
│       │                              └───────────────────────────────────┘       │
│       │                                                                          │
│  ┌────┴─────────────────────────────────────────────────────────────────────┐   │
│  │                           UI Components                                   │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │   │
│  │  │QueryControl │  │ BaseChart   │  │ResultsTable │  │ BasePicker  │     │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘     │   │
│  └──────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
└──────────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      │ BroadcastChannel
                                      ▼
┌──────────────────────────────────────────────────────────────────────────────────┐
│                                POPOUT WINDOW                                      │
├──────────────────────────────────────────────────────────────────────────────────┤
│                                                                                   │
│  ┌────────────────────────┐     ┌────────────────────────────────────────┐       │
│  │  PopOutContextService  │────▶│  ResourceManagementService             │       │
│  │  (Message Handler)     │     │  (autoFetch: false - receives state)   │       │
│  └────────────────────────┘     └────────────────────────────────────────┘       │
│                                                                                   │
│  ┌────────────────────────────────────────────────────────────────────────┐      │
│  │                         UI Component (same as main)                     │      │
│  └────────────────────────────────────────────────────────────────────────┘      │
│                                                                                   │
└──────────────────────────────────────────────────────────────────────────────────┘
```

## RequestCoordinatorService - Three-Layer Request Processing

The `RequestCoordinatorService` provides intelligent request handling with caching, deduplication, and retry logic:

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    REQUEST COORDINATOR - THREE LAYER FLOW                        │
└─────────────────────────────────────────────────────────────────────────────────┘

          API Request
               │
               ▼
┌──────────────────────────────┐
│  LAYER 1: Response Cache     │
│  ─────────────────────────   │
│  • Check TTL-based cache     │
│  • Return cached if fresh    │
│  • Default TTL: 30 seconds   │
└──────────────┬───────────────┘
               │ Cache miss
               ▼
┌──────────────────────────────┐
│  LAYER 2: In-Flight Dedup    │
│  ─────────────────────────   │
│  • Check if same request     │
│    is already in progress    │
│  • Share Observable if so    │
│  • Prevents duplicate calls  │
└──────────────┬───────────────┘
               │ No in-flight match
               ▼
┌──────────────────────────────┐
│  LAYER 3: HTTP + Retry       │
│  ─────────────────────────   │
│  • Execute actual HTTP call  │
│  • Retry with exponential    │
│    backoff on failure        │
│  • Default: 3 retries        │
│  • Cache successful response │
└──────────────┬───────────────┘
               │
               ▼
          Response Data


Usage Example:
──────────────
coordinator.execute(
  'vehicles-page-1',              // Unique cache key
  () => api.get('/vehicles'),     // Request factory (lazy)
  { cacheTTL: 60000 }             // Optional config
).subscribe(data => ...)
```

## URL-First State Flow

The URL is the single source of truth. All state changes flow through the URL:

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           URL-FIRST STATE FLOW                                   │
└─────────────────────────────────────────────────────────────────────────────────┘

User Action (click, type, etc.)
          │
          ▼
┌─────────────────────┐
│  UI Component       │
│  (e.g., QueryControl)│
└─────────┬───────────┘
          │ emits event / calls service
          ▼
┌─────────────────────┐
│  UrlStateService    │  ◀─── SINGLE POINT OF URL MODIFICATION
│  setParams()        │
└─────────┬───────────┘
          │ router.navigate()
          ▼
┌─────────────────────┐
│  Angular Router     │
│  (URL changes)      │
└─────────┬───────────┘
          │ NavigationEnd event
          ▼
┌─────────────────────┐
│  UrlStateService    │
│  watchParams()      │
└─────────┬───────────┘
          │ params$ emits
          ▼
┌─────────────────────────────────┐
│  ResourceManagementService      │
│  - Converts URL → Filters       │
│  - Calls apiAdapter.fetchData() │
│  - Updates state$ observable    │
└─────────┬───────────────────────┘
          │ state$ emits
          ▼
┌─────────────────────┐
│  UI Components      │
│  (re-render)        │
└─────────────────────┘
```

## Popout Communication Flow

Main window and popout windows communicate via BroadcastChannel:

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        POPOUT COMMUNICATION FLOW                                 │
└─────────────────────────────────────────────────────────────────────────────────┘

                    MAIN WINDOW                          POPOUT WINDOW
                    ───────────                          ─────────────

  ┌────────────────────────────┐            ┌────────────────────────────┐
  │   PopOutManagerService     │            │   PopOutContextService     │
  │   - openPopOut()           │            │   - initializeAsPopOut()   │
  │   - broadcastState()       │            │   - sendMessage()          │
  │   - manages windows        │            │   - getMessages$()         │
  └────────────┬───────────────┘            └─────────────┬──────────────┘
               │                                          │
               │         BroadcastChannel                 │
               │◀─────────────────────────────────────────│
               │          (panel-{panelId})               │
               │─────────────────────────────────────────▶│
               │                                          │
               ▼                                          ▼

  Messages sent:                             Messages sent:
  ─────────────                              ─────────────
  • STATE_UPDATE                             • PANEL_READY
    (state + filterOptionsCache)             • URL_PARAMS_CHANGED
  • CLOSE_POPOUT                             • CLEAR_ALL_FILTERS
                                             • CHART_CLICKED
```

## Service Dependency Graph

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         SERVICE DEPENDENCY GRAPH                                 │
└─────────────────────────────────────────────────────────────────────────────────┘

                          ┌─────────────────────┐
                          │    Angular Router   │
                          │   (providedIn: root)│
                          └──────────┬──────────┘
                                     │
                          ┌──────────▼──────────┐
                          │   UrlStateService   │
                          │  (providedIn: root) │
                          └──────────┬──────────┘
                                     │
     ┌───────────────────────────────┼───────────────────────────────┐
     │                               │                               │
     ▼                               ▼                               ▼
┌─────────────────┐     ┌────────────────────────┐     ┌─────────────────────┐
│ FilterOptions   │     │ ResourceManagement     │     │ PopOutContext       │
│ Service         │     │ Service                │     │ Service             │
│ (root)          │     │ (per-component)        │     │ (root)              │
└────────┬────────┘     └───────────┬────────────┘     └──────────┬──────────┘
         │                          │                              │
         │                          ▼                              │
         │              ┌────────────────────────┐                 │
         │              │    DomainConfig        │                 │
         │              │    (injected)          │                 │
         │              │    - apiAdapter        │                 │
         │              │    - urlMapper         │                 │
         │              └───────────┬────────────┘                 │
         │                          │                              │
         │                          ▼                              ▼
         │              ┌────────────────────────┐     ┌─────────────────────┐
         │              │ RequestCoordinator     │     │ PopOutManager       │
         │              │ Service (root)         │     │ Service             │
         │              │ - cache                │     │ (per-component)     │
         │              │ - deduplication        │     └─────────────────────┘
         │              │ - retry                │
         │              └───────────┬────────────┘
         │                          │
         └────────────┬─────────────┘
                      │
                      ▼
              ┌─────────────────┐
              │   ApiService    │
              │   (root)        │
              └────────┬────────┘
                       │
                       ▼
              ┌─────────────────┐
              │   HttpClient    │
              │   (Angular)     │
              └─────────────────┘
```

## Filter Options Caching Flow

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                       FILTER OPTIONS CACHING FLOW                                │
└─────────────────────────────────────────────────────────────────────────────────┘

                    MAIN WINDOW                          POPOUT WINDOW
                    ───────────                          ─────────────

User clicks filter dropdown
          │
          ▼
┌─────────────────────────┐
│ QueryControlComponent   │
│ openMultiselectDialog() │
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│ FilterOptionsService    │
│ getOptions(endpoint)    │
└────────────┬────────────┘
             │
    ┌────────┴────────┐
    │ Cached?         │
    └────────┬────────┘
             │
     ┌───────┴───────┐
     │               │
    YES              NO
     │               │
     ▼               ▼
Return            ┌─────────────────────┐
cached            │ ApiService.get()    │
options           └──────────┬──────────┘
                             │
                             ▼
                  ┌─────────────────────┐
                  │ Cache response      │
                  │ Emit cache$ update  │
                  └──────────┬──────────┘
                             │
                             ▼
                  ┌─────────────────────┐
                  │ DiscoverComponent   │      ──────────────────────────────▶
                  │ subscribes to       │      PopOutManagerService
                  │ cache$ changes      │      broadcastState(state, cache)
                  └─────────────────────┘                    │
                                                             │
                                                             ▼
                                              ┌─────────────────────────────┐
                                              │ PopOutContextService        │
                                              │ receives STATE_UPDATE       │
                                              └──────────────┬──────────────┘
                                                             │
                                                             ▼
                                              ┌─────────────────────────────┐
                                              │ FilterOptionsService        │
                                              │ syncFromExternal(cache)     │
                                              └──────────────┬──────────────┘
                                                             │
                                                             ▼
                                              ┌─────────────────────────────┐
                                              │ QueryControlComponent       │
                                              │ uses cached options         │
                                              │ (NO API CALL)               │
                                              └─────────────────────────────┘
```

## Service Scopes

| Service | Scope | Purpose |
|---------|-------|---------|
| `UrlStateService` | root (singleton) | Single source of truth for URL state |
| `ApiService` | root (singleton) | HTTP client wrapper |
| `RequestCoordinatorService` | root (singleton) | Request caching, deduplication, retry |
| `FilterOptionsService` | root (singleton) | Caches filter dropdown options |
| `PopOutContextService` | root (singleton) | Detects popout context, messaging |
| `DomainConfigRegistry` | root (singleton) | Stores domain configurations |
| `ErrorNotificationService` | root (singleton) | Toast/snackbar error display |
| `ResourceManagementService` | per-component | Manages state for each discover page |
| `PopOutManagerService` | per-component | Manages popout windows for each page |

## Request Coordinator vs Filter Options Service

These two caching services have different purposes:

| Aspect | RequestCoordinatorService | FilterOptionsService |
|--------|---------------------------|----------------------|
| **Purpose** | General HTTP request optimization | Filter dropdown options for popouts |
| **Cache Key** | Custom string (e.g., `vehicles-page-1`) | API endpoint URL |
| **TTL** | Configurable (default 30s) | No expiry (session-based) |
| **Deduplication** | Yes (in-flight requests) | No |
| **Retry** | Yes (exponential backoff) | No |
| **Cross-Window** | No | Yes (syncs to popouts via BroadcastChannel) |
| **Used By** | Domain apiAdapters | QueryControlComponent |
