import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { trigger, style, transition, animate } from '@angular/animations';

// @ts-ignore - cytoscape has default export
import cytoscape from 'cytoscape';
import type { Core } from 'cytoscape';

// @ts-ignore - cytoscape-dagre doesn't have type definitions
import dagre from 'cytoscape-dagre';
import {
  ALL_DEPENDENCY_NODES,
  ALL_DEPENDENCY_EDGES,
  DEPENDENCY_STATS,
  LAYER_GROUPS,
  DependencyNode
} from './dependency-graph';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

/**
 * Dependency Graph Component - Application Architecture Visualization
 *
 * Comprehensive interactive visualization of all dependencies in the generic-prime application.
 * Displays a complete directed acyclic graph (DAG) with hierarchical layout showing how all
 * parts of the application integrate and depend on each other.
 *
 * Visualized Dependencies:
 * - **NPM Packages** (18): Angular framework, RxJS, PrimeNG, Cytoscape, Plotly, build tools
 * - **Framework Models** (12): TypeScript interfaces and data structures
 * - **Framework Services** (8): API, state management, configuration, error handling
 * - **Framework Components** (5): Reusable UI widgets (picker, table, chart, etc.)
 * - **Domain Adapters** (9): Domain-specific API integrations and configurations
 * - **Feature Components** (13): Pages and route components
 * - **Data Structures** (3): Physics curriculum graphs
 * - **Build & Test Tools** (13): Webpack, Karma, Jasmine, Playwright, ESLint
 * - **External Libraries** (2): Type definitions, utilities
 *
 * **Total**: 118 nodes (dependencies), 350+ edges (relationships)
 *
 * Architecture & Features:
 * - **Cytoscape.js**: Canvas-based graph rendering with mouse interaction
 * - **Dagre Layout**: Hierarchical left-to-right directed graph layout
 * - **Interactive**: Node selection, filtering by category, search functionality
 * - **Visual Encoding**: Color-coded by node category for quick identification
 * - **Statistics Panel**: Shows dependency metrics and category breakdowns
 * - **Legend**: Color key for all node categories
 * - **Performance**: Uses ChangeDetectionStrategy.OnPush for efficient rendering
 *
 * **Node Categories & Colors**:
 * - npm-peer (Blue #DD0031): Angular framework and core dependencies
 * - npm-prod (Teal #3776AB): Production libraries (PrimeNG, Cytoscape, RxJS)
 * - framework-service (Purple #C7CEEA): Core application services
 * - framework-component (Orange #F8B195): Reusable UI components
 * - framework-model (Mint #95E1D3): TypeScript interfaces and types
 * - domain-adapter (Green #6BCB77): Domain-specific API adapters
 * - domain-config (Yellow #FFD93D): Configuration objects
 * - domain-chart (Emerald #A8E6CF): Chart data sources
 * - feature-component (Lavender #B4A7D6): Page and route components
 * - build-tool (Pink #E8DAEF): Build and compilation tools
 * - test-tool (Plum #D7BDE2): Testing frameworks and runners
 * - external-lib (Light Red #F5B7B1): Third-party utilities
 *
 * **Relationship Types**:
 * - 'imports': A imports/uses B
 * - 'provides': A provides B (dependency injection)
 * - 'injects': A injects B
 * - 'extends': A extends B (inheritance)
 * - 'implements': A implements B (interface)
 * - 'uses': General consumption/usage
 *
 * **Navigation & Interaction**:
 * - **Click nodes**: Select and view detailed information
 * - **Filter by category**: Show only specific dependency types
 * - **Search**: Filter nodes by name/id (text search)
 * - **Fit to view**: Reset zoom and pan to show entire graph
 * - **Drag nodes**: Reposition (Cytoscape default)
 * - **Zoom**: Mouse wheel or trackpad pinch gesture
 * - **Pan**: Click and drag background or middle mouse button
 *
 * **Use Cases**:
 * - Understand application architecture and dependency layers
 * - Identify tightly coupled components
 * - Plan refactoring and modularization
 * - Document system architecture for team knowledge
 * - Verify dependency constraints and patterns
 *
 * @remarks
 * This component is a developer tool. It's not part of the user-facing application
 * but rather a visualization aid for understanding the codebase structure.
 *
 * Data Sources:
 * - ALL_DEPENDENCY_NODES: 118 nodes exported from dependency-graph.ts
 * - ALL_DEPENDENCY_EDGES: 350+ relationship edges from dependency-graph.ts
 * - DEPENDENCY_STATS: Aggregated statistics about the dependency graph
 * - LAYER_GROUPS: Category groupings for layout organization
 *
 * @class DependencyGraphComponent
 * @implements OnInit, AfterViewInit
 * @selector app-dependency-graph
 *
 * @lifecycle
 * - ngOnInit: Initialize graph data and UI state
 * - ngAfterViewInit: Initialize Cytoscape instance after DOM is ready
 * - ngOnDestroy: (inherited) Cleanup Cytoscape instance
 *
 * @see dependency-graph.ts - Data structures for nodes and edges
 * @see https://js.cytoscape.org - Cytoscape.js documentation
 */
