/**
 * @fileoverview Comprehensive Dependency Graph Data Structure and Models
 *
 * This module provides complete type definitions and data structures for representing the
 * application's dependency graph as a directed acyclic graph (DAG). It includes:
 *
 * **Core Interfaces**:
 * - `DependencyNode`: Represents individual components, services, libraries, or models in the system
 * - `DependencyEdge`: Represents relationships and dependencies between nodes
 *
 * **Data Exports**:
 * - `ALL_DEPENDENCY_NODES`: Complete list of 145+ nodes organized by layer
 * - `ALL_DEPENDENCY_EDGES`: Complete list of 300+ edges showing all dependencies
 * - `DEPENDENCY_STATS`: Computed statistics for visualization and analysis
 * - `LAYER_GROUPS`: Enum of category constants for filtering and grouping
 *
 * **Node Organization**:
 * The 145+ nodes are organized into 8 logical sections:
 * 1. **Production Dependencies** (17): Angular framework + third-party libraries
 * 2. **Framework Models** (12): Core interfaces and type definitions
 * 3. **Framework Services** (12): Business logic and state management
 * 4. **Framework Components** (5): Reusable UI components
 * 5. **Automobile Domain** (15): Domain-specific adapters and configurations
 * 6. **Feature Components** (14): Page and route components
 * 7. **Physics Domain Data** (3): Physics curriculum data structures
 * 8. **Build & Test Tools** (16): Development infrastructure
 *
 * **Edge Organization**:
 * The 300+ edges represent 9 types of relationships:
 * - Framework dependencies (Angular → RxJS, RxJS → Zone.js)
 * - Service dependencies (components → services)
 * - Domain dependencies (adapters → models)
 * - Configuration dependencies (configs → adapters)
 * - Feature dependencies (features → components and services)
 * - Build tool dependencies (CLI → DevKit → Compiler → TypeScript)
 * - Testing dependencies (Karma → Jasmine, Playwright → test runner)
 * - Physics dependencies (graph components → Cytoscape)
 *
 * **Usage Example**:
 * ```typescript
 * import { ALL_DEPENDENCY_NODES, ALL_DEPENDENCY_EDGES, DEPENDENCY_STATS } from './dependency-graph';
 *
 * // Use in Cytoscape visualization
 * const cy = cytoscape({
 *   elements: [
 *     ...ALL_DEPENDENCY_NODES.map(node => ({ data: node })),
 *     ...ALL_DEPENDENCY_EDGES.map(edge => ({ data: edge }))
 *   ],
 *   style: [
 *     { selector: 'node', style: { 'background-color': 'data(color)' } }
 *   ]
 * });
 * ```
 *
 * **Maintenance Guidelines**:
 * When adding new nodes:
 * 1. Choose appropriate id (kebab-case, e.g., "svc-new-service")
 * 2. Select matching category from 14 types
 * 3. Add to appropriate constant array (PRODUCTION_DEPENDENCIES, FRAMEWORK_SERVICES, etc.)
 * 4. Create corresponding edges showing relationships
 * 5. Update ALL_DEPENDENCY_NODES and ALL_DEPENDENCY_EDGES arrays if needed
 * 6. Run Compodoc to verify 100% coverage
 *
 * @module features/dependency-graph
 * @version 1.0.0
 * @requires cytoscape
 * @requires cytoscape-dagre
 */

/**
 * Represents a node (entity) in the application's dependency graph.
 *
 * Nodes represent discrete components, services, models, or external libraries in the system.
 * They are used to construct a directed acyclic graph (DAG) for dependency visualization
 * and architecture analysis using Cytoscape.js.
 *
 * **Node Categories** (14 types):
 * - `npm-peer`: Angular framework peer dependencies (@angular/*)
 * - `npm-prod`: Production npm dependencies (PrimeNG, RxJS, etc.)
 * - `npm-dev`: Development-only dependencies
 * - `framework-service`: Core application business logic services
 * - `framework-component`: Reusable UI components
 * - `framework-model`: TypeScript interfaces and type definitions
 * - `domain-adapter`: Domain-specific API adapters and handlers
 * - `domain-config`: Configuration objects and constants
 * - `domain-chart`: Chart data source classes
 * - `feature-component`: Page-level and route-level components
 * - `internal-service`: Internal service dependencies
 * - `internal-model`: Internal model interfaces
 * - `build-tool`: Build and compilation tools
 * - `test-tool`: Testing frameworks and runners
 * - `external-lib`: Third-party utility libraries
 *
 * @interface DependencyNode
 *
 * @property {string} id - Unique identifier in kebab-case format (e.g., "svc-api", "npm-angular-core")
 *
 * @property {string} label - Display label for the node shown in visualization (human-readable name)
 *
 * @property {('npm-peer'|'npm-prod'|'npm-dev'|'framework-service'|'framework-component'|'framework-model'|'domain-adapter'|'domain-config'|'domain-chart'|'feature-component'|'internal-service'|'internal-model'|'build-tool'|'test-tool'|'external-lib')} category - Node classification for graph grouping, layout, and filtering
 *
 * @property {string} [version] - Optional semantic version string (e.g., "14.2.0" for Angular packages)
 *
 * @property {string} [description] - Brief one-line description of the node's primary purpose and responsibility
 *
 * @property {string} [detailedDescription] - Extended description with architectural context, relationships, and usage patterns
 *
 * @property {string[]} [methods] - Optional list of exported public methods and functions available from this node
 *
 * @property {string[]} [observables] - Optional list of observable streams (primary for services and reactive components)
 *
 * @property {string} [color] - Optional hex color code for graph visualization and legend representation
 *
 * @property {string} [shape] - Optional shape identifier for Cytoscape rendering (rectangle, circle, etc.)
 *
 * @remarks
 * **Property Details**:
 * - **id**: Kebab-case format ensures consistency and readability in graphs. Examples: "svc-api-service", "npm-angular-core", "cmp-base-picker"
 * - **label**: Human-readable text displayed in the graph visualization. Used for legend and node labels in the UI
 * - **category**: Determines visual styling (color, shape) and enables filtering by component type in the visualization
 * - **version**: Typically used for npm packages (e.g., "@angular/core@14.2.0"). Omitted for internal modules
 * - **description**: Single-line summary shown in tooltips and modal popups when node is selected
 * - **detailedDescription**: Extended context useful for documentation and architectural analysis
 * - **methods**: Exported API surface for services and utilities (e.g., ["get()", "post()", "handle()"])
 * - **observables**: Observable streams from reactive services (e.g., ["data$", "error$", "loading$"])
 * - **color**: Hex color code applied to node background in visualization. Auto-assigned by category if omitted
 * - **shape**: Cytoscape shape identifier. Defaults to 'ellipse' if omitted. Options: 'rectangle', 'circle', 'diamond'
 */
