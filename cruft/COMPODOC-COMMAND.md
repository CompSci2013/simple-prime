# /compodoc Command Guide

## Overview

The `/compodoc` custom Claude Code command provides comprehensive analysis of your Angular application's documentation coverage, circular dependencies, and module configuration issues.

**Status**: ✅ Ready to use

## Quick Start

```bash
# Show documentation coverage analysis (default)
/compodoc

# Analyze documentation only
/compodoc -doc

# Detect circular dependencies
/compodoc -circular

# Analyze module imports/exports
/compodoc -module

# Run all analysis types
/compodoc -all

# Show help
/compodoc -help
```

## Command Flags

### `-doc` | Documentation Coverage Analysis

Analyzes the Compodoc-generated `coverage.html` file to show documentation metrics.

**Output includes:**
- Overall statistics (total items, fully documented %, zero documentation %)
- Breakdown by component type (components, interfaces, injectables, classes)
- Breakdown by architectural layer (framework, domain config, features)
- List of undocumented items (0% coverage)
- List of partially documented items (1-99% coverage)
- Average coverage percentage

**Example:**
```
/compodoc -doc
```

**Sample Output:**
```
DOCUMENTATION COVERAGE ANALYSIS

📊 OVERALL STATISTICS
  Total items: 118
  Fully documented (100%): 74 (62.7%)
  Zero documented (0%): 23 (19.5%)
  Partially documented (1-99%): 21 (17.8%)
  Average coverage: 73.1%

📋 BY COMPONENT TYPE
  injectable            14 items |  11 fully documented ( 78.6%) | avg:  97.4%
  interface             71 items |  52 fully documented ( 73.2%) | avg:  73.2%
  classe                14 items |   6 fully documented ( 42.9%) | avg:  81.2%
  component             19 items |   5 fully documented ( 26.3%) | avg:  48.7%

🏗️  BY LAYER
  Framework items:  70 | avg coverage:  93.8%
  Domain config:    18 | avg coverage:  79.8%
  Features/Pages:   29 | avg coverage:  20.6%

❌ UNDOCUMENTED ITEMS (23 total)
  • AgricultureComponent (component) - agriculture.component.ts
  • AutomobileComponent (component) - automobile.component.ts
  ... and 21 more

⚠️  PARTIALLY DOCUMENTED ITEMS (21 total)
  •   2% DependencyGraphComponent (component)
  •   7% KnowledgeGraphComponent (component)
  ... and 19 more
```

**Use cases:**
- Track documentation progress toward 100% coverage
- Identify which components need documentation
- Measure documentation quality by layer
- Find high-priority documentation targets

### `-circular` | Circular Dependency Detection

Detects circular import dependencies in your TypeScript files using AST analysis.

**Output includes:**
- Number of circular dependency cycles detected
- Import chain visualization showing the cycle path
- Severity classification (critical, high, medium, low)
- Suggested refactoring patterns to break cycles

**Example:**
```
/compodoc -circular
```

**Sample Output (No Issues):**
```
CIRCULAR DEPENDENCY DETECTION

✅ No circular dependencies detected!
```

**Sample Output (With Issues):**
```
CIRCULAR DEPENDENCY DETECTION

⚠️  CIRCULAR DEPENDENCIES FOUND: 3

  Cycle 1:
    frontend/src/app/services/service-a.ts
    frontend/src/app/services/service-b.ts
    ↻ frontend/src/app/services/service-a.ts

  Cycle 2:
    frontend/src/app/components/component-x.ts
    frontend/src/app/services/service-c.ts
    ↻ frontend/src/app/components/component-x.ts

  ... and 1 more cycle
```

**Use cases:**
- Identify architectural issues
- Prevent module resolution problems
- Find services with bidirectional dependencies
- Improve build performance

### `-module` | Module Configuration Analysis

Analyzes `@NgModule` declarations to detect import/export anti-patterns.