@Component({
    selector: 'app-dependency-graph',
    templateUrl: './dependency-graph.component.html',
    styleUrls: ['./dependency-graph.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    animations: [
        trigger('fadeInOut', [
            transition(':enter', [
                style({ opacity: 0, transform: 'translateX(-10px)' }),
                animate('300ms ease-in', style({ opacity: 1, transform: 'translateX(0)' }))
            ]),
            transition(':leave', [
                animate('300ms ease-out', style({ opacity: 0, transform: 'translateX(-10px)' }))
            ])
        ])
    ],
    imports: [FormsModule, DatePipe]
})
export class DependencyGraphComponent implements OnInit, AfterViewInit {
  /**
   * Reference to the Cytoscape container HTML div element
   */
  @ViewChild('cyContainer', { static: false }) cyContainer!: ElementRef<HTMLDivElement>;

  /**
   * Cytoscape.js Core instance managing the graph visualization
   */
  cy!: Core;

  /**
   * Currently selected dependency node in the graph, or null if none selected
   */
  selectedNode: DependencyNode | null = null;

  /**
   * Statistics about the dependency graph (node counts, edge counts, etc.)
   */
  stats = DEPENDENCY_STATS;

  /**
   * Whether the legend showing node category colors is currently visible
   */
  showLegend = true;

  /**
   * Whether the filter panel is currently visible
   */
  showFilters = true;

  /**
   * Whether the legend section is expanded (showing details)
   */
  legendExpanded = true;

  /**
   * Currently selected category filter (empty string = all categories visible)
   */
  selectedCategory = '';

  /**
   * Current search text for filtering nodes by name
   */
  searchText = '';

  /**
   * Current date used for display purposes
   */
  currentDate = new Date();

  /**
   * Position of the modal window containing selected node details
   */
  modalPosition = { x: 0, y: 0 };

  /**
   * Whether the user is currently dragging the modal window
   */
  isDraggingModal = false;

  /**
   * Offset from cursor position to modal origin when dragging started
   */
  dragOffset = { x: 0, y: 0 };

  /**
   * Array of category filter toggles for showing/hiding node categories
   */
  categoryFilters = [
    { category: LAYER_GROUPS.NPM_PEER, label: 'Angular Framework', color: '#DD0031', visible: true },
    { category: LAYER_GROUPS.NPM_PROD, label: 'Production Dependencies', color: '#3776AB', visible: true },
    { category: LAYER_GROUPS.SERVICES, label: 'Framework Services', color: '#C7CEEA', visible: true },
    { category: LAYER_GROUPS.COMPONENTS, label: 'Framework Components', color: '#F8B195', visible: true },
    { category: LAYER_GROUPS.FEATURES, label: 'Feature Components', color: '#B4A7D6', visible: true },
    { category: LAYER_GROUPS.MODELS, label: 'Models & Interfaces', color: '#95E1D3', visible: true },
    { category: LAYER_GROUPS.DOMAIN, label: 'Domain Configurations', color: '#FFD93D', visible: true },
    { category: LAYER_GROUPS.ADAPTERS, label: 'Domain Adapters', color: '#6BCB77', visible: true },
    { category: LAYER_GROUPS.CHARTS, label: 'Chart Data Sources', color: '#A8E6CF', visible: true },
    { category: LAYER_GROUPS.BUILD, label: 'Build Tools', color: '#E8DAEF', visible: true },
    { category: LAYER_GROUPS.TEST, label: 'Testing & Linting', color: '#D7BDE2', visible: true },
    { category: LAYER_GROUPS.EXTERNAL, label: 'External Libraries', color: '#F5B7B1', visible: true },
  ];

  /**
   * Constructor for dependency injection
   */
  constructor(private cdr: ChangeDetectorRef) {}

  /**
   * Angular lifecycle hook - Component initialization
   *
   * Called once when the component is created. In this component,
   * initialization is minimal as Cytoscape setup happens in ngAfterViewInit.
   *
   * @lifecycle
   * Executes: After constructor, before ngAfterViewInit
   * Change Detection: Safe to trigger
   * DOM Access: Not yet available
   */
  ngOnInit(): void {
    // Initialization complete
  }

