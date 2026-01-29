import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { Router } from '@angular/router';
import { PHYSICS_CONCEPT_GRAPH, ConceptNode, ConceptEdge } from './physics-concept-graph';


/**
 * Cytoscape.js graph visualization library
 *
 * Open-source graph theory (network) library for analysis and visualization.
 * Provides the core functionality for rendering interactive node-link diagrams
 * with support for multiple layout algorithms, event handlers, and styling.
 *
 * @see {@link https://js.cytoscape.org} Official Cytoscape.js documentation
 * @remarks
 * Used in PhysicsConceptGraphComponent for rendering physics concept relationships.
 */
import cytoscape from 'cytoscape';

/**
 * Cytoscape-Dagre layout plugin
 *
 * Implements the Dagre hierarchical graph layout algorithm for Cytoscape.js.
 * Provides directed acyclic graph (DAG) layout with automatic node positioning
 * to visualize concept hierarchies (foundational → intermediate → advanced).
 *
 * @remarks
 * Must be registered with cytoscape.use(dagre) before use.
 * Provides automatic hierarchical layout positioning for physics concepts.
 *
 * @see {@link https://github.com/cytoscape/cytoscape.js-dagre} Cytoscape-Dagre documentation
 */
import dagre from 'cytoscape-dagre';

// Register the dagre layout
cytoscape.use(dagre);

/**
 * Cytoscape Node Data Structure
 *
 * Defines the data format for nodes in the Cytoscape graph visualization.
 * This interface structures node data for use with Cytoscape.js library,
 * providing all necessary properties for rendering and styling graph nodes.
 *
 * @interface CytoscapeNode
 * @property {Object} data - Data object containing node properties
 * @property {string} data.id - Unique identifier for the node (kebab-case)
 * @property {string} data.label - Display text shown on the node in the graph
 * @property {string} data.level - Academic level for categorization (foundational/intermediate/advanced)
 * @property {string} data.description - Detailed description shown on node selection
 * @property {string} [data.color] - Optional hex color code for node background
 *
 * @remarks
 * This is Cytoscape.js's standard node format. The data object is passed directly to
 * the Cytoscape instance during graph initialization.
 *
 * **Color Values**:
 * - Foundational: #64c8ff (cyan)
 * - Intermediate: #ffa500 (orange)
 * - Advanced: #ff6b9d (pink)
 *
 * **Node Rendering**:
 * Cytoscape renders nodes as 60x60px circles with:
 * - Background color from data.color
 * - Label text from data.label
 * - Cyan border (#64c8ff)
 * - White text (12px, bold)
 *
 * @example
 * ```typescript
 * const node: CytoscapeNode = {
 *   data: {
 *     id: 'mechanics-foundations',
 *     label: 'Classical Mechanics',
 *     level: 'foundational',
 *     description: 'Lagrangian mechanics and oscillations',
 *     color: '#64c8ff'
 *   }
 * };
 * ```
 *
 * @see CytoscapeEdge - Companion edge data structure
 * @see PhysicsConceptGraphComponent - Component using this interface
 */
interface CytoscapeNode {
  /**
   * Data object containing all node properties for Cytoscape rendering
   */
  data: {
    /**
     * Unique identifier for the node in kebab-case (e.g., "classical-mechanics")
     */
    id: string;

    /**
     * Display text shown on the node in the graph (e.g., "Classical Mechanics")
     */
    label: string;

    /**
     * Academic level for categorization (foundational/intermediate/advanced/specialization)
     */
    level: string;

    /**
     * Detailed description shown when the node is selected
     */
    description: string;

    /**
     * Optional hex color code for node background (overrides level-based color)
     */
    color?: string;
  };
}

/**
 * Cytoscape Edge Data Structure
 *
 * Defines the data format for edges (connections) in the Cytoscape graph visualization.
 * This interface structures edge data for use with Cytoscape.js library, providing the
 * connection information between nodes in physics concept graphs.
 *
 * @interface CytoscapeEdge
 * @property {Object} data - Data object containing edge properties
 * @property {string} data.source - Unique ID of the source (origin) node in the edge
 * @property {string} data.target - Unique ID of the target (destination) node in the edge
 * @property {string} data.label - Textual label describing the relationship type or nature
 *           displayed in tooltips or on hover in the visualization
 *
 * @remarks
 * This is Cytoscape.js's standard edge format. The data object is passed directly to
 * the Cytoscape instance during graph initialization. Edges are always directional,
 * with arrows pointing from source to target node in the visualization.
 *
 * @example
 * ```typescript
 * const edge: CytoscapeEdge = {
 *   data: {
 *     source: 'node-1',
 *     target: 'node-2',
 *     label: 'depends-on'
 *   }
 * };
 * ```
 *
 * @see CytoscapeNode - Companion node data structure
 * @see PhysicsConceptGraphComponent - Component using this interface
 */
