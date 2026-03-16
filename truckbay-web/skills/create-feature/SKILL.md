---
name: create-feature
description: Scaffold a new domain feature module following vertical slicing and hexagonal architecture. Use when the user wants to create, add, implement, or scaffold a new feature with entities, API endpoints, and CRUD operations.
---

# Create Feature

Scaffold a complete domain feature module following vertical slicing with hexagonal architecture. This skill handles features with **entities, API endpoints, and CRUD operations** that live in `src/new-app/features/`.

For shared infrastructure (providers, hooks, layouts, i18n, config), use the **create-infrastructure** skill instead.

## Related Skills

| Skill | When to Use |
|-------|-------------|
| **create-infrastructure** | Scaffold shared infrastructure (providers, hooks, layouts, i18n) instead of domain features |
| **plan-implementation** | Bridge from PRD/UX design artifacts to feature inputs — routes to this skill or create-infrastructure |
| **react-clean-architecture** | Understand the WHY behind this structure |
| **frontend-testing** | After scaffolding, write tests for each layer |
| **error-handling** | AppError, tryCatch, domain error patterns |
| **generate-feature-doc** | After implementation, document the feature |

## Before You Begin

Gather from the user:

1. **Feature name** (singular, lowercase): e.g., `payment`, `invoice`, `reservation`
2. **Main entity fields**: Properties of the domain model
3. **API endpoints**: Endpoints this feature will consume
4. **Operations needed**: List (paginated?), detail, create, update, delete?

## Feature Directory Structure

Create in `features/{feature-name}/`:

```
{feature-name}/
├── api/
│   ├── {feature}.api.ts          # HTTP adapter (centralized endpoints)
│   ├── {feature}.schemas.ts      # Zod schemas (trust boundary validation)
│   ├── {feature}.mapper.ts       # Raw → Domain transformation
│   └── {feature}.types.ts        # Raw API response types (snake_case etc.)
├── domain/
│   ├── {feature}.types.ts        # Pure TS types (no Zod, no deps)
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

## Implementation Checklist

```
Feature: {name}
[ ] 1. Domain Layer      — types, service, errors
[ ] 2. API Layer          — schemas, raw types, mapper, adapter
[ ] 3. Queries Layer      — key factory, queryOptions
[ ] 4. Store Layer        — Zustand (skip if no UI state needed)
[ ] 5. Hooks Layer        — list, detail, mutations, form, translations
[ ] 6. Components Layer   — card, list, form, container
[ ] 7. Public Exports     — index.ts
[ ] 8. Translations       — i18n JSON files (en.json, es.json)
[ ] 9. Tests              — MSW handlers + per-layer tests
```

## Key Conventions

### Hooks/Components Separation (Clean Architecture)

Components and hooks have strict, separate responsibilities:

**`hooks/` contains ALL logic:**
- State management (`useState`, `useReducer`)
- Data fetching (TanStack Query wrappers)
- Mutations and form handling
- Side effects (`useEffect`, `useCallback`, `useMemo`)
- Event handlers
- Router logic (`useRouter`)
- Business logic orchestration
- **Translations** (`useTranslation` wrapped in a feature-specific hook)

**`components/` contains UI rendering ONLY:**
- JSX markup
- Styling via className
- Calling hooks and passing data to child components
- Conditional rendering based on hook return values

Components should act as "pure functions" — they receive data from hooks and return markup. This separation allows logic to be tested independently and keeps components focused on presentation.

```tsx
// hooks/use-{feature}-form.ts — ALL logic here
export const use{Feature}Form = () => {
  const form = useForm(...)
  const mutation = useMutation(...)
  const onSubmit = form.handleSubmit(...)
  return { form, isSubmitting: mutation.isPending, onSubmit }
}

// components/{feature}-form.tsx — UI rendering ONLY
export const {Feature}Form = () => {
  const { form, isSubmitting, onSubmit } = use{Feature}Form()
  return <form onSubmit={onSubmit}>...</form>
}
```

### Feature Layout Shell

If a feature page needs a custom page wrapper (header variant, footer tabs, etc.), create `{feature}-layout.tsx` inside the feature's `components/` folder. It imports shared building blocks from `@/new-app/shared/layouts`.

Never put a feature-specific layout shell in `shared/layouts/` — that directory holds only reusable building blocks.

### Imports

| Import | From |
|--------|------|
| `client`, `isAxiosError` | `@/new-app/shared/api` |
| `AppError` | `@/new-app/shared/errors` |
| `tryCatch` | `@/new-app/shared/utils` |
| `useError` | `@/new-app/shared/providers` |
| `links` | `@/new-app/shared/links` |
| shadcn components | `@/new-app/ui/{component}` |
| Icons | `lucide-react` |
| `useTranslation` | `next-i18next` (only in hooks, never in components) |

### Schemas in `api/`, Types in `domain/`

- `api/{feature}.schemas.ts` — Zod schemas for request/response validation (trust boundary)
- `domain/{feature}.types.ts` — Pure TS types with no external dependencies
- Types can be standalone or inferred from schemas via `z.infer` re-exports

### Centralized Endpoints

All endpoint paths must be in a `const` object at the top of the API adapter file.
See [centralized-links.mdc](mdc:.cursor/rules/centralized-links.mdc) and [references/templates.md](references/templates.md) for the template.

### Error Handling in Mutations

- Use `useError().showError()` from the error provider, NOT `toast.error()` directly
- Use `tryCatch` for sequential async steps in mutation functions
- Check `AppError.isAppError(error)` before displaying error messages
- See [references/templates.md](references/templates.md) for complete mutation hook template

### Form Pattern

Hooks: `useForm` + `zodResolver` + `useMutation` + `tryCatch`
Components: `Controller` + `Field` / `FieldLabel` / `FieldError` from `@/new-app/ui/field`

### Translation Pattern

Never use `useTranslation` directly in components. Include translations inside the main feature hook alongside other logic:

```tsx
// hooks/use-{feature}-view.ts — translations live inside the feature hook
import { useTranslation } from 'next-i18next'
import { useQuery } from '@tanstack/react-query'

