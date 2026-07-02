---
name: create-feature
description: Scaffold a new domain feature module following vertical slicing and hexagonal architecture. Use when the user wants to create, add, implement, or scaffold a new feature with entities, API endpoints, and CRUD operations.
---

> **Path convention:** `{app}` is the project's new-code root from `.claude/rules/project-structure.md` (some projects use `src/new-app/`, others `src/` directly). Resolve it from the rule before writing any file — never assume.
> **If `project-structure.md` does not exist:** stop and ask the user (AskUserQuestion) to define the structure before scaffolding anything. For a **new project**, propose a sensible default (e.g., `src/features/` with `src/shared/` and `src/ui/`) as the recommended option; for an **existing project**, detect candidate roots from the actual tree (Glob for `features/`, `shared/`, `ui/`) and present them as options. Then offer to save the answer as `.claude/rules/project-structure.md` so no one has to ask again.
# Create Feature

Scaffold a complete domain feature module following vertical slicing with hexagonal architecture. This skill handles features with **entities, API endpoints, and CRUD operations** that live under the features root defined in `.claude/rules/project-structure.md`.

For shared infrastructure (providers, hooks, layouts, i18n, config), use **create-infrastructure** instead.

**Related:** create-infrastructure (shared infra), plan-implementation (upstream planning), react-clean-architecture (architecture rationale), frontend-testing (post-scaffold tests), generate-feature-doc (post-implementation docs).

**Conventions live in the project's `.claude/rules/`** — this skill carries only the scaffold order, file map, and templates. Read the relevant rule before writing each layer:

| Layer | Rule file |
|-------|-----------|
| Where code lives, import direction | `project-structure.md` |
| Wire DTOs, mappers, domain-type ownership | `api-boundary.md` |
| API adapters, `AppError`, `handleApiError`, `parseResponse` | `error-handling.md` |
| Query keys, `useQuery`/`useMutation`, invalidation | `tanstack-query.md` |
| Forms (`zodResolver` + `Controller` + `Field`) | `form-patterns.md` |
| Component/hook separation, translate-in-hooks | `component-hook-separation.md` |
| Routes and endpoint constants | `centralized-links.md` |
| Colors (semantic tokens only) | `color-usage.md` |
| Page layout / `AppContainer` | `layout-ownership.md` |
| Zustand stores | `zustand-patterns.md` |
| Tests | `testing.md` |

Small deltas not covered by the rules are listed in [references/shared-conventions.md](references/shared-conventions.md).

**Living example:** the merged `stays` feature — read its `api/`, `domain/`, `queries/`, `hooks/`, and sub-feature directories when a template leaves you unsure. **Exception:** stays predates the API-boundary rule (it re-exports schema types as domain) — for dto/mapper structure follow `api-boundary.md` and this skill's templates, not stays; stays remains the reference for adapter/error/query mechanics.

## Why the DTO + Mapper Boundary

The `api/` layer is an **Anti-Corruption Layer** (DDD), implemented as **DTO + Mapper** following **"parse, don't validate"**: the wire format is validated once (`parseResponse(dtoSchema, ...)`), mapped once (`toX(dto)` / `buildXBody(input)`), and the rest of the app only ever sees hand-authored domain types. Full rule: `.claude/rules/api-boundary.md` — this skill carries only the scaffold order and templates.

## Before You Begin

Gather from the user:

1. **Feature name** (singular, lowercase): e.g., `payment`, `invoice`, `reservation`
2. **Main entity fields**: Properties of the domain model
3. **API endpoints**: Endpoints this feature will consume — validate response shapes against the real API, never trust legacy types
4. **Operations needed**: List (paginated?), detail, create, update, delete?

## Feature Directory Structure

### Simple Feature (single page/concern)

Create in `{features-root}/{feature-name}/`:

```
{feature-name}/
├── api/
│   ├── {feature}.dto.ts          # Zod wire schemas (strict by default) — ONLY file that knows the backend shape
│   ├── {feature}.mapper.ts       # toX(dto) / buildXBody(input) — pure mapping functions
│   └── {feature}.api.ts          # HTTP adapter (endpoints const + .catch(handleApiError) + parseResponse → mapper)
├── domain/
│   ├── {feature}.types.ts        # Hand-authored domain types (frontend-owned — never re-export DTO infers)
│   ├── {feature}.service.ts      # Pure business logic functions
│   └── {feature}.errors.ts       # Domain error classes (optional)
├── queries/
│   └── {feature}.keys.ts         # Query key factory
├── store/                         # Only if feature needs UI state
│   └── {feature}.store.ts        # Zustand store (filters, selection, dialogs)
├── hooks/                        # ALL logic lives here
│   ├── use-{feature}s-query.ts   # Thin useQuery wrappers
│   ├── use-{feature}-list.ts     # Component hook (data + translated strings)
│   ├── use-{feature}-mutations.ts # CRUD mutation hooks
│   └── use-{feature}-form.ts     # Form hook (useForm + submit + navigation)
├── components/                   # Pure renderers ONLY
│   ├── {feature}-list.tsx
│   ├── {feature}-card.tsx
│   └── {feature}-form.tsx
├── pages/                        # Page compositors (wrap content in AppContainer)
│   └── {feature}s-page.tsx
├── testing/                      # Test factories + MSW handlers
│   └── factories.ts
└── index.ts                       # Public exports
```

