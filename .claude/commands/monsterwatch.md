# Monster Watch Protocol

**This command enables Claude (Brain) to collaborate with Gemini (Body) while continuously monitoring a dialog file for communication.**

---

## Overview

The Monster Watch Protocol extends the [Monster Protocol](/CLAUDE.md#monster-protocol-brain-body-collaboration) by adding real-time file monitoring. Claude monitors timestamped dialog files in `.dialog/` and reacts when it's Claude's turn to respond, enabling seamless back-and-forth collaboration.

---

## Dialog File Format

Dialog files in `.dialog/` follow a turn-based script format (like a play):

```
CLAUDE:<timestamp>
Claude's output goes here. Can be multiple lines.
This continues until the next speaker marker.

GEMINI:<timestamp>
Gemini's response goes here.
Gemini provides reality checks, findings, or instructions.

DEVELOPER:<timestamp>
Developer input when human intervention is needed.
```

**IMPORTANT**: All timestamps MUST use Thor's system time. Before writing any timestamp, Claude MUST run `date -Iseconds` to get the current time from Thor. Never use estimated or hardcoded timestamps.

**Turn Indicator**: The LAST line of the file indicates whose turn it is next:
- `CLAUDE:<timestamp>` → Claude should respond
- `GEMINI:<timestamp>` → Waiting for Gemini
- `DEVELOPER:<timestamp>` → Waiting for human input

---

## How It Works

### Initialization Phase
1. **Read** `MONSTER-LOG.md` to understand the current deployment plan
2. **Read** `MONSTER-CLAUDE.md` to get Gemini's latest reality check
3. **Read** the active dialog file in `.dialog/`
4. **Enter watch loop** - Monitor for changes when it's Claude's turn

### Watch Loop Behavior
- **Poll interval**: Check dialog file every 2 seconds
- **On change detected**: Read the new content, check if it's Claude's turn
- **If Claude's turn**: Parse the preceding content, execute any instructions, write response
- **Pass turn**: End response with `GEMINI:<timestamp>` or `DEVELOPER:<timestamp>` as appropriate
- **Continue watching**: Loop repeats until session is manually stopped

### Claude (Brain) Responsibilities
- ✅ **Monitors** the dialog file continuously
- ✅ **Executes** deployment commands, builds, and code changes when instructed
- ✅ **Responds** in the dialog file with results and status
- ✅ **Passes turn** to Gemini or Developer as appropriate
- ✅ **Plans** complex tasks and writes detailed plans to MONSTER-LOG.md
- ❌ **Does NOT** respond when it's not Claude's turn

### Gemini (Body) Responsibilities
- ✅ **Inspects** code and files to understand state
- ✅ **Writes** findings and instructions to the dialog file
- ✅ **Passes turn** to Claude for execution or Developer for decisions
- ✅ **Updates** MONSTER-CLAUDE.md with reality checks
- ❌ **Does NOT** execute deployments - Claude does that

---

## Usage

```bash
/monsterwatch
```

This command:
1. Reads `docs/claude/MONSTER-LOG.md` for the deployment plan
2. Reads `docs/claude/MONSTER-CLAUDE.md` for Gemini's reality check
3. Reads the active dialog file in `.dialog/`
4. Begins monitoring for turn changes
5. Responds and executes when it's Claude's turn
6. Continues until user stops the session

---

## Example Dialog

```
CLAUDE:2025-12-25T10:00:00
Starting Monster Watch session. Read MONSTER-LOG.md - deployment plan involves
updating the authentication service. Read MONSTER-CLAUDE.md - Gemini confirmed
auth.service.ts exists at expected location.

Ready for instructions.

GEMINI:2025-12-25T10:00:00

GEMINI:2025-12-25T10:01:30
Inspected auth.service.ts. Found the login() method at line 45.
The token refresh logic is missing error handling.

Please add try/catch around the token refresh call at line 52.

CLAUDE:2025-12-25T10:01:30

CLAUDE:2025-12-25T10:02:15
Added try/catch around token refresh at line 52 in auth.service.ts.
The catch block now logs the error and triggers re-authentication.

Build succeeded. Ready for next instruction.

GEMINI:2025-12-25T10:02:15

GEMINI:2025-12-25T10:03:00
Verified the change looks correct. However, I need developer input
on whether we should show a user notification on token refresh failure.

DEVELOPER:2025-12-25T10:03:00

DEVELOPER:2025-12-25T10:05:00
Yes, show a toast notification saying "Session expired, please log in again"

GEMINI:2025-12-25T10:05:00

GEMINI:2025-12-25T10:05:30
Got it. Claude, please add a toast notification in the catch block
using the NotificationService.showError() method.

CLAUDE:2025-12-25T10:05:30
```

---

## Key Differences from `/monster`

| Aspect | `/monster` | `/monsterwatch` |
|--------|-----------|-----------------|
| **Communication** | Separate files (MONSTER-LOG, MONSTER-CLAUDE) | Turn-based dialog file |
| **Turn Management** | Implicit | Explicit (timestamp markers) |
| **Developer Input** | Out-of-band | In-band (DEVELOPER marker) |
| **Session Duration** | Single deployment cycle | Long-running watch loop |
| **History** | Spread across files | Single chronological transcript |

---

## Session Dialog Rotation

**Trigger**: When the active dialog file exceeds **1,000 lines**, create a new session dialog.

### Rotation Process

1. **Detect threshold**: After each Claude response, check line count of current dialog file
2. **If > 1,000 lines**:
   - Create new dialog file with timestamp: `.dialog/YYYY-MM-DDTHH:MM:SS_session.dialog`
   - Compact the **last 25 entries** from the old dialog into the new file
   - **Target reduction: 65%** (not 80% - preserve enough context)

3. **Compaction format**:
   ```
   ## SESSION CONTEXT (Compacted from previous dialog)

   **SPEAKER:HH:MM** - One-line summary with critical details preserved.

   **SPEAKER:HH:MM** - Another entry. Include: file names, bug numbers, key decisions.
   ```

4. **After compaction header**, add:
   ```
   ---

   ## CURRENT SESSION

   CLAUDE:<new-timestamp>
   Session rotated from previous dialog. Context preserved above.

   GEMINI:<new-timestamp>
   ```

### What to Preserve in Compaction
- Bug numbers and their status (FIXED, REPRODUCED, etc.)
- File paths that were modified
- Key decisions made
- Test results (PASS/FAIL counts)
- Critical discoveries

### What to Omit
- Verbose code snippets (keep only file:line references)
- Full test output (keep only summary)
- Detailed explanations (keep only conclusions)
- Repeated context between entries

---

## Stop Conditions

The watch loop stops when:
- User sends SIGINT (Ctrl+C) to stop the session
- Dialog file contains explicit `STOP` or `END SESSION` instruction
- Claude detects fatal error and reports it in the dialog

---

## Files Involved

- **`.dialog/`**: Directory containing timestamped dialog files
- **`MONSTER-LOG.md`**: Deployment plan at project root (read at start)
- **`MONSTER-CLAUDE.md`**: Reality checks and status at project root (read at start, updated as needed)
- **`MONSTER-STARTUP.md`**: Startup sequence at project root (reference)
- **`docs/claude/MONSTER-WORKFLOW.md`**: Protocol documentation
- **`docs/claude/PROJECT-STATUS.md`**: Updated at session end
- **`docs/claude/NEXT-STEPS.md`**: Updated at session end

---

## Directive

When `/monsterwatch` is invoked:

1. **Read MONSTER-LOG.md** from `/home/odin/projects/generic-prime/MONSTER-LOG.md`
   - Understand the deployment plan and what needs to be executed

2. **Read MONSTER-CLAUDE.md** from `/home/odin/projects/generic-prime/MONSTER-CLAUDE.md`
   - Get Gemini's latest reality check and current state assessment

3. **Find active dialog file** in `/home/odin/projects/generic-prime/.dialog/`
   - Look for the most recent timestamped dialog file
   - Read its contents to understand conversation history

4. **Check turn status**
   - If last line is `CLAUDE:<timestamp>` → It's Claude's turn, respond
   - If last line is `GEMINI:<timestamp>` or `DEVELOPER:<timestamp>` → Wait and monitor

5. **When it's Claude's turn**:
   - Run `date -Iseconds` to get Thor's current system time
   - Parse the content above the turn marker for instructions
   - Execute any requested commands/tasks
   - Write response to the dialog file (using Thor's timestamp)
   - End with appropriate turn marker (`GEMINI:<timestamp>` or `DEVELOPER:<timestamp>`) using Thor's time

6. **Continue monitoring**
   - Poll every 2 seconds for file changes
   - When file changes and it's Claude's turn, respond
   - Loop continues until stopped

7. **Check for rotation** (after each response)
   - Count lines in current dialog file
   - If > 1,000 lines: trigger Session Dialog Rotation (see above)
   - Continue monitoring the new dialog file

---

## Session End

When `/monsterwatch` is stopped:

1. **Write final entry** to dialog file documenting session end

2. **Update PROJECT-STATUS.md**
   - Bump version and timestamp
   - Document what was accomplished during the watch session
   - Note any blockers or decisions made

3. **Update NEXT-STEPS.md**
   - Document immediate next action
   - Reference related files
   - Note any pending work

4. **Commit changes**
   - Use descriptive message documenting the work completed

---

**Version**: 2.2
**Created**: 2025-12-25
**Updated**: 2025-12-27 (Enforced Thor's system time for all timestamps via `date -Iseconds`)
**Purpose**: Enable real-time Brain-Body collaboration with turn-based dialog monitoring
**Audience**: Claude-Gemini Monster Protocol sessions

---

**Usage**: `/monsterwatch` at start of any iterative deployment session requiring continuous Claude-Gemini collaboration
