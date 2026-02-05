/**
 * Crop Chart Data Source
 *
 * Transforms agriculture statistics into Plotly.js vertical stacked bar chart
 * showing record count by crop type with highlighted vs other.
 *
 * Domain: Agriculture
 */

import { ChartDataSource, ChartData } from '../../../framework/components/base-chart/base-chart.component';
import { AgricultureStatistics } from '../models/agriculture.statistics';

/**
 * Crop distribution chart data source
 *
 * Creates a vertical stacked bar chart of crops by record count.
 */
export class CropChartDataSource extends ChartDataSource<AgricultureStatistics> {
  /**
   * Transform statistics into Plotly chart data
   */
  transform(
    statistics: AgricultureStatistics | null,
    highlights: any,
    _selectedValue: string | null,
    _containerWidth: number
  ): ChartData | null {
    if (!statistics || !statistics.cropBreakdown) {
      return null;
    }

    const entries = Object.entries(statistics.cropBreakdown);

    // Check if data has server-side segmented format ({total, highlighted})
    const isSegmented = entries.length > 0 &&
      typeof entries[0][1] === 'object' &&
      'total' in entries[0][1];

    let traces: Plotly.Data[] = [];

    if (isSegmented) {
      // Server-side segmented statistics: use backend data directly
      const sorted = entries
        .sort((a, b) => {
          const aTotal = (a[1] as any).total || 0;
          const bTotal = (b[1] as any).total || 0;
          return bTotal - aTotal;
        })
        .slice(0, 20);

      const crops = sorted.map(([name]) => name);
      const highlightedCounts = sorted.map(([, stats]: [string, any]) => stats.highlighted || 0);
      const otherCounts = sorted.map(([, stats]: [string, any]) =>
        (stats.total || 0) - (stats.highlighted || 0)
      );

      traces = [
        {
          type: 'bar',
          name: 'Highlighted',
          x: crops,
          y: highlightedCounts,
          marker: { color: '#22C55E' }, // Green
          hovertemplate: '<b>%{x}</b><br>Highlighted: %{y}<extra></extra>'
        },
        {
          type: 'bar',
          name: 'Other',
          x: crops,
          y: otherCounts,
          marker: { color: '#9CA3AF' }, // Gray
          hovertemplate: '<b>%{x}</b><br>Other: %{y}<extra></extra>'
        }
      ];
    } else {
      // No highlights: simple green bars using simple number format
      const sorted = entries
        .map(([name, count]) => [name, typeof count === 'number' ? count : 0] as [string, number])
        .sort((a, b) => b[1] - a[1])
        .slice(0, 20);

      const crops = sorted.map(([name]) => name);
      const counts = sorted.map(([, count]) => count);

      traces = [{
        type: 'bar',
        x: crops,
        y: counts,
        marker: { color: '#22C55E' }, // Green for agriculture
        hovertemplate: '<b>%{x}</b><br>Count: %{y}<br><extra></extra>'
      }];
    }

    // Create layout
    const layout: Partial<Plotly.Layout> = {
      barmode: isSegmented ? 'stack' : undefined,
      xaxis: {
        tickangle: -45,
        automargin: true,
        color: '#FFFFFF',
        gridcolor: '#333333'
      },
      yaxis: {
        title: { text: '' },
        gridcolor: '#333333',
        automargin: true,
        color: '#FFFFFF'
      },
      margin: {
        l: 60,
        r: 40,
        t: 40,
        b: 120
      },
      plot_bgcolor: '#000000',
      paper_bgcolor: '#1a1a1a',
      font: { color: '#FFFFFF' },
      showlegend: isSegmented
    };

    return {
      traces: traces,
      layout: layout
    };
  }

  /**
   * Get chart title
   */
  getTitle(): string {
    return 'Records by Crop';
  }

  /**
   * Handle chart click event
   */
  handleClick(event: any): string | null {
    if (event.points && event.points.length > 0) {
      const crops: string[] = event.points.map((point: any) => point.x as string);
      const uniqueCrops: string[] = [...new Set(crops)];
      return uniqueCrops.join(',') || null;
    }
    return null;
  }

  /**
   * Convert clicked value to URL parameters
   */
  toUrlParams(value: string, isHighlightMode: boolean): Record<string, any> {
    const paramName = isHighlightMode ? 'h_crop' : 'crop';
    return { [paramName]: value };
  }
}
