---
name: plan-implementation
description: Bridge design artifacts (PRD, UX spec, test plan) into a structured implementation plan. Classifies deliverables as domain features or shared infrastructure, extracts specs, orders by dependencies, and detects shared patterns. Use after generate-test-plan, when planning feature scaffolding, or when user says "implementation plan", "what to build first", "plan the features".
---

# Plan Implementation

Bridge between design artifacts and code scaffolding. Read PRD, UX spec, and test plan. Produce a structured plan where each deliverable maps to either:

- **create-feature** — domain features with entities, API endpoints, CRUD (lives in `features/`)
- **create-infrastructure** — shared infrastructure: providers, hooks, layouts, i18n, config (lives in `shared/`)

## Required Inputs

At minimum: the PRD. More artifacts = more precise extraction.

1. **PRD** — the product requirements document
2. **Clarified PRD** — if prd-clarifier was used (optional)
3. **UX Specification** — from prd-to-ux (optional but recommended)
4. **Test Plan** — from generate-test-plan (optional but recommended)

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

**Infrastructure spec** — include: name, type (see [references/infrastructure-types.md](references/infrastructure-types.md)), target file path, dependencies on other deliverables, acceptance criteria, props/API surface, exports.

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
- [ ] Infrastructure deliverables have: type, location, dependencies, acceptance criteria
- [ ] Implementation order respects dependencies
- [ ] Shared infrastructure listed first
- [ ] If infrastructure-only, plan states create-feature does not apply
- [ ] Routes use centralized links (not hardcoded)
- [ ] Shared patterns detected and extracted

## Resume After Context Cleanup

If context was cleaned mid-pipeline, restore state before proceeding:

1. **Read DECISIONS.md** in the feature folder for accumulated context
2. **Read the relevant artifact** for this skill's input:
   - The PRD, UX spec, and test plan files
3. **Continue from where you left off** — don't restart the skill from scratch

## Next Step

After completing this skill, use the `AskUserQuestion` tool to present the next step options. Include a summary of what was completed in the question text. The options depend on the plan content:

**If the plan is infrastructure-only:**

Options to present:

- **create-infrastructure** — scaffold {first deliverable}
- **Something else** — do something different

**If the plan has both domain features and infrastructure:**

Options to present:

- **create-infrastructure** — scaffold infrastructure first
- **create-feature** — scaffold {first feature}
- **Something else** — do something different

**Skill routing:**

- For domain features: invoke `/create-feature` with the feature spec
- For infrastructure deliverables: invoke `/create-infrastructure` with the deliverable spec

Do NOT present numbered text options and ask the user to "type a number." Always use the `AskUserQuestion` tool for skill transitions.

## Context Management

After completing this skill's work, report the **context usage percentage** so the user can decide whether to clean context:

> "{Skill output summary}. Context usage: **{X}%**"

Do NOT recommend cleaning context — just show the percentage. The user will decide.

## Related Skills

| Skill | Relationship |
|-------|-------------|
| **generate-test-plan** | Upstream — produces test plan consumed here |
| **create-feature** | Downstream — scaffolds domain features (entity + API + CRUD) |
| **create-infrastructure** | Downstream — scaffolds shared infrastructure (providers, hooks, layouts, i18n) |
| **react-clean-architecture** | Reference — informs layer decisions during extraction |
| **error-handling** | Reference — informs domain error identification |