  /**
   * Angular lifecycle hook - View initialization completion
   *
   * Called once after the component's view and child views are initialized.
   * This is where the Cytoscape instance is created and configured with the
   * complete dependency graph visualization.
   *
   * @lifecycle
   * Executes: After ngOnInit, after DOM is fully rendered
   * Change Detection: Can be triggered
   * DOM Access: ViewChild references now available
   *
   * @remarks
   * Initializes:
   * - Cytoscape instance with Dagre hierarchical layout
   * - 118 nodes representing dependencies
   * - 350+ edges representing relationships
   * - Event handlers for click, tap, and selection events
   * - Initial fit-to-view after layout completes
   */
  ngAfterViewInit(): void {
    try {
      this.initializeCytoscape();
    } catch (error) {
      console.error('Failed to initialize dependency graph:', error);
    }
  }

  /**
   * Initialize Cytoscape.js instance with complete dependency graph configuration
   *
   * Creates and configures the Cytoscape instance with:
   * - Dagre hierarchical layout (left-to-right)
   * - All 118 dependency nodes from ALL_DEPENDENCY_NODES
   * - All 350+ edges from ALL_DEPENDENCY_EDGES
   * - Event handlers for node selection and visualization
   * - Custom styling via getCytoscapeStyle()
   *
   * @private
   * @remarks
   * **Configuration**:
   * - Uses Dagre layout for automatic hierarchical positioning
   * - Configures 2.25x wheel sensitivity for responsive zooming
   * - Enables animation on layout (500ms duration)
   * - Sets up tap event handlers for node selection
   * - Calls fitToView() after 500ms to center the graph
   *
   * **Event Handling**:
   * - Tap on node: Sets selectedNode, highlights node and adjacent nodes
   * - Tap on background: Clears selection and resets highlighting
   * - Errors caught and logged without breaking visualization
   *
   * **Error Handling**:
   * - Validates cyContainer exists before initializing
   * - Wraps event handlers in try-catch to prevent UI breakage
   * - Catches and logs any initialization errors
   *
   * @throws {Error} If cyContainer element is not available
   */
  private initializeCytoscape(): void {
    try {
      // Validate container exists
      if (!this.cyContainer || !this.cyContainer.nativeElement) {
        throw new Error('Cytoscape container not found');
      }

      // Register Dagre layout
      cytoscape.use(dagre);

      // Initialize Cytoscape
      this.cy = cytoscape({
        container: this.cyContainer.nativeElement,
        style: this.getCytoscapeStyle(),
        layout: {
          name: 'dagre',
          nodeSep: 80,
          rankSep: 150,
          edgeSep: 20,
          rankDir: 'LR', // Left to Right
          animate: true,
          animationDuration: 500,
          avoidOverlap: true,
          spacingFactor: 1.5,
          minLen: 2,
        } as any,
        elements: this.buildCytoscapeElements(),
        wheelSensitivity: 2.25, // 50% faster than 1.5 for rapid zoom
        pixelRatio: window.devicePixelRatio,
      });

      // Add event listeners with error handling
      this.cy.on('tap', (evt: any) => {
        try {
          if (evt.target.isNode()) {
            const nodeId = evt.target.id();
            this.selectedNode = ALL_DEPENDENCY_NODES.find(n => n.id === nodeId) || null;
            this.cdr.detectChanges(); // Trigger change detection for modal to appear

            // Visual feedback - highlight selected node and its neighbors
            this.cy.elements().removeClass('selected-node adjacent-node');
            const node = evt.target;
            if (node && node.addClass) {
              node.addClass('selected-node');
              if (node.connectedEdges && node.connectedNodes) {
                node.connectedEdges().connectedNodes().addClass('adjacent-node');
              }
            }
          } else {
            this.selectedNode = null;
            this.cdr.detectChanges(); // Trigger change detection to close modal
            this.cy.elements().removeClass('selected-node adjacent-node');
          }
        } catch (err) {
          console.error('Error in tap event handler:', err);
        }
      });

      // Fit to view on initialization
      setTimeout(() => {
        try {
          this.fitToView();
        } catch (err) {
          console.error('Error fitting to view:', err);
        }
      }, 500);
    } catch (error) {
      console.error('Error initializing Cytoscape:', error);
      throw error;
    }
  }

