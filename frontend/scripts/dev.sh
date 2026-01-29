#!/bin/bash

###############################################################################
# Development Server Script
#
# Purpose: Start Angular dev server on port 4205
#
# Usage:
#   ./scripts/dev.sh
#
# This starts ONLY the dev server. Playwright report server should be
# started separately in another terminal or as a background service.
#
# To use with Playwright reporting:
#   Terminal 1: npm run dev:server
#   Terminal 2: npm run test:e2e (whenever you want to run tests)
#   Terminal 3: npx playwright show-report --host 0.0.0.0 (separate long-running process)
#
# Windows Browser Access:
#   - Development app: http://192.168.0.244:4205
#   - Test results (when serving): http://192.168.0.244:9323
#
###############################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if npm modules are installed
if [ ! -d "node_modules" ]; then
    echo -e "${RED}Error: node_modules not found${NC}"
    echo "Run: npm install"
    exit 1
fi

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}Angular Development Server${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""
echo -e "${GREEN}Starting dev server on port 4205${NC}"
echo "Access: http://192.168.0.244:4205"
echo ""
echo "Press Ctrl+C to stop"
echo ""

# Run dev server
ng serve --host 0.0.0.0 --port 4205