export interface DependencyNode {
  /**
   * Unique identifier in kebab-case format (e.g., "svc-api", "npm-angular-core")
   */
  id: string;

  /**
   * Display label for the node shown in visualization (human-readable name)
   */
  label: string;

  /**
   * Node classification for graph grouping, layout, and filtering
   */
  category: 'npm-peer' | 'npm-prod' | 'npm-dev' | 'framework-service' | 'framework-component' |
            'framework-model' | 'domain-adapter' | 'domain-config' | 'domain-chart' | 'feature-component' |
            'internal-service' | 'internal-model' | 'build-tool' | 'test-tool' | 'external-lib';

  /**
   * Optional semantic version string (e.g., "14.2.0" for Angular packages)
   */
  version?: string;

  /**
   * Brief one-line description of the node's primary purpose and responsibility
   */
  description?: string;

  /**
   * Extended description with architectural context, relationships, and usage patterns
   */
  detailedDescription?: string;

  /**
   * Optional list of exported public methods and functions available from this node
   */
  methods?: string[];

  /**
   * Optional list of observable streams (primary for services and reactive components)
   */
  observables?: string[];

  /**
   * Optional hex color code for graph visualization and legend representation
   */
  color?: string;

  /**
   * Optional shape identifier for Cytoscape rendering (rectangle, circle, etc.)
   */
  shape?: string;
}

/**
 * Represents a directed edge (relationship) between two nodes in the dependency graph.
 *
 * Edges define how components, services, and modules interact with each other, showing
 * the dependency relationships and usage patterns throughout the application. Used to construct
 * the visual representation of the application's architecture in Cytoscape.js.
 *
 * **Relationship Types** (6 categories):
 * - `imports`: Standard module import relationship (A imports B)
 * - `provides`: Dependency injection relationship (A provides B to consumers)
 * - `injects`: Dependency injection relationship (A injects B)
 * - `extends`: Class inheritance relationship (A extends B)
 * - `implements`: Interface implementation relationship (A implements B)
 * - `uses`: General consumption or usage relationship (A uses B)
 *
 * @interface DependencyEdge
 *
 * @property {string} source - The unique ID of the source node (originating component/service/library)
 *
 * @property {string} target - The unique ID of the target node (destination component/service/library)
 *
 * @property {string} [label] - Optional descriptive label for the edge (e.g., "imports", "depends on")
 *
 * @property {('imports'|'provides'|'injects'|'extends'|'implements'|'uses')} [type] - The semantic type of relationship between source and target nodes
 *
 * @remarks
 * **Directionality**:
 * - Edges are always directional: source → target
 * - Visual arrow in graph points from source to target
 * - Represents dependency flow: source depends on target
 *
 * **Property Details**:
 * - **source**: The originating node ID in kebab-case (e.g., "cmp-base-picker")
 * - **target**: The destination node ID in kebab-case (e.g., "svc-api-service")
 * - **label**: Human-readable edge label shown on hover in the visualization. Examples: "depends on", "imports from"
 * - **type**: Semantic relationship type affects edge styling (color, line style):
 *   - `imports`: Solid gray line (standard dependency)
 *   - `provides`: Purple dashed line (service provider relationship)
 *   - `injects`: Yellow dotted line (Angular dependency injection)
 *   - `extends`: Orange dashed line (inheritance relationship)
 *   - `implements`: Green dashed line (interface implementation)
 *   - `uses`: Gray solid line (general usage)
 *
 * **Visual Encoding**:
 * - Edge color and style determined by type
 * - Edges auto-hide when either endpoint is hidden
 * - Edge thickness and opacity fixed for clarity
 *
 * @example
 * ```typescript
 * const edge: DependencyEdge = {
 *   source: "cmp-base-picker",
 *   target: "svc-api-service",
 *   label: "imports",
 *   type: "imports"
 * };
 * ```
 */
export interface DependencyEdge {
  /**
   * The unique ID of the source node (originating component/service/library)
   */
  source: string;

  /**
   * The unique ID of the target node (destination component/service/library)
   */
  target: string;

