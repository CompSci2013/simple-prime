import {
  computed,
  DestroyRef,
  inject,
  Injectable,
  Injector,
  NgZone,
  OnDestroy,
  signal,
  Signal,
  WritableSignal
} from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { Observable, of, Subject } from 'rxjs';
import { catchError, finalize, takeUntil } from 'rxjs/operators';
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
 * **Angular 17 Signals Architecture**:
 * This service uses Angular Signals for fine-grained reactivity and zoneless-ready state management.
 * State is stored in WritableSignals, with computed() for derived values and toObservable() for
 * backward-compatible Observable streams.
 *
 * **Purpose**: Manages application state with URL as single source of truth.
 * Coordinates filter changes, API calls, state updates, and cross-window synchronization.
 *
 * **Architecture**: URL → Filters → API → Data → Components
 *
 * **Key Features**:
 * - URL-first design: URL parameters are the single source of truth
 * - Signal-based state: WritableSignal for state, computed() for derived values
 * - Observable interop: toObservable() provides backward-compatible streams
 * - Domain-agnostic: Works with any domain via DOMAIN_CONFIG injection
 * - Component-level injection: New instance per component
 * - Pop-out aware: Automatically disables API calls in pop-out windows
 * - inject() pattern: Modern Angular 17 dependency injection
 *
 * **State Flow**:
 * ```
 * 1. URL Changes
 *    ↓
 * 2. watchUrlChanges() detects URL param change
 *    ↓
 * 3. filterMapper.fromUrlParams() converts URL → TFilters
 *    ↓
 * 4. state.set() updates Signal
 *    ↓
 * 5. Components read signals (filters(), results()) → re-render
 *    ↓
 * 6. If autoFetch=true: fetchData() calls API
 *    ↓
 * 7. API response → state.update() → components re-render
 * ```
 *
 * @template TFilters - The shape of filter objects (e.g., AutoSearchFilters)
 * @template TData - The shape of individual data items (e.g., VehicleResult)
 * @template TStatistics - The shape of statistics objects (e.g., VehicleStatistics)
 */
