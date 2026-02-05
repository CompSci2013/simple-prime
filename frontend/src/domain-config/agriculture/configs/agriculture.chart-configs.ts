/**
 * Agriculture Domain - Chart Configurations (Plotly.js)
 *
 * Defines chart visualizations for agriculture statistics using Plotly.js.
 * Charts display aggregated data and distributions.
 *
 * Domain: Agriculture Discovery
 */

import { ChartConfig } from '../../../framework/models/domain-config.interface';

/**
 * Agriculture chart configurations
 *
 * Array of chart definitions for the statistics panel.
 * Each chart visualizes a different aspect of the crop data.
 */
export const AGRICULTURE_CHART_CONFIGS: ChartConfig[] = [
  /**
   * Crop distribution (vertical stacked bar chart)
   */
  {
    id: 'crop-distribution',
    title: 'Crops',
    type: 'bar',
    dataSourceId: 'crop',
    height: 400,
    width: '100%',
    visible: true,
    collapsible: true
  },

  /**
   * Region distribution (vertical stacked bar chart)
   */
  {
    id: 'region-distribution',
    title: 'Regions',
    type: 'bar',
    dataSourceId: 'region',
    height: 400,
    width: '100%',
    visible: true,
    collapsible: true
  }
];
