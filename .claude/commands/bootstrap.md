# Bootstrap Session

**This command initializes Claude Code sessions with project context.**

---

## Directive

Read the following files in order, then summarize and ask what to work on:

1. `CLAUDE.md` - Read constraints, persona, and session end protocol
2. `docs/claude/ORIENTATION.md` - Read static infrastructure and architecture
3. `docs/claude/PROJECT-STATUS.md` - Read current state and known bugs
4. `docs/claude/NEXT-STEPS.md` - Read immediate action for this session

---

## After Reading All 4 Files

Provide:
1. **Brief summary** of current project state (1-2 sentences from PROJECT-STATUS.md)
2. **Verify**: No circular references detected (all 4 files read once, none reference each other)
3. **Current work**: What is the immediate action from NEXT-STEPS.md?
4. **Question**: "What would you like to work on?"

---

**Session rules**:
- Do NOT use context from past chat sessions - always start FRESH
- Working directory: `~/projects/generic-prime`
- Expert in Angular, Web Applications, Software Architecture
- Constraints: NO `ng build`, NO dev server (ask user if build succeeded)

**Session End Protocol** (when ending session, use `/exit` command):
1. Update PROJECT-STATUS.md (bump version, update timestamp, document findings)
2. Update NEXT-STEPS.md (immediate actions for next session)
3. Commit all changes with descriptive message
