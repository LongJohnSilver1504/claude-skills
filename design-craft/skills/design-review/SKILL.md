---
name: design-review
description: Evidence-based, cross-discipline review of an interface — routes a screen, flow or change through every reference skill (accessibility, hierarchy-layout, interface-copy, typography, color-system, ui-polish, motion) plus the style lock and anti-slop gates, and consolidates one ranked Before/After/Why table with a Block or Approve verdict. Use when asked to review, audit, critique or grade UI ("design review", "is this good", "why does this look AI-generated", "what's wrong with this screen"), to review the interface side of a branch, PR or uncommitted change, or as the pre-handoff gate after building. NOT for correctness, tests or security (the project's code review), building fixes (the owning skills), or exploring alternatives (variants).
---

# Design review

One ranked verdict from many disciplines. This skill owns orchestration, severity, consolidation, the cap and the verdict; every rule belongs to the skill that owns it, and nothing here duplicates or overrides those rules.

## Evidence, not taste

Press hard on the escalation triggers and leave deliberate project choices alone. A trigger is a failure whatever the style guide says; a density, radius or voice you merely disagree with is not a finding. The bar for reporting is evidence; the bar for `Approve` is that you inspected what you claim to have inspected. A short report from a real inspection beats a long one padded to look thorough.

## 1. Resolve the scope

**Screen scope** (default): infer the screen, flow, feature or repository from the request and state it. Cover empty, loading, error and narrow-width states where they exist. When the scope is too large to inspect credibly, narrow to one complete flow — the one the request centers on, or the entry path every user passes — state the boundary, and never imply uninspected surfaces were reviewed.

**Change scope**: a request naming a branch, PR, commit range or uncommitted work reviews *the change*, not the codebase. Resolve it per `references/change-scope.md` (merge-base first, then the working tree; never fall back to `HEAD~1` on your own; exclude lockfiles, snapshots and generated output), expand changed files one hop to the surfaces they render in (two for tokens and primitives), read the removed side of every hunk for lost accessibility, focus, motion and text signals, and classify every finding `Introduced`, `Regression` or `Pre-existing`. The cap and the verdict cover `Introduced` and `Regression` only; up to three `Pre-existing` findings ride along in their own section, outside the verdict. Never check out a PR to review it — fetch the ref and read in place.

## 2. Recon before judgment

Identify the framework, styling system, component library, tokens, supported viewports and any preview or test command; write every fix in the project's idiom. Read `.design/style-lock.md` and whatever the project wrote about its interface (`CLAUDE.md`, `CONTRIBUTING.md`, design-system docs); name what you found or that there was none. Documentation tells you *where* a finding belongs — when a shared token or guideline is the cause, report it once against that source with the components as locations — never whether to drop it. "It's in the style guide" retires nothing.

## 3. Load every owning skill and review in order

Confirm each is available, then apply them in this order so foundational failures are not hidden by polish:

1. accessibility · 2. hierarchy-layout · 3. interface-copy · 4. typography · 5. color-system · 6. ui-polish · 7. motion

Then two checks the reference skills do not own: **direction** — does the work match the style lock's tokens, mood words and "Do not" list, and does the design-direction skill's anti-slop list find any tell (default gradient, letter-in-a-box logo, invented metrics, generic template shape, text-wall sections)? — and, for marketing pages, **arc** — can you name what each section does in the argument, and does the CSS stamp still match what shipped?

Take each skill's principles, references and verification checks; its standalone severity ladder and format are replaced by the consolidated ones here. An unavailable skill marks its domain `Not reviewed` by name — never recreate its rules from memory or claim coverage. When two skills seem to cover one issue, assign it to the owner of the underlying rule and note the secondary effect in **Why**.

## 4. Require evidence

Every finding cites `path/to/file:line` and shows the current implementation. No code-level finding from appearance alone; no visual finding from source alone when runtime behavior decides it. Contrast values are measured, never estimated.

## 5. Rank by user impact

- `HIGH` blocks a task, misleads, hides content or controls, risks data loss, or is a repeated systemic failure.
- `MEDIUM` meaningfully harms comprehension, efficiency, adaptability or consistency.
- `LOW` is isolated polish.

Within a severity, rank by reach: a token or shared-component fix outranks the same symptom in one leaf.

**Escalation triggers — `HIGH` on sight once the owning skill confirms them, never averaged down:**

- An interactive control with no accessible name.
- A keyboard-reachable control with no visible focus indicator.
- A control or path reachable by pointer but not by keyboard.
- Motion or autoplay ignoring `prefers-reduced-motion`.
- Content or a control clipped, overlapped or unreachable at 320px or 200% zoom.
- Body or control text whose rendered pair fails its required contrast.
- State or meaning carried by color alone, or by motion alone.
- A destructive action with no confirmation, undo or distinct treatment.
- Truncated content with no way to reach the full value.
- Content reachable only past a scroll edge or disclosure with no visible cue.
- An error that names no way to recover.
- A semantic color used against its meaning.
- Animation on a keyboard-initiated or 100+/day action; `ease-in` or `scale(0)` on UI.
- Invented metrics, logos or testimonials presented as real.

Triggers rank above everything; when more fire than the cap allows, list them first and say how many the cap excluded. In a change review, a confirmed `Regression` against a trigger is `HIGH` even where the pre-existing symptom would be `MEDIUM`.

## 6. Prefer the cheaper fix

When several fixes would work, take the earliest: **delete** (a separator space would carry, an animation on a high-frequency action, an ARIA attribute a native element makes redundant, a ramp nothing imports) → **use the platform** (native element, browser focus ring) → **reuse what the project has** (existing token, spacing step, curve) → **correct the value** (the exact one the owning skill gives) → **add** (a token, a wrapper, a media query). A fix written at "add" where "delete" was available is itself a finding.

## 7. Consolidate

One root cause is one finding, every confirmed location in the same row. Report at most 15 findings. Never pad; a short review or no findings is a valid result.

## 8. Verify what can be verified

Run the safe checks the project offers and inspect the rendered interface when runtime behavior or visual judgment matters. Report the exact command or interaction and its result. A check you cannot run is `Not verified`, never a finding and never silently assumed.

## 9. Review without mutating

A review is read-only. Edit only when the user also asks you to implement the findings; then keep the report as the change scope and re-run the relevant verification afterward. Grading and changing are different acts.

## Output

The full format is in `references/review-format.md`: scope and recon, a coverage table (every domain: findings count, `Clear`, or `Not reviewed: why`), one findings table, verification, verdict.

| Severity | Domain | Location | Before | After | Why |
| --- | --- | --- | --- | --- | --- |
| HIGH | accessibility | `src/Dialog.tsx:42` | `<button><XIcon /></button>` | `aria-label="Close"`, icon `aria-hidden` | icon-only control has no accessible name |

Always a single table with Before and After as columns — never a list of "Before:"/"After:" lines. `Block` when any `HIGH` remains; `Approve` otherwise, with `MEDIUM` and `LOW` left in the table as work to do. `Approve` claims the coverage you reported.

## Before you finish

| Mistake | Fix |
| --- | --- |
| Seven disconnected domain reports | One ranked table |
| Visual claim inferred from source only | Inspect the rendered state or mark `Not verified` |
| Silent coverage gaps | The coverage table shows every domain and state inspected |
| Missing skill treated as covered | `Not reviewed`, by name |
| Every legacy issue in a touched file reported | Three pre-existing findings, in their own section |
| A domain marked `Clear` that the change never touched | `Not reviewed: no evidence in the change scope` |
| A fix that adds where deletion works | Report the deletion |
| Findings phrased as preference | Cite the principle and the user impact, or drop it |
| Contrast "looks low" | Measure it or mark it `Not verified` |

**Done when:** the scope is stated, every domain appears in the coverage table with real evidence or a named reason, every finding has `file:line`, Before, After and Why, triggers lead the table, verification lists what ran and what did not, and the verdict follows the `HIGH` rule.
