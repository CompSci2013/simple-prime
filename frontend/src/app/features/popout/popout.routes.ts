/**
 * Popout Child Routes
 *
 * Defines the child routes for the popout layout. Each route maps a component
 * type to the actual component that should be rendered.
 *
 * URL structure: /popout/:gridId/:componentId/:type
 * Where :type is one of these child route paths.
 */
import { Routes } from '@angular/router';

export const POPOUT_ROUTES: Routes = [
  {
    path: 'query-control',
    loadComponent: () =>
      import('../../../framework/components/query-control/query-control.component')
        .then(m => m.QueryControlComponent)
  },
  {
    path: 'picker',
    loadComponent: () =>
      import('../../../framework/components/base-picker/base-picker.component')
        .then(m => m.BasePickerComponent)
  },
  {
    path: 'chart',
    loadComponent: () =>
      import('../../../framework/components/base-chart/base-chart.component')
        .then(m => m.BaseChartComponent)
  },
  {
    path: 'basic-results',
    loadComponent: () =>
      import('../../../framework/components/dynamic-results-table/dynamic-results-table.component')
        .then(m => m.DynamicResultsTableComponent)
  },
  {
    path: 'statistics-2',
    loadComponent: () =>
      import('../../../framework/components/statistics-panel-2/statistics-panel-2.component')
        .then(m => m.StatisticsPanel2Component)
  },
  {
    path: 'dockview-statistics',
    loadComponent: () =>
      import('../../../framework/components/dockview-statistics-panel/dockview-statistics-panel.component')
        .then(m => m.DockviewStatisticsPanelComponent)
  }
];
