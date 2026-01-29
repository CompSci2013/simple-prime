#!/bin/bash
# Run E2E tests for generic-prime
#
# USAGE:
#   ./scripts/run-e2e-tests.sh              # Full test run (starts dev server + tests)
#   ./scripts/run-e2e-tests.sh --only-test  # Only run tests (assumes dev server already running)
#
# CONTAINER SETUP:
#   - Mounts source code and test files from host
#   - Preserves Playwright from container build
#   - Uses --network host for accessing localhost:4205
#
# WHAT THIS DOES:
#   1. Starts E2E container with proper bind mounts
#   2. Optionally starts dev server (ng serve on port 4205)
#   3. Waits for dev server to be ready
#   4. Runs Playwright E2E tests
#   5. Streams all output to console

set -e

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
START_DEV_SERVER=true

# Parse arguments
if [[ "$1" == "--only-test" ]]; then
  START_DEV_SERVER=false
  echo "ℹ️  Running tests only (assuming dev server already running on port 4205)"
fi

# Stop and remove any existing e2e container
echo "Starting E2E container..."
podman stop generic-prime-e2e 2>/dev/null || true
podman rm generic-prime-e2e 2>/dev/null || true

# Start E2E container with bind mounts
# Mounts: src, e2e, playwright.config.ts, tsconfig.json (excludes node_modules to preserve Playwright)
podman run -d --name generic-prime-e2e --network host \
  -v "$REPO_ROOT/frontend/src:/app/frontend/src:z" \
  -v "$REPO_ROOT/frontend/e2e:/app/frontend/e2e:z" \
  -v "$REPO_ROOT/frontend/playwright.config.ts:/app/frontend/playwright.config.ts:z" \
  -v "$REPO_ROOT/frontend/tsconfig.json:/app/frontend/tsconfig.json:z" \
  -w /app \
  localhost/generic-prime-e2e:latest

sleep 2

# Optionally start dev server
if [[ "$START_DEV_SERVER" == true ]]; then
  echo "Starting dev server on port 4205..."
  podman exec -d generic-prime-e2e bash -c "cd /app/frontend && npm start -- --host 0.0.0.0 --port 4205 2>&1 | tee /tmp/dev-server.log"

  # Wait for dev server to compile successfully
  echo "Waiting for dev server to compile and start..."
  for i in {1..60}; do
    if podman exec generic-prime-e2e sh -c "grep -q 'Compiled successfully' /tmp/dev-server.log 2>/dev/null" 2>/dev/null; then
      echo "✓ Dev server ready!"
      break
    fi
    echo -n "."
    sleep 1
    if [ $i -eq 60 ]; then
      echo ""
      echo "✗ Dev server failed to start after 60 seconds"
      echo ""
      echo "Last 20 lines of container logs:"
      podman logs generic-prime-e2e | tail -20
      exit 1
    fi
  done
  echo ""
  sleep 2
fi

# Run tests with full output visible
echo "Running E2E tests..."
echo "================================"
podman exec generic-prime-e2e bash -c "cd /app/frontend && npx playwright test"
