/**
 * Physics Concept Graph Data Structure
 *
 * @fileoverview
 * Defines the complete concept dependency graph for physics curriculum with specialization
 * in Thermodynamics and Solid State Matter. This graph represents the hierarchical progression
 * from foundational physics concepts through intermediate core topics to advanced PhD-level
 * specializations.
 *
 * @remarks
 * The graph structure enables visualization of:
 * - Prerequisite relationships between concepts
 * - Conceptual dependencies and progression paths
 * - Level-based organization (foundational → intermediate → advanced → specialization)
 * - Cross-topic connections and relationships
 *
 * Structure:
 * - 17 nodes representing major physics concepts
 * - 26 edges representing relationships (prerequisites, foundations, extensions)
 * - 4 concept levels: foundational, intermediate, advanced, specialization
 * - Color-coded by level for visual clarity
 *
 * Usage:
 * - Used by PhysicsConceptGraphComponent for Cytoscape.js visualization
 * - Exported as constant PHYSICS_CONCEPT_GRAPH
 * - Nodes include id, label, level, description, color
 * - Edges include source, target, relationship label
 *
 * @see PhysicsConceptGraphComponent
 * @see KnowledgeGraphComponent
 *
 * @version 1.0
 * @since 2024
 */

/**
 * Represents a single concept node in the physics curriculum graph
 *
 * Concept nodes are individual physics concepts or topics with unique identifiers, display names,
 * academic level classifications, descriptions, and optional custom colors for graph visualization.
 *
 * @interface ConceptNode
 *
 * @property {string} id - Unique identifier for the concept in kebab-case (e.g., "classical-mechanics", "quantum-mechanics").
 *           Used as the node's unique key in the graph and for navigation linking.
 *
 * @property {string} label - Display name of the concept shown on the graph node. Human-readable text
 *           (e.g., "Classical Mechanics", "Quantum Mechanics"). Rendered as node label in Cytoscape.
 *
 * @property {'foundational'|'intermediate'|'advanced'|'specialization'} level - Academic level classification for color-coding.
 *           Values: 'foundational' (cyan), 'intermediate' (orange), 'advanced' (pink), 'specialization' (green).
 *
 * @property {string} description - Brief explanation of the concept's scope and content. Shown in info panels
 *           when user selects node. Provides context and summary of the concept.
 *
 * @property {string} [color] - Optional hex color code for the node background. Overrides default color
 *           assigned by level when provided. Allows custom styling for specific nodes.
 *
 * @remarks
 * **Property Details**:
 * - **id**: Kebab-case identifier used internally. Examples: "classical-mechanics", "quantum-field-theory", "thermodynamics"
 * - **label**: Human-readable display text. Examples: "Classical Mechanics", "Quantum Field Theory", "Statistical Mechanics"
 * - **level**: Determines node color and organization:
 *   - `'foundational'`: Cyan (#64c8ff) - Entry-level physics concepts
 *   - `'intermediate'`: Orange (#ffa500) - Intermediate concepts building on foundations
 *   - `'advanced'`: Pink (#ff6b9d) - Graduate-level advanced topics
 *   - `'specialization'`: Green (#6BCB77) - PhD specialization topics
 * - **description**: Shown in modal when node is selected. Example: "Study of forces, motion, and energy in classical systems"
 * - **color**: If provided, overrides the level-based color. Allows highlighting specific nodes differently
 *
 * **Graph Context**:
 * Physics concept graph has:
 * - 17 total concept nodes across 4 academic levels
 * - 26 directed edges showing prerequisite and conceptual relationships
 * - Visualized with Cytoscape.js using hierarchical Dagre layout
 *
 * **Level Distribution**:
 * - Foundational (2): Classical Mechanics, Electricity & Magnetism
 * - Intermediate (3): Thermodynamics, Quantum Mechanics, Special Relativity
 * - Advanced (6): Quantum Field Theory, Statistical Mechanics, Solid State Physics, etc.
 * - Specialization (6): Advanced thermodynamics, computational physics, etc.
 *
 * @see ConceptEdge - Relationships between concepts
 * @see PhysicsConceptGraphComponent - Component that visualizes this graph
 * @see PHYSICS_CONCEPT_GRAPH - The exported instance containing all nodes
 */
export interface ConceptNode {
  /**
   * Unique identifier in kebab-case (e.g., "classical-mechanics", "quantum-mechanics")
   */
  id: string;

  /**
   * Display name of the physics concept (human-readable)
   */
  label: string;

