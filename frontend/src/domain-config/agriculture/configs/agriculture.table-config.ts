/**
 * Agriculture Domain - Table Configuration
 *
 * Defines the main data table for displaying crop results.
 * Configures columns, pagination, sorting, filtering, and row expansion.
 *
 * Domain: Agriculture Discovery
 */

import { TableConfig } from '../../../framework/models/table-config.interface';
import { CropResult } from '../models/agriculture.data';

/**
 * Agriculture table configuration
 *
 * Main table for displaying crop search results.
 * Supports pagination, sorting, filtering, and row expansion.
 */
export const AGRICULTURE_TABLE_CONFIG: TableConfig<CropResult> = {
  /**
   * Unique table identifier
   */
  tableId: 'agriculture-crops-table',

  /**
   * State persistence key
   */
  stateKey: 'agri-crops-state',

  /**
   * Data key field (must be unique per row)
   * Using combination of crop + region + year as unique identifier
   */
  dataKey: 'crop',

  /**
   * Table columns configuration
   */
  columns: [
    {
      field: 'crop',
      header: 'Crop',
      sortable: true,
      filterable: true,
      filterMatchMode: 'contains',
      reorderable: true,
      width: '150px'
    },
    {
      field: 'region',
      header: 'Region',
      sortable: true,
      filterable: true,
      filterMatchMode: 'contains',
      reorderable: true,
      width: '130px'
    },
    {
      field: 'year',
      header: 'Year',
      sortable: true,
      filterable: true,
      filterMatchMode: 'equals',
      reorderable: true,
      width: '100px'
    },
    {
      field: 'yield_bushels',
      header: 'Yield (bu/acre)',
      sortable: true,
      filterable: false,
      reorderable: true,
      width: '130px'
    },
    {
      field: 'acres',
      header: 'Acres',
      sortable: true,
      filterable: false,
      reorderable: true,
      width: '110px'
    }
  ],

  /**
   * Row expansion enabled
   */
  expandable: false,

  /**
   * Row selection disabled
   */
  selectable: false,

  /**
   * Selection mode
   */
  selectionMode: undefined,

  /**
   * Pagination enabled
   */
  paginator: true,

  /**
   * Default rows per page
   */
  rows: 20,

  /**
   * Rows per page options
   */
  rowsPerPageOptions: [10, 20, 50, 100],

  /**
   * Lazy loading enabled
   */
  lazy: true,

  /**
   * State persistence
   */
  stateStorage: 'local',

  /**
   * Table style class
   */
  styleClass: 'p-datatable-striped p-datatable-gridlines',

  /**
   * Responsive layout
   */
  responsiveLayout: 'scroll',

  /**
   * Show grid lines
   */
  gridlines: true,

  /**
   * Striped rows
   */
  stripedRows: true,

  /**
   * Loading indicator
   */
  loading: false
};

/**
 * Column visibility presets
 */
export const AGRICULTURE_TABLE_COLUMN_PRESETS = {
  all: AGRICULTURE_TABLE_CONFIG.columns,

  minimal: AGRICULTURE_TABLE_CONFIG.columns.filter((col) =>
    ['crop', 'region', 'yield_bushels'].includes(col.field)
  ),

  summary: AGRICULTURE_TABLE_CONFIG.columns.filter(
    (col) => col.field !== 'acres'
  )
};

/**
 * Default sort configuration
 */
export const AGRICULTURE_TABLE_DEFAULT_SORT = {
  field: 'crop',
  order: 1 // 1 = ascending, -1 = descending
};

/**
 * Export format configurations
 */
export const AGRICULTURE_TABLE_EXPORT_CONFIG = {
  csv: {
    columns: [
      { field: 'crop', header: 'Crop' },
      { field: 'region', header: 'Region' },
      { field: 'year', header: 'Year' },
      { field: 'yield_bushels', header: 'Yield (bu/acre)' },
      { field: 'acres', header: 'Acres' }
    ],
    filename: 'agriculture-crops'
  },

  excel: {
    columns: [
      { field: 'crop', header: 'Crop' },
      { field: 'region', header: 'Region' },
      { field: 'year', header: 'Year' },
      { field: 'yield_bushels', header: 'Yield (bu/acre)' },
      { field: 'acres', header: 'Acres' }
    ],
    filename: 'agriculture-crops',
    sheetName: 'Crops'
  }
};
