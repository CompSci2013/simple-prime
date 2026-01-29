import { Component, OnInit } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

/**
 * Report Component
 *
 * Displays Playwright test report in an iframe with cache busting
 *
 * The iframe loads the report with a timestamp query parameter that forces
 * the browser to fetch fresh content instead of showing cached results.
 *
 * To view the live report after running tests:
 * 1. Run: npm run test:e2e (in the e2e container)
 * 2. Navigate to: http://localhost:4205/report
 * 3. The report will automatically load the latest test results
 */
@Component({
    selector: 'app-report',
    template: `
    <div class="report-container">
      <iframe
        [src]="reportUrl"
        class="report-iframe"
        title="Playwright Test Report">
      </iframe>
    </div>
  `,
    styles: [`
    .report-container {
      display: flex;
      width: 100%;
      height: 100vh;
      margin: 0;
      padding: 0;
      background: #f5f5f5;
    }

    .report-iframe {
      width: 100%;
      height: 100%;
      border: none;
    }
  `],
    standalone: true
})
export class ReportComponent implements OnInit {
  /**
   * Sanitized URL for the Playwright test report iframe
   *
   * Contains a cache-busting query parameter (timestamp) to ensure
   * the browser always fetches fresh test results instead of serving cached content.
   * The URL points to `/report/index.html` with a timestamp query parameter.
   *
   * @type {SafeResourceUrl}
   */
  reportUrl: SafeResourceUrl;

  constructor(private sanitizer: DomSanitizer) {
    // Initialize with cache-busting timestamp
    this.reportUrl = this.getReportUrl();
  }

  /**
   * Angular lifecycle hook - Component initialization
   *
   * Called once when the component is created. Logs a message indicating
   * that the Playwright test report page has loaded with live updates.
   *
   * @lifecycle
   * Executes: After constructor, before component view is rendered
   */
  ngOnInit() {
    console.log('Playwright test report page loaded with live updates.');
  }

  /**
   * Generate report URL with cache-busting query parameter
   *
   * Creates a sanitized URL for the Playwright test report by appending
   * a timestamp query parameter. This forces the browser to always fetch
   * fresh content instead of showing cached results from previous test runs.
   *
   * @private
   * @returns {SafeResourceUrl} Sanitized URL safe for use in iframe src binding
   *
   * @remarks
   * **Cache Busting**:
   * The timestamp query parameter (`?t=<timestamp>`) ensures that every time
   * the component loads, the browser will fetch a fresh copy of the report HTML.
   * Without this, cached versions might be displayed.
   *
   * **Security**:
   * The URL is sanitized using Angular's DomSanitizer.bypassSecurityTrustResourceUrl()
   * because we're using it in an iframe src binding and need to bypass XSS protection.
   *
   * **Usage**:
   * Called in constructor to initialize the reportUrl property.
   */
  private getReportUrl(): SafeResourceUrl {
    const timestamp = Date.now();
    const url = `/report/index.html?t=${timestamp}`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }
}
