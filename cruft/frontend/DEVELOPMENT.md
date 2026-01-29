# Development Quick Start

## TL;DR - Just Do This

```bash
cd ~/projects/generic-prime/frontend
npm run dev:all
```

**What happens:**
- Angular dev server starts on port **4205**
- Playwright tests run once (~11 seconds)
- Test report server starts on port **9323**
- After tests complete, all services stay running

Then open TWO browser windows:
1. **Dev App**: http://192.168.0.244:4205 (dev server)
2. **Results**: http://192.168.0.244:9323 (test results)

**Edit code → See changes compile → Check test results** 🚀

**Note**: Thor is a headless environment, so interactive test mode (--ui) isn't available. Tests run once; use `npm run test:e2e` in another terminal to re-run them manually.

---

## What `npm run dev:all` Does

Starts **three services in one terminal** with colored output:

```
[DEV]    ✓ Compiled successfully (port 4205)
[TEST]   Running 63 tests...
[TEST]   ✓ Tests completed (3 passed, 2 failed, 58 skipped)
[REPORT] ✓ Report server running at http://0.0.0.0:9323
```

- **Dev App** (port 4205): Your application - hot reloads on code changes
- **Playwright Tests**: Run all 63 tests once (~11 seconds)
- **Report Server** (port 9323): HTML test results viewer

The test service exits after tests complete, but Dev and Report services keep running.

To re-run tests while dev:all is active: Open another terminal and run `npm run test:e2e`

Stop everything: Press **Ctrl+C**

---

## Recommended: Three Separate Terminals (More Control)

This is the **BEST approach** for development - you've already discovered this works perfectly:

```bash
# Terminal 1: Dev server (watches for changes)
npm run dev:server

# Terminal 2: Report server (always running)
npm run test:report

# Terminal 3: Run tests on demand
npm run test:e2e
# (after tests complete, you can run this again whenever you want)
```

**Why this is better:**
- ✅ Full control - restart any service independently
- ✅ Report stays visible at http://192.168.0.244:9323 at all times
- ✅ Run tests manually whenever you want
- ✅ Easy to see which service is doing what
- ✅ Can restart tests without restarting the dev server
- ✅ This is what you had working before

**Use this approach!**

---

## Alternative: Single Terminal with `npm run dev:all`

If you want everything in one terminal:

```bash
npm run dev:all
# Runs: dev server + tests (once) + report server
# To re-run tests: open another terminal and run npm run test:e2e
```

**Why you might use this:**
- Simpler setup (one command)
- Less terminal clutter
- Good for quick validation

---

## All npm Commands Reference

| Command | Purpose |
|---------|---------|
| `npm run dev:server` | Just the Angular dev server (port 4205) |
| `npm run test:e2e` | Run all tests once |
| `npm run test:report` | View test results server (port 9323) |
| `npm run dev:all` | All three together (one terminal) |
| `npm run test:watch` | Interactive test mode (requires X Server, not available on Thor) |

---

## Development Workflow

### I'm actively coding:
```bash
npm run dev:all
# Edit code → see changes compile → tests auto-run → see results
```

### I'm debugging a single test:
```bash
# Terminal 1:
npm run dev:server

# Terminal 2:
npm run test:watch
# Use Playwright UI to step through test
```

### I just want to validate tests:
```bash
npm run test:e2e
# Run all tests once and exit
```

### I want to see test results in a browser:
```bash
npm run test:report
# Open http://192.168.0.244:9323
```

---

## Ports Used

| Port | Service | Access |
|------|---------|--------|
| 4205 | Angular Dev Server | http://192.168.0.244:4205 |
| 3000 | Playwright UI | http://localhost:3000 |
| 9323 | Test Report Server | http://192.168.0.244:9323 |

---

## Troubleshooting

**"Cannot connect to port 4205"**
- Dev server not running
- Run `npm run dev:server` in a terminal

**"Cannot connect to port 9323"**
- Report server not running
- Run `npm run test:report` in a terminal

**"Tests won't start"**
- Dev server might not be ready
- Wait 5-10 seconds after starting dev server
- Tests need the app to be available on port 4205

**"Port already in use"**
```bash
# Kill process on port 4205
lsof -i :4205
kill -9 <PID>

# Kill process on port 3000
lsof -i :3000
kill -9 <PID>

# Kill process on port 9323
lsof -i :9323
kill -9 <PID>
```

---

## System Info

- **Node**: v20.19.6 (via NVM at `~/.nvm/`)
- **npm**: 10.8.2
- **Angular**: 14.2.13
- **Playwright**: 1.57.0

---

## See Also

- [ORIENTATION.md](../docs/claude/ORIENTATION.md) - Full architecture guide
- [scripts/README.md](scripts/README.md) - Advanced workflows
- [playwright.config.ts](playwright.config.ts) - Test configuration
- [e2e/app.spec.ts](e2e/app.spec.ts) - All test definitions

---

Last Updated: 2025-12-20