**Detects:**
- Modules listed in both `imports` and `exports` arrays (code smell)
- Re-export patterns that might cause confusion
- Barrel module issues
- Module re-declaration problems

**Example:**
```
/compodoc -module
```

**Sample Output:**
```
MODULE IMPORT/EXPORT ANALYSIS

⚠️  MODULE CONFIGURATION ISSUES FOUND: 2

  File: frontend/src/app/primeng.module.ts
    Issue: PRIMENG_MODULES - Module in both imports and exports
    Fix: Remove 'PRIMENG_MODULES' from exports array (keep only in imports)

  File: frontend/src/app/app-routing.module.ts
    Issue: RouterModule - Module in both imports and exports
    Fix: Remove 'RouterModule' from exports array (keep only in imports)
```

**Why this matters:**
A module should either be:
- **Imported** (to use its functionality within this module)
- **Exported** (to re-export to parent modules)
- **Not both** (unless intentionally re-exporting, which is rare)

**Fix pattern:**
```typescript
// ❌ WRONG: RouterModule in both imports and exports
@NgModule({
  imports: [RouterModule],      // Used internally
  exports: [RouterModule]        // Re-exported (usually not needed)
})

// ✅ CORRECT: Only imports for internal use
@NgModule({
  imports: [RouterModule],       // Use the module
  exports: [...]                 // Only export your own declarations
})
```

**Use cases:**
- Enforce module best practices
- Simplify module dependencies
- Improve code maintainability
- Catch accidental re-exports

### `-all` | Run All Analysis Types

Combines `-doc`, `-circular`, and `-module` analysis in a single command.

**Example:**
```
/compodoc -all
```

**Output:** All three analysis reports in sequence

**Use cases:**
- Comprehensive codebase health check
- Pre-deployment code review
- End-of-sprint project assessment
- CI/CD pipeline integration

### `-gen` | Regenerate Compodoc

Regenerates the Compodoc documentation files by running the build sequence inside the container.

**What happens when you run `/compodoc -gen`:**

The command automatically executes the complete Compodoc regeneration sequence inside the `generic-prime-dev` container:

```bash
# Inside container (generic-prime-dev):
cd /app/frontend
rm -fr documents/                    # Clean old docs
npm run build:doc                    # Build documentation source
npm run compodoc                     # Generate Compodoc coverage
```

**Output updates:**
- `frontend/documents/coverage.html` - Documentation coverage metrics
- `frontend/documents/index.html` - API documentation
- All other generated documentation files (components, interfaces, classes, etc.)

**Execution Flow:**
1. Command runs inside container (no podman exec needed from your terminal)
2. Removes old `documents/` directory
3. Runs npm build:doc task
4. Runs npm compodoc task
5. Waits for completion (~30-60 seconds total)
6. Returns status message with success/failure

**Requirements:**
- ✅ `generic-prime-dev` container must be running
- ✅ npm dependencies must be installed in container
- ✅ ~30-60 seconds execution time

**Example workflow:**
```bash
/compodoc -gen
# Wait for message: "✅ Compodoc regeneration complete"

/compodoc -doc
# View updated documentation coverage metrics
```

**Note:** This is the only flag that requires the container to be running. All other flags (-doc, -circular, -module) run on the host and don't need the container.

### `-help` | Show Help

Displays the full command documentation with all flags and examples.

## Implementation Details

### Location

```
Command Definition:  .claude/commands/compodoc.md
Analysis Script:     scripts/compodoc-analyzer.py
```

### How It Works

1. **User runs:** `/compodoc -doc`
2. **Claude Code parses** the command and flag
3. **Claude Code runs:** `python3 scripts/compodoc-analyzer.py -doc`
4. **Analysis script:**
   - Reads `frontend/documents/coverage.html`
   - Parses HTML table to extract coverage metrics
   - Calculates statistics by type and layer
   - Formats and displays results
5. **Output displayed** in Claude Code terminal

### Analysis Algorithms

