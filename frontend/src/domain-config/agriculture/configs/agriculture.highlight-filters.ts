/**
 * Agriculture Domain - Highlight Filter Definitions
 *
 * Defines highlight filter definitions for the Query Control component.
 * Highlight filters allow users to add h_* parameters to segment statistics
 * in charts (showing highlighted vs other data in stacked bars).
 *
 * Domain: Agriculture Discovery
 */

import { FilterDefinition, FilterOption } from '../../../framework/models/filter-definition.interface';
import { AgricultureHighlightFilters } from '../models/agriculture.filters';

/**
 * Static crop options for mock data
 */
const CROP_OPTIONS: FilterOption[] = [
  { value: 'Wheat', label: 'Wheat' },
  { value: 'Corn', label: 'Corn' },
  { value: 'Soybeans', label: 'Soybeans' },
  { value: 'Cotton', label: 'Cotton' },
  { value: 'Rice', label: 'Rice' },
  { value: 'Barley', label: 'Barley' },
  { value: 'Oats', label: 'Oats' },
  { value: 'Sorghum', label: 'Sorghum' },
  { value: 'Sunflowers', label: 'Sunflowers' }
];

/**
 * Static region options for mock data
 */
const REGION_OPTIONS: FilterOption[] = [
  { value: 'Midwest', label: 'Midwest' },
  { value: 'Plains', label: 'Plains' },
  { value: 'South', label: 'South' },
  { value: 'Northwest', label: 'Northwest' }
];

/**
 * Highlight filter definitions
 *
 * Each definition specifies:
 * - Which highlight field it manages (h_crop, h_region, etc.)
 * - What type of UI control to display (multiselect, range, etc.)
 * - URL parameter names (with h_ prefix)
 *
 * Note: For the mock data scenario, we use optionsTransformer that returns
 * static options. In a real application, optionsEndpoint would fetch from API.
 */
export const AGRICULTURE_HIGHLIGHT_FILTERS: FilterDefinition<AgricultureHighlightFilters>[] = [
  /**
   * Highlight Crop filter (Multiselect)
   * URL parameter: h_crop
   */
  {
    field: 'crop',
    label: 'Highlight Crop',
    type: 'multiselect',
    optionsTransformer: () => CROP_OPTIONS,
    urlParams: 'h_crop',
    searchPlaceholder: 'Type to search crops...',
    dialogSubtitle: 'Select one or more crops to highlight in charts.'
  },

  /**
   * Highlight Region filter (Multiselect)
   * URL parameter: h_region
   */
  {
    field: 'region',
    label: 'Highlight Region',
    type: 'multiselect',
    optionsTransformer: () => REGION_OPTIONS,
    urlParams: 'h_region',
    searchPlaceholder: 'Type to search regions...',
    dialogSubtitle: 'Select one or more regions to highlight in charts.'
  },

  /**
   * Highlight Year filter (Range)
   * URL parameter: h_year
   */
  {
    field: 'year',
    label: 'Highlight Year',
    type: 'range',
    urlParams: { min: 'h_yearMin', max: 'h_yearMax' },
    dialogTitle: 'Highlight Year Range',
    dialogSubtitle: 'Select a year range to highlight in charts.',
    rangeConfig: {
      valueType: 'integer',
      minLabel: 'Start Year',
      maxLabel: 'End Year',
      minPlaceholder: 'e.g., 2020',
      maxPlaceholder: 'e.g., 2024',
      step: 1,
      useGrouping: false,
      defaultRange: { min: 2000, max: new Date().getFullYear() }
    }
  }
];
