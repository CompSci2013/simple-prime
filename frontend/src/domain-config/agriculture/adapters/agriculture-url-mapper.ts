/**
 * Agriculture Domain - URL Mapper
 *
 * Implements IFilterUrlMapper for converting filters to/from URL parameters.
 * Enables URL-first state management and shareable filter states.
 *
 * Domain: Agriculture Discovery
 */

import { Injectable } from '@angular/core';
import { Params } from '@angular/router';
import { IFilterUrlMapper } from '../../../framework/models/resource-management.interface';
import { AgricultureSearchFilters } from '../models/agriculture.filters';

/**
 * Agriculture filter URL mapper
 *
 * Bidirectional conversion between filter objects and URL query parameters.
 */
@Injectable({
  providedIn: 'root'
})
export class AgricultureUrlMapper implements IFilterUrlMapper<AgricultureSearchFilters> {
  /**
   * URL parameter names
   */
  private readonly PARAM_NAMES = {
    crop: 'crop',
    region: 'region',
    year: 'year',
    yieldMin: 'yieldMin',
    yieldMax: 'yieldMax',
    acresMin: 'acresMin',
    acresMax: 'acresMax',
    search: 'search',
    page: 'page',
    size: 'size',
    sort: 'sortBy',
    sortDirection: 'sortOrder'
  };

  /**
   * Convert filters to URL query parameters
   */
  toUrlParams(filters: AgricultureSearchFilters): Params {
    const params: Params = {};

    if (filters.crop !== undefined && filters.crop !== null) {
      params[this.PARAM_NAMES.crop] = filters.crop;
    }

    if (filters.region !== undefined && filters.region !== null) {
      params[this.PARAM_NAMES.region] = filters.region;
    }

    if (filters.year !== undefined && filters.year !== null) {
      params[this.PARAM_NAMES.year] = String(filters.year);
    }

    if (filters.yieldMin !== undefined && filters.yieldMin !== null) {
      params[this.PARAM_NAMES.yieldMin] = String(filters.yieldMin);
    }

    if (filters.yieldMax !== undefined && filters.yieldMax !== null) {
      params[this.PARAM_NAMES.yieldMax] = String(filters.yieldMax);
    }

    if (filters.acresMin !== undefined && filters.acresMin !== null) {
      params[this.PARAM_NAMES.acresMin] = String(filters.acresMin);
    }

    if (filters.acresMax !== undefined && filters.acresMax !== null) {
      params[this.PARAM_NAMES.acresMax] = String(filters.acresMax);
    }

    if (filters.search !== undefined && filters.search !== null) {
      params[this.PARAM_NAMES.search] = filters.search;
    }

    if (filters.page !== undefined && filters.page !== null) {
      params[this.PARAM_NAMES.page] = String(filters.page);
    }

    if (filters.size !== undefined && filters.size !== null) {
      params[this.PARAM_NAMES.size] = String(filters.size);
    }

    if (filters.sort !== undefined && filters.sort !== null) {
      params[this.PARAM_NAMES.sort] = filters.sort;
    }

    if (filters.sortDirection !== undefined && filters.sortDirection !== null) {
      params[this.PARAM_NAMES.sortDirection] = filters.sortDirection;
    }

    return params;
  }

  /**
   * Convert URL query parameters to filters
   */
  fromUrlParams(params: Params): AgricultureSearchFilters {
    const filters = new AgricultureSearchFilters();

    if (params[this.PARAM_NAMES.crop]) {
      filters.crop = String(params[this.PARAM_NAMES.crop]);
    }

    if (params[this.PARAM_NAMES.region]) {
      filters.region = String(params[this.PARAM_NAMES.region]);
    }

    if (params[this.PARAM_NAMES.year]) {
      const value = this.parseNumber(params[this.PARAM_NAMES.year]);
      if (value !== null) {
        filters.year = value;
      }
    }

    if (params[this.PARAM_NAMES.yieldMin]) {
      const value = this.parseNumber(params[this.PARAM_NAMES.yieldMin]);
      if (value !== null) {
        filters.yieldMin = value;
      }
    }

    if (params[this.PARAM_NAMES.yieldMax]) {
      const value = this.parseNumber(params[this.PARAM_NAMES.yieldMax]);
      if (value !== null) {
        filters.yieldMax = value;
      }
    }

    if (params[this.PARAM_NAMES.acresMin]) {
      const value = this.parseNumber(params[this.PARAM_NAMES.acresMin]);
      if (value !== null) {
        filters.acresMin = value;
      }
    }

    if (params[this.PARAM_NAMES.acresMax]) {
      const value = this.parseNumber(params[this.PARAM_NAMES.acresMax]);
      if (value !== null) {
        filters.acresMax = value;
      }
    }

    if (params[this.PARAM_NAMES.search]) {
      filters.search = String(params[this.PARAM_NAMES.search]);
    }

    if (params[this.PARAM_NAMES.page]) {
      const value = this.parseNumber(params[this.PARAM_NAMES.page]);
      if (value !== null) {
        filters.page = value;
      }
    }

    if (params[this.PARAM_NAMES.size]) {
      const value = this.parseNumber(params[this.PARAM_NAMES.size]);
      if (value !== null) {
        filters.size = value;
      }
    }

    if (params[this.PARAM_NAMES.sort]) {
      filters.sort = String(params[this.PARAM_NAMES.sort]);
    }

    if (params[this.PARAM_NAMES.sortDirection]) {
      const direction = String(params[this.PARAM_NAMES.sortDirection]);
      if (direction === 'asc' || direction === 'desc') {
        filters.sortDirection = direction;
      }
    }

    return filters;
  }

  /**
   * Parse number from URL parameter value
   */
  private parseNumber(value: any): number | null {
    if (value === null || value === undefined || value === '') {
      return null;
    }
    const num = Number(value);
    return isNaN(num) ? null : num;
  }

  /**
   * Extract highlight filters from URL parameters
   */
  extractHighlights(params: Params): Record<string, any> {
    const highlights: Record<string, any> = {};
    const prefix = 'h_';

    Object.keys(params).forEach(key => {
      if (key.startsWith(prefix)) {
        const highlightKey = key.substring(prefix.length);
        let value = params[key];

        if (typeof value === 'string' && value.includes('|')) {
          value = value.replace(/\|/g, ',');
        }

        highlights[highlightKey] = value;
      }
    });

    return highlights;
  }

  /**
   * Get parameter name mapping
   */
  getParameterMapping(): Record<string, string> {
    return { ...this.PARAM_NAMES };
  }
}
