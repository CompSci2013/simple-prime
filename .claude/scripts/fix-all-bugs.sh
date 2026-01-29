#!/bin/bash
# Batch runner for autonomous bug fixing
#
# This script runs the autonomous fix loop for multiple bugs sequentially.
# Each bug gets up to MAX_ATTEMPTS tries before moving to the next.
#
# Usage: .claude/scripts/fix-all-bugs.sh [max_attempts]
# Example: .claude/scripts/fix-all-bugs.sh 5

set -e

MAX_ATTEMPTS=${1:-5}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$(dirname "$SCRIPT_DIR")")"
RESULTS_FILE="$PROJECT_DIR/.claude/fix-results.json"
ARCHIVE_DIR="$PROJECT_DIR/.claude/fix-archive"

# Bug definitions: bug_id -> test_path
declare -A BUGS=(
  ["BUG-002"]="e2e/regression/bug-002-escape-close-dialog.spec.ts"
  ["BUG-003"]="e2e/regression/bug-003-year-range-sync.spec.ts"
  ["BUG-004"]="e2e/regression/bug-004-same-field-reselection.spec.ts"
  ["BUG-005"]="e2e/regression/bug-005-highlight-chip-contrast.spec.ts"
  ["BUG-006"]="e2e/regression/bug-006-x-button-propagation.spec.ts"
)

# Bug order (for sequential processing)
BUG_ORDER=("BUG-002" "BUG-003" "BUG-004" "BUG-005" "BUG-006")

# Initialize results file
mkdir -p "$ARCHIVE_DIR"
cat > "$RESULTS_FILE" << EOF
{
  "started_at": "$(date -Iseconds)",
  "max_attempts": $MAX_ATTEMPTS,
  "bugs": {},
  "summary": {
    "total": ${#BUG_ORDER[@]},
    "fixed": 0,
    "deferred": 0,
    "pending": ${#BUG_ORDER[@]}
  }
}
EOF

echo "========================================"
echo "AUTONOMOUS BUG FIX BATCH RUNNER"
echo "========================================"
echo ""
echo "Configuration:"
echo "  Max attempts per bug: $MAX_ATTEMPTS"
echo "  Total bugs: ${#BUG_ORDER[@]}"
echo "  Results file: $RESULTS_FILE"
echo ""
echo "Bugs to fix:"
for bug_id in "${BUG_ORDER[@]}"; do
  echo "  - $bug_id: ${BUGS[$bug_id]}"
done
echo ""

# Start dev server if not running
DEV_SERVER_PORT=4205
if ! lsof -i :$DEV_SERVER_PORT -t >/dev/null 2>&1; then
  echo "Starting dev server on port $DEV_SERVER_PORT..."
  cd "$PROJECT_DIR/frontend"
  nohup npm run dev:server > "$PROJECT_DIR/.claude/dev-server.log" 2>&1 &
  DEV_SERVER_PID=$!
  echo "Dev server PID: $DEV_SERVER_PID"

  # Wait for dev server
  echo "Waiting for dev server..."
  WAIT_COUNT=0
  while ! curl -s "http://localhost:$DEV_SERVER_PORT" >/dev/null 2>&1; do
    sleep 1
    WAIT_COUNT=$((WAIT_COUNT + 1))
    if [ $WAIT_COUNT -ge 60 ]; then
      echo "ERROR: Dev server failed to start" >&2
      exit 1
    fi
  done
  echo "Dev server ready."
else
  echo "Dev server already running on port $DEV_SERVER_PORT"
  DEV_SERVER_PID=$(lsof -i :$DEV_SERVER_PORT -t | head -1)
fi

echo ""
echo "========================================"
echo "STARTING BUG FIX LOOP"
echo "========================================"
echo ""

for bug_id in "${BUG_ORDER[@]}"; do
  test_path="${BUGS[$bug_id]}"

  echo ""
  echo "----------------------------------------"
  echo "Processing: $bug_id"
  echo "Test: $test_path"
  echo "----------------------------------------"

  # Verify test file exists
  if [ ! -f "$PROJECT_DIR/frontend/$test_path" ]; then
    echo "WARNING: Test file not found, skipping: $test_path"
    jq --arg bug "$bug_id" '.bugs[$bug] = {"status": "SKIPPED", "reason": "Test file not found"}' \
       "$RESULTS_FILE" > tmp.$$ && mv tmp.$$ "$RESULTS_FILE"
    continue
  fi

  # Initialize state for this bug
  cat > "$PROJECT_DIR/.claude/fix-state.json" << EOF
{
  "bug_id": "$bug_id",
  "test_path": "$test_path",
  "attempt": 1,
  "max_attempts": $MAX_ATTEMPTS,
  "status": "in_progress",
  "strategy": "local",
  "last_error": "",
  "started_at": "$(date -Iseconds)",
  "dev_server_pid": $DEV_SERVER_PID,
  "history": []
}
EOF

  echo ""
  echo "State initialized for $bug_id"
  echo "Run this command in your other SSH session:"
  echo ""
  echo "  cd $PROJECT_DIR && claude --dangerously-skip-permissions -p \"Fix the bug described in .claude/fix-state.json. The regression test at frontend/$test_path must pass. Use strategy: local (attempt 1). Bug ID: $bug_id\""
  echo ""
  echo "Press Enter when Claude finishes (FIXED or DEFERRED)..."
  read -r

  # Read final status
  FINAL_STATUS=$(jq -r '.status' "$PROJECT_DIR/.claude/fix-state.json")

  # Archive the state file
  ARCHIVE_FILE="$ARCHIVE_DIR/${bug_id}-$(date +%Y%m%d-%H%M%S).json"
  cp "$PROJECT_DIR/.claude/fix-state.json" "$ARCHIVE_FILE"
  echo "Archived to: $ARCHIVE_FILE"

  # Update results
  jq --arg bug "$bug_id" --arg status "$FINAL_STATUS" \
     '.bugs[$bug] = {"status": $status, "completed_at": (now | todate)}' \
     "$RESULTS_FILE" > tmp.$$ && mv tmp.$$ "$RESULTS_FILE"

  # Update summary counts
  if [ "$FINAL_STATUS" = "FIXED" ]; then
    jq '.summary.fixed += 1 | .summary.pending -= 1' "$RESULTS_FILE" > tmp.$$ && mv tmp.$$ "$RESULTS_FILE"
    echo ">>> $bug_id: FIXED <<<"
  elif [ "$FINAL_STATUS" = "DEFERRED" ]; then
    jq '.summary.deferred += 1 | .summary.pending -= 1' "$RESULTS_FILE" > tmp.$$ && mv tmp.$$ "$RESULTS_FILE"
    echo ">>> $bug_id: DEFERRED <<<"
  else
    echo ">>> $bug_id: $FINAL_STATUS <<<"
  fi
done

# Final summary
echo ""
echo "========================================"
echo "BATCH FIX COMPLETE"
echo "========================================"
echo ""

jq '.summary' "$RESULTS_FILE"

# Update completion timestamp
jq '.completed_at = (now | todate)' "$RESULTS_FILE" > tmp.$$ && mv tmp.$$ "$RESULTS_FILE"

echo ""
echo "Full results saved to: $RESULTS_FILE"
echo "Individual bug archives in: $ARCHIVE_DIR"
