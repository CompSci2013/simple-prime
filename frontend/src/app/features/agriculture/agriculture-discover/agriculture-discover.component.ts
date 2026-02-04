import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AgricultureDataService, CropRecord, AggregationBucket } from '../services/agriculture-data.service';

/**
 * Agriculture Discover Component (NgModule Pattern)
 *
 * Feature component for exploring agricultural data including crops, yields,
 * and regional statistics. Uses mock Elasticsearch data loaded from JSON files.
 *
 * Features:
 * - Data table with crop records
 * - Chart visualization of crop distribution by region
 * - Filter dropdowns for crop type and region
 *
 * Architecture Note:
 * This component uses the traditional NgModule pattern (Angular 13 style) and is
 * declared in AgricultureModule. Dependencies like PrimeNG modules are imported
 * at the module level, not the component level.
 *
 * @class AgricultureDiscoverComponent
 * @since 1.0 (Original Angular 13 implementation)
 */
@Component({
  selector: 'app-agriculture-discover',
  templateUrl: './agriculture-discover.component.html',
  styleUrls: ['./agriculture-discover.component.scss']
})
export class AgricultureDiscoverComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Data
  cropData: CropRecord[] = [];
  filteredData: CropRecord[] = [];
  loading = true;

  // Filters
  crops: string[] = [];
  regions: string[] = [];
  selectedCrop: string | null = null;
  selectedRegion: string | null = null;

  // Chart data
  chartData: any;
  chartOptions: any;

  // Statistics
  totalRecords = 0;
  totalAcres = 0;
  avgYield = 0;

  constructor(private dataService: AgricultureDataService) {
    this.initializeChartOptions();
  }

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    this.loading = true;

    this.dataService.getCropData()
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => {
        this.cropData = data;
        this.filteredData = [...data];
        this.extractFilterOptions();
        this.updateStatistics();
        this.updateChart();
        this.loading = false;
      });
  }

  private extractFilterOptions(): void {
    const cropSet = new Set(this.cropData.map(d => d.crop));
    const regionSet = new Set(this.cropData.map(d => d.region));
    this.crops = Array.from(cropSet).sort();
    this.regions = Array.from(regionSet).sort();
  }

  onFilterChange(): void {
    this.filteredData = this.cropData.filter(record => {
      const cropMatch = !this.selectedCrop || record.crop === this.selectedCrop;
      const regionMatch = !this.selectedRegion || record.region === this.selectedRegion;
      return cropMatch && regionMatch;
    });
    this.updateStatistics();
    this.updateChart();
  }

  clearFilters(): void {
    this.selectedCrop = null;
    this.selectedRegion = null;
    this.filteredData = [...this.cropData];
    this.updateStatistics();
    this.updateChart();
  }

  private updateStatistics(): void {
    this.totalRecords = this.filteredData.length;
    this.totalAcres = this.filteredData.reduce((sum, r) => sum + r.acres, 0);
    this.avgYield = this.filteredData.length > 0
      ? this.filteredData.reduce((sum, r) => sum + r.yield_bushels, 0) / this.filteredData.length
      : 0;
  }

  private initializeChartOptions(): void {
    this.chartOptions = {
      plugins: {
        legend: {
          labels: {
            color: '#ffffff'
          }
        }
      },
      scales: {
        x: {
          ticks: { color: '#b0b0b0' },
          grid: { color: 'rgba(255,255,255,0.1)' }
        },
        y: {
          ticks: { color: '#b0b0b0' },
          grid: { color: 'rgba(255,255,255,0.1)' }
        }
      }
    };
  }

  private updateChart(): void {
    // Aggregate by region
    const regionCounts = new Map<string, number>();
    this.filteredData.forEach(record => {
      const count = regionCounts.get(record.region) || 0;
      regionCounts.set(record.region, count + 1);
    });

    const labels = Array.from(regionCounts.keys());
    const data = Array.from(regionCounts.values());

    this.chartData = {
      labels: labels,
      datasets: [
        {
          label: 'Records by Region',
          data: data,
          backgroundColor: [
            'rgba(76, 175, 80, 0.7)',
            'rgba(139, 195, 74, 0.7)',
            'rgba(205, 220, 57, 0.7)',
            'rgba(255, 193, 7, 0.7)'
          ],
          borderColor: [
            'rgba(76, 175, 80, 1)',
            'rgba(139, 195, 74, 1)',
            'rgba(205, 220, 57, 1)',
            'rgba(255, 193, 7, 1)'
          ],
          borderWidth: 1
        }
      ]
    };
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
