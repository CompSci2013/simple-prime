/**
 * Agriculture Domain - Filter Definitions
 *
 * Defines query control filters for the agriculture discovery interface.
 * These are UI filters that users can interact with to refine their search.
 *
 * Domain: Agriculture Discovery
 */

import { FilterDefinition } from '../../../framework/models/domain-config.interface';

/**
 * Agriculture filter definitions
 *
 * Array of filter controls for the query panel.
 * Users can combine these filters to search for specific crop data.
 */
export const AGRICULTURE_FILTER_DEFINITIONS: FilterDefinition[] = [
  /**
   * Crop filter
   */
  {
    id: 'crop',
    label: 'Crop',
    type: 'autocomplete',
    placeholder: 'Enter crop name...',
    autocompleteEndpoint: 'filters/crops',
    autocompleteMinChars: 1,
    operators: ['contains', 'equals', 'startsWith'],
    defaultOperator: 'equals',
    validation: {
      minLength: 1,
      maxLength: 100
    }
  },

  /**
   * Region filter
   */
  {
    id: 'region',
    label: 'Region',
    type: 'autocomplete',
    placeholder: 'Enter region name...',
    autocompleteEndpoint: 'filters/regions',
    autocompleteMinChars: 1,
    operators: ['contains', 'equals', 'startsWith'],
    defaultOperator: 'equals',
    validation: {
      minLength: 1,
      maxLength: 100
    }
  },

  /**
   * Year filter
   */
  {
    id: 'year',
    label: 'Year',
    type: 'range',
    min: 2000,
    max: new Date().getFullYear() + 1,
    step: 1,
    format: {
      number: {
        useGrouping: false,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }
    }
  },

  /**
   * Yield range filter (bushels per acre)
   */
  {
    id: 'yield',
    label: 'Yield (bu/acre)',
    type: 'range',
    min: 0,
    max: 10000,
    step: 1,
    format: {
      number: {
        useGrouping: true,
        minimumFractionDigits: 0,
        maximumFractionDigits: 1
      }
    }
  },

  /**
   * Acres range filter
   */
  {
    id: 'acres',
    label: 'Acres',
    type: 'range',
    min: 0,
    max: 100000,
    step: 10,
    format: {
      number: {
        useGrouping: true,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }
    }
  },

  /**
   * Global search filter
   */
  {
    id: 'search',
    label: 'Search',
    type: 'text',
    placeholder: 'Search crop, region...',
    operators: ['contains'],
    defaultOperator: 'contains',
    validation: {
      minLength: 1,
      maxLength: 200
    }
  }
];

/**
 * Quick filter presets
 */
export const AGRICULTURE_QUICK_FILTERS = {
  /**
   * Midwest crops
   */
  midwest: {
    label: 'Midwest Region',
    filters: {
      region: 'Midwest'
    }
  },

  /**
   * High yield crops
   */
  highYield: {
    label: 'High Yield',
    filters: {
      yieldMin: 100
    }
  },

  /**
   * Large farms
   */
  largeFarms: {
    label: 'Large Farms (1000+ acres)',
    filters: {
      acresMin: 1000
    }
  },

  /**
   * Current year
   */
  currentYear: {
    label: `${new Date().getFullYear()} Crops`,
    filters: {
      year: new Date().getFullYear()
    }
  }
};

/**
 * Filter groups
 */
export const AGRICULTURE_FILTER_GROUPS = {
  identification: {
    label: 'Crop Identification',
    filters: ['crop', 'region']
  },

  temporal: {
    label: 'Year',
    filters: ['year']
  },

  metrics: {
    label: 'Metrics',
    filters: ['yield', 'acres']
  },

  general: {
    label: 'General Search',
    filters: ['search']
  }
};
