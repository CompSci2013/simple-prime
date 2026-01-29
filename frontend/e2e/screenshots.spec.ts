import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Screenshot generation for Generic Discovery Framework documentation
 * Captures all major views and features of the application
 */

const BASE_URL = 'http://localhost:4205';

// Output directories
const SCREENSHOT_DIRS = [
  '/home/odin/projects/discovery/screenshots',
  '/home/odin/projects/generic-prime/docs/screenshots'
];

// Ensure directories exist
function ensureDirectories() {
  for (const dir of SCREENSHOT_DIRS) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    // Create subdirectories
    const subdirs = ['home', 'automobile', 'discover', 'physics', 'ai-chat', 'components'];
    for (const subdir of subdirs) {
      const fullPath = path.join(dir, subdir);
      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
      }
    }
  }
}

// Save screenshot to both directories
async function saveScreenshot(page: any, category: string, name: string) {
  const filename = `${name}.png`;
  for (const dir of SCREENSHOT_DIRS) {
    const fullPath = path.join(dir, category, filename);
    await page.screenshot({ path: fullPath, fullPage: false });
    console.log(`Saved: ${fullPath}`);
  }
}

test.describe('Application Screenshots', () => {
  test.beforeAll(() => {
    ensureDirectories();
  });

  test.describe('Home Page', () => {
    test('capture home page', async ({ page }) => {
      await page.goto(BASE_URL);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      await saveScreenshot(page, 'home', '01-home-landing');
    });

    test('capture home page with menu open', async ({ page }) => {
      await page.goto(BASE_URL);
      await page.waitForLoadState('networkidle');

      // Open domain menu
      const menuButton = page.locator('.domain-menu-trigger, .p-tieredmenu-root-list').first();
      if (await menuButton.isVisible()) {
        await menuButton.click();
        await page.waitForTimeout(500);
      }
      await saveScreenshot(page, 'home', '02-home-menu-open');
    });
  });

  test.describe('Automobile Domain', () => {
    test('capture automobile landing page', async ({ page }) => {
      await page.goto(`${BASE_URL}/automobiles`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      await saveScreenshot(page, 'automobile', '01-automobile-landing');
    });

    test('capture discover page - initial load', async ({ page }) => {
      await page.goto(`${BASE_URL}/automobiles/discover`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000); // Wait for data to load
      await saveScreenshot(page, 'discover', '01-discover-initial');
    });

    test('capture discover page - with filters applied', async ({ page }) => {
      await page.goto(`${BASE_URL}/automobiles/discover?manufacturer=Toyota&yearMin=2020&yearMax=2024`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      await saveScreenshot(page, 'discover', '02-discover-filtered');
    });

    test('capture discover page - multiple filters', async ({ page }) => {
      await page.goto(`${BASE_URL}/automobiles/discover?manufacturer=Ford&bodyClass=Pickup,SUV&yearMin=2018`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      await saveScreenshot(page, 'discover', '03-discover-multi-filter');
    });

    test('capture discover page - with highlights', async ({ page }) => {
      await page.goto(`${BASE_URL}/automobiles/discover?h_manufacturer=Toyota&h_yearMin=2020&h_yearMax=2022`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      await saveScreenshot(page, 'discover', '04-discover-highlights');
    });

    test('capture results table focused', async ({ page }) => {
      await page.goto(`${BASE_URL}/automobiles/discover`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      // Scroll to results table
      const table = page.locator('p-table, .results-table').first();
      if (await table.isVisible()) {
        await table.scrollIntoViewIfNeeded();
        await page.waitForTimeout(500);
      }
      await saveScreenshot(page, 'components', '01-results-table');
    });

    test('capture charts panel', async ({ page }) => {
      await page.goto(`${BASE_URL}/automobiles/discover`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      // Find and scroll to statistics panel
      const statsPanel = page.locator('app-statistics-panel-2, .statistics-panel').first();
      if (await statsPanel.isVisible()) {
        await statsPanel.scrollIntoViewIfNeeded();
        await page.waitForTimeout(500);
      }
      await saveScreenshot(page, 'components', '02-charts-panel');
    });
  });

  test.describe('Query Control Component', () => {
    test('capture query control panel', async ({ page }) => {
      await page.goto(`${BASE_URL}/automobiles/discover`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1500);

      const queryControl = page.locator('app-query-control, .query-control-panel').first();
      if (await queryControl.isVisible()) {
        await queryControl.scrollIntoViewIfNeeded();
        await page.waitForTimeout(300);
      }
      await saveScreenshot(page, 'components', '03-query-control');
    });

    test('capture query control with filter dropdown', async ({ page }) => {
      await page.goto(`${BASE_URL}/automobiles/discover`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1500);

      // Try to open the field selector dropdown
      const dropdown = page.locator('app-query-control p-dropdown, .query-control-panel p-dropdown').first();
      if (await dropdown.isVisible()) {
        await dropdown.click();
        await page.waitForTimeout(500);
      }
      await saveScreenshot(page, 'components', '04-query-control-dropdown');
    });
  });

  test.describe('Picker Component', () => {
    test('capture picker component', async ({ page }) => {
      await page.goto(`${BASE_URL}/automobiles/discover`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1500);

      const picker = page.locator('app-base-picker, .picker-panel').first();
      if (await picker.isVisible()) {
        await picker.scrollIntoViewIfNeeded();
        await page.waitForTimeout(300);
      }
      await saveScreenshot(page, 'components', '05-picker');
    });
  });

  test.describe('AI Chat', () => {
    test('capture AI chat closed state', async ({ page }) => {
      await page.goto(`${BASE_URL}/automobiles/discover`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      await saveScreenshot(page, 'ai-chat', '01-ai-chat-toggle');
    });

    test('capture AI chat open', async ({ page }) => {
      await page.goto(`${BASE_URL}/automobiles/discover`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      // Click AI chat toggle button
      const aiToggle = page.locator('button:has-text("AI"), .ai-toggle-btn, [ptooltip*="AI"]').first();
      if (await aiToggle.isVisible()) {
        await aiToggle.click();
        await page.waitForTimeout(1000);
      }
      await saveScreenshot(page, 'ai-chat', '02-ai-chat-open');
    });

    test('capture AI chat with welcome message', async ({ page }) => {
      await page.goto(`${BASE_URL}/automobiles/discover`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      // Open AI chat
      const aiToggle = page.locator('button:has-text("AI"), .ai-toggle-btn, [ptooltip*="AI"]').first();
      if (await aiToggle.isVisible()) {
        await aiToggle.click();
        await page.waitForTimeout(1500);
      }

      // Focus on the chat panel
      const chatPanel = page.locator('app-ai-chat, .ai-chat-container').first();
      if (await chatPanel.isVisible()) {
        await chatPanel.scrollIntoViewIfNeeded();
      }
      await saveScreenshot(page, 'ai-chat', '03-ai-chat-welcome');
    });
  });

  test.describe('Physics Domain', () => {
    test('capture physics landing page', async ({ page }) => {
      await page.goto(`${BASE_URL}/physics`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      await saveScreenshot(page, 'physics', '01-physics-landing');
    });

    test('capture physics concept graph', async ({ page }) => {
      await page.goto(`${BASE_URL}/physics/concept-graph`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000); // Wait for graph to render
      await saveScreenshot(page, 'physics', '02-physics-concept-graph');
    });

    test('capture classical mechanics graph', async ({ page }) => {
      await page.goto(`${BASE_URL}/physics/classical-mechanics-graph`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      await saveScreenshot(page, 'physics', '03-classical-mechanics-graph');
    });
  });

  test.describe('Other Domains', () => {
    test('capture chemistry landing', async ({ page }) => {
      await page.goto(`${BASE_URL}/chemistry`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      await saveScreenshot(page, 'home', '03-chemistry-landing');
    });

    test('capture agriculture landing', async ({ page }) => {
      await page.goto(`${BASE_URL}/agriculture`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      await saveScreenshot(page, 'home', '04-agriculture-landing');
    });

    test('capture math landing', async ({ page }) => {
      await page.goto(`${BASE_URL}/math`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      await saveScreenshot(page, 'home', '05-math-landing');
    });
  });

  test.describe('Responsive Views', () => {
    test('capture discover page - wide viewport', async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.goto(`${BASE_URL}/automobiles/discover`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      await saveScreenshot(page, 'discover', '05-discover-wide');
    });

    test('capture discover page - narrow viewport', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.goto(`${BASE_URL}/automobiles/discover`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      await saveScreenshot(page, 'discover', '06-discover-narrow');
    });
  });
});
