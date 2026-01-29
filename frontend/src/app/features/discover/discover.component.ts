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
import { CdkDragDrop, moveItemInArray, CdkDropList, CdkDrag, CdkDragHandle } from '@angular/cdk/drag-drop';
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
import { ChartDataSource } from '../../../framework/components/base-chart/base-chart.component';
import { TooltipModule } from 'primeng/tooltip';
import { ButtonModule } from 'primeng/button';


/**
 * Discover Component - Core discovery interface orchestrator
 *
 * **DOMAIN-AGNOSTIC**: Works with any domain via dependency injection.
 * Single component renders different UIs based on DOMAIN_CONFIG.
 *
 * **Primary Responsibilities**:
 * 1. Orchestrate framework panels (Picker, Statistics)
 * 2. Manage panel lifecycle (collapse, drag-drop reorder)
 * 3. Handle URL state synchronization with ResourceManagementService
 * 4. Route pop-out messages to URL updates (via PopOutManagerService)
 *
 * **Architecture**: Configuration-Driven + URL-First + Pop-Out Aware
 *
 * Pop-out window management is delegated to PopOutManagerService:
 * - Opening/closing windows
 * - BroadcastChannel setup
 * - State broadcasting
 * - Window close detection
 *
 * This component focuses on:
 * - Panel layout and ordering
 * - Message routing (pop-out message → URL update)
 * - Domain-specific logic (chart clicks, picker selections)
 */
@Component({
    selector: 'app-discover',
    standalone: true,
    templateUrl: './discover.component.html',
    styleUrls: ['./discover.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [ResourceManagementService],
    imports: [CdkDropList, CdkDrag, CdkDragHandle, ButtonModule, TooltipModule, BasePickerComponent, StatisticsPanel2Component]
})
export class DiscoverComponent<TFilters = any, TData = any, TStatistics = any>
  implements OnInit, OnDestroy {

  /** Domain configuration (injected, works with any domain) */
  domainConfig: DomainConfig<TFilters, TData, TStatistics>;

  /** Map of collapsed panel states (panel ID → collapsed boolean) */
  collapsedPanels = new Map<string, boolean>();

  /** Ordered list of panel IDs (defines display order) */
  panelOrder: string[] = [
    'manufacturer-model-picker',
    'statistics-panel-2'
  ];

  /** Destroy signal for subscription cleanup */
  private destroy$ = new Subject<void>();

  /** Grid identifier for routing */
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
    // Load panel preferences
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

    // Register domain-specific picker configurations
    const pickerConfigs = createAutomobilePickerConfigs(this.injector);
    this.pickerRegistry.registerMultiple(pickerConfigs);

    // Initialize pop-out manager
    this.popOutManager.initialize(this.gridId);

    // Handle messages from pop-outs
    this.popOutManager.messages$
      .pipe(takeUntil(this.destroy$))
      .subscribe(({ panelId, message }) => {
        this.handlePopOutMessage(panelId, message);
      });

    // Handle pop-out close events
    this.popOutManager.closed$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.cdr.markForCheck();
      });

    // Handle pop-up blocked events
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

    // Broadcast state changes to all pop-outs
    this.resourceService.state$
      .pipe(takeUntil(this.destroy$))
      .subscribe(state => {
        this.popOutManager.broadcastState(state);
      });
  }

  // ============================================
  // Panel State Methods
  // ============================================

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

  getPanelTitle(panelId: string): string {
    const titleMap: { [key: string]: string } = {
      'manufacturer-model-picker': 'Manufacturer-Model Picker',
      'statistics-panel-2': 'Statistics'
    };
    return titleMap[panelId] || panelId;
  }

  getPanelType(panelId: string): string {
    const typeMap: { [key: string]: string } = {
      'manufacturer-model-picker': 'picker',
      'statistics-panel-2': 'statistics-2'
    };
    return typeMap[panelId] || panelId;
  }

  // ============================================
  // Pop-Out Methods
  // ============================================

  popOutPanel(panelId: string, panelType: string): void {
    this.popOutManager.openPopOut(panelId, panelType);
    this.cdr.markForCheck();
  }

  onChartPopOut(chartId: string): void {
    const panelId = `chart-${chartId}`;
    this.popOutManager.openPopOut(panelId, 'chart');
    this.cdr.markForCheck();
  }

  // ============================================
  // Message Handling (Pop-Out → URL)
  // ============================================

  private async handlePopOutMessage(_panelId: string, message: any): Promise<void> {
    switch (message.type) {
      case PopOutMessageType.PANEL_READY:
        // Pop-out ready - send current state
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

  // ============================================
  // URL Update Methods
  // ============================================

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
    const paramName = 'modelCombos'; // TODO: Get from picker config
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
