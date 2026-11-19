# PLAN-FORMAT — the artifact `plan-implementation` writes

Saved as `{prd-basename}-implementation-plan.md` in the same directory as the source PRD.

## Template

```markdown
# Implementation Plan: {Feature Name}

**Sources**: {paths to PRD, clarified PRD, UX spec — or "direct mode: no PRD"}

{direct mode only — these two sections replace the PRD and are the whole spec:}
## Request

> {the user's request, verbatim — every message that shaped it, unedited. Corrections the user makes later are appended here, dated, never merged into the original.}

- Assumption: {a gap the codebase already answers} (precedent: {file})
- Open: {a gap a precedent answers only in part — what is still unknown}

## Specs

| ID | Spec | Must not | Check |
|----|------|----------|-------|
| S1 | {one behavior, quoting exact strings from the request} | {only what the request states or plainly implies; otherwise `—`} | {test name or command that proves it} |

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

### D{N}: {name} (Domain Feature | Domain Feature (Extension))

{Extension — the feature already ships: keep `Covers`, `Must not`, `Acceptance criteria`, `Files` and `Verify`; of the rest, list only what is added or changed and omit the others. Name the existing files being modified.}

- **Covers**: {requirement IDs this deliverable fulfils — PRD `R#` or direct-mode `S#`}
- **Must not**: {copied verbatim from each covered requirement's `Must not:`}
- **Acceptance criteria**: {the PRD / UX test-matrix statements this deliverable makes true, one per line}
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
- **Covers**: {requirement IDs, or `—` for plumbing no requirement names}
- **Must not**: {from the covered requirements, or `—`}
- **Acceptance criteria**: {...}
- **API surface**: {props/exports}
- **Files**: {exact paths}
- **Verify**: {test command, or "file compiles"}
```

## Rules

- Every spec item has exact file paths, what it produces, and how to verify — no placeholders ("add appropriate error handling" is rejected; "add `handleApiError` with 404 → `RESERVATION_NOT_FOUND`" is required).
- `UNVERIFIED` endpoints are flagged prominently — implementers and reviewers must know a schema is a guess, not a contract.
- Infrastructure always precedes the domain features that depend on it.
- **Traceability is two-way.** Every P0/P1 requirement ID (or `S#`) appears in at least one deliverable's `Covers`, and every deliverable's `Covers` names real IDs. A requirement no deliverable covers is not built; a `Must not` that stops at the PRD is never checked — the `spec-reviewer` only sees the deliverable spec.
- **Direct mode** (`## Request` + `## Specs`) is for Standard-tier work with no new screens and no open product decisions. The moment a spec row needs a product decision the request does not settle, stop and route to `generate-prd` — a plan must not invent requirements.
