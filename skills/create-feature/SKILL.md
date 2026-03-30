---
name: create-feature
description: Scaffold a new domain feature module following vertical slicing and hexagonal architecture. Use when the user wants to create, add, implement, or scaffold a new feature with entities, API endpoints, and CRUD operations.
---

# Create Feature

Scaffold a complete domain feature module following vertical slicing with hexagonal architecture. This skill handles features with **entities, API endpoints, and CRUD operations** that live in `src/new-app/features/`.

For shared infrastructure (providers, hooks, layouts, i18n, config), use **create-infrastructure** instead.

**Related:** create-infrastructure (shared infra), plan-implementation (upstream planning), react-clean-architecture (architecture rationale), frontend-testing (post-scaffold tests), error-handling (AppError patterns), generate-feature-doc (post-implementation docs).

For shared architecture conventions (hook/component separation, imports, translations, anti-patterns), see [references/shared-conventions.md](references/shared-conventions.md).

## Before You Begin

Gather from the user:

1. **Feature name** (singular, lowercase): e.g., `payment`, `invoice`, `reservation`
2. **Main entity fields**: Properties of the domain model
3. **API endpoints**: Endpoints this feature will consume
4. **Operations needed**: List (paginated?), detail, create, update, delete?

## Feature Directory Structure

### Simple Feature (single page/concern)

Create in `features/{feature-name}/`:

```
{feature-name}/
├── api/
│   ├── {feature}.api.ts          # HTTP adapter (handleApiError + parseResponse)
│   └── {feature}.schemas.ts      # Zod response schemas with .transform() + inferred types
├── domain/
│   ├── {feature}.types.ts        # Re-exports types from ../api/{feature}.schemas
│   ├── {feature}.service.ts      # Pure business logic functions
│   └── {feature}.errors.ts       # Domain error classes (optional)
├── queries/
│   ├── {feature}.keys.ts         # Query key factory
│   └── {feature}.queries.ts      # queryOptions definitions
├── store/                         # Only if feature needs UI state
│   └── {feature}.store.ts        # Zustand store (filters, selection, modals)
├── hooks/                        # ALL logic lives here
│   ├── use-{feature}s.ts         # List query hook (includes translations)
│   ├── use-{feature}.ts          # Detail query hook (includes translations)
│   ├── use-{feature}-mutations.ts # CRUD mutation hooks
│   ├── use-{feature}-form.ts     # Form hook (useForm + useMutation)
│   └── use-{feature}-layout.ts   # Layout hook (if feature has a layout shell)
├── components/                   # UI rendering ONLY
│   ├── {feature}-list.tsx
│   ├── {feature}-card.tsx
│   ├── {feature}-form.tsx        # Controller + Field pattern
│   ├── {feature}s-view.tsx       # Container component
│   └── {feature}-layout.tsx      # Feature layout shell (optional)
├── server/                        # Only if SSR needed
│   └── get-{feature}s.ts
├── i18n/                         # Translation files
│   ├── en.json                    # English translations
│   └── es.json                    # Spanish translations
└── index.ts                       # Public exports
```

### Feature with Sub-Features (multiple sub-pages sharing same data model)

When a feature serves multiple routes that share the same types, API, and query keys, use nested sub-features. Each sub-feature is self-contained with its own components and hooks.

