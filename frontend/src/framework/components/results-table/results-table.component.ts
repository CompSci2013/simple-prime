import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  Input,
  OnDestroy,
  OnInit
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';
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
import { DropdownModule } from 'primeng/dropdown';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

/**
 * Results Table Component
 *
 * Configuration-driven data table with integrated filtering.
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
    imports: [CommonModule, FormsModule, InputTextModule, InputNumberModule, ButtonModule, DropdownModule, MultiSelectModule, CheckboxModule, TableModule, SharedModule, RippleModule, SkeletonModule]
})
export class ResultsTableComponent<TFilters = any, TData = any, TStatistics = any>
  implements OnInit, AfterViewInit, OnDestroy {

  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly resourceService: ResourceManagementService<TFilters, TData, TStatistics>,
    private readonly cdr: ChangeDetectorRef,
    private readonly http: HttpClient,
    private readonly popOutContext: PopOutContextService,
    private readonly elementRef: ElementRef
  ) {}

  // ============================================================================
  // Configuration
  // ============================================================================

  readonly environment = environment;

  @Input() domainConfig!: DomainConfig<TFilters, TData, TStatistics>;

  // ============================================================================
  // Observable Streams (from ResourceManagementService)
  // ============================================================================

  get filters$(): Observable<TFilters> {
    return this.resourceService.filters$;
  }

  get results$(): Observable<TData[]> {
    return this.resourceService.results$;
  }

  get totalResults$(): Observable<number> {
    return this.resourceService.totalResults$;
  }

  get loading$(): Observable<boolean> {
    return this.resourceService.loading$;
  }

  get error$(): Observable<Error | null> {
    return this.resourceService.error$;
  }

  get statistics$(): Observable<TStatistics | undefined> {
    return this.resourceService.statistics$;
  }

  // ============================================================================
  // Component-Local State
  // ============================================================================

  expandedRows: { [key: string]: boolean } = {};
  filterPanelCollapsed = false;
  dynamicOptions: Record<string, FilterOption[]> = {};
  Object = Object;

  // ============================================================================
  // Computed Properties
  // ============================================================================

  get paginatorFirst(): number {
    const filters = this.resourceService.getCurrentFilters() as Record<string, any>;
    const page = filters['page'] || 1;
    const size = filters['size'] || 20;
    return (page - 1) * size;
  }

  get currentFilters(): Record<string, any> {
    return this.resourceService.getCurrentFilters() as Record<string, any>;
  }

  // ============================================================================
  // Template Helpers
  // ============================================================================

  getObjectKeys(obj: any): string[] {
    return Object.keys(obj);
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
          takeUntil(this.destroy$)
        )
        .subscribe(message => {
          if (message.payload && message.payload.state) {
            this.resourceService.syncStateFromExternal(message.payload.state);
            this.cdr.markForCheck();
          }
        });
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ============================================================================
  // Event Handlers
  // ============================================================================

  onPageChange(event: any): void {
    const currentFilters = this.resourceService.getCurrentFilters() as Record<string, any>;
    const newFilters = {
      ...currentFilters,
      page: event.first / event.rows + 1,
      size: event.rows
    } as unknown as TFilters;
    this.resourceService.updateFilters(newFilters);
  }

  onSort(event: any): void {
    const currentFilters = this.resourceService.getCurrentFilters() as Record<string, any>;
    const newFilters = {
      ...currentFilters,
      sort: event.field,
      sortDirection: event.order === 1 ? 'asc' as const : 'desc' as const
    } as unknown as TFilters;
    this.resourceService.updateFilters(newFilters);
  }

  onFilterChange(field: string, value: any): void {
    const currentFilters = this.resourceService.getCurrentFilters() as Record<string, any>;
    const newFilters: Record<string, any> = {
      ...currentFilters,
      page: 1
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

  clearFilters(): void {
    const currentFilters = this.resourceService.getCurrentFilters() as Record<string, any>;
    this.resourceService.updateFilters({
      page: 1,
      size: currentFilters['size'] || 20
    } as unknown as TFilters);
  }

  toggleFilterPanel(): void {
    this.filterPanelCollapsed = !this.filterPanelCollapsed;
    this.cdr.markForCheck();
  }

  refresh(): void {
    this.resourceService.refresh();
  }

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

  private loadDynamicFilterOptions(): void {
    const filtersWithEndpoint = this.domainConfig.filters.filter(f => f.optionsEndpoint);

    filtersWithEndpoint.forEach(filterDef => {
      const endpoint = `${this.domainConfig.apiBaseUrl}/agg/${filterDef.optionsEndpoint}`;

      this.http.get<{ field: string; values: Array<{ value: string; count: number }> }>(endpoint)
        .pipe(takeUntil(this.destroy$))
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

  private syncPaginatorWidth(): void {
    const nativeEl = this.elementRef.nativeElement;
    const table = nativeEl.querySelector('.p-datatable-table') as HTMLElement;
    const paginator = nativeEl.querySelector('.p-paginator') as HTMLElement;

    if (table && paginator) {
      const tableWidth = table.offsetWidth;
      paginator.style.width = `${tableWidth}px`;
    }
  }

  ngAfterViewInit(): void {
    this.syncPaginatorWidth();
  }
}
