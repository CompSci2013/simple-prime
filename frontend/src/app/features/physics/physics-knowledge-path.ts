/**
 * Physics Knowledge Path Data Structure
 *
 * @fileoverview
 * Defines the complete hierarchical curriculum structure for physics PhD program with
 * specialization in Thermodynamics and Solid State Matter. Organizes 1300+ hours of
 * coursework across three academic tiers with detailed syllabi for each topic.
 *
 * @remarks
 * Curriculum Organization:
 * - Tier 1: Undergraduate Physics (Years 1-2)
 *   - Classical Mechanics, Electromagnetism, Quantum Mechanics I & II
 *   - 4 courses, ~130 hours total per course
 *
 * - Tier 2: Graduate Physics (Years 2-3)
 *   - Thermodynamics & Statistical Mechanics, Solid State Fundamentals
 *   - Modern Physics Topics, Condensed Matter I
 *   - 4 courses, ~210-230 hours total per course
 *
 * - Tier 3: PhD Specialization (Years 3-4+)
 *   - Advanced Thermodynamics, Condensed Matter II
 *   - Phase Transitions, Solid State Thermodynamics
 *   - Defects & Disorder, Advanced Materials, Computational Methods
 *   - 7 specialized courses, ~210-245 hours total per course
 *
 * Data Structure:
 * - Hierarchical tree with PhysicsNode at each level
 * - Each node contains: id, title, icon, description, level, year
 * - Children array for nested topics
 * - Syllabus array with detailed topic breakdowns
 * - SyllabusItem includes: topic, description, keyPoints, estimatedHours
 *
 * Usage:
 * - Used by PhysicsComponent for rendering curriculum tree
 * - PhysicsSyllabusComponent displays detailed syllabus
 * - Icons provide visual categorization
 * - Estimated hours support planning and progress tracking
 *
 * Total Content:
 * - 15 major courses across 3 tiers
 * - ~110 syllabus topics with detailed key points
 * - Estimated 2,500+ total study hours
 * - Progressive depth: foundational → core → specialized
 *
 * @see PhysicsComponent
 * @see PhysicsSyllabusComponent
 * @see PHYSICS_CONCEPT_GRAPH (concept relationships)
 *
 * @version 1.0
 * @since 2024
 */

/**
 * Represents a single node in the physics curriculum hierarchy
 *
 * Nodes form a tree structure representing the complete physics curriculum from
 * undergraduate foundations through PhD specialization. Each node can have child nodes
 * and an optional syllabus with detailed topic breakdowns.
 *
 * @interface PhysicsNode
 * @property {string} id - Unique identifier for the node (kebab-case)
 * @property {string} title - Display name of the topic/course
 * @property {string} icon - Emoji icon for visual categorization
 * @property {string} description - Brief summary of content
 * @property {string} level - Academic tier (undergraduate/graduate/phd-specialization)
 * @property {number} year - Typical year in curriculum (1-4)
 * @property {PhysicsNode[]} [children] - Nested child topics
 * @property {SyllabusItem[]} [syllabus] - Detailed topic breakdowns
 *
 * @remarks
 * **Property Details**:
 * - **id**: Kebab-case identifier. Examples: "tier-1-undergrad", "classical-mechanics", "quantum-field-theory"
 * - **title**: Human-readable course/topic name. Examples: "Classical Mechanics", "Quantum Mechanics", "PhD Specialization"
 * - **icon**: Single emoji character for visual identification. Examples: "📚" (course), "⚛️" (physics), "🔬" (advanced)
 * - **description**: 1-2 sentence overview of the course/topic content and learning outcomes
 * - **level**: Tier in the curriculum structure:
 *   - `'undergraduate'`: Years 1-4, foundational physics courses
 *   - `'graduate'`: Years 5-6, advanced core physics
 *   - `'phd-specialization'`: Years 7+, specialized research topics
 * - **year**: Number from 1 to 4 indicating typical curriculum year. Values 5+ for graduate courses
 * - **children**: Optional array of child nodes forming a hierarchical tree. Root has 3 tier nodes; each tier has course children
 * - **syllabus**: Optional detailed syllabus with topics, key points, and estimated study hours for this node
 *
 * **Hierarchy Example**:
 * ```
 * PHYSICS_KNOWLEDGE_PATH [0]
 *   ├─ Tier 1: Undergraduate Physics
 *   │  ├─ Classical Mechanics (1 course)
 *   │  ├─ Electricity & Magnetism (1 course)
 *   │  ├─ Thermodynamics (1 course)
 *   │  └─ Quantum Mechanics I (1 course)
 *   ├─ Tier 2: Graduate Physics
 *   │  ├─ Classical Field Theory (1 course)
 *   │  ├─ Quantum Mechanics II (1 course)
 *   │  └─ Statistical Mechanics (1 course)
 *   └─ Tier 3: PhD Specialization
 *      ├─ Advanced Quantum Mechanics (1 course)
 *      ├─ Solid State Physics (1 course)
 *      └─ [more specialization courses...]
 * ```
 *
 * @see SyllabusItem - Detailed topics within a node
 * @see PHYSICS_KNOWLEDGE_PATH - Complete curriculum tree
 */
export interface PhysicsNode {
  /**
   * Unique identifier for the node (kebab-case)
   */
  id: string;

  /**
   * Display name of the topic/course
   */
  title: string;

  /**
   * Emoji icon for visual categorization
   */
  icon: string;

  /**
   * Brief summary of content
   */
  description: string;

  /**
   * Academic tier (undergraduate/graduate/phd-specialization)
   */
  level: 'undergraduate' | 'graduate' | 'phd-specialization';

