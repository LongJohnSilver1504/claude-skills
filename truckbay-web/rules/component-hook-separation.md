---
description: Enforce separation of business logic into hooks, keeping components as pure renderers
globs: src/new-app/**/*.tsx, src/new-app/**/*.ts
alwaysApply: false
---

# Component–Hook Separation

Components in `src/new-app/` must be **pure renderers**. All business logic, state management, side effects, and data transformation belong in co-located custom hooks.

## Hard Rules

1. **Components only render.** A component receives data (via props or hooks) and returns JSX. No `useEffect`, `useState`, `useCallback`, `useMemo`, `useRouter`, `fetch`, or `localStorage` calls directly inside component bodies.
2. **Logic lives in hooks.** For every component that needs logic beyond simple prop drilling, create a `use-{component-name}.ts` hook in the sibling `hooks/` directory.
3. **Hook naming matches the component.** `LanguageSelector` → `useLanguageSelector`, `ReservationDetailLayout` → `useReservationDetailLayout`.
4. **Hooks return typed objects.** Define a `Use{Name}Return` type for each hook's return value.
5. **Keep hooks deep, not shallow.** A hook should hide meaningful logic (router access, localStorage, data transforms). Don't wrap a single `useState` call in a hook — that's a shallow abstraction.

## File Structure

Every layout module in `shared/layouts/` and every feature module in `features/` uses this structure:

```
{module}/
  components/
    my-component.tsx            # Pure renderer — imports from ../hooks/
    my-component.test.tsx       # Test co-located next to source
  hooks/
    use-my-component.ts         # All logic for MyComponent
    use-my-component.test.ts    # Test co-located next to source
  index.ts                      # Barrel: exports components + hooks
```

Component `.tsx` files always live inside `components/`, never at the module root.
Test files live next to their source file — no `__tests__/` directories.

## Examples

```tsx
// ✅ DO: Component as pure renderer
export const LanguageSelector = () => {
  const {currentLocale, nextLocale, currentPath, switchLanguage} =
    useLanguageSelector()

  return (
    <Button variant="ghost" size="icon" asChild>
      <Link href={currentPath} locale={nextLocale} onClick={switchLanguage}>
        <Globe className="h-4 w-4" />
        <span>{currentLocale.toUpperCase()}</span>
      </Link>
    </Button>
  )
}

// ✅ DO: Hook encapsulates logic
export const useLanguageSelector = (): UseLanguageSelectorReturn => {
  const router = useRouter()
  const currentLocale = (router.locale ?? 'en') as Locale
  const nextLocale: Locale = currentLocale === 'en' ? 'es' : 'en'

  const switchLanguage = useCallback(() => {
    localStorage.setItem('language', nextLocale)
  }, [nextLocale])

  return { currentLocale, nextLocale, currentPath: router.asPath, switchLanguage }
}
```

```tsx
// ❌ DON'T: Logic inside the component
export const LanguageSelector = () => {
  const router = useRouter()
  const currentLocale = (router.locale ?? 'en') as Locale
  const nextLocale = currentLocale === 'en' ? 'es' : 'en'

  const handleClick = () => {
    localStorage.setItem('language', nextLocale)
  }

  return (
    <Button onClick={handleClick}>
      {currentLocale.toUpperCase()}
    </Button>
  )
}
```

## Dialog/Modal State Naming

When a **feature hook** (e.g., `useReservationDetailPage`) manages open/close state for a dialog, the state variable must include the dialog name — the page may have multiple dialogs in the future.

```typescript
// ✅ Feature hook with specific dialog name
const [isCheckoutGuideOpen, setIsCheckoutGuideOpen] = useState(false)
const [isExtendDialogOpen, setIsExtendDialogOpen] = useState(false)

// ❌ Generic names in a feature hook (ambiguous with multiple dialogs)
const [isDialogOpen, setIsDialogOpen] = useState(false)
```

A **standalone dialog component** that owns its own trigger via `DialogTrigger` can use generic `open`/`onOpenChange` props — those are scoped to the component itself.

## When to Skip

- **shadcn/ui primitives** (`src/new-app/ui/`) — these are low-level wrappers, not feature components.
- **Trivial components** that only compose other components with no logic at all (pure layout wrappers with zero state/effects).
- **Legacy code** (`src/components/`, `src/pages/`) — apply this pattern only when adding new features there, not during bug fixes.

## Related Rules

- [react-components.mdc](mdc:.cursor/rules/react-components.mdc) — Arrow functions, named exports, props naming
- [project-structure.mdc](mdc:.cursor/rules/project-structure.mdc) — Where components and hooks live
- [tanstack-query.mdc](mdc:.cursor/rules/tanstack-query.mdc) — Query/mutation hook patterns
