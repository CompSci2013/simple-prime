/**
 * Agriculture Domain - Query Control Filter Definitions
 *
 * Defines filter definitions for the Query Control component.
 * These filters allow users to manually add/remove/edit filters via dialogs.
 *
 * Domain: Agriculture Discovery
 */

import { FilterDefinition, FilterOption } from '../../../framework/models/filter-definition.interface';
import { AgricultureSearchFilters } from '../models/agriculture.filters';

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
 * Query Control filter definitions
 *
 * Each definition specifies:
 * - Which field it filters
 * - What type of UI control to display (multiselect, range, etc.)
 * - Where to fetch options from (API endpoint or transformer)
 * - URL parameter names
 *
 * Note: For the mock data scenario, we use optionsTransformer that returns
 * static options. In a real application, optionsEndpoint would fetch from API.
 */
export const AGRICULTURE_QUERY_CONTROL_FILTERS: FilterDefinition<AgricultureSearchFilters>[] = [
  /**
   * Crop filter (Multiselect)
   */
  {
    field: 'crop',
    label: 'Crop',
    type: 'multiselect',
    // Using transformer to return static options (simulating API response)
    optionsTransformer: () => CROP_OPTIONS,
    urlParams: 'crop',
    searchPlaceholder: 'Type to search crops...',
    dialogSubtitle: 'Select one or more crops to filter results.'
  },

  /**
   * Region filter (Multiselect)
   */
  {
    field: 'region',
    label: 'Region',
    type: 'multiselect',
    optionsTransformer: () => REGION_OPTIONS,
    urlParams: 'region',
    searchPlaceholder: 'Type to search regions...',
    dialogSubtitle: 'Select one or more regions to filter results.'
  },

  /**
   * Year filter (Range)
   */
  {
    field: 'year',
    label: 'Year',
    type: 'range',
    urlParams: { min: 'yearMin', max: 'yearMax' },
    dialogTitle: 'Select Year',
    dialogSubtitle: 'Select a year to filter results.',
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
  },

  /**
   * Yield Range filter (Range)
   */
  {
    field: 'yieldMin',
    label: 'Yield',
    type: 'range',
    urlParams: { min: 'yieldMin', max: 'yieldMax' },
    dialogTitle: 'Select Yield Range',
    dialogSubtitle: 'Select a yield range (bushels per acre) to filter results.',
    rangeConfig: {
      valueType: 'decimal',
      minLabel: 'Min Yield',
      maxLabel: 'Max Yield',
      minPlaceholder: 'e.g., 50',
      maxPlaceholder: 'e.g., 200',
      step: 1,
      useGrouping: true,
      defaultRange: { min: 0, max: 10000 }
    }
  },

  /**
   * Acres Range filter (Range)
   */
  {
    field: 'acresMin',
    label: 'Acres',
    type: 'range',
    urlParams: { min: 'acresMin', max: 'acresMax' },
    dialogTitle: 'Select Acreage Range',
    dialogSubtitle: 'Select an acreage range to filter results.',
    rangeConfig: {
      valueType: 'integer',
      minLabel: 'Min Acres',
      maxLabel: 'Max Acres',
      minPlaceholder: 'e.g., 100',
      maxPlaceholder: 'e.g., 5000',
      step: 10,
      useGrouping: true,
      defaultRange: { min: 0, max: 100000 }
    }
  }
];
