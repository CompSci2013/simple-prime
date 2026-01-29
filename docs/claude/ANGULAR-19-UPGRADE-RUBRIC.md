# Angular 18 → 19 Upgrade Failure Analysis Rubric

## Problem Summary
- **Working Branch**: `feature/angular-18-upgrade` (Angular 18 + PrimeNG 17.18.15)
- **Broken Branch**: `feature/angular-19-upgrade` (Angular 19 + PrimeNG 19.1.7-lts)
- **New Branch**: `feature/angular-19-upgrade-redux` (starting point for fix)

## Observed Issues
1. **Row expansion broken** - Expand button (`>`) no longer responds to clicks
2. **Theming/CSS degraded** - Visual appearance is "ugly" compared to working version

---

## STEP 1 FINDINGS: Git Diff Analysis (Phase 7 Complete)

### 1.1 Package.json Diff Results

| Package | Angular 18 Branch | Angular 19 Branch | Change Type |
|---------|-------------------|-------------------|-------------|
| @angular/core | ^18.2.14 | ^19.2.17 | Major upgrade |
| @angular/cdk | ^18.2.14 | ^19.2.19 | Major upgrade |
| **primeng** | **^17.18.15** | **^19.1.7-lts** | **MAJOR (17→19)** |
| **@primeng/themes** | Not present | **^21.0.2** | **NEW DEPENDENCY** |
| typescript | ~5.4.5 | ~5.8.3 | Minor upgrade |
| zone.js | ^0.14.10 | ^0.15.1 | Minor upgrade |
| Frontend version | 4.0.0 | 5.0.0 | Version bump |

**Critical Finding**: PrimeNG jumped from 17.18.15 to 19.1.7-lts (skipped v18 entirely). This is a **2-major-version jump** with significant breaking changes.

### 1.2 styles.scss Diff Results

**Before (Angular 18 branch)**:
```scss
@import "primeng/resources/themes/lara-dark-blue/theme.css";
@import "primeng/resources/primeng.css";
@import "primeicons/primeicons.css";
```

**After (Angular 19 branch)**:
```scss
/* PrimeNG 19 - Styles loaded via providePrimeNG() in app.config.ts */
/* Only primeicons CSS needs to be imported here */
@import "primeicons/primeicons.css";
```

**Critical Finding**: Legacy CSS imports were removed. Theme is now loaded via JavaScript (`providePrimeNG()`).

### 1.3 app.config.ts Diff Results

**Key Changes**:
1. `provideAnimations()` → `provideAnimationsAsync()`
2. Added `providePrimeNG()` with Lara theme preset
3. Added `@primeng/themes` import
4. Dark mode configured with `.p-dark` selector

**New Configuration**:
```typescript
providePrimeNG({
  theme: {
    preset: Lara,
    options: {
      darkModeSelector: '.p-dark',
      cssLayer: {
        name: 'primeng',
        order: 'tailwind-base, primeng, tailwind-utilities'
      }
    }
  },
  ripple: true
})
```

### 1.4 Results Table Component Diff

**Changes in HTML**:
- `domainConfig.xxx` → `domainConfig().xxx` (Signal conversion)
- Row expansion template **unchanged**: still uses `pTemplate="rowexpansion"`
- `pRowToggler` directive **unchanged**
- `expandedRowKeys` binding **unchanged**

**Changes in TS**:
- `@Input() domainConfig` → `readonly domainConfig = input.required<...>()`
- `standalone: true` removed (now default in Angular 19)
- Various type annotations added

### 1.5 Basic Results Table Component Diff

**Same pattern as Results Table**:
- Signal conversion for inputs/outputs
- `domainConfig.xxx` → `domainConfig().xxx`
- Row expansion template syntax **unchanged**

---

## STEP 1 WEB RESEARCH FINDINGS

### PrimeNG 19 Row Expansion Breaking Change (CRITICAL)

