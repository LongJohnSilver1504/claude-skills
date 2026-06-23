---
description: Enforce dual project structure — legacy code coexists with new feature-based architecture, both under src/
globs: "**/*.{ts,tsx}"
alwaysApply: true
---

# Project Structure (Gradual Migration)

This project uses **Next.js 13 Pages Router** with **React 18** and **Tailwind CSS v4**. New code follows a feature-based architecture inside `src/`, while legacy code remains in its original locations.

## Directory Layout

```
src/
  pages/              # Next.js 13 Pages Router (legacy — maintain, don't restructure)
  components/         # Legacy shared components (maintain — don't add new ones here)
  api/                # Legacy API layer (maintain — don't add new endpoints here)
  hooks/              # Legacy hooks (maintain — don't add new ones here)
  layouts/            # Legacy layouts
  utils/              # Shared utilities — `cn` (alias of `clsxm`) imported as `@/utils/clsxm`
  styles/             # Global CSS (globals.css with Tailwind v4 + shadcn variables)
  ui/                 # shadcn/ui components (managed via components.json) — NEW code
  shared/             # Cross-feature utilities — NEW code
    api/              # API client singleton (ApiClient, client instance)
    errors/           # AppError class and base error types
    links/            # Centralized route definitions (links, buildUrl)
    providers/        # QueryProvider, ErrorProvider
    utils/            # tryCatch, buildUrl, helpers
  features/           # Feature modules (one folder per domain) — NEW code
    {feature}/
      api/            # API adapter + endpoint constants + Zod response schemas
      hooks/          # react-hook-form + TanStack Query hooks
      components/     # Feature-specific UI components
      domain/         # Domain errors, types (re-exported from schemas), constants
      queries/        # Query key factories

    {feature}/                # Features with multiple sub-pages
      api/                    # Shared API adapters + schemas
      domain/                 # Shared types, state machine, business logic
      queries/                # Shared query key factories
      hooks/                  # Shared hooks (data fetching, common logic)
      testing/                # Shared test factories
      pages/                  # Page compositors (one per route)
      {sub-feature}/          # Self-contained sub-feature
        components/
        hooks/
        domain/               # Sub-feature-only logic (optional)
      index.ts                # Public barrel exports
```

## Hard Rules

1. **New features** go in `src/features/{feature}/`.
2. **New shared utilities** go in `src/shared/`.
3. **New UI components** go in `src/ui/` (via `pnpm dlx shadcn@latest add`).
4. **Legacy code** stays in `src/components/`, `src/api/`, `src/hooks/` — fix bugs in-place but don't add new modules there.
5. **Pages** still live in `src/pages/` (Next.js 13 Pages Router) — they import from both legacy and new feature code.
6. **Import direction**: legacy code may import from new feature code, but new feature code should NOT import from legacy (`src/components/`, `src/api/`, `src/hooks/`).
7. **Use `@/` alias** for imports from `src/` — e.g., `@/shared/errors`, `@/ui/button`.

## Sub-Feature Pattern

When a feature grows to serve multiple routes/sub-pages that share the same data model, API, and query keys, organize it as a parent feature with nested sub-features.

### When to Use

Use sub-features when a feature has **multiple pages** that share:
- The same domain types (e.g., `reservation.types.ts`, `location.types.ts`)
- The same API adapters and endpoints
- The same query keys and data lifecycle

### Structure

```
features/{feature}/
  api/                          # Shared across all sub-features
  domain/                       # Shared types, state machine, business logic
  queries/                      # Shared query key factories
  hooks/                        # Shared hooks (data fetching, common logic)
  testing/                      # Shared test factories
  pages/                        # Page compositors (one per route)
    {page-name}-page.tsx        # Thin compositor — imports from sub-features

  {sub-feature-a}/              # Self-contained sub-feature
    components/
    hooks/
    domain/                     # Only if it has sub-feature-only logic

  {sub-feature-b}/              # Another sub-feature
    components/
    hooks/

  index.ts                      # Public barrel exports
```

### Import Rules

1. **Pages can import from any sibling sub-feature.** They are thin layout shells that compose pieces together.
2. **Sub-features never import from each other.** If sub-feature A needs something from sub-feature B, that thing belongs in the shared `domain/`, `hooks/`, or `api/` at the parent level.
3. **Shared things stay shared.** Types, API adapters, and query keys used across sub-pages live at the parent feature root.
4. **Local logic stays local.** If a sub-feature has logic nobody else uses, it goes in `{sub-feature}/domain/`.

### When to Graduate to a Top-Level Feature

A sub-feature should become a top-level feature only when **all three** conditions are met:
1. It has its own API endpoints and response types
2. It has its own query keys and data lifecycle
3. It can be deleted without touching any shared domain code

## When Working on a Page

- If the page is **new** or being **rewritten**: use new-architecture components, hooks, and patterns.
- If **fixing a bug** in an existing page: work within the legacy code, don't force a migration.
- If **adding a new feature** to an existing page: create the feature module in `features/` and import it into the legacy page.

## Tech Stack Reference

| Dependency | Version | Notes |
|------------|---------|-------|
| Next.js | 13.5.x | Pages Router — no App Router features (`redirect()`, `server actions`, `use server`, `app/` dir) |
| React | 18.3.x | `forwardRef` is still required for ref forwarding |
| TypeScript | 5.x | `moduleResolution: "node"`, `strict: false`, `strictNullChecks: false` — don't rely on strict null checks |
| Tailwind CSS | 4.x | Uses `@import 'tailwindcss'` syntax, `@theme inline`, oklch colors. No `tailwind.config.js`. |
| TanStack Query | 5.x | Use `isPending` not `isLoading`. Legacy code uses `react-query` v3 — see `tanstack-query.md` |
| axios | 0.21.x | Use `axios.isAxiosError()` — named `isAxiosError` export does not exist. See `error-handling.md` |
| react-hook-form | 7.x | Always with `zodResolver` + `Controller` |
| Zod | 3.x | Schema validation |
| shadcn/ui | latest | Configured in `components.json`, outputs to `src/ui/`. See `design-system-map.md` for post-install checklist |
| Vitest | 4.x | Test runner with React Testing Library. See `testing.md` |
| Package manager | pnpm | Always use `pnpm`, never npm/yarn |

## Related Rules

- [form-patterns.mdc](mdc:.cursor/rules/form-patterns.mdc) — Form conventions
- [error-handling.mdc](mdc:.cursor/rules/error-handling.mdc) — Error flow and AppError
- [tanstack-query.mdc](mdc:.cursor/rules/tanstack-query.mdc) — Query/mutation patterns
- [centralized-links.mdc](mdc:.cursor/rules/centralized-links.mdc) — Route and endpoint management
- [package-manager.mdc](mdc:.cursor/rules/package-manager.mdc) — pnpm enforcement
