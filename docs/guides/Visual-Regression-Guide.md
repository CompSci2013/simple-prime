Implementing **Visual Regression Testing** is the \"holy grail\" of
large-scale Angular development. It transforms your testing from \"Does
the code work?\" to \"Does the user see what we intended?\"

In the Signals-driven world of Angular 21, where UI updates are nearly
instantaneous, a tiny change in a CSS variable or a Signal-based
conditional can cause a layout shift that functional tests (like Vitest
or standard Playwright assertions) would miss.

### **1. The Visual Regression Workflow**

Instead of just taking a screenshot, we use the
expect(page).toHaveScreenshot() assertion.

-   **First Run:** Playwright captures a **\"Golden Image\"** (the
    baseline). You commit this to Git.

-   **Subsequent Runs:** Playwright compares the new UI against the
    Golden Image.

-   **Failure:** If even one pixel is different (beyond your set
    threshold), the test fails and generates a **\"Diff Image\"**
    highlighting the changes in red.

### **2. Implementation: The \"Smart\" Visual Test**

Update your generate-docs.spec.ts to include a visual regression check.
We use maxDiffPixelRatio to allow for minor rendering differences that
occur on different Linux kernels.

TypeScript

import { test, expect } from \'@playwright/test\';\
\
test(\'Dashboard Visual Integrity\', async ({ page }) =\> {\
await page.goto(\'/dashboard\');\
await page.waitForLoadState(\'networkidle\');\
\
// 1. Mask dynamic elements (like dates or random IDs) to prevent false
positives\
await expect(page).toHaveScreenshot(\'main-dashboard.png\', {\
mask: \[page.locator(\'.current-timestamp\'),
page.locator(\'.live-user-count\')\],\
maxDiffPixelRatio: 0.02, // Allow 2% difference for anti-aliasing\
animations: \'disabled\',\
});\
});

### **3. CI/CD Integration: The \"Gatekeeper\" Mode**

In your CI/CD pipeline (GitHub Actions or GitLab), you don\'t just want
to *save* images; you want to **fail the build** if the UI breaks.

#### **Updating GitHub Actions (.github/workflows/generate-docs.yml)**

Add a specific flag to handle snapshot mismatches.

YAML

\- name: Run Visual Regression Tests\
\# This will fail the job if a mismatch is found\
run: npx playwright test \--grep \"Visual Integrity\"\
env:\
\# This ensures Playwright uses the correct CI-specific snapshots\
CI: true\
\
- name: Notify Slack on Visual Failure\
if: failure()\
uses: rtCamp/action-slack-notify@v2\
env:\
SLACK_WEBHOOK: \${{ secrets.SLACK_WEBHOOK_URL }}\
SLACK_TITLE: \"🚨 UI REGRESSION DETECTED\"\
SLACK_MESSAGE: \"A visual change was detected in the latest build.
Please review the \'diff\' images in the artifacts.\"\
SLACK_COLOR: \"#ff0000\"

### **4. Handling Legitimate UI Changes**

When you **intentionally** change the UI (e.g., a rebranding), your
tests will fail. To update the \"Golden Images,\" you run:

Bash

npx playwright test \--update-snapshots

Then, you commit the new .png files to your repository. This creates a
documented history of your UI evolution.

### **5. Summary: Why This Matters for Angular 21 Architects**

1.  **Confidence in Refactoring:** You can refactor an entire
    Signal-based state service knowing that if the UI shifts by even 1
    pixel, you'll know before it hits production.

2.  **Cross-Team Alignment:** Your Slack notifications keep the
    **Design** and **Documentation** teams in the loop. They don\'t have
    to guess if the UI changed; they get a \"Diff\" sent directly to
    them.

3.  **Zoneless Stability:** In a zoneless Angular app, change detection
    is more manual. Visual regression ensures your manual markForCheck
    or Signal updates are actually reaching the DOM correctly.

When you implement visual regression testing, you will almost certainly
encounter the **\"Environmental Drift\"** problem: a test that passes
perfectly on a developer\'s Windows or macOS machine fails in the Linux
CI pipeline.

This happens because Windows uses **DirectWrite** for font smoothing,
while Linux uses **FreeType**, resulting in sub-pixel differences that
are invisible to the eye but \"loud\" to a pixel-matching algorithm.

### **1. The Single Source of Truth: Docker**

The most professional way to handle this is to declare that **Linux is
the only environment that generates baselines.** Even if your developers
work on Windows, they should run their visual tests inside a Docker
container that matches the CI environment.

**The \"Local Developer\" Command:** Instead of running npx playwright
test, developers run a \"Dockerized\" version to ensure they are seeing
exactly what the CI server sees.

Bash

\# Run tests inside the official Playwright container\
docker run \--rm \--network host -v \$(pwd):/work/ -w /work/
mcr.microsoft.com/playwright:v1.49.0-noble npx playwright test
\--project=chromium

### **2. Multi-Platform Snapshot Pathing**

If you absolutely must support multiple OS baselines (e.g., you want to
know if the UI looks good on Windows *and* Linux), Playwright can
automatically manage separate folders for each.

**In your playwright.config.ts:**

TypeScript

export default defineConfig({\
// This tells Playwright to save images as:\
// snapshots/dashboard/main-linux.png vs
snapshots/dashboard/main-win32.png\
snapshotPathTemplate:
\'{testDir}/\_\_snapshots\_\_/{testFilePath}/{arg}{ext}\',\
});

### **3. The \"Anti-Aliasing\" Tolerance**

When comparing text, you should adjust the sensitivity of the
comparison. Sub-pixel anti-aliasing (the slight \"blur\" around the
edges of letters) varies wildly between GPUs and OSs.

**Updated Assertion with Thresholds:**

TypeScript

await expect(page).toHaveScreenshot(\'dashboard.png\', {\
threshold: 0.2, // Allow a 20% color difference per pixel (lax)\
maxDiffPixelRatio: 0.05, // Allow up to 5% of total pixels to be
different\
animations: \'disabled\',\
});

### **4. Summary Checklist for Baseline Consistency**

-   **Font Readiness:** Always use await page.evaluateHandle(() =\>
    document.fonts.ready) before taking the shot.

-   **System Fonts:** Install fonts-liberation on your Linux server (as
    discussed previously) to mimic standard Windows widths.

-   **Headless vs. Headed:** Never compare a screenshot taken in
    \"Headed\" mode (visible browser) with one taken in \"Headless\"
    mode. Headless rendering engines often skip certain GPU-accelerated
    shadows.

-   **Device Scale Factor:** Ensure deviceScaleFactor: 1 is set in your
    config. If one developer has a \"Retina\" or 4K display and another
    doesn\'t, the pixel density will cause an instant failure.

### **Final Thought for your Angular 21 Team**

You now have a fully automated, cross-platform,
documentation-generating, visual-regression-testing machine. This is the
hallmark of a high-maturity enterprise project.

### **Case Study**

Problem statement. Over 80 unit tests were written and passed for five
different components, but when using the application, there were obvious
bugs that these unit tests should have captured. This was very frustring
to developers and managment alike due to the expenditure in developing
the tests for little perceived value. A particularly frustrating thing
Component A works fine. Then Component B was used and component A
mysteriously broke. There was no obvious coupling between the
components. After many hours and debugging sessions, it was finally
discovered that a root level service/subscription was being used by the
components, and that when the component was destroyed, it also destroyed
the subscription service thereby \'breaking\' all of the other
components. (Something lake takeUnit(\$destroy)\... I don\'t remember
the exact syntax.) The bug was found by adding a copious amount of
console.log statements and then monitoring the console.logs to determine
when the break occurred.

This scenario is a classic \"architectural trauma\" event. It perfectly
illustrates why the industry is moving toward **Signals** and **Zoneless
Angular**, and why your previous 80 unit tests felt like \"theatre\"
rather than \"security.\"

The technical culprit was likely a **Shared Service** where a developer
used a \"Destroy Subject\" pattern incorrectly. Specifically, they
likely tied the lifecycle of a **Singleton Service** (which lives for
the life of the app) to the lifecycle of a **Component** (which lives
only while visible).

### **1. The \"Ghost in the Machine\": What Actually Happened**

The syntax you likely encountered was:

this.dataService.stream\$.pipe(takeUntil(this.destroy\$)).subscribe(\...)

If this.destroy\$ was accidentally part of the **Service** instead of
the **Component**, once Component B was destroyed, it called
this.destroy\$.next(). Because the Service is a Singleton shared by
everyone, it \"killed\" the stream for Component A, Component C, and
every other part of the app.

Why your 80 Unit Tests failed to catch it:

Unit tests typically isolate a single component in a \"clean room\"
environment. They create a fresh instance of the service, test the
component, and then tear it all down. They never test the persistent
state or the side effects that occur when Component B interacts with a
service that Component A is still using.

### **2. The Angular 21 Solution: Moving from \"Defense\" to \"Design\"**

In Angular 21, the framework is being redesigned specifically to prevent
this exact category of bug.

#### **A. Signals replace Manual Subscriptions**

In the old way, you had to manually \"manage\" the life of a
subscription. If you forgot, you got a memory leak; if you did it wrong
(as in your case), you broke the app.

-   **The Signal Way:** Signals do not require unsubscribe(). They are
    \"pull-based\" and cleaned up automatically by the framework\'s
    effect-tracking engine. In Angular 21, if Component A and B both
    read from the same Signal, Component B being destroyed has **zero
    impact** on Component A's ability to read that data.

#### **B. The inject(DestroyRef) Pattern**

If you still need to use RxJS, Angular 21 replaces the manual Subject
pattern with a formal DestroyRef.

TypeScript

// Angular 21 - The safe way\
private destroyRef = inject(DestroyRef);\
\
this.dataService.stream\$\
.pipe(takeUntilDestroyed(this.destroyRef)) // Automatically scoped to
THIS instance\
.subscribe(\...);

### **3. The \"Silent Failure\" Rubric: How to avoid this again**

To prevent management and developers from losing faith in testing, you
need to pivot your testing strategy.

  -------------------------------------------------------------------------------
  **Problem**    **The         **The \"Real\" Fix (Integration/Visual)**
                 \"Fake\" Fix  
                 (Unit         
                 Tests)**      
  -------------- ------------- --------------------------------------------------
  **Shared State Testing       **Integration Tests:** A test that renders *both*
  Corruption**   Component A   components and simulates navigating between them.
                 and B in      
                 isolation.    

  **Observable   Mocking the   **Playwright/Visual Regression:** As you
  Death**        service with  discovered, you \"saw\" it was broken. A
                 static data.  Playwright test would have clicked \"Go to B,\"
                               then \"Go to A,\" and failed when the data didn\'t
                               appear.

  **Logic        console.log   **Angular DevTools:** Using the \"Signals\" tab to
  Leakage**      debugging.    see exactly when a value stops flowing in
                               real-time.
  -------------------------------------------------------------------------------

### **4. Forensic Analysis: The \"Takeaway\"**

The frustration your team felt is valid. You were testing
**implementation** (Does the component call this function?) rather than
**behavior** (Does the data stay on the screen?).

**The Path Forward:**

1.  **Stop writing \"Paper-thin\" Unit Tests:** If a test just checks if
    a variable was set, it's a waste of time.

2.  **Shift to Signal-based Services:** In Angular 21, move your \"Root
    Level Services\" to use Signals. This eliminates the \"Subscription
    Death\" bug entirely because Signals are not \"streams\" that can be
    closed; they are values that are always available.

3.  **Invest in Playwright \"User Journeys\":** One Playwright test that
    simulates \"Open A -\> Open B -\> Close B -\> Check A\" is worth
    more than 100 unit tests for this specific bug.

To prevent the \"Component B kills Component A\" catastrophe, we have to
move away from **Stream Management** (RxJS) and toward **State
Management** (Signals).

In the old RxJS pattern, you were passing around a \"pipe.\" If someone
capped the pipe (manually completed the subject or destroyed the
subscription), the water stopped flowing for everyone. In the **Angular
21 Signal pattern**, you are sharing a \"reservoir.\" People can come
and go, but the water (the data) remains available to anyone still
standing by the shore.

### **1. The Problematic \"Legacy\" Service (RxJS)**

This is likely what caused your headache. The service was \"fragile\"
because it allowed components to interfere with the source of truth.

TypeScript

// ❌ THE DANGER ZONE (Legacy RxJS)\
\@Injectable({ providedIn: \'root\' })\
export class DataService {\
private dataSubject = new BehaviorSubject\<string\[\]\>(\[\]);\
public data\$ = this.dataSubject.asObservable();\
\
// If a component accidentally gets hold of \'dataSubject\'\
// and calls .complete(), the app dies.\
}

### **2. The Angular 21 \"Signal\" Solution**

In Angular 21, we use a signal or a signalStore. Because Signals are
**producer-consumer** based rather than **subscription** based, they
don\'t \"complete.\" They simply exist.

TypeScript

// ✅ THE ARCHITECT\'S WAY (Angular 21 Signals)\
import { Injectable, signal, computed } from \'@angular/core\';\
\
\@Injectable({ providedIn: \'root\' })\
export class DataService {\
// 1. Private state - cannot be \'completed\' or \'destroyed\' by
components\
#data = signal\<string\[\]\>(\[\]);\
\
// 2. Public read-only signal\
public readonly data = this.#data.asReadonly();\
\
// 3. Derived state (replaces complex RxJS mapping)\
public readonly count = computed(() =\> this.data().length);\
\
updateData(newData: string\[\]) {\
this.#data.set(newData);\
}\
}

### **3. Why this fix is \"Bulletproof\"**

The bug you described happened because of **Subscription Lifecycle
Coupling**. Here is how the Signal approach makes that bug physically
impossible:

  ----------------------------------------------------------------------------
  **Feature**       **RxJS Behavior (The     **Signal Behavior (The Fix)**
                    Bug)**                   
  ----------------- ------------------------ ---------------------------------
  **Termination**   An Observable can be     A Signal **never ends**. It
                    completed or errored,    always has a current value.
                    stopping it forever.     

  **Coupling**      If you use               Signals are **Glitch-Free**. They
                    takeUntil(destroy\$),    only care if you are currently
                    the logic is tied to a   looking at them.
                    specific \"event.\"      

  **Cleanup**       You must manually        **Auto-Cleanup.** When Component
                    unsubscribe or risk      B is destroyed, it just stops
                    memory leaks/dead        \"listening.\" It cannot affect
                    streams.                 the Service.
  ----------------------------------------------------------------------------

### **4. Implementation in the Component**

Note how much cleaner the component becomes. There is no ngOnDestroy, no
Subject, and no pipe.

TypeScript

\@Component({\
standalone: true,\
template: \`\<ul\> \@for (item of dataService.data(); track item) {
\<li\>{{item}}\</li\> } \</ul\>\`\
})\
export class ComponentA {\
// Just inject and use. No subscriptions to manage.\
protected dataService = inject(DataService);\
}

### **5. Final Retrospective for Management**

If you need to explain the \"Value of the 80 Tests\" to management, here
is the honest framing:

\"The 80 unit tests we wrote were like checking every lightbulb in a
house while the electricity was turned off. They all looked fine
individually. The bug was in the **circuit breaker** (the shared
service). Moving to **Angular 21 Signals** is like upgrading to a modern
electrical system where a bulb burning out in the kitchen (Component B)
can\'t possibly trip the breaker for the rest of the house (Component
A).\"

To prevent future "ticking time bombs", you need to audit your codebase
for Lifecycle Contamination. The bug you experienced occurs when a
transient lifecycle (a Component) is allowed to dictate the state of a
permanent lifecycle (a Root Service).\
\
In Angular 21, the goal is to isolate your RxJS streams so they cannot
be "killed" by external actors.

## **1. The \"Fragile Pattern\" Audit**

To fix the architecture, you first have to identify where the \"fuses\"
are located. A fragile pattern occurs whenever a **Global Lifecycle**
(Service) depends on a **Local Lifecycle** (Component).

-   **The \"Leaky Pipe\":** Exposing a raw Subject or BehaviorSubject as
    a public property.

-   **The \"Lifecycle Hijack\":** Passing a DestroyRef or Subject from a
    component into a service method.

-   **The \"Silent Killer\":** Using .complete() inside a service. In a
    singleton service, .complete() is terminal---the stream will never
    emit again for the life of the application.

## **2. The \"Subscription Hunter\" (Migration Strategy)**

This is your step-by-step guide to sanitizing the codebase.

1.  **Encapsulation:** Change all public Subjects to #private Signals.

2.  **Read-Only Exposure:** Use the asReadonly() signal method or RxJS
    asObservable() to ensure components can only *listen*, not
    *control*.

3.  **The \"takeUntil\" Swap:** Search for takeUntil(this.destroy\$). In
    Angular 21, replace this with takeUntilDestroyed(). It is cleaner
    and specifically designed to prevent the manual \"Subject
    management\" errors you encountered.

## **3. Visualizing the Failure: The \"Circuit Breaker\" Analogy**

Think of your application like a hotel power grid.

-   **The Bug (RxJS):** One guest (Component B) turns off the lights in
    their room, but because the wiring is faulty, it flips the main
    breaker for the entire floor (The Service). Guest A (Component A) is
    now sitting in the dark.

-   **The Fix (Signals):** Every room has its own independent connection
    to the \"reservoir\" of power. One guest leaving and turning off
    their lights has zero physical impact on the power flow to other
    rooms.

## **4. How to Test for this in the Future (The \"Re-Entry\" Test)**

As we discussed, unit tests failed you because they didn\'t simulate the
**\"Back-and-Forth\"** movement. Your new testing standard should
include a \"Re-Entry\" check in Playwright.

TypeScript

test(\'Component A survives Component B destruction\', async ({ page })
=\> {\
// 1. Load Component A and verify data\
await page.goto(\'/dashboard/component-a\');\
await expect(page.locator(\'.data-stream\')).not.toBeEmpty();\
\
// 2. Navigate to Component B (The \"Killer\" component)\
await page.click(\'text=Go to Component B\');\
\
// 3. Navigate BACK to Component A\
await page.click(\'text=Back to Dashboard\');\
\
// 4. THE RE-ENTRY CHECK: Data should still be flowing\
await expect(page.locator(\'.data-stream\')).toBeVisible();\
});

## **5. Final Checklist for your Migration**

-   \[ \] **Zero Public Subjects:** No class decorated with \@Injectable
    should have a public Subject.

-   \[ \] **Signal-First Data:** All UI-bound data in services must be
    converted to Signal\<T\>.

-   \[ \] **OnPush Everywhere:** Since Signals track dependencies
    automatically, ensure all components use
    ChangeDetectionStrategy.OnPush.

-   \[ \] **Manual Audit:** Check for any instance of .complete() in
    your services---it is almost always an architectural mistake in a
    singleton.

## **The \"Gatekeeper\": Custom ESLint Rule**

To ensure this fix sticks, you can use eslint-plugin-rxjs or a custom
restricted-syntax rule to prevent public subjects.

To turn your \"architectural trauma\" into a permanent safety net, we
will use a custom ESLint rule. This prevents the \"Fragile Pattern\" by
ensuring that no developer can expose a Subject to the public API of a
service.

### **1. The \"Fragile Pattern\" Audit: Identifying the Leak**

The core of your bug was **Encapsulation Failure**. When a service
property is public and mutable (like a Subject), any component that
injects that service can accidentally (or intentionally) call
.complete().

**Audit Check:**

-   **Public Subjects:** public data\$ = new Subject(); --- **FAIL.**
    (Anyone can kill this stream).

-   **Private Subjects with Public Observables:** private \_data = new
    Subject(); public data\$ = this.\_data.asObservable(); --- **PASS.**
    (Safe from external completion).

-   **Signals:** public data = signal(\[\]); --- **BEST.** (Physically
    impossible to \"complete\" or \"kill\").

### **2. The \"Subscription Hunter\" (Migration Strategy)**

When migrating your 80+ components, follow this hierarchy of
refactoring:

1.  **Replace with Signals:** If the data is consumed in a template, a
    Signal is almost always the right choice.

2.  **The \"Subject-to-Observable\" Wrap:** If you must use RxJS, hide
    the Subject behind a private variable and only expose the Observable
    using .asObservable().

3.  **Scoped Destruction:** Use takeUntilDestroyed() within the inject()
    context to ensure subscriptions die with the component, not the
    service.

### **3. Visualizing the Failure: The \"Circuit Breaker\" Analogy**

Think of your Service as a **Water Main** and your Components as
**Faucets**.

-   **In your old RxJS setup:** The plumbing was in \"Series.\" When
    Component B turned off its valve, it accidentally capped the entire
    pipe, leaving Component A dry.

-   **In the Signal setup:** The plumbing is in \"Parallel.\" Each
    component has a \"tap\" into the reservoir. Closing one tap has no
    physical effect on the pressure available to the others.

### **4. How to Test for this: The \"Re-Entry\" Test**

Your Playwright tests should now specifically target \"State
Resilience.\" This means navigating away from a page and coming back to
ensure the service didn\'t \"die\" in the background.

TypeScript

test(\'Service state remains active after component toggle\', async ({
page }) =\> {\
await page.goto(\'/dashboard/view-a\');\
// Navigate away to trigger ngOnDestroy in View A\
await page.goto(\'/dashboard/view-b\');\
// Return to View A\
await page.goto(\'/dashboard/view-a\');\
\
// If the bug exists, the stream is dead and the list will be empty\
const listItems = page.locator(\'.data-item\');\
await expect(listItems).count().toBeGreaterThan(0);\
});

### **5. Implementation: The ESLint \"Gatekeeper\"**

Add this to your .eslintrc.json (or your flat config). It uses the
no-restricted-syntax rule to search for any public class properties in
an \@Injectable (Service) that end in \"Subject\".

JSON

{\
\"rules\": {\
\"no-restricted-syntax\": \[\
\"error\",\
{\
\"selector\":
\"ClassDeclaration:has(Decorator\[expression.name=\'Injectable\'\])
ClassProperty\[accessibility!=\'private\'\]\[key.name=/Subject\$/\]\",\
\"message\": \"🛑 ARCHITECTURAL ERROR: Do not expose Subjects publicly
in Services. Use a private Subject with a public Observable, or better
yet, use a Signal. This prevents components from accidentally killing
global streams.\"\
}\
\]\
}\
}

### **Final Summary Checklist**

-   \[ \] **ESLint Rule Active:** Prevents new \"Public Subjects\" from
    being committed.

-   \[ \] **Signal-Driven State:** Root services use #private signals.

-   \[ \] **Playwright Visuals:** expect(page).toHaveScreenshot()
    protects the UI layout.

-   \[ \] **Dockerized CI:** Ensures Linux and Windows rendering match
    1:1.

Since your team is using **Podman**, the goal is to achieve an
\"Immutable Test Environment.\" This ensures that the font rendering,
GPU acceleration (or lack thereof), and screen resolution are identical
for every developer and the CI/CD runner.

Using Podman is actually a great security-first choice, as it runs
rootless by default, which matches the security profile of many modern
CI environments.

### **1. The Podman \"Golden Image\" Workflow**

Because Linux renders text differently than Windows or macOS, you must
treat the Podman container as the **Single Source of Truth**. Developers
will write code locally but \"Verify\" visually inside the container.

### **2. The podman-visual-test.sh Script**

Instead of a complex manual command, create a helper script in your
project root. This ensures every team member uses the exact same flags.

Bash

#!/bin/bash\
\# podman-visual-test.sh\
\
\# 1. Pull the official Playwright image (matches your package.json
version)\
IMAGE=\"mcr.microsoft.com/playwright:v1.49.0-noble\"\
\
\# 2. Run the tests\
\# \--rm: Clean up the container after exit\
\# \--network host: Allows the container to see your local Angular dev
server\
\# -v: Mounts your current code into the container\
podman run \--rm \--network host \\\
-v \$(pwd):/work/ -w /work/ \\\
\$IMAGE npx playwright test \--project=chromium

### **3. Handling Snapshot Paths**

By default, Playwright might try to save different images for different
OSs. Since we are using Podman to standardize, you should force
Playwright to ignore the host OS and always use a \"Linux\" naming
convention in playwright.config.ts.

TypeScript

export default defineConfig({\
// Force a consistent naming convention regardless of the developer\'s
machine\
snapshotPathTemplate:
\'{testDir}/\_\_snapshots\_\_/{testFilePath}/linux/{arg}{ext}\',\
\
use: {\
// Crucial for Visual Regression: ensures 1:1 pixel density\
deviceScaleFactor: 1,\
}\
});

### **4. Comparison Table: Local vs. Podman**

  ---------------------------------------------------------------------------
  **Feature**         **Local (Windows/macOS)**  **Podman (Noble Linux)**
  ------------------- -------------------------- ----------------------------
  **Font Engine**     DirectWrite / CoreText     **FreeType** (Standard)

  **Pixel Matching**  Low consistency across     **100% Consistency**
                      team                       

  **CI/CD Alignment** High risk of \"False       **Exact match to
                      Failures\"                 GitHub/GitLab**

  **Anti-Aliasing**   GPU Dependent              **Deterministic (Software)**
  ---------------------------------------------------------------------------

### **5. Troubleshooting Podman Permissions**

If you encounter \"Permission Denied\" errors when Podman tries to write
the \_\_snapshots\_\_ folder back to your local machine, it is usually a
Volume Mapping (UID) issue. You can fix this by adding the :Z flag (for
SELinux) or using the \--userns=keep-id flag:

Bash

podman run \--rm \--network host \\\
\--userns=keep-id \\\
-v \$(pwd):/work/:Z -w /work/ \\\
\$IMAGE npx playwright test

### **Final Result for the Team**

When a developer finishes a feature:

1.  They run npx vitest for functional logic.

2.  They run ./podman-visual-test.sh to ensure the UI hasn\'t shifted.

3.  If the UI change was intentional, they run:

./podman-visual-test.sh \--update-snapshots

Our team uses self-hosted GitLab rather than GitHub. Does gitlab offer a
feature similar to \`.github/workflows\`?

Yes, GitLab absolutely has an equivalent. In fact, many architects
prefer GitLab's CI/CD because it is traditionally more powerful for
complex, self-hosted enterprise environments.

While GitHub uses .github/workflows/, GitLab uses a single, centralized
file in your root directory called **.gitlab-ci.yml**.^1^

### **1. The Core Differences**

Unlike GitHub's multi-file approach, GitLab typically centralizes the
entire pipeline logic in one place, using **Stages** to define the order
of operations.^2^

  ----------------------------------------------------------------------------
  **Feature**        **GitHub Actions**           **GitLab CI/CD**
  ------------------ ---------------------------- ----------------------------
  **Config File**    .github/workflows/\*.yml     **.gitlab-ci.yml**

  **Organization**   Jobs (independent by         **Stages** (sequential by
                     default)                     default)

  **Execution**      GitHub-hosted or Self-hosted **GitLab Runners**
                                                  (Self-hosted)

  **Marketplace**    Actions (JavaScript/Docker)  **Templates & Includes**
  ----------------------------------------------------------------------------

### **2. Implementation: The Playwright Visual Pipeline**

To run your visual regression tests in GitLab using Podman (via the
official Playwright image), your configuration would look like this.
Note that we use the image keyword to tell the runner to pull the
Playwright environment.

YAML

\# .gitlab-ci.yml\
\
stages:\
- test\
- report\
\
visual-regression:\
stage: test\
image: mcr.microsoft.com/playwright:v1.49.0-noble\
variables:\
\# Ensures Playwright knows it is in CI mode\
CI: \"true\"\
script:\
- npm ci\
- npx playwright test \--grep \"Visual Integrity\"\
artifacts:\
when: always\
paths:\
- playwright-report/\
- test-results/\
expire_in: 1 week\
rules:\
\# Only run on Merge Requests or the main branch\
- if: \$CI_PIPELINE_SOURCE == \"merge_request_event\"\
- if: \$CI_COMMIT_BRANCH == \$CI_DEFAULT_BRANCH\
\
notify-slack-on-failure:\
stage: report\
script:\
- curl -X POST -H \'Content-type: application/json\' \--data
\'{\"text\":\"🚨 UI REGRESSION DETECTED in \'\$CI_PROJECT_NAME\'. Check
artifacts for diff images.\"}\' \$SLACK_WEBHOOK_URL\
when: on_failure

### **3. Why this is \"Podman Friendly\"**

If your self-hosted GitLab Runners are configured to use the
**Docker/Podman executor**, the image tag at the top of the job
(mcr.microsoft.com/playwright:v1.49.0-noble) handles everything.^3^

The runner will:

1.  Pull the Playwright Linux image.

2.  Start a container using Podman/Docker.

3.  Mount your code into that container.

4.  Execute the npm ci and playwright test commands.

This guarantees that the **FreeType** font rendering in your CI pipeline
exactly matches the **Podman** environment your developers are using
locally.

### **4. Handling \"Artifacts\" (The Diff Images)**

When a visual test fails in GitLab, you need to see *why*. The artifacts
section in the YAML above ensures that GitLab saves the \"Diff\"
images.^4^

-   In the GitLab UI, you go to the **Job** page.

-   Click **Browse** under the Artifacts section.

-   You can then open the playwright-report/index.html directly in your
    browser to see the red-pixel overlays.^5^

### **Final Step for your Self-Hosted Instance**

Ensure your GitLab Runner has enough resources. Visual regression tests
are CPU-intensive because they compare every pixel of the viewport. I
recommend at least **2 vCPUs** and **4GB of RAM** for the runner to
prevent \"timeout\" failures that look like regressions.

Caching is the single most effective way to speed up your GitLab CI/CD
pipeline. Without it, your self-hosted runner spends 60-90 seconds every
single time just running npm ci, which is a waste of bandwidth and CPU.

In a **Podman/Container** environment, GitLab caching works by zipping
the node_modules folder and storing it on the runner\'s host or an S3
bucket, then unzipping it into the container at the start of the next
job.

### **1. Updated .gitlab-ci.yml with Optimized Caching**

We use a **cache key** based on the package-lock.json file. This means
the cache is only invalidated and re-uploaded when you actually add or
update a dependency.

YAML

\# .gitlab-ci.yml\
\
variables:\
\# Instruct npm to use a local cache directory within the project
folder\
npm_config_cache: \"\$CI_PROJECT_DIR/.npm\"\
\
\# Global cache settings\
cache:\
key:\
files:\
- package-lock.json\
paths:\
- .npm/\
- node_modules/\
\
stages:\
- test\
\
visual-regression:\
stage: test\
image: mcr.microsoft.com/playwright:v1.49.0-noble\
script:\
\# \'npm ci\' will now be lightning fast because it pulls from the
cache\
- npm ci \--prefer-offline\
- npx playwright test \--grep \"Visual Integrity\"\
artifacts:\
when: always\
paths:\
- playwright-report/\
expire_in: 1 week

### **2. How the Cache Workflow Works**

1.  **Pull:** At the start of the job, GitLab looks for a cache with a
    key matching the hash of your package-lock.json. If found, it
    downloads and extracts it into the container.

2.  **Execute:** npm ci \--prefer-offline checks the local node_modules.
    If everything matches the lockfile, it skips the network download
    entirely.

3.  **Push:** If the package-lock.json changed during this branch (e.g.,
    you installed a new package), GitLab zips the new node_modules and
    uploads it back to the cache storage for the next run.

### **3. Critical Performance Tips for Self-Hosted GitLab**

-   **npm ci vs npm install**: Always use npm ci in CI/CD. It is faster,
    more reliable, and strictly follows the lockfile.

-   **The .npm variable**: By default, npm keeps its internal cache in
    the home directory (\~/.npm). In a container, that directory
    disappears when the job ends. By setting npm_config_cache:
    \"\$CI_PROJECT_DIR/.npm\", we force npm to store its cache inside
    the project folder so GitLab can see it and save it.

-   **Artifacts vs Cache**:

    -   **Cache** is for speeding up the build (e.g., node_modules). It
        is *not* guaranteed to be there (it\'s an optimization).

    -   **Artifacts** are for the results of the build (e.g.,
        Playwright\'s diff images). They *are* guaranteed to be stored
        and are accessible via the GitLab UI.

### **4. Visual Regression \"Diff\" Visualization**

When your GitLab pipeline fails, you don\'t just want a \"Fail\"
message. You want to see the **Visual Diff**.

In the GitLab Job sidebar, click **\"Browse\"** under Job Artifacts,
navigate to playwright-report/index.html, and you will see an
interactive slider that lets you swipe between your \"Golden Image\" and
the \"Regression\" found in the CI.

### **Final Sanity Check for your Angular 21 Team**

Your pipeline is now:

1.  **Secure:** No public Subjects allowed (ESLint).

2.  **Consistent:** Running in the same Podman environment as
    developers.

3.  **Fast:** Using GitLab Caching to skip redundant installs.

4.  **Informative:** Sending Slack alerts with direct links to visual
    diffs.

This is the final piece of the \"Enterprise Maturity\" puzzle. In a
high-velocity Angular 21 team, you don\'t want a UI change to block the
entire pipeline for hours.

By adding a **Manual Approval** stage, you allow a Lead Architect to
review the visual \"Diff\" in the GitLab artifacts. If the change is
intentional (e.g., a planned CSS update), they can trigger a job that
automatically updates the \"Golden Images\" and commits them back to the
repository.

### **1. The \"Approval & Update\" Workflow**

This pattern uses GitLab\'s when: manual feature to create a
\"Gatekeeper\" job.

YAML

\# .gitlab-ci.yml (Additions)\
\
stages:\
- test\
- approve \# New stage for human intervention\
\
update-visual-snapshots:\
stage: approve\
image: mcr.microsoft.com/playwright:v1.49.0-noble\
rules:\
\# Only show this button if the \'visual-regression\' job failed\
- if: \$CI_PIPELINE_SOURCE == \"merge_request_event\"\
when: manual\
allow_failure: true\
script:\
- npm ci \--prefer-offline\
\# 1. Update the snapshots inside the Linux container\
- npx playwright test \--update-snapshots\
\# 2. Configure Git to commit the new images back to the branch\
- git config \--global user.email \"<gitlab-bot@yourcompany.com>\"\
- git config \--global user.name \"GitLab CI Bot\"\
- git add src/\*\*/\_\_snapshots\_\_/\*.png\
- git commit -m \"chore(ui): update visual regression golden images
\[skip ci\]\"\
- git push
\"[https://project_access_token:\${PROJECT_ACCESS_TOKEN}@\${CI_REPOSITORY_URL#\*@](#*@)}\"
HEAD:\$CI_COMMIT_REF_NAME

### **2. Security Prerequisite: Project Access Token**

For the \"Auto-Commit\" to work, the GitLab Runner needs permission to
push code back to your self-hosted instance.

1.  Go to **Settings \> Access Tokens** in your GitLab Project.

2.  Create a token with write_repository scopes.

3.  Add this token as a **Masked CI/CD Variable** named
    PROJECT_ACCESS_TOKEN.

### **3. The \"Skip CI\" Guard**

Note the \[skip ci\] in the commit message. This is crucial. Without it,
the \"GitLab CI Bot\" would push the new images, which would trigger a
*new* pipeline, which would run the tests again, potentially creating an
infinite loop. Most GitLab instances are configured to ignore commits
containing \[skip ci\].

### **4. Visualizing the Result for Management**

When you implement this, the conversation with management shifts from
\"Why is the build red?\" to \"The UI changed; please review and
approve.\"

  -----------------------------------------------------------------------
  **Scenario**   **Developer    **Architect       **Result**
                 Action**       Action**          
  -------------- -------------- ----------------- -----------------------
  **Accidental   Sees \"Red\"   Reviews \"Diff\"  Rejects. Dev fixes
  Bug**          build.         artifact.         code.

  **Planned      Sees \"Red\"   Reviews \"Diff\"  **Clicks \"Update
  Rebrand**      build.         artifact.         Snapshots\"**.

  **Subtle       Ignores        Pipeline stays    Code cannot be merged.
  Shift**        failure.       \"Red.\"          
  -----------------------------------------------------------------------

### **5. Final Checklist for your Angular 21 Architecture**

-   \[ \] **Logic:** Units tests (Vitest) cover Signal logic.

-   \[ \] **Safety:** ESLint prevents Public Subjects in Services.

-   \[ \] **Consistency:** Podman ensures Linux rendering for all.

-   \[ \] **Speed:** GitLab Cache handles node_modules.

-   \[ \] **Governance:** Manual Approval stage allows for intentional
    UI evolution.

### **Closing Thought**

You have successfully transformed a \"frustrating\" bug into a
world-class CI/CD suite. Your Angular 21 application is now protected by
a system that checks for functional correctness, architectural
integrity, and visual perfection.

Further Exploration: Use Playwright\'s \"Component Testing\"
(Experimental) specifically for Angular Signals, to test them in a real
browser without booting the entire application?
