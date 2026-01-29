# Quick Start: Module Architecture Fix

**Time to complete**: ~30 minutes
**Complexity**: Low
**Risk**: Very Low

---

## TL;DR - Just the Steps

### Step 1: Fix the Code (5 minutes)

Open: `frontend/src/framework/framework.module.ts`

**Find** (lines 43-52):
```typescript
@NgModule({
  declarations: [...],
  imports: [...],
  exports: [
    BasePickerComponent,
    ResultsTableComponent,
    QueryControlComponent,
    BaseChartComponent,
    StatisticsPanelComponent,
    CommonModule,      // ← DELETE THIS LINE
    FormsModule,       // ← DELETE THIS LINE
    PrimengModule      // ← DELETE THIS LINE
  ]
})
```

**Replace with**:
```typescript
exports: [
  BasePickerComponent,
  ResultsTableComponent,
  QueryControlComponent,
  BaseChartComponent,
  StatisticsPanelComponent
]
```

**Save the file.**

---

### Step 2: Create Validation Script (10 minutes)

Create new file: `frontend/scripts/check-module-reexports.js`

Copy the entire content from [this section](./docs/claude/MODULE-ARCHITECTURE-AUDIT.md#method-4-automated-script-recommended-for-cicd) of the audit document.

**Save the file.**

---

### Step 3: Add npm Scripts (5 minutes)

Open: `frontend/package.json`

Find the `"scripts"` section and add:
```json
"check:modules": "node scripts/check-module-reexports.js frontend/src",
"check:modules:strict": "node scripts/check-module-reexports.js frontend/src || exit 1",
```

**Save the file.**

---

### Step 4: Verify Fix Works (10 minutes)

Run these commands in sequence:

```bash
# 1. Check for violations (should show ✅ success)
npm run check:modules

# 2. Build the app (should succeed)
ng build --configuration development

# 3. Start the app (should load without errors)
npm start -- --host 0.0.0.0 --port 4205
#   Then navigate to: http://192.168.0.244:4205
#   Verify: Home page loads, domain selector visible
#   Then: Press Ctrl+C to stop

# 4. Run E2E tests (should show 33/33 passing)
npm run test:e2e

# 5. (Optional) Regenerate docs
npm run docs:gen
```

**All commands should succeed with no errors.**

---

## That's It!

You've successfully:
- ✅ Removed the module re-export anti-pattern
- ✅ Created automated validation
- ✅ Verified the fix works
- ✅ Prevented future regressions

---

## What Changed (Technical Details)

**Before**:
- `FrameworkModule` re-exported `CommonModule`, `FormsModule`, `PrimengModule`
- Downstream modules got these "for free" (transitive)
- Hidden dependency: Modules didn't know they depended on PrimeNG
- Risk: Refactoring would break code unexpectedly

**After**:
- `FrameworkModule` only exports components it declares
- Downstream modules explicitly import what they need
- Clear dependencies: Everyone knows what they depend on
- Safe: Can refactor without surprises

---

## If Something Goes Wrong

### "ng build" fails
- Check syntax in `framework.module.ts`
- Verify you only removed the 3 lines (CommonModule, FormsModule, PrimengModule)
- Check for stray commas

### "npm run check:modules" still shows violations
- Verify you deleted ALL 3 re-export lines
- Run: `grep -A 20 "exports:" frontend/src/framework/framework.module.ts`
- Should NOT see CommonModule, FormsModule, or PrimengModule

### App doesn't load
- Check browser console for errors (F12 → Console tab)
- Verify `ng build` succeeded
- Try hard refresh: Ctrl+Shift+R

### E2E tests fail
- This shouldn't happen (changes are exports-only)
- Try running tests again (may be flaky)
- Check for compilation errors: `ng build --configuration development`

---

## Next Steps (Optional)

Want to go further? See [SUGGESTED-ITEMS-CHECKLIST.md](./SUGGESTED-ITEMS-CHECKLIST.md) for:
- Pre-commit hooks (prevent regression)
- Circular dependency detection
- Documentation updates

---

## Files You Created/Modified

1. **Modified**: `frontend/src/framework/framework.module.ts` - Removed re-exports
2. **Modified**: `frontend/package.json` - Added npm scripts
3. **Created**: `frontend/scripts/check-module-reexports.js` - Validation script

---

## Related Reading

- 📖 [Full Audit Report](./docs/claude/MODULE-ARCHITECTURE-AUDIT.md)
- 📖 [Module Guidelines](./docs/ANGULAR-MODULE-GUIDELINES.md)
- 📋 [Detailed Checklist](./SUGGESTED-ITEMS-CHECKLIST.md)
- 📋 [Full Summary](./ARCHITECTURE-AUDIT-SUMMARY.md)

---

## Questions?

Refer to the full audit report: `docs/claude/MODULE-ARCHITECTURE-AUDIT.md`

**All set?** Start with Step 1 above! ✨
