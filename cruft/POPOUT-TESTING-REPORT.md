# Pop-Out Manual Testing Report

**Test Session**: Session 15
**Date**: 2025-12-14
**Tester**: Claude Code
**Environment**: http://192.168.0.244:4205/automobiles/discover

---

## Test Summary

This document tracks manual testing of pop-out window functionality across 10 test scenarios.

| Test # | Scenario | Status | Notes |
|--------|----------|--------|-------|
| 1 | Open pop-out window | Pending | Test opening pop-out on Model Picker |
| 2 | State sync main → pop-out | Pending | Verify filter changes sync to pop-out |
| 3 | State sync pop-out → main | Pending | Verify selections sync back to main |
| 4 | Multiple pop-outs | Pending | Test opening multiple pop-outs simultaneously |
| 5 | Filter operations | Pending | Test filter changes propagate correctly |
| 6 | Pop-out close | Pending | Verify clean closure and cleanup |
| 7 | Page refresh | Pending | Verify refresh closes pop-outs |
| 8 | Multi-monitor | Skipped | Requires multi-monitor setup |
| 9 | Network latency | Pending | Simulate slow network with DevTools |
| 10 | Console validation | Pending | Verify message flow and channel names |

---

## Test 1: Open Pop-Out Window

**Objective**: Verify pop-out window opens correctly with proper routing and styling

**Prerequisites**:
- [ ] Development server running on http://192.168.0.244:4205
- [ ] Backend API running on generic-prime.minilab
- [ ] Chrome/Chromium browser with DevTools

**Steps**:
1. Navigate to http://192.168.0.244:4205/automobiles/discover
2. Locate "Model Picker" panel
3. Click pop-out button (⇲ icon or "Pop Out" button)
4. Observe new window opening

**Expected Results**:
- [ ] New window opens with URL pattern `/panel/discover/manufacturer-model-picker/picker`
- [ ] Window title shows panel name
- [ ] Picker component displays correctly
- [ ] No console errors about missing components

**Actual Results**:
- Status: Pending
- Notes:

**Pass/Fail**: ⏳ Pending

---

## Test 2: State Synchronization Main → Pop-Out

**Objective**: Verify filter changes in main window immediately reflect in pop-out

**Prerequisites**:
- [ ] Pop-out window from Test 1 still open
- [ ] DevTools open on both windows
- [ ] Backend responding normally

**Steps**:
1. In MAIN WINDOW, select a manufacturer (e.g., "Toyota")
2. Observe the pop-out Model Picker
3. Wait for up to 2 seconds for sync
4. Check console for BroadcastChannel messages

**Expected Results**:
- [ ] Pop-out picker immediately shows only Toyota models
- [ ] Update happens without page refresh
- [ ] Selection is real-time (< 1 second)
- [ ] Main window results table updates simultaneously
- [ ] Statistics panel updates with new data

**Actual Results**:
- Status: Pending
- Notes:

**Pass/Fail**: ⏳ Pending

---

## Test 3: State Synchronization Pop-Out → Main

**Objective**: Verify selections in pop-out immediately update main window URL and state

**Prerequisites**:
- [ ] Pop-out window from Test 1 still open
- [ ] Main window ready for observation
- [ ] DevTools open on main window

**Steps**:
1. In POP-OUT WINDOW, select a manufacturer
2. Watch the main window URL bar
3. Watch main window results table
4. Check DevTools Network tab for API calls

**Expected Results**:
- [ ] Main window URL updates to reflect selection
- [ ] Main window results table updates immediately
- [ ] Statistics panel updates with new data
- [ ] Main window picker updates to match pop-out selection
- [ ] Only ONE API request made (not duplicated)

**Actual Results**:
- Status: Pending
- Notes:

**Pass/Fail**: ⏳ Pending

---

## Test 4: Multiple Pop-Outs

**Objective**: Verify multiple pop-outs can operate independently and receive state updates

**Prerequisites**:
- [ ] Main window ready
- [ ] Pop-out from Test 1 closed (or skip to step 4)
- [ ] DevTools open on main window

**Steps**:
1. In main window, open pop-out for "Model Picker"
2. In main window, open pop-out for "Statistics Panel"
3. Arrange windows so both are visible
4. In main window, select a different manufacturer
5. Observe both pop-out windows

**Expected Results**:
- [ ] Both pop-outs open independently
- [ ] Both pop-outs receive state update simultaneously
- [ ] Statistics pop-out shows updated data
- [ ] Model picker shows updated manufacturer's models
- [ ] Console shows two separate channel creation logs

**Actual Results**:
- Status: Pending
- Notes:

**Pass/Fail**: ⏳ Pending

---

## Test 5: Filter Operations

**Objective**: Verify filter changes propagate correctly across all windows

**Prerequisites**:
- [ ] Pop-out on Model Picker (from Test 1 or 4)
- [ ] Main window with query control visible

**Steps**:
1. In main window, add a filter (e.g., Year: 2020-2023)
2. Watch pop-out Model Picker for changes
3. In pop-out, make a selection
4. Watch main window results table update
5. In main window, remove the filter
6. Watch all windows update

**Expected Results**:
- [ ] Pop-out sees filter chips update in Query Control
- [ ] Pop-out's selection works with active filters
- [ ] Main window results reflect both filter AND selection
- [ ] Statistics show correctly filtered data
- [ ] Removing filters updates all windows

