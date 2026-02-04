import { Routes } from '@angular/router';

/**
 * Application Routes Configuration (Hybrid Angular 13/14)
 *
 * Defines all routes and navigation paths for the Generic-Prime application.
 * This is a HYBRID configuration demonstrating two Angular patterns:
 *
 * Standalone Components (Angular 14+):
 * - Home, Automobile, Discover3, PanelPopout use `loadComponent`
 * - These components have `standalone: true` and self-contained imports
 *
 * NgModule Pattern (Angular 13 Legacy):
 * - Agriculture uses `loadChildren` to load AgricultureModule
 * - The module declares its components and manages dependencies traditionally
 *
 * This hybrid architecture simulates a real-world migration scenario where
 * an existing Angular 13 app (Agriculture) was extended with Angular 14
 * standalone components (Automobiles) as a modernization test.
 *
 * Route Structure:
 * - Root & Home: '', 'home' -> HomeComponent (standalone)
 * - Automobile: 'automobiles/**' -> standalone components
 * - Agriculture: 'agriculture/**' -> NgModule lazy-loaded
 * - Pop-out: 'panel/:gridId/:panelId/:type' -> standalone
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
  // Agriculture uses NgModule pattern (Angular 13 legacy style)
  {
    path: 'agriculture',
    loadChildren: () => import('./features/agriculture/agriculture.module').then(m => m.AgricultureModule)
  },
  {
    path: 'panel/:gridId/:panelId/:type',
    loadComponent: () => import('./features/panel-popout/panel-popout.component').then(m => m.PanelPopoutComponent)
  }
];
