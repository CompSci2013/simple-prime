import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { PHYSICS_KNOWLEDGE_PATH, PhysicsNode, SyllabusItem } from './physics-knowledge-path';


/**
 * Physics Domain Landing Component
 *
 * Serves as the landing page and curriculum hub for the Physics domain. Displays a hierarchical
 * knowledge path organized into 3 tiers (Undergraduate, Graduate, PhD Specialization) with
 * interactive course tiles. Users can navigate to syllabus details, view concept graphs, and
 * access visualization tools for understanding physics topics and their relationships.
 *
 * @remarks
 * - Implements multi-tier curriculum structure (Undergraduate → Graduate → PhD)
 * - Uses sessionStorage to pass selected course data to detail pages
 * - Integrates with knowledge graph visualization system for topic relationships
 * - Provides access to both linear curriculum (syllabus) and relational (concept graphs)
 *
 * @architecture
 * **Purpose**: Physics domain landing page with curriculum discovery
 * **Pattern**: Multi-tier course discovery with navigation
 * **Navigation Flow**:
 *   - User arrives from domain selector (/home) → PhysicsComponent
 *   - Clicks course tile → Navigates to `/physics/syllabus/:nodeId`
 *   - Clicks "View Concept Graph" → Navigates to `/physics/concept-graph`
 *   - Can view topic knowledge graphs from concept-graph → `/physics/:topicId-graph`
 *
 * **Data Flow**:
 *   - PHYSICS_KNOWLEDGE_PATH → knowledgeTiers property (hierarchy)
 *   - navigateToNode() → sessionStorage + router.navigate()
 *   - PhysicsSyllabusComponent reads sessionStorage on load
 *
 * @template
 * The component renders a multi-section layout:
 * 1. **Header**: Domain branding with icon and subtitle
 * 2. **Concept Graph CTA**: Link to interactive concept graph visualization
 * 3. **Knowledge Tiers**: Three expandable/collapsible sections
 *    - Undergraduate Tier: Foundational physics courses (5 courses)
 *    - Graduate Tier: Advanced physics courses (4 courses)
 *    - PhD Specialization: Research-level specializations (4 courses)
 * 4. **Course Tiles**: Interactive cards for each course with:
 *    - Course icon/badge (cyan level indicator)
 *    - Course title
 *    - Brief description
 *    - Estimated hours (0 = self-paced, no estimates)
 * 5. **Back Link**: Navigation to domain selector
 *
 * @styling
 * - Dark theme with cyan accents (#64c8ff, #4ba3d9)
 * - Level badges: Cyan (undergraduate), Orange (graduate), Pink (PhD)
 * - Gradient backgrounds with transparent overlays
 * - Card hover effects: Elevation, color transitions, shadow expansion
 * - Responsive grid layout (auto-fit, 240px minimum per card)
 * - Mobile breakpoint: 768px (single column, stacked sections)
 *
 * @example
 * ```html
 * <!-- Usage in routing -->
 * <router-outlet></router-outlet>
 *
 * <!-- Renders physics domain landing with curriculum tiers -->
 * ```
 *
 * @seeAlso
 * - {@link PhysicsSyllabusComponent} - Displays detailed syllabus for selected course
 * - {@link PhysicsConceptGraphComponent} - Interactive concept relationship visualization
 * - {@link KnowledgeGraphComponent} - Generic Cytoscape-based topic graph (used by classical mechanics, etc.)
 * - {@link PHYSICS_KNOWLEDGE_PATH} - Curriculum data structure (physics-knowledge-path.ts)
 *
 * @lifecycle
 * - **Constructor**: Injects Router for navigation
 * - **ngOnInit**: Not required; data loaded from static PHYSICS_KNOWLEDGE_PATH
 * - **ngOnDestroy**: No cleanup needed
 * - **Input**: None
 * - **Output**: None (uses router for navigation)
 *
 * @methods
 * - **getTotalHours(syllabus: SyllabusItem[]): number**
 *   - Sums estimated hours from all syllabus items
 *   - Used to display total course time (or 0 for self-paced)
 *   - Reduce pattern: accumulates values across array
 *
 * - **navigateToNode(node: PhysicsNode): void**
 *   - Stores selected course in sessionStorage for detail page
 *   - Navigates to `/physics/syllabus/{nodeId}`
 *   - Uses JSON.stringify for serialization
 *   - SessionStorage used because data is single-session, single-user
 *
 * @curriculum-structure
 * **Physics Knowledge Path** (13 total courses):
 * - Undergraduate (5): Classical Mechanics, Thermodynamics, Electromagnetism, Optics, Modern Physics
 * - Graduate (4): Quantum Mechanics, Statistical Mechanics, Plasma Physics, Materials Physics
 * - PhD Specialization (4): Quantum Field Theory, Particle Physics, Astrophysics, Relativistic Mechanics
 *
 * **Learning Model**: 100% self-paced, no time estimates
 * - No prerequisites between tiers (flexible learning paths)
 * - Each course contains syllabus with topics but no fixed duration
 *
 * @version 1.0
 * @since 1.0.0 (Added as part of multi-domain framework expansion)
 */
