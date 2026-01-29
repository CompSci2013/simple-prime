# Pending Pipeline - Automated Test/Fix from feature/cline-experiment

**Extracted**: 2026-01-01
**Source Branch**: `feature/cline-experiment`
**Purpose**: Reference material for future ideation on automated testing pipelines

---

## Overview

The `feature/cline-experiment` branch contains two automated test/fix pipeline implementations:

1. **TypeScript/Playwright Pipeline** (`frontend/e2e/pipeline/`) - Playwright-based with AI integration
2. **Python Autonomous Pipeline** (`frontend/scripts/autonomous-pipeline.py`) - Standalone Python script using Mimir

Both use the same core concept: **screenshot-based visual analysis + AI-powered bug fixing**.

---

## Architecture Summary

```
┌─────────────────────────────────────────────────────────────────┐
│                    PIPELINE CYCLE                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐    ┌───────────────┐    ┌──────────────┐      │
│  │ 1. ANALYSIS  │───▶│ 2. VISUAL AI  │───▶│ 3. CODER AI  │      │
│  │  Playwright  │    │   qwen3-vl    │    │ qwen3-coder  │      │
│  │  Screenshots │    │   on Mimir    │    │  on Mimir    │      │
│  └──────────────┘    └───────────────┘    └──────────────┘      │
│         ▲                                         │              │
│         │            ┌───────────────┐            │              │
│         │            │ 4. APPLY FIX  │◀───────────┘              │
│         │            │  Edit Source  │                           │
│         │            └───────────────┘                           │
│         │                    │                                   │
│         │            ┌───────────────┐                           │
│         └────────────│ 5. VERIFY     │                           │
│                      │  Re-test Only │                           │
│                      │  Fixed Parts  │                           │
│                      └───────────────┘                           │
│                                                                  │
│  Loop until: no bugs OR max iterations reached                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Key Components

### 1. TypeScript Pipeline (Playwright Integration)

**Location**: `frontend/e2e/pipeline/`

| File | Purpose |
|------|---------|
| `pipeline.ts` | Main orchestrator class |
| `config.ts` | Configuration (URLs, timeouts, AI endpoints) |
| `screenshot-utils.ts` | Screenshot capture with URL overlay |
| `visual-analysis.ts` | Consistency checks (URL, data, popup sync) |
| `bug-reporter.ts` | Bug tracking and status management |
| `ai-fixer.ts` | AI model integration interface |
| `test-runner.ts` | Test execution and verification |
| `types.ts` | TypeScript type definitions |

**Key Features**:
- Integrates with existing Playwright test infrastructure
- URL-bar injection for headless screenshot context
- Consistency checking between components
- Bug attempt tracking with max-retry limits

### 2. Python Autonomous Pipeline

**Location**: `frontend/scripts/autonomous-pipeline.py`

**Key Features**:
- Self-contained Python script (no external dependencies beyond stdlib)
- Uses Mimir's Ollama API directly
- Vision model: `qwen3-vl:235b-a22b-instruct-q4_K_M`
- Coder model: `qwen3-coder:30b-a3b-q8_0`
- Parses OLD_CODE/NEW_CODE blocks and applies patches
- Generates markdown reports

---

## Mimir Integration

Both pipelines leverage Mimir (Mac Studio M3 Ultra) for AI inference:

```
Mimir (192.168.0.100:11434)
├── qwen3-vl:235b-a22b-instruct-q4_K_M  # Vision model for screenshot analysis
└── qwen3-coder:30b-a3b-q8_0            # Coder model for bug fixing
```

**Vision Model Prompt** (for screenshot analysis):
- Looks for layout issues, state mismatches, visual bugs, data issues
- Returns structured JSON with bug severity and suggested fixes

**Coder Model Prompt** (for bug fixing):
- Receives bug details and project context
- Returns FILE/OLD_CODE/NEW_CODE blocks for patching

---

## Configuration

### TypeScript Pipeline Config

```typescript
{
  baseUrl: 'http://localhost',
  port: 4205,
  maxIterations: 10,
  maxBugAttempts: 3,
  screenshotDir: './screenshots/pipeline',
  bugReportPath: './screenshots/pipeline/bug-report.json',
  aiModel: {
    name: 'qwen',
    endpoint: 'https://api.example.com/v1/ai/fix'
  },
  consistencyChecks: {
    urlConsistency: true,
    dataConsistency: true,
    popupSynchronization: true,
    filterSync: true
  }
}
```

### Python Pipeline Config

```python
MIMIR_HOST = "http://mimir:11434"
VISION_MODEL = "qwen3-vl:235b-a22b-instruct-q4_K_M"
CODER_MODEL = "qwen3-coder:30b-a3b-q8_0"
BASE_URL = "http://localhost:4205"
MAX_FIX_ATTEMPTS = 3
MAX_CYCLES = 5
```

---

## Consistency Checks

The pipeline validates:

1. **URL Consistency** - All screenshots match expected URL pattern
2. **Data Consistency** - Related components show same data
3. **Popup Synchronization** - Pop-out windows sync with main window
4. **Filter Sync** - Filter chips match URL state

---

## Cline Integration

The branch also includes Cline-specific configuration:

- `.clinerules` - Project rules for Cline AI assistant
- `docs/guides/CLINE-TROUBLESHOOTING-GUIDE.md` - Self-repair workflow

Key Cline rules:
- Use `/automobiles/discover` route (not `/discover/automobile`)
- Use `basic-results-table` on main page (not `results-table`)
- Don't run `ng build` or `ng serve`

---

## Usage (from cline branch)

### TypeScript Pipeline
```bash
# Ensure dev server is running
npm run dev:server

# Run pipeline as Playwright test
npm run pipeline
```

### Python Pipeline
```bash
# Ensure dev server is running
npm run dev:server

# Run autonomous pipeline
python3 scripts/autonomous-pipeline.py
```

---

## Files to Review

For ideation, examine these files from `feature/cline-experiment`:

```bash
# Core pipeline logic
git show feature/cline-experiment:frontend/e2e/pipeline/pipeline.ts

# Python autonomous version
git show feature/cline-experiment:frontend/scripts/autonomous-pipeline.py

# AI integration interface
git show feature/cline-experiment:frontend/e2e/pipeline/ai-fixer.ts

# Visual analysis checks
git show feature/cline-experiment:frontend/e2e/pipeline/visual-analysis.ts

# Cline rules (project context for AI)
git show feature/cline-experiment:.clinerules

# Troubleshooting guide
git show feature/cline-experiment:docs/guides/CLINE-TROUBLESHOOTING-GUIDE.md
```

---

## Potential Enhancements

1. **Replace simulation stubs** - The TypeScript `ai-fixer.ts` has placeholder implementations
2. **Add image comparison** - Visual diff between screenshots for regression detection
3. **Integrate with Claude Code** - Use Claude instead of/alongside Qwen models
4. **Add rollback capability** - Revert changes if verification fails
5. **Parallel bug processing** - Fix multiple bugs concurrently
6. **Git integration** - Auto-commit fixes with descriptive messages

---

**Note**: This is reference material extracted for future use. The actual implementation lives in `feature/cline-experiment` branch.