**Actual Results**:
- Status: Pending
- Notes:

**Pass/Fail**: ⏳ Pending

---

## Test 6: Pop-Out Window Close

**Objective**: Verify clean closure and proper cleanup of resources

**Prerequisites**:
- [ ] Pop-out window open (from any previous test)
- [ ] DevTools Memory tab accessible

**Steps**:
1. Take heap snapshot in DevTools (optional)
2. Click browser close button (X) on pop-out window
3. Watch main window for any issues
4. Try to reopen pop-out on same panel
5. Take another heap snapshot (optional)

**Expected Results**:
- [ ] Pop-out closes cleanly without errors
- [ ] Main window continues operating normally
- [ ] Console shows channel cleanup messages
- [ ] Can re-open pop-out on same panel
- [ ] No visible memory increase (optional)

**Actual Results**:
- Status: Pending
- Notes:

**Pass/Fail**: ⏳ Pending

---

## Test 7: Page Refresh

**Objective**: Verify pop-outs close automatically when main window refreshes

**Prerequisites**:
- [ ] Pop-out window open (from any previous test)

**Steps**:
1. Note position/state of pop-out window
2. Click refresh (F5) on MAIN WINDOW
3. Watch pop-out window
4. Wait for main window to finish loading

**Expected Results**:
- [ ] Pop-out closes automatically before main window unloads
- [ ] Main window reloads successfully
- [ ] Console shows beforeunload handler triggered
- [ ] No error dialogs appear
- [ ] Main window loads correctly after refresh

**Actual Results**:
- Status: Pending
- Notes:

**Pass/Fail**: ⏳ Pending

---

## Test 8: Multi-Monitor Scenario

**Objective**: Verify pop-outs work smoothly across multiple monitors

**Prerequisites**:
- [ ] System with multiple monitors
- [ ] Pop-out capable of being dragged

**Steps**:
1. Open main window on Monitor 1
2. Open pop-out on Model Picker, drag to Monitor 2
3. Resize pop-out to full Monitor 2 (optional)
4. Make selections in pop-out
5. Watch synchronization across monitors

**Expected Results**:
- [ ] Pop-out operates smoothly on separate monitor
- [ ] State synchronization works across monitors
- [ ] No network/latency issues
- [ ] Both windows visible simultaneously
- [ ] Render performance is smooth

**Actual Results**:
- Status: Skipped (requires multi-monitor setup)
- Notes:

**Pass/Fail**: ⊘ Skipped

---

## Test 9: Network Latency Simulation

**Objective**: Verify application handles delayed state synchronization gracefully

**Prerequisites**:
- [ ] Pop-out window open
- [ ] Chrome DevTools open on MAIN WINDOW

**Steps**:
1. Open DevTools on main window
2. Go to Network tab
3. Set network throttling to "Slow 3G"
4. In main window, change filter
5. Watch pop-out for delayed updates
6. Observe console messages
7. Reset throttling to normal

**Expected Results**:
- [ ] Pop-out eventually updates (may take 2-3 seconds)
- [ ] UI doesn't freeze or show errors
- [ ] State is eventually consistent
- [ ] Console shows message transmission
- [ ] No duplicate messages sent

**Actual Results**:
- Status: Pending
- Notes:

**Pass/Fail**: ⏳ Pending

---

## Test 10: Console Validation

**Objective**: Verify proper message flow between windows via BroadcastChannel

**Prerequisites**:
- [ ] Pop-out window open
- [ ] DevTools open on BOTH main and pop-out windows
- [ ] Both windows have console visible

**Steps**:
1. Search for "[PopOut]" or "[PanelPopout]" in console filters
2. Expand console messages to see full output
3. In pop-out, make a selection
4. Check console messages in both windows
5. Verify channel names match
6. Verify message order is correct

**Expected Console Output**:

*Main Window*:
```
[PanelPopout] ✅ Registered picker configs
[PanelPopout] ✅ Route params received
[PopOutContextService] ⬇️ Message received: PANEL_READY
[PopOutContextService] ⬇️ Message received: PICKER_SELECTION_CHANGE
```

*Pop-Out Window*:
```
[PanelPopout] ✅ Initialized as pop-out
[PanelPopout] ✅ Subscribed to PopOutContextService messages
[PopOutContextService] ⬇️ Message received: STATE_UPDATE
```

**Expected Results**:
- [ ] Channel names match (panel-manufacturer-model-picker in both)
- [ ] Messages flow in correct directions
- [ ] No "Cannot send message on closed channel" errors
- [ ] Timestamps are in correct order
- [ ] No missing console log prefixes

**Actual Results**:
- Status: Pending
- Notes:

**Pass/Fail**: ⏳ Pending

---

## Summary

**Total Tests**: 10
- Completed: 0
- Passed: 0
- Failed: 0
- Skipped: 1 (multi-monitor)
- Pending: 9

**Overall Status**: ⏳ NOT YET STARTED

**Critical Issues Found**: None yet

**Recommendations**:
- Start with Test 1 and proceed sequentially
- Keep DevTools open during all tests
- Document any unexpected behavior
- Take screenshots of errors if they occur

---

**Last Updated**: 2025-12-14
**Next Review**: After completing all applicable tests
