---
name: design-direction
description: Establish and lock a project's visual direction before UI gets built — a design read with dials, tokens grounded in the codebase, a reference, a named anchor, or a mood, anti-default rules, and a persisted `.design/style-lock.md` every later screen reuses. Use when starting UI in a project with no style lock, when the user shares references ("match this vibe", "make it feel like Linear"), asks for a direction or a style, complains the output looks generic or AI-made, or before landing-page or variants work on a cold project. NOT for reviewing existing UI (design-review), building one component against a lock that already exists (the reference skills), or fixing a single token (color-system, typography).
---

# Design direction

Decide what this product looks like once, write it down, and make every later screen read the decision instead of re-deriving it. Generic output is what happens when a model invents taste from a text description on every request; this skill replaces that with a grounded, persisted system.

## Step 0 — Read memory before deciding anything

Check `.design/style-lock.md` in the project root.

- **Exists** → the direction is set. Read it, reuse its exact tokens, structure and "Do not" list for the new work, and stop here unless the user explicitly asks to change direction. Re-deriving a palette or type pairing for the second screen is the drift this file prevents.
- **Missing** → continue. This is a cold start.

Precedence when sources disagree: the user's current request → `.design/style-lock.md` → the codebase's existing tokens → anything below.

## Step 1 — Write the design read

One compact block, inferred from the brief and the codebase. Ask one focused question only when two plausible readings would produce materially different work.

```yaml
Design read:
  artifact: landing page | app screen | dashboard | component | slide deck | ...
  audience: who must understand, trust, or act
  mode: Persuade | Operate | Read | Experience
  visual lane: a specific family ("restrained builder SaaS", "warm editorial", "institutional data-first") — never "modern" or "clean"
  change mode: greenfield | extension | redesign-preserve | redesign-overhaul
  dials: variance N · motion N · density N · art-direction N   (1–10)
```

Default dials by mode, then adjust from the brief:

| Mode | Variance | Motion | Density | Art direction |
| --- | --- | --- | --- | --- |
| Persuade (landing, pricing, campaign) | 7–9 | 5–8 | 3–5 | 7 |
| Operate (app, dashboard, settings) | 3–6 | 2–5 | 6–9 | 4 |
| Read (docs, articles, changelog) | 4–6 | 1–4 | 3–6 | 5 |
| Experience (gallery, showcase, demo) | 8–10 | 6–9 | by artifact | 9 |

The dials are decision variables, not decoration. **Completion test:** someone can point from each dial to a concrete consequence in the plan (asymmetry, amount of motion, content per viewport, first-viewport risk). A dial whose value changes nothing gets removed.

Conflicts: high variance + high density → keep a stable navigation and grid spine, experiment in one layer. High motion + high density → animate transitions and focus, never every element. Accessibility constraints override every dial without asking.

## Step 2 — Ground the direction in something real

Never start from thin air. Work down this ladder and stop at the first rung with material:

1. **The codebase.** Existing tokens, theme CSS, component library, fonts. Extract them; code beats screenshots every time. An extension or preserve-mode redesign ends the ladder here.
2. **Assets the user provides.** Figma, screenshots, a brand kit, a logo. For any branded work, **asset beats spec**: a logo file and real product imagery carry recognition; hex codes alone are not a brand. A logo that can't be sourced is a stop-and-ask, never a colored rectangle.
3. **A reference the user admires** ("match this", "like this site"). Run the study protocol in `references/reference-study.md`: extract the reusable grammar (density, palette relationships, type scale logic, composition rhythm), never the pixels, and set the similarity dial the user asked for.
4. **A named anchor** ("Linear-style", "Aesop feeling", "Braun"). Treat it as a reference: name its signature moves and its protected elements, then build the user's own system from the moves.
5. **Cold start.** Classify the product into a mood with `references/moods.md`, take that mood's type pairing and shape language, and generate a palette from the product idea with the color-system skill's ramp rules. State in one line which mood you read and why so the user can redirect without a questionnaire.

Do not ask the user for hex values, font names, or CSS preferences unless the brand requires them. Read the product; propose; let them redirect.

## Step 3 — Declare the system

Before any code, write the system as a block the user can confirm. Every line is something a different project would plausibly do differently; a line that restates generic advice ("good contrast") is not doing its job.

