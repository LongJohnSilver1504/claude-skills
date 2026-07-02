---
name: modify-feature
description: Extend or refactor EXISTING feature code with discipline. Use when adding code to a feature that already ships (a new hook, component, endpoint, or section inside an existing module), when restructuring components without changing behavior (extract a hook, split a fat component, promote to shared, absorb duplication, migrate to current conventions), or when the user says "refactor", "extract", "move this to shared", "add X to the Y feature", "clean this component up". NOT for building a new feature from scratch (create-feature), shared plumbing (create-infrastructure), visual-only polish (refactoring-ui), bug fixes (systematic-debugging), or behavior changes (those are features — route to the pipeline).
---

> **Path convention:** `{app}` is the project's new-code root from `.claude/rules/project-structure.md` (some projects use `src/new-app/`, others `src/` directly). Resolve it from the rule before writing any file — never assume.
> **If `project-structure.md` does not exist:** stop and ask the user (AskUserQuestion) to define the structure before scaffolding anything. For a **new project**, propose a sensible default (e.g., `src/features/` with `src/shared/` and `src/ui/`) as the recommended option; for an **existing project**, detect candidate roots from the actual tree (Glob for `features/`, `shared/`, `ui/`) and present them as options. Then offer to save the answer as `.claude/rules/project-structure.md` so no one has to ask again.

# Modify Feature

Two workflows over existing code: **Extend** (add code to a shipped feature) and **Refactor** (restructure without behavior change). Both share the same first and last phases.

## Am I in the right skill?

| Situation | Route to |
|---|---|
| New feature/module from scratch | `create-feature` |
| Shared plumbing (provider, layout, i18n namespace) | `create-infrastructure` |
| Bug — something behaves wrong | `systematic-debugging` |
| Visual polish or design audit only | `refactoring-ui` |
| Behavior changes, new user-visible capability, or multi-feature impact | Pipeline: `brainstorm` / `generate-prd` |
| Add code inside an existing feature | **This skill — Extend** |
| Restructure existing code, zero behavior change | **This skill — Refactor** |

If a request mixes refactor + behavior change, split it: refactor first (this skill), behavior second (pipeline or Extend). Never both in one diff.

## Phase 0 — Read First (both workflows, mandatory)

1. **Map the slice.** `ls` the feature directory; Read every file you plan to touch, its co-located tests, and the feature barrel. Do not edit code you haven't read.
2. **Load the relevant rules.** Read the `.claude/rules/` files matching what you'll touch (components → component-hook-separation, layout-ownership; hooks → tanstack-query; API → api-boundary, error-handling; anything → project-structure). Rules are the source of truth — never rely on memory of them.
3. **Reuse check.** Before writing anything new, search for an existing solution: the project's ui root and its `custom/`, `shared/`, and sibling features. Use existing components **as-is** — if one almost fits, adapt the consumer, don't extend the shared component.
4. **Consumer map.** Grep the call sites of every export you plan to change (repo-wide, not just the feature). This list is your blast radius — you'll re-check it in the final phase.

## Workflow A — Extend

1. **Placement first.** Decide where the new piece lives per `project-structure.md`: inside the sub-feature that uses it, at the parent feature's shared level (`hooks/`, `domain/`, `api/`) if 2+ sub-features need it, or promoted to `shared/` / `ui/custom/` only when it's genuinely cross-feature.
2. **Follow the neighboring pattern.** The new code should look like the file next to it — same naming, same hook/component split, same test style. Consistency with the local slice beats the ideal template. When the neighbor predates a current rule, follow the rule and note the drift; don't copy the outdated pattern.
3. **New API surface → the boundary applies.** A new endpoint means dto schema + mapper + hand-authored domain type per `api-boundary.md` — even inside a feature that predates the pattern.
4. **Write the code + its tests** (co-located; two-level factories per the `frontend-testing` skill if the feature has them).
5. Go to Final Phase.

## Workflow B — Refactor

1. **Classify honestly.** Will ANY user-visible behavior change (rendered output, requests, navigation, timing)? Yes → this is not a refactor; stop and route to the pipeline. The test for later: **zero assertion changes** in existing tests.
2. **Safety net before touching.** Do the existing tests pin the current behavior of what you're restructuring? If coverage is thin, write characterization tests FIRST and watch them pass against the current code — a refactor without a net is a gamble, not a refactor.
3. **Use the standard moves** (each links to its rule):
   - **Extract hook from component** → component-hook-separation.md (component becomes a pure renderer)
   - **Split a fat component** → layout-ownership.md (children render flush; the parent owns spacing)
   - **Promote to `shared/` or `ui/custom/`** → project-structure placement rules; move, update every consumer from the Phase 0 map, delete the original
   - **Absorb duplication** → react-clean-architecture extraction triggers (3+ occurrences, or 2 with a third in sight — not before)
   - **Migrate legacy code toward `{app}` patterns** → project-structure.md scope notes (only when already touching that code)
   - **Feature predates the API boundary** → migrate that endpoint's slice to dto/mapper per api-boundary.md's migration note (see the stays migration as the reference)
4. **Execute surgically.** Every changed line traces to the refactor goal (working-principles trace test). No drive-by improvements, no comment rewrites, no formatting churn — mention smells you find, don't fix them here.
5. Go to Final Phase.

## Final Phase (both workflows)

1. **Consumer sweep.** Re-grep the Phase 0 consumer map: every call site compiles against the new shape, imports updated, no orphaned exports left behind.
2. **Fresh verification** (verification-before-completion.md): `pnpm vitest run {feature-dir}` — if the glob matches 0 test files, that's a FAIL, not a pass — and `pnpm build`. For Refactor: the suite must be green with **zero assertion changes**; an assertion you "had to" change means behavior changed — reclassify and tell the user.
3. **Report honestly**: what changed, what was reused vs created, any drift/smells noticed but not fixed.

## Next Step

Use AskUserQuestion to offer: commit via the `git-commit` skill (refactor commits stay separate from feature commits — `refactor(scope):` vs `feat(scope):`), continue with another modification, or run `refactoring-ui` (Audit) if components changed visually.

## Rules

- Never mix refactor and behavior change in one diff.
- Never skip Phase 0 — editing unread code is how conventions drift.
- Never extend a shared component to fit one consumer — adapt the consumer.
- Characterization tests are written BEFORE the refactor, never after.
