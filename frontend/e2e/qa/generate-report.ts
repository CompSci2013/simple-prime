import * as fs from 'fs';
import * as path from 'path';

/**
 * QA Test Report Generator
 *
 * Parses test-results directory and generates an HTML report containing:
 * - Test summary (passed/failed counts)
 * - Per-test details with screenshots, API calls, console errors
 * - Expected vs actual results
 *
 * Usage: npx ts-node e2e/qa/generate-report.ts
 *
 * The HTML can then be converted to PDF using browser print or wkhtmltopdf.
 */

interface ApiCall {
  timestamp: string;
  url: string;
  method: string;
  status?: number;
  requestHeaders?: Record<string, string>;
  responseHeaders?: Record<string, string>;
  responseData?: unknown;
  duration?: number;
}

interface ConsoleLog {
  timestamp: string;
  type: string;
  text: string;
}

interface TestResult {
  testId: string;
  testName: string;
  category: string;
  startTime: string;
  endTime?: string;
  passed: boolean;
  expected: string;
  actual: string;
  consoleLogs: ConsoleLog[];
  apiCalls: ApiCall[];
  screenshots: string[];
  errors: string[];
}

const TEST_RESULTS_DIR = 'test-results';
const REPORT_OUTPUT = 'test-results/qa-report.html';

function getTestDirectories(): string[] {
  if (!fs.existsSync(TEST_RESULTS_DIR)) {
    console.error(`Test results directory not found: ${TEST_RESULTS_DIR}`);
    process.exit(1);
  }

  return fs.readdirSync(TEST_RESULTS_DIR)
    .filter(name => name.startsWith('TEST-'))
    .sort();
}

