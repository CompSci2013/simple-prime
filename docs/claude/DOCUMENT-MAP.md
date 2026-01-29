# Document Map

**Purpose**: Index of all documentation with when to use each.

---

## Quick Reference

| Need To... | Read This |
|------------|-----------|
| Understand project structure | [ORIENTATION.md](ORIENTATION.md) |
| Know current state & approach | [PROJECT-STATUS.md](PROJECT-STATUS.md) |
| See what to work on next | [NEXT-STEPS.md](NEXT-STEPS.md) |
| Debug a bug | [../status/KNOWN-BUGS.md](../status/KNOWN-BUGS.md) |
| Understand API contracts | [../specs/02-api-contracts-data-models.md](../specs/02-api-contracts-data-models.md) |
| Add a new domain | [../plan/05-IMPLEMENTATION-GUIDE.md](../plan/05-IMPLEMENTATION-GUIDE.md) |
| Check architecture compliance | [../quality/VERIFICATION-RUBRIC.md](../quality/VERIFICATION-RUBRIC.md) |
| Query Elasticsearch directly | [../infrastructure/ELASTICSEARCH-DATA.md](../infrastructure/ELASTICSEARCH-DATA.md) |

---

## Root Level Files

| File | Purpose | When to Read |
|------|---------|--------------|
| `README.md` | Project introduction | New to project |
| `CLAUDE.md` | Technical reference for Claude Code | Auto-loaded by Claude Code |

---

## docs/claude/ (Session Bootstrap)

| File | Purpose |
|------|---------|
| `ORIENTATION.md` | High-level project overview, infrastructure |
| `PROJECT-STATUS.md` | **Current project state and constraints (VERSIONED)** |
| `NEXT-STEPS.md` | Actionable items for current session |

---

## docs/specs/ (Technical Specifications)

Formal specifications defining what to build.

| File | Purpose |
|------|---------|
| `README.md` | Specs directory overview |
| `01-architectural-analysis.md` | System architecture analysis |
| `02-api-contracts-data-models.md` | API endpoints, request/response formats |
| `03-discover-feature-specification.md` | Discover page 7-panel system |
| `04-state-management-specification.md` | URL-First state architecture |
| `05-data-visualization-components.md` | Tables, charts, pickers |
| `06-filter-picker-components.md` | QueryControl, BasePicker |
| `07-popout-window-system.md` | Multi-window support |
| `08-non-functional-requirements.md` | Performance, security, accessibility |
| `09-testing-strategy.md` | Testing approach (currently deferred) |
| `10-user-preferences-service.md` | User preference storage |
| `11-navigation-authorization.md` | Role-based navigation |
| `auth/authentication-service.md` | JWT authentication |

---

## docs/plan/ (Architecture Plan)

PrimeNG-first migration plan and lessons learned.

| File | Purpose |
|------|---------|
| `00-OVERVIEW.md` | Executive summary, critical mistake analysis |
| `01-OVER-ENGINEERED-FEATURES.md` | What NOT to build |
| `02-PRIMENG-NATIVE-FEATURES.md` | PrimeNG capabilities reference |
| `03-REVISED-ARCHITECTURE.md` | Clean three-layer architecture |
| `04-REVISED-FRAMEWORK-MILESTONES.md` | Build order (F1-F10) |
| `05-IMPLEMENTATION-GUIDE.md` | Code patterns and examples |
| `06-MIGRATION-SUMMARY.md` | Quick reference of changes |
| `FRAMEWORK.md` | Original milestone plan (historical) |

---

## docs/status/ (Current State)

Project tracking and status documents.

| File | Purpose |
|------|---------|
| `KNOWN-BUGS.md` | Active bug tracking with investigation plans |
| `BUGS.md` | Legacy bug list |
| `PROJECT-LOG.md` | Development session log |
| `TLDR-NEXT-STEP.md` | Implementation roadmap |

---

## docs/investigation/ (Analysis & Debugging)

Ad-hoc analysis documents created during debugging.

| File | Purpose |
|------|---------|
| `API-COMPARISON.md` | Port 4201 vs 4205 API differences |
| `API-ARCHITECTURE-ELASTICSEARCH.md` | API URL structure and ES mapping |
| `BACKEND-COMPARISON-ANALYSIS.md` | Backend code comparison |
| `H_PARAMETER_STUDY.md` | Highlight parameter handling |
| `IMPLEMENTATION-VERIFICATION.md` | Chart highlights verification |
| `IMPLEMENTATION-SUMMARY.md` | Architecture evaluation |
| `CHART-HIGHLIGHTS-FIX.md` | Chart highlighting bug fix |
| `QUERY-CONTROL-HIGHLIGHTS-SUMMARY.md` | Highlight filters implementation |
| `UI-COMPONENT-ANALYSIS.md` | UI component decisions |

---

## docs/infrastructure/ (Setup & Backend)

Environment, backend, and data source documentation.

| File | Purpose |
|------|---------|
| `DEVELOPER-ENVIRONMENT.md` | Complete build/deploy guide |
| `BACKEND-API-UPDATES.md` | Quick backend update reference |
| `DATA-SOURCES.md` | Data sources and access methods |
| `ELASTICSEARCH-DATA.md` | Direct ES queries and statistics |
| `NEW-BACKEND-API-SPEC.md` | API design (draft) |
| `SERVICE-DEPENDENCIES.md` | Service architecture |
| `SERVICE-TROUBLESHOOTING.md` | Getting services running |

---

## docs/components/ (Component Specs)

Detailed specifications for specific UI components.

| Directory | Purpose |
|-----------|---------|
| `charts/specification.md` | Statistics charts component spec |
| `charts/README.md` | Charts overview |
| `query-control/specification.md` | Query control panel spec |
| `query-control/SPEC-DRAFT-IN-PROGRESS.md` | WIP requirements gathering |
| `query-control/NEXT_SESSION.md` | Query control implementation handoff |

---

## docs/quality/ (Assessment & Testing)

Quality assurance and evaluation materials.

| File | Purpose |
|------|---------|
| `ASSESSMENT-RUBRIC.md` | Angular 14 assessment framework |
| `GENERIC-PRIME-ASSESSMENT.md` | Application grade (B+ 84/100) |
| `VERIFICATION-RUBRIC.md` | Architecture compliance checklist |
| `MANUAL-TEST-PLAN.md` | Manual testing procedures |

---

## docs/guides/ (Development Guides)

Decision-making aids and patterns.

| File | Purpose |
|------|---------|
| `DEVELOPMENT-DECISION-TREE.md` | Quick implementation decisions |
| `DEVELOPMENT-FLOW-CHART.md` | Visual state flow diagrams |
| `DEVELOPMENT-RUBRIC.md` | Implementation checklist |

---

## docs/templates/ (Documentation Templates)

Reusable templates for creating new docs.

| File | Purpose |
|------|---------|
| `COMPONENT-SPECIFICATION-TEMPLATE.md` | Template for component specs |
| `UI-SPECIFICATION-FRAMEWORK.md` | Methodology for UI specs |

---

**Last Updated**: 2025-12-01