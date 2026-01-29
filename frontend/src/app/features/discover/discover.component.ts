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
import { createAutomobilePickerConfigs } from '../../../domain-config/automobile/configs/automobile.picker-configs';
import { DomainConfig } from '../../../framework/models';
import { PopOutMessageType } from '../../../framework/models/popout.interface';
import { DOMAIN_CONFIG } from '../../../framework/services/domain-config-registry.service';
import { PickerConfigRegistry } from '../../../framework/services/picker-config-registry.service';
import { PopOutManagerService } from '../../../framework/services/popout-manager.service';
import { ResourceManagementService } from '../../../framework/services/resource-management.service';
import { UrlStateService } from '../../../framework/services/url-state.service';
import { UserPreferencesService } from '../../../framework/services/user-preferences.service';
import { StatisticsPanel2Component } from '../../../framework/components/statistics-panel-2/statistics-panel-2.component';
import { BasePickerComponent } from '../../../framework/components/base-picker/base-picker.component';
import { BaseChartComponent, ChartDataSource } from '../../../framework/components/base-chart/base-chart.component';
import { TooltipModule } from 'primeng/tooltip';
import { ButtonModule } from 'primeng/button';

@Component({
    selector: 'app-discover',
    standalone: true,
    templateUrl: './discover.component.html',
    styleUrls: ['./discover.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [ResourceManagementService],
    imports: [CommonModule, DragDropModule, ButtonModule, TooltipModule, BasePickerComponent, StatisticsPanel2Component, BaseChartComponent]
})
export class DiscoverComponent<TFilters = any, TData = any, TStatistics = any>
  implements OnInit, OnDestroy {

  domainConfig: DomainConfig<TFilters, TData, TStatistics>;
  collapsedPanels = new Map<string, boolean>();
  panelOrder: string[] = ['manufacturer-model-picker', 'chart-manufacturer', 'chart-top-models'];

  private destroy$ = new Subject<void>();
  private readonly gridId = 'discover';

  constructor(
    @Inject(DOMAIN_CONFIG) domainConfig: DomainConfig<any, any, any>,
    public resourceService: ResourceManagementService<TFilters, TData, TStatistics>,
    private pickerRegistry: PickerConfigRegistry,
    private injector: Injector,
    private popOutManager: PopOutManagerService,
    private cdr: ChangeDetectorRef,
    private messageService: MessageService,
    private urlStateService: UrlStateService,
    private userPreferences: UserPreferencesService
  ) {
    this.domainConfig = domainConfig as DomainConfig<TFilters, TData, TStatistics>;
  }

  ngOnInit(): void {
    this.userPreferences.getPanelOrder()
      .pipe(takeUntil(this.destroy$))
      .subscribe(order => {
        this.panelOrder = order;
        this.cdr.markForCheck();
      });

    this.userPreferences.getCollapsedPanels()
      .pipe(takeUntil(this.destroy$))
      .subscribe(collapsedPanels => {
        this.collapsedPanels.clear();
        collapsedPanels.forEach(panelId => {
          this.collapsedPanels.set(panelId, true);
        });
        this.cdr.markForCheck();
      });

    const pickerConfigs = createAutomobilePickerConfigs(this.injector);
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
        this.popOutManager.broadcastState(state);
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
      'manufacturer-model-picker': 'Manufacturer-Model Picker',
      'statistics-panel-2': 'Statistics',
      'chart-manufacturer': 'Vehicles by Manufacturer',
      'chart-top-models': 'Top Models by VIN Count'
    };
    return titleMap[panelId] || panelId;
  }

  getPanelType(panelId: string): string {
    const typeMap: { [key: string]: string } = {
      'manufacturer-model-picker': 'picker',
      'statistics-panel-2': 'statistics-2'
    };
    // Handle chart panels dynamically
    if (panelId.startsWith('chart-')) {
      return 'chart';
    }
    return typeMap[panelId] || panelId;
  }

  getChartDataSource(panelId: string): ChartDataSource | undefined {
    if (panelId.startsWith('chart-')) {
      const chartId = panelId.replace('chart-', '');
      return this.domainConfig.chartDataSources?.[chartId];
    }
    return undefined;
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