```
{feature-name}/
├── api/                          # Shared across all sub-features
│   ├── {feature}.api.ts
│   └── {feature}.schemas.ts
├── domain/                       # Shared types + business logic
│   ├── {feature}.types.ts
│   ├── {feature}.service.ts
│   └── index.ts                  # Barrel re-exports
├── queries/                      # Shared query key factories
│   └── {feature}.keys.ts
├── hooks/                        # Shared hooks (data fetching, common logic)
│   ├── use-{feature}s.ts
│   └── use-{feature}.ts
├── testing/                      # Shared test factories
│   └── factories.ts
├── pages/                        # Page compositors (one per route)
│   ├── {feature}-details-page.tsx    # /feature/:id — thin layout shell
│   └── {sub-page}-page.tsx           # /feature/:id/sub — thin layout shell
│
├── {sub-feature-a}/              # Self-contained sub-feature
│   ├── components/
│   ├── hooks/
│   └── domain/                   # Only if sub-feature has local-only logic
│
├── {sub-feature-b}/              # Another sub-feature
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
[ ] 1. Domain Layer      — types (re-exports from schemas), service, errors
[ ] 2. API Layer          — Zod response schemas, adapter (handleApiError + parseResponse)
[ ] 3. Queries Layer      — key factory, queryOptions
[ ] 4. Store Layer        — Zustand (skip if no UI state needed)
[ ] 5. Hooks Layer        — list, detail, mutations, form, translations
[ ] 6. Components Layer   — card, list, form, container
[ ] 7. Public Exports     — index.ts
[ ] 8. Translations       — i18n JSON files (en.json, es.json)
[ ] 9. Tests              — MSW handlers + per-layer tests
```

## Feature-Specific Conventions

### Schemas in `api/`, Types re-exported from `domain/`

- `api/{feature}.schemas.ts` — Zod response schemas with `.transform()` for field renaming, type coercion, and defaults. Inferred types are exported from the schema file.
- `domain/{feature}.types.ts` — Re-exports types from `../api/{feature}.schemas.ts`. Domain types are the schema output types.
- Use `parseResponse(schema, data)` from `@/new-app/shared/api` in adapters to validate and transform API responses.
- Use `handleApiError(error, contextMappings?)` from `@/new-app/shared/api` to replace manual axios catch blocks.

### Centralized Endpoints

All endpoint paths must be in a `const` object at the top of the API adapter file. See [centralized-links rule](../../.claude/rules/centralized-links.md) and [references/templates.md](references/templates.md) Step 2.4.

### Error Handling in Mutations

- Use `useError().showError()` from the error provider, NOT `toast.error()` directly
- Use `tryCatch` for sequential async steps in mutation functions
- Check `AppError.isAppError(error)` before displaying error messages

### Form Pattern

Hooks: `useForm` + `zodResolver` + `useMutation` + `tryCatch`
Components: `Controller` + `Field` / `FieldLabel` / `FieldError` from `@/new-app/ui/field`

### Feature Layout Shell

If a feature page needs a custom page wrapper, create `{feature}-layout.tsx` inside the feature's `components/` folder. It imports shared building blocks from `@/new-app/shared/layouts`. Never put feature-specific layouts in `shared/layouts/`.

### Store (Zustand) — Optional

Include only when the feature needs client-side UI state: filters, search, selection, modal open/close. NOT for server data (that lives in TanStack Query).

## Layer Dependencies

| Layer | Imports From | Never Imports |
|-------|--------------|---------------|
| `domain/` | Nothing (pure TS) | React, axios, anything external |
| `api/` | `domain/`, `@/shared/` | React, hooks |
| `queries/` | `api/`, `domain/` | React, components |
| `store/` | `domain/` only | React hooks, API, components |
| `hooks/` | `queries/`, `api/`, `domain/`, `store/` | Components |
| `components/` | `hooks/`, `domain/`, `store/`, `@/shared/` | `api/` directly |

## Feature-Specific Anti-Patterns

- **Don't make API calls in components** — go through hooks which wrap queries/mutations
- **Don't put business logic in components** — use `domain/{feature}.service.ts` for pure functions, hooks for React logic
- **Don't import other features' internals** — use their `index.ts` exports
- **Don't skip validation in mappers** — always `safeParse` through Zod
- **Don't put UI state in TanStack Query** — use Zustand
- **Don't hardcode endpoint paths** — centralize in endpoints object

For general anti-patterns (logic in components, hardcoded routes, legacy imports, etc.), see [references/shared-conventions.md](references/shared-conventions.md).

## Code Templates

For complete code templates of each file, read [references/templates.md](references/templates.md).
