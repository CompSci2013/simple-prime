/**
 * Agriculture Domain - Statistics Model
 *
 * Defines the structure for agricultural statistics returned from API.
 *
 * Domain: Agriculture Discovery
 */

/**
 * Statistics for agriculture data
 *
 * Aggregated metrics computed from the filtered dataset.
 *
 * @example
 * ```typescript
 * const stats = new AgricultureStatistics();
 * stats.totalRecords = 12;
 * stats.totalAcres = 15020;
 * stats.avgYield = 287.4;
 * stats.cropBreakdown = { Wheat: 2, Corn: 2, Soybeans: 2 };
 * stats.regionBreakdown = { Midwest: 4, Plains: 4, South: 3 };
 * ```
 */
export class AgricultureStatistics {
  /**
   * Total number of records matching filters
   */
  totalRecords!: number;

  /**
   * Total acres across all filtered records
   */
  totalAcres!: number;

  /**
   * Average yield (bushels per acre) across filtered records
   */
  avgYield!: number;

  /**
   * Breakdown by crop type
   * Key: crop name, Value: count
   */
  cropBreakdown!: Record<string, number>;

  /**
   * Breakdown by region
   * Key: region name, Value: count
   */
  regionBreakdown!: Record<string, number>;

  /**
   * Highlighted statistics (when highlight filters active)
   */
  highlighted?: {
    totalRecords: number;
    totalAcres: number;
    avgYield: number;
  };
}