function loadTestResult(testDir: string): TestResult | null {
  const resultPath = path.join(TEST_RESULTS_DIR, testDir, 'result.json');
  if (!fs.existsSync(resultPath)) {
    console.warn(`No result.json found for ${testDir}`);
    return null;
  }

  try {
    const content = fs.readFileSync(resultPath, 'utf-8');
    return JSON.parse(content) as TestResult;
  } catch (error) {
    console.error(`Failed to parse ${resultPath}:`, error);
    return null;
  }
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function generateHtmlReport(results: TestResult[]): string {
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;

  // Group by category
  const categories = new Map<string, TestResult[]>();
  for (const result of results) {
    const cat = result.category || 'Uncategorized';
    if (!categories.has(cat)) {
      categories.set(cat, []);
    }
    categories.get(cat)!.push(result);
  }

  let html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>QA Test Report</title>
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
      background: #f5f5f5;
    }
    h1 { color: #333; border-bottom: 3px solid #333; padding-bottom: 10px; }
    h2 { color: #444; border-bottom: 2px solid #ddd; padding-bottom: 5px; margin-top: 30px; }
    h3 { color: #555; margin-top: 20px; }
    .summary {
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      margin-bottom: 30px;
    }
    .summary-stats {
      display: flex;
      gap: 20px;
      font-size: 18px;
    }
    .stat { padding: 10px 20px; border-radius: 4px; }
    .stat.total { background: #e3f2fd; color: #1565c0; }
    .stat.passed { background: #e8f5e9; color: #2e7d32; }
    .stat.failed { background: #ffebee; color: #c62828; }
    .category {
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      margin-bottom: 30px;
      padding: 20px;
      page-break-inside: avoid;
    }
    .test {
      border: 1px solid #ddd;
      border-radius: 4px;
      margin: 15px 0;
      overflow: hidden;
    }
    .test-header {
      padding: 12px 15px;
      font-weight: bold;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .test-header.passed { background: #e8f5e9; border-left: 4px solid #4caf50; }
    .test-header.failed { background: #ffebee; border-left: 4px solid #f44336; }
    .test-status {
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: bold;
    }
    .test-status.passed { background: #4caf50; color: white; }
    .test-status.failed { background: #f44336; color: white; }
    .test-content { padding: 15px; background: #fafafa; }
    .section { margin: 15px 0; }
    .section-title { font-weight: bold; color: #333; margin-bottom: 5px; }
    .expected, .actual {
      background: white;
      padding: 10px;
      border-radius: 4px;
      border: 1px solid #ddd;
      white-space: pre-wrap;
      font-family: monospace;
      font-size: 12px;
    }
    .api-calls { max-height: 300px; overflow-y: auto; }
    .api-call {
      background: white;
      padding: 8px;
      margin: 5px 0;
      border-radius: 4px;
      border: 1px solid #ddd;
      font-family: monospace;
      font-size: 11px;
    }
    .api-call .method { font-weight: bold; color: #1976d2; }
    .api-call .status { color: #388e3c; }
    .api-call .status.error { color: #d32f2f; }
    .console-errors {
      background: #fff3e0;
      padding: 10px;
      border-radius: 4px;
      border: 1px solid #ffcc80;
    }
    .console-error {
      color: #e65100;
      font-family: monospace;
      font-size: 11px;
      margin: 5px 0;
    }
    .screenshots { display: flex; flex-wrap: wrap; gap: 10px; }
    .screenshot {
      flex: 1 1 300px;
      max-width: 100%;
    }
    .screenshot img {
      width: 100%;
      border: 1px solid #ddd;
      border-radius: 4px;
    }
    .screenshot-label {
      font-size: 11px;
      color: #666;
      margin-top: 5px;
    }
    .toc {
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      margin-bottom: 30px;
    }
    .toc ul { list-style: none; padding: 0; }
    .toc li { padding: 5px 0; }
    .toc a { color: #1976d2; text-decoration: none; }
    .toc a:hover { text-decoration: underline; }
    @media print {
      body { background: white; }
      .test { page-break-inside: avoid; }
      .screenshot img { max-height: 400px; object-fit: contain; }
    }
  </style>
</head>
<body>
  <h1>QA Test Report</h1>
  <p><strong>Generated:</strong> ${new Date().toISOString()}</p>

  <div class="summary">
    <h2 style="margin-top: 0;">Summary</h2>
    <div class="summary-stats">
      <div class="stat total"><strong>${results.length}</strong> Total Tests</div>
      <div class="stat passed"><strong>${passed}</strong> Passed</div>
      <div class="stat failed"><strong>${failed}</strong> Failed</div>
    </div>
  </div>

  <div class="toc">
    <h2 style="margin-top: 0;">Table of Contents</h2>
    <ul>
`;

  for (const [category, tests] of categories) {
    const catPassed = tests.filter(t => t.passed).length;
    const catFailed = tests.filter(t => !t.passed).length;
    const catId = category.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
    html += `      <li><a href="#${catId}">${escapeHtml(category)}</a> (${catPassed} passed, ${catFailed} failed)</li>\n`;
  }

  html += `    </ul>
  </div>
`;

  // Generate category sections
  for (const [category, tests] of categories) {
    const catId = category.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
    html += `
  <div class="category" id="${catId}">
    <h2>${escapeHtml(category)}</h2>
`;

    for (const test of tests) {
      const statusClass = test.passed ? 'passed' : 'failed';
      const statusText = test.passed ? 'PASSED' : 'FAILED';

      html += `
    <div class="test">
      <div class="test-header ${statusClass}">
        <span>${escapeHtml(test.testId)}: ${escapeHtml(test.testName)}</span>
        <span class="test-status ${statusClass}">${statusText}</span>
      </div>
      <div class="test-content">
        <div class="section">
          <div class="section-title">Expected Result:</div>
          <div class="expected">${escapeHtml(test.expected || 'N/A')}</div>
        </div>

        <div class="section">
          <div class="section-title">Actual Result:</div>
          <div class="actual">${escapeHtml(test.actual || 'N/A')}</div>
        </div>
`;

      // API Calls
      if (test.apiCalls && test.apiCalls.length > 0) {
        html += `
        <div class="section">
          <div class="section-title">API Calls (${test.apiCalls.length}):</div>
          <div class="api-calls">
`;
        for (const call of test.apiCalls) {
          const statusClass = call.status && call.status >= 400 ? 'error' : '';
          const urlShort = call.url.length > 100 ? call.url.substring(0, 100) + '...' : call.url;
          html += `            <div class="api-call">
              <span class="method">${escapeHtml(call.method)}</span>
              ${escapeHtml(urlShort)}
              <span class="status ${statusClass}">(${call.status || 'N/A'})</span>
              ${call.duration ? `<span style="color:#888"> ${call.duration}ms</span>` : ''}
            </div>\n`;
        }
        html += `          </div>
        </div>
`;
      }

      // Console Errors
      if (test.errors && test.errors.length > 0) {
        html += `
        <div class="section">
          <div class="section-title" style="color: #c62828;">Console Errors (${test.errors.length}):</div>
          <div class="console-errors">
`;
        for (const error of test.errors) {
          const errorShort = error.length > 200 ? error.substring(0, 200) + '...' : error;
          html += `            <div class="console-error">${escapeHtml(errorShort)}</div>\n`;
        }
        html += `          </div>
        </div>
`;
      }

      // Screenshots
      if (test.screenshots && test.screenshots.length > 0) {
        html += `
        <div class="section">
          <div class="section-title">Screenshots (${test.screenshots.length}):</div>
          <div class="screenshots">
`;
        for (const screenshot of test.screenshots) {
          const screenshotPath = `${test.testId}/screenshots/${screenshot}`;
          html += `            <div class="screenshot">
              <img src="${screenshotPath}" alt="${escapeHtml(screenshot)}" loading="lazy">
              <div class="screenshot-label">${escapeHtml(screenshot)}</div>
            </div>\n`;
        }
        html += `          </div>
        </div>
`;
      }

      html += `      </div>
    </div>
`;
    }

    html += `  </div>
`;
  }

  html += `</body>
</html>`;

  return html;
}

function generateReport(): void {
  const testDirs = getTestDirectories();
  const results: TestResult[] = [];

  for (const dir of testDirs) {
    const result = loadTestResult(dir);
    if (result) {
      results.push(result);
    }
  }

  if (results.length === 0) {
    console.error('No test results found!');
    console.log('Run the tests first: npx playwright test e2e/qa/');
    process.exit(1);
  }

  console.log(`Found ${results.length} test results`);

  const html = generateHtmlReport(results);
  fs.writeFileSync(REPORT_OUTPUT, html);

  console.log(`Report generated: ${REPORT_OUTPUT}`);
  console.log('');
  console.log('To convert to PDF:');
  console.log('  1. Open the HTML file in a browser');
  console.log('  2. Use Print -> Save as PDF');
  console.log('  OR');
  console.log('  wkhtmltopdf test-results/qa-report.html test-results/qa-report.pdf');
}

// Run the generator
generateReport();
