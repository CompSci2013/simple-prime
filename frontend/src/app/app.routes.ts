import { Routes } from '@angular/router';

/**
 * Application Routes Configuration (Angular 21 Lazy Loading)
 *
 * Defines all routes and navigation paths for the Generic-Prime application.
 * Uses `loadComponent` for lazy loading to improve initial bundle size and
 * enable route-based code splitting.
 *
 * Route Structure:
 * - Root & Home: '', 'home' -> HomeComponent (domain selector landing page)
 * - Automobile: 'automobiles' -> AutomobileComponent, 'automobiles/discover' -> DiscoverComponent
 * - Agriculture: 'agriculture' -> AgricultureComponent
 * - Physics: 'physics' -> PhysicsComponent
 *   - Sub-routes: 'physics/syllabus/:nodeId' -> PhysicsSyllabusComponent
 *   - Visualization: 'physics/concept-graph', 'physics/classical-mechanics-graph'
 * - Chemistry: 'chemistry' -> ChemistryComponent
 * - Math: 'math' -> MathComponent
 * - Developer: 'dependencies' -> DependencyGraphComponent (architecture visualization)
 * - Pop-out: 'panel/:gridId/:panelId/:type' -> PanelPopoutComponent (window synchronization)
 * - Reporting: 'report' -> ReportComponent (test results)
 */
export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent)
  },
  {
    path: 'home',
    loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent)
  },
  {
    path: 'automobiles',
    loadComponent: () => import('./features/automobile/automobile.component').then(m => m.AutomobileComponent)
  },
  {
    path: 'automobiles/discover',
    loadComponent: () => import('./features/discover/discover.component').then(m => m.DiscoverComponent)
  },
  {
    path: 'agriculture',
    loadComponent: () => import('./features/agriculture/agriculture.component').then(m => m.AgricultureComponent)
  },
  {
    path: 'physics',
    loadComponent: () => import('./features/physics/physics.component').then(m => m.PhysicsComponent)
  },
  {
    path: 'physics/syllabus/:nodeId',
    loadComponent: () => import('./features/physics/physics-syllabus.component').then(m => m.PhysicsSyllabusComponent)
  },
  {
    path: 'physics/concept-graph',
    loadComponent: () => import('./features/physics/physics-concept-graph.component').then(m => m.PhysicsConceptGraphComponent)
  },
  {
    path: 'physics/classical-mechanics-graph',
    loadComponent: () => import('./features/physics/classical-mechanics-graph.component').then(m => m.ClassicalMechanicsGraphComponent)
  },
  {
    path: 'chemistry',
    loadComponent: () => import('./features/chemistry/chemistry.component').then(m => m.ChemistryComponent)
  },
  {
    path: 'math',
    loadComponent: () => import('./features/math/math.component').then(m => m.MathComponent)
  },
  {
    path: 'dependencies',
    loadComponent: () => import('./features/dependency-graph/dependency-graph.component').then(m => m.DependencyGraphComponent)
  },
  {
    path: 'report',
    loadComponent: () => import('./features/report/report.component').then(m => m.ReportComponent)
  },
  {
    path: 'panel/:gridId/:panelId/:type',
    loadComponent: () => import('./features/panel-popout/panel-popout.component').then(m => m.PanelPopoutComponent)
  }
];
