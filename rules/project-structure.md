---
description: Enforce dual project structure — legacy src/ coexists with new architecture in src/new-app/
globs: "**/*.{ts,tsx}"
alwaysApply: true
---

# Project Structure (Gradual Migration)

This project uses **Next.js 13 Pages Router** with **React 18** and **Tailwind CSS v4**. New code follows a feature-based architecture inside `src/new-app/`, while legacy code remains in its original locations.

## Directory Layout

```
src/
  pages/              # Next.js 13 Pages Router (legacy — maintain, don't restructure)
  components/         # Legacy shared components (maintain — don't add new ones here)
  api/                # Legacy API layer (maintain — don't add new endpoints here)
  hooks/              # Legacy hooks (maintain — don't add new ones here)
  layouts/            # Legacy layouts
  utils/              # Shared utilities (cn/clsxm live here)
  styles/             # Global CSS (globals.css with Tailwind v4 + shadcn variables)
  new-app/            # New architecture — ALL new code goes here
    ui/               # shadcn/ui components (managed via components.json)
    shared/           # Cross-feature utilities
      api/            # API client singleton (ApiClient, client instance)
      errors/         # AppError class and base error types
      links/          # Centralized route definitions (links, buildUrl)
      providers/      # QueryProvider, ErrorProvider
      utils/          # tryCatch, buildUrl, helpers
    features/         # Feature modules (one folder per domain)
      {feature}/
        api/          # API adapter + endpoint constants
        hooks/        # react-hook-form + TanStack Query hooks
        components/   # Feature-specific UI components
        domain/       # Domain errors, types, constants
        queries/      # Query key factories
```

## Hard Rules

1. **New features** go in `src/new-app/features/{feature}/`.
2. **New shared utilities** go in `src/new-app/shared/`.
3. **New UI components** go in `src/new-app/ui/` (via `pnpm dlx shadcn@latest add`).
4. **Legacy code** stays in `src/components/`, `src/api/`, `src/hooks/` — fix bugs in-place but don't add new modules there.
5. **Pages** still live in `src/pages/` (Next.js 13 Pages Router) — they import from both legacy and `new-app/`.
6. **Import direction**: legacy code may import from `new-app/`, but `new-app/` should NOT import from legacy (`src/components/`, `src/api/`, `src/hooks/`).
7. **Use `@/` alias** for imports from `src/` — e.g., `@/new-app/shared/errors`, `@/new-app/ui/button`.

## When Working on a Page

- If the page is **new** or being **rewritten**: use `new-app/` components, hooks, and patterns.
- If **fixing a bug** in an existing page: work within the legacy code, don't force a migration.
- If **adding a new feature** to an existing page: create the feature module in `new-app/features/` and import it into the legacy page.

## Tech Stack Reference

| Dependency | Version | Notes |
|------------|---------|-------|
| Next.js | 13.5.x | Pages Router — no App Router features (`redirect()`, `server actions`, etc.) |
| React | 18.3.x | `forwardRef` is still required for ref forwarding |
| TypeScript | 5.x | `moduleResolution: "bundler"` in tsconfig |
| Tailwind CSS | 4.x | Uses `@import 'tailwindcss'` syntax, `@theme inline`, oklch colors |
| TanStack Query | 5.x | Use `isPending` not `isLoading` |
| react-hook-form | 7.x | Always with `zodResolver` + `Controller` |
| Zod | 3.x | Schema validation |
| shadcn/ui | latest | Configured in `components.json`, outputs to `src/new-app/ui/` |
| Vitest | 4.x | Test runner with React Testing Library |
| Package manager | pnpm | Always use `pnpm`, never npm/yarn |

## Related Rules

- [form-patterns.md](form-patterns.md) — Form conventions
- [error-handling.md](error-handling.md) — Error flow and AppError
- [tanstack-query.md](tanstack-query.md) — Query/mutation patterns
- [centralized-links.md](centralized-links.md) — Route and endpoint management
- [package-manager.md](package-manager.md) — pnpm enforcement
