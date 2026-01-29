# Multi-Agent Autonomous Workflow Synthesis

**Created**: 2026-01-02T06:23
**Context**: Session 68 - generic-prime project
**Purpose**: Synthesize vague concepts into coherent plan for multi-agent autonomous workflows

---

## What You Have

| Resource | Purpose |
|----------|---------|
| **Claude Code (Top Tier)** | Primary brain - planning, complex reasoning, code generation |
| **Mimir (242GB VRAM)** | Local LLM farm - vision (qwen3-vl), coding (qwen3-coder), reasoning (deepseek-r1) |
| **Cline VS Code Extension** | Alternative AI coding assistant (can use any backend) |
| **Claude Code Router** | Middleware to route requests to different models |
| **Pending Pipeline** | Vision-based autonomous test/fix loop (prototype exists in `feature/cline-experiment`) |

---

## What You Want

1. **Parallel agents** - Multiple AI agents working on different tasks simultaneously
2. **Unattended operation** - Run for hours until goal achieved
3. **Smart routing** - Use Claude for hard problems, local models for simple tasks
4. **Autonomous fixing** - Vision model detects bugs, coder model fixes them

---

## Available Approaches

| Approach | Tool | Parallel Agents | Unattended | Routing | Maturity |
|----------|------|-----------------|------------|---------|----------|
| **A** | Claude Code (native) | Task tool spawns subagents | Headless mode | Claude only | Production |
| **B** | Claude Code Router | Single agent | Yes | Any model | Third-party |
| **C** | Custom Pipeline | Design your own | Yes | Full control | Your prototype |

---

## Approach A: Claude Code Native Capabilities

Claude Code already supports parallel agent spawning via the `Task` tool:

```
Claude Code CLI (Headless Mode)
├── Main Agent (you interact with)
│   ├── Task tool → Spawn "Explore" agent (search codebase)
│   ├── Task tool → Spawn "Plan" agent (design implementation)
│   └── Task tool → Spawn background shell (long-running tests)
│
└── Runs until goal achieved (with --max-turns or natural completion)
```

### Key Commands
```bash
# Headless mode - runs without interactive terminal
claude --headless "your prompt here" --max-turns 100

# Background execution
claude --headless "run all e2e tests and fix failures" &

# With output logging
claude --headless "prompt" --output-format json > results.json
```

### Native Subagent Types
- `Explore` - Fast codebase exploration
- `Plan` - Software architect for implementation plans
- `general-purpose` - Multi-step autonomous tasks
- Background shells - Long-running processes

---

## Approach B: Claude Code Router

Third-party middleware that intercepts Claude Code CLI requests and routes to different backends.

### Installation
```bash
npm install -g @musistudio/claude-code-router
ccr start  # Starts on port 3456
ccr config  # Configure routing rules
```

### Conceptual Routing Rules
```yaml
routes:
  - pattern: "search|grep|glob|simple"
    model: "mimir/qwen3-coder"
    endpoint: "http://192.168.0.100:11434"

  - pattern: "screenshot|visual|image|analyze"
    model: "mimir/qwen3-vl"
    endpoint: "http://192.168.0.100:11434"

  - pattern: "reason|plan|architect|complex"
    model: "mimir/deepseek-r1"
    endpoint: "http://192.168.0.100:11434"

  - pattern: ".*"  # default fallback
    model: "claude-opus-4"
    endpoint: "anthropic"
```

### Benefits
- Cost optimization (local models for simple tasks)
- Privacy (sensitive code stays on Mimir)
- Specialization (vision model for screenshots, coder for fixes)

---

## Approach C: Custom Pipeline (Your Prototype)

Reference: `pending-pipeline/` directory and `feature/cline-experiment` branch

### Architecture
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

### Mimir Models Available
| Model | VRAM | Purpose |
|-------|------|---------|
| qwen3-vl:235b-a22b-instruct-q4_K_M | 135.70GB | Vision - screenshot analysis |
| qwen3-coder:30b-a3b-q8_0 | 30.71GB | Coding - bug fixes |
| deepseek-r1:70b-llama-distill-q8_0 | 70.60GB | Reasoning - complex problems |
| llama4:scout | 63.98GB | General purpose |

