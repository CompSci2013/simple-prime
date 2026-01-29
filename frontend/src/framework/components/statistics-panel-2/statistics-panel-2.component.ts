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
  inject,
  Input,
  OnInit,
  Output,
  Signal
} from '@angular/core';
import { CdkDrag, CdkDragDrop, CdkDragHandle, CdkDropList, moveItemInArray } from '@angular/cdk/drag-drop';
import { environment } from '../../../environments/environment';
import { ChartConfig, DomainConfig } from '../../models/domain-config.interface';
import { PopOutMessageType } from '../../models/popout.interface';
import { PopOutContextService } from '../../services/popout-context.service';
import { ResourceManagementService } from '../../services/resource-management.service';
import { UrlStateService } from '../../services/url-state.service';
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
    imports: [BaseChartComponent, CdkDropList, CdkDrag, CdkDragHandle]
})
export class StatisticsPanel2Component implements OnInit {

  // ============================================================================
  // Dependency Injection
  // ============================================================================
  private readonly resourceService = inject<ResourceManagementService<any, any, any>>(ResourceManagementService);
  private readonly urlState = inject(UrlStateService);
  private readonly popOutContext = inject(PopOutContextService);
  private readonly cdr = inject(ChangeDetectorRef);

  // ============================================================================
  // Configuration
  // ============================================================================

  readonly environment = environment;

  @Input() domainConfig!: DomainConfig<any, any, any>;

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
  // Signal-Based State
  // ============================================================================

  get statistics(): Signal<any | undefined> {
    return this.resourceService.statistics;
  }

  get highlights(): Signal<any> {
    return this.resourceService.highlights;
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
    if (!this.domainConfig) {
      console.error('StatisticsPanel2Component: domainConfig is required');
      return;
    }

    // Initialize chart order from domain config
    if (this.domainConfig.chartDataSources) {
      this.chartOrder = Object.keys(this.domainConfig.chartDataSources);
    }
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
