import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

import { TableModule } from 'primeng/table';
import { DropdownModule } from 'primeng/dropdown';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ChartModule } from 'primeng/chart';

import { AgricultureHomeComponent } from './agriculture-home.component';
import { AgricultureDiscoverComponent } from './agriculture-discover/agriculture-discover.component';
import { AgricultureDataService } from './services/agriculture-data.service';

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
 * @NgModule
 * @since 1.0 (Original Angular 13 implementation)
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
    ChartModule
  ],
  providers: [
    AgricultureDataService
  ]
})
export class AgricultureModule { }
