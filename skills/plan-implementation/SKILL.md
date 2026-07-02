---
name: plan-implementation
description: Bridge design artifacts (PRD, UX spec with embedded test matrix) into a structured implementation plan. Classifies deliverables as domain features or shared infrastructure, extracts specs, orders by dependencies, and detects shared patterns. Use after prd-to-ux, when planning feature scaffolding, or when user says "implementation plan", "what to build first", "plan the features".
---

# Plan Implementation

Bridge between design artifacts and code scaffolding. Read PRD and UX spec (which includes the test matrix in Pass 9). Produce a structured plan where each deliverable maps to either:

- **create-feature** — domain features with entities, API endpoints, CRUD (lives in `features/`)
- **create-infrastructure** — shared infrastructure: providers, hooks, layouts, i18n, config (lives in `shared/`)

## Required Inputs

At minimum: the PRD. More artifacts = more precise extraction.

1. **PRD** — the product requirements document
2. **Clarified PRD** — if prd-clarifier was used (optional)
3. **UX Specification** — from prd-to-ux (includes test matrix in Pass 9)

## Process

### Step 1: Classify Candidates

Scan design artifacts and extract every distinct deliverable. Classify each using these signals:

| Signal | Domain Feature | Infrastructure |
|--------|---------------|----------------|
| Has a primary entity with fields | Yes | No |
| Consumes external API endpoints | Yes | Rarely |
| Has CRUD operations | Yes | No |
| Lives in | `features/{name}/` | `shared/`, `public/`, root |
| Examples | `payment`, `reservation` | `auth-provider`, `app-layout`, `i18n` |

**Where to find candidates:**

From PRD: Section 4 (core use case steps → features), Section 5 (capabilities → features or infra), Section 7 (data sources → entities vs config).

From UX Spec: Pass 2 (concept groups → features), Pass 5 (elements with state tables → features), layout components → infrastructure.

Output a classification table with: name, source reference, type (Domain Feature / Infrastructure), primary concept.

**If ALL candidates are infrastructure** (no entities, no CRUD), state explicitly that create-feature does not apply and all deliverables use create-infrastructure.

### Step 2: Extract Specs

For each candidate, produce a spec block.

**Domain Feature spec** — include: feature name (singular, lowercase), entity fields with types, API endpoints with HTTP methods, which CRUD operations are needed, UX components mapped to build prompts, whether a Zustand store is needed and why, domain-specific errors.

**Contract verification (required per API endpoint):** for every endpoint in a domain feature spec, include a `verified-against` field stating what the request/response shape was checked against — one of: `real API`, `MSW mock`, `backend doc`, or `UNVERIFIED`. Zod schemas drifting from real API responses is a recurring bug class; `UNVERIFIED` endpoints must be flagged prominently in the plan so implementers and reviewers know the schema is a guess, not a contract.

**Infrastructure spec** — include: name, type (one of the Deliverable Type Catalog entries in the `create-infrastructure` skill: Provider, Shared hook, Layout component/hook/barrel, i18n namespace, Shared utility, Config/Foundation, Test page), target file path, dependencies on other deliverables, acceptance criteria, props/API surface, exports.

### Step 3: Identify Shared Infrastructure

List everything that spans multiple features or must exist before scaffolding. Always include:
- Routes to add (centralized links)
- shadcn components to install
- Dependencies to install
- API client changes needed

For infrastructure-only projects, this section IS the main content.

### Step 4: Order by Dependencies

Order all deliverables so dependencies come first.

**Infrastructure-first rule:** shared infrastructure always before domain features that depend on it.

Include: order number, deliverable name, type, depends on, complexity estimate, what can be parallelized.

When 5+ deliverables exist, include a mermaid dependency graph.

### Step 4.5: Detect Shared Patterns

Before finalizing, scan for deliverables that will independently use the same logic:

- Do 2+ hooks independently fetch the same data?
- Do 2+ hooks independently transform data through the same pipeline?
- Do 2+ hooks independently extract the same value from router/context/store?

