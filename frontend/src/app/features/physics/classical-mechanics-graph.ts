/**
 * Classical Mechanics Topic Graph Data Structure
 *
 * @fileoverview
 * Defines the complete topic dependency graph for the Classical Mechanics course.
 * Represents hierarchical relationships between topics from foundational concepts
 * (vectors, Newtonian mechanics) through core topics (rigid bodies, gravitation)
 * to advanced topics (Lagrangian, Hamiltonian, relativity).
 *
 * @remarks
 * Graph Structure:
 * - 18 nodes representing classical mechanics topics
 * - 27 edges showing prerequisite, foundation, extension relationships
 * - 3 levels: foundational (blue), core (orange), advanced (pink)
 * - Organized to support curriculum planning and concept mapping
 *
 * Relationship Types:
 * - "prerequisite": Required knowledge before studying target topic
 * - "foundation": Provides conceptual basis for target topic
 * - "extends": Target topic builds upon and expands source topic
 * - "related": Topics share connections but no strict dependency
 *
 * Usage:
 * - Used by ClassicalMechanicsGraphComponent
 * - Visualized via KnowledgeGraphComponent with Cytoscape.js
 * - Exported as constant CLASSICAL_MECHANICS_GRAPH
 * - Nodes: id, label, description, level, color
 * - Edges: source, target, relationship label
 *
 * Course Coverage:
 * - Foundational: Vectors/Calculus, Newtonian Mechanics, 1D Motion (3 topics)
 * - Core: 2D/3D Motion, Particle Systems, Rigid Bodies, Gravitation, Rotating Frames, Continuous Media (6 topics)
 * - Advanced: Lagrange Equations, Tensors, Rigid Body Rotation, Small Vibrations, Special Relativity, Relativistic Dynamics, Central Forces, Hamiltonian (9 topics)
 *
 * @see ClassicalMechanicsGraphComponent
 * @see KnowledgeGraphComponent
 * @see PhysicsKnowledgePath (syllabus details)
 *
 * @version 1.0
 * @since 2024
 */

/**
 * Represents a single topic node in the classical mechanics curriculum.
 *
 * Topic nodes are individual concepts or subject areas within the Classical Mechanics course.
 * Each node has a specific academic level and relationships to other topics that form a
 * prerequisite and extension graph for curriculum planning and concept mapping.
 *
 * @interface TopicNode
 * @property {string} id - Unique identifier in kebab-case (e.g., "newtonian-mechanics", "rigid-bodies")
 * @property {string} label - Display name of the topic (human-readable)
 * @property {string} description - Brief explanation of the topic's content and scope
 * @property {'foundational' | 'core' | 'advanced'} level
 *           Academic level classification:
 *           - 'foundational': Basic concepts required for all other topics (color: #64c8ff)
 *           - 'core': Central topics forming the bulk of the curriculum (color: #ffa500)
 *           - 'advanced': Specialized extensions and cutting-edge topics (color: #ff6b9d)
 * @property {string} [color] - Optional hex color for graph visualization (overrides level default)
 *
 * @remarks
 * **Property Details**:
 * - **id**: Kebab-case format. Examples: "newtonian-mechanics", "rigid-body-rotation", "lagrange-equations"
 * - **label**: Displayed in graph nodes and legend. Examples: "Elements of Newtonian Mechanics", "Rigid Body Rotation"
 * - **description**: 1-2 sentence overview. Example: "Newton's laws, forces, and basic dynamics"
 * - **level**: Determines:
 *   - `'foundational'`: Cyan (#64c8ff) - Entry-level concepts needed first
 *   - `'core'`: Orange (#ffa500) - Main curriculum content
 *   - `'advanced'`: Pink (#ff6b9d) - Specialized/cutting-edge topics
 * - **color**: Optional override for node background color in visualization. Uses level default if omitted
 *
 * **Academic Levels in Classical Mechanics**:
 * - **Foundational (3)**: Vectors & Calculus, Newtonian Mechanics, 1D Kinematics
 * - **Core (6)**: 2D/3D Motion, Particle Systems, Rigid Bodies, Gravitation, Rotating Frames, Continuous Media
 * - **Advanced (9)**: Lagrange, Tensors, Rotation Dynamics, Vibrations, Relativity, Hamiltonian, etc.
 *
 * @example
 * ```typescript
 * const node: TopicNode = {
 *   id: 'newtonian-mechanics',
 *   label: 'Elements of Newtonian Mechanics',
 *   description: 'Newton\'s laws, forces, and basic dynamics',
 *   level: 'foundational',
 *   color: '#64c8ff'
 * };
 * ```
 *
 * @see TopicEdge - Relationships connecting topic nodes
 * @see TopicGraph - Complete graph containing all nodes
 * @see CLASSICAL_MECHANICS_GRAPH - The exported instance
 */
