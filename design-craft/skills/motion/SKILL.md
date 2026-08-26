---
name: motion
description: Build, review or scout UI motion with a design engineer's bar — whether something should animate at all, its purpose, tool, properties, easing, duration or spring, interruptibility, exit, reduced motion and hover gating; recipes for press, popover, tooltip, modal, drawer, toast, accordion, stagger, hold-to-confirm, scroll reveal and drag-to-dismiss. Use when asked to animate something, add or remove motion, make a component feel alive, review transitions ("feels sluggish", "janky", "too much"), or find where motion would genuinely help. NOT for static surfaces, radius and shadows (ui-polish), or the layout that moves (hierarchy-layout).
---

# Motion

One skill, three modes: **build** an animation (default), **review** existing motion, **scout** a UI for places that should and should not animate. All three enforce the same bar; a transition that runs but feels sluggish, lands from the wrong origin, fires too often or drops frames is a regression.

Never present motion options as a menu. Make the call, state the reasoning in one line, write the code. When the honest answer is "this shouldn't animate", give it — that answer is half the point.

## Hard rules

1. Run the build sequence in order; steps 1–2 gate everything.
2. No approximated values. Every curve, duration and spring comes from the tables here or the project's existing motion tokens. Never invent `cubic-bezier(0.4, 0, 0.2, 1)` because it looks familiar.
3. Extend the codebase's motion tokens, never fork them.
4. Reduced motion and hover gating ship with the animation, not as a follow-up.
5. Cheapest tool that works. No library for a fade.
6. Every animated state change also has a static cue (color, icon, label). Motion is never the only feedback channel.

## Build sequence

### 1. Should it animate at all?

| Frequency | Decision |
| --- | --- |
| 100+ times/day (keyboard shortcuts, command palette, core navigation) | **No animation. Stop here.** |
| Tens of times/day (hover, list navigation, frequent toggles) | Near-imperceptible: ≤150ms on opacity or color, or nothing |
| Occasional (modals, drawers, toasts, settings) | Standard animation |
| Rare / first-time (onboarding, success, empty states, celebration) | The delight budget lives here |

Keyboard-initiated actions are a disqualifier, not a judgment call. Raycast has no open/close animation and that is correct for something opened hundreds of times a day. Data the user is reading or acting on does not move for style.

### 2. Name the purpose

Feedback · spatial consistency · state indication · preventing a jarring change · explanation (marketing and onboarding only) · delight (rare tier only). "It looks cool" on a frequently seen element is a reason to stop.

### 3. Pick the tool — cheapest that works

| Need | Tool |
| --- | --- |
| Hover, press, color, a toggle driven by a class or attribute | CSS transition |
| Entry on mount with no JS state | CSS `@starting-style` |
| Predetermined motion that must stay smooth while the page is busy | CSS animation (off the main thread) |
| Programmatic control, CSS performance, no library | WAAPI `element.animate()` |
| Springs, layout animation, exit animation, gesture-driven values | Motion (`motion.dev`) |

CSS beats JS under load: `requestAnimationFrame`-based animation drops frames while the browser loads and paints. If the task is really a *component* (toast, drawer, command menu, dropdown), run the pick-library skill instead of hand-rolling a `<div>` with no focus management.

### 4. Pick the properties

- `transform` and `opacity` only (plus `clip-path` for reveals, and `height` only for accordions). `width`, `height`, `margin`, `padding`, `top`, `left` trigger layout every frame.
- Never `scale(0)`. Enter from `scale(0.95–0.97)` + `opacity: 0`; nothing in the real world appears from nothing.
- `transform-origin` at the trigger for popovers, menus, tooltips (`var(--transform-origin)` in Base UI). **Modals are exempt** — not anchored, so they stay centered.
- Percentages in `translate()` are relative to the element's own size: `translateY(100%)` hides a drawer whatever its height.
- In Motion, animate the full `transform` string; the `x`/`y`/`scale` shorthands run on the main thread and drop frames under load.
- Never drive a child's transform from a CSS variable on the parent — it recalculates every child. Set `transform` on the element.

### 5. Easing and duration, or a spring

| Situation | Easing |
| --- | --- |
| Entering or exiting | `ease-out` |
| Moving or morphing on screen | `ease-in-out` |
| Hover or color change | `ease` |
| Constant motion (marquee, progress) | `linear` |

**Never `ease-in` on UI** — it delays the exact moment the user is watching, so 200ms of `ease-in` feels slower than 200ms of `ease-out`. Built-in curves are too weak; use these tokens:

```css
--ease-out: cubic-bezier(0.23, 1, 0.32, 1);      /* strong ease-out for UI */
--ease-in-out: cubic-bezier(0.77, 0, 0.175, 1);  /* on-screen movement */
--ease-drawer: cubic-bezier(0.32, 0.72, 0, 1);   /* iOS-like sheet curve */
```

| Element | Duration |
| --- | --- |
| Press feedback | 100–160ms |
| Tooltips, small popovers | 125–200ms |
| Dropdowns, selects | 150–250ms |
| Modals, drawers | 200–500ms |
| Marketing, explanatory | may be longer |

UI motion stays under 300ms. A faster spinner makes the same load feel shorter; tooltips after the first open instantly.

Reach for a **spring** when the motion is a drag with momentum, an element that should feel alive, a gesture the user can reverse, or decorative mouse tracking: `{ type: "spring", duration: 0.5, bounce: 0.2 }` (Apple-style) or `{ stiffness: 100, damping: 10 }`. Bounce `0` by default; `0.1–0.3` only after a flick or throw carried momentum. Springs carry velocity through an interruption where keyframes restart from zero. Details in `references/gestures-and-springs.md`.

