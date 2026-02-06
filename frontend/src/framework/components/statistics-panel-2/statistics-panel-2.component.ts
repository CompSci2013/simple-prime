/**
 * Statistics Panel 2 Component - CDK Mixed Orientation Chart Grid
 *
 * Domain-agnostic container for rendering statistical charts in a
 * draggable grid layout using CDK mixed orientation.
 *
 * Framework Component
 */

import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Inject,
  Input,
  OnDestroy,
  OnInit,
  Optional,
  Output
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { IS_POPOUT_TOKEN } from '../../tokens/popout.token';
import { CommonModule } from '@angular/common';
import { DragDropModule, CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { environment } from '../../../environments/environment';
import { ChartConfig, DomainConfig } from '../../models/domain-config.interface';
import { PopOutMessageType } from '../../models/popout.interface';
import { PopOutContextService } from '../../services/popout-context.service';
import { ResourceManagementService } from '../../services/resource-management.service';
import { UrlStateService } from '../../services/url-state.service';
import { DomainConfigRegistry } from '../../services/domain-config-registry.service';
import { ChartDataSource, BaseChartComponent } from '../base-chart/base-chart.component';


/**
 * Statistics Panel 2 Component
 *
 * Renders statistical charts in a CDK mixed orientation drag-drop grid.
 * Charts can be reordered by dragging.
 *
 * @example
 * ```html
 * <app-statistics-panel-2
 *   [domainConfig]="domainConfig"
 *   (chartPopOut)="onChartPopOut($event)"
 *   (chartClick)="onChartClick($event)">
 * </app-statistics-panel-2>
 * ```
 */
@Component({
    selector: 'app-statistics-panel-2',
    standalone: true,
    templateUrl: './statistics-panel-2.component.html',
    styleUrls: ['./statistics-panel-2.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [CommonModule, DragDropModule, BaseChartComponent]
})
export class StatisticsPanel2Component implements OnInit, OnDestroy {

  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly resourceService: ResourceManagementService<any, any, any>,
    private readonly urlState: UrlStateService,
    private readonly popOutContext: PopOutContextService,
    private readonly cdr: ChangeDetectorRef,
    private readonly domainRegistry: DomainConfigRegistry,
    @Optional() private readonly route: ActivatedRoute,
    @Optional() @Inject(IS_POPOUT_TOKEN) private readonly isPopout: boolean
  ) {}

  // ============================================================================
  // Configuration
  // ============================================================================

  readonly environment = environment;

  @Input() domainConfig!: DomainConfig<any, any, any>;

  /**
   * Optional subset of chart IDs to display
   * If not provided, all charts from domainConfig.chartDataSources are shown
   */
  @Input() chartIds?: string[];

  /**
   * Function to check if a chart is popped out
   * Provided by parent component (DiscoverComponent)
   */
  @Input() isPanelPoppedOut: (panelId: string) => boolean = () => false;

  // ============================================================================
  // Outputs
  // ============================================================================

  @Output() chartPopOut = new EventEmitter<string>();
  @Output() chartClicked = new EventEmitter<{ event: { value: string; isHighlightMode: boolean }; dataSource: ChartDataSource }>();

  // ============================================================================
  // Observable Streams
  // ============================================================================

  get statistics$(): Observable<any | undefined> {
    return this.resourceService.statistics$;
  }

  get highlights$(): Observable<any> {
    return this.resourceService.highlights$;
  }

  /**
   * Check if this component is running inside a pop-out window
   * Used to disable individual chart pop-outs when already in pop-out
   */
  get isInPopOut(): boolean {
    return this.popOutContext.isInPopOut();
  }

  // ============================================================================
  // Component-Local State
  // ============================================================================

  /**
   * Ordered list of chart IDs for the grid
   */
  chartOrder: string[] = [];

  // ============================================================================
  // Lifecycle
  // ============================================================================

  ngOnInit(): void {
    // If domainConfig not provided via @Input (e.g., in popout), get from registry
    if (!this.domainConfig) {
      this.domainConfig = this.domainRegistry.getActive();
    }

    // Initialize chart order from chartIds input or domain config
    if (this.chartIds && this.chartIds.length > 0) {
      this.chartOrder = this.chartIds;
    } else if (this.isPopout && this.route) {
      // In popout: extract componentId from URL and map to chart IDs
      // URL structure: /popout/:gridId/:componentId/:type
      // componentId is like 'statistics-1' or 'statistics-2'
      const componentId = this.route.parent?.snapshot.paramMap.get('componentId') ?? null;
      this.chartOrder = this.getChartIdsForStatisticsPanel(componentId);
    } else if (this.domainConfig.chartDataSources) {
      this.chartOrder = Object.keys(this.domainConfig.chartDataSources);
    }
  }

  /**
   * Map statistics panel ID to chart IDs
   * This mirrors the mapping in discover components
   */
  private getChartIdsForStatisticsPanel(panelId: string | null): string[] {
    // Statistics panel mappings
    // TODO: Move this to domain config for full domain-agnostic support
    const chartIdMap: { [key: string]: string[] } = {
      'statistics-1': ['manufacturer', 'top-models'],
      'statistics-2': ['body-class', 'year']
    };

    if (panelId && chartIdMap[panelId]) {
      return chartIdMap[panelId];
    }

    // Fallback to all charts if panel ID not recognized
    if (this.domainConfig.chartDataSources) {
      return Object.keys(this.domainConfig.chartDataSources);
    }
    return [];
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ============================================================================
  // Event Handlers
  // ============================================================================

  /**
   * Handle chart drag-drop to reorder
   */
  onChartDrop(event: CdkDragDrop<string[]>): void {
    moveItemInArray(this.chartOrder, event.previousIndex, event.currentIndex);
    this.cdr.markForCheck();
  }

  /**
   * Handle chart pop-out request
   */
  onChartPopOut(chartId: string): void {
    this.chartPopOut.emit(chartId);
  }

  /**
   * Handle chart click
   */
  onChartClick(event: { value: string; isHighlightMode: boolean }, chartId: string): void {
    const dataSource = this.domainConfig.chartDataSources?.[chartId];
    if (!dataSource) return;

    // Delegate URL param generation to the data source
    const newParams = dataSource.toUrlParams(event.value, event.isHighlightMode);

    // Update URL (either directly or via pop-out message)
    if (this.popOutContext.isInPopOut()) {
      this.popOutContext.sendMessage({
        type: PopOutMessageType.URL_PARAMS_CHANGED,
        payload: { params: newParams },
        timestamp: Date.now()
      });
    } else {
      this.urlState.setParams(newParams);
    }
  }

  /**
   * Get data source for a chart ID
   */
  getDataSource(chartId: string): ChartDataSource | undefined {
    return this.domainConfig.chartDataSources?.[chartId];
  }
}
