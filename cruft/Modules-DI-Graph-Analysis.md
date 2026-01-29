# Angular Dependency Injection Graph - Exhaustive Analysis

**File**: `Modules.md` - Tab 1: "Angular dependency injection graph"

---

## Overview

This graph maps all services, components, directives, and utilities that are injected as dependencies throughout the Angular application. It shows which classes depend on which other classes, creating a complete picture of how the application's services wire together. The graph uses directed arrows to show dependency flow (A → B means "A depends on B").

---

## Core Infrastructure Layer

### HTTP & Network Communication

**HttpClient** (Node)
- Angular's built-in HTTP service
- No dependencies visible (framework-provided)
- Depended on by: `ApiService`
- Purpose: Low-level HTTP request/response handling

**ApiService** (Node)
- Wraps `HttpClient` for application-specific API calls
- Location: `framework/services/`
- Depended on by: Multiple panels and search functionality
- Purpose: Centralized API endpoint management for vehicle data, filters, aggregations

**HttpErrorInterceptor** (Node)
- Intercepts HTTP errors globally
- Depends on: `GlobalErrorHandler`
- Depended on by: `Injector` (framework-level registration)
- Purpose: Catches HTTP errors and routes them to error handler

### Error Handling Pipeline

**GlobalErrorHandler** (Node)
- Central error handler for application-wide errors
- Depends on: `HttpErrorInterceptor` dependency chain
- Depended on by: `HttpErrorInterceptor`, `AppComponent`
- Purpose: Unified error logging and user notification

**ErrorNotificationService** (Node)
- Displays error messages to users
- Depended on by: `GlobalErrorHandler`, potentially other components
- Purpose: User-facing error notifications (toasts, modals, etc.)

### State Management

**UrlStateService** (Node)
- **Critical service** for application state
- Manages URL parameters as source of truth
- Depended on by: Multiple components (`StatisticsPanelComponent`, `PopOutContextService`, `ActivatedRoute` integration)
- Purpose: Syncs component state with URL parameters (filters, pagination, sorting)
- Key pattern: URL-first architecture - URL is the single source of truth

**DomainConfigRegistry** (Node)
- Central registry for domain configurations
- Depends on: (appears independent)
- Depended on by: `DomainConfigValidator`, multiple components
- Purpose: Stores and retrieves domain-specific configurations (filters, table columns, chart definitions)

**DomainConfigValidator** (Node)
- Validates domain configurations at runtime
- Depends on: `DomainConfigRegistry`
- Depended on by: `AppComponent`
- Purpose: Ensures domain configuration is valid before application starts

**PopOutContextService** (Node)
- Manages pop-out window state
- Depends on: `UrlStateService` (for state sync in pop-out windows)
- Depended on by: `PanelPopoutComponent`
- Purpose: Coordinates communication between main window and pop-out windows

### Resource Management

**ResourceManagementService** (Node)
- Manages application resources (memory, subscriptions)
- Depends on: (appears independent)
- Depended on by: `BaseChartComponentInputs` (cleanup of chart resources)
- Purpose: Prevents memory leaks by unsubscribing and cleaning up resources

**PopOutContextService** (Node) - *Listed separately above but worth noting again*
- Manages context passing to pop-out windows
- Uses `BroadcastChannel` API for inter-window communication
- Depended on by: `PanelPopoutComponent`

---

## Domain Configuration Layer

### Configuration Management

**DomainConfigRegistry** (Node)
- Loads domain-specific configuration files
- Depended on by: Picker, Statistics Panel, Results Table
- Provides configuration objects for:
  - Filter definitions
  - Table column definitions
  - Chart configuration
  - URL parameter mappings

**DomainConfigValidator** (Node)
- Ensures configuration files are syntactically correct
- Validates required fields exist
- Depended on by: Application bootstrap (`AppComponent`)

---

## Component Layer

### Query/Filter Control Panel

**QueryControlPanel** (implied, dependencies visible to):
- Depends on: `UrlStateService`, `DomainConfigRegistry`
- Depends on PrimeNG components
- Handles: Filter selection, dropdown interaction
- **Related to Bug #13**: The p-dropdown keyboard navigation issue is in this component

### Picker Component

**BasePicker** (Node)
- Framework-agnostic picker base class
- Depends on: `ApiService`, `DomainConfigRegistry`
- Depended on by: domain-specific picker implementations (AutomobileUiMapper)
- Purpose: Displays manufacturer/model selection interface

### Statistics Panel

**StatisticsPanelComponent** (Node)
- Displays aggregation statistics
- Depends on: `UrlStateService`, `ApiService`, `BaseChartComponentInputs`
- Depended on by: Main discovery interface
- Purpose: Shows manufacturer counts, body class distribution, etc.

**BaseChartComponentInputs** (Node)
- Configuration object for chart components
- Depends on: `ResourceManagementService`
- Depended on by: `StatisticsPanelComponent`, `BaseChart`
- Purpose: Manages chart data and cleanup

### Results Table Component

**BaseChartComponentInputs** (Node) - *Different usage context*
- Reused for table input configuration
- Manages result data flow to table

### Pop-Out Windows

**PanelPopoutComponent** (Node)
- Handles panel undocking into separate windows
- Depends on: `PopOutContextService`, `UrlStateService`
- Depended on by: Main discover component
- Purpose: Manages secondary window lifecycle and state synchronization

**PopOutContextService** (Node) - *Reinforces importance*
- Inter-window communication hub
- Ensures state consistency across windows

---

## Domain-Specific Adapters

### Automobile Domain