  /**
   * Academic level classification (foundational/intermediate/advanced/specialization)
   */
  level: 'foundational' | 'intermediate' | 'advanced' | 'specialization';

  /**
   * Brief explanation of the concept's content and scope
   */
  description: string;

  /**
   * Optional hex color for graph visualization (overrides level default)
   */
  color?: string;
}

/**
 * Represents a directed edge between two concepts showing their relationship
 *
 * Edges define prerequisite dependencies, conceptual foundations, and knowledge extensions
 * between concepts in the curriculum graph. They form the structure of concept dependency relationships.
 *
 * @interface ConceptEdge
 *
 * @property {string} source - ID of the source (origin) concept node. The edge originates from this node
 *           and represents a dependency relationship direction (source → target).
 *
 * @property {string} target - ID of the target (destination) concept node. The edge points to this node
 *           and represents where the relationship leads.
 *
 * @property {string} label - Type of relationship describing the edge semantics. Common values:
 *           - "leads to" - Sequential progression from source to target
 *           - "foundation for" - Source provides basis for target
 *           - "extends" - Target builds upon source
 *           - "required for" - Source is prerequisite for target
 *
 * @remarks
 * **Directionality & Semantics**:
 * Edges are always directional: source → target with specific semantic meaning:
 * - `classical-mechanics --"foundation for"--> quantum-mechanics` = Classical mechanics provides foundation for quantum mechanics
 * - `special-relativity --"extends"--> quantum-field-theory` = Special relativity extends into quantum field theory
 *
 * **Relationship Types** (4 categories):
 * - **"leads to"**: Sequential/temporal progression. Example: Classical → Quantum
 * - **"foundation for"**: Provides conceptual/mathematical basis. Example: Calculus → Mechanics
 * - **"extends"**: Generalization or advanced application. Example: Mechanics → Statistical Mechanics
 * - **"required for"**: Strict prerequisite. Example: Calculus required for all other physics
 *
 * **Graph Structure**:
 * Physics concept graph has:
 * - 17 concept nodes total
 * - 26 directed edges forming a Directed Acyclic Graph (DAG)
 * - No circular dependencies
 * - Enables visualization of prerequisite and conceptual relationships
 *
 * **Visual Encoding**:
 * - Edge color/style determined by relationship label
 * - Arrow indicates direction from source to target
 * - Label shown on hover in graph visualization
 * - Auto-hides edges when either endpoint is hidden by filters
 *
 * @example
 * ```typescript
 * const edge: ConceptEdge = {
 *   source: 'classical-mechanics',
 *   target: 'quantum-mechanics',
 *   label: 'foundation for'
 * };
 * // Means: Classical mechanics is foundation for quantum mechanics
 * ```
 *
 * @see ConceptNode - Nodes connected by these edges
 * @see PhysicsConceptGraph - Complete graph containing all edges
 * @see PHYSICS_CONCEPT_GRAPH - The exported instance
 */
export interface ConceptEdge {
  /**
   * ID of the source (origin) concept node. The edge originates from this node and represents a dependency relationship direction (source → target).
   */
  source: string;

  /**
   * ID of the target (destination) concept node. The edge points to this node and represents where the relationship leads.
   */
  target: string;

  /**
   * Type of relationship describing the edge semantics (e.g., "leads to", "foundation for", "extends", "required for")
   */
  label: string;
}

/**
 * Complete physics concept graph data structure
 *
 * Container object that holds all nodes and edges for the physics concept graph.
 * This structure represents a directed acyclic graph (DAG) of concepts and relationships.
 *
 * @interface PhysicsConceptGraph
 *
 * @property {ConceptNode[]} nodes - Array of all concept nodes in the graph. Each node represents
 *           a major physics concept with its id, label, level, description, and optional custom color.
 *
 * @property {ConceptEdge[]} edges - Array of all directed edges showing relationships between concepts.
 *           Each edge defines a source node, target node, and relationship label.
 */
export interface PhysicsConceptGraph {
  /**
   * Array of all concept nodes in the graph. Each node represents a major physics concept with its id, label, level, description, and optional custom color.
   */
  nodes: ConceptNode[];

  /**
   * Array of all directed edges showing relationships between concepts. Each edge defines a source node, target node, and relationship label.
   */
  edges: ConceptEdge[];
}

