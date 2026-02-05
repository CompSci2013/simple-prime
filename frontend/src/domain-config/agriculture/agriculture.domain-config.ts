/**
 * Agriculture Domain Configuration
 *
 * Complete domain configuration combining all models, adapters, and UI configs.
 * This configuration follows the same pattern as the Automobile domain,
 * demonstrating the framework's domain-agnostic design.
 *
 * Note: This domain uses NgModule pattern (Angular 13 style) while
 * Automobiles uses standalone components (Angular 14+). This is intentional
 * to demonstrate hybrid architecture support.
 */

import { Injector } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DomainConfig } from '../../framework/models';
import { environment } from '../../environments/environment';
import {
  AgricultureSearchFilters,
  CropResult,
  AgricultureStatistics
} from './models';
import {
  AgricultureApiAdapter,
  AgricultureUrlMapper,
  AgricultureCacheKeyBuilder
} from './adapters';
import {
  AGRICULTURE_TABLE_CONFIG,
  AGRICULTURE_FILTER_DEFINITIONS,
  AGRICULTURE_QUERY_CONTROL_FILTERS,
  AGRICULTURE_HIGHLIGHT_FILTERS,
  AGRICULTURE_CHART_CONFIGS
} from './configs';
import {
  CropChartDataSource,
  RegionChartDataSource
} from './chart-sources';
import { Provider } from '@angular/core';
import { DOMAIN_CONFIG } from '../../framework/services';

/**
 * Factory function to create Agriculture Domain Configuration
 *
 * This factory creates the domain configuration with properly injected dependencies.
 * Must be called with Angular's Injector to resolve service dependencies.
 *
 * @param injector - Angular injector for resolving dependencies
 * @returns Complete agriculture domain configuration
 *
 * @example
 * // In AgricultureModule
 * providers: [
 *   {
 *     provide: DOMAIN_CONFIG,
 *     useFactory: createAgricultureDomainConfig,
 *     deps: [Injector]
 *   }
 * ]
 */
export function createAgricultureDomainConfig(injector: Injector): DomainConfig<
  AgricultureSearchFilters,
  CropResult,
  AgricultureStatistics
> {
  const httpClient = injector.get(HttpClient);
  const apiBaseUrl = environment.apiBaseUrl;

  return {
    // ==================== Identity ====================
    domainName: 'agriculture',
    domainLabel: 'Agriculture Discovery',
    apiBaseUrl: apiBaseUrl,

    // ==================== Type Models ====================
    filterModel: AgricultureSearchFilters,
    dataModel: CropResult,
    statisticsModel: AgricultureStatistics,

    // ==================== Adapters ====================
    // NOTE: Uses HttpClient directly since we're loading from mock JSON files
    apiAdapter: new AgricultureApiAdapter(httpClient, apiBaseUrl),
    urlMapper: new AgricultureUrlMapper(),
    cacheKeyBuilder: new AgricultureCacheKeyBuilder(),

    // ==================== UI Configuration ====================
    tableConfig: AGRICULTURE_TABLE_CONFIG,
    pickers: [], // Agriculture doesn't have pickers (simpler domain)
    filters: AGRICULTURE_FILTER_DEFINITIONS,
    queryControlFilters: AGRICULTURE_QUERY_CONTROL_FILTERS,
    highlightFilters: AGRICULTURE_HIGHLIGHT_FILTERS,
    charts: AGRICULTURE_CHART_CONFIGS,
    chartDataSources: {
      'crop': new CropChartDataSource(),
      'region': new RegionChartDataSource()
    },

    // ==================== Feature Flags ====================
    features: {
      // Required features
      highlights: true,
      popOuts: true,
      rowExpansion: false, // Simpler domain, no row expansion

      // Optional features
      statistics: true,
      export: true,
      columnManagement: true,
      statePersistence: true
    },

    // ==================== Metadata ====================
    metadata: {
      version: '1.0.0',
      description: 'Agriculture crop data discovery and analysis',
      author: 'Generic Discovery Framework Team',
      createdAt: '2025-11-20',
      updatedAt: '2025-11-20'
    }
  };
}

/**
 * Angular dependency injection provider for Agriculture Domain Configuration
 *
 * Pre-configured provider that can be used directly in Angular module declarations
 * to register the agriculture domain configuration with the dependency injection container.
 *
 * @constant {Provider} AGRICULTURE_DOMAIN_PROVIDER
 *
 * **Usage in NgModule (Angular 13 style)**:
 * ```typescript
 * @NgModule({
 *   providers: [AGRICULTURE_DOMAIN_PROVIDER]
 * })
 * export class AgricultureModule { }
 * ```
 *
 * @see createAgricultureDomainConfig - The factory function that creates the configuration
 * @see DomainConfig - The interface describing configuration structure
 * @see DOMAIN_CONFIG - The injection token this provider uses
 */
export const AGRICULTURE_DOMAIN_PROVIDER: Provider = {
  provide: DOMAIN_CONFIG,
  useFactory: createAgricultureDomainConfig,
  deps: [Injector],
};
