# Command: /monster

**Description:** Executes Step 2 of the Monster Startup Protocol (The Brain Wakes Up) and establishes Session Directives.

## Startup Instructions
When the user types `/monster`:

1.  **Read `MONSTER-CLAUDE.md`**:
    -   This file contains the "Reality Check" from Gemini (The Body).
    -   Note the current branch, last commit, and any specific file conditions.
2.  **Read `MONSTER-LOG.md`**:
    -   This file contains the architectural context from the previous session's Brain.
3.  **Final Message**:
    -   State: "I am online. Reality check absorbed. Starting task: [Insert Task from NEXT-STEPS.md]."

## Session Directives (Standing Orders)
**You must adhere to these rules throughout the entire session:**

### The Hand-Off Protocol (Brain → Body)
When you have defined a complex task, refactoring plan, or fix that requires execution:
1.  **Write the detailed plan to `MONSTER-LOG.md`**.
    -   Include specific files to touch, code changes to make, and verification steps.
2.  **STOP**. Do not attempt to execute complex shell commands yourself if Gemini is available.
3.  **Notify the User**:
    -   You **MUST** end your response with: **"I have updated MONSTER-LOG.md. User, please wake Gemini to execute this plan."**

### The Feedback Loop (Body → Brain)
If the user says "Check MONSTER-CLAUDE.md":
1.  **Read `MONSTER-CLAUDE.md`** immediately.
2.  This file contains error logs, reality checks, or verification results from Gemini.
3.  Adjust your plan based on this new reality.
