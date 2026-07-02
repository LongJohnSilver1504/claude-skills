---
name: create-infrastructure
description: Scaffold shared infrastructure projects — providers, hooks, layout components, i18n, config/theme. Use when the project builds reusable plumbing in shared/, or when user says "scaffold shared", "create provider", "setup layout".
---

# Create Infrastructure

Scaffold shared infrastructure that lives in the shared root, `public/`, or the project root. Covers providers, hooks, layout components, i18n translations, config/theme setup, and shared utilities.

All `shared/` and `ui/` paths below resolve against the roots defined in the project's `.claude/rules/project-structure.md`.

For domain features with entities, API endpoints, and CRUD operations, use **create-feature** instead.

**Related:** create-feature (domain features), plan-implementation (upstream planning), react-clean-architecture (architecture rationale), frontend-testing (post-scaffold tests), generate-feature-doc (post-implementation docs).

**Conventions live in the project's `.claude/rules/`** (component/hook separation, error handling, centralized links, colors, layout ownership) — this skill carries only the deliverable catalog, scaffold order, and templates. Small deltas not covered by the rules: [references/shared-conventions.md](references/shared-conventions.md).

## Before You Begin

Gather from the user (or extract from the implementation plan):

1. **Project name** (descriptive): e.g., `app-layout`, `theme-setup`, `auth-infrastructure`
2. **Deliverables list** — each deliverable needs: name, type (from catalog below), target file path, dependencies, acceptance criteria

## Deliverable Type Catalog

| Type | Location | Example |
|------|----------|---------|
| Provider | `shared/providers/{name}-provider.tsx` | `auth-provider.tsx` |
| Hook (truly shared) | `shared/hooks/use-{name}.ts` | `use-debounce.ts` |
| Layout component | `shared/layouts/{module}/components/{component}.tsx` | `navbar/components/navbar.tsx` |
| Layout hook | `shared/layouts/{module}/hooks/use-{name}.ts` | `navbar/hooks/use-navbar-items.ts` |
| Layout barrel | `shared/layouts/{module}/index.ts` | `navbar/index.ts` |
| i18n namespace | `public/locales/{locale}/{namespace}.json` | `en/app-layout.json` |
| Shared utility | `shared/{module}/index.ts` | `shared/links/index.ts` |
| Config/Foundation | project root or `src/styles/` | `globals.css`, `components.json` |
| Test page | `pages/{page-name}.tsx` | `reservation-details-v2/[id].tsx` |

All paths relative to `src/` unless noted otherwise.

> **Layout shells are not infra deliverables.** A layout shell that assembles building blocks for a specific page belongs in the feature's `components/` folder (e.g., `features/reservation-details/components/reservation-detail-layout.tsx`), not in `shared/layouts/`.

## Infrastructure Directory Structure

```
src/
  shared/
    providers/
      {name}-provider.tsx       # Context + Provider + useX hook
      index.ts
    hooks/
      use-{name}.ts             # Truly shared hooks (used across multiple components)
      index.ts
    layouts/
      {module}/                 # One folder per layout module
        components/             # REQUIRED - all UI rendering lives here
          {component}.tsx       # Pure renderer (imports from ../hooks/)
        hooks/                  # REQUIRED - all logic lives here
          use-{component}.ts    # Component-specific hook (required)
        index.ts                # Barrel: exports components + hooks
      index.ts                  # Re-exports from all module folders
    links/
      index.ts                  # Centralized routes + buildUrl
    utils/
      index.ts                  # Shared helpers
  features/
    {feature}/
      components/
        {feature}-layout.tsx    # Feature-specific layout shell (NOT in shared/layouts)
  ui/
    *.tsx                       # shadcn/ui components (installed via CLI)

public/
  locales/
    en/{namespace}.json
    es/{namespace}.json

src/styles/
  globals.css                   # Theme + CSS variables
```

## Implementation Checklist

```
Infrastructure: {project-name}
[ ] 1. Foundation          — theme, config files, directory structure, dependency installs
[ ] 2. Shared utilities    — centralized links, helpers
[ ] 3. Providers           — context + provider + hook per provider
[ ] 4. i18n translations   — EN/ES JSON files per namespace
[ ] 5. Hooks               — shared hooks (may depend on providers, i18n, links)
[ ] 6. shadcn installs     — pnpm dlx shadcn@latest add {components}
[ ] 7. Layout components   — UI building blocks (may depend on hooks + shadcn)
[ ] 8. Layout shells       — compose layout components
[ ] 9. Test page           — proof of concept wiring everything together
[ ] 10. Barrel exports     — index.ts for each shared module
```

## Key Conventions

### Provider Pattern

Every provider follows: context + provider component + consumer hook + guard.

- Create context with `createContext<T | null>(null)`
- Export `{Name}Provider` component that wraps children with context
- Export `use{Name}` hook that throws if used outside provider
- Never put provider logic in components — provider is pure context, logic lives in hooks

### Layout Module Pattern

Each layout building block lives in its own module folder with **mandatory** `components/` and `hooks/` subdirectories:

```
shared/layouts/{module}/
  components/
    {component}.tsx             # UI rendering ONLY (imports from ../hooks/)
  hooks/
    use-{component}.ts          # ALL logic lives here (required)
  index.ts                      # Barrel: re-exports components + hooks
```

A module can contain multiple related components (e.g., `navbar/components/navbar.tsx` and `navbar/components/language-selector.tsx`), each with a corresponding hook in `hooks/`.

### Layout Shell Pattern

A layout shell composes shared building blocks for a specific feature page. It belongs in `features/{feature}/components/{feature}-layout.tsx`, **not** in `shared/layouts/`.

### i18n Pattern

- One JSON file per locale per namespace in `public/locales/{locale}/{namespace}.json`
- Keys scoped by section: `navbar.bookings`, `footer.home`, `backButton.back` (nested objects, not flat dot-notation)
- Consumed via `useTranslation('{namespace}')` from `next-i18next` — **only inside hooks**; components receive already-translated strings (see `component-hook-separation.md`)
- Always create both EN and ES files

### Centralized Links

All routes come from the centralized `links` object, never hardcoded. See `centralized-links.md` in the project's `.claude/rules/`.

## Infrastructure-Specific Anti-Patterns

- **Don't skip the hook** — every layout component MUST have a corresponding `use-{component}.ts` hook
- **Don't skip the provider guard** — `useX` must throw outside `<XProvider>`
- **Don't dump layout components flat in `shared/layouts/`** — each building block gets its own named subfolder with `components/` and `hooks/` directories
- **Don't put component files at the module root** — component `.tsx` files go in `{module}/components/`, never directly in `{module}/`
- **Don't build feature-specific layout shells in `shared/layouts/`** — compose shared building blocks inside the feature's `components/` folder
- **Don't put component-specific hooks in `shared/hooks/`** — if a hook is only used by one layout component, it lives in `shared/layouts/{component-name}/hooks/`

General anti-patterns (logic in components, hardcoded routes/colors, legacy imports, etc.) are covered by the project's `.claude/rules/`.

## Code Templates

For complete code templates of each infrastructure deliverable type, read [references/templates.md](references/templates.md).