/**
 * Physics Concept Graph - Thermodynamics & Solid State Matter Specialization
 *
 * Complete directed acyclic graph (DAG) showing conceptual dependencies and relationships
 * between physics concepts in the PhD curriculum with specialization in Thermodynamics
 * and Solid State Matter. This is the primary data source for the concept graph visualization.
 *
 * @constant
 * @type {PhysicsConceptGraph}
 *
 * @remarks
 * **Graph Statistics**:
 * - 17 total nodes (concept)
 * - 26 directed edges (relationships)
 * - 4 concept levels: foundational, intermediate, advanced, specialization
 *
 * **Node Distribution by Level**:
 * - Foundational (Level 1): 5 concepts - mathematical foundations, classical mechanics, basic physics
 * - Intermediate (Level 2): 5 concepts - quantum mechanics, electromagnetism, thermodynamics
 * - Advanced (Level 3): 4 concepts - statistical mechanics, solid state physics, advanced topics
 * - Specialization (Level 4): 3 concepts - condensed matter, phase transitions, computational methods
 *
 * **Relationship Types** (edge labels):
 * - "leads to" - Sequential progression from one concept to another
 * - "foundation for" - Required knowledge for more advanced topics
 * - "extends" - Builds upon or extends a previous concept
 * - "required for" - Prerequisite relationship
 *
 * **Color Coding**:
 * - Foundational: #64c8ff (cyan) - entry-level concepts
 * - Intermediate: #ffa500 (orange) - intermediate-level concepts
 * - Advanced: #ff6b9d (pink) - advanced-level concepts
 * - Specialization: #6BCB77 (green) - PhD specialization topics
 *
 * **Usage in Components**:
 * ```typescript
 * // In PhysicsConceptGraphComponent
 * const elements = this.buildCytoscapeElements();
 * this.cy = cytoscape({
 *   elements: elements,  // Built from PHYSICS_CONCEPT_GRAPH
 *   // ...
 * });
 * ```
 *
 * **Visual Layout**:
 * - Rendered with Cytoscape.js library
 * - Uses Dagre layout algorithm for hierarchical left-to-right arrangement
 * - Nodes are color-coded circles (60x60px) with labels
 * - Edges are directional arrows showing prerequisites/dependencies
 * - Interactive: pan, zoom, node selection, hover tooltips
 *
 * **Example Concept Dependencies**:
 * - Classical Mechanics (foundational) → Quantum Mechanics (intermediate)
 * - Thermodynamics (intermediate) → Statistical Mechanics (advanced)
 * - Statistical Mechanics (advanced) → Solid State Physics (advanced) → Phase Transitions (specialization)
 *
 * @see PhysicsConceptGraphComponent - Component that visualizes this graph
 * @see ConceptNode - Node data structure
 * @see ConceptEdge - Edge data structure
 * @see PHYSICS_KNOWLEDGE_PATH - Complementary curriculum structure
 *
 * @version 1.0
 * @since 2024
 */
