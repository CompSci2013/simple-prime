import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError, delay } from 'rxjs/operators';

export interface CropRecord {
  crop: string;
  region: string;
  yield_bushels: number;
  acres: number;
  year: number;
}

export interface SoilRecord {
  location: string;
  region: string;
  ph: number;
  nitrogen_ppm: number;
  phosphorus_ppm: number;
  potassium_ppm: number;
}

export interface ElasticsearchResponse<T> {
  hits: {
    total: { value: number; relation: string };
    hits: Array<{ _source: T }>;
  };
  aggregations?: any;
}

export interface AggregationBucket {
  key: string;
  doc_count: number;
}

/**
 * Agriculture Data Service (NgModule Pattern)
 *
 * Service for fetching agricultural data from mock JSON files that simulate
 * Elasticsearch responses. This service demonstrates the traditional Angular
 * service pattern used in NgModule-based applications.
 *
 * Mock Data:
 * - Crop data: Yields, regions, and production statistics
 * - Soil data: Nutrient composition and pH levels
 *
 * Architecture Note:
 * This service is provided at the module level in AgricultureModule,
 * following the Angular 13 pattern. Unlike tree-shakable providedIn: 'root',
 * this service is scoped to the Agriculture feature module.
 *
 * @Injectable
 * @since 1.0 (Original Angular 13 implementation)
 */
@Injectable()
export class AgricultureDataService {

  constructor(private http: HttpClient) { }

  /**
   * Fetch crop data from mock Elasticsearch response
   * Simulates: GET /api/agriculture/crops/_search
   */
  getCropData(): Observable<CropRecord[]> {
    return this.http.get<ElasticsearchResponse<CropRecord>>('/assets/data/agriculture-crops.json')
      .pipe(
        delay(300), // Simulate network latency
        map(response => response.hits.hits.map(hit => hit._source)),
        catchError(error => {
          console.error('Error fetching crop data:', error);
          return of([]);
        })
      );
  }

  /**
   * Fetch soil data from mock Elasticsearch response
   * Simulates: GET /api/agriculture/soil/_search
   */
  getSoilData(): Observable<SoilRecord[]> {
    return this.http.get<ElasticsearchResponse<SoilRecord>>('/assets/data/agriculture-soil.json')
      .pipe(
        delay(300), // Simulate network latency
        map(response => response.hits.hits.map(hit => hit._source)),
        catchError(error => {
          console.error('Error fetching soil data:', error);
          return of([]);
        })
      );
  }

  /**
   * Fetch crop aggregations (by crop type)
   * Simulates: Elasticsearch aggregation query
   */
  getCropAggregations(): Observable<AggregationBucket[]> {
    return this.http.get<ElasticsearchResponse<CropRecord>>('/assets/data/agriculture-crops.json')
      .pipe(
        delay(200),
        map(response => response.aggregations?.by_crop?.buckets || []),
        catchError(error => {
          console.error('Error fetching crop aggregations:', error);
          return of([]);
        })
      );
  }

  /**
   * Fetch region aggregations
   * Simulates: Elasticsearch aggregation query
   */
  getRegionAggregations(): Observable<AggregationBucket[]> {
    return this.http.get<ElasticsearchResponse<CropRecord>>('/assets/data/agriculture-crops.json')
      .pipe(
        delay(200),
        map(response => response.aggregations?.by_region?.buckets || []),
        catchError(error => {
          console.error('Error fetching region aggregations:', error);
          return of([]);
        })
      );
  }
}
