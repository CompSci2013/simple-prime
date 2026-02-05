import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Inject,
  OnDestroy,
  OnInit
} from '@angular/core';
import { Params } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { DomainConfig } from '../../../../framework/models';
import { PopOutMessageType } from '../../../../framework/models/popout.interface';
import { DOMAIN_CONFIG } from '../../../../framework/services/domain-config-registry.service';
import { PopOutManagerService } from '../../../../framework/services/popout-manager.service';
import { ResourceManagementService } from '../../../../framework/services/resource-management.service';
import { UrlStateService } from '../../../../framework/services/url-state.service';
import { ChartDataSource } from '../../../../framework/components/base-chart/base-chart.component';
import {
  AgricultureSearchFilters,
  CropResult,
  AgricultureStatistics
} from '../../../../domain-config/agriculture';

/**
 * Agriculture Discover Component (NgModule Pattern with Framework Integration)
 *
 * Feature component for exploring agricultural data including crops, yields,
 * and regional statistics. Uses the Generic Discovery Framework with
 * URL-First state management.
 *
 * Features:
 * - URL-First architecture (filters persist in URL)
 * - Data table with crop records
 * - Plotly.js charts for crop/region distribution
 * - Query Control for filter management
 * - Pop-out support for charts
 *
 * Architecture Note:
 * This component uses the traditional NgModule pattern (Angular 13 style) but
 * integrates with the same framework services used by the standalone Automobile
 * domain (AutomobileDiscoverComponent). The key difference is that:
 * - This component is declared in AgricultureModule
 * - Dependencies are imported at the module level
 * - Framework services are provided via the module's providers array
 *
 * @class AgricultureDiscoverComponent
 * @since 1.0 (Original Angular 13 implementation)
 * @updated 2.0 (Framework integration with URL-First architecture)
 */
@Component({
  selector: 'app-agriculture-discover',
  templateUrl: './agriculture-discover.component.html',
  styleUrls: ['./agriculture-discover.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  // NOTE: In NgModule pattern, providers are typically at module level,
  // but these services need to be scoped to this component instance
  providers: [ResourceManagementService, PopOutManagerService]
})
export class AgricultureDiscoverComponent implements OnInit, OnDestroy {

  domainConfig: DomainConfig<AgricultureSearchFilters, CropResult, AgricultureStatistics>;
  collapsedPanels = new Map<string, boolean>();
  panelOrder: string[] = ['query-control', 'statistics', 'crop-chart', 'region-chart', 'data-table'];

  private destroy$ = new Subject<void>();
  private readonly gridId = 'agriculture-discover';

  constructor(
    @Inject(DOMAIN_CONFIG) domainConfig: DomainConfig<any, any, any>,
    public resourceService: ResourceManagementService<AgricultureSearchFilters, CropResult, AgricultureStatistics>,
    private popOutManager: PopOutManagerService,
    private cdr: ChangeDetectorRef,
    private urlStateService: UrlStateService
  ) {
    this.domainConfig = domainConfig as DomainConfig<AgricultureSearchFilters, CropResult, AgricultureStatistics>;
  }

  ngOnInit(): void {
    this.popOutManager.initialize(this.gridId);

    // Listen for messages from pop-out windows
    this.popOutManager.messages$
      .pipe(takeUntil(this.destroy$))
      .subscribe(({ panelId, message }) => {
        this.handlePopOutMessage(panelId, message);
      });

    // Handle pop-out window closing
    this.popOutManager.closed$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.cdr.markForCheck();
      });

    // Broadcast state changes to pop-out windows
    this.resourceService.state$
      .pipe(takeUntil(this.destroy$))
      .subscribe(state => {
        this.popOutManager.broadcastState(state);
      });
  }

  // ============================================================================
  // Panel Management
  // ============================================================================

  isPanelPoppedOut(panelId: string): boolean {
    return this.popOutManager.isPoppedOut(panelId);
  }

  isPanelCollapsed(panelId: string): boolean {
    return this.collapsedPanels.get(panelId) ?? false;
  }

  togglePanelCollapse(panelId: string): void {
    const currentState = this.collapsedPanels.get(panelId) ?? false;
    this.collapsedPanels.set(panelId, !currentState);
    this.cdr.markForCheck();
  }

  trackByPanelId(index: number, panelId: string): string {
    return panelId;
  }

  // ============================================================================
  // Chart Data Source Access
  // ============================================================================

  getChartDataSource(chartId: string): ChartDataSource | undefined {
    return this.domainConfig.chartDataSources?.[chartId];
  }

  // ============================================================================
  // Pop-Out Management
  // ============================================================================

  popOutPanel(panelId: string, panelType: string): void {
    this.popOutManager.openPopOut(panelId, panelType);
    this.cdr.markForCheck();
  }

  onChartPopOut(chartId: string): void {
    const panelId = `chart-${chartId}`;
    this.popOutManager.openPopOut(panelId, 'chart');
    this.cdr.markForCheck();
  }

  onTablePopOut(): void {
    this.popOutManager.openPopOut('results-table', 'basic-results');
    this.cdr.markForCheck();
  }

  private async handlePopOutMessage(_panelId: string, message: any): Promise<void> {
    switch (message.type) {
      case PopOutMessageType.PANEL_READY:
        const currentState = this.resourceService.getCurrentState();
        this.popOutManager.broadcastState(currentState);
        break;

      case PopOutMessageType.URL_PARAMS_CHANGED:
        if (message.payload?.params) {
          await this.urlStateService.setParams(message.payload.params);
        }
        break;

      case PopOutMessageType.CLEAR_ALL_FILTERS:
        await this.urlStateService.clearParams();
        break;

      case PopOutMessageType.FILTER_ADD:
        if (message.payload?.params) {
          await this.urlStateService.setParams({
            ...message.payload.params,
            page: 1
          });
        }
        break;

      case PopOutMessageType.FILTER_REMOVE:
        if (message.payload?.field) {
          await this.urlStateService.setParams({
            [message.payload.field]: null,
            page: 1
          });
        }
        break;

      case PopOutMessageType.CHART_CLICK:
        if (message.payload) {
          const dataSource = this.domainConfig.chartDataSources?.[message.payload.chartId];
          await this.onStandaloneChartClick(
            { value: message.payload.value, isHighlightMode: message.payload.isHighlightMode },
            dataSource
          );
        }
        break;
    }
  }

  // ============================================================================
  // URL State Management
  // ============================================================================

  async onUrlParamsChange(params: Params): Promise<void> {
    await this.urlStateService.setParams(params);
  }

  async onClearAllFilters(): Promise<void> {
    await this.urlStateService.clearParams();
  }

  async onStandaloneChartClick(
    event: { value: string; isHighlightMode: boolean },
    dataSource: ChartDataSource | undefined
  ): Promise<void> {
    if (!dataSource) return;

    const newParams = dataSource.toUrlParams(event.value, event.isHighlightMode);
    if (!event.isHighlightMode) {
      newParams['page'] = 1;
    }

    if (Object.keys(newParams).length > 0) {
      await this.urlStateService.setParams(newParams);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
