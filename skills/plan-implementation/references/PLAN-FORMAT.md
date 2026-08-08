# PLAN-FORMAT — the artifact `plan-implementation` writes

Saved as `{prd-basename}-implementation-plan.md` in the same directory as the source PRD.

## Template

```markdown
# Implementation Plan: {Feature Name}

**Sources**: {paths to PRD, clarified PRD, UX spec}

## Summary

| # | Deliverable | Type | Depends on | Complexity | Parallelizable |
|---|------------|------|-----------|------------|----------------|
| D1 | {name} | Infrastructure | — | S | with D2 |
| D2 | {name} | Domain Feature | D1 | M | — |

{mermaid dependency graph when 5+ deliverables}

## Classification

| Candidate | Source ref | Type | Primary concept |
|-----------|-----------|------|-----------------|

## Shared Infrastructure

- Routes to add (centralized links): {...}
- shadcn components to install: {...}
- Dependencies to install: {...}
- API client changes: {...}

## Deliverable Specs

### D{N}: {name} (Domain Feature)

- **Entity**: {fields with types}
- **Endpoints**: {method + path, each with `verified-against: real API | MSW mock | backend doc | UNVERIFIED`}
- **Operations**: {list/detail/create/update/delete}
- **Components**: {UX components mapped to build prompts}
- **Store**: {Zustand needed? why}
- **Errors**: {domain-specific errors}
- **Files**: {exact paths to create/modify}
- **Verify**: {test command, or "file compiles"}

### D{N}: {name} (Infrastructure)

- **Type**: {Provider | Shared hook | Layout component/hook/barrel | i18n namespace | Shared utility | Config/Foundation | Test page}
- **Path**: {target file path}
- **Depends on**: {other deliverables}
- **Acceptance criteria**: {...}
- **API surface**: {props/exports}
- **Files**: {exact paths}
- **Verify**: {test command, or "file compiles"}
```

## Rules

- Every spec item has exact file paths, what it produces, and how to verify — no placeholders ("add appropriate error handling" is rejected; "add `handleApiError` with 404 → `RESERVATION_NOT_FOUND`" is required).
- `UNVERIFIED` endpoints are flagged prominently — implementers and reviewers must know a schema is a guess, not a contract.
- Infrastructure always precedes the domain features that depend on it.
