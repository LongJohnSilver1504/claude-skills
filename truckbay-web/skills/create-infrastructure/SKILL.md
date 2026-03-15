---
name: create-infrastructure
description: Scaffold shared infrastructure projects — providers, hooks, layout components, i18n, config/theme. Use when the project builds reusable plumbing in new-app/shared/ rather than domain features with entities and CRUD.
---

# Create Infrastructure

Scaffold shared infrastructure that lives in `src/new-app/shared/`, `public/`, or the project root. This skill covers providers, hooks, layout components, layout shells, i18n translations, config/theme setup, and shared utilities.

For domain features with entities, API endpoints, and CRUD operations, use the **create-feature** skill instead.

## Related Skills

| Skill                           | When to Use                                                                  |
| ------------------------------- | ---------------------------------------------------------------------------- |
| **create-feature**              | Scaffold domain features (entity + API + CRUD) in `features/`                |
| **plan-implementation**         | Bridge from PRD/UX design artifacts — routes to this skill or create-feature |
| **react-clean-architecture**    | Understand the WHY behind layer separation                                   |
| **frontend-testing**            | After scaffolding, write tests for each deliverable                          |
| **error-handling**              | AppError, tryCatch patterns (if providers need error boundaries)             |
| **generate-feature-doc**        | After implementation, document the infrastructure                            |
| **shadcn-ui**                   | Component patterns for shadcn/ui primitives used in layouts                  |
| **tailwindcss-fundamentals-v4** | Tailwind v4 syntax for theme/config foundation work                          |

## Before You Begin

Gather from the user (or extract from the implementation plan):

1. **Project name** (descriptive): e.g., `app-layout`, `theme-setup`, `auth-infrastructure`
2. **Deliverables list** — each deliverable needs:
   - Name (e.g., "AuthProvider", "Navbar", "useNavbarItems")
   - Type (from the catalog below)
   - Target file path
   - Dependencies (other deliverables that must exist first)
   - Acceptance criteria

## Deliverable Type Catalog

| Type                             | Location                                             | Example                            |
| -------------------------------- | ---------------------------------------------------- | ---------------------------------- |
| Provider                         | `shared/providers/{name}-provider.tsx`               | `auth-provider.tsx`                |
| Hook (truly shared)              | `shared/hooks/use-{name}.ts`                         | `use-debounce.ts`                  |
| Layout component                 | `shared/layouts/{module}/components/{component}.tsx` | `navbar/components/navbar.tsx`     |
| Layout hook (component-specific) | `shared/layouts/{module}/hooks/use-{name}.ts`        | `navbar/hooks/use-navbar-items.ts` |
| Layout barrel                    | `shared/layouts/{module}/index.ts`                   | `navbar/index.ts`                  |
| i18n namespace                   | `public/locales/{locale}/{namespace}.json`           | `en/app-layout.json`               |
| Shared utility                   | `shared/{module}/index.ts`                           | `shared/links/index.ts`            |
| Config/Foundation                | project root or `src/styles/`                        | `globals.css`, `components.json`   |
| Test page                        | `pages/{page-name}.tsx`                              | `reservation-details-v2/[id].tsx`  |

All paths relative to `src/new-app/` unless noted otherwise.

> **Layout shells are not infra deliverables.** A layout shell that assembles building blocks for a specific page belongs in the feature's `components/` folder (e.g., `features/reservation-details/components/reservation-detail-layout.tsx`), not in `shared/layouts/`.

## Infrastructure Directory Structure

```
src/new-app/
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

## Deliverable Specification Format

For each deliverable, document:

```markdown
### Deliverable N: {Name}

**Type:** {type from catalog}
**File:** `{target path}`
**Depends on:** {list of other deliverables or "Nothing"}
**Acceptance:** {how to verify it works}

**Props / API surface:**

- prop1: type — description
- prop2?: type — description

**Exports:**

- `{ExportedName}` — component/hook/type
```

## Key Conventions

### Provider Pattern

Every provider follows: context + provider component + consumer hook + guard.

- Create context with `createContext<T | null>(null)`
- Export `{Name}Provider` component that wraps children with context
- Export `use{Name}` hook that throws if used outside provider
- Never put provider logic in components — provider is pure context, logic lives in hooks

### Layout Component Pattern

Each layout building block lives in its own module folder with **mandatory separation** into `components/` and `hooks/` subdirectories:

```
shared/layouts/{module}/
  components/
    {component}.tsx             # UI rendering ONLY (imports from ../hooks/)
  hooks/
    use-{component}.ts          # ALL logic lives here (required)
  index.ts                      # Barrel: re-exports components + hooks