If found: extract a shared hook/utility as a new deliverable, insert it before the consumers in the implementation order, update consumers to import it instead of duplicating.

This prevents DRY violations that are expensive to fix later.

### Step 4.7: Enforce Concrete Specs (No Placeholders)

Before writing the plan, review every deliverable spec for vague instructions. Every spec must have concrete, specific instructions — never placeholders.

**Placeholder** (reject these):
- "Add appropriate error handling"
- "Implement the remaining methods"
- "Add validation as needed"
- "Style the component appropriately"

**Concrete** (require these):
- "Add `handleApiError` with status 404 mapped to `RESERVATION_NOT_FOUND`"
- "Create `useReservationList` hook that calls `reservationApi.list()`, returns `{ data, isPending, error }`"
- "Add Zod schema: `z.object({ phone: z.string().min(10) })`"
- "Use Card with `bg-card`, `text-card-foreground`, `rounded-lg border`"

Every spec item must include:
- **Exact file paths** to create or modify
- **What it produces** (a function, a component, a hook, a type)
- **How to verify** (test command, or "file compiles")

If you cannot make a spec item concrete, it needs to be broken down further or clarified with the PRD/UX spec.

### Step 5: Write the Plan

Save as `{prd-basename}-implementation-plan.md` in the same directory as the source PRD. Include: source document paths, feature summary table, classification table, shared infrastructure, implementation order, and all spec blocks.

## Validation Checklist

- [ ] Every PRD functional requirement maps to at least one deliverable
- [ ] Every deliverable is classified as Domain Feature or Infrastructure
- [ ] Domain features have: entity fields with types, endpoints, operations
- [ ] Every API endpoint has a contract-verification field (`real API` / `MSW mock` / `backend doc` / `UNVERIFIED`)
- [ ] Infrastructure deliverables have: type, location, dependencies, acceptance criteria
- [ ] Implementation order respects dependencies
- [ ] Shared infrastructure listed first
- [ ] If infrastructure-only, plan states create-feature does not apply
- [ ] Routes use centralized links (not hardcoded)
- [ ] Shared patterns detected and extracted

## Resume After Context Cleanup

If context was cleaned mid-pipeline, restore state before proceeding:

1. **Read the feature's pipeline artifacts** (`.claude/pipeline/{feature}/` and the feature folder: DESIGN.md, PRD.md, UX-spec.md, PROGRESS.md — whichever exist) for accumulated context
2. **Read the relevant artifact** for this skill's input:
   - The PRD and UX spec files
3. **Continue from where you left off** — don't restart the skill from scratch

## Next Step

After completing this skill, use the `AskUserQuestion` tool to present the next step options. Include a summary of what was completed in the question text.

Options to present:

- **execute-tasks** (primary, default) — execute the full plan with autonomous subagents. This is the skill that consumes the plan produced here.
- **Manual scaffolding** — scaffold a single deliverable by hand instead of running the pipeline: `/create-feature` for one domain feature, `/create-infrastructure` for one infrastructure deliverable
- **Something else** — do something different

**Skill routing:**

- Primary path: invoke `/execute-tasks` with the path to the implementation plan
- Manual scaffolding alternatives (only when the user explicitly wants to build one deliverable by hand):
  - Domain feature: invoke `/create-feature` with the feature spec
  - Infrastructure deliverable: invoke `/create-infrastructure` with the deliverable spec

Do NOT present numbered text options and ask the user to "type a number." Always use the `AskUserQuestion` tool for skill transitions.


## Related Skills

| Skill | Relationship |
|-------|-------------|
| **prd-to-ux** | Upstream — produces UX spec with embedded test matrix consumed here |
| **execute-tasks** | Downstream (primary) — consumes the plan and executes it with subagents |
| **create-feature** | Downstream (manual alternative) — scaffolds one domain feature by hand |
| **create-infrastructure** | Downstream (manual alternative) — scaffolds one infrastructure deliverable by hand |
| **react-clean-architecture** | Reference — informs layer decisions during extraction |