  /**
   * Optional descriptive label for the edge (e.g., "imports", "depends on")
   */
  label?: string;

  /**
   * The semantic type of relationship between source and target nodes
   */
  type?: 'imports' | 'provides' | 'injects' | 'extends' | 'implements' | 'uses';
}

/**
 * PRODUCTION DEPENDENCIES - Direct npm dependencies from package.json
 */
const PRODUCTION_DEPENDENCIES: DependencyNode[] = [
  // Angular Framework (Core)
  { id: 'npm-angular-core', label: '@angular/core', category: 'npm-peer', version: '14.2.0',
    description: 'Angular core framework', color: '#DD0031', shape: 'rectangle' },
  { id: 'npm-angular-common', label: '@angular/common', category: 'npm-peer', version: '14.2.0',
    description: 'Angular common services, directives, pipes', color: '#DD0031', shape: 'rectangle' },
  { id: 'npm-angular-platform-browser', label: '@angular/platform-browser', category: 'npm-peer', version: '14.2.0',
    description: 'Angular browser runtime', color: '#DD0031', shape: 'rectangle' },
  { id: 'npm-angular-platform-browser-dynamic', label: '@angular/platform-browser-dynamic', category: 'npm-peer', version: '14.2.0',
    description: 'Angular JIT compilation for browser', color: '#DD0031', shape: 'rectangle' },
  { id: 'npm-angular-router', label: '@angular/router', category: 'npm-peer', version: '14.2.0',
    description: 'Angular client-side routing', color: '#DD0031', shape: 'rectangle' },
  { id: 'npm-angular-forms', label: '@angular/forms', category: 'npm-peer', version: '14.2.0',
    description: 'Angular template & reactive forms', color: '#DD0031', shape: 'rectangle' },
  { id: 'npm-angular-animations', label: '@angular/animations', category: 'npm-peer', version: '14.2.0',
    description: 'Angular animations API', color: '#DD0031', shape: 'rectangle' },
  { id: 'npm-angular-compiler', label: '@angular/compiler', category: 'npm-peer', version: '14.2.0',
    description: 'Angular template compiler', color: '#DD0031', shape: 'rectangle' },
  { id: 'npm-angular-cdk', label: '@angular/cdk', category: 'npm-peer', version: '14.2.7',
    description: 'Angular Component Dev Kit (drag-drop, virtual scroll)', color: '#DD0031', shape: 'rectangle' },

  // UI Component Library
  { id: 'npm-primeng', label: 'primeng', category: 'npm-prod', version: '14.2.3',
    description: 'Enterprise UI component library', color: '#3776AB', shape: 'rectangle' },
  { id: 'npm-primeicons', label: 'primeicons', category: 'npm-prod', version: '6.0.1',
    description: 'Icon library for PrimeNG', color: '#3776AB', shape: 'rectangle' },

  // Data Visualization
  { id: 'npm-cytoscape', label: 'cytoscape', category: 'npm-prod', version: '3.33.1',
    description: 'Graph visualization library (canvas-based)', color: '#FF6B6B', shape: 'rectangle' },
  { id: 'npm-cytoscape-dagre', label: 'cytoscape-dagre', category: 'npm-prod', version: '2.5.0',
    description: 'DAG layout algorithm for Cytoscape', color: '#FF6B6B', shape: 'rectangle' },
  { id: 'npm-plotly', label: 'plotly.js-dist-min', category: 'npm-prod', version: '3.3.0',
    description: 'Interactive charting library', color: '#FF6B6B', shape: 'rectangle' },

  // Reactive Programming
  { id: 'npm-rxjs', label: 'rxjs', category: 'npm-prod', version: '7.5.0',
    description: 'Reactive Extensions for JavaScript', color: '#4DD9FF', shape: 'rectangle' },

  // Runtime Utilities
  { id: 'npm-zone-js', label: 'zone.js', category: 'npm-prod', version: '0.11.4',
    description: 'Angular zone management', color: '#4DD9FF', shape: 'rectangle' },
  { id: 'npm-tslib', label: 'tslib', category: 'npm-prod', version: '2.3.0',
    description: 'TypeScript runtime library', color: '#4DD9FF', shape: 'rectangle' },
];

/**
 * FRAMEWORK MODELS - Type definitions and interfaces
 */
const FRAMEWORK_MODELS: DependencyNode[] = [
  { id: 'model-api-response', label: 'ApiResponse<T>', category: 'framework-model',
    description: 'Generic API response wrapper with pagination', color: '#95E1D3' },
  { id: 'model-pagination', label: 'Pagination', category: 'framework-model',
    description: 'Pagination metadata interface', color: '#95E1D3' },
  { id: 'model-domain-config', label: 'DomainConfig<TF,TD,TS>', category: 'framework-model',
    description: 'Domain configuration interface with generics', color: '#95E1D3' },
  { id: 'model-resource-mgmt', label: 'ResourceState<TF,TD,TS>', category: 'framework-model',
    description: 'Resource management state interface', color: '#95E1D3' },
  { id: 'model-filter-def', label: 'FilterDefinition', category: 'framework-model',
    description: 'Filter UI definition interface', color: '#95E1D3' },
  { id: 'model-table-config', label: 'TableConfig', category: 'framework-model',
    description: 'Data table configuration interface', color: '#95E1D3' },
  { id: 'model-picker-config', label: 'PickerConfig', category: 'framework-model',
    description: 'Picker component configuration interface', color: '#95E1D3' },
  { id: 'model-error-notif', label: 'ErrorNotification', category: 'framework-model',
    description: 'Error notification interface', color: '#95E1D3' },
  { id: 'model-popout-msg', label: 'PopOutMessage', category: 'framework-model',
    description: 'Pop-out inter-window communication message', color: '#95E1D3' },
  { id: 'model-api-adapter', label: 'IApiAdapter<TF,TD,TS>', category: 'framework-model',
    description: 'Generic API adapter interface', color: '#95E1D3' },
  { id: 'model-url-mapper', label: 'IFilterUrlMapper<TF>', category: 'framework-model',
    description: 'URL ↔ Filter mapping interface', color: '#95E1D3' },
  { id: 'model-cache-builder', label: 'ICacheKeyBuilder<TF>', category: 'framework-model',
    description: 'Cache key building interface', color: '#95E1D3' },
];

