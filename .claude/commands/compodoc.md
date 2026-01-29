# Compodoc Analysis Command

**This command executes documentation coverage, circular dependency, and module configuration analysis.**

---

## Directive

Execute compodoc analysis based on the provided flag: `$ARGUMENTS`

### Available Flags

- **`-all`**: Run all analysis types (documentation, circular dependencies, module imports/exports)
- **`-doc`**: Analyze documentation coverage from `coverage.html` (default)
- **`-circular`**: Detect circular dependencies in TypeScript files
- **`-module`**: Analyze module declarations for import/export issues
- **`-gen`**: Regenerate Compodoc documentation in the container
- **`-help`**: Show detailed help message

### Task

If the flag is `-help`, display the detailed help documentation from `docs/COMPODOC-COMMAND.md`.

For all other flags, execute the Python analysis script:

```bash
python3 /home/odin/projects/generic-prime/scripts/compodoc-analyzer.py $ARGUMENTS
```

Run the Python script with the provided flag and display all output directly to the user. The script will:

- **For `-doc`**: Parse `coverage.html` and display documentation coverage metrics by type and layer
- **For `-circular`**: Scan TypeScript files for circular import dependencies
- **For `-module`**: Inspect `@NgModule` decorators for import/export anti-patterns
- **For `-all`**: Run all three analyses in sequence
- **For `-gen`**: Regenerate Compodoc inside the container using podman exec

Do not modify or summarize the script output—show it exactly as returned by the Python script.

---

## After Analysis Completes

Provide:
1. **Summary** of key findings from the analysis
2. **Next actions** based on what was found
3. **Documentation reference** to `docs/COMPODOC-COMMAND.md` for more details

---

**Usage examples**:
- `/compodoc -doc` - Show documentation coverage
- `/compodoc -circular` - Check for circular dependencies
- `/compodoc -module` - Find module configuration issues
- `/compodoc -all` - Run complete analysis
- `/compodoc -gen` - Regenerate Compodoc in container
- `/compodoc -help` - Show help documentation
