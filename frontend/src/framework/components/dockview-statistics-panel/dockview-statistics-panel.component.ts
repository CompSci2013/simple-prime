/**
 * Dockview Statistics Panel Component
 *
 * Renders statistical charts inside a Dockview container with
 * draggable, resizable, and tabbable panels.
 *
 * Framework Component
 */

import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  NgZone,
  OnDestroy,
  OnInit,
  Output,
  ViewChild,
  ViewChildren,
  QueryList
} from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { createDockview, DockviewApi, IContentRenderer } from 'dockview-core';
import { DomainConfig } from '../../models/domain-config.interface';
import { PopOutMessageType } from '../../models/popout.interface';
import { PopOutContextService } from '../../services/popout-context.service';
import { ResourceManagementService } from '../../services/resource-management.service';
import { UrlStateService } from '../../services/url-state.service';
import { ChartDataSource, BaseChartComponent } from '../base-chart/base-chart.component';

/**
 * Dockview Statistics Panel Component
 *
 * Renders charts in a dockview container with tabbed/split panel support.
 *
 * @example
 * ```html
 * <app-dockview-statistics-panel
 *   [domainConfig]="domainConfig"
 *   [chartIds]="['manufacturer', 'top-models']">
 * </app-dockview-statistics-panel>
 * ```
 */
@Component({
  selector: 'app-dockview-statistics-panel',
  standalone: true,
  templateUrl: './dockview-statistics-panel.component.html',
  styleUrls: ['./dockview-statistics-panel.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, BaseChartComponent]
})
export class DockviewStatisticsPanelComponent implements OnInit, AfterViewInit, OnDestroy {

  private readonly destroy$ = new Subject<void>();
  private dockviewApi: DockviewApi | null = null;

  @ViewChild('dockviewContainer', { static: true })
  dockviewContainer!: ElementRef<HTMLDivElement>;

  @ViewChildren('chartElement')
  chartElements!: QueryList<ElementRef<HTMLDivElement>>;

  // ============================================================================
  // Inputs
  // ============================================================================

  @Input() domainConfig!: DomainConfig<any, any, any>;

  /**
   * Chart IDs to display in dockview panels
   */
  @Input() chartIds: string[] = ['manufacturer', 'top-models'];

  // ============================================================================
  // Outputs
  // ============================================================================

  @Output() chartClicked = new EventEmitter<{
    event: { value: string; isHighlightMode: boolean };
    dataSource: ChartDataSource;
  }>();

  // ============================================================================
  // State
  // ============================================================================

  /**
   * Current statistics from resource service
   */
  statistics: any = null;

  /**
   * Current highlights from resource service
   */
  highlights: any = {};

  /**
   * Map of chartId to title
   */
  chartTitles: Map<string, string> = new Map();

  constructor(
    private readonly resourceService: ResourceManagementService<any, any, any>,
    private readonly urlState: UrlStateService,
    private readonly popOutContext: PopOutContextService,
    private readonly cdr: ChangeDetectorRef,
    private readonly ngZone: NgZone
  ) {}

  // ============================================================================
  // Lifecycle
  // ============================================================================

  ngOnInit(): void {
    if (!this.domainConfig) {
      console.error('DockviewStatisticsPanelComponent: domainConfig is required');
      return;
    }

    // Initialize chart titles
    this.chartIds.forEach(chartId => {
      const dataSource = this.domainConfig.chartDataSources?.[chartId];
      if (dataSource) {
        this.chartTitles.set(chartId, dataSource.getTitle());
      }
    });

    // Subscribe to statistics updates
    this.resourceService.statistics$
      .pipe(takeUntil(this.destroy$))
      .subscribe(stats => {
        this.statistics = stats;
        this.cdr.markForCheck();
      });

    // Subscribe to highlights updates
    this.resourceService.highlights$
      .pipe(takeUntil(this.destroy$))
      .subscribe(highlights => {
        this.highlights = highlights;
        this.cdr.markForCheck();
      });
  }

  ngAfterViewInit(): void {
    // Give Angular time to render chart components
    setTimeout(() => {
      this.initializeDockview();
    }, 0);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();

    // Dispose dockview
    if (this.dockviewApi) {
      this.dockviewApi.dispose();
    }
  }

  // ============================================================================
  // Dockview Setup
  // ============================================================================

  private initializeDockview(): void {
    const container = this.dockviewContainer.nativeElement;

    // Map to store chart elements by their ID
    const chartElementsMap = new Map<string, HTMLElement>();

    // Find all chart wrapper elements
    this.chartElements.forEach(el => {
      const chartId = el.nativeElement.getAttribute('data-chart-id');
      if (chartId) {
        chartElementsMap.set(chartId, el.nativeElement);
      }
    });

    // Create dockview instance
    // Note: disableFloatingGroups prevents conflicts with our custom PopOutManagerService
    // See popout-considerations.md for details
    this.dockviewApi = createDockview(container, {
      disableFloatingGroups: true,
      createComponent: (options): IContentRenderer => {
        const chartId = options.id;
        const chartElement = chartElementsMap.get(chartId);

        // Create a wrapper element for the panel content
        const wrapper = document.createElement('div');
        wrapper.className = 'dockview-chart-content';
        wrapper.style.width = '100%';
        wrapper.style.height = '100%';
        wrapper.style.overflow = 'hidden';

        // Move the chart element into the wrapper
        if (chartElement) {
          chartElement.style.display = 'block';
          wrapper.appendChild(chartElement);
        }

        return {
          element: wrapper,
          init: () => {},
          dispose: () => {
            // Move chart element back to hidden container on dispose
            if (chartElement) {
              const hiddenContainer = document.querySelector('.charts-hidden-container');
              if (hiddenContainer) {
                hiddenContainer.appendChild(chartElement);
                chartElement.style.display = 'none';
              }
            }
          }
        };
      }
    });

    // Add panels for each chart
    this.chartIds.forEach((chartId, index) => {
      const title = this.chartTitles.get(chartId) || chartId;

      if (index === 0) {
        // First panel - add normally
        this.dockviewApi!.addPanel({
          id: chartId,
          title: title,
          component: 'chart'
        });
      } else {
        // Subsequent panels - add as tabs to the same group
        this.dockviewApi!.addPanel({
          id: chartId,
          title: title,
          component: 'chart',
          position: {
            referencePanel: this.chartIds[0]
          }
        });
      }
    });

    this.cdr.markForCheck();
  }

  // ============================================================================
  // Event Handlers
  // ============================================================================

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
