import { Routes } from '@angular/router';

/**
 * Application Routes Configuration (Angular 14 Lazy Loading)
 *
 * Defines all routes and navigation paths for the Generic-Prime application.
 * Uses `loadComponent` for lazy loading to improve initial bundle size and
 * enable route-based code splitting.
 *
 * Route Structure:
 * - Root & Home: '', 'home' -> HomeComponent (domain selector landing page)
 * - Automobile: 'automobiles' -> AutomobileComponent, 'automobiles/discover' -> Discover3Component
 * - Agriculture: 'agriculture' -> AgricultureComponent
 * - Pop-out: 'panel/:gridId/:panelId/:type' -> PanelPopoutComponent (window synchronization)
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
    loadComponent: () => import('./features/discover3/discover3.component').then(m => m.Discover3Component)
  },
  {
    path: 'agriculture',
    loadComponent: () => import('./features/agriculture/agriculture.component').then(m => m.AgricultureComponent)
  },
  {
    path: 'panel/:gridId/:panelId/:type',
    loadComponent: () => import('./features/panel-popout/panel-popout.component').then(m => m.PanelPopoutComponent)
  }
];
