/**
 * Agriculture Domain - API Adapter
 *
 * Implements the IApiAdapter interface for fetching agriculture crop data.
 * Uses mock JSON data files to simulate Elasticsearch API responses.
 *
 * Domain: Agriculture Discovery
 */

import { Observable, of } from 'rxjs';
import { map, delay } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { IApiAdapter, ApiAdapterResponse } from '../../../framework/models/resource-management.interface';
import { AgricultureSearchFilters } from '../models/agriculture.filters';
import { CropResult } from '../models/agriculture.data';
import { AgricultureStatistics } from '../models/agriculture.statistics';

/**
 * Mock Elasticsearch response structure
 */
interface MockElasticsearchResponse {
  hits: {
    total: { value: number; relation: string };
    hits: Array<{ _source: CropResult }>;
  };
  aggregations?: {
    by_crop?: { buckets: Array<{ key: string; doc_count: number }> };
    by_region?: { buckets: Array<{ key: string; doc_count: number }> };
  };
}

/**
 * Agriculture API adapter
 *
 * Fetches crop data from mock JSON files simulating Elasticsearch.
 * In a real application, this would call a backend API.
 *
 * NOTE: This is NOT an Angular service. It's instantiated manually
 * in the domain config factory.
 */
export class AgricultureApiAdapter
  implements IApiAdapter<AgricultureSearchFilters, CropResult, AgricultureStatistics>
{
  private httpClient: HttpClient;
  private baseUrl: string;

  constructor(httpClient: HttpClient, baseUrl: string) {
    this.httpClient = httpClient;
    this.baseUrl = baseUrl;
  }

  /**
   * Fetch crop data from mock JSON
   *
   * @param filters - Search filters
   * @param highlights - Optional highlight filters
   * @returns Observable of crop results with statistics
   */
  fetchData(
    filters: AgricultureSearchFilters,
    highlights?: any
  ): Observable<ApiAdapterResponse<CropResult, AgricultureStatistics>> {
    // Load mock data from JSON file
    return this.httpClient
      .get<MockElasticsearchResponse>('/assets/data/agriculture-crops.json')
      .pipe(
        delay(200), // Simulate network latency
        map((response) => {
          // Extract all records
          let results = response.hits.hits.map(hit => hit._source);

          // Apply client-side filtering (simulating server-side filtering)
          results = this.applyFilters(results, filters);

          // Calculate statistics
          const statistics = this.calculateStatistics(results, highlights);

          // Apply pagination
          const page = filters.page || 1;
          const size = filters.size || 20;
          const startIndex = (page - 1) * size;
          const paginatedResults = results.slice(startIndex, startIndex + size);

          // Apply sorting
          const sortedResults = this.applySorting(paginatedResults, filters);

          return {
            results: sortedResults,
            total: results.length,
            statistics
          };
        })
      );
  }

  /**
   * Apply filters to results (client-side filtering for mock data)
   * Supports comma-separated values for multiselect filters (crop, region)
   */
  private applyFilters(results: CropResult[], filters: AgricultureSearchFilters): CropResult[] {
    return results.filter(record => {
      // Handle crop filter (supports comma-separated multiselect)
      if (filters.crop) {
        const cropValues = filters.crop.split(',').map(c => c.trim().toLowerCase());
        if (!cropValues.includes(record.crop.toLowerCase())) {
          return false;
        }
      }
      // Handle region filter (supports comma-separated multiselect)
      if (filters.region) {
        const regionValues = filters.region.split(',').map(r => r.trim().toLowerCase());
        if (!regionValues.includes(record.region.toLowerCase())) {
          return false;
        }
      }
      if (filters.year && record.year !== filters.year) {
        return false;
      }
      if (filters.yieldMin && record.yield_bushels < filters.yieldMin) {
        return false;
      }
      if (filters.yieldMax && record.yield_bushels > filters.yieldMax) {
        return false;
      }
      if (filters.acresMin && record.acres < filters.acresMin) {
        return false;
      }
      if (filters.acresMax && record.acres > filters.acresMax) {
        return false;
      }
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesCrop = record.crop.toLowerCase().includes(searchLower);
        const matchesRegion = record.region.toLowerCase().includes(searchLower);
        if (!matchesCrop && !matchesRegion) {
          return false;
        }
      }
      return true;
    });
  }

  /**
   * Apply sorting to results
   */
  private applySorting(results: CropResult[], filters: AgricultureSearchFilters): CropResult[] {
    if (!filters.sort) {
      return results;
    }

    const direction = filters.sortDirection === 'desc' ? -1 : 1;
    const sortField = filters.sort as keyof CropResult;

    return [...results].sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return aVal.localeCompare(bVal) * direction;
      }
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return (aVal - bVal) * direction;
      }
      return 0;
    });
  }

  /**
   * Calculate statistics from filtered results
   */
  private calculateStatistics(
    results: CropResult[],
    highlights?: any
  ): AgricultureStatistics {
    const totalRecords = results.length;
    const totalAcres = results.reduce((sum, r) => sum + r.acres, 0);
    const avgYield = totalRecords > 0
      ? results.reduce((sum, r) => sum + r.yield_bushels, 0) / totalRecords
      : 0;

    // Calculate breakdowns
    const cropBreakdown: Record<string, number> = {};
    const regionBreakdown: Record<string, number> = {};

    results.forEach(record => {
      cropBreakdown[record.crop] = (cropBreakdown[record.crop] || 0) + 1;
      regionBreakdown[record.region] = (regionBreakdown[record.region] || 0) + 1;
    });

    const statistics: AgricultureStatistics = {
      totalRecords,
      totalAcres,
      avgYield,
      cropBreakdown,
      regionBreakdown
    };

    // Calculate highlighted statistics if highlights provided
    if (highlights && Object.keys(highlights).length > 0) {
      const highlightedResults = results.filter(record => {
        if (highlights.crop && record.crop !== highlights.crop) {
          return false;
        }
        if (highlights.region && record.region !== highlights.region) {
          return false;
        }
        if (highlights.year && record.year !== Number(highlights.year)) {
          return false;
        }
        return true;
      });

      statistics.highlighted = {
        totalRecords: highlightedResults.length,
        totalAcres: highlightedResults.reduce((sum, r) => sum + r.acres, 0),
        avgYield: highlightedResults.length > 0
          ? highlightedResults.reduce((sum, r) => sum + r.yield_bushels, 0) / highlightedResults.length
          : 0
      };
    }

    return statistics;
  }

  /**
   * Fetch statistics only (without crop data)
   */
  fetchStatistics(filters: AgricultureSearchFilters): Observable<AgricultureStatistics> {
    return this.fetchData(filters).pipe(
      map(response => response.statistics!)
    );
  }
}
