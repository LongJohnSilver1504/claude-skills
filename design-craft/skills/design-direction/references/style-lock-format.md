# `.design/style-lock.md` — format

The single source of truth for a project's visual system once established. Every later request reads tokens and rules from here instead of re-deriving them. Adapt fields to the project; never pad with values you did not actually derive.

```markdown
# Style lock — <project name>

Established: <date>. Grounding: <codebase tokens | user assets | reference: <what> at ~<N>% | anchor: <name> | mood: <name>>
Design read: <artifact> for <audience>, mode <Persuade|Operate|Read|Experience>, lane <specific family>, dials v<n> m<n> d<n> a<n>

## Palette
- Neutral ramp: <tinted toward <hue> at ~<n>% chroma | zero-chroma, deliberate> — steps in use: <list>
- Accent: <hue> — role: interactive + selected. Solid step: <token>. Never on static text.
- Status: <only the ramps the product renders, e.g. danger, success> — each visibly distinct from the accent
- Text: primary <token> · secondary <token> · on-accent <token>
- Surfaces: page <token> · surface <token> · raised <token> · sunken <token>
- Appearance: <single light | single dark | light + dark companion, switched by <mechanism>>

## Color contract
Pairings are a contract, not a set of approved values to combine freely.

| Foreground on background | Floor | Measured |
| --- | --- | --- |
| body/secondary text on page and surface | 4.5:1 (or APCA Lc 75) | <values> |
| label on accent solid | 4.5:1 | <value> |
| accent as text | 4.5:1 | <value> |
| any fill vs the page (does the control show up) | 3:1 | <value> |
| state-carrying border (focus, error, selected) | 3:1 | <value> |

- Text-safe pairings: <list>
- UI-safe pairings (≥3:1, <4.5:1): <list>
- Decorative only (<3:1): <list — never carry text, never the only carrier of state>

Re-measure whenever the palette grows. A token nudged mid-build to clear a pairing is noted here with before → after.

## Typography
- Display: <face> <weights> — why: <traceable to the read>
- Body: <face> <weight>
- Mono: <face, only for code/data/timestamps> | none
- Scale: <ratio or hand-picked list> · base <px>
- Roles: display <size/lh/weight> · title · heading · body · caption
- Rules: headings tracking <value> · uppercase labels tracking <value> · measure cap <ch>

## Shape
- Radius scale: <sm/md/lg values>; nested surfaces concentric (outer = inner + padding)
- Depth: <shadows for elevation, borders for structure | flat hairlines | ...>; elevation levels: <n>
- Image outline: 1px pure black/10 (light) · pure white/10 (dark)

## Spacing and density
- Base unit: 4px · scale in use: <tokens>
- Card padding floor: compact <px> · content <px> · showcase <px>
- Section padding tiers (marketing only): connective <px> · standard <px> · pivotal <px>
- Density: <dense operational | balanced | gallery-airy>
- Section separation (marketing): <whitespace only | alternating tint | hairline> — one mechanism everywhere

## Motion
- Feel: <crisp and fast | soft and elegant | ...> — matches the mood words below
- Curves: --ease-out <value> · --ease-in-out <value> · --ease-drawer <value>
- Durations: press <ms> · tooltip <ms> · popover <ms> · modal/drawer <ms>
- Never animates: <keyboard-driven actions, high-frequency toggles, …>
- Reduced motion: <how movement degrades while state feedback survives>

## Iconography and assets
- Icon set: <one library>, stroke <1.5px beside regular text / 2px beside semibold>, outline default, fill = active
- Logo: <path> — <preserved from repo | supplied by user>
- Imagery: <photography vs illustration split, treatment>

## Structure (marketing pages only)
- Shared chrome: nav <archetype> · footer <archetype>
- Per page: <page: macrostructure · hero archetype · arc beats>
- Build log: `.design/log.json` (per-build record for rotation)

## Mood words
<2–4 words, e.g. "quiet, confident, technical"> — the gut check for every new screen.

## Do not
- <concrete project-specific rejections, e.g. "no gradients — rejected twice", "no rounded-full buttons">
```

## Rules for the lock

- **Factual and specific.** "Use clean typography" is not a lock line. "Display: Söhne 600, tracking -0.02em" is.
- **Names over values when code owns the values.** If a theme CSS exists, record token names and reasoning; the code stays authoritative for numbers.
- **Every measured claim was measured.** A contrast value written from memory is a lie the next session will trust.
- **The "Do not" list grows.** Every rejected proposal that the user turned down becomes a line, with the reason.