export const PHYSICS_CONCEPT_GRAPH: PhysicsConceptGraph = {
  // Nodes represent key physics concepts
  nodes: [
    // Foundation Level
    {
      id: 'mechanics-foundations',
      label: 'Classical Mechanics',
      level: 'foundational',
      description: 'Newton\'s laws, kinematics, dynamics',
      color: '#64c8ff'
    },
    {
      id: 'calculus',
      label: 'Mathematical Methods',
      level: 'foundational',
      description: 'Calculus, differential equations, linear algebra',
      color: '#64c8ff'
    },
    {
      id: 'oscillations',
      label: 'Oscillations & Waves',
      level: 'foundational',
      description: 'Simple harmonic motion, wave mechanics',
      color: '#64c8ff'
    },

    // Intermediate Level - Core Physics
    {
      id: 'electromagnetism',
      label: 'Electromagnetism',
      level: 'intermediate',
      description: 'Maxwell\'s equations, electromagnetic fields',
      color: '#ffa500'
    },
    {
      id: 'thermodynamics-intro',
      label: 'Thermodynamics Basics',
      level: 'intermediate',
      description: 'First & second laws, entropy, free energy',
      color: '#ffa500'
    },
    {
      id: 'quantum-mechanics-intro',
      label: 'Quantum Mechanics Foundations',
      level: 'intermediate',
      description: 'Wave functions, Schrödinger equation, uncertainty principle',
      color: '#ffa500'
    },
    {
      id: 'statistical-mechanics',
      label: 'Statistical Mechanics',
      level: 'intermediate',
      description: 'Ensemble theory, probability distributions, ensembles',
      color: '#ffa500'
    },

    // Advanced Level - PhD Core
    {
      id: 'quantum-mechanics-advanced',
      label: 'Advanced Quantum Mechanics',
      level: 'advanced',
      description: 'Perturbation theory, scattering, field quantization',
      color: '#ff6b9d'
    },
    {
      id: 'thermodynamics-advanced',
      label: 'Advanced Thermodynamics',
      level: 'advanced',
      description: 'Phase transitions, critical phenomena, non-equilibrium',
      color: '#ff6b9d'
    },
    {
      id: 'solid-state-foundations',
      label: 'Solid State Physics Fundamentals',
      level: 'advanced',
      description: 'Crystal structures, lattice dynamics, band theory',
      color: '#ff6b9d'
    },
    {
      id: 'materials-physics',
      label: 'Materials Physics',
      level: 'advanced',
      description: 'Electronic properties, magnetic properties, transport',
      color: '#ff6b9d'
    },

    // Specialization Level
    {
      id: 'thermodynamics-spec',
      label: 'Thermodynamics Specialization',
      level: 'specialization',
      description: 'Specialized research in thermodynamic systems and processes',
      color: '#ff6b9d'
    },
    {
      id: 'solid-state-spec',
      label: 'Solid State Physics Specialization',
      level: 'specialization',
      description: 'Research in crystalline materials and condensed matter',
      color: '#ff6b9d'
    },
    {
      id: 'statistical-field-theory',
      label: 'Statistical Field Theory',
      level: 'specialization',
      description: 'Field-theoretic approach to phase transitions and critical phenomena',
      color: '#ff6b9d'
    },
    {
      id: 'quantum-condensed-matter',
      label: 'Quantum Condensed Matter',
      level: 'specialization',
      description: 'Quantum effects in condensed matter systems',
      color: '#ff6b9d'
    }
  ],

  // Edges represent relationships and dependencies
  edges: [
    // Foundational → Intermediate
    { source: 'mechanics-foundations', target: 'oscillations', label: 'leads to' },
    { source: 'mechanics-foundations', target: 'electromagnetism', label: 'foundation for' },
    { source: 'calculus', target: 'mechanics-foundations', label: 'required for' },
    { source: 'oscillations', target: 'quantum-mechanics-intro', label: 'foundation for' },
    { source: 'mechanics-foundations', target: 'thermodynamics-intro', label: 'foundation for' },

    // Intermediate connections
    { source: 'thermodynamics-intro', target: 'statistical-mechanics', label: 'leads to' },
    { source: 'quantum-mechanics-intro', target: 'statistical-mechanics', label: 'foundation for' },
    { source: 'electromagnetism', target: 'quantum-mechanics-intro', label: 'required for' },

    // Intermediate → Advanced
    { source: 'quantum-mechanics-intro', target: 'quantum-mechanics-advanced', label: 'leads to' },
    { source: 'thermodynamics-intro', target: 'thermodynamics-advanced', label: 'leads to' },
    { source: 'statistical-mechanics', target: 'thermodynamics-advanced', label: 'foundation for' },
    { source: 'electromagnetism', target: 'solid-state-foundations', label: 'foundation for' },
    { source: 'quantum-mechanics-intro', target: 'solid-state-foundations', label: 'foundation for' },
    { source: 'solid-state-foundations', target: 'materials-physics', label: 'leads to' },

    // Advanced → Specialization
    { source: 'quantum-mechanics-advanced', target: 'quantum-condensed-matter', label: 'leads to' },
    { source: 'thermodynamics-advanced', target: 'thermodynamics-spec', label: 'leads to' },
    { source: 'thermodynamics-advanced', target: 'statistical-field-theory', label: 'foundation for' },
    { source: 'statistical-mechanics', target: 'statistical-field-theory', label: 'foundation for' },
    { source: 'solid-state-foundations', target: 'solid-state-spec', label: 'leads to' },
    { source: 'materials-physics', target: 'solid-state-spec', label: 'extends' },
    { source: 'quantum-mechanics-advanced', target: 'solid-state-spec', label: 'foundation for' },
    { source: 'thermodynamics-advanced', target: 'quantum-condensed-matter', label: 'foundation for' },
    { source: 'solid-state-foundations', target: 'quantum-condensed-matter', label: 'foundation for' },

    // Cross-specialization
    { source: 'thermodynamics-spec', target: 'statistical-field-theory', label: 'related' },
    { source: 'solid-state-spec', target: 'quantum-condensed-matter', label: 'related' }
  ]
};