interface CytoscapeEdge {
  /**
   * Data object containing all edge properties for Cytoscape rendering
   */
  data: {
    /**
     * Unique ID of the source (origin) node in the edge
     */
    source: string;

    /**
     * Unique ID of the target (destination) node in the edge
     */
    target: string;

    /**
     * Textual label describing the relationship type (e.g., "leads to", "foundation for")
     */
    label: string;
  };
}

/**
 * Physics Concept Graph Component
 *
 * Renders an interactive Cytoscape.js graph visualization showing the relationships and dependencies
 * between physics concepts in the PhD curriculum. Uses the dagre layout algorithm for hierarchical
 * positioning and supports pan, zoom, and node selection interactions.
 *
 * @remarks
 * - Uses Cytoscape.js library for graph rendering and interaction
 * - Applies dagre layout for left-to-right hierarchical arrangement
 * - Color-codes nodes by learning level (foundational, intermediate, advanced)
 * - Shows edge labels on hover via custom tooltip
 * - Provides click navigation to detailed knowledge graphs for specific topics
 * - Handles responsive canvas sizing and window resize events
 *
 * @architecture
 * **Purpose**: Interactive visualization of physics concept dependencies
 * **Pattern**: Canvas-based graph component with Cytoscape.js
 * **Libraries**:
 *   - Cytoscape.js: Core graph rendering and interaction
 *   - Cytoscape-dagre: Hierarchical layout algorithm
 * **Navigation Flow**:
 *   - User arrives from /physics → Views concept graph at /physics/concept-graph
 *   - Clicks node (e.g., Classical Mechanics) → Navigates to /physics/classical-mechanics-graph
 *   - Can pan, zoom, and explore the full curriculum graph
 *
 * @template
 * The component uses an interactive graph layout:
 * 1. **Header Section**: Title, subtitle, and back button
 * 2. **Canvas Wrapper**: Cytoscape container with fit-to-view button
 * 3. **Edge Tooltip**: Position-tracked tooltip for edge hover labels
 * 4. **Legend Section**: Color key for learning levels
 * 5. **Info Panel**: Dynamic panel showing selected node details
 * 6. **Instructions**: User guide for graph interaction
 *
 * @styling
 * - Dark theme with level-specific node colors
 * - Foundational: #64c8ff (cyan)
 * - Intermediate: #ffa500 (orange)
 * - Advanced/Specialization: #ff6b9d (pink)
 * - Canvas: 500px height with responsive adjustments
 * - Animations: fadeInDown, fadeInUp, slideIn
 *
 * @example
 * ```typescript
 * // Usage in routing module
 * {
 *   path: 'concept-graph',
 *   component: PhysicsConceptGraphComponent
 * }
 * ```
 *
 * @seeAlso
 * - {@link PHYSICS_CONCEPT_GRAPH} - Data source for graph nodes and edges
 * - {@link KnowledgeGraphComponent} - Generic reusable graph component
 * - {@link ClassicalMechanicsGraphComponent} - Detailed topic graph
 * - {@link ConceptNode} - Node data interface
 * - {@link ConceptEdge} - Edge data interface
 *
 * @lifecycle
 * - **ngOnInit**: Logs initialization
 * - **ngAfterViewInit**: Initializes Cytoscape graph, sets up event listeners
 * - **ngOnDestroy**: Destroys Cytoscape instance, removes event listeners
 *
 * @version 1.0
 * @since 1.0.0 (Added as part of physics domain implementation)
 */
@Component({
    selector: 'app-physics-concept-graph',
    templateUrl: './physics-concept-graph.component.html',
    styleUrls: ['./physics-concept-graph.component.scss'],
    imports: []
})
export class PhysicsConceptGraphComponent implements OnInit, AfterViewInit, OnDestroy {
  /**
   * Reference to the Cytoscape container HTML div element
   */
  @ViewChild('cytoscapeContainer') containerRef!: ElementRef<HTMLDivElement>;

  /**
   * Physics concept graph data containing all nodes and edges
   */
  conceptGraph = PHYSICS_CONCEPT_GRAPH;

  /**
   * Currently selected concept node in the graph, or null if no node is selected
   */
  selectedNode: ConceptNode | null = null;

  /**
   * Label of the currently hovered edge, or null if no edge is hovered
   */
  hoveredEdgeLabel: string | null = null;

