# Autonomous Test-Fix Loop Architecture

**Created**: 2026-01-02
**Purpose**: Enable Claude Code to autonomously fix bugs with escalating strategies

---

## Problem Statement

When Claude attempts to fix a bug, we want:
1. **Attempt 1**: Local analysis only (read code, understand context)
2. **Attempt 2**: Web search for solutions (PrimeNG docs, Stack Overflow, GitHub issues)
3. **Attempt 3**: Deep investigation (broader codebase search, architectural review)
4. **After 3 failures**: Mark as DEFERRED, stop gracefully

This requires tracking state across Claude turns and injecting different prompts based on attempt number.

---

## Research Summary

Existing frameworks (Ralph Loop, Claude Code Hooks) provide:
- Stop hooks to block/allow completion
- Circuit breakers for infinite loop prevention
- State tracking via files

**None implement escalating web-search fallback patterns.** This is a novel architecture.

Sources:
- [Ralph Claude Code](https://github.com/frankbria/ralph-claude-code)
- [Claude Code Hooks Mastery](https://github.com/disler/claude-code-hooks-mastery)
- [Anthropic: Effective Harnesses for Long-Running Agents](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents)

---

## Option A: Custom Shell Wrapper (Ralph-style)

**Approach**: External shell script manages the loop, injecting prompts into Claude Code.

```bash
#!/bin/bash
# .claude/scripts/fix-loop.sh

STATE_FILE=".claude/fix-state.json"
PROMPT_DIR=".claude/prompts"

# Initialize state
init_state() {
  cat > "$STATE_FILE" << EOF
{
  "bug_id": "$1",
  "test_path": "$2",
  "attempt": 0,
  "status": "in_progress",
  "last_error": ""
}
EOF
}

# Get current attempt
get_attempt() {
  jq -r '.attempt' "$STATE_FILE"
}

# Increment attempt
increment_attempt() {
  jq '.attempt += 1' "$STATE_FILE" > tmp.$$ && mv tmp.$$ "$STATE_FILE"
}

# Select prompt based on attempt
get_prompt() {
  local attempt=$1
  case $attempt in
    1) cat "$PROMPT_DIR/attempt-1-local.md" ;;
    2) cat "$PROMPT_DIR/attempt-2-websearch.md" ;;
    3) cat "$PROMPT_DIR/attempt-3-deep.md" ;;
    *) echo "Max attempts reached. Marking DEFERRED." ;;
  esac
}

# Main loop
main() {
  local bug_id=$1
  local test_path=$2

  init_state "$bug_id" "$test_path"

  while true; do
    increment_attempt
    local attempt=$(get_attempt)

    if [ "$attempt" -gt 3 ]; then
      jq '.status = "DEFERRED"' "$STATE_FILE" > tmp.$$ && mv tmp.$$ "$STATE_FILE"
      echo "Bug $bug_id marked as DEFERRED after 3 attempts"
      exit 0
    fi

    # Generate prompt and run Claude
    get_prompt "$attempt" | claude -p --dangerously-skip-permissions

    # Run test
    if npx playwright test "$test_path" --reporter=list; then
      jq '.status = "FIXED"' "$STATE_FILE" > tmp.$$ && mv tmp.$$ "$STATE_FILE"
      echo "Bug $bug_id FIXED on attempt $attempt"
      exit 0
    fi
  done
}

main "$@"
```

**Pros**:
- Full control over loop logic
- Can run completely unattended
- Easy to add logging, metrics

**Cons**:
- External to Claude Code (not using native hooks)
- Requires `--dangerously-skip-permissions`
- More complex setup

---

## Option B: Stop Hook + State File (RECOMMENDED)

**Approach**: Native Claude Code Stop hook checks test results and manages state.

### Architecture

```
.claude/
├── settings.json          # Hook configuration
├── scripts/
│   └── fix-check.sh       # Stop hook script
└── fix-state.json         # Persistent state across turns

State file structure:
{
  "bug_id": "BUG-001",
  "test_path": "e2e/regression/bug-001-keyboard-selection.spec.ts",
  "attempt": 1,
  "max_attempts": 3,
  "status": "in_progress",
  "strategy": "local",
  "last_error": "",
  "history": []
}
```

### Hook Configuration

```json
{
  "hooks": {
    "Stop": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "\"$CLAUDE_PROJECT_DIR\"/.claude/scripts/fix-check.sh",
            "timeout": 120
          }
        ]
      }
    ]
  }
}
```

### Stop Hook Script

```bash
#!/bin/bash
# .claude/scripts/fix-check.sh

STATE_FILE="$CLAUDE_PROJECT_DIR/.claude/fix-state.json"

# If no state file, allow stopping (not in fix mode)
if [ ! -f "$STATE_FILE" ]; then
  exit 0
fi

# Read state
BUG_ID=$(jq -r '.bug_id' "$STATE_FILE")
TEST_PATH=$(jq -r '.test_path' "$STATE_FILE")
ATTEMPT=$(jq -r '.attempt' "$STATE_FILE")
MAX_ATTEMPTS=$(jq -r '.max_attempts' "$STATE_FILE")
STATUS=$(jq -r '.status' "$STATE_FILE")

# If already resolved, allow stopping
if [ "$STATUS" = "FIXED" ] || [ "$STATUS" = "DEFERRED" ]; then
  exit 0
fi

# Run the regression test
cd "$CLAUDE_PROJECT_DIR/frontend"
TEST_OUTPUT=$(npx playwright test "$TEST_PATH" --reporter=json 2>&1)
TEST_EXIT=$?

if [ $TEST_EXIT -eq 0 ]; then
  # Tests passed! Update state and allow stopping
  jq '.status = "FIXED"' "$STATE_FILE" > tmp.$$ && mv tmp.$$ "$STATE_FILE"
  echo "SUCCESS: $BUG_ID fixed on attempt $ATTEMPT" >&2
  exit 0
fi

# Tests failed - check attempt count
NEXT_ATTEMPT=$((ATTEMPT + 1))

if [ $NEXT_ATTEMPT -gt $MAX_ATTEMPTS ]; then
  # Max attempts reached - mark DEFERRED and allow stopping
  jq '.status = "DEFERRED"' "$STATE_FILE" > tmp.$$ && mv tmp.$$ "$STATE_FILE"
  echo "DEFERRED: $BUG_ID after $MAX_ATTEMPTS attempts" >&2
  exit 0
fi

# Determine next strategy
case $NEXT_ATTEMPT in
  2) STRATEGY="web_search" ;;
  3) STRATEGY="deep_investigation" ;;
  *) STRATEGY="local" ;;
esac

# Update state
jq --arg attempt "$NEXT_ATTEMPT" --arg strategy "$STRATEGY" \
   '.attempt = ($attempt | tonumber) | .strategy = $strategy' \
   "$STATE_FILE" > tmp.$$ && mv tmp.$$ "$STATE_FILE"

# Block stopping and provide feedback
cat >&2 << EOF
RETRY: $BUG_ID - Attempt $NEXT_ATTEMPT of $MAX_ATTEMPTS
Strategy: $STRATEGY

$(case $STRATEGY in
  "web_search")
    echo "Use WebSearch to find solutions for this issue."
    echo "Search for: PrimeNG select keyboard navigation, p-focus class, spacebar selection"
    ;;
  "deep_investigation")
    echo "Perform deep investigation:"
    echo "1. Search entire codebase for similar patterns"
    echo "2. Check PrimeNG source code"
    echo "3. Review Angular change detection interactions"
    ;;
esac)

Test output:
$TEST_OUTPUT
EOF

exit 2  # Block stopping, force Claude to continue
```

**Pros**:
- Native Claude Code integration
- Deterministic control flow
- State persists across turns
- Stderr feedback guides Claude's next action

**Cons**:
- 120-second timeout limit per hook
- Requires test to run quickly

---

## Option C: Prompt-Based Stop Hook (LLM Decides)

**Approach**: Use Claude's prompt-based hooks to let an LLM evaluate stopping conditions.

### Configuration

```json
{
  "hooks": {
    "Stop": [
      {
        "hooks": [
          {
            "type": "prompt",
            "prompt": "You are evaluating whether Claude should stop working on a bug fix.\n\nRead the state file at .claude/fix-state.json.\nRun the test specified in test_path.\n\nRules:\n1. If tests PASS: respond {\"decision\": \"approve\", \"reason\": \"Tests passed\"}\n2. If tests FAIL and attempt < max_attempts: respond {\"decision\": \"block\", \"reason\": \"Attempt N failed. Strategy: [suggest next strategy]\"}\n3. If tests FAIL and attempt >= max_attempts: respond {\"decision\": \"approve\", \"reason\": \"Max attempts reached. Mark as DEFERRED.\"}\n\nCurrent conversation context: $ARGUMENTS"
          }
        ]
      }
    ]
  }
}
```

**Pros**:
- Flexible, can adapt to complex conditions
- Can provide nuanced guidance

**Cons**:
- LLM variance (may not always make correct decision)
- Slower (requires LLM inference)
- Harder to debug

---

## Recommendation

**Option B (Stop Hook + State File)** is recommended because:

1. **Deterministic**: No LLM variance in stop decisions
2. **Native integration**: Uses Claude Code's built-in hook system
3. **Transparent**: Exit codes and stderr make behavior explicit
4. **Debuggable**: State file shows exactly what happened
5. **Safe**: Max attempts prevent infinite loops

---

## Implementation Checklist

- [ ] Create `.claude/scripts/fix-check.sh`
- [ ] Update `.claude/settings.json` with Stop hook
- [ ] Create state file initialization script
- [ ] Test with BUG-001 as proof-of-concept
- [ ] Document usage in CLAUDE.md

---

## Usage

```bash
# Initialize a fix session
.claude/scripts/init-fix.sh BUG-001 e2e/regression/bug-001-keyboard-selection.spec.ts

# Start Claude Code - it will now loop until fixed or DEFERRED
claude

# Check status
cat .claude/fix-state.json
```
