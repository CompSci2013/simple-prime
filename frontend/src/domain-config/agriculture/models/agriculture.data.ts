/**
 * Agriculture Domain - Data Model
 *
 * Defines the data structure for agricultural records returned from API.
 *
 * Domain: Agriculture Discovery
 */

/**
 * Crop record representing a single agricultural data entry
 *
 * Maps to Elasticsearch document structure from mock JSON data.
 *
 * @example
 * ```typescript
 * const record = new CropResult();
 * record.crop = 'Wheat';
 * record.region = 'Midwest';
 * record.yield_bushels = 52.4;
 * record.acres = 1500;
 * record.year = 2024;
 * ```
 */
export class CropResult {
  /**
   * Crop type name
   * @example 'Wheat', 'Corn', 'Soybeans'
   */
  crop!: string;

  /**
   * Geographic region
   * @example 'Midwest', 'South', 'Plains', 'Northwest'
   */
  region!: string;

  /**
   * Yield in bushels per acre
   * @example 52.4, 178.5
   */
  yield_bushels!: number;

  /**
   * Total acres planted
   * @example 1500, 2200
   */
  acres!: number;

  /**
   * Harvest year
   * @example 2024
   */
  year!: number;
}

/**
 * Type alias for backwards compatibility
 */
export type CropRecord = CropResult;
