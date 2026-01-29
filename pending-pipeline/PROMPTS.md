# AI Prompts from feature/cline-experiment

**Purpose**: Reference prompts used for vision analysis and code fixing in the autonomous pipeline.

---

## Vision Model Prompt (qwen3-vl)

Used to analyze screenshots for bugs:

```
You are a UI quality analyst. Analyze this screenshot from an Angular/PrimeNG web application.

Look for:
1. Layout issues (misaligned elements, overlapping, cut-off text)
2. State mismatches (filter chips not matching URL, wrong counts)
3. Visual bugs (missing icons, broken layouts, invisible elements)
4. Data issues (empty tables when data expected)

The application shows automobile data with:
- Query Control Panel (filter dropdown, filter chips)
- Results Table (data-testid="basic-results-table")
- Statistics Panel (charts)
- Picker Panel (manufacturer/model selection)

URL is shown in the overlay bar at top of screenshot.

Respond with ONLY valid JSON (no markdown):
{
  "status": "pass" | "fail",
  "bugs": [
    {
      "id": "BUG-001",
      "severity": "critical" | "high" | "medium" | "low",
      "component": "component name",
      "description": "what's wrong",
      "expected": "what should be",
      "actual": "what is shown",
      "suggested_fix": "high-level fix approach"
    }
  ],
  "observations": ["general observations"]
}
```

---

## Coder Model Prompt (qwen3-coder)

Used to generate code fixes:

```
You are a senior Angular developer. Fix this bug in a PrimeNG 20 application.

Project details:
- Angular 20.3.15 with standalone components
- PrimeNG 20.4.0 (Dropdown is now p-select, not p-dropdown)
- TypeScript 5.8.3
- URL-first state management via UrlStateService

Bug to fix:
- Component: {component}
- Description: {description}
- Expected: {expected}
- Actual: {actual}
- Suggested approach: {suggested_fix}

Provide the fix in this EXACT format:

FILE: relative/path/to/file.ts
```typescript
// The exact code block to find and replace
// or new code to add
```

OLD_CODE:
```typescript
// The exact existing code to replace (if modifying)
```

NEW_CODE:
```typescript
// The new code that should replace it
```

EXPLANATION:
Brief explanation of what the fix does.

If you need to see file contents first, say "NEED_FILE: path/to/file" and I will provide it.
```

---

## Response Parsing

The Python pipeline parses the coder response like this:

```python
# Extract file path
file_match = re.search(r'FILE:\s*(\S+)', response)

# Extract old and new code blocks
old_match = re.search(r'OLD_CODE:\s*```\w*\n([\s\S]*?)```', response)
new_match = re.search(r'NEW_CODE:\s*```\w*\n([\s\S]*?)```', response)

# Apply replacement
if old_code in content:
    new_content = content.replace(old_code, new_code, 1)
    file.write_text(new_content)
```

---

## Adaptation Notes

When adapting these prompts for Claude:

1. **Update Angular version** - Currently says 20.x, update to 21.x
2. **Add project context** - Include relevant file paths and patterns
3. **Consider using tools** - Claude can use Read/Edit tools directly instead of NEED_FILE pattern
4. **Structured output** - Claude handles JSON well; keep the structured response format
