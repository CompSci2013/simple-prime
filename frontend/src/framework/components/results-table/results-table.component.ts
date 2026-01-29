import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  Input,
  OnInit,
  Signal
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { DomainConfig, FilterOption } from '../../models/domain-config.interface';
import { ResourceManagementService } from '../../services/resource-management.service';
import { PopOutContextService } from '../../services/popout-context.service';
import { PopOutMessageType } from '../../models/popout.interface';
import { SkeletonModule } from 'primeng/skeleton';
import { RippleModule } from 'primeng/ripple';
import { SharedModule } from 'primeng/api';
import { TableModule } from 'primeng/table';
import { CheckboxModule } from 'primeng/checkbox';
import { MultiSelectModule } from 'primeng/multiselect';
import { SelectModule } from 'primeng/select';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';
import { NgClass, NgStyle } from '@angular/common';

/**
 * Results Table Component - Angular 17 Signals Architecture
 *
 * Configuration-driven data table with integrated filtering.
 * Uses Angular Signals for reactive state management.
 *
 * **Angular 17 Patterns**:
 * - `inject()` for dependency injection
 * - Direct Signal access from ResourceManagementService
 * - `DestroyRef` + `takeUntilDestroyed()` for cleanup
 * - Minimal `markForCheck()` usage (Signals auto-notify)
 *
 * @template TFilters - Domain-specific filter model type
 * @template TData - Domain-specific data model type
 * @template TStatistics - Domain-specific statistics model type
 */