@Component({
    selector: 'app-physics',
    templateUrl: './physics.component.html',
    styleUrls: ['./physics.component.scss'],
    imports: [RouterLink]
})
export class PhysicsComponent {
  /**
   * Physics knowledge path organized by tier
   * Data: Undergraduate → Graduate → PhD Specialization
   * Source: PHYSICS_KNOWLEDGE_PATH from physics-knowledge-path.ts
   * Type: Array of PhysicsNode with nested SyllabusItem children
   */
  knowledgeTiers: PhysicsNode[] = PHYSICS_KNOWLEDGE_PATH;

  /**
   * Physics component constructor
   *
   * Dependency: Router service for programmatic navigation
   * - Used by navigateToNode() to navigate to syllabus detail pages
   * - Routes to `/physics/syllabus/{nodeId}` with sessionStorage data
   *
   * @param router Angular Router service for programmatic navigation
   */
  constructor(private router: Router) {}

  /**
   * Calculate total estimated hours for a course syllabus
   *
   * **Purpose**: Display total duration for a course or indicate self-paced (0 hours)
   *
   * **Implementation**: Reduces array of syllabus items by summing estimatedHours
   *
   * **Behavior**:
   * - If all items have 0 estimatedHours, returns 0 (indicates self-paced)
   * - If items have non-zero hours, returns sum (total course duration)
   * - Empty array returns 0
   *
   * @param syllabus Array of SyllabusItem objects with estimatedHours property
   * @returns Total hours as number (0 = self-paced, no time constraint)
   *
   * @example
   * ```typescript
   * const classicalMechSyllabus = physicsNode.syllabus;
   * const totalHours = this.getTotalHours(classicalMechSyllabus);
   * // If all items have estimatedHours: 0
   * // Returns: 0 (self-paced learning)
   * ```
   */
  getTotalHours(syllabus: SyllabusItem[]): number {
    return syllabus.reduce((total, item) => total + item.estimatedHours, 0);
  }

  /**
   * Navigate to syllabus detail page for a selected physics course
   *
   * **Purpose**: Route to course detail with selected course data
   *
   * **Pattern**: SessionStorage-based state passing
   * - Serializes selected node to JSON string
   * - Stores in sessionStorage['selectedPhysicsNode']
   * - Routes to `/physics/syllabus/{nodeId}`
   * - PhysicsSyllabusComponent reads from sessionStorage on init
   *
   * **Why SessionStorage?**
   * - Single-user, single-session data (not global app state)
   * - Survives page refresh within session
   * - Auto-clears on browser close
   * - Simpler than Angular service for this transient data
   *
   * @param node Selected PhysicsNode to navigate to (contains id, title, syllabus)
   *
   * @example
   * ```typescript
   * // User clicks "Classical Mechanics" tile
   * const node = PHYSICS_KNOWLEDGE_PATH[0].children[0]; // Classical Mechanics node
   * this.navigateToNode(node);
   * // Result:
   * // - sessionStorage['selectedPhysicsNode'] = JSON.stringify(node)
   * // - Router navigates to '/physics/syllabus/classical-mechanics-101'
   * // - PhysicsSyllabusComponent loads and reads sessionStorage
   * ```
   */
  navigateToNode(node: PhysicsNode): void {
    // Store node in session for the detail page to access
    sessionStorage.setItem('selectedPhysicsNode', JSON.stringify(node));
    this.router.navigate(['/physics/syllabus', node.id]);
  }
}