  /**
   * Position for the edge tooltip (top and left CSS properties)
   */
  tooltipPos: { top: string; left: string } | null = null;

  /**
   * Cytoscape.js instance for the rendered graph
   */
  private cy: any;

  /**
   * Window resize event listener function
   */
  private resizeListener!: () => void;

  /**
   * Document mousemove event listener function for tooltip tracking
   */
  private mouseMoveListener!: (e: MouseEvent) => void;

  /**
   * Constructor for dependency injection
   */
  constructor(private router: Router) {}

  /**
   * Angular lifecycle hook - Component initialization
   *
   * Called once when the component is initialized but before the view is rendered.
   * Used for early logging and non-DOM-dependent initialization.
   *
   * @lifecycle
   * Executes: After constructor, before ngAfterViewInit
   * Timing: Safe for property binding, not yet for DOM access
   *
   * @remarks
   * At this point:
   * - Component properties are bound
   * - Input properties are populated
   * - DOM/ViewChild references are NOT yet available
   * - Change detection can still be triggered
   */
  ngOnInit(): void {
    console.log('[PhysicsConceptGraph] ngOnInit()');
  }

  /**
   * Angular lifecycle hook - View initialization completion
   *
   * Called once after the component's view and child views are initialized.
   * This is where Cytoscape.js graph is created and event listeners are attached.
   *
   * @lifecycle
   * Executes: After ngOnInit, after DOM is fully rendered
   * Timing: Safe for DOM access, ViewChild references available
   *
   * @remarks
   * **Why Cytoscape is initialized here**:
   * - ViewChild containerRef is now available
   * - DOM element is rendered and in the document
   * - Height/width CSS is applied
   * - Cytoscape needs actual DOM element to render
   *
   * **What happens**:
   * 1. Validates containerRef is available
   * 2. Builds Cytoscape elements from data
   * 3. Initializes Cytoscape instance with configuration
   * 4. Sets up event listeners (click, hover, pan, zoom)
   * 5. Logs successful initialization
   *
   * @throws Error logged to console if containerRef not available
   */
  ngAfterViewInit(): void {
    console.log('[PhysicsConceptGraph] ngAfterViewInit()');

    if (!this.containerRef) {
      console.error('Container ref not available');
      return;
    }

    // Convert data to Cytoscape format
    const elements = this.buildCytoscapeElements();

    // Initialize Cytoscape
    this.cy = cytoscape({
      container: this.containerRef.nativeElement,
      elements: elements,
      style: this.getCytoscapeStyle(),
      layout: {
        name: 'dagre' as const,
        rankDir: 'LR',
        spacingFactor: 1.5,
        nodeSep: 100,
        rankSep: 150,
        animate: true,
        animationDuration: 500,
        fit: true,
        padding: 40
      } as cytoscape.LayoutOptions,
      wheelSensitivity: 0.75,
      panningEnabled: true,
      userPanningEnabled: true,
      zoomingEnabled: true,
      userZoomingEnabled: true
    });

    // Fit graph to container
    this.cy.fit();

    // Add event listeners for nodes
    this.cy.on('tap', 'node', (evt: any) => {
      const node = evt.target;
      const nodeId = node.id();
      this.selectedNode =
        this.conceptGraph.nodes.find((n) => n.id === nodeId) || null;
      console.log('[PhysicsConceptGraph] Selected node:', nodeId);

      // Navigate to knowledge graph if node has one
      this.navigateToNodeGraph(nodeId);
    });

    // Add event listeners for edges - hover to show tooltip
    this.cy.on('mouseover', 'edge', (evt: any) => {
      const edge = evt.target;
      this.hoveredEdgeLabel = edge.data('label');
    });

    this.cy.on('mouseout', 'edge', () => {
      this.hoveredEdgeLabel = null;
    });

    // Add mouse move listener to track cursor position for tooltip
    this.mouseMoveListener = (e: MouseEvent) => {
      if (this.hoveredEdgeLabel) {
        this.tooltipPos = {
          left: e.clientX + 'px',
          top: (e.clientY + 12) + 'px'
        };
      }
    };
    document.addEventListener('mousemove', this.mouseMoveListener);

    // Add click outside graph to deselect
    this.cy.on('tap', (evt: any) => {
      if (evt.target === this.cy) {
        this.selectedNode = null;
      }
    });

    // Handle window resize
    this.resizeListener = () => this.handleResize();
    window.addEventListener('resize', this.resizeListener);

    console.log('[PhysicsConceptGraph] Cytoscape initialized');
  }

