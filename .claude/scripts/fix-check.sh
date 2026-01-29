#!/bin/bash
# Stop hook for autonomous bug fix loop
#
# Exit codes:
#   0 - Allow stopping (tests passed, max attempts, or not in fix mode)
#   2 - Block stopping (tests failed, more attempts remaining)
#
# This script is called by Claude Code's Stop hook after each turn.

# Don't use set -e since we need to handle test failures gracefully

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)}"
STATE_FILE="$PROJECT_DIR/.claude/fix-state.json"
LOG_FILE="$PROJECT_DIR/.claude/fix-log.txt"

log() {
  echo "[$(date -Iseconds)] $*" >> "$LOG_FILE"
}

# If no state file, not in fix mode - allow stopping
if [ ! -f "$STATE_FILE" ]; then
  exit 0
fi

# Read state
BUG_ID=$(jq -r '.bug_id' "$STATE_FILE")
TEST_PATH=$(jq -r '.test_path' "$STATE_FILE")
ATTEMPT=$(jq -r '.attempt' "$STATE_FILE")
MAX_ATTEMPTS=$(jq -r '.max_attempts' "$STATE_FILE")
STATUS=$(jq -r '.status' "$STATE_FILE")
STRATEGY=$(jq -r '.strategy' "$STATE_FILE")

log "Fix check: $BUG_ID attempt=$ATTEMPT status=$STATUS strategy=$STRATEGY"

# If already resolved, allow stopping
if [ "$STATUS" = "FIXED" ] || [ "$STATUS" = "DEFERRED" ]; then
  log "Already resolved: $STATUS"
  exit 0
fi

# Run the regression test
cd "$PROJECT_DIR/frontend"
log "Running test: $TEST_PATH"

# Capture output and exit code separately
TEST_OUTPUT_FILE=$(mktemp)
npx playwright test "$TEST_PATH" --reporter=line > "$TEST_OUTPUT_FILE" 2>&1
TEST_EXIT=$?
TEST_OUTPUT=$(cat "$TEST_OUTPUT_FILE")
rm -f "$TEST_OUTPUT_FILE"

log "Test exit code: $TEST_EXIT"

if [ $TEST_EXIT -eq 0 ]; then
  # Tests passed! Update state and allow stopping
  jq '.status = "FIXED" | .history += [{"attempt": .attempt, "strategy": .strategy, "result": "PASSED", "timestamp": now | todate}]' \
     "$STATE_FILE" > tmp.$$ && mv tmp.$$ "$STATE_FILE"

  log "SUCCESS: $BUG_ID fixed on attempt $ATTEMPT"

  # Clean success message to stderr (shown to Claude)
  echo "" >&2
  echo "========================================" >&2
  echo "SUCCESS: $BUG_ID FIXED" >&2
  echo "========================================" >&2
  echo "Tests passed on attempt $ATTEMPT using strategy: $STRATEGY" >&2
  echo "" >&2

  exit 0
fi

# Tests failed - record in history
jq --arg error "$TEST_OUTPUT" \
   '.history += [{"attempt": .attempt, "strategy": .strategy, "result": "FAILED", "error": $error, "timestamp": now | todate}]' \
   "$STATE_FILE" > tmp.$$ && mv tmp.$$ "$STATE_FILE"

# Check if more attempts remaining
NEXT_ATTEMPT=$((ATTEMPT + 1))

if [ $NEXT_ATTEMPT -gt $MAX_ATTEMPTS ]; then
  # Max attempts reached - mark DEFERRED and allow stopping
  jq '.status = "DEFERRED"' "$STATE_FILE" > tmp.$$ && mv tmp.$$ "$STATE_FILE"

  log "DEFERRED: $BUG_ID after $MAX_ATTEMPTS attempts"

  echo "" >&2
  echo "========================================" >&2
  echo "DEFERRED: $BUG_ID" >&2
  echo "========================================" >&2
  echo "Max attempts ($MAX_ATTEMPTS) reached without success." >&2
  echo "Bug marked as DEFERRED for manual investigation." >&2
  echo "" >&2

  exit 0
fi

# Determine next strategy
case $NEXT_ATTEMPT in
  2) NEXT_STRATEGY="web_search" ;;
  3) NEXT_STRATEGY="deep_investigation" ;;
  4) NEXT_STRATEGY="alternative_approach" ;;
  5) NEXT_STRATEGY="minimal_fix" ;;
  *) NEXT_STRATEGY="local" ;;
esac

