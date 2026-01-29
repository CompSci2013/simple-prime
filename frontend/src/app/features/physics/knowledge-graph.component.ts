/**
 * Knowledge Graph Component
 *
 * @fileoverview
 * Generic reusable component for displaying interactive knowledge graphs using Cytoscape.js.
 * This component serves as a foundation for visualizing concept relationships, topic hierarchies,
 * and dependency networks in any subject domain.
 *
 * @remarks
 * Architecture:
 * - Accepts graph data via @Input properties (nodes and edges)
 * - Initializes Cytoscape.js instance with Dagre hierarchical layout
 * - Provides interactive features: pan, zoom, node selection, edge tooltips
 * - Handles window resize and cleanup on destroy
 * - Configurable title, subtitle, and back route
 *
 * Cytoscape Features:
 * - Dagre layout algorithm (left-to-right hierarchical)
 * - Node styling with color-coded levels
 * - Edge hover tooltips showing relationship types
 * - Click to select nodes and view details
 * - Fit-to-view button for centering graph
 * - Mouse wheel zoom and pan controls
 *
 * Template Features:
 * - Header with configurable title and subtitle
 * - Canvas wrapper for Cytoscape container
 * - Legend showing level color coding
 * - Info panel for selected node details
 * - Instructions for user interaction
 *
 * Styling:
 * - Dark theme with gradient background
 * - Level-based node coloring (foundational: blue, core: orange, advanced: pink)
 * - Animated entrance effects (fadeIn, slideIn)
 * - Responsive design with mobile breakpoints
 *
 * @example
 * ```html
 * <app-knowledge-graph
 *   [graphData]="myGraphData"
 *   [title]="'My Knowledge Graph'"
 *   [subtitle]="'Topic relationships'"
 *   [backRoute]="'/home'">
 * </app-knowledge-graph>
 * ```
 *
 * @see PhysicsConceptGraphComponent - Example usage
 * @see ClassicalMechanicsGraphComponent - Example usage
 *
 * @lifecycle
 * - ngOnInit: Initial logging
 * - ngAfterViewInit: Cytoscape initialization, event listeners setup
 * - ngOnDestroy: Cleanup listeners and Cytoscape instance
 *
 * @version 1.0
 * @since 2024
 */

import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit, Input } from '@angular/core';
import { Router } from '@angular/router';


/**
 * Cytoscape.js graph visualization library
 *
 * Open-source graph theory (network) library for analysis and visualization.
 * Provides the core functionality for rendering interactive node-link diagrams
 * with support for multiple layout algorithms, event handlers, and styling.
 *
 * @see {@link https://js.cytoscape.org} Official Cytoscape.js documentation
 * @remarks
 * Used in KnowledgeGraphComponent for rendering knowledge graphs and concept relationships.
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
 * Provides automatic hierarchical layout positioning for knowledge graphs.
 *
 * @see {@link https://github.com/cytoscape/cytoscape.js-dagre} Cytoscape-Dagre documentation
 */
import dagre from 'cytoscape-dagre';

// Register the dagre layout
cytoscape.use(dagre);

/**
 * Represents a single node in the knowledge graph
 *
 * Generic node interface for representing any kind of knowledge entity (concept, topic, skill)
 * in a graph visualization. Supports customizable levels, descriptions, and colors.
 *
 * @interface KnowledgeNode
 * @property {string} id - Unique identifier for the node
 * @property {string} label - Display text for the node
 * @property {string} description - Detailed description shown on selection
 * @property {string} level - Categorization level for color coding
 * @property {string} [color] - Optional custom hex color
 *
 * @remarks
 * **Property Details**:
 * - **id**: Kebab-case identifier used for lookup and edge connection. Example: "classical-mechanics"
 * - **label**: Human-readable display name shown in graph. Example: "Classical Mechanics"
 * - **description**: Detailed information shown in tooltip/modal when node is selected
 * - **level**: Categorization for visual styling (color-coding). Examples: 'foundational', 'intermediate', 'advanced'
 * - **color**: Optional override for default level-based color. Hex format: '#RRGGBB'
 *
 * **Usage Context**:
 * This is a generic interface used across multiple knowledge graphs:
 * - Physics concept graphs
 * - Classical mechanics topic graphs
 * - Curriculum dependency graphs
 * - Any domain-specific knowledge visualization
 *
 * **Level-Based Coloring**:
 * Nodes are color-coded by level:
 * - Foundational topics: Cyan (#64c8ff)
 * - Intermediate topics: Orange (#ffa500)
 * - Advanced topics: Pink (#ff6b9d)
 * - Specialization topics: Green (#6BCB77)
 *
 * @see KnowledgeEdge - Edges connecting knowledge nodes
 * @see KnowledgeGraphData - Container with nodes and edges
 * @see KnowledgeGraphComponent - Component that visualizes this graph
 */
export interface KnowledgeNode {
  /**
   * Unique identifier for the node in kebab-case format (e.g., "classical-mechanics")
   */
  id: string;

  /**
   * Display text for the node shown in the graph visualization
   */
  label: string;