  /**
   * Build Cytoscape-compatible elements from physics concept graph data
   *
   * Transforms the PHYSICS_CONCEPT_GRAPH data structure into format required by Cytoscape.js.
   * Cytoscape expects elements in a specific structure with `data` properties containing node/edge info.
   *
   * @private
   * @returns {any[]} Array of Cytoscape elements (nodes + edges)
   *
   * @remarks
   * **Data Transformation**:
   * - Converts ConceptNode array to Cytoscape node elements with data.id, data.label, etc.
   * - Converts ConceptEdge array to Cytoscape edge elements with data.source, data.target, data.label
   *
   * **Cytoscape Format**:
   * Nodes: `{ data: { id, label, level, description, color } }`
   * Edges: `{ data: { source, target, label } }`
   *
   * @example
   * ```typescript
   * // Input from PHYSICS_CONCEPT_GRAPH
   * // nodes: [{ id: 'mech', label: 'Mechanics', ... }]
   * // edges: [{ source: 'mech', target: 'waves', label: 'prerequisite' }]
   *
   * // Output:
   * // [
   * //   { data: { id: 'mech', label: 'Mechanics', level: 'foundational', ... } },
   * //   { data: { source: 'mech', target: 'waves', label: 'prerequisite' } }
   * // ]
   * ```
   *
   * @see PHYSICS_CONCEPT_GRAPH - Data source
   * @see ngAfterViewInit - Where this is called
   */
  private buildCytoscapeElements(): any[] {
    const elements: any[] = [];

    // Add nodes
    this.conceptGraph.nodes.forEach((node) => {
      elements.push({
        data: {
          id: node.id,
          label: node.label,
          level: node.level,
          description: node.description,
          color: node.color
        }
      });
    });

    // Add edges
    this.conceptGraph.edges.forEach((edge) => {
      elements.push({
        data: {
          source: edge.source,
          target: edge.target,
          label: edge.label
        }
      });
    });

    return elements;
  }

  /**
   * Generate Cytoscape stylesheet for graph visualization
   *
   * Creates styling rules for nodes and edges in Cytoscape.js graph.
   * Defines colors, sizes, labels, transitions, and hover effects.
   *
   * @private
   * @returns {any[]} Array of Cytoscape style objects
   *
   * @remarks
   * **Style Selectors**:
   * - `node`: Base styling for all nodes (60x60px, colored circles, white text)
   * - `node:selected`: Larger (80x80px), white border, glow effect
   * - `node:hover`: Opacity change, pointer cursor
   * - `edge`: Base styling for connections (2px line, triangle arrow)
   * - `edge:hover`: Brighter color, thicker line (3px)
   *
   * **Colors**:
   * - Node border: #64c8ff (cyan)
   * - Edge color: rgba(100, 200, 255, 0.5) (semi-transparent cyan)
   * - Arrow: rgba(100, 200, 255, 0.6)
   *
   * **Animations**:
   * - Transitions: 0.3s for smooth state changes
   * - Curve style: bezier for smooth edges
   *
   * @see ngAfterViewInit - Where this is used for Cytoscape initialization
   */
  private getCytoscapeStyle(): any[] {
    return [
      {
        selector: 'node',
        style: {
          'background-color': 'data(color)',
          'label': 'data(label)',
          'text-valign': 'center',
          'text-halign': 'center',
          'width': '60px',
          'height': '60px',
          'font-size': '18px',
          'color': '#ffffff',
          'font-weight': 'bold',
          'text-wrap': 'wrap',
          'text-max-width': '55px',
          'text-background-color': 'rgba(0,0,0,0)',
          'text-background-opacity': 0,
          'border-color': '#64c8ff',
          'border-width': '2px',
          'transition-property':
            'background-color, border-width, box-shadow',
          'transition-duration': '0.3s'
        }
      },
      {
        selector: 'node:selected',
        style: {
          'border-width': '3px',
          'border-color': '#ffffff',
          'width': '80px',
          'height': '80px',
          'background-color': 'data(color)',
          'box-shadow': '0 0 0 3px rgba(100, 200, 255, 0.5)'
        }
      },
      {
        selector: 'node:hover',
        style: {
          'background-color': 'data(color)',
          'opacity': 0.9,
          'cursor': 'pointer'
        }
      },
      {
        selector: 'edge',
        style: {
          'line-color': 'rgba(100, 200, 255, 0.5)',
          'target-arrow-color': 'rgba(100, 200, 255, 0.6)',
          'target-arrow-shape': 'triangle',
          'width': '2px',
          'label': '',
          'curve-style': 'bezier',
          'arrow-scale': 2.625
        }
      },
      {
        selector: 'edge:hover',
        style: {
          'line-color': 'rgba(100, 200, 255, 0.8)',
          'width': '3px'
        }
      }
    ];
  }