```

A module can contain multiple related components (e.g., `navbar/components/navbar.tsx` and `navbar/components/language-selector.tsx`), each with a corresponding hook in `hooks/`.

**Component file contains ONLY:**

- JSX rendering
- Styling via className
- Calling the hook(s)

**Hook file contains ALL:**

- State management (`useState`, `useReducer`)
- Side effects (`useEffect`, `useCallback`, `useMemo`)
- Event handlers
- Router logic (`useRouter`)
- Translations (`useTranslation`)
- Business logic and computed values

**Component conventions:**

- Accept `className?` prop, merge with `clsxm()` from `@/utils/clsxm`
- Use `forwardRef` when the component wraps a DOM element (React 18 requirement)
- Import shadcn components from `@/new-app/ui/{component}`
- Import icons from `lucide-react`
- Use arrow function components with named exports

### Layout Shell Pattern (lives in the feature, not in shared/layouts)

A layout shell composes shared building blocks for a specific feature page. It belongs in `features/{feature}/components/{feature}-layout.tsx`, not in `shared/layouts/`.

- Import shared building blocks from `@/new-app/shared/layouts`
- Compose them for the specific feature's needs
- Can have its own hook if the shell has complex logic

### i18n Pattern

- One JSON file per locale per namespace
- Keys scoped by section: `navbar.bookings`, `footer.home`, `backHeader.back`
- Consumed via `useTranslation('{namespace}')` from `next-i18next`
- Always create both EN and ES files

### Centralized Links

All routes from `shared/links/index.ts`, never hardcoded.
See [centralized-links.mdc](mdc:.cursor/rules/centralized-links.mdc).

### Imports

| Import             | From                                    |
| ------------------ | --------------------------------------- |
| `clsxm`            | `@/utils/clsxm`                         |
| shadcn components  | `@/new-app/ui/{component}`              |
| Icons              | `lucide-react`                          |
| i18n               | `next-i18next`                          |
| Centralized routes | `@/new-app/shared/links`                |
| Providers          | `@/new-app/shared/providers/{provider}` |

## Anti-Patterns

- **Don't put logic in component files** — ALL logic (useState, useEffect, handlers, router, translations) goes in the hook file
- **Don't skip the hook** — every layout component MUST have a corresponding `use-{component}.ts` hook
- **Don't hardcode routes** — use `links` from `shared/links`
- **Don't skip the provider guard** — `useX` must throw outside `<XProvider>`
- **Don't put provider logic in components** — provider is pure context, logic lives in hooks
- **Don't import from legacy** — `new-app/` must not import from `src/components/`, `src/api/`, `src/hooks/`
- **Don't dump all layout components flat in `shared/layouts/`** — each building block gets its own named subfolder with `components/` and `hooks/` directories
- **Don't put component files at the module root** — component `.tsx` files go in `{module}/components/`, never directly in `{module}/`
- **Don't build feature-specific layout shells in `shared/layouts/`** — compose shared building blocks inside the feature's `components/` folder
- **Don't put component-specific hooks in `shared/hooks/`** — if a hook is only used by one layout component, it lives in `shared/layouts/{component-name}/hooks/`
- **Don't inline i18n strings** — all user-facing text comes from translation files
- **Don't use function declarations** — use arrow function components with named exports

## Code Templates

For complete code templates of each infrastructure deliverable type, read [references/templates.md](references/templates.md).

## Resume After Context Cleanup

If context was cleaned mid-pipeline, restore state before proceeding:

1. **Check for in-progress pipeline:** Look for `.claude/pipeline/*/OBSERVATION-LOG.md` with `Status: In Progress`
2. **Read DECISIONS.md** in the feature folder for accumulated context
3. **Read the relevant artifact** for this skill's input:
   - The implementation plan and any scaffolded files in `src/new-app/shared/`
4. **Resume the observer** if an OBSERVATION-LOG.md exists and is in progress
5. **Continue from where you left off** — don't restart the skill from scratch

## Next Step

After completing this skill, use the `AskUserQuestion` tool to present the next step options. Include a summary of what was completed in the question text.

Options to present:

- **frontend-testing** — write tests for the infrastructure
- **generate-feature-doc** — document the implementation
- **Something else** — do something different

Do NOT present numbered text options and ask the user to "type a number." Always use the `AskUserQuestion` tool for skill transitions.

## Context Management

After completing this skill's work, report the **context usage percentage** so the user can decide whether to clean context:

> "{Skill output summary}. Context usage: **{X}%**"

Do NOT recommend cleaning context — just show the percentage. The user will decide.