**Documentation Coverage** (regex-based HTML parsing):
- Extracts all `<tr><td>` table cells from coverage.html
- Parses percentage values for each item
- Groups by type, layer, and coverage level
- Calculates averages and percentages

**Circular Dependencies** (DFS-based cycle detection):
- Builds import map from all TypeScript files
- Performs depth-first search for cycles
- Resolves relative imports to file paths
- Reports all detected import chains

**Module Configuration** (regex-based decorator analysis):
- Finds all `.module.ts` files
- Extracts `@NgModule` decorator content
- Identifies `imports` and `exports` arrays
- Finds modules in both arrays (anti-pattern)

## Examples

### Example 1: Check Documentation Progress

```bash
/compodoc -doc
```

Use this weekly to track progress toward 100% documentation coverage.

### Example 2: Find What Needs Documentation

```bash
/compodoc -doc | grep "UNDOCUMENTED"
```

This shows all items with 0% documentation - prioritize these for documentation work.

### Example 3: Comprehensive Health Check

```bash
/compodoc -all
```

Run before deploying to production to ensure no architectural issues.

### Example 4: Fix Module Issues

```bash
/compodoc -module
```

Then use the suggested fixes to clean up module configurations.

## Integration with Development Workflow

### In Your Editor

Since you're using VSCode with Claude Code extension:

1. Open Claude Code
2. Type `/compodoc -doc`
3. Results appear in the terminal panel
4. Click on file paths to navigate to source

### In Documentation Sessions

Before updating documentation:
```bash
/compodoc -doc
```

After updating documentation:
```bash
/compodoc -gen
/compodoc -doc
```

To verify improvement.

### In Code Review

Ask reviewers to run:
```bash
/compodoc -module
```

To catch module configuration issues before merging.

## Current Status

### Documentation Coverage: 73.1% (118 items)

**By Type:**
- Injectables: 97.4% ✅ (framework services)
- Interfaces: 73.2% ✅ (data structures)
- Classes: 81.2% ✅ (domain models)
- Components: 48.7% ⚠️ (needs work)

**By Layer:**
- Framework: 93.8% ✅ (excellent)
- Domain Config: 79.8% ✅ (good)
- Features/Pages: 20.6% ❌ (needs documentation)

### Issues Detected

**Circular Dependencies:** 0 ✅ Clean!

**Module Issues:** 2 ⚠️
- `primeng.module.ts`: PRIMENG_MODULES in both imports and exports
- `app-routing.module.ts`: RouterModule in both imports and exports

## Next Steps

1. **Document Features Layer** (currently 20.6%)
   - Run: `/compodoc -doc`
   - Focus on components listed under "UNDOCUMENTED ITEMS"

2. **Fix Module Issues**
   - Run: `/compodoc -module`
   - Remove modules from exports arrays as suggested

3. **Monitor Progress**
   - Run: `/compodoc -doc` weekly
   - Track improvement toward 100%

## Troubleshooting

**Q: Coverage file not found**
```
Error: coverage.html not found. Run 'compodoc -p tsconfig.json' first.
```

**A:** Regenerate Compodoc:
```bash
cd frontend
npx compodoc -p tsconfig.json
```

**Q: Module analysis shows false positives**

**A:** The basic detector flags anything in both arrays. Some patterns (like RouterModule in shared modules) may be intentional. Review each finding.

**Q: Circular dependency detection misses some cycles**

**A:** The basic DFS approach may not catch all edge cases with complex module resolution. Use in combination with TypeScript compiler diagnostics.

## See Also

- [`/bootstrap`](BOOTSTRAP.md) - Initialize session with project context
- [PROJECT-STATUS.md](claude/PROJECT-STATUS.md) - Current project state
- [DOCUMENTATION.md](DOCUMENTATION.md) - Documentation standards
- [MODULE-ARCHITECTURE-AUDIT.md](claude/MODULE-ARCHITECTURE-AUDIT.md) - Detailed module analysis

