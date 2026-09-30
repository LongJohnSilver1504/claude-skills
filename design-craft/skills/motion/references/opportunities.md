# Scout mode — finding where motion belongs

A filter as much as a finder. The premise is that the best animation is often none: a scout that proposes motion everywhere produces the sluggish, over-animated interface the rest of this skill exists to prevent. Expect to reject most candidates; a short high-conviction list beats a wishlist.

Scout mode is **read-only**. It proposes; it does not edit. When the user picks a row, switch to build mode and implement it from the recipe.

## 1. Recon

- Stack and motion tooling: CSS only, Motion (`motion/react`), GSAP, WAAPI. Proposals use what is already installed; a new library is a proposal of its own and needs the pick-library skill.
- Existing easing and duration tokens. Every proposal extends them; where the project has none, propose the skill's `--ease-out`, `--ease-in-out` and `--ease-drawer` once, not per row.
- Personality: a crisp dashboard earns fewer and subtler proposals than a playful consumer app. Read the style lock's motion dial when `.design/style-lock.md` exists.
- A rough frequency map of the surfaces in scope — which screens a user sees 100+ times a day, which once.

**Done when:** tooling, tokens and the frequency map are written down in two or three lines.

## 2. Sweep the seams

Each seam is a known class of genuine opportunity. Work every one; a seam with no candidates is cleared explicitly, not skipped.

| Seam | What it looks like in code | Proposal (build from the named recipe) |
| --- | --- | --- |
| Feedback gap | pressable with no `:active` style | press: `scale(0.96)`, `transition: transform 160ms var(--ease-out)` |
| Slip-prone destructive action | delete confirmed by a single click, no undo | hold to confirm: `clip-path` fill 2s linear, release 200ms `var(--ease-out)` |
| Teleporting content | `{isOpen && …}`, `display: none` toggles, swapped route content | enter from the matching recipe's scale (popover `0.95`, modal `0.96`, tooltip `0.97`) + `opacity: 0`, `var(--ease-out)`, `@starting-style` where there is no JS state |
| Snapping disclosure | accordion, `<details>`, collapse with no transition | accordion: `height` + `opacity` 200ms `var(--ease-out)` |
| List with no bridge | `.map(` over items added or removed on an occasional view | enter/exit with CSS transitions (retarget on rapid triggers), `popLayout` when survivors reflow |
| Orphaned panel | popover, menu or select appearing from its own center | `transform-origin: var(--transform-origin)` at the trigger; modals exempt |
| Asymmetric dismissal | toast or sheet leaving by a different edge than it entered | same path out; `translateY(100%)`, never a pixel height |
| Group pop-in | grid or list on an occasional view appearing all at once | stagger 50ms per item, never blocking interaction |
| Gesture with no physics | drag or swipe handler that snaps on release | spring from `gestures-and-springs.md`, flick dismiss at velocity `> 0.11`, rubber-banding at the edge |
| Flat rare moment | first run, empty state, success, completion | the delight budget: a longer beat, a stagger, bounce `0.2` only after momentum |

Useful greps: `&& (` and `&& <` for conditional renders, `display: none` / `hidden` toggles, `onClick` on elements with no `:active` or `transition`, `<details`, `onPointerDown` / `drag`, `.map(` inside views that mount occasionally, components named `Empty*`, `Success*`, `Onboarding*`.

**Done when:** every seam in the table has candidates with `file:line` evidence or is marked cleared.

## 3. Gate every candidate

Four questions, in order. The first "no" kills the candidate; record which one — it goes in the report.

1. **Frequency** — the tier from build step 1. 100+/day and anything keyboard-initiated is rejected outright. Tens/day survives only as near-imperceptible feedback: press `scale(0.96)` (it runs concurrently with the input and never delays it) or a ≤150ms opacity or color change.
2. **Purpose** — one of the six words from build step 2, named explicitly. Delight only in the rare tier.
3. **Budget** — the duration table from build step 5. A moment that only works as a slow, showy animation fails.
4. **Function** — data the user is reading or acting on (a chart, a table, a balance) does not move for style. The same spring-smoothed pointer effect is fine on a marketing hero and wrong on a banking graph.

## 4. Report

**Opportunities** — at most 5–7 for a whole app, fewer for one view, ordered by leverage:

| # | Location | Today | Purpose | Frequency | Proposal |
| --- | --- | --- | --- | --- | --- |
| 1 | `Toast.tsx:41` | new toasts appear instantly | preventing a jarring change | occasional | toast recipe: `@starting-style { opacity: 0; transform: translateY(100%) }`, `400ms ease`, exit the same edge |
| 2 | `Button.tsx:18` | no press feedback | feedback | tens/day | `:active { transform: scale(0.96) }`, `transition: transform 160ms var(--ease-out)` |

Every Proposal cell names the properties, the curve and the duration or spring — exact values, never "a subtle fade". Include the reduced-motion branch when the proposal moves something, and `@media (hover: hover) and (pointer: fine)` when it involves hover.

**Rejected (required)** — 2–5 candidates considered and killed, each with the gate that killed it:

- `CommandMenu.tsx:12` — palette open/close. Rejected at frequency: keyboard-initiated, 100+/day.
- `RevenueChart.tsx:88` — line drawing on load. Rejected at function: data the user is reading.

**Verdict** — one paragraph: how much motion this interface needs, whether it is already close, and the single highest-leverage row. Nothing surviving the gate is a good result; say so plainly.

When feel cannot be judged from code (a gesture, a crossfade), mark the row `Not verified` and say what to try on a device.
