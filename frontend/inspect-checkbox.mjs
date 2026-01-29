import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

// Enable console logging from the page
page.on('console', msg => {
  if (msg.type() === 'log' || msg.type() === 'debug') {
    console.log('PAGE:', msg.text());
  }
});

await page.goto('http://localhost:4205/automobiles/discover');
await page.waitForTimeout(3000);

// Check the checkbox structure
const checkboxInfo = await page.evaluate(() => {
  const checkboxes = document.querySelectorAll('p-checkbox');
  const firstCheckbox = checkboxes[1]; // Skip header checkbox, get first row
  
  if (!firstCheckbox) return { error: 'No checkbox found' };
  
  // Get the input element
  const input = firstCheckbox.querySelector('input');
  const box = firstCheckbox.querySelector('.p-checkbox-box');
  
  return {
    checkboxCount: checkboxes.length,
    inputType: input?.type,
    inputChecked: input?.checked,
    boxClasses: box?.className,
    checkboxHTML: firstCheckbox.outerHTML.substring(0, 500)
  };
});

console.log('Checkbox structure:', JSON.stringify(checkboxInfo, null, 2));

// Try clicking a checkbox and see what happens
const result = await page.evaluate(() => {
  const checkboxes = document.querySelectorAll('p-checkbox');
  const firstRowCheckbox = checkboxes[1]; // First data row checkbox
  
  if (!firstRowCheckbox) return { error: 'No checkbox' };
  
  const input = firstRowCheckbox.querySelector('input');
  const beforeChecked = input?.checked;
  
  // Click the checkbox
  const box = firstRowCheckbox.querySelector('.p-checkbox-box');
  if (box) {
    box.click();
  }
  
  const afterChecked = input?.checked;
  
  return {
    beforeChecked,
    afterChecked,
    changed: beforeChecked !== afterChecked
  };
});

console.log('Click result:', JSON.stringify(result, null, 2));

// Wait a bit and check again
await page.waitForTimeout(500);

const afterWait = await page.evaluate(() => {
  const checkboxes = document.querySelectorAll('p-checkbox');
  const firstRowCheckbox = checkboxes[1];
  const input = firstRowCheckbox?.querySelector('input');
  return {
    checked: input?.checked
  };
});

console.log('After wait:', JSON.stringify(afterWait, null, 2));

await browser.close();
