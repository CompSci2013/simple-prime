# Session End Protocol

**This command implements the session end protocol before exiting.**

---

## Directive

Execute the following steps to properly end the session:

### 1. Update Documentation

1. **Update `docs/claude/PROJECT-STATUS.md`**
   - Bump the version number
   - Update the timestamp to the current time. **CRITICAL**: Use `date -Iseconds` to get the timestamp.
   - Summarize the "Current State" and "Completed Work" for this session
   - Note any new blockers or decisions

2. **Update `docs/claude/NEXT-STEPS.md`**
   - Clear out completed tasks
   - Define the *exact* starting task for the next session
   - Include reproduction steps if it's a bug
   - Reference related files

---

### 2. Check for Fix Loop Results

3. **Check if fix loop produced a successful fix**:
   - Read `.claude/fix-state.json` if it exists
   - If `status` is `"FIXED"`, the fix loop successfully fixed a bug
   - The fixed code MUST be committed before the session ends
   - Example: If BUG-001 was fixed, commit the changed source files with message like `fix: BUG-001 - [description]`

---

### 3. Commit Changes (Two or Three Commits)

4. **First commit** - Fix loop results (if applicable):
   - If `.claude/fix-state.json` shows `status: "FIXED"`, commit the fixed source files
   - Commit message: `fix: [BUG-ID] - [brief description of fix]`
   - Skip if no fix loop was run or fix was not successful

5. **Second commit** - Documentation updates:
   - Run `git add docs/claude/`
   - Commit: `docs: session [Version] summary - [Brief Description]`

6. **Third commit** - Remaining changes (if any):
   - Run `git add .` (excludes files in .gitignore)
   - Review staged files with `git status`
   - **DO NOT commit**: `.claude/fix-log.txt`, `.claude/fix-state.json`, `.claude/dev-server.log` (runtime artifacts)
   - Commit with appropriate message based on changes (e.g., `feat:`, `fix:`, `chore:`)
   - Skip if no remaining changes

---

### 4. Final Message

7. **Provide**:
   - Summary of what was accomplished this session
   - Next session action: What immediate work is needed?
   - Confirmation: All changes committed to git

---

**Session protocol**:
- Include version bump and timestamp in all PROJECT-STATUS updates
- Use git log to verify commits were successful
- Git history serves as the historical record for tracking changes
- This protocol ensures continuity across sessions
