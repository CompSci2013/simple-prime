import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Inject,
  Injector,
  OnDestroy,
  OnInit
} from '@angular/core';
import { Params } from '@angular/router';
import { CommonModule } from '@angular/common';
import { DragDropModule, CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { MessageService } from 'primeng/api';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { createAutomobilePickerConfigs } from '../../../../domain-config/automobile/configs/automobile.picker-configs';
import { DomainConfig } from '../../../../framework/models';
import { PopOutMessageType } from '../../../../framework/models/popout.interface';
import { DOMAIN_CONFIG } from '../../../../framework/services/domain-config-registry.service';
import { FilterOptionsService } from '../../../../framework/services/filter-options.service';
import { PickerConfigRegistry } from '../../../../framework/services/picker-config-registry.service';
import { PopOutManagerService } from '../../../../framework/services/popout-manager.service';
import { ResourceManagementService } from '../../../../framework/services/resource-management.service';
import { UrlStateService } from '../../../../framework/services/url-state.service';
import { UserPreferencesService } from '../../../../framework/services/user-preferences.service';
import { StatisticsPanel2Component } from '../../../../framework/components/statistics-panel-2/statistics-panel-2.component';
import { DockviewStatisticsPanelComponent } from '../../../../framework/components/dockview-statistics-panel/dockview-statistics-panel.component';
import { BasePickerComponent } from '../../../../framework/components/base-picker/base-picker.component';
import { BaseChartComponent, ChartDataSource } from '../../../../framework/components/base-chart/base-chart.component';
import { DynamicResultsTableComponent } from '../../../../framework/components/dynamic-results-table/dynamic-results-table.component';
import { QueryControlComponent } from '../../../../framework/components/query-control/query-control.component';
import { TooltipModule } from 'primeng/tooltip';
import { ButtonModule } from 'primeng/button';

/**
 * Automobile Discover Component
 *
 * Main discovery page for the Automobile domain. Provides:
 * - Manufacturer-Model picker for hierarchical filtering
 * - Statistics panels with charts
 * - Draggable/collapsible panel layout
 * - Pop-out support for multi-monitor workflows
 *
 * Uses standalone component pattern (Angular 14+).
 */
@Component({
    selector: 'app-automobile-discover',
    standalone: true,
    templateUrl: './automobile-discover.component.html',
    styleUrls: ['./automobile-discover.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [ResourceManagementService, PopOutManagerService],
    imports: [CommonModule, DragDropModule, ButtonModule, TooltipModule, BasePickerComponent, StatisticsPanel2Component, DockviewStatisticsPanelComponent, BaseChartComponent, DynamicResultsTableComponent, QueryControlComponent]
})
export class AutomobileDiscoverComponent<TFilters = any, TData = any, TStatistics = any>
  implements OnInit, OnDestroy {

  domainConfig: DomainConfig<TFilters, TData, TStatistics>;
  collapsedPanels = new Map<string, boolean>([['manufacturer-model-picker', true]]);
  panelOrder: string[] = ['query-control', 'statistics-1', 'dockview-statistics', 'chart-body-class', 'chart-year', 'manufacturer-model-picker', 'results-table'];

  // Unique picker config ID for this page instance
  readonly pickerConfigId = 'automobile-discover-manufacturer-model-picker';

  private destroy$ = new Subject<void>();
  private readonly gridId = 'automobile-discover';

  constructor(
    @Inject(DOMAIN_CONFIG) domainConfig: DomainConfig<any, any, any>,
    public resourceService: ResourceManagementService<TFilters, TData, TStatistics>,
    private pickerRegistry: PickerConfigRegistry,
    private injector: Injector,
    private popOutManager: PopOutManagerService,
    private cdr: ChangeDetectorRef,
    private messageService: MessageService,
    private urlStateService: UrlStateService,
    private userPreferences: UserPreferencesService,
    private filterOptionsService: FilterOptionsService
  ) {
    this.domainConfig = domainConfig as DomainConfig<TFilters, TData, TStatistics>;
  }

  ngOnInit(): void {
    // Register picker configs with unique ID for this page
    const pickerConfigs = createAutomobilePickerConfigs(this.injector, 'automobile-discover');
    this.pickerRegistry.registerMultiple(pickerConfigs);

    this.popOutManager.initialize(this.gridId);

    this.popOutManager.messages$
      .pipe(takeUntil(this.destroy$))
      .subscribe(({ panelId, message }) => {
        this.handlePopOutMessage(panelId, message);
      });

    this.popOutManager.closed$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.cdr.markForCheck();
      });

    this.popOutManager.blocked$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.messageService.add({
          severity: 'warn',
          summary: 'Pop-up Blocked',
          detail: 'Please allow pop-ups for this site to use the pop-out feature',
          life: 5000
        });
      });

    this.resourceService.state$
      .pipe(takeUntil(this.destroy$))
      .subscribe(state => {
        // Include filter options cache for URL-First compliance in popouts
        const filterOptionsCache = this.filterOptionsService.getCache();
        this.popOutManager.broadcastState(state, filterOptionsCache);
      });
  }

  isPanelPoppedOut(panelId: string): boolean {
    return this.popOutManager.isPoppedOut(panelId);
  }

  isPanelCollapsed(panelId: string): boolean {
    return this.collapsedPanels.get(panelId) ?? false;
  }

  togglePanelCollapse(panelId: string): void {
    const currentState = this.collapsedPanels.get(panelId) ?? false;
    this.collapsedPanels.set(panelId, !currentState);

    const collapsedPanels = Array.from(this.collapsedPanels.entries())
      .filter(([_, isCollapsed]) => isCollapsed)
      .map(([id]) => id);
    this.userPreferences.saveCollapsedPanels(collapsedPanels);

    this.cdr.markForCheck();
  }

  onPanelDrop(event: CdkDragDrop<string[]>): void {
    moveItemInArray(this.panelOrder, event.previousIndex, event.currentIndex);
    this.userPreferences.savePanelOrder(this.panelOrder);
    this.cdr.markForCheck();
  }

  trackByPanelId(index: number, panelId: string): string {
    return panelId;
  }

  getPanelTitle(panelId: string): string {
    const titleMap: { [key: string]: string } = {
      'query-control': 'Query Control',
      'manufacturer-model-picker': 'Manufacturer-Model Picker',
      'statistics-1': 'Statistics',
      'dockview-statistics': 'Dockview Statistics',
      'chart-body-class': 'Vehicles by Body Class',
      'chart-year': 'Vehicles by Year',
      'results-table': 'Results Table'
    };
    return titleMap[panelId] || panelId;
  }

  getPanelType(panelId: string): string {
    const typeMap: { [key: string]: string } = {
      'query-control': 'query-control',
      'manufacturer-model-picker': 'picker',
      'statistics-1': 'statistics-2',
      'dockview-statistics': 'dockview-statistics',
      'chart-body-class': 'chart',
      'chart-year': 'chart',
      'results-table': 'basic-results'
    };
    return typeMap[panelId] || panelId;
  }

  getChartIdsForPanel(panelId: string): string[] {
    const chartIdMap: { [key: string]: string[] } = {
      'statistics-1': ['manufacturer', 'top-models'],
      'statistics-2': ['body-class', 'year']
    };
    return chartIdMap[panelId] || [];
  }

  getChartDataSource(chartId: string): ChartDataSource | undefined {
    return this.domainConfig.chartDataSources?.[chartId];
  }

  popOutPanel(panelId: string, panelType: string): void {
    this.popOutManager.openPopOut(panelId, panelType);
    this.cdr.markForCheck();
  }

  onChartPopOut(chartId: string): void {
    const panelId = `chart-${chartId}`;
    this.popOutManager.openPopOut(panelId, 'chart');
    this.cdr.markForCheck();
  }

  onDockviewChartPopOut(chartId: string): void {
    // Dockview charts use a different prefix to ensure unique application-wide IDs
    const panelId = `dockview-chart-${chartId}`;
    this.popOutManager.openPopOut(panelId, 'chart');
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

      case PopOutMessageType.PICKER_SELECTION_CHANGE:
        if (message.payload) {
          await this.onPickerSelectionChangeAndUpdateUrl(message.payload);
        }
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

      case PopOutMessageType.HIGHLIGHT_REMOVE:
        if (message.payload) {
          const currentHighlights = this.urlStateService.getParam('highlights');
          if (currentHighlights) {
            const highlightArray = currentHighlights.split(',').filter((h: string) => h !== message.payload);
            await this.urlStateService.setParams({
              highlights: highlightArray.length > 0 ? highlightArray.join(',') : null
            });
          }
        }
        break;

      case PopOutMessageType.CLEAR_HIGHLIGHTS:
        await this.urlStateService.setParams({ highlights: null });
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

  async onPickerSelectionChangeAndUpdateUrl(event: any): Promise<void> {
    const paramName = 'modelCombos';
    await this.urlStateService.setParams({
      [paramName]: event.urlValue || null,
      page: 1
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
