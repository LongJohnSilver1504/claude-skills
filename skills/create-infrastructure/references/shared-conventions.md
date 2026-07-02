# Shared Conventions — Deltas Only

> **Path convention:** `{app}` is the project's new-code root from `.claude/rules/project-structure.md` (some projects use `src/new-app/`, others `src/` directly). Resolve it from the rule before writing any file — never assume.
> **If `project-structure.md` does not exist:** stop and ask the user (AskUserQuestion) to define the structure before scaffolding anything. For a **new project**, propose a sensible default (e.g., `src/features/` with `src/shared/` and `src/ui/`) as the recommended option; for an **existing project**, detect candidate roots from the actual tree (Glob for `features/`, `shared/`, `ui/`) and present them as options. Then offer to save the answer as `.claude/rules/project-structure.md` so no one has to ask again.


Architecture conventions (hook/component separation, error handling, forms, queries, links, colors, layout, Zustand) live in the project's `.claude/rules/` — read those files; do not look for them here. This file lists only the small deltas the rules don't cover.

## i18n JSON shape

next-i18next resolves **nested JSON objects**, not flat dot-notation keys:

```json
// ✅ { "expiredDialog": { "title": "Session Expired" } }
// ❌ { "expiredDialog.title": "Session Expired" }
```

Always create both locale files: `public/locales/en/{namespace}.json` and `public/locales/es/{namespace}.json`. Key naming: `{feature}.{section}.{element}`.

## Import quick-reference (`{app}` per the project's `.claude/rules/project-structure.md`)

| Import | From |
|--------|------|
| `client`, `handleApiError`, `parseResponse` | `@/{app}/shared/api` |
| `AppError` | `@/{app}/shared/errors` |
| `tryCatch` | `@/{app}/shared/utils` |
| `useNotification` | `@/{app}/shared/providers` |
| `links`, `buildUrl` | `@/{app}/shared/links` |
| `cn` | `@/utils/clsxm` |
| shadcn components | `@/{app}/ui/{component}` |
| Custom UI (AppContainer, navbar, …) | `@/{app}/ui/custom/{component}` |
| Icons | `lucide-react` |
| `useTranslation` | `next-i18next` (only in hooks — never in components) |

In another project, resolve the roots from that project's `.claude/rules/project-structure.md`.