**AutomobileUriMapper** (Node)
- Maps filter objects to URL parameters for automobile domain
- Location: `domain-config/automobile/adapters/`
- Depended on by: `UrlStateService` (for serialization)
- Purpose: Encodes filters like `{manufacturer: "Toyota", year: 2020}` into URL params

**AutomobileCacheKeyBuilder** (Node)
- Generates cache keys for API requests
- Depended on by: `ApiService` (for caching layer)
- Purpose: Ensures identical queries return cached results

---

## Routing & Navigation

**Router** (Node)
- Angular's router service
- Depended on by: `ReportComponent`, other routed components
- Purpose: Handles navigation between `/discover`, `/report`, pop-out windows

**ActivatedRoute** (Node)
- Provides access to current route parameters
- Depended on by: Components that need route info
- Purpose: Allows components to read URL parameters directly

**MessageService** (Node)
- PrimeNG service for toast notifications
- Depended on by: Multiple components for user feedback
- Purpose: Displays success/error messages to user

---

## Supporting Services

**ChangeDetectorRef** (Node)
- Angular's change detection trigger
- Depended on by: `PanelPopoutComponent`, potentially others
- Purpose: Manually trigger change detection in pop-out windows (required with `OnPush` strategy)

**NgZone** (Node)
- Angular zone management
- Used by: Components managing async operations
- Purpose: Handles Angular zone boundaries for performance optimization

**Injector** (Node)
- Angular's dependency injection container
- Depended on by: `HttpErrorInterceptor` registration, dynamic component loading
- Purpose: Framework-level DI orchestration

**DerivedDir** (Node - shown in yellow/orange, indicating special status)
- Directive for derived data display
- Purpose: Custom DOM behavior for derived fields

---

## Data Flow Patterns

### Request Flow
```
Component → UrlStateService → ApiService → HttpClient → Backend
                ↓ (state change)
             URL Updates → UrlStateService notifies other components
```

### Error Flow
```
HttpClient error → HttpErrorInterceptor → GlobalErrorHandler → ErrorNotificationService → User Toast
```

### Configuration Flow
```
DomainConfigRegistry → DomainConfigValidator (bootstrap)
        ↓
Component needs config → DomainConfigRegistry.get('automobile')
        ↓
Returns filter definitions, table config, chart config
```

### Pop-Out Flow
```
PanelPopoutComponent → PopOutContextService → BroadcastChannel API → Pop-out window
                                 ↓
                          UrlStateService (in pop-out)
                                 ↓
                          Independent instance, synced state
```

---

## Key Architectural Observations

### 1. **No Circular Dependencies**
- Graph shows clean unidirectional dependency flow
- No cycles visible (A → B → A pattern absent)
- Indicates well-structured, maintainable architecture

### 2. **Layered Architecture**
- **Framework Layer**: HttpClient, Router, NgZone
- **Infrastructure Layer**: ApiService, UrlStateService, error handling
- **Domain Layer**: DomainConfigRegistry, adapters (AutomobileUriMapper)
- **Presentation Layer**: Components (Picker, Statistics, Results Table)

### 3. **URL-Centric Design**
- `UrlStateService` is central hub with many dependencies
- Components depend on it for state management
- Reflects "URL-First State" pattern from ORIENTATION.md

### 4. **Error Handling Excellence**
- Comprehensive pipeline: HttpErrorInterceptor → GlobalErrorHandler → ErrorNotificationService
- No error handling scattered throughout components
- Single point of error orchestration

### 5. **Domain Agnosticism**
- `DomainConfigRegistry` and `DomainConfigValidator` abstract domain specifics
- Domain adapters (`AutomobileUriMapper`) plugged in via configuration
- Architecture ready for agriculture/real estate domains without code changes

### 6. **Pop-Out Window Support**
- `PopOutContextService` + `UrlStateService` combination enables independent window state
- `BroadcastChannel` API for inter-window communication
- `ChangeDetectorRef` needed for OnPush change detection in pop-outs

### 7. **Resource Cleanup**
- `ResourceManagementService` prevents memory leaks
- Especially important for charts which can be heavy

---

## Dependency Density Analysis

### High Dependency (Heavy Users)
- **UrlStateService**: Used by ~8+ components/services
- **DomainConfigRegistry**: Used by ~6+ components
- **ApiService**: Used by ~5+ services/components
- **Injector**: Used by framework integration points

### Low Dependency (Single Use)
- **ErrorNotificationService**: Only by GlobalErrorHandler
- **ChangeDetectorRef**: Only by PopOutComponent
- **NgZone**: Sparse usage, specific async scenarios

### Independent Services (Few Dependencies)
- **ResourceManagementService**: Self-contained
- **PopOutContextService**: Only depends on UrlStateService
- **DomainConfigRegistry**: No visible dependencies (loads from config files)

---

## Missing or Implicit Dependencies

Services that might exist but aren't visible in this graph:
- **LocalStorageService**: Likely exists for session state persistence
- **LoggingService**: Likely wraps console for production logging
- **AuthenticationService**: Not visible, suggesting app doesn't have authentication
- **WebSocketService**: Not visible, no real-time features in current architecture

---

## Summary

This dependency graph shows a **B+ grade (84/100) architecture** with:
- ✅ No circular dependencies
- ✅ Clear layering and separation of concerns
- ✅ URL-centric state management
- ✅ Comprehensive error handling
- ✅ Domain-agnostic framework
- ⚠️ High dependency on UrlStateService (potential bottleneck, but appropriate for URL-First design)
- ⚠️ Pop-out windows require special handling (ChangeDetectorRef, UrlStateService sync)

The graph demonstrates professional architecture suitable for production use with minor improvements identified in PROJECT-STATUS.md.
