import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PhysicsNode } from './physics-knowledge-path';


/**
 * Physics Syllabus Detail Component
 *
 * Displays comprehensive syllabus information for a selected physics course, including topics,
 * descriptions, and key learning points. Data is retrieved from sessionStorage and displayed
 * in an organized card-based layout.
 *
 * @remarks
 * - Loads physics course node data from sessionStorage (set by parent PhysicsComponent)
 * - Displays course metadata: icon, title, description, and topic count
 * - Shows syllabus items as numbered cards with key points
 * - Provides navigation back to physics main page
 * - Handles error states when no node data is available
 *
 * @architecture
 * **Purpose**: Detailed syllabus view for individual physics courses
 * **Pattern**: Detail view with sessionStorage-based state management
 * **Navigation Flow**:
 *   - User clicks course card in PhysicsComponent → navigates to /physics/syllabus/:nodeId
 *   - Parent component stores node data in sessionStorage
 *   - This component reads from sessionStorage and displays syllabus
 *   - User can navigate back to /physics
 *
 * **State Management**:
 *   - Uses sessionStorage for data transfer between components
 *   - Key: 'selectedPhysicsNode'
 *   - Fallback: Redirects to /physics if no data found
 *
 * @template
 * The component uses a syllabus detail layout:
 * 1. **Header Section**: Back button, course icon, title, description, and metadata
 * 2. **Syllabus Topics Section**: Numbered topic cards with descriptions and key points
 * 3. **Empty State**: Message when no syllabus data is available
 * 4. **Error State**: Fallback UI when course data is not found
 *
 * @styling
 * - Dark theme with cyan accents (#64c8ff, #4ba3d9)
 * - Gradient backgrounds with transparent overlays
 * - Animations: fadeInDown (header), fadeInUp (topics with delay)
 * - Topic cards with numbered badges and hover effects
 * - Responsive breakpoint: 768px for mobile layout
 *
 * @example
 * ```typescript
 * // Navigation from parent component
 * navigateToNode(subtopic: PhysicsNode): void {
 *   sessionStorage.setItem('selectedPhysicsNode', JSON.stringify(subtopic));
 *   this.router.navigate(['/physics/syllabus', subtopic.id]);
 * }
 * ```
 *
 * @seeAlso
 * - {@link PhysicsComponent} - Parent component that sets sessionStorage
 * - {@link PhysicsNode} - Interface for course node data structure
 * - {@link SyllabusItem} - Interface for syllabus topic items
 * - {@link PHYSICS_KNOWLEDGE_PATH} - Complete physics curriculum data
 *
 * @lifecycle
 * - **ngOnInit**: Subscribes to route params and loads node data from sessionStorage
 * - **OnDestroy**: No cleanup needed (no subscriptions to unsubscribe)
 *
 * @version 1.0
 * @since 1.0.0 (Added as part of physics domain implementation)
 */
@Component({
    selector: 'app-physics-syllabus',
    templateUrl: './physics-syllabus.component.html',
    styleUrls: ['./physics-syllabus.component.scss'],
    imports: []
})
export class PhysicsSyllabusComponent implements OnInit {
  /**
   * @property {PhysicsNode | null} selectedNode - Currently selected physics course node with syllabus data
   */
  selectedNode: PhysicsNode | null = null;

  /**
   * @property {string | null} nodeId - Course node ID from route parameters
   */
  nodeId: string | null = null;

  /**
   * Constructor
   *
   * @param {ActivatedRoute} route - Angular router for accessing route parameters
   * @param {Router} router - Angular router for programmatic navigation
   */
  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {}

  /**
   * Component initialization lifecycle hook
   *
   * Subscribes to route params to get node ID, then loads corresponding
   * node data from sessionStorage.
   *
   * @lifecycle Called once after component is constructed
   */
  ngOnInit(): void {
    // Get node ID from route params and load corresponding data
    this.route.params.subscribe(params => {
      this.nodeId = params['nodeId'];
      this.loadNodeData();
    });
  }

  /**
   * Loads physics course node data from sessionStorage
   *
   * Attempts to retrieve previously stored node data. If no data is found
   * and a nodeId exists, redirects back to the physics main page.
   *
   * @private
   * @remarks
   * Data is stored in sessionStorage by the parent PhysicsComponent before navigation
   *
   * @seeAlso {@link PhysicsComponent.navigateToNode}
   */
  private loadNodeData(): void {
    const storedNode = sessionStorage.getItem('selectedPhysicsNode');
    if (storedNode) {
      this.selectedNode = JSON.parse(storedNode);
    } else if (this.nodeId) {
      // Fallback: navigate back if no data available
      this.router.navigate(['/physics']);
    }
  }

  /**
   * Navigates back to the physics main page
   *
   * @public
   * @returns {void}
   */
  goBack(): void {
    this.router.navigate(['/physics']);
  }
}