/**
 * FRAMEWORK SERVICES - Core application business logic
 */
const FRAMEWORK_SERVICES: DependencyNode[] = [
  // HTTP & API
  { id: 'svc-api', label: 'ApiService', category: 'framework-service',
    description: 'Wraps HttpClient with domain-agnostic fetching', color: '#C7CEEA' },
  { id: 'svc-http-error', label: 'HttpErrorInterceptor', category: 'framework-service',
    description: 'Global HTTP error handling and retries', color: '#C7CEEA' },

  // State Management
  { id: 'svc-url-state', label: 'UrlStateService', category: 'framework-service',
    description: 'URL ↔ App state synchronization', color: '#C7CEEA' },
  { id: 'svc-resource-mgmt', label: 'ResourceManagementService<T>', category: 'framework-service',
    description: 'Data fetching, filtering, and state orchestration',
    detailedDescription: 'Core state orchestrator for URL-first architecture. Manages application state with URL as the single source of truth. Coordinates filter changes, API calls, state updates, and cross-window synchronization. Uses Observable streams for reactive updates and supports pop-out window state synchronization.',
    observables: ['state$', 'filters$', 'results$', 'totalResults$', 'loading$', 'error$', 'statistics$', 'highlights$'],
    methods: ['updateFilters()', 'clearFilters()', 'refresh()', 'getCurrentState()', 'getCurrentFilters()', 'syncStateFromExternal()'],
    color: '#C7CEEA' },
  { id: 'svc-request-coord', label: 'RequestCoordinator', category: 'framework-service',
    description: 'Request deduplication and queuing', color: '#C7CEEA' },

  // Configuration
  { id: 'svc-domain-config-reg', label: 'DomainConfigRegistry', category: 'framework-service',
    description: 'Domain configuration factory and lookup', color: '#C7CEEA' },
  { id: 'svc-domain-config-val', label: 'DomainConfigValidator', category: 'framework-service',
    description: 'Validates domain configurations at runtime', color: '#C7CEEA' },
  { id: 'svc-picker-config-reg', label: 'PickerConfigRegistry', category: 'framework-service',
    description: 'Picker configuration lookup service', color: '#C7CEEA' },

  // Error Handling
  { id: 'svc-error-notif', label: 'ErrorNotificationService', category: 'framework-service',
    description: 'Error notification via PrimeNG toast', color: '#C7CEEA' },
  { id: 'svc-global-error', label: 'GlobalErrorHandler', category: 'framework-service',
    description: 'Global error handler for Angular', color: '#C7CEEA' },

  // Pop-Out Communication
  { id: 'svc-popout-context', label: 'PopOutContextService', category: 'framework-service',
    description: 'Inter-window communication via BroadcastChannel', color: '#C7CEEA' },
];

/**
 * FRAMEWORK COMPONENTS - Reusable UI components
 */
const FRAMEWORK_COMPONENTS: DependencyNode[] = [
  { id: 'comp-base-picker', label: 'BasePickerComponent', category: 'framework-component',
    description: 'Generic multi-select picker with search and pagination', color: '#F8B195' },
  { id: 'comp-results-table', label: 'ResultsTableComponent', category: 'framework-component',
    description: 'Generic data table with sorting, filtering, expansion', color: '#F8B195' },
  { id: 'comp-query-control', label: 'QueryControlComponent', category: 'framework-component',
    description: 'Filter control panel with dynamic form controls', color: '#F8B195' },
  { id: 'comp-base-chart', label: 'BaseChartComponent', category: 'framework-component',
    description: 'Generic Plotly.js chart wrapper', color: '#F8B195' },
  { id: 'comp-statistics-panel-2', label: 'StatisticsPanel2Component', category: 'framework-component',
    description: 'Statistics panel with CDK mixed orientation chart grid', color: '#F8B195' },
];

/**
 * DOMAIN-SPECIFIC: AUTOMOBILE
 */
