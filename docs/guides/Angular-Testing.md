The question is no longer \"Vitest vs. Playwright,\" but rather how they
function together as the two pillars of the Angular testing ecosystem.

**The short answer:** Vitest is not a \"better alternative\" to
Playwright; it is a **complementary** tool that replaces your **Unit
Testing** runner (Jasmine/Karma), whereas Playwright remains the king of
**End-to-End (E2E)** testing.

## **1. The 2025 Testing Division of Labor**

In a modern Angular 21+ project, your testing strategy should be split
between these two tools based on the \"Testing Pyramid.\"

  ------------------------------------------------------------------------
  **Feature**      **Vitest                 **Playwright (E2E)**
                   (Unit/Integration)**     
  ---------------- ------------------------ ------------------------------
  **Execution      Node.js (via JSDOM or    Real Browsers (Chromium,
  Environment**    Happy-DOM)               WebKit, Firefox)

  **Speed**        **Blazing Fast** (Tests  **Moderate** (Full browser
                   run in ms)               overhead)

  **Primary        Logic, Services, Single  Full User Journeys, Auth
  Target**         Components               flows, API integration

  **Developer      \"Instant\" watch mode   CI/CD gatekeeper or pre-deploy
  Loop**           while coding             check
  ------------------------------------------------------------------------

## **2. Why Vitest is the \"New Default\" for Angular**

If your team is becoming comfortable with Playwright, you've already
started the journey toward modernizing. Here is why you should **also**
adopt Vitest for your unit tests:

### **A. The Angular 21 Standard**

As of late 2025, Angular has officially deprecated Karma and adopted
**Vitest** as the default runner for ng test. ^2^If you create a new
project today, Vitest is what you get out of the box.

### **B. \"Zoneless\" Compatibility**

Angular\'s shift to **Signals** and **Zoneless** mode makes traditional
testing (which relied on zone.js to track async tasks) more complex.
Vitest is built for the modern ESM (ES Modules) era and handles the
\"Signal-based\" reactivity of Angular 21 much more natively than older
runners like Jest or Jasmine.^3^

### **C. Performance Forensics**

Vitest is significantly faster for unit testing because it doesn\'t spin
up a heavy browser instance.^4^

-   **Vitest:** Re-runs only the specific test file you changed in
    roughly **100ms**.^5^

-   **Playwright:** Even in \"Component Testing\" mode, there is a
    distinct delay while the browser environment orchestrates.

## **3. The \"Gotcha\": Vitest *uses* Playwright**

To make things even more confusing (but helpful), Vitest has a
**\"Browser Mode.\"** If you want to run your Vitest unit tests in a
real browser instead of a simulated Node environment, Vitest actually
uses **Playwright as the provider**.

**Strategic Note:** If your team is learning Playwright, you are
actually gaining the skills to configure Vitest\'s advanced
browser-based testing. You aren\'t wasting time; you\'re building the
infrastructure for both layers.

## **4. Decision Matrix: When to use which?**

### **Use Vitest when:**

-   You are testing a **Pure Function** or a **Service** (Business
    Logic).