  /**
   * Handle window resize events and adjust graph layout
   *
   * Called by window resize event listener to ensure Cytoscape graph remains
   * properly sized when the browser window or container changes dimensions.
   *
   * @private
   * @remarks
   * **What happens**:
   * 1. Checks if Cytoscape instance exists
   * 2. Calls cy.resize() to update internal Cytoscape canvas
   * 3. Calls cy.fit() to recenter and fit graph to new container size
   *
   * **Performance**:
   * - Debouncing not implemented (can optimize if needed)
   * - Called on every resize event
   * - Fast operations (minimal DOM impact)
   *
   * @see ngAfterViewInit - Where resize listener is registered
   * @see ngOnDestroy - Where listener is cleaned up
   */
  private handleResize(): void {
    if (this.cy) {
      this.cy.resize();
      this.cy.fit();
    }
  }

  /**
   * Fit the entire graph to the current view
   *
   * Public method called from template (fit-to-view button) to center and zoom
   * the graph to show all nodes and edges within the visible container.
   *
   * @public
   * @remarks
   * **Parameters**:
   * - null: Animate all nodes (default behavior)
   * - 40: Padding in pixels around the graph edges
   *
   * **Use case**:
   * Called when user clicks the "Fit to View" button in the UI to reset zoom/pan
   * after manual exploration.
   *
   * @see ngAfterViewInit - Initial fit is done here after graph creation
   */
  fitGraph(): void {
    if (this.cy) {
      this.cy.fit(null, 40);
    }
  }

  /**
   * Navigate to knowledge graph for a selected concept node
   *
   * Handles routing to detailed knowledge graphs for specific physics topics.
   * Currently supports classical mechanics; expandable for other topics.
   *
   * @public
   * @param {string} nodeId - The unique identifier of the selected node
   *
   * @remarks
   * **Current Mappings**:
   * - 'mechanics-foundations' → /physics/classical-mechanics-graph
   *
   * **Future Expansion**:
   * Add more mappings as knowledge graphs are created for other topics:
   * ```typescript
   * if (nodeId === 'mechanics-foundations') {
   *   this.router.navigate(['/physics/classical-mechanics-graph']);
   * } else if (nodeId === 'electromagnetism') {
   *   this.router.navigate(['/physics/electromagnetism-graph']);
   * }
   * ```
   *
   * **Called by**:
   * - Node tap/click event handler in ngAfterViewInit
   *
   * @see ngAfterViewInit - Where this is called on node click
   */
  navigateToNodeGraph(nodeId: string): void {
    // Navigate to knowledge graph for nodes that have them
    if (nodeId === 'mechanics-foundations') {
      this.router.navigate(['/physics/classical-mechanics-graph']);
    }
    // Add more node-to-graph mappings as knowledge graphs are created for other topics
  }

  /**
   * Navigate back to parent physics component
   *
   * Called by back button in template to return to /physics main view.
   *
   * @public
   * @remarks
   * **Navigation**:
   * - From: /physics/concept-graph
   * - To: /physics
   *
   * **Alternative**:
   * Users can also use browser back button, but this provides explicit UI control.
   */
  goBack(): void {
    this.router.navigate(['/physics']);
  }

  /**
   * Angular lifecycle hook - Component destruction cleanup
   *
   * Called once when the component is destroyed. Cleans up Cytoscape instance
   * and removes all registered event listeners to prevent memory leaks.
   *
   * @lifecycle
   * Executes: When component is removed from DOM
   * Timing: Final cleanup before garbage collection
   *
   * @remarks
   * **Cleanup Tasks**:
   * 1. Destroy Cytoscape instance (frees canvas and memory)
   * 2. Remove window resize listener
   * 3. Remove document mousemove listener
   *
   * **Memory Leak Prevention**:
   * Without proper cleanup:
   * - Cytoscape canvas would remain in memory
   * - Event listeners would continue firing
   * - Memory usage would grow on component re-creation
   *
   * @see ngAfterViewInit - Where listeners and instances are created
   */
  ngOnDestroy(): void {
    if (this.cy) {
      this.cy.destroy();
    }
    if (this.resizeListener) {
      window.removeEventListener('resize', this.resizeListener);
    }
    if (this.mouseMoveListener) {
      document.removeEventListener('mousemove', this.mouseMoveListener);
    }
  }
}
