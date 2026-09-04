# design-craft — Maintainer Guide

A stand-alone Claude Code plugin that lives beside `claude-skills` in this repo and shares nothing with it: its own `skills/`, `agents/`, manifests, validator and version. Changes here never touch `../skills/` or the parent's counters.

## Invariants (checked by `node scripts/validate.mjs` — run it after ANY change)

1. **Counts and version stay in sync.** `skills/*/SKILL.md` count matches every "N skills" claim in `README.md`, `package.json`, `.claude-plugin/plugin.json` and `.claude-plugin/marketplace.json`; `package.json` and `plugin.json` carry the same version; `CHANGELOG.md` has a section for it. Every skill has a row in the README catalog.
2. **Reference skills own the rules; nobody restates them.** `accessibility`, `hierarchy-layout`, `interface-copy`, `typography`, `color-system`, `ui-polish` and `motion` each own a domain and name what belongs elsewhere. `design-review`, `variants`, `stress-states`, `landing-page` and `design-direction` route to them by name and never duplicate a rule.
3. **The Reporting tail is byte-identical** across the seven reference skills (the validator holds the canonical text). Each also carries a domain-specific `**Severity.**` and `**Verification.**` line above it.
4. **Exact values, never ranges to approximate.** `scale(0.96)`, `cubic-bezier(0.23, 1, 0.32, 1)`, `oklch(0 0 0 / 0.1)`. A new rule with a number states the number.
5. **No cross-skill file paths.** Skills reference each other by name in prose; `references/` links stay inside the skill.
6. **Descriptions follow the formula.** Model-invoked: what + "Use when <triggers>" + "NOT for <competitors>". Manual-only: `disable-model-invocation: true` + one line. A skill another skill hands off to is never manual-only.
7. **SKILL.md < 500 lines**; depth goes to `references/`.
8. **Agents are read-only** (`tools:` without Write/Edit).
9. **Memory lives in `.design/`** in the consumer's project: `style-lock.md` (the system, the color contract, the "Do not" list) and `log.json` (marketing-build record for rotation). No skill invents a second memory location.
10. **Sources are credited** in `LICENSE` and `CHANGELOG.md`; new borrowed material adds its source there.

## Organization (Matt Pocock's taxonomy)

Start here (`design-help`) → main flow (`design-direction` → build → `design-review`; `landing-page` for marketing) → shaping (`variants`, `stress-states`) → reference layer (the eight rule owners incl. `pick-library`). Keep the README grouped this way.

## Writing style

Opinionated and brief. Positive formulation ("name the properties") over prohibition; prohibitions that stay carry the failure they prevent. `**Done when:**` gates close every workflow skill. Every reference skill ends with a "Before you finish" mistake/fix table and the Reporting section. Test a new or heavily edited skill with one realistic prompt before shipping.

## Validation

```bash
node scripts/validate.mjs
claude plugin validate .claude-plugin/plugin.json   # plugin + every SKILL.md
claude plugin validate . --strict                   # marketplace manifest
```