export interface TopicNode {
  /**
   * Unique identifier in kebab-case (e.g., "newtonian-mechanics", "rigid-bodies")
   */
  id: string;

  /**
   * Display name of the topic (human-readable)
   */
  label: string;

  /**
   * Brief explanation of the topic's content and scope
   */
  description: string;

  /**
   * Academic level classification (foundational/core/advanced)
   */
  level: 'foundational' | 'core' | 'advanced';

  /**
   * Optional hex color for graph visualization (overrides level default)
   */
  color?: string;
}

/**
 * Represents a directed edge (relationship) between two topics in the Classical Mechanics curriculum.
 *
 * Edges define prerequisite dependencies, conceptual foundations, and knowledge extensions
 * between topics. They form the structure of the curriculum's topic dependency graph.
 *
 * @interface TopicEdge
 * @property {string} source - ID of the source (origin) topic node
 * @property {string} target - ID of the target (destination) topic node
 * @property {string} label - Relationship type describing the edge:
 *           - 'prerequisite': Target requires mastery of source before being studied
 *           - 'foundation': Source provides conceptual basis for target
 *           - 'extends': Target builds upon and extends the knowledge in source
 *           - 'related': Topics share connections but no strict dependency exists
 *
 * @remarks
 * **Directionality & Meaning**:
 * The directed nature of edges means source → target with semantic meaning:
 * - `source --label--> target` = "source is the label-type of target"
 * - `vectors-calculus --prerequisite--> newtonian-mechanics` = "Vectors & Calculus is prerequisite for Newtonian Mechanics"
 *
 * **Relationship Types** (4 categories):
 * - **'prerequisite'**: Target cannot be studied effectively without mastery of source first
 *   - Examples: vectors-calculus → newtonian-mechanics, kinematics-1d → kinematics-3d
 * - **'foundation'**: Source provides the conceptual/mathematical foundation for target
 *   - Examples: newtonian-mechanics → lagrange-equations (Newton's laws underlie Lagrangian)
 * - **'extends'**: Target is an extension, generalization, or advanced application of source
 *   - Examples: kinematics-1d → kinematics-3d, particle-motion → rigid-body-motion
 * - **'related'**: Topics are conceptually connected but have no strict dependency
 *   - Examples: rigid-body-motion ← → rotating-frames (both involve rotation, mutual context)
 *
 * **Graph Context**:
 * - Classical Mechanics has 27 total edges across 18 nodes
 * - Creates a Directed Acyclic Graph (DAG) - no circular dependencies
 * - Visualized with Cytoscape.js using arrow edges pointing source → target
 *
 * @example
 * ```typescript
 * const edge: TopicEdge = {
 *   source: 'kinematics-1d',
 *   target: 'kinematics-3d',
 *   label: 'extends'
 * };
 * // Means: 1D Kinematics extends into 3D Kinematics
 * ```
 *
 * @see TopicNode - Nodes that are connected by these edges
 * @see TopicGraph - Complete graph containing all edges
 * @see CLASSICAL_MECHANICS_GRAPH - The exported instance
 */
export interface TopicEdge {
  /**
   * ID of the source (origin) topic node
   */
  source: string;

  /**
   * ID of the target (destination) topic node
   */
  target: string;

  /**
   * Relationship type describing the edge (prerequisite/foundation/extends/related)
   */
  label: string;
}

/**
 * Complete topic graph data structure
 *
 * @interface TopicGraph
 * @property {TopicNode[]} nodes - All topic nodes in the curriculum graph
 * @property {TopicEdge[]} edges - All topic relationships and dependencies
 *
 * @remarks
 * TopicGraph represents a complete directed acyclic graph (DAG) of curriculum topics
 * with prerequisite and dependency relationships. Used across curriculum planning,
 * visualization, and knowledge mapping components.
 *
 * @see TopicNode - Individual topic nodes
 * @see TopicEdge - Relationships between topics
 */
export interface TopicGraph {
  /**
   * All topic nodes in the curriculum graph
   */
  nodes: TopicNode[];

  /**
   * All topic relationships and dependencies
   */
  edges: TopicEdge[];
}