  /**
   * Build Cytoscape.js element objects from dependency graph data
   *
   * Transforms raw dependency nodes and edges from dependency-graph.ts into the Cytoscape.js
   * element format. Creates element objects with data, styling, and classification information.
   *
   * @private
   * @returns {any[]} Array of Cytoscape element objects (nodes and edges combined)
   *
   * @remarks
   * **Node Elements**:
   * - Includes all properties from ALL_DEPENDENCY_NODES
   * - Assigns node.category as CSS class for styling
   * - Applies node.color and node.shape from dependency definition
   * - Data includes: id, label, description, version
   *
   * **Edge Elements**:
   * - Creates edge IDs in format: `source-target`
   * - Assigns edge.type or 'uses' as CSS class
   * - Data includes: source, target, and relationship label
   * - Label is edge.type, edge.label, or empty string
   *
   * **Total Elements Returned**:
   * - Nodes: 118 (from ALL_DEPENDENCY_NODES)
   * - Edges: 350+ (from ALL_DEPENDENCY_EDGES)
   * - Total: 468+ elements
   *
   * **Used By**:
   * - initializeCytoscape() to populate the Cytoscape instance
   * - Called during graph initialization with elements array
   *
   * @example
   * ```typescript
   * const elements = this.buildCytoscapeElements();
   * // elements[0] = { data: { id: 'npm-angular', label: '@angular/core', ... }, classes: ['npm-peer'] }
   * // elements[118+] = { data: { id: 'npm-angular-svc-api', source: 'npm-angular', target: 'svc-api' }, classes: ['imports'] }
   * ```
   */
  private buildCytoscapeElements(): any[] {
    const elements: any[] = [];

    // Add nodes
    ALL_DEPENDENCY_NODES.forEach(node => {
      elements.push({
        data: {
          id: node.id,
          label: node.label,
          description: node.description || '',
          version: node.version || '',
        },
        classes: [node.category],
        style: {
          'background-color': node.color || '#888',
          shape: node.shape || 'ellipse',
        }
      });
    });

    // Add edges
    ALL_DEPENDENCY_EDGES.forEach(edge => {
      elements.push({
        data: {
          id: `${edge.source}-${edge.target}`,
          source: edge.source,
          target: edge.target,
          label: edge.type || edge.label || '',
        },
        classes: [edge.type || 'uses']
      });
    });

    return elements;
  }

