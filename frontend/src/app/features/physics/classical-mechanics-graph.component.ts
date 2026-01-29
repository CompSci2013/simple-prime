/**
 * Classical Mechanics Graph Component
 *
 * @fileoverview
 * Wrapper component that displays the Classical Mechanics topic graph using the generic
 * KnowledgeGraphComponent. Loads data from CLASSICAL_MECHANICS_GRAPH constant and
 * transforms it to the KnowledgeGraphData format.
 *
 * @remarks
 * Architecture:
 * - Thin wrapper around KnowledgeGraphComponent
 * - Loads topic graph from classical-mechanics-graph.ts
 * - Maps TopicNode/TopicEdge to KnowledgeNode/KnowledgeEdge format
 * - Configures title, subtitle, and back route for classical mechanics context
 *
 * Template:
 * - Inline template rendering app-knowledge-graph selector
 * - Conditional rendering with *ngIf="graphData"
 * - Passes transformed graph data via [graphData] input
 * - Sets contextual title and subtitle
 * - Back route navigates to /physics
 *
 * Data Flow:
 * 1. ngOnInit loads CLASSICAL_MECHANICS_GRAPH
 * 2. Maps nodes and edges to KnowledgeGraphData format
 * 3. Template renders KnowledgeGraphComponent with data
 *
 * @example
 * Route configuration:
 * ```typescript
 * { path: 'classical-mechanics/graph', component: ClassicalMechanicsGraphComponent }
 * ```
 *
 * @see KnowledgeGraphComponent - Reusable graph visualization
 * @see CLASSICAL_MECHANICS_GRAPH - Topic graph data
 *
 * @lifecycle
 * - ngOnInit: Transforms and loads graph data
 *
 * @version 1.0
 * @since 2024
 */

import { Component, OnInit } from '@angular/core';
import { CLASSICAL_MECHANICS_GRAPH } from './classical-mechanics-graph';
import { KnowledgeGraphData, KnowledgeGraphComponent as KnowledgeGraphComponent_1 } from './knowledge-graph.component';


/**
 * Classical Mechanics Knowledge Graph Display Component
 *
 * Displays the hierarchical topic graph for Classical Mechanics curriculum
 * using the generic KnowledgeGraphComponent.
 */
@Component({
    selector: 'app-classical-mechanics-graph',
    template: `
    @if (graphData) {
      <app-knowledge-graph
        [graphData]="graphData"
        [title]="'Classical Mechanics Knowledge Graph'"
        [subtitle]="'Topic relationships and dependencies'"
        [backRoute]="'/physics'">
      </app-knowledge-graph>
    }
    `,
    imports: [KnowledgeGraphComponent_1]
})
export class ClassicalMechanicsGraphComponent implements OnInit {
  /**
   * Graph data containing transformed topic nodes and edges for visualization
   */
  graphData: KnowledgeGraphData | null = null;

  /**
   * Angular lifecycle hook - Component initialization
   *
   * Transforms and loads the classical mechanics topic graph data.
   */
  ngOnInit(): void {
    console.log('[ClassicalMechanicsGraph] ngOnInit()');
    this.graphData = {
      nodes: CLASSICAL_MECHANICS_GRAPH.nodes.map(node => ({
        id: node.id,
        label: node.label,
        description: node.description,
        level: node.level,
        color: node.color
      })),
      edges: CLASSICAL_MECHANICS_GRAPH.edges.map(edge => ({
        source: edge.source,
        target: edge.target,
        label: edge.label
      }))
    };
    console.log('[ClassicalMechanicsGraph] Graph data initialized');
  }
}