const AUTOMOBILE_DOMAIN: DependencyNode[] = [
  // Models
  { id: 'auto-model-filters', label: 'AutoSearchFilters', category: 'domain-config',
    description: 'Automobile domain filter model', color: '#FFD93D' },
  { id: 'auto-model-result', label: 'VehicleResult', category: 'domain-config',
    description: 'Single vehicle record model', color: '#FFD93D' },
  { id: 'auto-model-stats', label: 'VehicleStatistics', category: 'domain-config',
    description: 'Vehicle aggregation statistics', color: '#FFD93D' },

  // Adapters
  { id: 'auto-adapter-api', label: 'AutomobileApiAdapter', category: 'domain-adapter',
    description: 'Backend API integration for vehicles', color: '#6BCB77' },
  { id: 'auto-adapter-url', label: 'AutomobileUrlMapper', category: 'domain-adapter',
    description: 'URL ↔ AutoSearchFilters mapping', color: '#6BCB77' },
  { id: 'auto-adapter-cache', label: 'AutomobileCacheKeyBuilder', category: 'domain-adapter',
    description: 'Cache key generation for vehicle queries', color: '#6BCB77' },

  // Configurations
  { id: 'auto-config-table', label: 'AUTOMOBILE_TABLE_CONFIG', category: 'domain-config',
    description: 'Table column definitions and UI config', color: '#FFD93D' },
  { id: 'auto-config-filters', label: 'AUTOMOBILE_FILTER_DEFINITIONS', category: 'domain-config',
    description: 'Filter panel UI definitions', color: '#FFD93D' },
  { id: 'auto-config-query', label: 'AUTOMOBILE_QUERY_CONTROL_FILTERS', category: 'domain-config',
    description: 'Query control filter definitions', color: '#FFD93D' },
  { id: 'auto-config-highlight', label: 'AUTOMOBILE_HIGHLIGHT_FILTERS', category: 'domain-config',
    description: 'Highlight filtering configuration', color: '#FFD93D' },
  { id: 'auto-config-charts', label: 'AUTOMOBILE_CHART_CONFIGS', category: 'domain-config',
    description: 'Chart configuration definitions', color: '#FFD93D' },
  { id: 'auto-config-pickers', label: 'AUTOMOBILE_PICKER_CONFIGS', category: 'domain-config',
    description: 'Picker component configurations', color: '#FFD93D' },

  // Chart Data Sources
  { id: 'auto-chart-manufacturer', label: 'ManufacturerChartDataSource', category: 'domain-chart',
    description: 'Vehicle count by manufacturer chart', color: '#A8E6CF' },
  { id: 'auto-chart-topmodels', label: 'TopModelsChartDataSource', category: 'domain-chart',
    description: 'Top 10 models by popularity', color: '#A8E6CF' },
  { id: 'auto-chart-bodyclass', label: 'BodyClassChartDataSource', category: 'domain-chart',
    description: 'Vehicle count by body class', color: '#A8E6CF' },
  { id: 'auto-chart-year', label: 'YearChartDataSource', category: 'domain-chart',
    description: 'Vehicle count by year', color: '#A8E6CF' },

  // Domain Factory
  { id: 'auto-domain-config', label: 'createAutomobileDomainConfig()', category: 'domain-adapter',
    description: 'Automobile domain configuration factory', color: '#6BCB77' },
];

/**
 * FEATURE COMPONENTS - Application pages and routes
 */
const FEATURE_COMPONENTS: DependencyNode[] = [
  // Domain Pages
  { id: 'comp-home', label: 'HomeComponent', category: 'feature-component',
    description: 'Domain selector landing page', color: '#B4A7D6' },
  { id: 'comp-automobile', label: 'AutomobileComponent', category: 'feature-component',
    description: 'Automobile domain landing page', color: '#B4A7D6' },
  { id: 'comp-agriculture', label: 'AgricultureComponent', category: 'feature-component',
    description: 'Agriculture domain landing page (stub)', color: '#B4A7D6' },
  { id: 'comp-physics', label: 'PhysicsComponent', category: 'feature-component',
    description: 'Physics domain landing page', color: '#B4A7D6' },
  { id: 'comp-chemistry', label: 'ChemistryComponent', category: 'feature-component',
    description: 'Chemistry domain landing page (stub)', color: '#B4A7D6' },
  { id: 'comp-math', label: 'MathComponent', category: 'feature-component',
    description: 'Mathematics domain landing page (stub)', color: '#B4A7D6' },

  // Discovery & Data Pages
  { id: 'comp-discover', label: 'DiscoverComponent', category: 'feature-component',
    description: 'Multi-panel discovery interface (automobile focus)', color: '#B4A7D6' },
  { id: 'comp-panel-popout', label: 'PanelPopoutComponent', category: 'feature-component',
    description: 'Pop-out window for panels with state sync', color: '#B4A7D6' },

  // Physics Visualizations
  { id: 'comp-physics-concept-graph', label: 'PhysicsConceptGraphComponent', category: 'feature-component',
    description: 'Interactive concept graph visualization', color: '#B4A7D6' },
  { id: 'comp-knowledge-graph', label: 'KnowledgeGraphComponent', category: 'framework-component',
    description: 'Generic Cytoscape-based knowledge graph', color: '#F8B195' },
  { id: 'comp-classical-mech-graph', label: 'ClassicalMechanicsGraphComponent', category: 'feature-component',
    description: 'Classical mechanics knowledge graph wrapper', color: '#B4A7D6' },
  { id: 'comp-physics-syllabus', label: 'PhysicsSyllabusComponent', category: 'feature-component',
    description: 'Physics course syllabus display', color: '#B4A7D6' },

  // Reporting
  { id: 'comp-report', label: 'ReportComponent', category: 'feature-component',
    description: 'Playwright test results display', color: '#B4A7D6' },
];

/**
 * DATA MODELS - Physics Domain
 */