-   You want to test a **Single Component** in isolation (e.g., \"Does
    the button turn red when isActive is true?\").

-   You need **instant feedback** while you are typing code.

### **Use Playwright when:**

-   You are testing a **User Flow** (e.g., \"Login -\> Add to Cart -\>
    Checkout\").^6^

-   You need to verify **Cross-Browser** consistency (Does it work on
    Safari/WebKit?).

-   You are testing **Visual Regressions** (Pixel-by-pixel UI
    changes).^7^

## **Final Recommendation**

**Do not switch from Playwright to Vitest.** Instead, use **Playwright**
for your E2E flows and **Vitest** to replace your old ng test
(Jasmine/Karma) setup.

Since you are already on Angular 21, the best next step is to run the
migration schematic to move your unit tests to Vitest. This will give
you the \"fastest of both worlds.\"

Tests are currently running in a headless chrome browser on a Linux
server. Is such a headless browser test able to generate \`screenshots\`
for documentation?

Yes, a headless Chrome browser running on a Linux server is fully
capable of generating screenshots for documentation. In fact, headless
mode is the preferred way to automate this process in CI/CD pipelines
because it is consistent, fast, and does not require a physical display.

### **1. How It Works on a Linux Server**

Since your server likely lacks a Graphical User Interface (GUI), the
headless browser uses a **virtual frame buffer** or its own internal
rendering engine to draw the page in memory.

-   **Fidelity:** The screenshot generated is bit-for-bit identical to
    what a user would see in a standard \"headed\" browser, provided the
    fonts and window dimensions are identical.

-   **Documentation Use-Case:** Beyond just \"capturing an image,\"
    modern tools allow you to generate **Full Page Screenshots**
    (scrolling the entire length of the page automatically) or
    **Element-Specific Screenshots** (capturing just a specific
    component or dashboard widget).

### **2. The Critical \"Gotcha\": Font Rendering**

The most common mistake when generating documentation screenshots on a
headless Linux server is neglecting **System Fonts**.

**The Problem:** Most Linux server distributions (Ubuntu Server, Debian,
etc.) do not come with standard web fonts like Arial, Helvetica, or
Times New Roman. **The Result:** Your screenshots will look \"broken\"
or use generic blocky fonts (like DejaVu Sans), which looks
unprofessional in documentation.

**The Fix:** You must explicitly install font packages on your server:

Bash

\# Example for Ubuntu/Debian\
sudo apt-get install fonts-liberation ttf-mscorefonts-installer

### **3. Implementation in Your Current Ecosystem**

Since your team is using **Playwright** and potentially moving toward
**Vitest**, here is how you trigger these screenshots:

#### **Using Playwright (The \"Actionable\" Approach)**

Playwright is excellent for documentation because it can wait for
animations to finish before \"snapping\" the picture.

TypeScript

// Standard screenshot\
await page.screenshot({ path: \'docs/dashboard-initial.png\' });\
\
// Full-page screenshot (scrolls for you)\
await page.screenshot({ path: \'docs/landing-page-full.png\', fullPage:
true });\
\
// Specific UI Component\
await page.locator(\'.payment-card\').screenshot({ path:
\'docs/component-ui.png\' });

#### **Using Vitest (The \"Visual Regression\" Approach)**

In Vitest\'s browser mode (using the Playwright provider), screenshots
are typically used for **Visual Comparisons** to ensure the UI hasn\'t
changed.

import { expect, test } from \'vitest\'

test(\'UI matches documentation baseline\', async ({ page }) =\> {

await page.goto(\'/settings\');

// This generates a \'baseline\' image the first time it runs

await expect(page).toMatchScreenshot();

});

### **4. Summary Checklist for Success**

If you want these screenshots to be \"documentation quality,\" ensure
your script handles the following:

-   **Set Viewport Size:** Explicitly set width: 1920 and height: 1080
    to ensure consistency.

-   **Wait for \"Network Idle\":** Ensure all images and external assets
    are loaded before taking the shot.

-   **Disable Carousels/Animations:** Use Playwright's animations:
    \'disabled\' option to avoid capturing a blurry half-transition.

-   **Dark Mode/Light Mode:** If your documentation needs both, remember
    to trigger the prefers-color-scheme emulation.

### **1. The \"Perfect Screenshot\" Server Setup**

To prevent your screenshots from using generic, blocky Linux fonts (like
DejaVu Sans), you must install the font families your application
expects.

**The Shell Script for your Linux Host (Ubuntu/Debian):**

Bash

\# 1. Update package list\
sudo apt-get update\
\
\# 2. Install Microsoft Core Fonts (Arial, Times New Roman, etc.)\
\# Note: You must accept the EULA prompt during installation\
sudo apt-get install -y ttf-mscorefonts-installer\
\
\# 3. Install common open-source alternatives (High-quality)\
sudo apt-get install -y \\\
fonts-liberation \\\
fonts-noto \\\
fonts-roboto\
\
\# 4. Critical: Refresh the font cache\
sudo fc-cache -f -v

### **2. The Docker Approach (Recommended for CI/CD)**

If your Linux server runs tests inside Docker, using the official
Playwright image is the safest path, as it already contains the browser
dependencies. However, you still need to add the fonts.

**Example Dockerfile for Documentation Generation:**

Dockerfile

\# Use the official Playwright image as a base\
FROM mcr.microsoft.com/playwright:v1.49.0-noble\
\
\# Install system fonts for professional rendering\
RUN apt-get update && apt-get install -y \\\
fonts-liberation \\\
fontconfig \\\
&& rm -rf /var/lib/apt/lists/\*\
\
\# Copy your local font files if you have a custom corporate font\
\# COPY ./assets/my-custom-font.ttf /usr/share/fonts/truetype/custom/\
\
\# Refresh font cache\
RUN fc-cache -f -v\
\
\# Set standard environment variables for headless consistency\
ENV CI=true\
ENV PLAYWRIGHT_JSON_OUTPUT_NAME=results.json

### **3. Playwright Configuration for Documentation**

To ensure the screenshots are \"Documentation Grade,\" you should use
specific flags to avoid common headless artifacts (like inconsistent
kerning).

**In your playwright.config.ts (or test file):**

TypeScript

const browser = await chromium.launch({\
args: \[\
\'\--font-render-hinting=none\', // Prevents blocky text in headless
mode\
\'\--disable-font-subpixel-positioning\', // Ensures consistent spacing
across OSs\
\]\
});\
\
const page = await browser.newPage();\
await page.setViewportSize({ width: 1440, height: 900 });\
\
// CRITICAL for Documentation: Wait for fonts to finish loading\
await page.goto(\'https://your-app.com/dashboard\');\
await page.evaluateHandle(() =\> document.fonts.ready);\
\
await page.screenshot({\
path: \'documentation/dashboard-final.png\',\
fullPage: true,\
animations: \'disabled\' // Prevents capturing blurry transitions\
});

### **4. Summary of Pitfalls to Avoid**

-   **The \"Double Animation\" Blur:** Documentation screenshots often
    capture a \"Loading\...\" spinner or a half-faded button. Use
    animations: \'disabled\' and await
    page.waitForLoadState(\'networkidle\').

-   **Resolution Mismatch:** Servers default to very small viewports.
    Always explicitly set viewportSize to a standard desktop resolution
    (e.g., 1920x1080).

-   **CORS Font Blocks:** If your fonts load from a CDN (like Google
    Fonts), the headless browser on your server might block them due to
    CORS. If your fonts look like \"Times New Roman\" despite your CSS,
    check the console logs for Access-Control-Allow-Origin errors.

Automating documentation screenshots is a high-value \"System
Architect\" move. It ensures that your user manuals, internal wikis, and
stakeholder reports never fall out of sync with the actual UI.

Below is a production-ready Playwright script designed to crawl your
Angular 21 application and generate organized, high-fidelity
documentation assets.

### **1. The Documentation Generator Script**

Save this as tests/generate-docs.spec.ts. It uses a parameterized
approach to cleanly iterate through your routes.

TypeScript

import { test, expect } from \'@playwright/test\';\
\
// 1. Define the routes you want to document\
const routes = \[\
{ path: \'/\', name: \'landing-page\' },\
{ path: \'/dashboard\', name: \'main-dashboard\' },\
{ path: \'/settings/profile\', name: \'user-settings\' },\
{ path: \'/reports/analytics\', name: \'analytics-view\', fullPage: true
},\
\];\
\
test.describe(\'Documentation Screenshot Generator\', () =\> {\
\
// Set consistent viewport for documentation\
test.use({ viewport: { width: 1440, height: 900 } });\
\
for (const route of routes) {\
test(\`Generating screenshot for: \${route.name}\`, async ({ page }) =\>
{\
\
// Navigate to the route\
await page.goto(route.path);\
\
// 2. WAIT FOR READINESS (Crucial for Documentation)\
// Wait for Angular to stabilize and all network calls to finish\
await page.waitForLoadState(\'networkidle\');\
\
// Ensure all web fonts are rendered to avoid \"fallback font\"
glitches\
await page.evaluateHandle(() =\> document.fonts.ready);\
\
// 3. OPTIONAL: Clean up the UI for docs\
// You can hide sensitive data or remove annoying elements like chat
bots\
await page.addStyleTag({ content: \`\
.intercom-launcher, .cookie-banner { display: none !important; }\
\[data-testid=\"user-email\"\] { filter: blur(5px); }\
\`});\
\
// 4. Capture the shot\
await page.screenshot({\
path: \`./documentation/v21-assets/\${route.name}.png\`,\
fullPage: route.fullPage \|\| false,\
animations: \'disabled\', // Freeze CSS animations for a sharp image\
});\
\
console.log(\`✅ Saved: \${route.name}.png\`);\
});\
}\
});

### **2. Strategic \"Documentation-Only\" Features**

To make these screenshots truly useful, you can use these two advanced
Playwright patterns:

#### **A. Interactive Highlights**

If you are documenting a \"How-To\" guide, you can use Playwright to
draw attention to specific components before snapping the photo.

TypeScript

const searchBar = page.locator(\'app-search-input\');\
await searchBar.evaluate(el =\> {\
el.style.outline = \'4px solid #3b82f6\'; // Add a blue
\"Instructional\" border\
el.style.outlineOffset = \'4px\';\
});\
await page.screenshot({ path: \'docs/how-to-search.png\' });

#### **B. Multi-State Captures (Modals/Dropdowns)**

A crawler often misses dynamic states. You can force them open:

TypeScript

test(\'Document User Dropdown\', async ({ page }) =\> {\
await page.goto(\'/dashboard\');\
await page.click(\'#user-menu-button\'); // Open the dropdown\
await page.waitForSelector(\'.dropdown-content\'); // Ensure it\'s
visible\
await page.screenshot({ path: \'docs/user-menu-expanded.png\' });\
});

### **3. Execution & Workflow**

Run this specific file in your headless environment with:

Bash

npx playwright test tests/generate-docs.spec.ts \--project=chromium

### **4. Checklist for Professional Documentation**

-   **Version Pinning:** Save your screenshots in a folder named after
    the release (e.g., /docs/assets/v21.0.1/) so you can track UI
    evolution.

-   **The \"Clean\" State:** Ensure your test user has \"golden
    data\"---don\'t take screenshots of an empty dashboard with \"No
    data found.\"

-   **Localization:** If your app supports multiple languages, wrap the
    script in a loop that sets the locale and timezone in the
    browserContext to generate docs for different regions.

Integrating screenshot generation into your CI/CD pipeline is the final
step in creating a \"self-documenting\" application. By treating your UI
as an artifact, you ensure that every version of your software has an
associated set of high-fidelity visual assets.

Here is how to configure the two most common enterprise CI/CD platforms
to handle these screenshots.

### **1. GitHub Actions Configuration**

GitHub Actions uses the upload-artifact action. This will automatically
zip the specified folder and make it available for download on the
\"Summary\" page of your workflow run.

**File:** .github/workflows/generate-docs.yml

YAML

name: UI Documentation Assets\
on:\
push:\
branches: \[ main \]\
\
jobs:\
generate-screenshots:\
runs-on: ubuntu-latest\
steps:\
- uses: actions/checkout@v4\
\
- name: Setup Node.js\
uses: actions/setup-node@v4\
with:\
node-version: \'20\' \# Or \'22\' for Angular 21 projects\
\
- name: Install dependencies\
run: npm ci\
\
- name: Install Playwright Browsers & Linux Fonts\
run: npx playwright install \--with-deps chromium\
\
- name: Run Doc Generator\
run: npx playwright test tests/generate-docs.spec.ts\
\
\# This step zips and saves the folder\
- name: Upload Documentation Artifacts\
uses: actions/upload-artifact@v4\
if: always() \# Ensures screenshots are saved even if one route fails\
with:\
name: angular-v21-ui-assets\
path: ./documentation/v21-assets/\
retention-days: 30 \# Keeps assets for 30 days

### **2. GitLab CI Configuration**

GitLab handles artifacts natively via the artifacts keyword. It will
display a \"Download\" button next to the job in the pipeline view.

**File:** .gitlab-ci.yml

YAML

stages:\
- document\
\
generate_ui_assets:\
stage: document\
\# Use the official Playwright image (pre-loaded with browsers)\
image: mcr.microsoft.com/playwright:v1.49.0-noble\
script:\
- npm ci\
\# Ensure fonts are refreshed in the container\
- apt-get update && apt-get install -y fonts-liberation\
- fc-cache -f -v\
- npx playwright test tests/generate-docs.spec.ts\
artifacts:\
name: \"ui-documentation-\$CI_COMMIT_REF_SLUG\"\
paths:\
- documentation/v21-assets/\
expire_in: 4 weeks\
when: always

### **3. Workflow Comparison: Where do the files go?**

  -------------------------------------------------------------------------------
  Feature             **GitHub Actions**            **GitLab CI**
  ------------------- ----------------------------- -----------------------------
  **Storage           \"Actions\" tab → \[Your      \"CI/CD\" → \"Jobs\" →
  Location**          Run\] → Bottom of page.       Right-hand sidebar.

  **Format**          Automatically Zipped (.zip).  Browsable via UI or
                                                    Downloaded as Zip.

  **Accessibility**   Available to anyone with repo Can be public or restricted
                      access.                       to \"Reporter\" role.
  -------------------------------------------------------------------------------

### **4. Pro-Architect Tip: The \"Visual Diff\" Check**

Once you have these artifacts, a senior engineer often adds a **Visual
Regression** step. Instead of just saving the screenshots, the CI
compares the *new* screenshot with the *previous* version. If they
differ by more than 1%, the build fails.

**Why this matters:** It prevents \"accidental UI breakage.\" If a
developer changes a global CSS variable in Angular 21, they might
unknowingly break the layout of the \"Settings\" page. The CI artifact
check will catch this immediately.

To finalize your enterprise Angular 21 documentation pipeline, the last
piece is the **feedback loop**. By notifying your documentation or
product team the moment new assets are ready, you eliminate the \"Is the
manual updated?\" Slack tennis matches.

Below are the configurations for sending a rich Slack notification
containing a direct link to your generated artifacts.

### **1. Setup: Create a Slack Webhook**

Before updating your pipeline, you need a \"Payload URL\" from Slack:

1.  Go to [**api.slack.com/apps**](https://api.slack.com/apps) and
    create an app (e.g., \"DocBot\").

2.  Enable **Incoming Webhooks** and click **Add New Webhook to
    Workspace**.

3.  Select a channel (e.g., #ux-documentation) and copy the URL.

4.  **Security:** Add this URL as a \"Secret\" in your GitHub or GitLab
    settings named SLACK_WEBHOOK_URL.

### **2. GitHub Actions: Notify with Artifact Link**

In GitHub, artifacts are generated with a unique ID. We can use the
rtCamp/action-slack-notify action to send a clean, formatted message.

**Update your .github/workflows/generate-docs.yml:**

YAML

\# \... Previous steps (Checkout, Install, Run Playwright) \...\
\
- name: Upload Documentation Artifacts\
id: artifact-upload \# We need this ID to reference the URL\
uses: actions/upload-artifact@v4\
with:\
name: angular-v21-ui-assets\
path: ./documentation/v21-assets/\
\
- name: Notify Slack\
if: success()\
uses: rtCamp/action-slack-notify@v2\
env:\
SLACK_WEBHOOK: \${{ secrets.SLACK_WEBHOOK_URL }}\
SLACK_TITLE: \"📸 New UI Assets Ready (Angular 21)\"\
SLACK_MESSAGE: \|\
The latest UI screenshots have been generated for version \${{
github.sha }}.\
Download the assets here: \${{
steps.artifact-upload.outputs.artifact-url }}\
SLACK_COLOR: \"#36a64f\"\
SLACK_ICON: [https://angular.io/assets/images/logos/angular/angular.png\
](https://angular.io/assets/images/logos/angular/angular.png)

### **3. GitLab CI: Notify with Job Link**

GitLab doesn\'t provide a direct \"artifact link\" output variable as
easily as GitHub, so the standard approach is to link to the **Job
Page**, where the \"Browse Artifacts\" button is located.

**Update your .gitlab-ci.yml:**

YAML

generate_ui_assets:\
stage: document\
\# \... (existing script and artifact steps) \...\
\
after_script:\
- \>\
curl -X POST -H \'Content-type: application/json\' \--data \"{\
\\\"text\\\": \\\"\*UI Documentation Updated\* :camera:\\nProject:
\$CI_PROJECT_NAME\\nBranch: \$CI_COMMIT_REF_NAME\\n\<
\$CI_JOB_URL/artifacts/browse \| 📂 Browse New Screenshots\>\\\"\
}\" \$SLACK_WEBHOOK_URL

### **4. Why This Completes the \"Architect\" Journey**

By setting this up, you have transitioned from a developer who \"builds
components\" to an architect who manages a **Content Supply Chain**.

-   **Automation:** Screenshots are generated without human effort.

-   **Consistency:** The Linux server ensures every screenshot has
    identical fonts and resolution.

-   **Visibility:** The documentation team receives the assets in
    real-time, allowing them to update the user manual as soon as the PR
    is merged.

### **Summary of Your New Workflow**

1.  **Code:** You update an Angular 21 component.

2.  **Verify:** You run npx vitest for instant unit feedback.

3.  **Deploy/Document:** You push to main.

4.  **Generate:** Playwright (headless) captures the new UI on your
    Linux server.

5.  **Notify:** Your documentation team gets a Slack ping with a zip
    link.
