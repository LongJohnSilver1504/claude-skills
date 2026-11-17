# FEATURE-MAP-FORMAT — `docs/agents/feature-map.md`

Read by agents before they search for a feature's code, and by `feature-map.mjs check`, which verifies every backticked repo-relative path.

## Template

```markdown
# Feature Map

Where each feature lives. An index, not a contract: when this file and the code disagree, the code wins — fix the map with the `feature-map` skill.

Roots: `src/features` (features) · `src/app` (routes) · backend at {path from project-conventions, or "no local checkout"}

## Features

| Feature | Entry points | Directory | Open first | Backend | Docs | Status |
|---------|--------------|-----------|------------|---------|------|--------|
| Reservations | `/app/reservations`, `/app/reservations/[id]` | `src/features/reservations` | `src/features/reservations/api/reservations.api.ts`, `src/features/reservations/hooks/use-reservation-list.ts` | `GET /reservations`, `PATCH /reservations/:id` | `src/features/reservations/README.md` | current |
| Customers | `/app/customers` | `src/features/customers` | `src/features/customers/index.ts` | `GET /customers` | — | current |
| Invoices | `/app/invoices` | `src/pages/invoices` | `src/pages/invoices/index.tsx` | `GET /invoices` | — | legacy — not yet in `src/features` |

## Shared

| Area | Directory | What lives there |
|------|-----------|------------------|
| API client | `src/shared/api` | The HTTP client, error mapping, endpoint constants |
| Layouts | `src/shared/layouts` | App shell, page containers |

## Routes with no feature

{Routes that render code outside any feature directory — a legacy page, a one-off. One line each: route → file. Delete the section if empty.}
```

## Columns

| Column | Holds | Where it comes from |
|--------|-------|---------------------|
| Feature | The name people use for it | The directory name, or the ticket vocabulary when they differ — say both |
| Entry points | Routes a user reaches it by; a job or a webhook for headless features | Grep the router root for imports of the feature |
| Directory | The feature's root, as a backticked repo-relative path | `feature-map.mjs scan` |
| Open first | Two or three files, backticked: the API adapter, the main hook, the barrel | The barrel and the file names — not a full read |
| Backend | Method and path of the endpoints it calls | The feature's endpoint constants |
| Docs | The feature's README / PRD, when it has one | `ls` the feature directory |
| Status | `current` · `legacy` · `migrating` (name which side serves the route today) | Which root the directory is under |

Routes (`/app/reservations`) and endpoints (`GET /reservations`) are not checked as paths; everything else in backticks with a `/` is.

## Size

- Target under about 150 lines — the file is read whole.
- A repo with more features than that splits by area: `docs/agents/feature-map.md` keeps one row per **area** (name, directory, link to its file) and each area gets `docs/agents/feature-map/<area>.md` in this same format. `check` and `lock` read the root file and every area file together, so a feature directory may be named in either.
- A monorepo keeps one map per app, next to that app's `docs/agents/`.

## Lock file

`docs/agents/feature-map.lock.json` is written by `feature-map.mjs lock` and committed with the map:

```json
{ "version": 1, "roots": ["src/features", "src/app files=page.tsx,route.ts"], "entries": { "src/features": ["src/features/customers", "…"] } }
```

It is not for agents to read and never edited by hand.
