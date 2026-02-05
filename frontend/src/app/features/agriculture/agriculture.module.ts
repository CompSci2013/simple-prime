import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

// PrimeNG Modules
import { TableModule } from 'primeng/table';
import { DropdownModule } from 'primeng/dropdown';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TooltipModule } from 'primeng/tooltip';

// Framework Components (Standalone - imported as modules in NgModule pattern)
import { StatisticsPanel2Component } from '../../../framework/components/statistics-panel-2/statistics-panel-2.component';
import { BaseChartComponent } from '../../../framework/components/base-chart/base-chart.component';
import { QueryControlComponent } from '../../../framework/components/query-control/query-control.component';
import { DynamicResultsTableComponent } from '../../../framework/components/dynamic-results-table/dynamic-results-table.component';

// Domain Configuration
import { AGRICULTURE_DOMAIN_PROVIDER } from '../../../domain-config/agriculture';

// Local Components
import { AgricultureHomeComponent } from './agriculture-home.component';
import { AgricultureDiscoverComponent } from './agriculture-discover/agriculture-discover.component';

/**
 * Agriculture Feature Module (NgModule Pattern - Angular 13 Style)
 *
 * This module represents the original "legacy" architecture of the application
 * before the Angular 14 standalone component migration. It demonstrates the
 * traditional NgModule pattern with:
 *
 * - Module-scoped component declarations
 * - Shared imports across all module components
 * - Service providers scoped to the module
 * - Child routing configuration
 *
 * Architecture Note:
 * This module was the original implementation when the application was
 * Angular 13. The Automobile domain was later added using Angular 14
 * standalone components as a modernization test, creating a hybrid
 * application architecture.
 *
 * Framework Integration Note:
 * Although this module uses NgModule pattern, it integrates with the Generic
 * Discovery Framework using the same URL-First architecture as the standalone
 * Automobile domain. The framework components (StatisticsPanel2, BaseChart,
 * QueryControl) are standalone components imported into this NgModule.
 *
 * @NgModule
 * @since 1.0 (Original Angular 13 implementation)
 * @updated 2.0 (Framework integration with URL-First architecture)
 */
const routes: Routes = [
  {
    path: '',
    component: AgricultureHomeComponent
  },
  {
    path: 'discover',
    component: AgricultureDiscoverComponent
  }
];

@NgModule({
  declarations: [
    AgricultureHomeComponent,
    AgricultureDiscoverComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    HttpClientModule,
    RouterModule.forChild(routes),
    // PrimeNG Modules
    TableModule,
    DropdownModule,
    ButtonModule,
    CardModule,
    TooltipModule,
    // Framework Components (standalone components imported as modules)
    StatisticsPanel2Component,
    BaseChartComponent,
    QueryControlComponent,
    DynamicResultsTableComponent
  ],
  providers: [
    // Domain configuration provider - makes DOMAIN_CONFIG available
    // throughout this module via dependency injection
    AGRICULTURE_DOMAIN_PROVIDER
  ]
})
export class AgricultureModule { }
