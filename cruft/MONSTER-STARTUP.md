# MONSTER-STARTUP: Workflow Guide

This guide outlines how to re-animate the **Monster Protocol** (Gemini + Claude) at the start of a new session.

## 1. Launch Sequence

### Phase 1: Wake the Body (Gemini / "Jerry")
1. Launch **Gemini**.
2. **First Command**: "Hello" or "Bootstrap".
3. **Role**: Action, Reality Checks, Shell Execution.

### Phase 2: Wake the Brain (Claude / "George")
1. Launch **Claude**.
2. **First Command**: `/monster`
3. **Role**: Architecture, Theory, "Inner Life".

---

## 2. The Operational Loop

1. **PROMPT CLAUDE**: Give Claude a task.
2. **CLAUDE WRITES**: Claude will analyze and write instructions to `MONSTER-LOG.md`.
3. **PROMPT GEMINI**: "Read `MONSTER-LOG.md` and execute."
4. **GEMINI ACTS**: Gemini validates the theory, runs code, and writes results to `MONSTER-CLAUDE.md`.
5. **SYNC BACK**: "Claude, Gemini finished. `/monster` again to see results."

---

## 3. Communication Files
- **`MONSTER-LOG.md`**: Orders from the Brain (Claude) to the Body (Gemini).
- **`MONSTER-CLAUDE.md`**: Status reports from the Body (Gemini) back to the Brain (Claude).
- **`.claude/commands/monster.md`**: The custom command that tells Claude how to behave.

---
**Protocol Status**: ACTIVE
**Current Branch**: `main`
