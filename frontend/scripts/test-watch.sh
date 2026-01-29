#!/bin/bash

###############################################################################
# Playwright Test Watch Mode Script
#
# Purpose: Run Playwright tests in UI mode (watch mode)
#
# Usage:
#   ./scripts/test-watch.sh
#
# This starts Playwright in UI mode which:
#   - Reruns tests when source files change
#   - Shows live test execution in browser
#   - Displays detailed test logs
#   - Allows stepping through tests
#
# Prerequisites:
#   - Dev server must be running on port 4205
#   - Run in Terminal 1: npm run dev:server
#   - Run this in Terminal 2: npm run test:watch
#
# Windows Browser Access:
#   - Playwright UI: http://localhost:3000 (after startup message)
#   - Dev app: http://192.168.0.244:4205
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
echo -e "${BLUE}Playwright Test Watch Mode${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""
echo -e "${YELLOW}Prerequisites:${NC}"
echo "  ✓ Dev server running on port 4205"
echo "  ✓ npm run dev:server should be active"
echo ""
echo -e "${GREEN}Starting Playwright UI mode...${NC}"
echo ""

# Run Playwright in UI mode (watch mode)
npx playwright test --ui --host 0.0.0.0

echo ""
echo -e "${GREEN}Playwright UI mode stopped${NC}"
