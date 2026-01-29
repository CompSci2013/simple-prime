#!/bin/bash

###############################################################################
# Playwright Test Report Server Script
#
# Purpose: View Playwright test results in browser
#
# Usage:
#   ./scripts/test-report.sh
#
# This serves the Playwright HTML report on port 9323
#
# Workflow:
#   Terminal 1: npm run dev:server      (development app)
#   Terminal 2: npm run test:e2e        (run tests once)
#   Terminal 3: npm run test:report     (serve results in browser)
#
# Then open browser to: http://192.168.0.244:9323
#
# Note: Keep this running while you run tests to automatically see new results
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

# Check if playwright-report exists
if [ ! -d "playwright-report" ]; then
    echo -e "${YELLOW}Warning: No test results found yet${NC}"
    echo "Run tests first: npm run test:e2e"
    echo ""
fi

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}Playwright Test Report Server${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""
echo -e "${GREEN}Starting report server on port 9323${NC}"
echo "Access: http://192.168.0.244:9323"
echo ""
echo -e "${YELLOW}To run tests while this is running:${NC}"
echo "  npm run test:e2e"
echo ""
echo "Press Ctrl+C to stop the report server"
echo ""
echo "================================================"
echo ""

# Run Playwright report server
npx playwright show-report --host 0.0.0.0

echo ""
echo -e "${GREEN}Report server stopped${NC}"