export const use{Feature}View = () => {
  const { t } = useTranslation('{namespace}')
  const query = useQuery(...)

  const translations = {
    headerTitle: t('feature.headerTitle'),
    buttons: {
      submit: t('feature.submit'),
      cancel: t('feature.cancel'),
    },
  }

  return {
    translations,
    data: query.data,
    isLoading: query.isPending,
  }
}

// components/{feature}-view.tsx — uses hook, no direct useTranslation
const { translations, data, isLoading } = use{Feature}View()
```

This keeps all logic (data fetching, translations, handlers) in a single hook per component, and components remain pure UI renderers.

### i18n File Scaffolding

When creating a feature, generate translation files with keys for all user-facing strings:

```
i18n/
  en.json    # All user-facing strings in English
  es.json    # All user-facing strings in Spanish (placeholder translations OK)
```

**Key naming convention:** `{feature}.{section}.{element}`

**Important:** next-i18next uses nested JSON objects, not flat dot-notation keys. Keys like `expiredDialog.title` must be structured as nested objects:

```json
// ✅ Correct — nested objects
{
  "expiredDialog": {
    "title": "Session Expired"
  }
}

// ❌ Wrong — flat dot-notation keys (next-i18next won't resolve these)
{
  "expiredDialog.title": "Session Expired"
}
```

```json
// i18n/en.json
{
  "{feature}": {
    "title": "Feature Title",
    "list": {
      "empty": "No items found",
      "loading": "Loading..."
    },
    "form": {
      "submit": "Create",
      "cancel": "Cancel",
      "fields": {
        "name": "Name",
        "namePlaceholder": "Enter name"
      }
    },
    "errors": {
      "notFound": "Item not found",
      "createFailed": "Failed to create item"
    },
    "actions": {
      "edit": "Edit",
      "delete": "Delete",
      "view": "View details"
    }
  }
}
```

The hook then uses these keys via `useTranslation`:
```tsx
const { t } = useTranslation('{feature-namespace}')
const translations = {
  title: t('{feature}.title'),
  emptyMessage: t('{feature}.list.empty'),
}
```

Generate only keys that the feature's components actually use — don't create keys speculatively.

### Store (Zustand) — Optional

Include only when the feature needs client-side UI state:
filters, search, selection, modal open/close.
NOT for server data (that lives in TanStack Query).

## Layer Dependencies

| Layer | Imports From | Never Imports |
|-------|--------------|---------------|
| `domain/` | Nothing (pure TS) | React, axios, anything external |
| `api/` | `domain/`, `@/shared/` | React, hooks |
| `queries/` | `api/`, `domain/` | React, components |
| `store/` | `domain/` only | React hooks, API, components |
| `hooks/` | `queries/`, `api/`, `domain/`, `store/` | Components |
| `components/` | `hooks/`, `domain/`, `store/`, `@/shared/` | `api/` directly |

## Anti-Patterns

- **Don't put logic in component files** — ALL logic (`useState`, `useEffect`, handlers, mutations) goes in hooks
- **Don't make API calls in components** — go through hooks which wrap queries/mutations
- **Don't put business logic in components** — use `domain/{feature}.service.ts` for pure functions, hooks for React logic
- **Don't import other features' internals** — use their `index.ts` exports
- **Don't skip validation in mappers** — always `safeParse` through Zod
- **Don't put UI state in TanStack Query** — use Zustand
- **Don't hardcode endpoint paths** — centralize in endpoints object
- **Don't use `toast.error()` directly** — use `useError().showError()`
- **Don't use function declarations** — use arrow function components with named exports
- **Don't use `useTranslation` in components** — include translations inside the feature hook

## Code Templates

For complete code templates of each file, read [references/templates.md](references/templates.md).

## Resume After Context Cleanup

If context was cleaned mid-pipeline, restore state before proceeding:

1. **Check for in-progress pipeline:** Look for `.claude/pipeline/*/OBSERVATION-LOG.md` with `Status: In Progress`
2. **Read DECISIONS.md** in the feature folder for accumulated context
3. **Read the relevant artifact** for this skill's input:
   - The implementation plan and any scaffolded files in `src/new-app/features/{feature}/`
4. **Resume the observer** if an OBSERVATION-LOG.md exists and is in progress
5. **Continue from where you left off** — don't restart the skill from scratch

## Next Step

After completing this skill, use the `AskUserQuestion` tool to present the next step options. Include a summary of what was completed in the question text.

Options to present:

- **frontend-testing** — write tests for the feature
- **generate-feature-doc** — document the implementation
- **Something else** — do something different

Do NOT present numbered text options and ask the user to "type a number." Always use the `AskUserQuestion` tool for skill transitions.

## Context Management

After completing this skill's work, report the **context usage percentage** so the user can decide whether to clean context:

> "{Skill output summary}. Context usage: **{X}%**"

Do NOT recommend cleaning context — just show the percentage. The user will decide.