  /**
   * Detailed description shown in tooltip/modal when node is selected
   */
  description: string;

  /**
   * Categorization level for color coding (e.g., 'foundational', 'intermediate', 'advanced', 'specialization')
   */
  level: string;

  /**
   * Optional custom hex color code for the node background (overrides level-based color)
   */
  color?: string;
}

/**
 * Represents a directed edge (relationship) between two nodes in a knowledge graph.
 *
 * Edges define the nature and direction of relationships between knowledge concepts,
 * topics, or entities. They are visualized as arrows in the Cytoscape.js graph with
 * optional labels describing the relationship type.
 *
 * @interface KnowledgeEdge
 * @property {string} source - ID of the source (origin) node. The edge originates from this node.
 * @property {string} target - ID of the target (destination) node. The edge points to this node.
 * @property {string} label - Descriptive label for the relationship type or connection name
 *           Common values:
 *           - 'prerequisite': Target requires source as prior knowledge
 *           - 'foundation': Source provides conceptual basis for target
 *           - 'extends': Target builds upon and extends knowledge from source
 *           - 'related': Conceptual or contextual connection between nodes
 *           - 'implements': Source implements or provides target interface/service
 *           - 'depends-on': Source depends on target for functionality
 *
 * @remarks
 * **Directionality**:
 * The edge is directional: source → target. Visual representation shows an arrow
 * pointing from source to target node. The label is displayed on hover in the UI.
 *
 * **Relationship Semantics**:
 * - **'prerequisite'**: Target cannot be studied effectively without first mastering source
 *   Example: vectors-calculus --prerequisite--> newtonian-mechanics
 * - **'foundation'**: Source provides the mathematical or conceptual basis for target
 *   Example: newtonian-mechanics --foundation--> lagrangian-mechanics
 * - **'extends'**: Target builds upon, generalizes, or extends knowledge from source
 *   Example: kinematics-1d --extends--> kinematics-3d
 * - **'related'**: Nodes are conceptually connected but have no strict dependency
 *   Example: thermodynamics --related--> statistical-mechanics
 * - **'implements'**: Source implements or provides the interface/concept of target
 *   Example: class --implements--> interface
 * - **'depends-on'**: Source depends on target for its functionality or meaning
 *   Example: component --depends-on--> service
 *
 * **Visual Encoding**:
 * - Edge color/style varies by label (may use different line styles for different relationship types)
 * - Arrow always points from source to target
 * - Label displayed on edge hover for user understanding
 * - Edges auto-hide when either endpoint is hidden by filtering
 *
 * **Graph Context**:
 * Edges connect KnowledgeNode instances in a directed acyclic graph (DAG) structure.
 * Used in multiple visualization contexts (physics curriculum, topics, concepts, etc).
 *
 * @example
 * ```typescript
 * {
 *   source: 'vectors-calculus',
 *   target: 'newtonian-mechanics',
 *   label: 'prerequisite'
 * }
 * // Means: Vectors & Calculus is prerequisite for Newtonian Mechanics
 * ```
 *
 * @see KnowledgeNode - Node interface paired with this edge
 * @see KnowledgeGraphComponent - Component that visualizes edges
 * @see KnowledgeGraphData - Container holding all edges
 */
export interface KnowledgeEdge {
  /**
   * ID of the source (origin) node. The edge originates from this node.
   */
  source: string;

  /**
   * ID of the target (destination) node. The edge points to this node.
   */
  target: string;

  /**
   * Descriptive label for the relationship type (e.g., 'prerequisite', 'foundation', 'extends', 'related')
   */
  label: string;
}

/**
 * Complete graph data structure containing all nodes and edges
 *
 * @interface KnowledgeGraphData
 * @property {KnowledgeNode[]} nodes - All nodes in the graph
 * @property {KnowledgeEdge[]} edges - All edges connecting nodes
 */
export interface KnowledgeGraphData {
  /**
   * All nodes in the graph
   */
  nodes: KnowledgeNode[];

  /**
   * All edges connecting nodes in the graph
   */
  edges: KnowledgeEdge[];
}

/**
 * Generic Knowledge Graph Component
 *
 * Renders an interactive Cytoscape.js visualization from provided graph data.
 * Supports pan, zoom, node selection, and edge relationship display.
 */
@Component({
    selector: 'app-knowledge-graph',
    templateUrl: './knowledge-graph.component.html',
    styleUrls: ['./knowledge-graph.component.scss'],
    imports: []
})
export class KnowledgeGraphComponent implements OnInit, AfterViewInit, OnDestroy {
  /**
   * Reference to the Cytoscape container HTML element
   */
  @ViewChild('cytoscapeContainer') containerRef!: ElementRef<HTMLDivElement>;

  /**
   * Graph data containing nodes and edges to visualize
   */
  @Input() graphData!: KnowledgeGraphData;

  /**
   * Title displayed at the top of the knowledge graph
   */
  @Input() title = 'Knowledge Graph';

  /**
   * Subtitle displayed below the title
   */
  @Input() subtitle = '';

  /**
   * Route to navigate back to when the back button is clicked
   */
  @Input() backRoute = '/physics';

