#!/bin/bash
# Initialize a bug fix session
#
# Usage: .claude/scripts/init-fix.sh <bug_id> <test_path>
# Example: .claude/scripts/init-fix.sh BUG-001 e2e/regression/bug-001-keyboard-selection.spec.ts

set -e

BUG_ID=${1:?"Usage: init-fix.sh <bug_id> <test_path>"}
TEST_PATH=${2:?"Usage: init-fix.sh <bug_id> <test_path>"}
MAX_ATTEMPTS=${3:-3}

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$(dirname "$SCRIPT_DIR")")"
STATE_FILE="$PROJECT_DIR/.claude/fix-state.json"
DEV_SERVER_PORT=4205
DEV_SERVER_LOG="$PROJECT_DIR/.claude/dev-server.log"

# Verify test file exists
if [ ! -f "$PROJECT_DIR/frontend/$TEST_PATH" ]; then
  echo "ERROR: Test file not found: frontend/$TEST_PATH" >&2
  exit 1
fi

echo "========================================"
echo "STARTING DEV SERVER"
echo "========================================"

# Stop any existing dev server on port 4205
if lsof -i :$DEV_SERVER_PORT -t >/dev/null 2>&1; then
  echo "Stopping existing dev server on port $DEV_SERVER_PORT..."
  lsof -i :$DEV_SERVER_PORT -t | xargs kill -9 2>/dev/null || true
  sleep 2
fi

# Start dev server in background
echo "Starting dev server..."
cd "$PROJECT_DIR/frontend"
nohup npm run dev:server > "$DEV_SERVER_LOG" 2>&1 &
DEV_SERVER_PID=$!
echo "Dev server PID: $DEV_SERVER_PID"

# Wait for dev server to be ready (max 60 seconds)
echo "Waiting for dev server to be ready on port $DEV_SERVER_PORT..."
WAIT_COUNT=0
MAX_WAIT=60
while ! curl -s "http://localhost:$DEV_SERVER_PORT" >/dev/null 2>&1; do
  sleep 1
  WAIT_COUNT=$((WAIT_COUNT + 1))
  if [ $WAIT_COUNT -ge $MAX_WAIT ]; then
    echo "ERROR: Dev server failed to start within ${MAX_WAIT}s" >&2
    echo "Check log: $DEV_SERVER_LOG" >&2
    tail -20 "$DEV_SERVER_LOG" >&2
    exit 1
  fi
  # Show progress every 10 seconds
  if [ $((WAIT_COUNT % 10)) -eq 0 ]; then
    echo "  Still waiting... (${WAIT_COUNT}s)"
  fi
done

echo "Dev server is ready on port $DEV_SERVER_PORT"
echo ""

# Create state file
cat > "$STATE_FILE" << EOF
{
  "bug_id": "$BUG_ID",
  "test_path": "$TEST_PATH",
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

echo "========================================"
echo "FIX SESSION INITIALIZED"
echo "========================================"
echo "Bug ID: $BUG_ID"
echo "State file: $STATE_FILE"
echo ""
echo "Configuration:"
echo "  Test path: frontend/$TEST_PATH"
echo "  Max attempts: $MAX_ATTEMPTS"
echo "  Current strategy: local (attempt 1)"
echo "  Dev server PID: $DEV_SERVER_PID"
echo "  Dev server log: $DEV_SERVER_LOG"
echo ""
PROMPT="Fix the bug described in .claude/fix-state.json. The regression test at frontend/$TEST_PATH must pass. Use strategy: local (attempt 1)."

echo ""
echo "========================================"
echo ">>> NEXT STEP: Run this command now <<<"
echo "========================================"
echo ""
echo "  cd $PROJECT_DIR && claude --dangerously-skip-permissions -p \"$PROMPT\""
echo ""
echo "========================================"
echo ""
echo "This will run Claude in YOLO mode (no permission prompts)."
echo "Walk away - Claude will continue until tests pass or max attempts reached."