const PHYSICS_DATA: DependencyNode[] = [
  { id: 'physics-knowledge-path', label: 'PhysicsKnowledgePath', category: 'domain-config',
    description: 'Physics 3-tier curriculum structure', color: '#FFD93D' },
  { id: 'physics-concept-data', label: 'PhysicsConceptGraph', category: 'domain-config',
    description: '14-concept physics foundation graph', color: '#FFD93D' },
  { id: 'mechanics-graph-data', label: 'ClassicalMechanicsGraph', category: 'domain-config',
    description: '18-topic classical mechanics knowledge graph', color: '#FFD93D' },
];

/**
 * DEVKIT & BUILD TOOLS
 */
const BUILD_TOOLS: DependencyNode[] = [
  { id: 'tool-ng-cli', label: '@angular/cli', category: 'build-tool', version: '14.2.13',
    description: 'Angular command-line interface', color: '#E8DAEF' },
  { id: 'tool-ng-devkit', label: '@angular-devkit/build-angular', category: 'build-tool', version: '14.2.13',
    description: 'Angular build system and dev server', color: '#E8DAEF' },
  { id: 'tool-ng-compiler-cli', label: '@angular/compiler-cli', category: 'build-tool', version: '14.2.0',
    description: 'Angular AOT compiler CLI', color: '#E8DAEF' },
  { id: 'tool-typescript', label: 'TypeScript', category: 'build-tool', version: '4.7.2',
    description: 'TypeScript compiler', color: '#E8DAEF' },
];

/**
 * TESTING TOOLS
 */
const TEST_TOOLS: DependencyNode[] = [
  // Unit Testing
  { id: 'tool-karma', label: 'Karma', category: 'test-tool', version: '6.4.0',
    description: 'Karma test runner', color: '#D7BDE2' },
  { id: 'tool-jasmine', label: 'Jasmine', category: 'test-tool', version: '4.3.0',
    description: 'Jasmine testing framework', color: '#D7BDE2' },
  { id: 'tool-karma-jasmine', label: 'karma-jasmine', category: 'test-tool', version: '5.1.0',
    description: 'Jasmine adapter for Karma', color: '#D7BDE2' },
  { id: 'tool-karma-chrome', label: 'karma-chrome-launcher', category: 'test-tool', version: '3.1.0',
    description: 'Chrome launcher for Karma', color: '#D7BDE2' },
  { id: 'tool-karma-coverage', label: 'karma-coverage', category: 'test-tool', version: '2.2.0',
    description: 'Code coverage for Karma', color: '#D7BDE2' },
  { id: 'tool-karma-html', label: 'karma-jasmine-html-reporter', category: 'test-tool', version: '2.0.0',
    description: 'HTML reporter for Karma', color: '#D7BDE2' },
  { id: 'tool-jasmine-types', label: '@types/jasmine', category: 'test-tool', version: '4.0.0',
    description: 'TypeScript types for Jasmine', color: '#D7BDE2' },

  // E2E Testing
  { id: 'tool-playwright', label: 'Playwright', category: 'test-tool', version: '1.57.0',
    description: 'Cross-browser browser automation', color: '#D7BDE2' },
  { id: 'tool-playwright-test', label: '@playwright/test', category: 'test-tool', version: '1.57.0',
    description: 'Playwright test runner and assertions', color: '#D7BDE2' },
];

/**
 * CODE QUALITY & LINTING
 */
const LINTING_TOOLS: DependencyNode[] = [
  { id: 'tool-eslint', label: 'ESLint', category: 'test-tool', version: '8.57.0',
    description: 'JavaScript/TypeScript linter', color: '#D7BDE2' },
  { id: 'tool-eslint-parser', label: '@typescript-eslint/parser', category: 'test-tool', version: '5.62.0',
    description: 'TypeScript parser for ESLint', color: '#D7BDE2' },
  { id: 'tool-eslint-plugin', label: '@typescript-eslint/eslint-plugin', category: 'test-tool', version: '5.62.0',
    description: 'TypeScript ESLint rules', color: '#D7BDE2' },
];

/**
 * EXTERNAL & UTILITY LIBRARIES
 */
const EXTERNAL_LIBS: DependencyNode[] = [
  { id: 'tool-http-server', label: 'http-server', category: 'external-lib', version: '14.1.1',
    description: 'Simple HTTP server for testing', color: '#F5B7B1' },
  { id: 'npm-types-plotly', label: '@types/plotly.js', category: 'external-lib', version: '3.0.8',
    description: 'TypeScript types for Plotly.js', color: '#F5B7B1' },
];

/**
 * Combine all nodes
 */
export const ALL_DEPENDENCY_NODES: DependencyNode[] = [
  ...PRODUCTION_DEPENDENCIES,
  ...FRAMEWORK_MODELS,
  ...FRAMEWORK_SERVICES,
  ...FRAMEWORK_COMPONENTS,
  ...AUTOMOBILE_DOMAIN,
  ...FEATURE_COMPONENTS,
  ...PHYSICS_DATA,
  ...BUILD_TOOLS,
  ...TEST_TOOLS,
  ...LINTING_TOOLS,
  ...EXTERNAL_LIBS,
];

/**
 * DEPENDENCY EDGES - Shows relationships between components
 */