### 6. Interruption and exit

Transitions, not keyframes, for anything a user can trigger twice in a second (toasts, toggles). Springs for gestures. Exit the way it entered — a toast that slides in from the bottom leaves through the bottom. Exits are softer and shorter than enters (a small fixed `translateY(-12px)` at 150ms, never the full height at 400ms); remove instantly when motion adds no information. Asymmetric timing where the user is deciding: a hold-to-confirm fills over 2s linear, releases in 200ms ease-out.

### 7. Reduced motion and pointer gating

```css
@media (prefers-reduced-motion: reduce) { .el { animation: fade 200ms ease; } } /* keep opacity/color, drop movement */
@media (hover: hover) and (pointer: fine) { .el:hover { transform: scale(1.02); } } /* touch fires false hovers */
```

Reduced motion means fewer and gentler, not zero. Autoplaying media keeps a visible pause control regardless.

### Marketing pages

On a landing page the budget opens: visitors see it once and choreography is part of the argument. The rules above still govern every control; the page-level vocabulary — scroll choreography, word reveals, pinned scrubbed sequences, parallax, marquees, island nav, atmospheric surfaces, GSAP/ScrollTrigger/Lenis tiers by motion dial — lives in the landing-page skill's motion-and-effects reference. Use it there, never on functional UI a user visits daily.

### Recipes

`references/recipes.md` holds ready-to-adapt implementations for press, popover, tooltip, modal, drawer, toast, accordion, stagger, hold-to-confirm, tab indicator, scroll reveal, icon swap, blur-masked crossfade, drag-to-dismiss and WAAPI. Start from the recipe, not a blank file.

## Review mode

Default to flagging; approval is earned. Load the escalation list below, read every animation in scope, and report with the shared format. The fix hierarchy, earliest that works: **delete** (high-frequency, purposeless, keyboard-triggered) → **reduce** (shorter, smaller, fewer properties) → **fix easing** → **fix origin and physicality** → **make interruptible** → **move to the GPU** → **asymmetric timing** → **polish** (blur, stagger, `@starting-style`) → **gating and cohesion**. Slow the interface to 10% in the DevTools Animations panel; what feels off there is what is subtly wrong at full speed.

## Scout mode

Sweep for feedback gaps (pressables with no `:active`), teleporting state (conditional renders with no bridge, accordions that snap), missing spatial story (panels with no origin, dismissals that exit a different way), group entrances that pop in at once, gestures that snap without physics, and flat rare moments (first run, success, empty). Gate every candidate through steps 1, 2, 5 and the function check; expect to reject most. Report at most 5–7 opportunities with exact values, then the 2–5 rejections and the gate that killed each — the rejections are what separate this from a wishlist.

## Never ship

| Never | Instead |
| --- | --- |
| `transition: all` | Name the properties |
| `scale(0)` entrance | `scale(0.95)` + `opacity: 0` |
| `ease-in` on UI | `ease-out` or the strong custom curve |
| Built-in `ease-out` on a deliberate animation | `cubic-bezier(0.23, 1, 0.32, 1)` |
| Animation on a keyboard shortcut or 100+/day action | No animation |
| UI duration over 300ms with no reason | 150–250ms |
| `transform-origin: center` on a trigger-anchored popover | The trigger's origin (modals exempt) |
| Keyframes on toasts, toggles, rapidly triggered elements | CSS transitions |
| Animating `width`/`height`/`margin`/`padding`/`top`/`left` | `transform` / `opacity` |
| Motion `x`/`y`/`scale` props under load | Full `transform` string |
| Ungated `:hover` motion | `@media (hover: hover) and (pointer: fine)` |
| Missing `prefers-reduced-motion` | Gentler variant, not zero |
| Everything entering at once on an occasional view | 30–80ms stagger, never blocking interaction |
| Same speed for enter and exit | Exit shorter and softer |
| Bounce on a menu that merely faded in | Bounce only after momentum |
| Uniform `hover:scale-105` across unrelated elements | Feedback specific to each element's role |

## Output (build mode)

Write the code. Then in a few lines: the gate result (frequency tier, purpose, anything rejected and why), the ingredients (tool, properties, curve, duration or spring), and what to feel-check — play at 2–5× duration, step frame by frame, test gestures on a real device, look again the next day. The code is the deliverable; don't pad this into a report.

## Reporting

**Severity.** `HIGH` is a feel-breaking regression — animation on a keyboard or high-frequency action, `scale(0)` or `ease-in` on UI, a layout-property animation with an easy GPU fix, or motion as the only carrier of a state change. `MEDIUM` is wrong origin, timing, interruptibility or personality. `LOW` is isolated polish.

**Verification.** Without a browser: every duration, curve, animated property, origin and gating read from the code, plus the frequency tier of each animated surface. With one: replay at 10% speed in the Animations panel and step frame by frame for crossfades and coordinated properties.

**Format.** Group findings under the principle each violates, ordered by severity, one row per root cause listing every location it appears in:

| Severity | Location | Before | After | Why |
| --- | --- | --- | --- | --- |

`Location` is `path/to/file:line`. `Why` names the principle and the user impact. Report every check you could not run as `Not verified`.

End with `Block` when any `HIGH` remains, `Approve` otherwise, leaving the rest in the table as work to do. Never `Approve` coverage you did not inspect. With nothing to report, say "No actionable findings" for this domain in one line and report verification.
