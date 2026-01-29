import {
  Inject,
  Injectable,
  NgZone,
  OnDestroy,
  Optional
} from '@angular/core';
import { BehaviorSubject, Observable, of, Subject } from 'rxjs';
import { catchError, distinctUntilChanged, finalize, map, takeUntil } from 'rxjs/operators';
import { DomainConfig } from '../models/domain-config.interface';
import {
  ResourceManagementConfig,
  ResourceState
} from '../models/resource-management.interface';
import { DOMAIN_CONFIG } from './domain-config-registry.service';
import { PopOutContextService } from './popout-context.service';
import { UrlStateService } from './url-state.service';
import { IS_POPOUT_TOKEN } from '../tokens/popout.token';

/**
 * Deep equality check for filter objects
 * Replaces JSON.stringify comparison with proper structural equality
 */
function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a == null || b == null) return a === b;
  if (typeof a !== typeof b) return false;
  if (typeof a !== 'object') return a === b;

  const aObj = a as Record<string, unknown>;
  const bObj = b as Record<string, unknown>;
  const aKeys = Object.keys(aObj);
  const bKeys = Object.keys(bObj);

  if (aKeys.length !== bKeys.length) return false;

  return aKeys.every(key => deepEqual(aObj[key], bObj[key]));
}

/**
 * Generic resource management service - Core state orchestrator for URL-first architecture
 *
 * **Purpose**: Manages application state with URL as single source of truth.
 * Coordinates filter changes, API calls, state updates, and cross-window synchronization.
 *
 * **Architecture**: URL → Filters → API → Data → Components
 *
 * **Key Features**:
 * - URL-first design: URL parameters are the single source of truth
 * - BehaviorSubject-based state with Observable streams
 * - Domain-agnostic: Works with any domain via DOMAIN_CONFIG injection
 * - Component-level injection: New instance per component
 * - Pop-out aware: Automatically disables API calls in pop-out windows
 *
 * @template TFilters - The shape of filter objects (e.g., AutoSearchFilters)
 * @template TData - The shape of individual data items (e.g., VehicleResult)
 * @template TStatistics - The shape of statistics objects (e.g., VehicleStatistics)
 */
