# Review output format

## Scope and recon

State the exact scope (screen, flow, feature, repository — or the change block below), the stack and styling conventions, the style lock and convention documents found, and any boundary you drew.

For a change review, open with:

| Field | Value |
| --- | --- |
| Target | `branch`, `working`, `staged`, `pr 482`, or the range as entered |
| Base ref | `origin/main` at `a1b2c3d` |
| Head ref | `refs/remotes/pr/482` at `e4f5g6h` |
| Commits | 7 committed, 2 files uncommitted |
| Files in scope | 12 after exclusions |
| Excluded | `pnpm-lock.yaml`, `__snapshots__/`: lockfile and snapshots |
| Surfaces expanded | `CheckoutPage`, `SettingsPanel`; 3 further `Button` consumers not expanded |

## Coverage

| Domain | Evidence inspected | Result |
| --- | --- | --- |
| accessibility | files, components, states or checks | findings count, `Clear`, or `Not reviewed: <why>` |
| hierarchy-layout | … | … |
| interface-copy | … | … |
| typography | … | … |
| color-system | … | … |
| ui-polish | … | … |
| motion | … | … |
| direction (lock + anti-slop) | … | … |
| arc (marketing pages only) | … | … |

`Clear` means inspected with no actionable finding. `Not reviewed` always explains why; in a change review, a domain with no evidence in the diff is `Not reviewed: no evidence in the change scope`, which is a coverage statement, not a gap.

## Findings

One table, ordered by severity then by reach. For a change review add a `Status` column (`Introduced` | `Regression`).

| Severity | Domain | Location | Before | After | Why |
| --- | --- | --- | --- | --- | --- |
| HIGH | accessibility | `src/Dialog.tsx:42` | `<button><XIcon /></button>` | add `aria-label="Close"`; `aria-hidden` on the icon | icon-only control has no accessible name |
| MEDIUM | color-system | `src/theme.css:18` (used in `Card.tsx:9`, `Row.tsx:22`) | `--color-border` as caption text | add `--color-text-tertiary` and point captions at it | a token used outside its role breaks the first time borders lighten |

- **Location** is `path/to/file:line`; cite the exact screen and component when there are no source files.
- **Before / After** show the current implementation and an actionable replacement, as columns — never "Before:" and "After:" on separate lines.
- **Why** names the violated principle and the user impact.
- One row per root cause, every affected location listed. At most 15 rows; triggers first, with the count the cap excluded.

With no findings, omit the table and state "No actionable interface findings."

## Pre-existing (change reviews only)

At most three, highest severity first, stated plainly as not this change's responsibility:

| Severity | Domain | Location | Issue |
| --- | --- | --- | --- |
| MEDIUM | typography | `src/Toolbar.tsx:7` | numeric badges use proportional figures; predates this change |

Outside the cap and the verdict.

## Verification

Each check or interaction, the exact command or steps, and the observed result. Passed checks separate from `Not verified`.

## Verdict

- `Block` — one or more `HIGH` findings remain (`Introduced` or `Regression` in a change review).
- `Approve` — no `HIGH` remains; `MEDIUM` and `LOW` stay in the table as work to do. A change whose only findings are pre-existing is an `Approve`.

`Approve` claims the coverage table. Never issue it for a domain you did not inspect.
