# Shared Architecture Conventions

Conventions shared by create-feature and create-infrastructure skills. Both skills reference this file instead of duplicating.

## Hook/Component Separation

Components are pure renderers. ALL logic lives in co-located hooks.

**Hook file contains ALL:** `useState`, `useEffect`, `useCallback`, `useMemo`, `useRouter`, `useTranslation`, event handlers, mutations, business logic, computed values.

**Component file contains ONLY:** JSX rendering, styling via className, calling hooks, conditional rendering based on hook return values.

```tsx
// hooks/use-{name}.ts — ALL logic
export const use{Name} = (): Use{Name}Return => {
  const { t } = useTranslation('{namespace}')
  const router = useRouter()
  // ... all state, effects, handlers
  return { translations, data, handlers }
}

// components/{name}.tsx — UI rendering ONLY
export const {Name} = () => {
  const { translations, data, handlers } = use{Name}()
  return <div>...</div>
}
```

## Component Conventions

- Arrow function components with named exports (never function declarations, never default exports)
- Props type defined as `{ComponentName}Props` directly above the component
- Use `forwardRef` when wrapping a DOM element (React 18 requirement)
- Use CVA (`class-variance-authority`) for variant styling instead of manual `cn()` conditionals

## Translation Pattern

- Never use `useTranslation` directly in components — include it in the hook
- Return a `translations` object from the hook with all user-facing strings
- Use nested JSON objects, not flat dot-notation keys
- Key naming: `{feature}.{section}.{element}`
- Always create both EN and ES files

## Imports

| Import | From |
|--------|------|
| `client`, `isAxiosError` | `@/new-app/shared/api` |
| `AppError` | `@/new-app/shared/errors` |
| `tryCatch` | `@/new-app/shared/utils` |
| `useError` | `@/new-app/shared/providers` |
| `links` | `@/new-app/shared/links` |
| `clsxm` | `@/utils/clsxm` |
| shadcn components | `@/new-app/ui/{component}` |
| Icons | `lucide-react` |
| `useTranslation` | `next-i18next` (only in hooks) |
| Centralized routes | `@/new-app/shared/links` |
| Providers | `@/new-app/shared/providers/{provider}` |

## Shared Anti-Patterns

- **Don't put logic in component files** — ALL logic goes in hooks
- **Don't hardcode routes** — use `links` from `shared/links`
- **Don't import from legacy** — `new-app/` must not import from `src/components/`, `src/api/`, `src/hooks/`
- **Don't use function declarations** — arrow function components with named exports
- **Don't use `toast.error()` directly** — use `useError().showError()`
- **Don't inline i18n strings** — all user-facing text comes from translation files
