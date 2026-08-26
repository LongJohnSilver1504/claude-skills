# Cold-start moods

Use only when the ladder in the skill reached the bottom: no codebase tokens, no assets, no reference, no anchor. The goal is a matched set chosen from the product idea, so the user redirects a proposal instead of answering a questionnaire.

## Classify the product

| Mood | Signals in the brief |
| --- | --- |
| **Premium / confident** | fintech, B2B SaaS, analytics, enterprise, legal, insurance, ops dashboards, "for teams" |
| **Warm / approachable** | wellness, health, coaching, community, parenting, nonprofit, education, food, hobby marketplaces |
| **Technical / builder** | developer tool, API, CLI, infra, devops, database, monitoring, open source |
| **Playful / consumer** | games, creator tools, youth audience, dating, music, social, anything explicitly "fun" |
| **Elegant / editorial** | publishing, portfolio, luxury, fashion, gallery, boutique, agency, "premium but soft" |

When the brief states the mood ("playful app for teens"), use it. When the idea spans two moods with no lean, ask which should dominate — that is the one question worth asking.

## Type pairing per mood

All Google Fonts. Pair for contrast, not similarity; the pairing is a starting point, not a mandate.

| Mood | Display + body | Alternative |
| --- | --- | --- |
| Premium | Unbounded + Albert Sans | Geist + Geist, tight heading tracking |
| Warm | Zain + Nunito | Epilogue + Baskervville (literary) |
| Technical | Archivo + IBM Plex Sans (Plex Mono for code/data only) | Geist + Geist Mono for data |
| Playful | Urbanist + Open Sans | Fredoka + Nunito |
| Elegant | Gloock + Inter | EB Garamond + DM Mono (bylines, dates) |

Body copy is never monospace, even for the technical mood — mono is for code, data, timestamps and short technical labels.

## Shape and density per mood

| Mood | Radius | Depth | Density | Avoid |
| --- | --- | --- | --- | --- |
| Premium | 4–8px | flat or hairline, minimal shadow | balanced–dense | gradients as a crutch, a second saturated color |
| Warm | 12–20px | soft shadows welcome, illustration-friendly | airy | corporate blue, harsh contrast |
| Technical | 0–4px | visible grid and hairlines over shadows | dense | rounded-full buttons, pastels, playful illustration |
| Playful | 16px+ | layered depth, motion-friendly | balanced | everything loud at once — keep a quiet base |
| Elegant | 0–4px | hairline rules between sections, no cards | airy, generous margins | rounded-full buttons, tight measure |

## Palette per mood

Generate, do not copy. Take the mood's hue range and character, then build ramps with the color-system skill (constant hue, even perceived lightness steps, vividness peaking mid-ramp, denser light end) and measure every pairing in the contract.

| Mood | Neutral | Accent character | Appearance default |
| --- | --- | --- | --- |
| Premium | cool-tinted or zero-chroma | one deep, confident hue (indigo, teal, oxblood) | light |
| Warm | warm-tinted (toward orange) | terracotta, olive, ochre | light |
| Technical | zero-chroma or cool | one saturated signal color used sparingly | dark-native |
| Playful | tinted toward the accent | one vivid hue on a quiet base; extra stops only in illustration | light |
| Elegant | warm-tinted, paper-like | a metallic or earth accent, tiny footprint | light |

Two checks that fail most often: the label on the accent solid (an accent that looks fine as a swatch can fail as a button fill — measure it), and the accent's visibility against a dark page (3:1 floor for the fill itself).

## Spacing scale

4px base. Named steps with jobs; skip the in-between values unless an alignment genuinely needs them.

| Token | Value | Use |
| --- | --- | --- |
| 1 | 4px | icon-to-label, badge padding |
| 2 | 8px | label and its value, stacked related lines |
| 3 | 12px | compact component internals, dense rows |
| 4 | 16px | standard component padding |
| 6 | 24px | group separation; **content-card padding floor** |
| 8 | 32px | showcase-card padding; gap between groups in a section |
| 12 | 48px | compact section padding; hero internals |
| 16 | 64px | default section padding; connective sections on a landing page |
| 24 | 96px | weighty sections |
| 32–48 | 128–192px | pivotal landing-page sections (hero, primary proof), desktop only — step down one or two tiers on mobile |

Governing rule: **space around a group ≥ space within it.** Card padding never exceeds the gap between cards.

## Non-Latin scripts

CJK and Korean products do not take the two-family pairing model. Lock one well-built family across a weight scale (Pretendard for Korean, loaded from its own CDN and verified; Noto Sans JP / SC as unvetted starting points), `letter-spacing: 0`, `word-break: keep-all` on UI text, and line-heights looser than the Latin display floor. Verify Latin product names inside CJK copy visually; they read smaller at the same nominal size.
