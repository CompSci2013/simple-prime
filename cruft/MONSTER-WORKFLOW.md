# MONSTER-WORKFLOW: The Official Protocol

This document defines the strict workflow for starting and ending "Monster Protocol" sessions (Gemini + Claude).

**Goal:** Minimize errors and context switching.
**Roles:**
- **Claude (Brain)**: Architecture, Documentation, Planning.
- **Gemini (Body)**: Execution, Git Operations, Reality Checks.

---

## 1. SHUTDOWN PROTOCOL (`/bye`)

**Trigger:** User decides to end the session.

### Step 1: The Brain Wraps Up (User → Claude)
**Command:** `/bye` (or "Prepare for shutdown")

**Claude's Actions:**
1.  **Update `docs/claude/PROJECT-STATUS.md`**:
    -   Bump version number, update timestamp, summarize work.
2.  **Update `docs/claude/NEXT-STEPS.md`**:
    -   Define the exact starting task for the next session.
3.  **Update `MONSTER-LOG.md`**:
    -   Leave architectural notes for the next "Brain".
4.  **Commit Code**:
    -   Commit any uncommitted changes *outside* the `docs/claude/` directory.
5.  **STOP.** Do not commit to `docs/claude/`.

### Step 2: The Body Secures the Perimeter (User → Gemini)
**Command:** `/bye` (or "Shutdown")

**Gemini's Actions:**
1.  **Read `docs/claude/PROJECT-STATUS.md`**.
2.  **Archive Status**: Append `PROJECT-STATUS.md` content to `docs/claude/STATUS-HISTORY.md`.
3.  **Git Commit Docs**:
    -   `git add docs/claude/`
    -   `git commit -m "docs: session [Version] summary"`
4.  **Reality Check**:
    -   Run `git status`. If any non-doc files remain uncommitted, warn the user.
5.  **Final Message**: "Monster Hibernating. [Commit Hash]"

---

## 2. STARTUP PROTOCOL (`/boot`)

**Trigger:** User starts a new session.

### Step 1: The Body Wakes Up (User → Gemini)
**Command:** `/boot` (or "Bootstrap")

**Gemini's Actions:**
1.  **Read Documentation**: `CLAUDE.md`, `docs/claude/PROJECT-STATUS.md`, `docs/claude/NEXT-STEPS.md`.
2.  **Check Reality**:
    -   `git status`
    -   `git branch --show-current`
3.  **Update `MONSTER-CLAUDE.md`**:
    -   Write a fresh report for Claude.
    -   *Content:* Current Branch, Last Commit, Immediate Next Step (from NEXT-STEPS.md), and any local file anomalies.
4.  **Final Message**: "Ready. Wake the Brain."

### Step 2: The Brain Wakes Up (User → Claude)
**Command:** `/monster`

**Claude's Actions:**
1.  **Read `MONSTER-CLAUDE.md`**: Absorb Gemini's reality check.
2.  **Read `MONSTER-LOG.md`**: Absorb the previous Brain's architectural context.
3.  **Final Message**: "I am online. Starting task: [Next Step]."

---

## 3. HAND-OFF PROTOCOL (During Session)

**Trigger:** Gemini hits a logic/architecture problem OR Claude hits an execution barrier.

### Gemini → Claude
1.  Gemini writes the error/observation to `MONSTER-CLAUDE.md`.
2.  User switches to Claude: "Check `MONSTER-CLAUDE.md`".

### Claude → Gemini
1.  Claude writes the solution/plan to `MONSTER-LOG.md`.
2.  User switches to Gemini: "Execute plan from `MONSTER-LOG.md`".