@Component({
    selector: 'app-results-table',
    templateUrl: './results-table.component.html',
    styleUrls: ['./results-table.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [NgClass, FormsModule, InputTextModule, InputNumberModule, ButtonModule, SelectModule, MultiSelectModule, CheckboxModule, TableModule, SharedModule, NgStyle, RippleModule, SkeletonModule]
})
export class ResultsTableComponent<TFilters = any, TData = any, TStatistics = any>
  implements OnInit, AfterViewInit {

  // ============================================================================
  // Dependency Injection (Angular 17 inject() pattern)
  // ============================================================================
  private readonly resourceService = inject<ResourceManagementService<TFilters, TData, TStatistics>>(ResourceManagementService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly http = inject(HttpClient);
  private readonly popOutContext = inject(PopOutContextService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly elementRef = inject(ElementRef);

  // ============================================================================
  // Configuration
  // ============================================================================

  /**
   * Environment configuration for conditional test-id rendering
   */
  readonly environment = environment;

  /**
   * Domain configuration (required input)
   */
  @Input() domainConfig!: DomainConfig<TFilters, TData, TStatistics>;

  // ============================================================================
  // Signal-Based State (Direct from ResourceManagementService)
  // ============================================================================

  /**
   * Signal for current filters - read directly from service
   */
  get filters(): Signal<TFilters> {
    return this.resourceService.filters;
  }

  /**
   * Signal for table data results
   */
  get results(): Signal<TData[]> {
    return this.resourceService.results;
  }

  /**
   * Signal for total results count
   */
  get totalResults(): Signal<number> {
    return this.resourceService.totalResults;
  }

  /**
   * Signal for loading state
   */
  get loading(): Signal<boolean> {
    return this.resourceService.loading;
  }

  /**
   * Signal for error state
   */
  get error(): Signal<Error | null> {
    return this.resourceService.error;
  }

  /**
   * Signal for statistics data
   */
  get statistics(): Signal<TStatistics | undefined> {
    return this.resourceService.statistics;
  }

  // ============================================================================
  // Component-Local State
  // ============================================================================

  /**
   * Map of expanded row IDs for collapsible row details
   */
  expandedRows: { [key: string]: boolean } = {};

  /**
   * Whether the filter panel is currently collapsed
   */
  filterPanelCollapsed = false;

  /**
   * Dynamically loaded filter options from API endpoints
   */
  dynamicOptions: Record<string, FilterOption[]> = {};

  /**
   * Object reference for template use
   */
  Object = Object;

  // ============================================================================
  // Computed Properties
  // ============================================================================

  /**
   * Calculate the first index for the paginator
   */
  get paginatorFirst(): number {
    const filters = this.filters() as Record<string, any>;
    const page = filters['page'] || 1;
    const size = filters['size'] || 20;
    return (page - 1) * size;
  }

  /**
   * Get current filters as Record for template access
   */
  get currentFilters(): Record<string, any> {
    return this.filters() as Record<string, any>;
  }

  // ============================================================================
  // Lifecycle
  // ============================================================================

  ngOnInit(): void {
    if (!this.domainConfig) {
      throw new Error('ResultsTableComponent requires domainConfig input');
    }

    // Load dynamic options for filters with optionsEndpoint
    this.loadDynamicFilterOptions();

    // In pop-out windows: Subscribe to STATE_UPDATE messages from main window
    if (this.popOutContext.isInPopOut()) {
      this.popOutContext
        .getMessages$()
        .pipe(
          filter(msg => msg.type === PopOutMessageType.STATE_UPDATE),
          takeUntilDestroyed(this.destroyRef)
        )
        .subscribe(message => {
          if (message.payload && message.payload.state) {
            this.resourceService.syncStateFromExternal(message.payload.state);
            this.cdr.markForCheck();
          }
        });
    }
  }

  // ============================================================================
  // Event Handlers
  // ============================================================================

  /**
   * Handle pagination events from PrimeNG Table
   */
  onPageChange(event: any): void {
    const currentFilters = this.filters() as Record<string, any>;
    const newFilters = {
      ...currentFilters,
      page: event.first / event.rows + 1,
      size: event.rows
    } as unknown as TFilters;
    this.resourceService.updateFilters(newFilters);
  }

  /**
   * Handle sort events from PrimeNG Table
   */
  onSort(event: any): void {
    const currentFilters = this.filters() as Record<string, any>;
    const newFilters = {
      ...currentFilters,
      sort: event.field,
      sortDirection: event.order === 1 ? 'asc' as const : 'desc' as const
    } as unknown as TFilters;
    this.resourceService.updateFilters(newFilters);
  }

  /**
   * Handle filter input changes
   */
  onFilterChange(field: string, value: any): void {
    const currentFilters = this.filters() as Record<string, any>;
    const newFilters: Record<string, any> = {
      ...currentFilters,
      page: 1 // Reset to first page on filter change
    };

    const isEmpty = value === null ||
                    value === undefined ||
                    value === '' ||
                    (Array.isArray(value) && value.length === 0);

    if (isEmpty) {
      newFilters[field] = undefined;
    } else {
      newFilters[field] = value;
    }

    this.resourceService.updateFilters(newFilters as unknown as TFilters);
  }

  /**
   * Clear all filters
   */
  clearFilters(): void {
    const currentFilters = this.filters() as Record<string, any>;
    this.resourceService.updateFilters({
      page: 1,
      size: currentFilters['size'] || 20
    } as unknown as TFilters);
  }

  /**
   * Toggle filter panel collapse state
   */
  toggleFilterPanel(): void {
    this.filterPanelCollapsed = !this.filterPanelCollapsed;
    this.cdr.markForCheck();
  }

  /**
   * Refresh data
   */
  refresh(): void {
    this.resourceService.refresh();
  }

  /**
   * Get options for a filter
   */
  getFilterOptions(filterId: string): FilterOption[] {
    if (this.dynamicOptions[filterId]) {
      return this.dynamicOptions[filterId];
    }

    const filterDef = this.domainConfig.filters.find(f => f.id === filterId);
    return filterDef?.options || [];
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  /**
   * Load dynamic options for filters that specify an optionsEndpoint
   */
  private loadDynamicFilterOptions(): void {
    const filtersWithEndpoint = this.domainConfig.filters.filter(f => f.optionsEndpoint);

    filtersWithEndpoint.forEach(filterDef => {
      const endpoint = `${this.domainConfig.apiBaseUrl}/agg/${filterDef.optionsEndpoint}`;

      this.http.get<{ field: string; values: Array<{ value: string; count: number }> }>(endpoint)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (response) => {
            this.dynamicOptions[filterDef.id] = response.values.map(item => ({
              value: item.value,
              label: item.value
            }));
            this.cdr.markForCheck();
          },
          error: (err) => {
            console.error(`Failed to load options for ${filterDef.id}:`, err);
          }
        });
    });
  }

  /**
   * Sync paginator width to match table width
   * This ensures the paginator stays aligned with the table when columns are resized
   */
  private syncPaginatorWidth(): void {
    const nativeEl = this.elementRef.nativeElement;
    const table = nativeEl.querySelector('.p-datatable-table') as HTMLElement;
    const paginator = nativeEl.querySelector('.p-paginator') as HTMLElement;

    if (table && paginator) {
      const tableWidth = table.offsetWidth;
      paginator.style.width = `${tableWidth}px`;
    }
  }

  // ============================================================================
  // Lifecycle - AfterViewInit
  // ============================================================================

  ngAfterViewInit(): void {
    // Initial sync of paginator width to table width
    this.syncPaginatorWidth();
  }
}