### Multi-Model Combinations (fit in 242GB)
- qwen3-vl + qwen3-coder + deepseek-r1 = ~237GB (all three simultaneously)
- qwen3-vl + qwen3-coder = ~166GB (vision + coding)

---

## Recommended Path

### Step 1: Master Claude Code Native (Immediate)
- Learn headless mode: `claude --headless`
- Understand Task tool subagent spawning
- Experiment with background shells for long tasks

### Step 2: Install Claude Code Router (Next)
```bash
npm install -g @musistudio/claude-code-router
ccr start
# Configure to route simple tasks to Mimir
```

### Step 3: Define Routing Strategy
- Simple file operations → Mimir/qwen3-coder
- Screenshot analysis → Mimir/qwen3-vl
- Complex architecture → Claude Opus
- Long reasoning chains → Mimir/deepseek-r1

### Step 4: Integrate Custom Pipeline
- Resurrect `feature/cline-experiment` pipeline code
- Use Claude as orchestrator
- Use Mimir models for specialized tasks
- Add git integration for auto-commits

---

## Research Needed

1. **Claude Code headless mode** - Full documentation on unattended operation
2. **Claude Code Router configuration** - Actual routing rule syntax
3. **Cline + Router integration** - Can Cline use Router as backend?
4. **Agent SDK** - Official Anthropic SDK for building custom agents

---

## Questions to Answer

1. Which approach interests you most? (A: native Claude, B: Router, C: custom pipeline)
2. What's your first concrete goal? (e.g., "run E2E tests and auto-fix failures unattended")
3. Should Claude research its own headless/agent capabilities in detail?

---

## Related Files

- `~/projects/generic-prime/pending-pipeline/` - Pipeline reference docs
- `~/Cline/` - Cline configuration and model reports
- `~/Cline/OLLAMA-MODELS-2026-01-01-1134.md` - Available Mimir models
- `feature/cline-experiment` branch - Working pipeline prototype

---

## Concrete Goal: QA Pipeline with Autonomous Bug Fixing

**Decided**: 2026-01-02 (Session 68)

The first concrete goal is an **autonomous QA pipeline** that runs E2E tests and fixes bugs automatically.

### Pipeline Behavior

1. **Run tests sequentially** (not in parallel)
2. **Stop on first failure**
3. **Analyze failure** using test artifacts (screenshots, API logs, console errors)
4. **Validate fix against architecture rubric**:
   - URL-First state management
   - OnPush change detection patterns
   - PrimeNG component patterns
   - No over-engineering
5. **Attempt fix #1** based on local analysis
6. **Re-run failed test** to verify
7. **If fix fails**: Web search for Angular 21 / PrimeNG 21 solutions
8. **Attempt fix #2** informed by search results
9. **If fix #2 fails**: Deep investigation, alternative approach
10. **Attempt fix #3**
11. **If fix #3 fails**: Mark as **DEFERRED**, revert changes, continue to next test
12. **Generate report** of all fixes applied and deferred issues

### Implementation Phases

| Phase | Description | Status |
|-------|-------------|--------|
| 1 | `/qa` command - run all tests | ✅ Done |
| 2 | Stop-on-failure mode | Pending |
| 3 | Auto-fix with rubric validation | Pending |
| 4 | Multi-attempt with web search | Pending |
| 5 | Full autonomous pipeline | Pending |

### Architecture Rubric (Fix Validation)

Before applying any fix, validate against:

```
[ ] URL-First: Changes go through UrlStateService
[ ] URL-First: No direct router.navigate()
[ ] OnPush: Pop-outs use detectChanges() not markForCheck()
[ ] PrimeNG: Use components directly, correct names for v21
[ ] Data Flow: Understand full flow before modifying
[ ] Minimal: Only changes needed to fix the issue
```

### Reference Documents

- `docs/claude/qa-pipeline-vision.md` - Full pipeline architecture
- `docs/claude/qa-e2e-test-suite.md` - Test infrastructure
- `pending-pipeline/` - Original prototype concept
- `.claude/commands/qa.md` - Current simple test runner

---

**Next Action**: Implement Phase 2 (stop-on-failure mode).