# Update state for next attempt
jq --arg attempt "$NEXT_ATTEMPT" --arg strategy "$NEXT_STRATEGY" \
   '.attempt = ($attempt | tonumber) | .strategy = $strategy' \
   "$STATE_FILE" > tmp.$$ && mv tmp.$$ "$STATE_FILE"

log "RETRY: Attempt $NEXT_ATTEMPT with strategy $NEXT_STRATEGY"

# Block stopping and provide detailed feedback to Claude
{
  echo ""
  echo "========================================"
  echo "RETRY: $BUG_ID - Attempt $NEXT_ATTEMPT of $MAX_ATTEMPTS"
  echo "========================================"
  echo "Strategy: $NEXT_STRATEGY"
  echo ""

  case $NEXT_STRATEGY in
    "web_search")
      echo "INSTRUCTIONS FOR ATTEMPT 2 (Web Search):"
      echo ""
      echo "Use WebSearch tool to find solutions for this bug."
      echo "Search queries to try:"
      echo "1. PrimeNG p-select keyboard navigation spacebar"
      echo "2. PrimeNG 21 select filter input keyboard selection"
      echo "3. Angular p-focus class select option"
      echo ""
      echo "Look for:"
      echo "- PrimeNG GitHub issues about keyboard navigation"
      echo "- Stack Overflow solutions for similar problems"
      echo "- PrimeNG documentation on keyboard accessibility"
      echo ""
      echo "After researching, apply the fix and the test will run again."
      ;;
    "deep_investigation")
      echo "INSTRUCTIONS FOR ATTEMPT 3 (Deep Investigation):"
      echo ""
      echo "Previous attempts failed. Perform comprehensive analysis:"
      echo ""
      echo "1. CODEBASE SEARCH"
      echo "   - Search for similar keyboard handlers in other components"
      echo "   - Check how other PrimeNG components handle keyboard events"
      echo "   - Look for any existing workarounds or patches"
      echo ""
      echo "2. PRIMENG SOURCE ANALYSIS"
      echo "   - Examine PrimeNG select component source if accessible"
      echo "   - Understand the event flow for keyboard interactions"
      echo ""
      echo "3. ANGULAR CONSIDERATIONS"
      echo "   - Check for zone.js or change detection issues"
      echo "   - Verify event propagation isn't being blocked elsewhere"
      echo ""
      echo "4. ALTERNATIVE APPROACHES"
      echo "   - Consider if a different selector is needed"
      echo "   - Check if the component API offers keyboard handling options"
      echo ""
      echo "Apply the most promising solution and the test will run again."
      ;;
    "alternative_approach")
      echo "INSTRUCTIONS FOR ATTEMPT 4 (Alternative Approach):"
      echo ""
      echo "Previous strategies failed. Try a completely different approach:"
      echo ""
      echo "1. RECONSIDER THE PROBLEM"
      echo "   - Re-read the bug description and test expectations"
      echo "   - Maybe the fix needs to be in a different file entirely"
      echo "   - Consider if a workaround is acceptable"
      echo ""
      echo "2. CHECK SIMILAR COMPONENTS"
      echo "   - How do other components in this codebase solve similar problems?"
      echo "   - Can you copy a pattern that already works?"
      echo ""
      echo "3. SIMPLIFY"
      echo "   - Remove any complex fixes from previous attempts"
      echo "   - Try the simplest possible solution"
      echo ""
      echo "Apply a fresh approach and the test will run again."
      ;;
    "minimal_fix")
      echo "INSTRUCTIONS FOR ATTEMPT 5 (Minimal Fix - LAST CHANCE):"
      echo ""
      echo "This is your FINAL attempt. Focus on the absolute minimum fix:"
      echo ""
      echo "1. REVERT any complex changes from previous attempts"
      echo "2. Make the SMALLEST possible change to pass the test"
      echo "3. Don't worry about elegance - just make it work"
      echo "4. If the test expects specific behavior, implement EXACTLY that"
      echo ""
      echo "This is your last chance before the bug is marked DEFERRED."
      ;;
    *)
      echo "INSTRUCTIONS FOR ATTEMPT 1 (Local Analysis):"
      echo ""
      echo "Analyze the code and fix the bug using local context only."
      echo "Focus on:"
      echo "- Reading the relevant component code"
      echo "- Understanding the current implementation"
      echo "- Making targeted fixes based on code analysis"
      ;;
  esac

  echo ""
  echo "----------------------------------------"
  echo "LAST TEST OUTPUT:"
  echo "----------------------------------------"
  echo "$TEST_OUTPUT"
  echo "----------------------------------------"
} >&2

exit 2  # Block stopping, force Claude to continue