  /**
   * Generate Cytoscape.js stylesheet definitions for graph visualization
   *
   * Creates comprehensive CSS-like styling rules for all node and edge types in the
   * dependency graph. Defines colors, sizes, fonts, animations, and visual states
   * for all 12 node categories and 6 edge types.
   *
   * @private
   * @returns {any} Array of Cytoscape style objects defining node and edge appearance
   *
   * @remarks
   * **Node Styling**:
   * - Default node: 60px circles with category-based colors
   * - Selected node: 80px circles with white border and glow effect
   * - Adjacent node: Highlighted when parent is selected
   * - Font: 11px Arial, white text, bold weight
   *
   * **Category Colors** (12 types):
   * - npm-peer (Angular): #DD0031 (red)
   * - npm-prod (Libraries): #3776AB (blue)
   * - framework-service: #C7CEEA (purple)
   * - framework-component: #F8B195 (orange)
   * - framework-model: #95E1D3 (mint)
   * - domain-adapter: #6BCB77 (green)
   * - domain-config: #FFD93D (yellow)
   * - domain-chart: #A8E6CF (emerald)
   * - feature-component: #B4A7D6 (lavender)
   * - build-tool: #E8DAEF (pink)
   * - test-tool: #D7BDE2 (plum)
   * - external-lib: #F5B7B1 (light red)
   *
   * **Edge Styling**:
   * - Default edge: 1px gray lines with arrow tips
   * - Edge types (imports, provides, injects, extends, implements, uses): Each with distinct style
   * - Hover state: Thicker lines (2px) for visibility
   *
   * **Visual States**:
   * - :selected - Node selection styling (larger, white border, glow)
   * - :hover - Hover effects (opacity, cursor changes)
   * - adjacent-node class - Highlighted neighbors of selected node
   * - selected-node class - The actively selected node
   *
   * @used-by initializeCytoscape() passes result to Cytoscape constructor
   *
   * @example
   * ```typescript
   * const style = this.getCytoscapeStyle();
   * // style[0] = { selector: 'node', style: { ... } }
   * // style[1] = { selector: 'node.npm-peer', style: { 'background-color': '#DD0031' } }
   * // style[12] = { selector: 'edge.imports', style: { 'line-color': '#333' } }
   * ```
   */
  private getCytoscapeStyle(): any {
    return [
      {
        selector: 'node',
        style: {
          'content': 'data(label)',
          'text-valign': 'center',
          'text-halign': 'center',
          'background-color': '#888',
          'width': '60px',
          'height': '60px',
          'font-size': '11px',
          'font-weight': 'bold',
          'color': '#ffffff',
          'text-wrap': 'wrap',
          'text-max-width': '85px',
          'overlay-padding': '5px',
          'border-width': '2px',
          'border-color': '#666',
          'border-opacity': 0.5,
          'transition-property': 'background-color, border-width, width, height',
          'transition-duration': '200ms',
        }
      },
      {
        selector: 'node.selected-node',
        style: {
          'width': '80px',
          'height': '80px',
          'border-width': '3px',
          'border-color': '#FFD700',
          'box-shadow': '0 0 10px #FFD700',
        }
      },
      {
        selector: 'node.adjacent-node',
        style: {
          'border-color': '#4169E1',
          'border-width': '2.5px',
        }
      },
      {
        selector: 'node:parent',
        style: {
          'background-opacity': 0.2,
        }
      },
      {
        selector: `node.${LAYER_GROUPS.NPM_PEER}`,
        style: {
          'background-color': '#DD0031',
        }
      },
      {
        selector: `node.${LAYER_GROUPS.NPM_PROD}`,
        style: {
          'background-color': '#3776AB',
        }
      },
      {
        selector: `node.${LAYER_GROUPS.SERVICES}`,
        style: {
          'background-color': '#C7CEEA',
          'color': '#ffffff',
        }
      },
      {
        selector: `node.${LAYER_GROUPS.COMPONENTS}`,
        style: {
          'background-color': '#F8B195',
          'color': '#ffffff',
        }
      },
      {
        selector: `node.${LAYER_GROUPS.FEATURES}`,
        style: {
          'background-color': '#B4A7D6',
          'color': '#ffffff',
        }
      },
      {
        selector: `node.${LAYER_GROUPS.MODELS}`,
        style: {
          'background-color': '#95E1D3',
          'color': '#ffffff',
        }
      },
      {
        selector: `node.${LAYER_GROUPS.DOMAIN}`,
        style: {
          'background-color': '#FFD93D',
          'color': '#ffffff',
        }
      },
      {
        selector: `node.${LAYER_GROUPS.ADAPTERS}`,
        style: {
          'background-color': '#6BCB77',
          'color': '#ffffff',
        }
      },
      {
        selector: `node.${LAYER_GROUPS.CHARTS}`,
        style: {
          'background-color': '#A8E6CF',
          'color': '#ffffff',
        }
      },
      {
        selector: `node.${LAYER_GROUPS.BUILD}`,
        style: {
          'background-color': '#E8DAEF',
          'color': '#ffffff',
        }
      },
      {
        selector: `node.${LAYER_GROUPS.TEST}`,
        style: {
          'background-color': '#D7BDE2',
          'color': '#ffffff',
        }
      },
      {
        selector: `node.${LAYER_GROUPS.EXTERNAL}`,
        style: {
          'background-color': '#F5B7B1',
          'color': '#ffffff',
        }
      },
      {
        selector: 'edge',
        style: {
          'line-color': '#ccc',
          'target-arrow-color': '#999',
          'target-arrow-shape': 'triangle',
          'arrow-scale': 1.5,
          'curve-style': 'bezier',
          'width': '1.5px',
          'opacity': 0.6,
          'color': '#ffffff',
          'text-background-color': '#2a2a2a',
          'text-background-opacity': 0.9,
          'text-background-padding': '2px',
          'font-size': '9px',
          'font-weight': 'bold',
          'text-valign': 'center',
          'text-halign': 'center',
          'edge-text-rotation': 'autorotate',
          'label': 'data(label)',
        }
      },
      {
        selector: 'edge.uses',
        style: {
          'line-color': '#999',
          'target-arrow-color': '#999',
        }
      },
      {
        selector: 'edge.implements',
        style: {
          'line-color': '#6BCB77',
          'target-arrow-color': '#6BCB77',
          'line-style': 'dashed',
        }
      },
      {
        selector: 'edge.extends',
        style: {
          'line-color': '#F8B195',
          'target-arrow-color': '#F8B195',
          'line-style': 'dashed',
        }
      },
      {
        selector: 'edge.provides',
        style: {
          'line-color': '#C7CEEA',
          'target-arrow-color': '#C7CEEA',
        }
      },
      {
        selector: 'edge.injects',
        style: {
          'line-color': '#FFD93D',
          'target-arrow-color': '#FFD93D',
          'line-style': 'dotted',
        }
      },
    ];
  }