  /**
   * Currently selected node in the graph, or null if no node is selected
   */
  selectedNode: KnowledgeNode | null = null;

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
   * Called once when the component is created.
   */
  ngOnInit(): void {
    console.log('[KnowledgeGraph] ngOnInit()');
  }

  /**
   * Angular lifecycle hook - View initialization completion
   *
   * Called after the view and child views are initialized.
   * Initializes Cytoscape.js chart and sets up event listeners.
   */
  ngAfterViewInit(): void {
    console.log('[KnowledgeGraph] ngAfterViewInit()');
    console.log('[KnowledgeGraph] Graph data:', this.graphData);
    console.log('[KnowledgeGraph] Container ref:', this.containerRef);

    if (!this.containerRef) {
      console.error('Container ref not available');
      return;
    }

    if (!this.graphData) {
      console.error('Graph data not available');
      return;
    }

    console.log('[KnowledgeGraph] Building elements with', this.graphData.nodes.length, 'nodes and', this.graphData.edges.length, 'edges');
    console.log('[KnowledgeGraph] Container element:', this.containerRef.nativeElement);
    console.log('[KnowledgeGraph] Container size:', this.containerRef.nativeElement.offsetWidth, 'x', this.containerRef.nativeElement.offsetHeight);
    console.log('[KnowledgeGraph] Container computed style:', window.getComputedStyle(this.containerRef.nativeElement));

    // Ensure the container has proper display and sizing
    const container = this.containerRef.nativeElement;
    if (container.offsetHeight === 0 || container.offsetWidth === 0) {
      console.warn('[KnowledgeGraph] Container has zero dimensions, attempting to force layout recalculation');
      // Force reflow
      void container.offsetHeight;
    }

    // Convert data to Cytoscape format
    const elements = this.buildCytoscapeElements();
    console.log('[KnowledgeGraph] Created elements:', elements.length);

    try {
      // Initialize Cytoscape
      this.cy = cytoscape({
        container: container,
        elements: elements,
        style: this.getCytoscapeStyle(),
        layout: {
          name: 'dagre' as const,
          rankDir: 'LR',
          spacingFactor: 1.5,
          nodeSep: 100,
          rankSep: 150,
          animate: false,
          animationDuration: 0,
          fit: true,
          padding: 40
        } as cytoscape.LayoutOptions,
        wheelSensitivity: 0.75,
        panningEnabled: true,
        userPanningEnabled: true,
        zoomingEnabled: true,
        userZoomingEnabled: true
      });
      console.log('[KnowledgeGraph] Cytoscape initialized successfully');

      // Add event listeners for nodes
      this.cy.on('tap', 'node', (evt: any) => {
        const node = evt.target;
        const nodeId = node.id();
        this.selectedNode =
          this.graphData!.nodes.find((n) => n.id === nodeId) || null;
        console.log('[KnowledgeGraph] Selected node:', nodeId);
      });

      // Add event listeners for edges - hover to show tooltip
      this.cy.on('mouseover', 'edge', (evt: any) => {
        const edge = evt.target;
        this.hoveredEdgeLabel = edge.data('label');
      });

      this.cy.on('mouseout', 'edge', () => {
        this.hoveredEdgeLabel = null;
      });

      // Add click outside graph to deselect
      this.cy.on('tap', (evt: any) => {
        if (evt.target === this.cy) {
          this.selectedNode = null;
        }
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

      // Handle window resize
      this.resizeListener = () => this.handleResize();
      window.addEventListener('resize', this.resizeListener);

      // Fit graph to container after a short delay to ensure rendering
      setTimeout(() => {
        this.cy.fit();
        console.log('[KnowledgeGraph] Graph fitted to view');
      }, 200);

      console.log('[KnowledgeGraph] Event listeners and resize handler attached');
    } catch (error) {
      console.error('[KnowledgeGraph] Error initializing Cytoscape:', error);
    }
  }

  /**
   * Converts graph data to Cytoscape.js element format
   *
   * @private
   * @returns {any[]} Array of Cytoscape elements (nodes and edges)
   */
  private buildCytoscapeElements(): any[] {
    const elements: any[] = [];

    // Add nodes
    this.graphData.nodes.forEach((node) => {
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
    this.graphData.edges.forEach((edge) => {
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
   * Defines Cytoscape.js visual styling for nodes and edges
   *
   * @private
   * @returns {any[]} Cytoscape style array with selectors and style properties
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
   * Handles window resize events by resizing and refitting the graph
   *
   * @private
   */
  private handleResize(): void {
    if (this.cy) {
      this.cy.resize();
      this.cy.fit();
    }
  }

  /**
   * Fits the graph to the viewport with padding
   * Called by the "Fit to View" button
   */
  fitGraph(): void {
    if (this.cy) {
      this.cy.fit(null, 40);
    }
  }

  /**
   * Navigates back to the configured back route
   */
  goBack(): void {
    this.router.navigate([this.backRoute]);
  }

  /**
   * Angular lifecycle hook - Component destruction
   *
   * Called when the component is destroyed. Cleans up Cytoscape instance and event listeners.
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
