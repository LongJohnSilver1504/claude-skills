# Redesign protocol

Read before modifying an existing visual product.

## 1. Classify the mode

- **Extension** — add or change a bounded element inside the current system. Match the existing vocabulary; new elements are indistinguishable from the originals. Do not improve unrelated surfaces.
- **Redesign · preserve** — modernize while keeping identity, information architecture, content voice and behavioral contracts. Targeted evolution; stop when the brief is satisfied.
- **Redesign · overhaul** — a new visual language over the agreed product, content and technical contracts. Not permission to rewrite everything.

Ambiguous preserve-vs-overhaul that would change the result → one focused question.

## 2. Audit before editing

Record the current state in a short brief.

**Visual system:** color roles and actual usage ratios · type families, scale, weights, measures · spacing rhythm and container widths · radius, border, shadow and elevation rules · icon, illustration and photo treatment · motion durations, easing, triggers.

**Product and content:** page tree, navigation, key journeys and conversion paths · content blocks and their purpose · voice, legal copy, localization, real data · loading, empty, error, disabled and permission states.

**Technical contracts:** routes, slugs, anchors, deep links · form field names, order, validation, autofill · analytics events, data attributes, test selectors, experiment hooks · component APIs and consumers · accessibility semantics, keyboard behavior, focus order, announcements · SEO metadata, canonical URLs, structured data.

Sort observations into **Preserve** (recognizable or contract-critical strengths), **Improve** (weak hierarchy, spacing, contrast, responsiveness), **Remove** (unsupported clutter, broken patterns, dead interactions, fabricated content).

## 3. Protected contracts — never changed silently

- Route structure, slugs, anchor IDs, primary navigation labels
- Logo, wordmark, identity-critical assets
- Form field names, order, submission behavior
- Legal, consent, privacy, pricing, compliance copy
- Analytics events, selectors, experiment identifiers
- Existing accessibility wins
- Public component APIs, persistent-state keys
- User-provided content and real data

Ask for authorization when the requested outcome genuinely needs one of these to change.

## 4. Modernization order — lowest-risk lever first

1. Correct functional and accessibility failures.
2. Repair hierarchy and typography.
3. Normalize spacing, alignment, responsive behavior.
4. Consolidate tokens; remove rogue styling.
5. Improve states and interaction feedback.
6. Add justified motion.
7. Recompose the hero or key sections.
8. Replace whole blocks only when they cannot be repaired.

The visible-impact-per-risk ranking for a "make it look premium" ask: font and display type → color and surface cleanup (remove background gradients, snap to the palette) → hover/active/focus states → layout and spacing scale → motion pass → generic-component swaps → loading/empty/error states → copy pass → type-scale polish.

## 5. The plan, stated before editing

```text
Mode:
Preserve:
Improve:
Remove:
Protected contracts:
Design read + dials:
Highest-risk change:
Rollback:
```

A decision record, not an essay. Report the diagnosis and let the user veto items before any fix lands. Work with the existing stack; check the dependency file before importing anything; keep changes small and reviewable.