  /**
   * Typical year in curriculum (1-4)
   */
  year: number;

  /**
   * Nested child topics
   */
  children?: PhysicsNode[];

  /**
   * Detailed topic breakdowns
   */
  syllabus?: SyllabusItem[];
}

/**
 * Represents a single syllabus topic within a course
 *
 * Fine-grained breakdown of topics covered in a physics course. Each syllabus item
 * represents a specific subject area, its key concepts, and estimated study time.
 * These are contained in a PhysicsNode's syllabus array.
 *
 * @interface SyllabusItem
 * @property {string} topic - Name of the syllabus topic
 * @property {string} description - Brief explanation of topic content
 * @property {string[]} keyPoints - Bullet points of key concepts covered
 * @property {number} estimatedHours - Approximate study hours for mastery
 *
 * @remarks
 * **Purpose**:
 * SyllabusItem objects provide a detailed breakdown of what's covered in each physics course.
 * They help students understand the scope and time investment for each topic.
 *
 * **Property Details**:
 * - **topic**: Main subject area. Examples: "Classical Mechanics", "Wave Mechanics", "Quantum Field Theory"
 * - **description**: Concise 1-2 sentence overview of the topic's scope. Example: "Lagrangian formalism, oscillations, dynamics"
 * - **keyPoints**: Array of important concepts and subtopics to study. Examples:
 *   - ["Lagrangian & Hamiltonian", "Oscillations & Waves", "Central Forces"]
 *   - ["Operator formalism", "Eigenvalue problems", "Perturbation theory"]
 *   - ["Field quantization", "Feynman diagrams", "Cross sections"]
 * - **estimatedHours**: Total study hours needed to master this topic (including lectures, reading, problem sets, exams)
 *
 * **Usage in PhysicsNode**:
 * Each course PhysicsNode contains an optional `syllabus: SyllabusItem[]` array.
 * Expanding a course shows all its syllabus items with estimated time per topic.
 *
 * **Curriculum Statistics**:
 * - Total of ~110 syllabus items across all 15 courses
 * - Average 7-8 items per course
 * - Total estimated hours: 2,500+
 * - Ranges from 20 hours (intro topics) to 80+ hours (advanced specializations)
 *
 * **Example**:
 * ```typescript
 * const mechanics: SyllabusItem = {
 *   topic: 'Classical Mechanics',
 *   description: 'Lagrangian formalism, oscillations, dynamics',
 *   keyPoints: [
 *     'Lagrangian & Hamiltonian mechanics',
 *     'Oscillations & Waves',
 *     'Central Forces & Orbits',
 *     'Small oscillations & resonance'
 *   ],
 *   estimatedHours: 40
 * };
 * ```
 *
 * @see PhysicsNode - Parent node that contains syllabus items
 * @see PHYSICS_KNOWLEDGE_PATH - Complete curriculum containing all syllabus items
 */
export interface SyllabusItem {
  /**
   * Name of the syllabus topic
   */
  topic: string;

  /**
   * Brief explanation of topic content
   */
  description: string;

  /**
   * Bullet points of key concepts covered
   */
  keyPoints: string[];

  /**
   * Approximate study hours for mastery
   */
  estimatedHours: number;
}

/**
 * Complete Physics PhD Curriculum Knowledge Path
 *
 * Hierarchical array containing the complete 3-tier physics curriculum structure
 * from undergraduate foundations through PhD specialization. This is the primary
 * data source for rendering the physics curriculum tree and syllabus views.
 *
 * @constant
 * @type {PhysicsNode[]}
 *
 * @remarks
 * **Structure**:
 * Root array contains 3 tier nodes:
 * - Tier 1: Undergraduate Physics (4 courses)
 * - Tier 2: Graduate Physics (4 courses)
 * - Tier 3: PhD Specialization (7 courses)
 *
 * **Total Curriculum Stats**:
 * - 15 major courses total
 * - ~110 individual syllabus topics
 * - ~2,500+ total estimated study hours
 * - 6-8 year typical duration (undergrad + grad + PhD)
 *
 * **Specialization Track**:
 * PhD specialization focuses on:
 * - Thermodynamics & Statistical Mechanics
 * - Solid State Matter & Materials Science
 * - Computational Methods
 * - Advanced topics in condensed matter physics
 *
 * **Usage**:
 * ```typescript
 * // Render tier 1 courses
 * PHYSICS_KNOWLEDGE_PATH[0].children // → Array of 4 undergraduate courses
 *
 * // Access specific course
 * PHYSICS_KNOWLEDGE_PATH[0].children[0] // → Classical Mechanics course
 *
 * // Get syllabus for a course
 * PHYSICS_KNOWLEDGE_PATH[0].children[0].syllabus // → Array of SyllabusItem
 * ```
 *
 * @see PhysicsComponent - Component that displays this curriculum
 * @see PhysicsSyllabusComponent - Component that shows detailed syllabus
 * @see PHYSICS_CONCEPT_GRAPH - Concept relationships for knowledge graph
 *
 * @version 1.0
 * @since 2024
 */