@Injectable()
export class ResourceManagementService<TFilters, TData, TStatistics = any>
  implements OnDestroy {

  // ============================================================================
  // Internal State
  // ============================================================================

  private readonly destroy$ = new Subject<void>();
  private readonly config: ResourceManagementConfig<TFilters, TData, TStatistics>;

  // ============================================================================
  // BehaviorSubject-Based State
  // ============================================================================

  private readonly stateSubject: BehaviorSubject<ResourceState<TFilters, TData, TStatistics>>;

  // ============================================================================
  // Observable Streams
  // ============================================================================

  public readonly state$: Observable<ResourceState<TFilters, TData, TStatistics>>;
  public readonly filters$: Observable<TFilters>;
  public readonly results$: Observable<TData[]>;
  public readonly totalResults$: Observable<number>;
  public readonly loading$: Observable<boolean>;
  public readonly error$: Observable<Error | null>;
  public readonly statistics$: Observable<TStatistics | undefined>;
  public readonly highlights$: Observable<any>;

  // ============================================================================
  // Constructor
  // ============================================================================

  constructor(
    private readonly urlState: UrlStateService,
    @Inject(DOMAIN_CONFIG) private readonly domainConfig: DomainConfig<TFilters, TData, TStatistics>,
    private readonly popOutContext: PopOutContextService,
    private readonly ngZone: NgZone,
    @Optional() @Inject(IS_POPOUT_TOKEN) private readonly isPopOutToken: boolean
  ) {
    const isPopOut = this.isPopOutToken ?? false;

    this.config = {
      filterMapper: this.domainConfig.urlMapper,
      apiAdapter: this.domainConfig.apiAdapter,
      cacheKeyBuilder: this.domainConfig.cacheKeyBuilder,
      defaultFilters: (this.domainConfig.defaultFilters || {}) as TFilters,
      supportsHighlights: this.domainConfig.features?.highlights ?? false,
      highlightPrefix: 'h_',
      autoFetch: isPopOut ? false : !this.popOutContext.isInPopOut()
    };

    this.stateSubject = new BehaviorSubject<ResourceState<TFilters, TData, TStatistics>>({
      filters: this.config.defaultFilters,
      results: [],
      totalResults: 0,
      loading: false,
      error: null,
      statistics: undefined
    });

    this.state$ = this.stateSubject.asObservable();
    this.filters$ = this.state$.pipe(
      map(s => s.filters),
      distinctUntilChanged((a, b) => deepEqual(a, b))
    );
    this.results$ = this.state$.pipe(
      map(s => s.results),
      distinctUntilChanged()
    );
    this.totalResults$ = this.state$.pipe(
      map(s => s.totalResults),
      distinctUntilChanged()
    );
    this.loading$ = this.state$.pipe(
      map(s => s.loading),
      distinctUntilChanged()
    );
    this.error$ = this.state$.pipe(
      map(s => s.error),
      distinctUntilChanged()
    );
    this.statistics$ = this.state$.pipe(
      map(s => s.statistics),
      distinctUntilChanged()
    );
    this.highlights$ = this.state$.pipe(
      map(s => s.highlights ?? {}),
      distinctUntilChanged((a, b) => deepEqual(a, b))
    );

    this.initializeFromUrl();
    this.watchUrlChanges();
  }

  // ============================================================================
  // Public API
  // ============================================================================

  /**
   * Update filters (triggers URL update → data fetch in main window)
   */
  updateFilters(partial: Partial<TFilters>): void {
    const currentFilters = this.stateSubject.value.filters;
    const merged = { ...currentFilters, ...partial };

    // Clean up filters (remove empty values)
    const newFilters: Record<string, any> = {};
    for (const key of Object.keys(merged)) {
      const value = (merged as Record<string, any>)[key];
      if (value !== undefined && value !== null && value !== '') {
        newFilters[key] = value;
      }
    }

    // Convert filter objects to URL parameters
    const newUrlParams = this.config.filterMapper.toUrlParams(newFilters as TFilters);

    // Get current URL params to identify which ones need to be removed
    const currentUrlParams = this.config.filterMapper.toUrlParams(currentFilters);

    // Build final params object with null values for removed params
    const finalParams: Record<string, any> = { ...newUrlParams };
    for (const key of Object.keys(currentUrlParams)) {
      if (!(key in newUrlParams)) {
        finalParams[key] = null;
      }
    }

    this.urlState.setParams(finalParams);
  }

  /**
   * Clear all filters (reset to defaults)
   */
  clearFilters(): void {
    const currentFilters = this.stateSubject.value.filters;
    const currentUrlParams = this.config.filterMapper.toUrlParams(currentFilters);
    const defaultUrlParams = this.config.filterMapper.toUrlParams(this.config.defaultFilters);

    const finalParams: Record<string, any> = { ...defaultUrlParams };
    for (const key of Object.keys(currentUrlParams)) {
      if (!(key in defaultUrlParams)) {
        finalParams[key] = null;
      }
    }

    this.urlState.setParams(finalParams, true);
  }

  /**
   * Refresh data with current filters
   */
  refresh(): void {
    this.fetchData(this.stateSubject.value.filters);
  }

  /**
   * Get current state snapshot
   */
  getCurrentState(): ResourceState<TFilters, TData, TStatistics> {
    return this.stateSubject.value;
  }

  /**
   * Get current filters snapshot
   */
  getCurrentFilters(): TFilters {
    return this.stateSubject.value.filters;
  }

  /**
   * Sync state from external source (e.g., pop-out receiving state from main window)
   */
  public syncStateFromExternal(
    externalState: ResourceState<TFilters, TData, TStatistics>
  ): void {
    this.ngZone.run(() => {
      this.stateSubject.next(externalState);
    });
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  /**
   * Extract highlight filters from URL parameters
   */
  private extractHighlights(urlParams: Record<string, any>): any {
    // Preferred: Use domain-specific mapper strategy
    if (this.config.filterMapper.extractHighlights) {
      return this.config.filterMapper.extractHighlights(urlParams);
    }

    // Fallback: Legacy behavior (deprecated)
    if (!this.config.supportsHighlights) {
      return {};
    }

    const prefix = this.config.highlightPrefix || 'h_';
    const highlights: Record<string, any> = {};

    Object.keys(urlParams).forEach(key => {
      if (key.startsWith(prefix)) {
        const highlightKey = key.substring(prefix.length);
        let value = urlParams[key];

        if (typeof value === 'string' && value.includes('|')) {
          value = value.replace(/\|/g, ',');
        }

        highlights[highlightKey] = value;
      }
    });

    return highlights;
  }

  /**
   * Initialize filters from current URL
   */
  private initializeFromUrl(): void {
    const urlParams = this.urlState.getParams();
    const filters = this.config.filterMapper.fromUrlParams(urlParams);
    const highlights = this.extractHighlights(urlParams);

    this.updateState({ filters, highlights });
  }

  /**
   * Watch for URL changes and update state
   */
  private watchUrlChanges(): void {
    this.urlState
      .watchParams()
      .pipe(takeUntil(this.destroy$))
      .subscribe(urlParams => {
        const filters = this.config.filterMapper.fromUrlParams(urlParams);
        const highlights = this.extractHighlights(urlParams);
        this.updateState({ filters, highlights });

        if (this.config.autoFetch) {
          this.fetchData(filters);
        }
      });
  }

  /**
   * Fetch data from API
   */
  private fetchData(filters: TFilters): void {
    this.updateState({ loading: true, error: null });

    const fetchStartTime = Date.now();
    const fetchId = Math.random().toString(36).substring(7);
    console.log(`[ResourceManagementService] FETCH START [${fetchId}]`, {
      filters,
      timestamp: new Date().toISOString()
    });

    const highlights = this.stateSubject.value.highlights;

    this.config.apiAdapter
      .fetchData(filters, highlights)
      .pipe(
        takeUntil(this.destroy$),
        catchError(error => {
          console.error(`[ResourceManagementService] FETCH ERROR [${fetchId}]:`, error);
          this.updateState({
            loading: false,
            error: error instanceof Error ? error : new Error(String(error)),
            results: [],
            totalResults: 0
          });
          return of(null);
        }),
        finalize(() => {
          const duration = Date.now() - fetchStartTime;
          console.log(`[ResourceManagementService] FETCH FINALIZE [${fetchId}] - Duration: ${duration}ms`);
          if (this.stateSubject.value.loading) {
            this.updateState({ loading: false });
          }
        })
      )
      .subscribe(response => {
        const duration = Date.now() - fetchStartTime;
        console.log(`[ResourceManagementService] FETCH COMPLETE [${fetchId}] - Duration: ${duration}ms`, {
          resultCount: response?.results?.length ?? 0,
          totalResults: response?.total ?? 0,
          timestamp: new Date().toISOString()
        });
        if (response) {
          this.updateState({
            results: response.results,
            totalResults: response.total,
            statistics: response.statistics,
            loading: false,
            error: null
          });
        }
      });
  }

  /**
   * Helper method to update state immutably
   */
  private updateState(partial: Partial<ResourceState<TFilters, TData, TStatistics>>): void {
    this.stateSubject.next({ ...this.stateSubject.value, ...partial });
  }

  // ============================================================================
  // Lifecycle
  // ============================================================================

  /**
   * Clean up subscriptions on component destroy
   */
  destroy(): void {
    this.ngOnDestroy();
  }

  /**
   * Clean up subscriptions on component destroy
   */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
