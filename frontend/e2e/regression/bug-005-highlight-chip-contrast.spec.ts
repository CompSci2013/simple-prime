/**
 * Regression Test: BUG-005
 *
 * Issue: Highlight chip text has poor contrast
 * - Dark text on light yellow background is nearly unreadable
 * - WCAG 2.1 requires 4.5:1 contrast ratio for normal text
 *
 * Expected: Highlight chip text should have sufficient contrast ratio
 * (at least 4.5:1 for AA compliance, 7:1 for AAA).
 */
import { test, expect } from '@playwright/test';

test.describe('BUG-005: Highlight Chip Text Contrast', () => {
  test.setTimeout(30000);

  test.beforeEach(async ({ page }) => {
    // Navigate with a highlight parameter to show highlight chips
    await page.goto('http://localhost:4205/automobiles/discover?h_manufacturer=Ford');
    await page.waitForLoadState('networkidle');
    await page.locator('.query-control-panel').waitFor({ state: 'visible', timeout: 10000 });
  });

  /**
   * Helper function to calculate relative luminance
   * per WCAG 2.1 formula
   */
  function getRelativeLuminance(r: number, g: number, b: number): number {
    const rsRGB = r / 255;
    const gsRGB = g / 255;
    const bsRGB = b / 255;

    const rLin = rsRGB <= 0.03928 ? rsRGB / 12.92 : Math.pow((rsRGB + 0.055) / 1.055, 2.4);
    const gLin = gsRGB <= 0.03928 ? gsRGB / 12.92 : Math.pow((gsRGB + 0.055) / 1.055, 2.4);
    const bLin = bsRGB <= 0.03928 ? bsRGB / 12.92 : Math.pow((bsRGB + 0.055) / 1.055, 2.4);

    return 0.2126 * rLin + 0.7152 * gLin + 0.0722 * bLin;
  }

  /**
   * Calculate contrast ratio between two colors
   */
  function getContrastRatio(l1: number, l2: number): number {
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    return (lighter + 0.05) / (darker + 0.05);
  }

  /**
   * Parse CSS color to RGB values
   */
  function parseColor(color: string): { r: number; g: number; b: number } | null {
    // Handle rgb(r, g, b) format
    const rgbMatch = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (rgbMatch) {
      return {
        r: parseInt(rgbMatch[1]),
        g: parseInt(rgbMatch[2]),
        b: parseInt(rgbMatch[3]),
      };
    }

    // Handle rgba(r, g, b, a) format
    const rgbaMatch = color.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/);
    if (rgbaMatch) {
      return {
        r: parseInt(rgbaMatch[1]),
        g: parseInt(rgbaMatch[2]),
        b: parseInt(rgbaMatch[3]),
      };
    }

    return null;
  }

  test('Highlight chip should have WCAG AA compliant contrast ratio (4.5:1)', async ({ page }) => {
    // Wait for highlight chip to be visible
    const highlightChip = page.locator('.highlight-chip').first();
    await expect(highlightChip).toBeVisible();

    // Get computed styles for the chip
    const styles = await highlightChip.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return {
        color: computed.color,
        backgroundColor: computed.backgroundColor,
      };
    });

    console.log(`Highlight chip styles - color: ${styles.color}, background: ${styles.backgroundColor}`);

    const textColor = parseColor(styles.color);
    const bgColor = parseColor(styles.backgroundColor);

    expect(textColor).not.toBeNull();
    expect(bgColor).not.toBeNull();

    if (textColor && bgColor) {
      const textLuminance = getRelativeLuminance(textColor.r, textColor.g, textColor.b);
      const bgLuminance = getRelativeLuminance(bgColor.r, bgColor.g, bgColor.b);
      const contrastRatio = getContrastRatio(textLuminance, bgLuminance);

      console.log(`Contrast ratio: ${contrastRatio.toFixed(2)}:1`);
      console.log(`Text RGB: (${textColor.r}, ${textColor.g}, ${textColor.b})`);
      console.log(`Background RGB: (${bgColor.r}, ${bgColor.g}, ${bgColor.b})`);

      // WCAG AA requires 4.5:1 for normal text
      expect(contrastRatio).toBeGreaterThanOrEqual(4.5);
    }
  });

  test('Highlight chip text should be clearly readable', async ({ page }) => {
    const highlightChip = page.locator('.highlight-chip').first();
    await expect(highlightChip).toBeVisible();

    // Get the chip text content
    const chipText = await highlightChip.locator('.p-chip-text, .p-chip-label').textContent();
    console.log(`Highlight chip text: ${chipText}`);

    // Verify the chip contains expected content
    expect(chipText).toContain('Manufacturer');
    expect(chipText).toContain('Ford');

    // Get text element styles specifically
    const textStyles = await highlightChip.locator('.p-chip-text, .p-chip-label').evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return {
        color: computed.color,
        fontSize: computed.fontSize,
        fontWeight: computed.fontWeight,
      };
    });

    console.log(`Text styles: color=${textStyles.color}, size=${textStyles.fontSize}, weight=${textStyles.fontWeight}`);

    // Text should not be too light (problematic colors are close to the background)
    const textColor = parseColor(textStyles.color);
    if (textColor) {
      // Yellow/amber backgrounds are around (255, 193, 7) or similar
      // Text that's too light (like gray) won't contrast well
      // Good contrasting colors would be dark (low RGB values)
      const isTextDark = textColor.r < 100 && textColor.g < 100 && textColor.b < 100;
      const isTextBlack = textColor.r === 0 && textColor.g === 0 && textColor.b === 0;

      console.log(`Text is dark: ${isTextDark}, Text is black: ${isTextBlack}`);

      // Text should be dark enough to read on yellow background
      // Either truly dark (r,g,b < 100) or we rely on the contrast ratio test above
      expect(isTextDark || isTextBlack).toBe(true);
    }
  });
});