**Source**: [GitHub Issue #17319](https://github.com/primefaces/primeng/issues/17319), [Issue #17306](https://github.com/primefaces/primeng/issues/17306)

**Root Cause Identified**: In PrimeNG v19.0.2, the template name for row expansion was changed:
- **Old**: `pTemplate="rowexpansion"` OR `#expandedrow`
- **New**: `#rowexpansion` (template reference variable syntax)

**The Bug**: PrimeNG 19.0.2 expected `#rowexpansion` but documentation still referenced `#expandedrow`. This was fixed in v19.0.3.

**Current Code Uses**: `pTemplate="rowexpansion"` (directive syntax)
**PrimeNG 19 Expects**: `#expandedrow` template reference syntax

### PrimeNG 19 Theming System Changes

**Source**: [PrimeNG Migration Guide](https://primeng.org/migration/v19), [GitHub Issue #17760](https://github.com/primefaces/primeng/issues/17760)

**Key Changes**:
1. CSS files (`primeng/resources/primeng.css`, `primeng/resources/themes/*/theme.css`) are **no longer available**
2. Must use `providePrimeNG()` with theme preset
3. Dark mode requires manual `document.querySelector('html').classList.toggle('my-app-dark')`
4. PrimeNG styles don't affect page background - must add custom CSS

**Potential Issue**: The `.p-dark` selector may not be applied to the document, causing light mode to be used even with dark theme intent.

### @primeng/themes Version Mismatch

**Finding**: Package shows `@primeng/themes: ^21.0.2` but `primeng: ^19.1.7-lts`

**Concern**: Version 21 themes may not be compatible with PrimeNG 19. The themes package should match the PrimeNG major version.

---

## CONFIRMED ROOT CAUSES (Step 1 Complete)

### Issue 1: Row Expansion Not Working

**Root Cause**: Template syntax mismatch

| Aspect | Current Code | PrimeNG 19 Expects |
|--------|--------------|---------------------|
| Template | `pTemplate="rowexpansion"` | `#expandedrow` or `#rowexpansion` |
| Syntax | Directive-based | Template reference variable |

**Fix Required**: Change from:
```html
<ng-template pTemplate="rowexpansion" let-row>
```
To:
```html
<ng-template #expandedrow let-row>
```

### Issue 2: Theming/CSS Degraded

**Root Causes**:
1. **@primeng/themes version mismatch**: v21.0.2 with PrimeNG v19.1.7-lts
2. **Dark mode not applied**: `.p-dark` class may not be on `<html>` element
3. **Missing background styles**: PrimeNG themes don't style page background

**Fixes Required**:
1. Downgrade `@primeng/themes` to `^19.x.x` to match PrimeNG version
2. Ensure dark mode toggle adds `.p-dark` to document
3. Add custom CSS for page background in dark mode

---

## STEP 2 FINDINGS: Phase 2 - PrimeNG Theming Changes (Complete)

### 2.1 styles.scss Analysis

**Angular 18 Branch** (Working):
```scss
@import "primeng/resources/themes/lara-dark-blue/theme.css";
@import "primeng/resources/primeng.css";
@import "primeicons/primeicons.css";

body {
  background-color: #3c3c3c;
  color: #ffffff;
}
```

**Angular 19 Branch** (Broken):
```scss
/* PrimeNG 19 - Styles loaded via providePrimeNG() in app.config.ts */
@import "primeicons/primeicons.css";

body {
  background-color: #3c3c3c;
  color: #ffffff;
}
```

**Finding**: Legacy CSS imports correctly removed. Background styles preserved. This is correct per PrimeNG 19 migration.

### 2.2 app.config.ts Analysis

**Angular 18 Branch**:
```typescript
import { provideAnimations } from '@angular/platform-browser/animations';
// No providePrimeNG - theme loaded via CSS imports
```

**Angular 19 Branch**:
```typescript
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { providePrimeNG } from 'primeng/config';
import Lara from '@primeng/themes/lara';

providePrimeNG({
  theme: {
    preset: Lara,
    options: {
      darkModeSelector: '.p-dark',
      cssLayer: {
        name: 'primeng',
        order: 'tailwind-base, primeng, tailwind-utilities'
      }
    }
  },
  ripple: true
})
```

**Finding**: Configuration looks correct per PrimeNG 19 docs. Dark mode selector is `.p-dark`.

### 2.3 angular.json Analysis

**No changes between branches** - styles array still references only `src/styles.scss`. This is correct.

### 2.4 index.html Analysis (CRITICAL FINDING)

**Angular 18 Branch**:
```html
<body>
  <app-root></app-root>
</body>
```

**Angular 19 Branch**:
```html
<body class="p-dark">
  <app-root></app-root>
</body>
```

**CRITICAL BUG FOUND**: The `.p-dark` class is on `<body>` but PrimeNG 19 expects it on `<html>` element!

**Per PrimeNG Documentation**:
> "For user-controlled toggle, specify a class selector like `.my-app-dark` and toggle it on the **document root element**."
> ```typescript
> toggleDarkMode() {
>   document.querySelector('html').classList.toggle('my-app-dark');
> }
> ```

### 2.5 @primeng/themes Version Analysis (CRITICAL)

**NPM Registry Check** (`npm view @primeng/themes versions`):
```
19.1.5-lts
19.1.6-lts
19.1.7-lts  <-- Matches primeng version!
```

**Broken Branch Has**:
- `primeng: ^19.1.7-lts`
- `@primeng/themes: ^21.0.2` ← **VERSION MISMATCH!**

**Correct Version**: `@primeng/themes: ^19.1.7-lts` (should match primeng version)

---

## STEP 2 WEB RESEARCH FINDINGS

### PrimeNG 19 Theming Architecture

**Source**: [PrimeNG v19 Theming](https://v19.primeng.org/theming), [PrimeNG Configuration](https://primeng.org/configuration)

**Design Token System**:
1. **Primitive Tokens**: Context-free color palettes (blue-50 to blue-900)
2. **Semantic Tokens**: Context-aware tokens (primary.color)
3. **Component Tokens**: Component-specific (button.background)

**Built-in Presets**: Aura, Material, Lara, Nora

### Dark Mode Implementation

**Source**: [PrimeNG Theming](https://primeng.org/theming)

**Key Requirements**:
1. `darkModeSelector` must specify class selector (e.g., `.p-dark`)
2. Class **MUST** be on `<html>` element, not `<body>`
3. Application must manually add background styles (PrimeNG doesn't style page background)

**Correct Implementation**:
```html
<html class="p-dark">
```

**Incorrect (Current)**:
```html
<body class="p-dark">
```

### Version Compatibility

**Source**: [npm @primeng/themes](https://www.npmjs.com/package/@primeng/themes), [PrimeNG Migration v20](https://primeng.org/migration/v20)

**For PrimeNG v19.x**: Use `@primeng/themes` v19.x (versions should match)
**For PrimeNG v20+**: Migrate to `@primeuix/themes` package

**Compatibility Matrix**:
| PrimeNG Version | Themes Package | Correct Version |
|-----------------|----------------|-----------------|
| 19.1.7-lts | @primeng/themes | 19.1.7-lts |
| 20.x | @primeuix/themes | 20.x |
| 21.x | @primeuix/themes | 21.x |

### CSS Layer Configuration

**Source**: [GitHub Issue #17760](https://github.com/primefaces/primeng/issues/17760)

**Issue**: Tailwind CSS can conflict with PrimeNG theme styling.

**Solution**: Explicit CSS layer ordering:
```typescript
cssLayer: {
  name: 'primeng',
  order: 'tailwind-base, primeng, tailwind-utilities'
}
```

**Note**: This project doesn't use Tailwind, so the cssLayer config may be unnecessary.

---

## CONFIRMED ROOT CAUSES (Step 2 Complete)

### Issue 2: Theming/CSS Degraded - ROOT CAUSES CONFIRMED

| Root Cause | Severity | Fix Required |
|------------|----------|--------------|
| **@primeng/themes version mismatch** | CRITICAL | Change `^21.0.2` → `^19.1.7-lts` |
| **Dark mode class on wrong element** | CRITICAL | Move `p-dark` from `<body>` to `<html>` |
| **Unnecessary cssLayer config** | LOW | Remove Tailwind ordering (not used) |

### Complete Fix for Theming

**1. Fix package.json**:
```json
"@primeng/themes": "^19.1.7-lts"
```

**2. Fix index.html**:
```html
<html lang="en" class="p-dark">
<head>...</head>
<body>
  <app-root></app-root>
</body>
</html>
```

**3. Simplify app.config.ts** (optional):
```typescript
providePrimeNG({
  theme: {
    preset: Lara,
    options: {
      darkModeSelector: '.p-dark'
    }
  },
  ripple: true
})
```

---

## STEP 3 FINDINGS: Phase 3/4 - Table Components Analysis (Complete)

### 3.1 Results Table Component Analysis

**Row Expansion Template (Broken Branch)**:
```html
<ng-template pTemplate="rowexpansion" let-row>
  <tr>
    <td [attr.colspan]="domainConfig().tableConfig.columns.length + 1">
      <div class="row-expansion">...</div>
    </td>
  </tr>
</ng-template>
```

**PROBLEM CONFIRMED**: Uses `pTemplate="rowexpansion"` directive syntax which is deprecated in PrimeNG 19.

**pRowToggler Directive**: Still present and correct
```html
<button type="button" pButton pRipple [pRowToggler]="row"
  class="p-button-text p-button-rounded p-button-plain"
  [icon]="expanded ? 'pi pi-chevron-down' : 'pi pi-chevron-right'">
</button>
```

**expandedRowKeys Binding**: Still present and correct
```html
[expandedRowKeys]="expandedRows"
```

### 3.2 Basic Results Table Component Analysis

**Same Issue Identified**:
```html
<ng-template pTemplate="rowexpansion" let-row>
```

Uses the deprecated `pTemplate="rowexpansion"` syntax.

### 3.3 SCSS Files Analysis

**No changes between branches** for:
- `results-table.component.scss`
- `basic-results-table.component.scss`

CSS is not the cause of the row expansion issue.

### 3.4 ui-kit.module.ts Analysis

**No changes between branches** - TableModule imports unchanged.

---

## STEP 3 WEB RESEARCH FINDINGS

### PrimeNG 19 Row Expansion Breaking Change History

**Source**: [GitHub Issue #17319](https://github.com/primefaces/primeng/issues/17319), [Issue #17306](https://github.com/primefaces/primeng/issues/17306), [Issue #17473](https://github.com/primefaces/primeng/issues/17473)

**Timeline of Changes**:
| Version | Template Syntax | Status |
|---------|-----------------|--------|
| PrimeNG 17.x | `pTemplate="rowexpansion"` | ✅ Works |
| PrimeNG 18.x | `#expandedrow` | ✅ Works |
| PrimeNG 19.0.1 | `#expandedrow` | ✅ Works |
| PrimeNG 19.0.2+ | `#rowexpansion` | ✅ Works |

**CRITICAL**: The `pTemplate="rowexpansion"` directive syntax **no longer works** in PrimeNG 18+.

### Template Reference Variable Evolution

**Issue #17319** (v19.0.2 breaking change):
> "I have changed my template-reference-id to `#rowexpansion` and now is expand working again with the latest version 19.0.2"

**Issue #17306** (v19.0.0 initial breakage):
> "Changing rowexpansion to expandedrow fixed it"

**Issue #17473** (v18/v19 clarification):
> "Change the template name from `pTemplate="rowexpansion"` to `#expandedrow`"

### Current Official Documentation

**Source**: [PrimeNG Table Documentation](https://primeng.org/table)

**Official Syntax** (PrimeNG 19.1.7-lts):
```html
<ng-template #expandedrow let-product>
  <tr>
    <td colspan="7">
      <!-- expanded content -->
    </td>
  </tr>
</ng-template>
```

### Resolution Strategy

**For PrimeNG 19.1.7-lts**, test **both** template names:
1. `#expandedrow` - Per official documentation
2. `#rowexpansion` - Per GitHub issue resolution

**Recommended Approach**: Try `#expandedrow` first (matches official docs), fallback to `#rowexpansion` if needed.

---

## CONFIRMED ROOT CAUSES (Step 3 Complete)

### Issue 1: Row Expansion Not Working - FINAL DIAGNOSIS

| Component | Current Code | Fix Required |
|-----------|--------------|--------------|
| results-table.component.html | `pTemplate="rowexpansion"` | `#expandedrow` |
| basic-results-table.component.html | `pTemplate="rowexpansion"` | `#expandedrow` |

**Root Cause**: PrimeNG 19 dropped support for the `pTemplate` directive syntax for row expansion. Must use template reference variable syntax.

**Complete Fix**:
```html
<!-- OLD (PrimeNG 17) - NO LONGER WORKS -->
<ng-template pTemplate="rowexpansion" let-row>

<!-- NEW (PrimeNG 19) - USE THIS -->
<ng-template #expandedrow let-row>
```

### pRowToggler Directive Status

**Status**: ✅ **STILL WORKS** - No changes needed to pRowToggler directive.

### expandedRowKeys Status

**Status**: ✅ **STILL WORKS** - No changes needed to expandedRowKeys binding.

---

## STEP 4 FINDINGS: Final Verification (Complete)

### 4.1 pTemplate Usage Audit

**Files Using pTemplate Directive**:
```
query-control.component.html:    pTemplate="header", pTemplate="footer"
results-table.component.html:    pTemplate="caption", pTemplate="header", pTemplate="body",
                                 pTemplate="rowexpansion" ❌, pTemplate="emptymessage", pTemplate="loadingbody"
basic-results-table.component.html: pTemplate="caption", pTemplate="header", pTemplate="body",
                                     pTemplate="rowexpansion" ❌, pTemplate="emptymessage", pTemplate="loadingbody"
base-picker.component.html:      pTemplate="caption", pTemplate="header", pTemplate="body",
                                 pTemplate="emptymessage", pTemplate="loadingbody"
statistics-panel.component.html: pTemplate="header"
```

**Finding**: Only `pTemplate="rowexpansion"` is broken. All other pTemplate usages (header, body, caption, footer, emptymessage, loadingbody) **still work** in PrimeNG 19.

**Source**: [PrimeNG Table Documentation](https://primeng.org/table) confirms both `pTemplate="header"` and `#header` syntax are supported.

### 4.2 Files Requiring Changes

| File | Change Required | Priority |
|------|-----------------|----------|
| `frontend/package.json` | `@primeng/themes: ^21.0.2` → `^19.1.7-lts` | CRITICAL |
| `frontend/src/index.html` | Move `p-dark` from `<body>` to `<html>` | CRITICAL |
| `results-table.component.html` | `pTemplate="rowexpansion"` → `#expandedrow` | CRITICAL |
| `basic-results-table.component.html` | `pTemplate="rowexpansion"` → `#expandedrow` | CRITICAL |
| `frontend/src/app/app.config.ts` | Remove unnecessary cssLayer config | LOW |

---

## FINAL IMPLEMENTATION CHECKLIST

### Fix 1: Package Version Mismatch (CRITICAL)

**File**: `frontend/package.json`

**Change**:
```json
// BEFORE (broken)
"@primeng/themes": "^21.0.2"

// AFTER (fixed)
"@primeng/themes": "^19.1.7-lts"
```

**Action**: Run `npm install` after making this change.

### Fix 2: Dark Mode Selector Placement (CRITICAL)

**File**: `frontend/src/index.html`

**Change**:
```html
<!-- BEFORE (broken) -->
<html lang="en">
<body class="p-dark">

<!-- AFTER (fixed) -->
<html lang="en" class="p-dark">
<body>
```

### Fix 3: Row Expansion Template - Results Table (CRITICAL)

**File**: `frontend/src/framework/components/results-table/results-table.component.html`

**Change**:
```html
<!-- BEFORE (broken) -->
<ng-template pTemplate="rowexpansion" let-row>

<!-- AFTER (fixed) -->
<ng-template #expandedrow let-row>
```

### Fix 4: Row Expansion Template - Basic Results Table (CRITICAL)

**File**: `frontend/src/framework/components/basic-results-table/basic-results-table.component.html`

**Change**:
```html
<!-- BEFORE (broken) -->
<ng-template pTemplate="rowexpansion" let-row>

<!-- AFTER (fixed) -->
<ng-template #expandedrow let-row>
```

### Fix 5: Remove Unnecessary CSS Layer Config (LOW PRIORITY)

**File**: `frontend/src/app/app.config.ts`

**Change**:
```typescript
// BEFORE (includes Tailwind config, project doesn't use Tailwind)
providePrimeNG({
  theme: {
    preset: Lara,
    options: {
      darkModeSelector: '.p-dark',
      cssLayer: {
        name: 'primeng',
        order: 'tailwind-base, primeng, tailwind-utilities'
      }
    }
  },
  ripple: true
})

// AFTER (simplified)
providePrimeNG({
  theme: {
    preset: Lara,
    options: {
      darkModeSelector: '.p-dark'
    }
  },
  ripple: true
})
```

---

## TEST PLAN

### Pre-Implementation
1. ✅ Checkout `feature/angular-19-upgrade-redux` branch
2. ✅ Verify branch is based on `feature/angular-18-upgrade`

### Post-Implementation
1. Run `npm install` to update dependencies
2. Build the project and verify no compilation errors
3. Start dev server
4. **Test Row Expansion**:
   - Navigate to a page with Results Table
   - Click the expand button (chevron)
   - Verify row expands showing details
   - Verify collapse works
5. **Test Theming**:
   - Verify dark theme is applied (dark background, light text)
   - Verify PrimeNG components have proper styling
   - Compare visual appearance to Angular 18 branch

---

## SUMMARY: ROOT CAUSES AND FIXES

| Issue | Root Cause | Fix |
|-------|------------|-----|
| **Row Expansion Broken** | `pTemplate="rowexpansion"` deprecated | Use `#expandedrow` template reference |
| **Theming Degraded** | @primeng/themes v21 with PrimeNG v19 | Match versions: `^19.1.7-lts` |
| **Dark Mode Not Applied** | `p-dark` class on `<body>` | Move to `<html>` element |

---

## Analysis Rubric (Original)

### Phase 1: Package Version Diff

| Check | Files | Purpose |
|-------|-------|---------|
| 1.1 | `frontend/package.json` | Compare Angular, PrimeNG, @primeng/themes versions |
| 1.2 | `frontend/package-lock.json` | Identify transitive dependency changes |

**Key Questions**:
- What PrimeNG version is in each branch? **ANSWERED: 17.18.15 → 19.1.7-lts**
- Was `@primeng/themes` added? **ANSWERED: Yes, v21.0.2 (version mismatch!)**
- Did `primeng` CSS structure change? **ANSWERED: Yes, CSS imports removed**

---

### Phase 2: PrimeNG Theming Changes

| Check | Files | Purpose |
|-------|-------|---------|
| 2.1 | `frontend/src/styles.scss` | Compare global CSS imports |
| 2.2 | `frontend/src/app/app.config.ts` | Check for `providePrimeNG()` configuration |
| 2.3 | `frontend/angular.json` | Compare `styles` array in build config |

**Key Questions**:
- Were legacy CSS imports removed? **ANSWERED: Yes**
- Was `providePrimeNG()` with theme preset added? **ANSWERED: Yes, with Lara preset**
- Is dark mode selector configured correctly? **NEEDS VERIFICATION**

---

### Phase 3: Results Table Component Analysis

| Check | Files | Purpose |
|-------|-------|---------|
| 3.1 | `frontend/src/framework/components/results-table/results-table.component.html` | Compare row expansion template syntax |
| 3.2 | `frontend/src/framework/components/results-table/results-table.component.ts` | Check for API changes in expansion logic |
| 3.3 | `frontend/src/framework/components/results-table/results-table.component.scss` | Compare component-level styles |

**Key Questions**:
- Did `pTemplate="rowexpansion"` syntax change? **ANSWERED: Still uses old syntax - NEEDS UPDATE**
- Did `expandedRowKeys` binding change? **ANSWERED: No change**
- Was `pRowToggler` directive modified? **NEEDS VERIFICATION**
- Did the expansion icon CSS class change? **NEEDS VERIFICATION**

---

### Phase 4: Basic Results Table Component Analysis

| Check | Files | Purpose |
|-------|-------|---------|
| 4.1 | `frontend/src/framework/components/basic-results-table/basic-results-table.component.html` | Compare row expansion template |
| 4.2 | `frontend/src/framework/components/basic-results-table/basic-results-table.component.ts` | Check expansion toggle logic |
| 4.3 | `frontend/src/framework/components/basic-results-table/basic-results-table.component.scss` | Compare styles |

**Key Questions**:
- Same as Phase 3 - **SAME ISSUES IDENTIFIED**

---

### Phase 5: PrimeNG Module/Import Changes

| Check | Files | Purpose |
|-------|-------|---------|
| 5.1 | `frontend/src/framework/ui-kit/ui-kit.module.ts` | Compare PrimeNG module imports |
| 5.2 | Any component importing `TableModule` | Check for API changes |

**Key Questions**:
- Did `TableModule` exports change? **NEEDS VERIFICATION**
- Were any directives renamed or removed? **NEEDS VERIFICATION**

---

### Phase 6: Angular Template Syntax Changes

| Check | Files | Purpose |
|-------|-------|---------|
| 6.1 | All `.html` files with `<p-table>` | Compare table template syntax |
| 6.2 | Check `pTemplate` directives | Look for renamed templates |

**Key Questions**:
- Did Angular 19 deprecate any template syntax? **No**
- Did PrimeNG 19 rename template selectors? **ANSWERED: Yes - rowexpansion template**

---

## Web Research Sources

- [PrimeNG Migration v19](https://primeng.org/migration/v19)
- [GitHub Issue #17306 - Table row expansion not working in v19](https://github.com/primefaces/primeng/issues/17306)
- [GitHub Issue #17319 - Expand/collapse stopped working v19.0.1 → v19.0.2](https://github.com/primefaces/primeng/issues/17319)
- [GitHub Issue #17760 - Themes not working in v19](https://github.com/primefaces/primeng/issues/17760)
- [PrimeNG Theming Documentation](https://primeng.org/theming)
- [PrimeNG Table Documentation](https://primeng.org/table)

---

## Execution Order

1. ✅ **COMPLETE** - Run Phase 7 git diffs first (quick overview)
2. ✅ **COMPLETE** - Examine Phase 2 (theming) for CSS issues
3. ✅ **COMPLETE** - Examine Phase 3/4 (table components) for expansion issues
4. ✅ **COMPLETE** - Deep dive into specific files identified (Final verification)

**ALL ANALYSIS STEPS COMPLETE** - Ready for implementation.

---

## Web Research Sources (All Steps)

### Step 1 Sources
- [PrimeNG Migration v19](https://primeng.org/migration/v19)
- [GitHub Issue #17306 - Table row expansion not working in v19](https://github.com/primefaces/primeng/issues/17306)
- [GitHub Issue #17319 - Expand/collapse stopped working v19.0.1 → v19.0.2](https://github.com/primefaces/primeng/issues/17319)
- [GitHub Issue #17760 - Themes not working in v19](https://github.com/primefaces/primeng/issues/17760)
- [PrimeNG Theming Documentation](https://primeng.org/theming)
- [PrimeNG Table Documentation](https://primeng.org/table)

### Step 2 Sources
- [PrimeNG v19 Theming](https://v19.primeng.org/theming)
- [PrimeNG Configuration](https://primeng.org/configuration)
- [npm @primeng/themes](https://www.npmjs.com/package/@primeng/themes)
- [PrimeNG Migration v20](https://primeng.org/migration/v20)
- [GitHub Issue #17760 - Themes not working in v19](https://github.com/primefaces/primeng/issues/17760)

### Step 3 Sources
- [GitHub Issue #17319 - Expand/collapse stopped working v19.0.1 → v19.0.2](https://github.com/primefaces/primeng/issues/17319)
- [GitHub Issue #17306 - Table row expansion not working in v19](https://github.com/primefaces/primeng/issues/17306)
- [GitHub Issue #17473 - Table expandable row does not work in v18/v19](https://github.com/primefaces/primeng/issues/17473)
- [PrimeNG Table Documentation](https://primeng.org/table)
- [PrimeNG v19 Table Documentation](https://v19.primeng.org/table)

### Step 4 Sources
- [PrimeNG Table Documentation](https://primeng.org/table) - Confirmed pTemplate syntax still works for header/body/caption
- Local codebase grep analysis

---

**Created**: 2026-01-01 (Session 67)
**Updated**: 2026-01-01 - All 4 Steps Complete, ready for implementation