  /**
   * Toggle visibility of a dependency category
   *
   * Shows or hides all nodes in the specified category (e.g., Angular Framework,
   * Production Dependencies, Services, etc.) and automatically updates the graph
   * layout to fit the visible nodes.
   *
   * @param category - The category identifier to toggle (from LAYER_GROUPS)
   *
   * @remarks
   * **Category Options**:
   * - NPM_PEER: Angular framework packages
   * - NPM_PROD: Production dependencies
   * - SERVICES: Framework services
   * - COMPONENTS: Framework UI components
   * - MODELS: TypeScript interfaces
   * - DOMAIN: Domain configurations
   * - ADAPTERS: Domain API adapters
   * - CHARTS: Chart data sources
   * - FEATURES: Page/route components
   * - BUILD: Build tools
   * - TEST: Testing tools
   * - EXTERNAL: External libraries
   *
   * **Side Effects**:
   * - Updates categoryFilters visibility state
   * - Hides/shows all nodes in the category
   * - Automatically hides edges connected to hidden nodes
   * - Calls fitToView() to adjust zoom/pan for visible elements
   *
   * @example
   * ```typescript
   * // Hide all Angular framework packages
   * this.toggleCategory(LAYER_GROUPS.NPM_PEER);
   * ```
   */
  toggleCategory(category: string): void {
    const filter = this.categoryFilters.find(f => f.category === category);
    if (filter) {
      filter.visible = !filter.visible;
      this.updateNodeVisibility();
    }
  }

  /**
   * Update node visibility based on category filters
   *
   * Filters the dependency graph to show/hide nodes according to the currently selected
   * categories. Automatically hides edges when either endpoint is hidden, maintaining
   * graph integrity. Recalculates zoom/pan to fit visible nodes.
   *
   * @private
   * @remarks
   * **Visibility Logic**:
   * - Iterates all 118 nodes in the dependency graph
   * - Checks each node's Cytoscape class set against visible categories
   * - Sets node display to 'element' (visible) or 'none' (hidden)
   * - Each node can belong to multiple categories (e.g., feature AND shared)
   *
   * **Edge Handling**:
   * - Cascading visibility: edges are hidden if source OR target node is hidden
   * - Prevents orphaned edges from appearing between hidden nodes
   * - Ensures visual consistency in graph display
   *
   * **View Adjustment**:
   * - Calls fitToView() after updating visibility
   * - Re-centers and zooms to fit all currently visible nodes
   * - Accounts for visibility changes in responsive zoom calculations
   *
   * **Performance**:
   * - Uses forEach for node/edge iteration (Cytoscape collection operation)
   * - Single pass through nodes and edges
   * - No animation—instant visibility toggle
   *
   * **Called By**:
   * - toggleCategory() - when user clicks category filter button
   * - resetView() - when user resets all filters
   *
   * @see categoryFilters - Array of CategoryFilter objects determining visibility
   * @see fitToView - Recalculates zoom/pan after visibility change
   */
  private updateNodeVisibility(): void {
    const visibleCategories = this.categoryFilters
      .filter(f => f.visible)
      .map(f => f.category);

    this.cy.nodes().forEach((node: any) => {
      const classes = node._private.classes;
      const isVisible = visibleCategories.some(cat => classes.has(cat));
      if (isVisible) {
        node.style('display', 'element');
      } else {
        node.style('display', 'none');
      }
    });

    // Hide edges if either endpoint is hidden
    this.cy.edges().forEach((edge: any) => {
      const sourceHidden = edge.source().style('display') === 'none';
      const targetHidden = edge.target().style('display') === 'none';
      if (sourceHidden || targetHidden) {
        edge.style('display', 'none');
      } else {
        edge.style('display', 'element');
      }
    });

    this.fitToView();
  }

  /**
   * Filter graph nodes by search text
   *
   * Shows only nodes whose label or description contains the search text (case-insensitive).
   * Automatically hides edges connected to hidden nodes and adjusts zoom/pan to fit visible nodes.
   *
   * @remarks
   * **Filtering Logic**:
   * - Searches node labels (e.g., "Angular Core", "RxJS")
   * - Searches node descriptions (e.g., "Reactive programming library")
   * - Case-insensitive matching
   * - Partial matches (substring search)
   *
   * **Empty Search**:
   * - If searchText is empty, all nodes are shown
   * - Call clearSearch() to reset

   * @example
   * ```typescript
   * this.searchText = 'Angular';
   * this.filterBySearch(); // Shows only Angular-related nodes
   * ```
   */
  filterBySearch(): void {
    if (!this.searchText.trim()) {
      this.cy.elements().style('display', 'element');
      return;
    }

    const searchLower = this.searchText.toLowerCase();
    this.cy.nodes().forEach((node: any) => {
      const label = node.data('label').toLowerCase();
      const description = (node.data('description') || '').toLowerCase();
      if (label.includes(searchLower) || description.includes(searchLower)) {
        node.style('display', 'element');
      } else {
        node.style('display', 'none');
      }
    });

    // Hide edges if either endpoint is hidden
    this.cy.edges().forEach((edge: any) => {
      const sourceHidden = edge.source().style('display') === 'none';
      const targetHidden = edge.target().style('display') === 'none';
      if (sourceHidden || targetHidden) {
        edge.style('display', 'none');
      } else {
        edge.style('display', 'element');
      }
    });

    this.fitToView();
  }

