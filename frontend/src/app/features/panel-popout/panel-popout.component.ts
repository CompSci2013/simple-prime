import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Inject,
  Injector,
  OnDestroy,
  OnInit
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { createAutomobilePickerConfigs } from '../../../domain-config/automobile/configs/automobile.picker-configs';
import { DomainConfig } from '../../../framework/models';
import { PickerSelectionEvent } from '../../../framework/models/picker-config.interface';
import {
  PopOutMessage,
  PopOutMessageType
} from '../../../framework/models/popout.interface';
import { DOMAIN_CONFIG } from '../../../framework/services/domain-config-registry.service';
import { PickerConfigRegistry } from '../../../framework/services/picker-config-registry.service';
import { PopOutContextService } from '../../../framework/services/popout-context.service';
import { ResourceManagementService } from '../../../framework/services/resource-management.service';
import { IS_POPOUT_TOKEN } from '../../../framework/tokens/popout.token';
import { StatisticsPanel2Component } from '../../../framework/components/statistics-panel-2/statistics-panel-2.component';
import { BasePickerComponent } from '../../../framework/components/base-picker/base-picker.component';
import { BaseChartComponent } from '../../../framework/components/base-chart/base-chart.component';

@Component({
    selector: 'app-panel-popout',
    standalone: true,
    templateUrl: './panel-popout.component.html',
    styleUrls: ['./panel-popout.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [
        ResourceManagementService,
        { provide: IS_POPOUT_TOKEN, useValue: true }
    ],
    imports: [CommonModule, BasePickerComponent, StatisticsPanel2Component, BaseChartComponent]
})
export class PanelPopoutComponent implements OnInit, OnDestroy {
  gridId: string = '';
  panelId: string = '';
  panelType: string = '';
  domainConfig: DomainConfig<any, any, any>;

  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private popOutContext: PopOutContextService,
    private cdr: ChangeDetectorRef,
    private pickerRegistry: PickerConfigRegistry,
    private injector: Injector,
    @Inject(DOMAIN_CONFIG) domainConfig: DomainConfig<any, any, any>,
    public resourceService: ResourceManagementService<any, any, any>
  ) {
    this.domainConfig = domainConfig;
  }

  ngOnInit(): void {
    const pickerConfigs = createAutomobilePickerConfigs(this.injector);
    this.pickerRegistry.registerMultiple(pickerConfigs);

    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      this.gridId = params['gridId'];
      this.panelId = params['panelId'];
      this.panelType = params['type'];

      this.popOutContext.initializeAsPopOut(this.panelId);

      document.documentElement.classList.add('popout-html');
      document.body.classList.add('popout-body');

      this.cdr.markForCheck();
    });

    this.popOutContext
      .getMessages$()
      .pipe(takeUntil(this.destroy$))
      .subscribe(message => {
        this.handleMessage(message);
      });
  }

  private async handleMessage(message: PopOutMessage): Promise<void> {
    switch (message.type) {
      case PopOutMessageType.CLOSE_POPOUT:
        window.close();
        break;

      case PopOutMessageType.STATE_UPDATE:
        if (message.payload && message.payload.state) {
          this.resourceService.syncStateFromExternal(message.payload.state);
          this.cdr.detectChanges();
        }
        break;

      case PopOutMessageType.URL_PARAMS_SYNC:
        break;

      default:
        break;
    }
  }

  getChartDataSource(): any {
    if (this.panelId.startsWith('chart-')) {
      const chartId = this.panelId.replace('chart-', '');
      return this.domainConfig.chartDataSources?.[chartId];
    }
    return null;
  }

  getPickerConfigId(): string {
    return this.panelId;
  }

  getChartIdsForPanel(): string[] {
    const chartIdMap: { [key: string]: string[] } = {
      'statistics-1': ['manufacturer', 'top-models'],
      'statistics-2': ['body-class', 'year']
    };
    return chartIdMap[this.panelId] || [];
  }

  onUrlParamsChange(params: any): void {
    console.log('[PanelPopout] onUrlParamsChange received', params);
    this.popOutContext.sendMessage({
      type: PopOutMessageType.URL_PARAMS_CHANGED,
      payload: { params },
      timestamp: Date.now()
    });
    console.log('[PanelPopout] URL_PARAMS_CHANGED message sent');
  }

  onClearAllFilters(): void {
    this.popOutContext.sendMessage({
      type: PopOutMessageType.CLEAR_ALL_FILTERS,
      timestamp: Date.now()
    });
  }

  onPickerSelectionChange(event: PickerSelectionEvent<any>): void {
    if (event.urlValue !== undefined) {
      this.popOutContext.sendMessage({
        type: PopOutMessageType.PICKER_SELECTION_CHANGE,
        payload: event,
        timestamp: Date.now()
      });
    }
  }

  onChartClick(event: { value: string; isHighlightMode: boolean }): void {
    const chartId = this.panelId.startsWith('chart-')
      ? this.panelId.replace('chart-', '')
      : this.panelId;

    this.popOutContext.sendMessage({
      type: PopOutMessageType.CHART_CLICK,
      payload: {
        chartId,
        value: event.value,
        isHighlightMode: event.isHighlightMode
      },
      timestamp: Date.now()
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