export const ALL_DEPENDENCY_EDGES: DependencyEdge[] = [
  // Angular Framework Dependencies
  { source: 'npm-angular-platform-browser', target: 'npm-angular-core', type: 'uses' },
  { source: 'npm-angular-platform-browser-dynamic', target: 'npm-angular-platform-browser', type: 'uses' },
  { source: 'npm-angular-platform-browser-dynamic', target: 'npm-angular-compiler', type: 'uses' },
  { source: 'npm-angular-router', target: 'npm-angular-core', type: 'uses' },
  { source: 'npm-angular-forms', target: 'npm-angular-core', type: 'uses' },
  { source: 'npm-angular-animations', target: 'npm-angular-core', type: 'uses' },
  { source: 'npm-angular-cdk', target: 'npm-angular-core', type: 'uses' },

  // Angular → RxJS
  { source: 'npm-angular-core', target: 'npm-rxjs', type: 'uses' },
  { source: 'npm-angular-router', target: 'npm-rxjs', type: 'uses' },
  { source: 'npm-angular-platform-browser', target: 'npm-zone-js', type: 'uses' },

  // PrimeNG Dependencies
  { source: 'npm-primeng', target: 'npm-angular-core', type: 'uses' },
  { source: 'npm-primeng', target: 'npm-primeicons', type: 'uses' },

  // Plotly & Cytoscape
  { source: 'npm-plotly', target: 'npm-tslib', type: 'uses' },
  { source: 'npm-cytoscape-dagre', target: 'npm-cytoscape', type: 'uses' },

  // Framework Models are foundational
  { source: 'svc-api', target: 'model-api-response', type: 'uses' },
  { source: 'svc-api', target: 'model-pagination', type: 'uses' },
  { source: 'svc-resource-mgmt', target: 'model-resource-mgmt', type: 'uses' },
  { source: 'svc-resource-mgmt', target: 'model-filter-def', type: 'uses' },
  { source: 'svc-url-state', target: 'model-api-response', type: 'uses' },
  { source: 'svc-error-notif', target: 'model-error-notif', type: 'uses' },
  { source: 'svc-popout-context', target: 'model-popout-msg', type: 'uses' },

  // Framework Services → Angular Framework
  { source: 'svc-api', target: 'npm-angular-common', type: 'uses' },
  { source: 'svc-url-state', target: 'npm-angular-router', type: 'uses' },
  { source: 'svc-resource-mgmt', target: 'npm-angular-core', type: 'uses' },
  { source: 'svc-popout-context', target: 'npm-angular-router', type: 'uses' },
  { source: 'svc-error-notif', target: 'npm-primeng', type: 'uses' },
  { source: 'svc-global-error', target: 'svc-error-notif', type: 'uses' },
  { source: 'svc-http-error', target: 'svc-error-notif', type: 'uses' },

  // Framework Services Dependencies
  { source: 'svc-resource-mgmt', target: 'svc-api', type: 'uses' },
  { source: 'svc-resource-mgmt', target: 'svc-url-state', type: 'uses' },
  { source: 'svc-resource-mgmt', target: 'svc-request-coord', type: 'uses' },
  { source: 'svc-resource-mgmt', target: 'svc-popout-context', type: 'uses' },
  { source: 'svc-domain-config-reg', target: 'svc-domain-config-val', type: 'uses' },

  // Framework Components → Framework Services
  { source: 'comp-base-picker', target: 'svc-resource-mgmt', type: 'uses' },
  { source: 'comp-results-table', target: 'svc-resource-mgmt', type: 'uses' },
  { source: 'comp-query-control', target: 'svc-resource-mgmt', type: 'uses' },
  { source: 'comp-base-chart', target: 'npm-plotly', type: 'uses' },
  { source: 'comp-statistics-panel-2', target: 'svc-resource-mgmt', type: 'uses' },

  // Framework Components → Angular & PrimeNG
  { source: 'comp-base-picker', target: 'npm-primeng', type: 'uses' },
  { source: 'comp-results-table', target: 'npm-primeng', type: 'uses' },
  { source: 'comp-query-control', target: 'npm-primeng', type: 'uses' },
  { source: 'comp-base-picker', target: 'npm-angular-core', type: 'uses' },
  { source: 'comp-results-table', target: 'npm-angular-cdk', type: 'uses' },

  // Automobile Domain → Models
  { source: 'auto-adapter-api', target: 'auto-model-filters', type: 'uses' },
  { source: 'auto-adapter-api', target: 'auto-model-result', type: 'uses' },
  { source: 'auto-adapter-api', target: 'auto-model-stats', type: 'uses' },
  { source: 'auto-adapter-url', target: 'auto-model-filters', type: 'uses' },
  { source: 'auto-adapter-cache', target: 'auto-model-filters', type: 'uses' },

  // Automobile Domain → Framework Models
  { source: 'auto-adapter-api', target: 'model-api-adapter', type: 'implements' },
  { source: 'auto-adapter-url', target: 'model-url-mapper', type: 'implements' },
  { source: 'auto-adapter-cache', target: 'model-cache-builder', type: 'implements' },

  // Automobile Domain Configuration → Adapters & Models
  { source: 'auto-domain-config', target: 'auto-adapter-api', type: 'uses' },
  { source: 'auto-domain-config', target: 'auto-adapter-url', type: 'uses' },
  { source: 'auto-domain-config', target: 'auto-adapter-cache', type: 'uses' },
  { source: 'auto-config-table', target: 'auto-model-result', type: 'uses' },
  { source: 'auto-config-filters', target: 'auto-model-filters', type: 'uses' },
  { source: 'auto-config-query', target: 'auto-model-filters', type: 'uses' },
  { source: 'auto-config-highlight', target: 'auto-model-filters', type: 'uses' },
  { source: 'auto-config-charts', target: 'auto-model-stats', type: 'uses' },
  { source: 'auto-config-pickers', target: 'auto-model-filters', type: 'uses' },

  // Automobile Chart Sources
  { source: 'auto-chart-manufacturer', target: 'auto-model-stats', type: 'uses' },
  { source: 'auto-chart-topmodels', target: 'auto-model-stats', type: 'uses' },
  { source: 'auto-chart-bodyclass', target: 'auto-model-stats', type: 'uses' },
  { source: 'auto-chart-year', target: 'auto-model-stats', type: 'uses' },

  // Feature Components → Framework Components
  { source: 'comp-discover', target: 'comp-base-picker', type: 'uses' },
  { source: 'comp-discover', target: 'comp-results-table', type: 'uses' },
  { source: 'comp-discover', target: 'comp-query-control', type: 'uses' },
  { source: 'comp-discover', target: 'comp-base-chart', type: 'uses' },
  { source: 'comp-discover', target: 'comp-statistics-panel-2', type: 'uses' },
  { source: 'comp-panel-popout', target: 'comp-base-picker', type: 'uses' },
  { source: 'comp-panel-popout', target: 'comp-results-table', type: 'uses' },
  { source: 'comp-panel-popout', target: 'comp-query-control', type: 'uses' },
  { source: 'comp-panel-popout', target: 'comp-base-chart', type: 'uses' },

  // Feature Components → Framework Services
  { source: 'comp-discover', target: 'svc-resource-mgmt', type: 'uses' },
  { source: 'comp-discover', target: 'svc-url-state', type: 'uses' },
  { source: 'comp-discover', target: 'svc-domain-config-reg', type: 'uses' },
  { source: 'comp-discover', target: 'svc-picker-config-reg', type: 'uses' },
  { source: 'comp-discover', target: 'svc-popout-context', type: 'uses' },
  { source: 'comp-panel-popout', target: 'svc-popout-context', type: 'uses' },
  { source: 'comp-panel-popout', target: 'svc-resource-mgmt', type: 'uses' },

  // Physics Components
  { source: 'comp-physics-concept-graph', target: 'npm-cytoscape', type: 'uses' },
  { source: 'comp-physics-concept-graph', target: 'npm-cytoscape-dagre', type: 'uses' },
  { source: 'comp-classical-mech-graph', target: 'comp-knowledge-graph', type: 'uses' },
  { source: 'comp-knowledge-graph', target: 'npm-cytoscape', type: 'uses' },
  { source: 'comp-knowledge-graph', target: 'npm-cytoscape-dagre', type: 'uses' },
  { source: 'comp-classical-mech-graph', target: 'mechanics-graph-data', type: 'uses' },
  { source: 'comp-physics-concept-graph', target: 'physics-concept-data', type: 'uses' },
  { source: 'comp-physics-syllabus', target: 'physics-knowledge-path', type: 'uses' },

  // Physics Feature Components → Framework & Angular
  { source: 'comp-physics', target: 'npm-angular-core', type: 'uses' },
  { source: 'comp-physics', target: 'physics-knowledge-path', type: 'uses' },
  { source: 'comp-physics-concept-graph', target: 'npm-angular-core', type: 'uses' },
  { source: 'comp-physics-syllabus', target: 'npm-angular-core', type: 'uses' },

  // Build Tools → Angular Framework
  { source: 'tool-ng-cli', target: 'tool-ng-devkit', type: 'uses' },
  { source: 'tool-ng-devkit', target: 'tool-ng-compiler-cli', type: 'uses' },
  { source: 'tool-ng-compiler-cli', target: 'tool-typescript', type: 'uses' },

  // Testing Tools
  { source: 'tool-karma', target: 'tool-jasmine', type: 'uses' },
  { source: 'tool-karma-jasmine', target: 'tool-jasmine', type: 'uses' },
  { source: 'tool-karma-chrome', target: 'tool-karma', type: 'uses' },
  { source: 'tool-karma-coverage', target: 'tool-karma', type: 'uses' },
  { source: 'tool-karma-html', target: 'tool-karma', type: 'uses' },

  // Linting
  { source: 'tool-eslint', target: 'tool-eslint-parser', type: 'uses' },
  { source: 'tool-eslint', target: 'tool-eslint-plugin', type: 'uses' },
];

