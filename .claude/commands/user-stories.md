# Generate User Stories for Component

**Description**: Generate comprehensive user stories for a UI component for QA testing.

**Usage**: `/user-stories <component-name>`

**Example**: `/user-stories results-table`

---

## Directive

Spawn a `general-purpose` subagent to generate user stories for the component: **$ARGUMENTS**

### Subagent Prompt

```
Generate comprehensive user stories for the "$ARGUMENTS" component.

## Task

1. **Find Component Files**
   - Search for files matching **/*$ARGUMENTS*
   - Identify the main .ts, .html, .scss files

2. **Deep Code Analysis**
   - Read the component TypeScript file completely
   - Read the component template (HTML) completely
   - Read the component styles (SCSS) if relevant
   - Identify all user-facing features, inputs, outputs, and interactions

3. **Search Documentation**
   - Search ALL *.md files in the project for references to this component
   - Look in: docs/, cruft/, pending-pipeline/, README files
   - Extract any existing specifications, requirements, or user flows

4. **Generate User Stories**
   - Write comprehensive user stories in standard format:
     "As a [role], I want to [action], So that [benefit]"
   - Include acceptance criteria for each story
   - Organize into logical Epics
   - Cover: happy path, edge cases, error handling, accessibility, integration

5. **Save Output**
   - Write to: docs/claude/user-stories/$ARGUMENTS.md
   - Follow the exact format of: docs/claude/user-stories/query-control.md

## Format Reference

Use the same structure as query-control.md:
- Overview section
- Epics with numbered user stories (US-XX-NNN format)
- Each story has: title, As a/I want/So that, Acceptance Criteria
- Summary statistics table at end
- Sources referenced section

## Quality Standards

- Be comprehensive - cover ALL component functionality
- Be specific - acceptance criteria should be testable
- Be consistent - use same terminology as existing code
- Prioritize stories: Critical, High, Medium
```

---

## After Subagent Completes

Report:
1. Location of generated file
2. Number of epics and user stories created
3. Any gaps or areas needing clarification