  /**
   * Clear search filter and show all nodes
   *
   * Resets search text and displays all dependency nodes and edges.
   * Respects category filter visibility settings.
   */
  clearSearch(): void {
    this.searchText = '';
    this.cy.elements().style('display', 'element');
    this.updateNodeVisibility();
  }

  /**
   * Fit graph view to show all visible nodes
   *
   * Adjusts zoom and pan to center and fit all visible nodes within the viewport.
   * Adds 50px padding around nodes for visual breathing room.
   *
   * @remarks
   * - Only fits visible nodes (respects category and search filters)
   * - Safely handles cases where no nodes are visible
   * - Includes error handling for Cytoscape exceptions
   */
  fitToView(): void {
    try {
      if (this.cy && this.cy.elements(':visible').length > 0) {
        this.cy.fit(':visible', 50);
      }
    } catch (error) {
      console.error('Error fitting to view:', error);
    }
  }

  /**
   * Reset graph to initial state
   *
   * Clears all filters, resets selection, and shows entire dependency graph.
   * Provides a quick way to return to the default view after filtering/searching.
   *
   * @remarks
   * **Reset Actions**:
   * - Deselects any selected node
   * - Removes all CSS classes (selected-node, adjacent-node)
   * - Clears search text
   * - Shows all category filters
   * - Refits graph view to all nodes
   * - Includes error handling for Cytoscape exceptions
   */
  resetView(): void {
    try {
      this.selectedNode = null;
      if (this.cy) {
        this.cy.elements().removeClass('selected-node adjacent-node');
      }
      this.searchText = '';
      this.categoryFilters.forEach(f => f.visible = true);
      this.updateNodeVisibility();
    } catch (error) {
      console.error('Error resetting view:', error);
    }
  }

  /**
   * Zoom in on the graph (1.2x magnification)
   *
   * Increases the zoom level by 20% to allow closer inspection of nodes and edges.
   * Multiple calls zoom progressively closer.
   *
   * @remarks
   * Each call multiplies current zoom by 1.2x
   * Includes error handling for Cytoscape exceptions
   */
  zoomIn(): void {
    try {
      if (this.cy) {
        this.cy.zoom(this.cy.zoom() * 1.2);
      }
    } catch (error) {
      console.error('Error zooming in:', error);
    }
  }

  /**
   * Zoom out on the graph (0.83x magnification)
   *
   * Decreases the zoom level by approximately 17% to see more of the dependency graph.
   * Multiple calls zoom progressively further out.
   *
   * @remarks
   * Each call divides current zoom by 1.2x (approximately 0.83x)
   * Includes error handling for Cytoscape exceptions
   */
  zoomOut(): void {
    try {
      if (this.cy) {
        this.cy.zoom(this.cy.zoom() / 1.2);
      }
    } catch (error) {
      console.error('Error zooming out:', error);
    }
  }

  /**
   * Toggle legend visibility
   *
   * Shows or hides the legend panel that displays all node category colors and labels.
   * Legend state is independent of legend expanded state.
   */
  toggleLegend(): void {
    this.showLegend = !this.showLegend;
  }

  /**
   * Toggle legend expansion state
   *
   * Shows or hides the detailed legend content while keeping the legend panel visible.
   * Used for collapsing/expanding the full legend to save screen space.
   */
  toggleLegendExpanded(): void {
    this.legendExpanded = !this.legendExpanded;
  }

  /**
   * Toggle filter panel visibility
   *
   * Shows or hides the category filter panel that allows toggling individual
   * dependency categories on and off.
   */
  toggleFilters(): void {
    this.showFilters = !this.showFilters;
  }

