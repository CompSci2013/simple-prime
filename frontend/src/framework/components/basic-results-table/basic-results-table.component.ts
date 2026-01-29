import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output
} from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { DomainConfig } from '../../models/domain-config.interface';
import { ResourceManagementService } from '../../services/resource-management.service';
import { PopOutContextService } from '../../services/popout-context.service';
import { PopOutMessageType } from '../../models/popout.interface';
import { SkeletonModule } from 'primeng/skeleton';
import { RippleModule } from 'primeng/ripple';
import { ButtonModule } from 'primeng/button';
import { SharedModule } from 'primeng/api';
import { TableModule } from 'primeng/table';
import { CommonModule } from '@angular/common';

/**
 * Basic Results Table Component
 *
 * Pure display component for showing tabular data with pagination and sorting.
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
    imports: [CommonModule, TableModule, SharedModule, ButtonModule, RippleModule, SkeletonModule]
})
export class BasicResultsTableComponent<TFilters = any, TData = any, TStatistics = any>
  implements OnInit, AfterViewInit, OnDestroy {

  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly resourceService: ResourceManagementService<TFilters, TData, TStatistics>,
    private readonly cdr: ChangeDetectorRef,
    private readonly popOutContext: PopOutContextService,
    private readonly elementRef: ElementRef
  ) {}

  // ============================================================================
  // Configuration
  // ============================================================================

  readonly environment = environment;

  @Input() domainConfig!: DomainConfig<TFilters, TData, TStatistics>;

  @Output() urlParamsChange = new EventEmitter<{ [key: string]: any }>();

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

  // ============================================================================
  // Component-Local State
  // ============================================================================

  expandedRows: { [key: string]: boolean } = {};
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
      throw new Error('BasicResultsTableComponent requires domainConfig input');
    }

    // Pop-out window support
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
    const page = event.first / event.rows + 1;
    const size = event.rows;

    if (this.popOutContext.isInPopOut()) {
      this.urlParamsChange.emit({ page, size });
    } else {
      const currentFilters = this.resourceService.getCurrentFilters() as Record<string, any>;
      const newFilters = {
        ...currentFilters,
        page,
        size
      } as unknown as TFilters;
      this.resourceService.updateFilters(newFilters);
    }
  }

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
      const currentFilters = this.resourceService.getCurrentFilters() as Record<string, any>;
      const newFilters = {
        ...currentFilters,
        sort,
        sortDirection
      } as unknown as TFilters;
      this.resourceService.updateFilters(newFilters);
    }
  }

  refresh(): void {
    this.resourceService.refresh();
  }

  // ============================================================================
  // Lifecycle - AfterViewInit
  // ============================================================================

  ngAfterViewInit(): void {
    this.syncPaginatorWidth();
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

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