@Injectable()
export class ResourceManagementService<TFilters, TData, TStatistics = any>
  implements OnDestroy {

  // ============================================================================
  // Dependency Injection (Angular 17 inject() pattern)
  // ============================================================================
  private readonly urlState = inject(UrlStateService);
  private readonly domainConfig = inject<DomainConfig<TFilters, TData, TStatistics>>(DOMAIN_CONFIG);
  private readonly popOutContext = inject(PopOutContextService);
  private readonly ngZone = inject(NgZone);
  private readonly injector = inject(Injector);
  private readonly destroyRef = inject(DestroyRef);
  private readonly isPopOutToken = inject(IS_POPOUT_TOKEN, { optional: true }) ?? false;

  // ============================================================================
  // Internal State
  // ============================================================================

  /**
   * RxJS Subject for component destruction cleanup
   * Used with takeUntil() in internal subscriptions.
   */
  private readonly destroy$ = new Subject<void>();

  /**
   * Service configuration from DOMAIN_CONFIG
   */
  private readonly config: ResourceManagementConfig<TFilters, TData, TStatistics>;

  // ============================================================================
  // Signal-Based State (Angular 17)
  // ============================================================================

  /**
   * Primary state signal - single source of truth
   * All other signals are computed from this.
   */
  private readonly state: WritableSignal<ResourceState<TFilters, TData, TStatistics>>;

  /**
   * Computed signal for current filters
   * Uses deepEqual for change detection instead of JSON.stringify
   */
  public readonly filters: Signal<TFilters> = computed(
    () => this.state().filters,
    { equal: deepEqual }
  );

  /**
   * Computed signal for data results
   */
  public readonly results: Signal<TData[]> = computed(
    () => this.state().results
  );

  /**
   * Computed signal for total results count
   */
  public readonly totalResults: Signal<number> = computed(
    () => this.state().totalResults
  );

  /**
   * Computed signal for loading state
   */
  public readonly loading: Signal<boolean> = computed(
    () => this.state().loading
  );

  /**
   * Computed signal for error state
   */
  public readonly error: Signal<Error | null> = computed(
    () => this.state().error
  );

  /**
   * Computed signal for statistics
   */
  public readonly statistics: Signal<TStatistics | undefined> = computed(
    () => this.state().statistics
  );

  /**
   * Computed signal for highlight filters
   */
  public readonly highlights: Signal<any> = computed(
    () => this.state().highlights ?? {},
    { equal: deepEqual }
  );

  // ============================================================================
  // Observable Streams (Backward Compatibility)
  // ============================================================================

  /**
   * Observable of complete state (for existing subscribers)
   */
  public readonly state$: Observable<ResourceState<TFilters, TData, TStatistics>>;

  /**
   * Observable of current filters
   */
  public readonly filters$: Observable<TFilters>;

  /**
   * Observable of data results
   */
  public readonly results$: Observable<TData[]>;

  /**
   * Observable of total results count
   */
  public readonly totalResults$: Observable<number>;

  /**
   * Observable of loading state
   */
  public readonly loading$: Observable<boolean>;

  /**
   * Observable of error state
   */
  public readonly error$: Observable<Error | null>;

  /**
   * Observable of statistics
   */
  public readonly statistics$: Observable<TStatistics | undefined>;

  /**
   * Observable of highlight filters
   */
  public readonly highlights$: Observable<any>;

  // ============================================================================
  // Constructor
  // ============================================================================

  constructor() {
    // STEP 1: Extract configuration from domain config
    this.config = {
      filterMapper: this.domainConfig.urlMapper,
      apiAdapter: this.domainConfig.apiAdapter,
      cacheKeyBuilder: this.domainConfig.cacheKeyBuilder,
      defaultFilters: (this.domainConfig.defaultFilters || {}) as TFilters,
      supportsHighlights: this.domainConfig.features?.highlights ?? false,
      highlightPrefix: 'h_',
      autoFetch: this.isPopOutToken ? false : !this.popOutContext.isInPopOut()
    };

    // STEP 2: Initialize state signal with default values
    this.state = signal<ResourceState<TFilters, TData, TStatistics>>({
      filters: this.config.defaultFilters,
      results: [],
      totalResults: 0,
      loading: false,
      error: null,
      statistics: undefined
    });

    // STEP 3: Create Observable streams from Signals (backward compatibility)
    // toObservable() converts Signal → Observable for existing subscribers
    this.state$ = toObservable(this.state, { injector: this.injector });
    this.filters$ = toObservable(this.filters, { injector: this.injector });
    this.results$ = toObservable(this.results, { injector: this.injector });
    this.totalResults$ = toObservable(this.totalResults, { injector: this.injector });
    this.loading$ = toObservable(this.loading, { injector: this.injector });
    this.error$ = toObservable(this.error, { injector: this.injector });
    this.statistics$ = toObservable(this.statistics, { injector: this.injector });
    this.highlights$ = toObservable(this.highlights, { injector: this.injector });

    // STEP 4: Bootstrap state management
    this.initializeFromUrl();
    this.watchUrlChanges();

    // STEP 5: Register cleanup with DestroyRef (Angular 17 pattern)
    this.destroyRef.onDestroy(() => {
      this.destroy$.next();
      this.destroy$.complete();
    });
  }

  // ============================================================================
  // Public API
  // ============================================================================

  /**
   * Update filters (triggers URL update → data fetch in main window)
   */
  updateFilters(partial: Partial<TFilters>): void {
    const currentFilters = this.state().filters;
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
    const currentFilters = this.state().filters;
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
    this.fetchData(this.state().filters);
  }

  /**
   * Get current state snapshot
   */
  getCurrentState(): ResourceState<TFilters, TData, TStatistics> {
    return this.state();
  }

  /**
   * Get current filters snapshot
   */
  getCurrentFilters(): TFilters {
    return this.state().filters;
  }

  /**
   * Sync state from external source (e.g., pop-out receiving state from main window)
   */
  public syncStateFromExternal(
    externalState: ResourceState<TFilters, TData, TStatistics>
  ): void {
    // Ensure state update happens inside Angular zone for proper change detection
    this.ngZone.run(() => {
      this.state.set(externalState);
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

    this.state.update(s => ({ ...s, filters, highlights }));
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
        this.state.update(s => ({ ...s, filters, highlights }));

        if (this.config.autoFetch) {
          this.fetchData(filters);
        }
      });
  }

  /**
   * Fetch data from API
   */
  private fetchData(filters: TFilters): void {
    this.state.update(s => ({ ...s, loading: true, error: null }));

    const fetchStartTime = Date.now();
    const fetchId = Math.random().toString(36).substring(7);
    console.log(`[ResourceManagementService] FETCH START [${fetchId}]`, {
      filters,
      timestamp: new Date().toISOString()
    });

    const highlights = this.state().highlights;

    this.config.apiAdapter
      .fetchData(filters, highlights)
      .pipe(
        takeUntil(this.destroy$),
        catchError(error => {
          console.error(`[ResourceManagementService] FETCH ERROR [${fetchId}]:`, error);
          this.state.update(s => ({
            ...s,
            loading: false,
            error: error instanceof Error ? error : new Error(String(error)),
            results: [],
            totalResults: 0
          }));
          return of(null);
        }),
        finalize(() => {
          const duration = Date.now() - fetchStartTime;
          console.log(`[ResourceManagementService] FETCH FINALIZE [${fetchId}] - Duration: ${duration}ms`);
          if (this.state().loading) {
            this.state.update(s => ({ ...s, loading: false }));
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
          this.state.update(s => ({
            ...s,
            results: response.results,
            totalResults: response.total,
            statistics: response.statistics,
            loading: false,
            error: null
          }));
        }
      });
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