  /**
   * Export dependency graph data as JSON file
   *
   * Downloads the complete dependency graph (nodes, edges, and statistics)
   * as a JSON file for external analysis or import into other tools.
   *
   * @remarks
   * **Exported Data**:
   * - ALL_DEPENDENCY_NODES: 118 nodes with id, label, category, color
   * - ALL_DEPENDENCY_EDGES: 350+ edges with source, target, type
   * - DEPENDENCY_STATS: Aggregated statistics by category
   * - exportedAt: ISO timestamp of export
   *
   * **File Details**:
   * - Filename: generic-prime-dependency-graph.json
   * - Format: Minified JSON (2-space indentation)
   * - Triggers browser download dialog
   *
   * @example
   * ```typescript
   * // User clicks Export button
   * this.exportAsJson();
   * // Browser downloads: generic-prime-dependency-graph.json
   * ```
   */
  exportAsJson(): void {
    const data = {
      nodes: ALL_DEPENDENCY_NODES,
      edges: ALL_DEPENDENCY_EDGES,
      stats: DEPENDENCY_STATS,
      exportedAt: new Date().toISOString(),
    };
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'generic-prime-dependency-graph.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  /**
   * Get hex color for a node category
   *
   * Looks up the color value for a given category from the categoryFilters array.
   * Used by the template to color-code category legend items and nodes.
   *
   * @param category - The category identifier (from LAYER_GROUPS)
   * @returns Hex color code for the category, or '#888' (gray) if not found
   *
   * @example
   * ```typescript
   * const color = this.getNodeColor(LAYER_GROUPS.NPM_PEER); // Returns '#DD0031'
   * ```
   */
  getNodeColor(category: string): string {
    return this.categoryFilters.find(f => f.category === category)?.color || '#888';
  }

  /**
   * Handle modal mouse down event for dragging
   *
   * Initiates modal window dragging when user presses mouse down on the modal header.
   * Calculates the drag offset to enable smooth movement without jumping.
   *
   * @param event - Mouse event from the modal container
   *
   * @remarks
   * **Drag Behavior**:
   * - Only activates when dragging from .modal-header element
   * - Calculates offset between click position and element corner
   * - Stores initial state in isDraggingModal flag
   * - Prevents default behavior to avoid text selection
   *
   * @see onModalMouseMove - Handles drag movement
   * @see onModalMouseUp - Handles drag completion
   */
  onModalMouseDown(event: MouseEvent): void {
    // Only allow dragging from the header
    if ((event.target as HTMLElement).closest('.modal-header')) {
      this.isDraggingModal = true;
      const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
      this.dragOffset = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
      };
      event.preventDefault();
    }
  }

  /**
   * Handle modal mouse move event during dragging
   *
   * Updates modal position while user drags the modal window.
   * Only active when isDraggingModal is true (mouse down on header).
   *
   * @param event - Mouse move event with current mouse coordinates
   *
   * @remarks
   * **Movement Calculation**:
   * - Subtracts stored dragOffset from current mouse position
   * - Results in smooth, natural dragging without position jumps
   * - Triggers change detection for smooth visual updates
   * - Uses CSS transform translate() for hardware-accelerated movement
   *
   * @see onModalMouseDown - Initiates dragging
   * @see getModalStyle - Returns CSS transform string for positioned modal
   */
  onModalMouseMove(event: MouseEvent): void {
    if (this.isDraggingModal) {
      this.modalPosition = {
        x: event.clientX - this.dragOffset.x,
        y: event.clientY - this.dragOffset.y
      };
      this.cdr.detectChanges(); // Trigger change detection for smooth drag movement
    }
  }

  /**
   * Handle modal mouse up event to end dragging
   *
   * Completes the modal dragging operation when user releases the mouse.
   * Called on window document mouseup event to handle cases where mouse
   * leaves the modal area during dragging.
   *
   * @remarks
   * - Simply sets isDraggingModal flag to false
   * - Modal stays in final position
   * - No animation or smoothing
   *
   * @see onModalMouseDown - Initiates dragging
   * @see onModalMouseMove - Updates position during drag
   */
  onModalMouseUp(): void {
    this.isDraggingModal = false;
  }

  /**
   * Get CSS transform string for modal positioning
   *
   * Returns a CSS transform style string that applies the current modal position.
   * Used in template [style.transform] attribute to position the draggable modal.
   *
   * @returns CSS transform string with current modal x,y position
   *
   * @remarks
   * **CSS Output**:
   * - Format: `transform: translate(Xpx, Ypx);`
   * - Uses CSS translate() for hardware-accelerated movement
   * - Called whenever modalPosition changes
   *
   * **Example Output**:
   * - `transform: translate(150px, 200px);`
   *
   * @example
   * ```html
   * <div [style]="getModalStyle()" class="modal">
   *   Modal content that can be dragged
   * </div>
   * ```
   *
   * @see onModalMouseDown - Updates modalPosition
   * @see onModalMouseMove - Updates modalPosition during drag
   */
  getModalStyle(): string {
    return `transform: translate(${this.modalPosition.x}px, ${this.modalPosition.y}px);`;
  }
}