```markdown
Design decisions:
- Read: <one-line synthesis> · dials <v/m/d/a>
- Grounding: <codebase | assets | reference (dial N%) | anchor <name> | mood <name>>
- Palette: neutral ramp <tinted toward hue / zero-chroma, and why> · accent <hue, role> · status ramps <only the ones rendered>
- Type: display <face, weights> · body <face, weight> · scale <ratio, base> · mono <only for code/data or none>
- Spacing: base unit · card padding floor · section padding tiers (marketing only)
- Shape: radius scale · shadow vs border strategy · image outline rule
- Motion: feel · curves · press/popover/panel durations · what never animates
- Density: <dense operational | balanced | gallery-airy>
- Iconography: <one set, stroke weight matched to text weight>
- Section separation (marketing): <whitespace only | alternating tint | hairline>
- Do not: <project-specific rejections>
```

**Anti-default rules** — the defaults a model reaches for by habit, each a recognized "AI made this" tell. The system must contain none of them unless the brief earns the exception and says so:

- Inter/Roboto/Arial as the display face with a `#3b82f6`-style blue accent, chosen by reflex rather than by the read.
- An indigo→purple or blue→cyan gradient on a hero, a button, or `background-clip: text`.
- A logo that is one letter in a rounded colored square.
- Zero-chroma neutrals on a warm or playful product (a deliberately monochrome technical lane may keep them).
- Italic display type, ultra-bold (800–900) weights, or emoji standing in for icons.
- More than one accent hue, or the accent covering more than ~5% of a viewport.
- Hand-drawn CSS stand-ins for photography, product shots, or browser chrome.
- A palette or type pairing chosen without a stated reason traceable to the read.

Cross-check the block against `references/anti-slop.md` before presenting it.

## Step 4 — Checkpoint

Present the design read and the system block, then **stop and wait** for confirmation. Skip the wait only when the user explicitly said to proceed without checking in. Course-correcting a direction costs one message; course-correcting three built screens costs the screens.

## Step 5 — Write the lock

On confirmation, write `.design/style-lock.md` following `references/style-lock-format.md`, factual and specific, with the "Do not" list and the color contract (which pairings may carry text, which may carry only UI, which are decorative). Respect the project's `.gitignore` convention for the `.design/` folder and say where the file landed.

If the project's tokens live in code (a theme CSS, a Tailwind `@theme` block), the lock records the names and the reasoning; the code stays the source of the values. Never fork a parallel token system.

## Step 6 — Ship a v0 before a v1

For anything larger than one component, build a viewable v0 first: real structure, real tokens, key modules as labeled placeholders (`[hero visual]`, `[chart]`), no content detail, no full state set, no motion. Its purpose is to let the user course-correct tone and layout while it is cheap. Then hand the full build to the reference skills, in this order of leverage: hierarchy-layout → typography → color-system → ui-polish → motion → interface-copy, with accessibility applied throughout and design-review before handoff.

## Adding to an existing UI

Classify before editing: **extension** (add a bounded element that is indistinguishable from the originals), **redesign · preserve** (modernize while keeping identity, IA, voice and behavioral contracts), **redesign · overhaul** (new visual language, same product and technical contracts). The mode sets brand-fidelity: extension pins it at 10; preserve moves variance and motion by at most one point. `references/redesign-protocol.md` holds the audit, the protected contracts that never change silently (routes, form field names, analytics selectors, legal copy, the logo, existing accessibility wins) and the modernization order.

## Before you finish

| Mistake | Fix |
| --- | --- |
| Palette and type picked before the design read | Write the read first; the system serves the read |
| A dial that changes nothing in the plan | Remove it or state the consequence |
| Style lock exists but was not read | Read it first; reuse, never re-derive |
| Tokens invented although the codebase has a theme | Extract from code; record names in the lock |
| Reference reproduced instead of studied | Extract grammar, change subjects, composition and marks |
| Brand task with no logo file | Stop and ask; never ship a colored rectangle |
| System declared and code started in the same breath | Present the block, then wait |
| Lock full of generic advice | Every line names a choice another project would make differently |

**Done when:** `.design/style-lock.md` exists with a design read, grounding source, every system line filled with specific values, a color contract, and a "Do not" list — and the user confirmed the block before it was written.