export const PHYSICS_KNOWLEDGE_PATH: PhysicsNode[] = [
  {
    id: 'tier-1-undergraduate',
    title: 'Undergraduate Physics',
    icon: '📚',
    description: 'Foundational physics - Years 1-2',
    level: 'undergraduate',
    year: 1,
    children: [
      {
        id: 'classical-mechanics',
        title: 'Classical Mechanics',
        icon: '⚙️',
        description: 'Lagrangian formalism, oscillations, dynamics',
        level: 'undergraduate',
        year: 1,
        syllabus: [
          {
            topic: 'Lagrangian & Hamiltonian Formalism',
            description: 'Mathematical foundation for classical mechanics',
            keyPoints: [
              'Principle of least action',
              'Euler-Lagrange equations',
              'Canonical transformations',
              'Hamiltonian mechanics'
            ],
            estimatedHours: 40
          },
          {
            topic: 'Oscillations & Waves',
            description: 'Simple and coupled oscillators, wave propagation',
            keyPoints: [
              'Simple harmonic motion',
              'Damped oscillations',
              'Forced oscillations and resonance',
              'Coupled oscillators',
              'Wave equation and solutions'
            ],
            estimatedHours: 35
          },
          {
            topic: 'Central Forces & Orbital Mechanics',
            description: 'Two-body problems and gravitational systems',
            keyPoints: [
              'Kepler problem',
              'Orbital mechanics',
              'Scattering theory basics',
              'Reduced mass coordinates'
            ],
            estimatedHours: 30
          },
          {
            topic: 'Rigid Body Dynamics',
            description: 'Rotation, moment of inertia, angular momentum',
            keyPoints: [
              'Moment of inertia tensor',
              'Euler angles',
              'Euler equations',
              'Gyroscopic motion'
            ],
            estimatedHours: 25
          },
          {
            topic: 'Continuum Mechanics Basics',
            description: 'Stress, strain, elasticity introduction',
            keyPoints: [
              'Stress and strain tensors',
              'Hooke\'s law',
              'Elastic moduli',
              'Fluid mechanics basics'
            ],
            estimatedHours: 20
          }
        ]
      },
      {
        id: 'electromagnetism',
        title: 'Electromagnetism',
        icon: '⚡',
        description: 'Maxwell equations, radiation, relativistic foundations',
        level: 'undergraduate',
        year: 1,
        syllabus: [
          {
            topic: 'Electromagnetic Theory & Maxwell Equations',
            description: 'Fundamental equations governing electromagnetism',
            keyPoints: [
              'Gauss\'s law',
              'Ampere-Maxwell law',
              'Faraday\'s law',
              'Continuity equation',
              'Electromagnetic potentials'
            ],
            estimatedHours: 45
          },
          {
            topic: 'Electrostatics & Magnetostatics',
            description: 'Static field solutions and boundary conditions',
            keyPoints: [
              'Boundary value problems',
              'Poisson and Laplace equations',
              'Multipole expansion',
              'Dielectric materials',
              'Magnetic materials'
            ],
            estimatedHours: 40
          },
          {
            topic: 'Wave Propagation & Radiation',
            description: 'Electromagnetic waves and radiating systems',
            keyPoints: [
              'Wave equation in EM',
              'Polarization',
              'Dispersion relations',
              'Radiation from accelerating charges',
              'Dipole radiation'
            ],
            estimatedHours: 35
          },
          {
            topic: 'Special Relativity Foundations',
            description: 'Lorentz transformations and relativistic mechanics',
            keyPoints: [
              'Lorentz transformations',
              'Four-vectors',
              'Energy-momentum relation',
              'Relativistic electromagnetism'
            ],
            estimatedHours: 30
          },
          {
            topic: 'Plasma Physics Introduction',
            description: 'Ionized gases and collective phenomena',
            keyPoints: [
              'Plasma basics',
              'Debye screening',
              'Plasma oscillations',
              'Kinetic theory'
            ],
            estimatedHours: 25
          }
        ]
      },
      {
        id: 'quantum-mechanics-i',
        title: 'Quantum Mechanics I',
        icon: '🌊',
        description: 'Wave-particle duality, Schrödinger equation, operators',
        level: 'undergraduate',
        year: 1,
        syllabus: [
          {
            topic: 'Wave-Particle Duality',
            description: 'Photons, matter waves, probability interpretation',
            keyPoints: [
              'Planck\'s hypothesis',
              'Photoelectric effect',
              'de Broglie waves',
              'Double-slit experiment',
              'Uncertainty principle'
            ],
            estimatedHours: 30
          },
          {
            topic: 'Schrödinger Equation',
            description: 'Time-dependent and time-independent forms',
            keyPoints: [
              'Wave function interpretation',
              'Postulates of quantum mechanics',
              'Expectation values',
              'Normalization and orthogonality'
            ],
            estimatedHours: 40
          },
          {
            topic: 'Operators & Observables',
            description: 'Mathematical framework of quantum mechanics',
            keyPoints: [
              'Hermitian operators',
              'Commutation relations',
              'Eigenvalues and eigenstates',
              'Complete sets of operators'
            ],
            estimatedHours: 35
          },
          {
            topic: 'Perturbation Theory',
            description: 'Approximation methods for nearby states',
            keyPoints: [
              'Time-independent perturbation theory',
              'Degenerate perturbation theory',
              'Variational principle',
              'WKB approximation'
            ],
            estimatedHours: 30
          },
          {
            topic: 'Spin & Angular Momentum',
            description: 'Intrinsic angular momentum and spin operators',
            keyPoints: [
              'Spin-1/2 systems',
              'Pauli matrices',
              'Total angular momentum',
              'Clebsch-Gordan coefficients'
            ],
            estimatedHours: 35
          }
        ]
      },
      {
        id: 'quantum-mechanics-ii',
        title: 'Quantum Mechanics II',
        icon: '⟨ψ|',
        description: 'Identical particles, approximations, quantum field theory intro',
        level: 'undergraduate',
        year: 2,
        syllabus: [
          {
            topic: 'Identical Particles & Quantum Statistics',
            description: 'Bosons, fermions, and exchange symmetry',
            keyPoints: [
              'Indistinguishability',
              'Symmetry under particle exchange',
              'Fermi-Dirac statistics',
              'Bose-Einstein statistics',
              'Pauli exclusion principle'
            ],
            estimatedHours: 35
          },
          {
            topic: 'Approximation Methods',
            description: 'Beyond perturbation theory techniques',
            keyPoints: [
              'Born approximation',
              'Sudden approximation',
              'Adiabatic theorem',
              'Green\'s functions'
            ],
            estimatedHours: 30
          },
          {
            topic: 'Scattering Theory',
            description: 'Interaction between particles and potentials',
            keyPoints: [
              'Scattering amplitude',
              'Partial wave analysis',
              'Phase shifts',
              'Optical theorem',
              'Resonances'
            ],
            estimatedHours: 40
          },
          {
            topic: 'Path Integrals',
            description: 'Feynman path integral formulation',
            keyPoints: [
              'Feynman paths',
              'Propagators',
              'Functional calculus',
              'Path integral evaluations'
            ],
            estimatedHours: 25
          },
          {
            topic: 'Quantum Field Theory Introduction',
            description: 'Field quantization and particles',
            keyPoints: [
              'Classical field theory',
              'Field quantization',
              'Creation and annihilation operators',
              'Vacuum fluctuations'
            ],
            estimatedHours: 30
          }
        ]
      }
    ]
  },
  {
    id: 'tier-2-graduate',
    title: 'Graduate Physics',
    icon: '📖',
    description: 'Advanced topics - Years 2-3 of PhD',
    level: 'graduate',
    year: 2,
    children: [
      {
        id: 'thermo-stat-mech',
        title: 'Thermodynamics & Statistical Mechanics',
        icon: '🔥',
        description: 'Laws of thermodynamics, partition functions, transport',
        level: 'graduate',
        year: 2,
        syllabus: [
          {
            topic: 'Laws of Thermodynamics',
            description: 'Fundamental thermodynamic principles',
            keyPoints: [
              'Zeroth law and temperature',
              'First law and energy conservation',
              'Second law and entropy',
              'Third law',
              'Work and heat'
            ],
            estimatedHours: 35
          },
          {
            topic: 'Entropy & Free Energy',
            description: 'Thermodynamic potentials and availability',
            keyPoints: [
              'Entropy definition and properties',
              'Helmholtz free energy',
              'Gibbs free energy',
              'Enthalpy',
              'Thermodynamic stability'
            ],
            estimatedHours: 40
          },
          {
            topic: 'Phase Transitions',
            description: 'First-order and higher-order transitions',
            keyPoints: [
              'Phase diagrams',
              'Clausius-Clapeyron equation',
              'Latent heat',
              'Supercritical phenomena',
              'Metastable states'
            ],
            estimatedHours: 35
          },
          {
            topic: 'Critical Phenomena',
            description: 'Behavior near critical points',
            keyPoints: [
              'Critical exponents',
              'Scaling theory',
              'Universality',
              'Correlation functions',
              'Fluctuation-dissipation theorem'
            ],
            estimatedHours: 30
          },
          {
            topic: 'Ensemble Theory',
            description: 'Microcanonical, canonical, grand canonical ensembles',
            keyPoints: [
              'Microcanonical ensemble',
              'Canonical ensemble',
              'Grand canonical ensemble',
              'Partition functions',
              'Equivalence of ensembles'
            ],
            estimatedHours: 40
          },
          {
            topic: 'Partition Functions & Applications',
            description: 'Computing thermodynamic properties',
            keyPoints: [
              'Partition function definition',
              'Ideal gas partition function',
              'Quantum statistics partition functions',
              'Thermodynamic derivatives'
            ],
            estimatedHours: 35
          },
          {
            topic: 'Transport Phenomena',
            description: 'Heat, mass, and momentum transport',
            keyPoints: [
              'Boltzmann transport equation',
              'Thermal conductivity',
              'Viscosity',
              'Diffusion',
              'Onsager relations'
            ],
            estimatedHours: 35
          }
        ]
      },
      {
        id: 'solid-state-fund',
        title: 'Solid State Physics Fundamentals',
        icon: '🔷',
        description: 'Crystal structures, phonons, band theory, semiconductors',
        level: 'graduate',
        year: 2,
        syllabus: [
          {
            topic: 'Crystal Structures & Lattice Dynamics',
            description: 'Periodic arrangements and vibrational modes',
            keyPoints: [
              'Bravais lattices',
              'Crystal systems',
              'Reciprocal lattice',
              'Miller indices',
              'Lattice vibrations'
            ],
            estimatedHours: 40
          },
          {
            topic: 'X-ray Diffraction',
            description: 'Structure determination techniques',
            keyPoints: [
              'Bragg\'s law',
              'Structure factor',
              'Diffraction patterns',
              'Form factor',
              'Scattering amplitude'
            ],
            estimatedHours: 30
          },
          {
            topic: 'Phonons & Vibrational Properties',
            description: 'Quantized lattice vibrations',
            keyPoints: [
              'Dispersion relations',
              'Debye model',
              'Einstein model',
              'Phonon density of states',
              'Specific heat'
            ],
            estimatedHours: 40
          },
          {
            topic: 'Band Theory of Solids',
            description: 'Electronic structure in crystals',
            keyPoints: [
              'Bloch theorem',
              'Energy bands',
              'Density of states',
              'Fermi surface',
              'Effective mass'
            ],
            estimatedHours: 45
          },
          {
            topic: 'Semiconductors & Insulators',
            description: 'Band gap materials and doping',
            keyPoints: [
              'Band gap concept',
              'Intrinsic semiconductors',
              'n-type and p-type doping',
              'Carrier concentration',
              'junctions and devices'
            ],
            estimatedHours: 35
          },
          {
            topic: 'Metals & Electron Transport',
            description: 'Free electron model and conductivity',
            keyPoints: [
              'Free electron model',
              'Drude model',
              'Electrical conductivity',
              'Thermal conductivity',
              'Mobility and scattering'
            ],
            estimatedHours: 35
          }
        ]
      },
      {
        id: 'modern-physics',
        title: 'Modern Physics Topics',
        icon: '🌟',
        description: 'Atomic, molecular, nuclear, and particle physics',
        level: 'graduate',
        year: 3,
        syllabus: [
          {
            topic: 'Atomic Physics',
            description: 'Multi-electron atoms and spectroscopy',
            keyPoints: [
              'Hydrogen atom',
              'Helium and multi-electron atoms',
              'Coupling schemes',
              'Hyperfine structure',
              'Atomic spectroscopy'
            ],
            estimatedHours: 35
          },
          {
            topic: 'Molecular Physics',
            description: 'Molecular structure and bonding',
            keyPoints: [
              'Born-Oppenheimer approximation',
              'Molecular orbitals',
              'Bonding and antibonding states',
              'Vibrational spectroscopy',
              'Rotational states'
            ],
            estimatedHours: 30
          },
          {
            topic: 'Nuclear Physics',
            description: 'Nuclear structure and decay',
            keyPoints: [
              'Nuclear forces',
              'Nuclear models',
              'Radioactive decay',
              'Nuclear reactions',
              'Binding energy'
            ],
            estimatedHours: 30
          },
          {
            topic: 'Particle Physics Basics',
            description: 'Standard model introduction',
            keyPoints: [
              'Fundamental particles',
              'Interactions',
              'Conservation laws',
              'Quarks and leptons',
              'Symmetries'
            ],
            estimatedHours: 25
          }
        ]
      },
      {
        id: 'condensed-matter-i',
        title: 'Condensed Matter Physics I',
        icon: '💎',
        description: 'Superconductivity, superfluidity, magnetism',
        level: 'graduate',
        year: 3,
        syllabus: [
          {
            topic: 'Electron-Phonon Interactions',
            description: 'Coupling between electrons and lattice vibrations',
            keyPoints: [
              'Polarons',
              'Electron-phonon coupling strength',
              'Deformation potential',
              'Screening effects',
              'Effective mass renormalization'
            ],
            estimatedHours: 35
          },
          {
            topic: 'Superconductivity Theory',
            description: 'BCS theory and mechanisms',
            keyPoints: [
              'Meissner effect',
              'Ginzburg-Landau theory',
              'BCS theory fundamentals',
              'Cooper pairs',
              'Energy gap',
              'Critical temperature',
              'Type I and Type II superconductors'
            ],
            estimatedHours: 45
          },
          {
            topic: 'Superfluidity',
            description: 'Quantum fluids and zero viscosity',
            keyPoints: [
              'Helium-4 superfluidity',
              'Helium-3 superfluidity',
              'Landau critical velocity',
              'Rotons',
              'Two-fluid model',
              'Vortices in superfluids'
            ],
            estimatedHours: 35
          },
          {
            topic: 'Magnetism Fundamentals',
            description: 'Origins and types of magnetism',
            keyPoints: [
              'Diamagnetism and paramagnetism',
              'Ferromagnetism',
              'Antiferromagnetism',
              'Ferrimagnetism',
              'Magnetic moment',
              'Susceptibility',
              'Exchange interactions'
            ],
            estimatedHours: 40
          },
          {
            topic: 'Magnetic Ordering in Solids',
            description: 'Magnetic structures and transitions',
            keyPoints: [
              'Magnetic structures',
              'Spin waves and magnons',
              'Magnetic anisotropy',
              'Domains and domain walls',
              'Magnetic phase transitions',
              'Curie and Néel temperatures'
            ],
            estimatedHours: 35
          }
        ]
      }
    ]
  },
  {
    id: 'tier-3-phd-specialization',
    title: 'PhD Specialization: Thermodynamics & Solid State Matter',
    icon: '🎯',
    description: 'Advanced research topics - Years 3+ of PhD',
    level: 'phd-specialization',
    year: 3,
    children: [
      {
        id: 'advanced-thermodynamics',
        title: 'Advanced Thermodynamics',
        icon: '🌡️',
        description: 'Potentials, phase behavior, surface effects',
        level: 'phd-specialization',
        year: 3,
        syllabus: [
          {
            topic: 'Thermodynamic Potentials & Maxwell Relations',
            description: 'All thermodynamic potentials and derivatives',
            keyPoints: [
              'Internal energy',
              'Enthalpy',
              'Helmholtz and Gibbs free energy',
              'Grand potential',
              'Maxwell relations',
              'Legendre transformations'
            ],
            estimatedHours: 40
          },
          {
            topic: 'Phase Diagrams & Equations of State',
            description: 'PVT behavior and phase equilibria',
            keyPoints: [
              'Binary and ternary phase diagrams',
              'Lever rule',
              'Gibbs phase rule',
              'van der Waals equation',
              'Virial equation',
              'Equations of state models'
            ],
            estimatedHours: 40
          },
          {
            topic: 'Thermodynamic Stability',
            description: 'Conditions for equilibrium and stability',
            keyPoints: [
              'Stability criteria',
              'Convexity requirements',
              'Spinodal decomposition',
              'Mechanical and thermodynamic stability',
              'Stability limits'
            ],
            estimatedHours: 30
          },
          {
            topic: 'Surface Thermodynamics',
            description: 'Interface energy and adsorption',
            keyPoints: [
              'Surface tension',
              'Surface energy',
              'Interfacial energy',
              'Gibbs adsorption equation',
              'Young equation',
              'Wetting phenomena'
            ],
            estimatedHours: 35
          },
          {
            topic: 'Interfacial Phenomena',
            description: 'Behavior at interfaces and boundaries',
            keyPoints: [
              'Interfacial tension',
              'Capillarity',
              'Emulsions and foams',
              'Grain boundaries',
              'Phase boundary effects'
            ],
            estimatedHours: 30
          },
          {
            topic: 'Thermal Properties of Materials',
            description: 'Heat capacity and thermal expansion',
            keyPoints: [
              'Heat capacity at constant V and P',
              'Temperature dependence',
              'Debye temperature',
              'Thermal expansion coefficient',
              'Thermal contraction',
              'Anharmonic effects'
            ],
            estimatedHours: 35
          }
        ]
      },
      {
        id: 'condensed-matter-ii',
        title: 'Condensed Matter Physics II - Defects & Properties',
        icon: '🔗',
        description: 'Defects, crystal properties, electron localization',
        level: 'phd-specialization',
        year: 3,
        syllabus: [
          {
            topic: 'Crystal Defects & Impurities',
            description: 'Deviations from perfect crystals',
            keyPoints: [
              'Point defects',
              'Line defects',
              'Planar defects',
              'Volume defects',
              'Impurity effects',
              'Defect complexes'
            ],
            estimatedHours: 35
          },
          {
            topic: 'Dislocation Theory',
            description: 'Linear defects and plastic deformation',
            keyPoints: [
              'Burgers vector',
              'Edge and screw dislocations',
              'Dislocation dynamics',
              'Dislocation interactions',
              'Dislocation multiplication',
              'Work hardening'
            ],
            estimatedHours: 40
          },
          {
            topic: 'Point Defects & Vacancy Phenomena',
            description: 'Vacancies, interstitials, and antisites',
            keyPoints: [
              'Vacancy formation energy',
              'Interstitial defects',
              'Frenkel defects',
              'Schottky defects',
              'Color centers',
              'Defect pair interactions'
            ],
            estimatedHours: 30
          },
          {
            topic: 'Grain Boundaries',
            description: 'Interfaces between crystal grains',
            keyPoints: [
              'Grain boundary structure',
              'Coincident site lattice',
              'Grain boundary energy',
              'Grain boundary migration',
              'Grain growth kinetics'
            ],
            estimatedHours: 30
          },
          {
            topic: 'Mechanical Properties of Solids',
            description: 'Elasticity, plasticity, fracture',
            keyPoints: [
              'Elastic constants',
              'Stress-strain relations',
              'Yielding criteria',
              'Plastic deformation',
              'Fracture mechanics',
              'Fatigue'
            ],
            estimatedHours: 40
          },
          {
            topic: 'Thermal Conductivity in Solids',
            description: 'Heat transport mechanisms',
            keyPoints: [
              'Phonon conduction',
              'Electronic conduction',
              'Wiedemann-Franz law',
              'Lattice thermal conductivity',
              'Thermal resistivity',
              'Temperature dependence'
            ],
            estimatedHours: 35
          },
          {
            topic: 'Electron Localization',
            description: 'Disorder effects on electrons',
            keyPoints: [
              'Anderson localization',
              'Weak localization',
              'Metal-insulator transition',
              'Mobility edge',
              'Hopping conduction',
              'Variable range hopping'
            ],
            estimatedHours: 35
          }
        ]
      },
      {
        id: 'phase-transitions',
        title: 'Phase Transitions & Critical Phenomena',
        icon: '⚗️',
        description: 'Order-disorder transitions, critical exponents, renormalization',
        level: 'phd-specialization',
        year: 4,
        syllabus: [
          {
            topic: 'Order-Disorder Transitions',
            description: 'First and second-order phase transitions',
            keyPoints: [
              'Landau theory',
              'Order parameter',
              'Symmetry breaking',
              'First-order transitions',
              'Second-order transitions',
              'Transition kinetics'
            ],
            estimatedHours: 40
          },
          {
            topic: 'Ferromagnetic Transitions',
            description: 'Magnetic ordering and critical behavior',
            keyPoints: [
              'Mean-field theory of ferromagnetism',
              'Critical temperature',
              'Magnetic susceptibility',
              'Critical exponents',
              'Spin fluctuations',
              'Fluctuation-dissipation'
            ],
            estimatedHours: 35
          },
          {
            topic: 'Superconducting Transitions',
            description: 'Zero-resistance phase transitions',
            keyPoints: [
              'Normal to superconducting transition',
              'Critical temperature',
              'Critical field',
              'Transition kinetics',
              'Two-stage transition',
              'Superconducting fluctuations'
            ],
            estimatedHours: 30
          },
          {
            topic: 'Structural Phase Transitions',
            description: 'Lattice symmetry changes',
            keyPoints: [
              'Displacive transitions',
              'Reconstructive transitions',
              'Order-disorder mechanisms',
              'Soft modes',
              'Landau potential',
              'Structural distortions'
            ],
            estimatedHours: 35
          },
          {
            topic: 'Critical Exponents & Universality',
            description: 'Scaling behavior near critical points',
            keyPoints: [
              'Definition of critical exponents',
              'Power-law behavior',
              'Universality classes',
              'Critical dimension',
              'Exponent relations',
              'Universal scaling functions'
            ],
            estimatedHours: 35
          },
          {
            topic: 'Renormalization Group Theory',
            description: 'Scaling approach to critical phenomena',
            keyPoints: [
              'Real-space renormalization',
              'Momentum-space renormalization',
              'Recursion relations',
              'Fixed points',
              'Beta function',
              'Critical behavior prediction'
            ],
            estimatedHours: 40
          },
          {
            topic: 'Scaling Theory',
            description: 'Universal scaling of thermodynamic properties',
            keyPoints: [
              'Scaling hypothesis',
              'Homogeneity equation',
              'Critical amplitude',
              'Scaling function',
              'Experimental verification',
              'Corrections to scaling'
            ],
            estimatedHours: 30
          }
        ]
      },
      {
        id: 'solid-state-thermo',
        title: 'Solid State Thermodynamics',
        icon: '⚛️',
        description: 'Thermodynamic properties of crystals and interfaces',
        level: 'phd-specialization',
        year: 4,
        syllabus: [
          {
            topic: 'Thermodynamic Properties of Crystals',
            description: 'Fundamental thermodynamic behavior of solids',
            keyPoints: [
              'Internal energy of crystals',
              'Heat capacity mechanisms',
              'Entropy of crystals',
              'Free energy of solids',
              'Thermodynamic equations of state'
            ],
            estimatedHours: 35
          },
          {
            topic: 'Lattice Models (Einstein & Debye)',
            description: 'Simplified models of crystal vibrations',
            keyPoints: [
              'Einstein model of heat capacity',
              'Debye model fundamentals',
              'Debye temperature concept',
              'Debye density of states',
              'Low and high temperature limits'
            ],
            estimatedHours: 35
          },
          {
            topic: 'Specific Heat & Debye Temperature',
            description: 'Experimental and theoretical heat capacity',
            keyPoints: [
              'Cv and Cp relationships',
              'Temperature dependence',
              'Debye temperature determination',
              'Electronic contributions',
              'Lattice contributions'
            ],
            estimatedHours: 30
          },
          {
            topic: 'Thermal Expansion',
            description: 'Temperature dependence of lattice parameter',
            keyPoints: [
              'Thermal expansion coefficient',
              'Anharmonic effects',
              'Grüneisen parameter',
              'Thermal stress',
              'Thermal contraction'
            ],
            estimatedHours: 30
          },
          {
            topic: 'Defect Thermodynamics',
            description: 'Statistical thermodynamics of crystal defects',
            keyPoints: [
              'Defect formation energy',
              'Defect entropy',
              'Defect concentration',
              'Multiple defect types',
              'Temperature dependence'
            ],
            estimatedHours: 35
          },
          {
            topic: 'Thermodynamics of Interfaces',
            description: 'Surface and grain boundary thermodynamics',
            keyPoints: [
              'Surface entropy',
              'Interface free energy',
              'Grain boundary thermodynamics',
              'Adsorption thermodynamics',
              'Interface phase transitions'
            ],
            estimatedHours: 30
          },
          {
            topic: 'Multi-Phase Systems in Solids',
            description: 'Thermodynamics of multicomponent solids',
            keyPoints: [
              'Binary alloys',
              'Ternary systems',
              'Phase equilibria',
              'Gibbs energy of mixing',
              'Activity coefficients',
              'Precipitation thermodynamics'
            ],
            estimatedHours: 35
          }
        ]
      },
      {
        id: 'defects-disorder',
        title: 'Defects & Disorder in Solids',
        icon: '❌',
        description: 'Point defects, impurities, amorphous materials',
        level: 'phd-specialization',
        year: 4,
        syllabus: [
          {
            topic: 'Point Defect Thermodynamics',
            description: 'Thermodynamic behavior of point defects',
            keyPoints: [
              'Formation thermodynamics',
              'Migration thermodynamics',
              'Defect entropy',
              'Defect concentration equilibrium',
              'Temperature dependence'
            ],
            estimatedHours: 35
          },
          {
            topic: 'Defect Concentrations & Statistics',
            description: 'Statistical treatment of defect populations',
            keyPoints: [
              'Intrinsic defect concentration',
              'Extrinsic defect concentration',
              'Charge neutrality',
              'Defect association',
              'Non-equilibrium defects'
            ],
            estimatedHours: 30
          },
          {
            topic: 'Impurity Effects',
            description: 'Impact of foreign atoms on properties',
            keyPoints: [
              'Impurity-defect interactions',
              'Impurity binding energy',
              'Impurity segregation',
              'Impurity scattering',
              'Doping effects'
            ],
            estimatedHours: 30
          },
          {
            topic: 'Disorder & Amorphous Solids',
            description: 'Structure and properties of disordered materials',
            keyPoints: [
              'Amorphous structure',
              'Short-range order',
              'Medium-range order',
              'Density of states',
              'Mobility edges',
              'Anderson localization'
            ],
            estimatedHours: 35
          },
          {
            topic: 'Glass Transitions',
            description: 'Transition from liquid to glassy state',
            keyPoints: [
              'Glass transition temperature',
              'Fictive temperature',
              'Configurational entropy',
              'Structural relaxation',
              'Aging phenomena',
              'Calorimetric measurement'
            ],
            estimatedHours: 35
          },
          {
            topic: 'Plasticity & Deformation',
            description: 'Permanent shape changes in solids',
            keyPoints: [
              'Elastic vs plastic deformation',
              'Yield criteria',
              'Work hardening mechanisms',
              'Dislocation multiplication',
              'Strain hardening exponent'
            ],
            estimatedHours: 35
          },
          {
            topic: 'Creep & Relaxation Phenomena',
            description: 'Time-dependent plastic deformation',
            keyPoints: [
              'Creep stages',
              'Creep mechanisms',
              'Stress relaxation',
              'Viscoelasticity',
              'Kelvin-Voigt model',
              'Time-temperature superposition'
            ],
            estimatedHours: 35
          }
        ]
      },
      {
        id: 'advanced-materials',
        title: 'Advanced Materials Science',
        icon: '🧬',
        description: 'Alloys, diffusion, nucleation, microstructure',
        level: 'phd-specialization',
        year: 4,
        syllabus: [
          {
            topic: 'Alloys & Phase Equilibria',
            description: 'Multi-component system thermodynamics',
            keyPoints: [
              'Solid solution thermodynamics',
              'Phase diagram construction',
              'Lever rule applications',
              'Tie lines',
              'Invariant reactions',
              'Intermediate phases'
            ],
            estimatedHours: 40
          },
          {
            topic: 'Diffusion in Solids',
            description: 'Atomic transport mechanisms',
            keyPoints: [
              'Fick\'s laws',
              'Diffusion coefficients',
              'Vacancy diffusion',
              'Interstitial diffusion',
              'Grain boundary diffusion',
              'Surface diffusion'
            ],
            estimatedHours: 35
          },
          {
            topic: 'Nucleation & Growth',
            description: 'Formation of new phases',
            keyPoints: [
              'Homogeneous nucleation',
              'Heterogeneous nucleation',
              'Critical nucleus size',
              'Nucleation rate',
              'Growth kinetics',
              'Growth rate control'
            ],
            estimatedHours: 35
          },
          {
            topic: 'Microstructure Evolution',
            description: 'How microstructure changes with time',
            keyPoints: [
              'Coarsening kinetics',
              'Ostwald ripening',
              'Coalescence',
              'Phase separation',
              'Spinodal decomposition',
              'Microstructure stability'
            ],
            estimatedHours: 35
          },
          {
            topic: 'Sintering & Densification',
            description: 'Powder consolidation mechanisms',
            keyPoints: [
              'Sintering stages',
              'Neck formation',
              'Grain growth',
              'Pore elimination',
              'Sintering kinetics',
              'Liquid phase sintering'
            ],
            estimatedHours: 30
          },
          {
            topic: 'Crystal Growth Techniques',
            description: 'Methods for producing large single crystals',
            keyPoints: [
              'Czochralski method',
              'Bridgman method',
              'Vapor-liquid-solid growth',
              'Vapor deposition',
              'Molecular beam epitaxy',
              'Defect control'
            ],
            estimatedHours: 30
          },
          {
            topic: 'Thin Films & Nanostructures',
            description: 'Low-dimensional materials and structures',
            keyPoints: [
              'Thin film growth',
              'Nanowires and nanoparticles',
              'Quantum dots',
              'Two-dimensional materials',
              'Nanostructure properties',
              'Size effects'
            ],
            estimatedHours: 35
          }
        ]
      },
      {
        id: 'computational-methods',
        title: 'Computational Methods in Condensed Matter',
        icon: '💻',
        description: 'Simulations and theoretical calculations',
        level: 'phd-specialization',
        year: 4,
        syllabus: [
          {
            topic: 'Molecular Dynamics Simulations',
            description: 'Classical atomic dynamics simulations',
            keyPoints: [
              'Newton equations integration',
              'Force fields',
              'Verlet algorithm',
              'Temperature control (thermostats)',
              'Pressure control (barostats)',
              'Ensemble MD techniques'
            ],
            estimatedHours: 40
          },
          {
            topic: 'Monte Carlo Methods',
            description: 'Stochastic sampling techniques',
            keyPoints: [
              'Metropolis algorithm',
              'Canonical ensemble sampling',
              'Grand canonical ensemble',
              'Importance sampling',
              'Variational Monte Carlo',
              'Quantum Monte Carlo'
            ],
            estimatedHours: 35
          },
          {
            topic: 'Density Functional Theory (DFT)',
            description: 'Electronic structure method',
            keyPoints: [
              'Hohenberg-Kohn theorems',
              'Kohn-Sham equations',
              'Exchange-correlation functionals',
              'LDA and GGA',
              'Pseudopotentials',
              'Basis set representations'
            ],
            estimatedHours: 45
          },
          {
            topic: 'Ab Initio Methods',
            description: 'From-first-principles calculations',
            keyPoints: [
              'Hartree-Fock method',
              'Correlation effects',
              'Post-Hartree-Fock methods',
              'Coupled cluster theory',
              'CI calculations',
              'Hybrid functionals'
            ],
            estimatedHours: 40
          },
          {
            topic: 'Lattice Models & Simulations',
            description: 'Simplified model systems',
            keyPoints: [
              'Ising model',
              'Heisenberg model',
              'Hubbard model',
              'Lattice gas models',
              'Kinetic Monte Carlo',
              'Phase transition simulation'
            ],
            estimatedHours: 35
          },
          {
            topic: 'Machine Learning in Materials',
            description: 'AI methods in materials science',
            keyPoints: [
              'Force field development',
              'Crystal structure prediction',
              'Property prediction',
              'Surrogate models',
              'Active learning',
              'Interpretability'
            ],
            estimatedHours: 35
          }
        ]
      }
    ]
  }
];
