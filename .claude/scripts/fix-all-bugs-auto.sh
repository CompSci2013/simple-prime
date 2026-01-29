#!/bin/bash
# Fully automated batch runner for autonomous bug fixing
#
# This script runs the autonomous fix loop for multiple bugs sequentially
# WITHOUT user intervention. Claude is invoked automatically for each bug.
#
# Usage: .claude/scripts/fix-all-bugs-auto.sh [max_attempts]
# Example: .claude/scripts/fix-all-bugs-auto.sh 5
#
# IMPORTANT: Run this from a terminal you can leave unattended.
# The script will run Claude in YOLO mode (--dangerously-skip-permissions)
# for each bug until all are FIXED or DEFERRED.

set -e

MAX_ATTEMPTS=${1:-5}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$(dirname "$SCRIPT_DIR")")"
RESULTS_FILE="$PROJECT_DIR/.claude/fix-results.json"
ARCHIVE_DIR="$PROJECT_DIR/.claude/fix-archive"
LOG_FILE="$PROJECT_DIR/.claude/fix-batch.log"

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

log() {
  echo "[$(date -Iseconds)] $*" | tee -a "$LOG_FILE"
}

# Initialize
mkdir -p "$ARCHIVE_DIR"
echo "" > "$LOG_FILE"

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

log "========================================"
log "FULLY AUTOMATED BUG FIX BATCH RUNNER"
log "========================================"
log ""
log "Configuration:"
log "  Max attempts per bug: $MAX_ATTEMPTS"
log "  Total bugs: ${#BUG_ORDER[@]}"
log "  Results file: $RESULTS_FILE"
log "  Log file: $LOG_FILE"
log ""

# Start dev server if not running
DEV_SERVER_PORT=4205
if ! lsof -i :$DEV_SERVER_PORT -t >/dev/null 2>&1; then
  log "Starting dev server on port $DEV_SERVER_PORT..."
  cd "$PROJECT_DIR/frontend"
  nohup npm run dev:server > "$PROJECT_DIR/.claude/dev-server.log" 2>&1 &
  DEV_SERVER_PID=$!
  log "Dev server PID: $DEV_SERVER_PID"

  log "Waiting for dev server..."
  WAIT_COUNT=0
  while ! curl -s "http://localhost:$DEV_SERVER_PORT" >/dev/null 2>&1; do
    sleep 1
    WAIT_COUNT=$((WAIT_COUNT + 1))
    if [ $WAIT_COUNT -ge 90 ]; then
      log "ERROR: Dev server failed to start"
      exit 1
    fi
  done
  log "Dev server ready."
else
  log "Dev server already running on port $DEV_SERVER_PORT"
  DEV_SERVER_PID=$(lsof -i :$DEV_SERVER_PORT -t | head -1)
fi

log ""
log "========================================"
log "STARTING AUTOMATED BUG FIX LOOP"
log "========================================"

for bug_id in "${BUG_ORDER[@]}"; do
  test_path="${BUGS[$bug_id]}"

  log ""
  log "----------------------------------------"
  log "Processing: $bug_id"
  log "Test: $test_path"
  log "----------------------------------------"

  # Verify test file exists
  if [ ! -f "$PROJECT_DIR/frontend/$test_path" ]; then
    log "WARNING: Test file not found, skipping: $test_path"
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

  log "State initialized, running Claude for $bug_id..."

  # Run Claude in YOLO mode
  PROMPT="Fix the bug described in .claude/fix-state.json. The regression test at frontend/$test_path must pass. Use strategy: local (attempt 1). Bug ID: $bug_id"

  cd "$PROJECT_DIR"

  # Run Claude and capture output
  # The Stop hook will keep Claude running until FIXED or DEFERRED
  if claude --dangerously-skip-permissions -p "$PROMPT" >> "$LOG_FILE" 2>&1; then
    log "Claude completed for $bug_id"
  else
    log "Claude exited with error for $bug_id"
  fi

  # Read final status
  FINAL_STATUS=$(jq -r '.status' "$PROJECT_DIR/.claude/fix-state.json")
  log "Final status for $bug_id: $FINAL_STATUS"

  # Archive the state file
  ARCHIVE_FILE="$ARCHIVE_DIR/${bug_id}-$(date +%Y%m%d-%H%M%S).json"
  cp "$PROJECT_DIR/.claude/fix-state.json" "$ARCHIVE_FILE"
  log "Archived to: $ARCHIVE_FILE"

  # Update results
  jq --arg bug "$bug_id" --arg status "$FINAL_STATUS" \
     '.bugs[$bug] = {"status": $status, "completed_at": (now | todate)}' \
     "$RESULTS_FILE" > tmp.$$ && mv tmp.$$ "$RESULTS_FILE"

  # Update summary counts
  if [ "$FINAL_STATUS" = "FIXED" ]; then
    jq '.summary.fixed += 1 | .summary.pending -= 1' "$RESULTS_FILE" > tmp.$$ && mv tmp.$$ "$RESULTS_FILE"
    log ">>> $bug_id: FIXED <<<"
  elif [ "$FINAL_STATUS" = "DEFERRED" ]; then
    jq '.summary.deferred += 1 | .summary.pending -= 1' "$RESULTS_FILE" > tmp.$$ && mv tmp.$$ "$RESULTS_FILE"
    log ">>> $bug_id: DEFERRED <<<"
  else
    log ">>> $bug_id: $FINAL_STATUS (unexpected) <<<"
  fi

  # Brief pause between bugs
  sleep 2
done

# Final summary
log ""
log "========================================"
log "BATCH FIX COMPLETE"
log "========================================"
log ""

SUMMARY=$(jq '.summary' "$RESULTS_FILE")
log "$SUMMARY"

# Update completion timestamp
jq '.completed_at = (now | todate)' "$RESULTS_FILE" > tmp.$$ && mv tmp.$$ "$RESULTS_FILE"

log ""
log "Full results saved to: $RESULTS_FILE"
log "Individual bug archives in: $ARCHIVE_DIR"
log "Full log at: $LOG_FILE"