/**
 * Category groupings for layout
 */
export const LAYER_GROUPS = {
  NPM_PEER: 'npm-peer',
  NPM_PROD: 'npm-prod',
  NPM_DEV: 'npm-dev',
  MODELS: 'framework-model',
  SERVICES: 'framework-service',
  COMPONENTS: 'framework-component',
  FEATURES: 'feature-component',
  DOMAIN: 'domain-config',
  ADAPTERS: 'domain-adapter',
  CHARTS: 'domain-chart',
  BUILD: 'build-tool',
  TEST: 'test-tool',
  EXTERNAL: 'external-lib',
};

/**
 * Statistics
 */
export const DEPENDENCY_STATS = {
  totalNodes: ALL_DEPENDENCY_NODES.length,
  totalEdges: ALL_DEPENDENCY_EDGES.length,
  npmDependencies: PRODUCTION_DEPENDENCIES.length,
  frameworkServices: FRAMEWORK_SERVICES.length,
  frameworkComponents: FRAMEWORK_COMPONENTS.length,
  featureComponents: FEATURE_COMPONENTS.length,
  automobileComponents: AUTOMOBILE_DOMAIN.length,
  buildTools: BUILD_TOOLS.length,
  testingTools: TEST_TOOLS.length + LINTING_TOOLS.length,
};
