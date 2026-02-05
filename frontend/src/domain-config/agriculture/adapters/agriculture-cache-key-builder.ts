/**
 * Agriculture Domain - Cache Key Builder
 *
 * Implements ICacheKeyBuilder for building cache keys from filter objects.
 * Used by RequestCoordinatorService for caching API responses.
 *
 * Domain: Agriculture Discovery
 */

import { Injectable } from '@angular/core';
import { ICacheKeyBuilder } from '../../../framework/models/resource-management.interface';
import { AgricultureSearchFilters } from '../models/agriculture.filters';

/**
 * Agriculture cache key builder
 *
 * Generates unique cache keys from filter objects for request coordination.
 * Cache keys are deterministic - same filters always produce same key.
 */
@Injectable({
  providedIn: 'root'
})
export class AgricultureCacheKeyBuilder
  implements ICacheKeyBuilder<AgricultureSearchFilters>
{
  /**
   * Cache key prefix for agriculture domain
   */
  private readonly PREFIX = 'agri';

  /**
   * Build cache key from filters
   *
   * Creates a unique, deterministic cache key by serializing
   * all non-null/undefined filter values in sorted order.
   *
   * @param filters - Filter object
   * @param highlights - Optional highlight filters (h_* parameters)
   * @returns Cache key string
   */
  buildKey(filters: AgricultureSearchFilters, highlights?: any): string {
    const parts: string[] = [this.PREFIX];

    // Collect all defined filter values
    const entries = this.getFilterEntries(filters);

    // Add highlight parameters with h_ prefix
    if (highlights) {
      if (highlights.crop) {
        entries.push(['h_crop', highlights.crop]);
      }
      if (highlights.region) {
        entries.push(['h_region', highlights.region]);
      }
      if (highlights.year !== undefined && highlights.year !== null) {
        entries.push(['h_year', highlights.year]);
      }
    }

    // Sort by key for deterministic ordering
    entries.sort((a, b) => a[0].localeCompare(b[0]));

    // Build key parts
    entries.forEach(([key, value]) => {
      parts.push(`${key}=${this.serializeValue(value)}`);
    });

    return parts.join(':');
  }

  /**
   * Get all defined filter entries as [key, value] pairs
   */
  private getFilterEntries(
    filters: AgricultureSearchFilters
  ): Array<[string, any]> {
    const entries: Array<[string, any]> = [];

    if (filters.crop !== undefined && filters.crop !== null) {
      entries.push(['crop', filters.crop]);
    }

    if (filters.region !== undefined && filters.region !== null) {
      entries.push(['region', filters.region]);
    }

    if (filters.year !== undefined && filters.year !== null) {
      entries.push(['year', filters.year]);
    }

    if (filters.yieldMin !== undefined && filters.yieldMin !== null) {
      entries.push(['yieldMin', filters.yieldMin]);
    }

    if (filters.yieldMax !== undefined && filters.yieldMax !== null) {
      entries.push(['yieldMax', filters.yieldMax]);
    }

    if (filters.acresMin !== undefined && filters.acresMin !== null) {
      entries.push(['acresMin', filters.acresMin]);
    }

    if (filters.acresMax !== undefined && filters.acresMax !== null) {
      entries.push(['acresMax', filters.acresMax]);
    }

    if (filters.search !== undefined && filters.search !== null) {
      entries.push(['search', filters.search]);
    }

    if (filters.page !== undefined && filters.page !== null) {
      entries.push(['page', filters.page]);
    }

    if (filters.size !== undefined && filters.size !== null) {
      entries.push(['size', filters.size]);
    }

    if (filters.sort !== undefined && filters.sort !== null) {
      entries.push(['sort', filters.sort]);
    }

    if (filters.sortDirection !== undefined && filters.sortDirection !== null) {
      entries.push(['sortDirection', filters.sortDirection]);
    }

    return entries;
  }

  /**
   * Serialize value for cache key
   */
  private serializeValue(value: any): string {
    if (value === null || value === undefined) {
      return '';
    }

    if (Array.isArray(value)) {
      return value.map((v) => String(v)).join(',');
    }

    if (typeof value === 'object') {
      return JSON.stringify(value);
    }

    return String(value);
  }

  /**
   * Get cache key prefix for agriculture domain
   */
  getPrefix(): string {
    return this.PREFIX;
  }
}
