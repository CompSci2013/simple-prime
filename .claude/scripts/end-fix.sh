#!/bin/bash
# End a bug fix session and show results
#
# Usage: .claude/scripts/end-fix.sh

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
STATE_FILE="$PROJECT_DIR/.claude/fix-state.json"
LOG_FILE="$PROJECT_DIR/.claude/fix-log.txt"
DEV_SERVER_LOG="$PROJECT_DIR/.claude/dev-server.log"
DEV_SERVER_PORT=4205

if [ ! -f "$STATE_FILE" ]; then
  echo "No active fix session found."
  exit 0
fi

echo "=== Fix Session Summary ==="
echo ""

BUG_ID=$(jq -r '.bug_id' "$STATE_FILE")
STATUS=$(jq -r '.status' "$STATE_FILE")
ATTEMPTS=$(jq -r '.attempt' "$STATE_FILE")
STARTED=$(jq -r '.started_at' "$STATE_FILE")
DEV_SERVER_PID=$(jq -r '.dev_server_pid // empty' "$STATE_FILE")

echo "Bug ID: $BUG_ID"
echo "Status: $STATUS"
echo "Attempts: $ATTEMPTS"
echo "Started: $STARTED"
echo ""

echo "=== Attempt History ==="
jq -r '.history[] | "Attempt \(.attempt): \(.result) (\(.strategy))"' "$STATE_FILE" 2>/dev/null || echo "No history recorded"
echo ""

# Stop dev server if running
echo "=== Stopping Dev Server ==="
if [ -n "$DEV_SERVER_PID" ] && kill -0 "$DEV_SERVER_PID" 2>/dev/null; then
  echo "Stopping dev server (PID: $DEV_SERVER_PID)..."
  kill "$DEV_SERVER_PID" 2>/dev/null || true
  sleep 1
  # Force kill if still running
  if kill -0 "$DEV_SERVER_PID" 2>/dev/null; then
    kill -9 "$DEV_SERVER_PID" 2>/dev/null || true
  fi
  echo "Dev server stopped."
else
  # Fallback: kill anything on the port
  if lsof -i :$DEV_SERVER_PORT -t >/dev/null 2>&1; then
    echo "Stopping process on port $DEV_SERVER_PORT..."
    lsof -i :$DEV_SERVER_PORT -t | xargs kill -9 2>/dev/null || true
    echo "Process stopped."
  else
    echo "No dev server running."
  fi
fi
echo ""

# Archive the session
ARCHIVE_DIR="$PROJECT_DIR/.claude/fix-archive"
mkdir -p "$ARCHIVE_DIR"
ARCHIVE_FILE="$ARCHIVE_DIR/${BUG_ID}-$(date +%Y%m%d-%H%M%S).json"
cp "$STATE_FILE" "$ARCHIVE_FILE"
echo "Session archived to: $ARCHIVE_FILE"

# Clean up
rm -f "$STATE_FILE"
rm -f "$DEV_SERVER_LOG"
echo "State file removed. Fix session ended."
