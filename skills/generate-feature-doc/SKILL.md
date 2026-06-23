---
name: generate-feature-doc
description: Generate feature documentation after implementation by analyzing code changes. Use when documenting completed features, writing technical docs, creating developer guides, or when user wants to document what was built.
---

# Generate Feature Documentation

## Overview

Generate comprehensive technical documentation AFTER a feature has been implemented. This skill analyzes the actual code to produce accurate, up-to-date documentation.

## When to Use

- After completing a feature implementation
- When documenting existing features
- Creating developer onboarding guides
- Updating documentation after refactoring

## Context Gathering

Before generating documentation, gather information about:

1. **Git diff / changed files** - What was added or modified
2. **New models and services** - Domain layer additions
3. **New stores** - Zustand state management
4. **New hooks and queries** - Data fetching patterns
5. **New components** - UI layer additions
6. **Tests and fixtures** - Test coverage
7. **API endpoints** - External integrations

## Documentation Structure

Generate documentation with these sections:

```markdown
# Feature: [Feature Name]

## 1. Overview
[Brief description of what this feature does]

## 2. Architecture
[How this feature is structured]

## 3. Data Flow
[How data moves through the feature]

## 4. Key Files
[Important files and their purposes]

## 5. API Reference
[External APIs consumed]

## 6. Data Models
[Zod schemas and types]

## 7. State Management
[TanStack Query + Zustand patterns]

## 8. Components
[UI components and their props]

## 9. Usage Examples
[How to use this feature]

## 10. Testing
[How to test this feature]

## 11. Known Limitations
[Current constraints and future work]
```

---

## Section Templates

For the complete section templates (11 sections with markdown output examples), read [references/templates.md](references/templates.md).

The sections are:
1. Overview (feature name, status, capabilities)
2. Architecture (directory structure, layer responsibilities)
3. Data Flow (mermaid diagram, flow description)
4. Key Files (file-to-purpose mapping)
5. API Reference (endpoints, request/response examples)
6. Data Models (Zod schemas, types, validation rules)
7. State Management (TanStack Query, Zustand, react-hook-form usage)
8. Components (props tables per component)
9. Usage Examples (basic usage, hooks, mutations)
10. Testing (file locations, MSW handlers, coverage)
11. Known Limitations (constraints, future work, edge cases)

---

## Output Location (Co-located)

Documentation lives **next to the code it describes**, not in a separate `docs/` folder:

| Scope | Location |
|-------|----------|
| **Feature doc** | `src/features/{feature}/README.md` |
| **Shared infrastructure doc** | `src/shared/{module}/README.md` (e.g., `shared/layouts/README.md`) |
| **Provider/utility doc** | `src/shared/{folder}/README.md` |

Co-location ensures documentation is:
- Discoverable when browsing code
- Updated alongside code changes
- Included in feature-scoped PRs

Do NOT create a separate `docs/` folder. Keep docs with the code.

## Generation Process

1. **Identify the feature** - Ask for feature name or detect from recent changes
2. **Read the code** - Analyze all files in the feature directory
3. **Extract information** - Types, hooks, components, patterns used
4. **Generate sections** - Fill in each template section
5. **Review with user** - Allow corrections before finalizing
6. **Save documentation** - Write to appropriate location
7. **Clean up intermediate artifacts** - Delete pipeline artifacts that are no longer needed (see below)

## Spec-Driven Development: Artifact Cleanup

After generating the README, delete intermediate pipeline `.md` files that served their purpose. Only the **spec files** and **README** survive the pipeline.

### What stays (co-located in feature folder)

| File | Why |
|------|-----|
| `PRD.md` | Source of truth — requirements reference for spec-driven development |
| `UX-spec.md` | Design spec — UI reference for spec-driven development |
| `README.md` | Generated documentation — developer onboarding |

### What gets deleted

| Pattern | Why |
|---------|-----|
| `PRD-*-clarification-session.md` | Intermediate — clarifications are already merged into the PRD |
| `PRD-*-implementation-plan.md` | Intermediate — plan was executed, no longer needed |
| `DECISIONS.md` | Intermediate — decisions absorbed into README |
| `PRD-*.md` (iteration variants) | Intermediate — sub-PRDs for phases/iterations are absorbed into the main PRD and README |
| `DESIGN.md` (in `.claude/pipeline/{feature}/`) | Intermediate — brainstorm output absorbed into PRD and README |

After writing the README, delete **all** intermediate files. Only `PRD.md`, `UX-spec.md`, and `README.md` survive:

```bash
# Delete all PRD variants and intermediate artifacts
rm -f {feature-dir}/PRD-*.md
rm -f {feature-dir}/DECISIONS.md
# Also clean brainstorm artifact from pipeline directory
rm -f .claude/pipeline/{feature-name}/DESIGN.md
```

> **Important:** `PRD-*.md` files (e.g., `PRD-v2.md`, `PRD-enrichment.md`, `PRD-bay-status-card.md`) are iteration artifacts from the pipeline. The original `PRD.md` is the authoritative requirements reference. Sub-PRDs served their purpose during implementation and are now captured in the README.


## Commit

After completing documentation generation and artifact cleanup, invoke the `git-commit` skill to commit all changes (README updates, deleted intermediate files, etc.).

## Resume After Context Cleanup

If context was cleaned mid-pipeline, restore state before proceeding:

1. **Read DECISIONS.md** in the feature folder for accumulated context
2. **Read the relevant artifact** for this skill's input:
   - The feature code in `src/features/{feature}/` and any existing README.md draft
3. **Continue from where you left off** — don't restart the skill from scratch

## Next Step

After the commit, use the `AskUserQuestion` tool to present the next step options. Include a summary of what was completed in the question text.

Options to present:

- **finish-feature** — finalize, commit, or create PR
- **Something else** — do something different

Do NOT present numbered text options and ask the user to "type a number." Always use the `AskUserQuestion` tool for skill transitions.

## Context Management

After completing this skill's work, report the **context usage percentage** so the user can decide whether to clean context:

> "{Skill output summary}. Context usage: **{X}%**"

Do NOT recommend cleaning context — just show the percentage. The user will decide.
