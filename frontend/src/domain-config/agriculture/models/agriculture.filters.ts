/**
 * Agriculture Domain - Filter Model
 *
 * Defines the filter parameters for agriculture crop search.
 * Maps to URL query parameters via the AgricultureUrlMapper.
 *
 * Domain: Agriculture Discovery
 */

/**
 * Highlight Filters
 *
 * Highlight parameters for segmented statistics computation.
 * Corresponds to URL parameters with 'h_' prefix (e.g., h_crop, h_region).
 */
export interface AgricultureHighlightFilters {
  /**
   * Crop type highlighting
   * URL parameter: h_crop
   */
  crop?: string;

  /**
   * Region highlighting
   * URL parameter: h_region
   */
  region?: string;

  /**
   * Year highlighting
   * URL parameter: h_year
   */
  year?: number;
}

/**
 * Agriculture search filters
 *
 * Comprehensive filter model for searching and filtering agricultural data.
 * All fields are optional to support partial filtering.
 *
 * @example
 * ```typescript
 * const filters: AgricultureSearchFilters = {
 *   crop: 'Wheat',
 *   region: 'Midwest',
 *   year: 2024,
 *   page: 1,
 *   size: 20
 * };
 * ```
 */
export class AgricultureSearchFilters {
  /**
   * Crop type name
   * Case-insensitive partial match
   *
   * @example 'Wheat', 'Corn', 'Soybeans'
   */
  crop?: string;

  /**
   * Geographic region
   * Case-insensitive partial match
   *
   * @example 'Midwest', 'South', 'Plains'
   */
  region?: string;

  /**
   * Year filter
   *
   * @example 2024
   */
  year?: number;

  /**
   * Minimum yield (bushels per acre)
   *
   * @example 50
   */
  yieldMin?: number;

  /**
   * Maximum yield (bushels per acre)
   *
   * @example 200
   */
  yieldMax?: number;

  /**
   * Minimum acres
   *
   * @example 100
   */
  acresMin?: number;

  /**
   * Maximum acres
   *
   * @example 5000
   */
  acresMax?: number;

  /**
   * Page number (1-indexed)
   * Used for pagination
   *
   * @default 1
   */
  page?: number;

  /**
   * Page size (number of results per page)
   * Used for pagination
   *
   * @default 20
   */
  size?: number;

  /**
   * Sort field
   * Field name to sort by
   *
   * @example 'crop', 'region', 'yield_bushels', 'acres'
   */
  sort?: string;

  /**
   * Sort direction
   * Ascending or descending order
   *
   * @default 'asc'
   */
  sortDirection?: 'asc' | 'desc';

  /**
   * Search query (global search)
   * Searches across multiple fields
   *
   * @example 'Wheat Midwest'
   */
  search?: string;

  /**
   * Constructor with default values
   */
  constructor(partial?: Partial<AgricultureSearchFilters>) {
    Object.assign(this, partial);
  }

  /**
   * Create filters from partial object
   */
  static fromPartial(partial: Partial<AgricultureSearchFilters>): AgricultureSearchFilters {
    return new AgricultureSearchFilters(partial);
  }

  /**
   * Get default filters
   */
  static getDefaults(): AgricultureSearchFilters {
    return new AgricultureSearchFilters({
      page: 1,
      size: 20,
      sort: 'crop',
      sortDirection: 'asc'
    });
  }

  /**
   * Check if filters are empty (no active filters except pagination/sort)
   */
  isEmpty(): boolean {
    return (
      !this.crop &&
      !this.region &&
      !this.year &&
      !this.yieldMin &&
      !this.yieldMax &&
      !this.acresMin &&
      !this.acresMax &&
      !this.search
    );
  }

  /**
   * Clone filters
   */
  clone(): AgricultureSearchFilters {
    return new AgricultureSearchFilters({ ...this });
  }

  /**
   * Merge with other filters
   */
  merge(other: Partial<AgricultureSearchFilters>): AgricultureSearchFilters {
    return new AgricultureSearchFilters({
      ...this,
      ...other
    });
  }

  /**
   * Clear all filters except pagination and sort
   */
  clearSearch(): AgricultureSearchFilters {
    return new AgricultureSearchFilters({
      page: this.page,
      size: this.size,
      sort: this.sort,
      sortDirection: this.sortDirection
    });
  }
}
