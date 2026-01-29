import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  ElementRef,
  EventEmitter,
  inject,
  Input,
  OnInit,
  Output,
  Signal
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { DomainConfig } from '../../models/domain-config.interface';
import { ResourceManagementService } from '../../services/resource-management.service';
import { PopOutContextService } from '../../services/popout-context.service';
import { PopOutMessageType } from '../../models/popout.interface';
import { SkeletonModule } from 'primeng/skeleton';
import { RippleModule } from 'primeng/ripple';
import { ButtonModule } from 'primeng/button';
import { NgStyle } from '@angular/common';
import { SharedModule } from 'primeng/api';
import { TableModule } from 'primeng/table';

/**
 * Basic Results Table Component - Angular 17 Signals Architecture
 *
 * Pure display component for showing tabular data with pagination and sorting.
 * Uses Angular Signals for reactive state management.
 *
 * **Angular 17 Patterns**:
 * - `inject()` for dependency injection
 * - Direct Signal access from ResourceManagementService
 * - `DestroyRef` + `takeUntilDestroyed()` for cleanup
 *
 * @template TFilters - Domain-specific filter model type
 * @template TData - Domain-specific data model type
 * @template TStatistics - Domain-specific statistics model type
 */
@Component({
    selector: 'app-basic-results-table',
    standalone: true,
    templateUrl: './basic-results-table.component.html',
    styleUrls: ['./basic-results-table.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [TableModule, SharedModule, NgStyle, ButtonModule, RippleModule, SkeletonModule]
})
export class BasicResultsTableComponent<TFilters = any, TData = any, TStatistics = any>
  implements OnInit, AfterViewInit {

  // ============================================================================
  // Dependency Injection (Angular 17 inject() pattern)
  // ============================================================================
  private readonly resourceService = inject<ResourceManagementService<TFilters, TData, TStatistics>>(ResourceManagementService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly popOutContext = inject(PopOutContextService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly elementRef = inject(ElementRef);

  // ============================================================================
  // Configuration
  // ============================================================================

  readonly environment = environment;

  @Input() domainConfig!: DomainConfig<TFilters, TData, TStatistics>;

  /**
   * Emits when URL parameters should be updated (sort, page, size)
   */
  @Output() urlParamsChange = new EventEmitter<{ [key: string]: any }>();

  // ============================================================================
  // Signal-Based State (Direct from ResourceManagementService)
  // ============================================================================

  get filters(): Signal<TFilters> {
    return this.resourceService.filters;
  }

  get results(): Signal<TData[]> {
    return this.resourceService.results;
  }

  get totalResults(): Signal<number> {
    return this.resourceService.totalResults;
  }

  get loading(): Signal<boolean> {
    return this.resourceService.loading;
  }

  // ============================================================================
  // Component-Local State
  // ============================================================================

  expandedRows: { [key: string]: boolean } = {};
  Object = Object;

  // ============================================================================
  // Computed Properties
  // ============================================================================

  get paginatorFirst(): number {
    const filters = this.filters() as Record<string, any>;
    const page = filters['page'] || 1;
    const size = filters['size'] || 20;
    return (page - 1) * size;
  }

  get currentFilters(): Record<string, any> {
    return this.filters() as Record<string, any>;
  }

  // ============================================================================
  // Lifecycle
  // ============================================================================

  ngOnInit(): void {
    if (!this.domainConfig) {
      throw new Error('BasicResultsTableComponent requires domainConfig input');
    }

    // Pop-out window support
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
    const page = event.first / event.rows + 1;
    const size = event.rows;

    if (this.popOutContext.isInPopOut()) {
      this.urlParamsChange.emit({ page, size });
    } else {
      const currentFilters = this.filters() as Record<string, any>;
      const newFilters = {
        ...currentFilters,
        page,
        size
      } as unknown as TFilters;
      this.resourceService.updateFilters(newFilters);
    }
  }

  /**
   * Handle sort events from PrimeNG Table
   */
  onSort(event: any): void {
    const sort = event.field;
    const sortDirection = event.order === 1 ? 'asc' : 'desc';
    const isPopOut = this.popOutContext.isInPopOut();

    console.log('[BasicResultsTable] onSort called', { sort, sortDirection, isPopOut });

    if (isPopOut) {
      console.log('[BasicResultsTable] Emitting urlParamsChange', { sort, sortDirection });
      this.urlParamsChange.emit({ sort, sortDirection });
    } else {
      console.log('[BasicResultsTable] Calling updateFilters directly');
      const currentFilters = this.filters() as Record<string, any>;
      const newFilters = {
        ...currentFilters,
        sort,
        sortDirection
      } as unknown as TFilters;
      this.resourceService.updateFilters(newFilters);
    }
  }

  /**
   * Refresh data
   */
  refresh(): void {
    this.resourceService.refresh();
  }

  // ============================================================================
  // Lifecycle - AfterViewInit
  // ============================================================================

  ngAfterViewInit(): void {
    // Initial sync of paginator width to table width
    this.syncPaginatorWidth();
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

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
}