/**
 * Classical Mechanics Topic Dependency Graph
 *
 * Complete topic dependency graph for the Classical Mechanics course showing prerequisites,
 * conceptual foundations, and knowledge extensions between all course topics.
 * This graph visualizes the curriculum structure and helps plan learning pathways.
 *
 * @constant
 * @type {TopicGraph}
 *
 * @remarks
 * **Graph Statistics**:
 * - 18 total topic nodes
 * - 27 directed edges (relationships)
 * - 3 academic levels: foundational, core, advanced
 *
 * **Topic Distribution by Level**:
 * - Foundational (3 topics): Vectors/Calculus, Newtonian Mechanics, 1D Kinematics
 *   - Color: #64c8ff (cyan)
 *   - Required entry-level concepts
 *
 * - Core (6 topics): 2D/3D Motion, Particle Systems, Rigid Bodies, Gravitation, Rotating Frames, Continuous Media
 *   - Color: #ffa500 (orange)
 *   - Central curriculum topics
 *
 * - Advanced (9 topics): Lagrange, Tensors, Rigid Rotation, Small Vibrations, Special Relativity, Relativistic Dynamics, Central Forces, Hamiltonian, Energy Methods
 *   - Color: #ff6b9d (pink)
 *   - Specialized and advanced topics
 *
 * **Relationship Types** (edge labels):
 * - "prerequisite" - Target requires source knowledge (strict dependency)
 * - "foundation" - Source provides conceptual basis for target
 * - "extends" - Target extends/builds upon source
 * - "related" - Topics share connections without strict dependency
 *
 * **Example Prerequisite Chains**:
 * 1. Vectors/Calculus → Newtonian Mechanics → Kinematics (1D) → Kinematics (3D)
 * 2. Kinematics (3D) → Particle Systems → Rigid Bodies
 * 3. Newtonian Mechanics → Central Forces → Gravitation
 * 4. Kinematics (3D) + Dynamics → Lagrange Equations → Hamiltonian Formalism
 *
 * **Visual Rendering**:
 * - Rendered with Cytoscape.js in ClassicalMechanicsGraphComponent
 * - Uses Dagre layout for hierarchical left-to-right arrangement
 * - Color-coded by level for visual categorization
 * - Interactive: pan, zoom, node selection, hover tooltips
 * - Shows relationship type on edge hover
 *
 * **Usage**:
 * ```typescript
 * // Access topics by level
 * const foundational = CLASSICAL_MECHANICS_GRAPH.nodes
 *   .filter(n => n.level === 'foundational');
 *
 * // Find prerequisites for a topic
 * const topic = 'rigid-bodies';
 * const prerequisites = CLASSICAL_MECHANICS_GRAPH.edges
 *   .filter(e => e.target === topic && e.label === 'prerequisite')
 *   .map(e => e.source);
 * ```
 *
 * @see ClassicalMechanicsGraphComponent - Component that visualizes this graph
 * @see KnowledgeGraphComponent - Generic graph visualization component
 * @see TopicNode - Individual topic data structure
 * @see TopicEdge - Relationship data structure
 *
 * @version 1.0
 * @since 2024
 */