Translations do NOT live inside the feature — they go in `public/locales/{locale}/{namespace}.json` (one file per locale per namespace).

### Feature with Sub-Features (multiple sub-pages sharing same data model)

When a feature serves multiple routes that share the same types, API, and query keys, use nested sub-features. Each sub-feature is self-contained with its own components and hooks.

```
{feature-name}/
├── api/                          # Shared across all sub-features
├── domain/                       # Shared types + business logic
├── queries/                      # Shared query key factories
├── hooks/                        # Shared hooks (data fetching, common logic)
├── testing/                      # Shared test factories
├── pages/                        # Page compositors (one per route)
│
├── {sub-feature-a}/              # Self-contained sub-feature
│   ├── components/
│   ├── hooks/
│   └── domain/                   # Only if sub-feature has local-only logic
│
├── {sub-feature-b}/
│   ├── components/
│   └── hooks/
│
└── index.ts                      # Public barrel exports
```

#### Sub-Feature Rules

1. **Shared things stay shared.** Types, API adapters, and query keys used by multiple sub-features live at the parent feature root (`api/`, `domain/`, `queries/`, `hooks/`).
2. **Local logic stays local.** Logic used only by one sub-feature goes in `{sub-feature}/domain/`.
3. **Pages are thin compositors.** Each page in `pages/` imports and assembles components from sub-features. Pages never own business logic.
4. **Sub-features never import from each other.** If A needs something from B, it belongs in the shared parent level.
5. **Pages can import from any sibling sub-feature.** They are the only cross-cutting layer.

#### When to Use Sub-Features

Ask: "Does this feature serve **multiple routes/pages** that share the same data model and API?" If yes, use sub-features. If no, use the simple structure.

#### When a Sub-Feature Graduates to Top-Level

Only when **all three** are met: (1) it has its own API endpoints and response types, (2) its own query keys and data lifecycle, (3) it can be deleted without touching shared domain code.

## Implementation Checklist

```
Feature: {name}
[ ] 1. Wire DTOs          — api/{feature}.dto.ts (strict Zod wire schemas, validated against real API)
[ ] 2. Mappers            — api/{feature}.mapper.ts (toX(dto) / buildXBody(input) pure functions)
[ ] 3. API Adapter        — api/{feature}.api.ts (parseResponse(dto) → mapper)
[ ] 4. Domain Layer       — hand-authored types (written alongside mappers — mappers return them), service, errors
[ ] 5. Queries Layer      — query key factory
[ ] 6. Store Layer        — Zustand (skip if no UI state needed)
[ ] 7. Hooks Layer        — queries, component hooks, mutations, form
[ ] 8. Components Layer   — card, list, form, page compositor
[ ] 9. Public Exports     — index.ts
[ ] 10. Translations      — public/locales/{en,es}/{namespace}.json
[ ] 11. Tests             — MSW handlers + per-layer tests (see frontend-testing)
```

## Layer Dependencies

| Layer | Imports From | Never Imports |
|-------|--------------|---------------|
| `domain/` | Nothing (pure TS) | React, axios, anything external |
| `api/` | `domain/`, `@/{app}/shared/` | React, hooks |
| `queries/` | `api/`, `domain/` | React, components |
| `store/` | `domain/` only | React hooks, API, components |
| `hooks/` | `queries/`, `api/`, `domain/`, `store/` | Components |
| `components/` | `hooks/`, `domain/`, `store/`, `@/{app}/ui/` | `api/` directly |

Files outside `api/` must never import from `api/*.dto` or `api/*.mapper` (a PreToolUse hook blocks this) — hooks and components get their types from `domain/` only.

## Feature-Specific Anti-Patterns

- **Don't make API calls in components** — go through hooks which wrap queries/mutations
- **Don't put business logic in components** — use `domain/{feature}.service.ts` for pure functions, hooks for React logic
- **Don't import other features' internals** — use their `index.ts` exports
- **Don't put UI state in TanStack Query** — use Zustand
- **Don't put a `queryOptions` layer between keys and hooks** — hooks call `useQuery` directly with keys from the factory
- **Don't re-export wire types as domain types** — `domain/{feature}.types.ts` is hand-authored (`api-boundary.md`)
- **Don't let a form submit the wire body directly** — forms produce domain input; `buildXBody` in the mapper owns the wire shape

Everything else (logic in components, hardcoded routes/colors, raw try/catch in adapters, `toast.error()`, legacy imports) is covered by the rule files listed above.

## Code Templates

For complete code templates of each file, read [references/templates.md](references/templates.md).