export const CLASSICAL_MECHANICS_GRAPH: TopicGraph = {
  nodes: [
    // Foundational Topics
    {
      id: 'newtonian-mechanics',
      label: 'Elements of Newtonian Mechanics',
      description: 'Newton\'s laws, forces, and basic dynamics',
      level: 'foundational',
      color: '#64c8ff'
    },
    {
      id: 'vectors-calculus',
      label: 'Vectors & Calculus',
      description: 'Vector algebra, differentiation, and integration',
      level: 'foundational',
      color: '#64c8ff'
    },
    {
      id: 'kinematics-1d',
      label: 'Motion in One Dimension',
      description: 'Kinematics and dynamics in 1D, velocity, acceleration',
      level: 'foundational',
      color: '#64c8ff'
    },

    // Core Topics
    {
      id: 'kinematics-3d',
      label: 'Motion in Two/Three Dimensions',
      description: 'Projectile motion, curved paths, vector dynamics',
      level: 'core',
      color: '#ffa500'
    },
    {
      id: 'systems-particles',
      label: 'Motion of Systems of Particles',
      description: 'Center of mass, momentum conservation, collisions',
      level: 'core',
      color: '#ffa500'
    },
    {
      id: 'rigid-bodies',
      label: 'Rigid Bodies and Rotation about an Axis',
      description: 'Moment of inertia, angular momentum, torque',
      level: 'core',
      color: '#ffa500'
    },
    {
      id: 'gravitation',
      label: 'Gravitation',
      description: 'Newton\'s law of gravitation, orbital mechanics, gravity fields',
      level: 'core',
      color: '#ffa500'
    },
    {
      id: 'moving-coordinates',
      label: 'Moving Coordinate Systems',
      description: 'Rotating frames, fictitious forces, Coriolis effect',
      level: 'core',
      color: '#ffa500'
    },
    {
      id: 'continuous-media',
      label: 'Intro to Mechanics of Continuous Media',
      description: 'Stress, strain, elasticity, fluid basics',
      level: 'core',
      color: '#ffa500'
    },

    // Advanced Topics
    {
      id: 'lagrange-equations',
      label: 'Lagrange\'s Equations',
      description: 'Generalized coordinates, principle of least action',
      level: 'advanced',
      color: '#ff6b9d'
    },
    {
      id: 'tensors',
      label: 'Tensors: Algebra, Inertia & Stress',
      description: 'Tensor notation, inertia tensors, stress tensors',
      level: 'advanced',
      color: '#ff6b9d'
    },
    {
      id: 'rigid-body-rotation',
      label: 'Theory of Rigid Body Rotation',
      description: 'Rotation matrices, Euler angles, angular velocity',
      level: 'advanced',
      color: '#ff6b9d'
    },
    {
      id: 'small-vibrations',
      label: 'Theory of Small Vibrations',
      description: 'Normal modes, coupled oscillators, stability analysis',
      level: 'advanced',
      color: '#ff6b9d'
    },
    {
      id: 'special-relativity',
      label: 'Special Relativity',
      description: 'Lorentz transformations, spacetime, relativistic mechanics',
      level: 'advanced',
      color: '#ff6b9d'
    },
    {
      id: 'relativistic-dynamics',
      label: 'Relativistic Dynamics',
      description: 'Energy-momentum, relativistic collisions, fields',
      level: 'advanced',
      color: '#ff6b9d'
    },
    {
      id: 'central-forces',
      label: 'Central Forces',
      description: 'Two-body problems, Kepler\'s laws, scattering',
      level: 'advanced',
      color: '#ff6b9d'
    },
    {
      id: 'hamiltonian',
      label: 'Hamiltonian Mechanics',
      description: 'Phase space, canonical transformations, action-angle variables',
      level: 'advanced',
      color: '#ff6b9d'
    }
  ],

  edges: [
    // Foundational → Core
    { source: 'vectors-calculus', target: 'newtonian-mechanics', label: 'prerequisite' },
    { source: 'newtonian-mechanics', target: 'kinematics-1d', label: 'foundation' },
    { source: 'kinematics-1d', target: 'kinematics-3d', label: 'extends' },
    { source: 'newtonian-mechanics', target: 'kinematics-3d', label: 'foundation' },
    { source: 'kinematics-1d', target: 'systems-particles', label: 'foundation' },
    { source: 'kinematics-3d', target: 'systems-particles', label: 'foundation' },
    { source: 'systems-particles', target: 'rigid-bodies', label: 'extends' },
    { source: 'newtonian-mechanics', target: 'gravitation', label: 'foundation' },
    { source: 'kinematics-3d', target: 'gravitation', label: 'related' },
    { source: 'rigid-bodies', target: 'moving-coordinates', label: 'foundation' },
    { source: 'systems-particles', target: 'continuous-media', label: 'extends' },

    // Core → Advanced
    { source: 'kinematics-3d', target: 'lagrange-equations', label: 'foundation' },
    { source: 'systems-particles', target: 'lagrange-equations', label: 'foundation' },
    { source: 'rigid-bodies', target: 'tensors', label: 'foundation' },
    { source: 'rigid-bodies', target: 'rigid-body-rotation', label: 'extends' },
    { source: 'systems-particles', target: 'small-vibrations', label: 'foundation' },
    { source: 'newtonian-mechanics', target: 'special-relativity', label: 'prerequisite' },
    { source: 'special-relativity', target: 'relativistic-dynamics', label: 'extends' },
    { source: 'gravitation', target: 'central-forces', label: 'foundation' },
    { source: 'kinematics-3d', target: 'central-forces', label: 'foundation' },
    { source: 'lagrange-equations', target: 'hamiltonian', label: 'extends' },

    // Cross-topic relationships
    { source: 'lagrange-equations', target: 'rigid-body-rotation', label: 'related' },
    { source: 'lagrange-equations', target: 'small-vibrations', label: 'related' },
    { source: 'tensors', target: 'continuous-media', label: 'related' },
    { source: 'moving-coordinates', target: 'special-relativity', label: 'related' }
  ]
};
