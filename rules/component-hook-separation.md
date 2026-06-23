---
description: Enforce separation of business logic into hooks, keeping components as pure renderers
globs: src/**/*.tsx, src/**/*.ts
alwaysApply: false
---

# Component–Hook Separation

Components in `src/` must be **pure renderers**. All business logic, state management, side effects, and data transformation belong in co-located custom hooks.

## Hard Rules

1. **Components only render.** A component receives data (via props or hooks) and returns JSX. No `useEffect`, `useState`, `useCallback`, `useMemo`, `useRouter`, `useTranslation`, `fetch`, or `localStorage` calls directly inside component bodies.
2. **Every component gets a hook.** Every component that uses any React hook (including `useTranslation`) must have a co-located `use-{component-name}.ts` hook. Even simple hooks that only resolve a translated title — the component must remain a pure renderer with zero hook calls.
3. **Hook naming matches the component.** `LanguageSelector` → `useLanguageSelector`, `ReservationDetailLayout` → `useReservationDetailLayout`.
4. **Hooks return typed objects.** Define a `Use{Name}Return` type for each hook's return value.
5. **Self-contained components.** Feature components (cards, sections) should fetch their own data internally via their hook, not receive data as props from a parent page. The page component should be a layout compositor, not a data orchestrator. Each card owns its data lifecycle.
6. **Use CVA for variant styling.** When a component has multiple visual states (enabled/disabled, variants), use `class-variance-authority` (`cva`) instead of manual `cn()` conditionals. Define variants as a CVA config object.
7. **Hooks return translated strings, never `t`.** The `useTranslation` hook is called inside the custom hook, and the hook returns already-translated strings in its return object. Never expose the `t` function to the component — the component receives display-ready strings. This keeps components locale-agnostic and makes them trivial to test (no i18n provider needed in tests).

## File Structure

Every feature module and sub-feature in `features/` uses this structure:

```
{module}/
  components/
    my-component.tsx            # Pure renderer — imports from ../hooks/
    my-component.test.tsx       # Test co-located next to source
  hooks/
    use-my-component.ts         # All logic for MyComponent
    use-my-component.test.ts    # Test co-located next to source
  domain/                       # Optional — sub-feature-only logic
  index.ts                      # Barrel: exports components + hooks
```

For features with multiple sub-pages, the same structure repeats at both levels:

```
{feature}/                      # Parent feature
  api/                          # Shared API
  domain/                       # Shared types + business logic
  queries/                      # Shared query keys
  hooks/                        # Shared hooks
  testing/                      # Shared test factories
  pages/                        # Page compositors (one per route)

  {sub-feature}/                # Self-contained sub-feature
    components/
    hooks/
    domain/                     # Only if sub-feature has local-only logic

  index.ts                      # Public barrel exports
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

## i18n: Translate in Hooks

Hooks call `useTranslation()` and return translated strings. Components never see the `t` function.

```tsx
// ✅ DO: Hook returns translated strings
export const useInfoStep = (): UseInfoStepReturn => {
  const { t } = useTranslation('auth')
  const { activeStep, totalSteps } = useWizard()

  return {
    title: t('changePhone.step2Title'),
    stepLabel: t('changePhone.stepOf', { current: activeStep + 1, total: totalSteps }),
    checklistItems: [
      t('changePhone.step2Item1'),
      t('changePhone.step2Item2'),
    ],
  }
}

// ✅ Component receives display-ready strings
export const InfoStep = () => {
  const { title, stepLabel, checklistItems } = useInfoStep()
  return <h1>{title}</h1>
}
```

```tsx
// ❌ DON'T: Expose t to the component
type UseInfoStepReturn = {
  t: (key: string) => string   // WRONG — leaks i18n concern to component
}

// ❌ DON'T: Translate inside the component
export const InfoStep = () => {
  const { t } = useInfoStep()
  return <h1>{t('changePhone.step2Title')}</h1>  // component is doing translation work
}
```

## Wizard Step Components

Wizard step components rendered inside a `<Wizard>` follow the same rule: **the step component calls only its own hook**. Context hooks like `useWizard()` must be consumed inside the step's custom hook, not in the component body.

```tsx
// ✅ DO: useWizard inside the hook
export const useOldPhoneStep = (): UseOldPhoneStepReturn => {
  const { activeStep, totalSteps } = useWizard()
  const store = useChangePhoneStore()
  // ...
  return { activeStep, totalSteps, /* ... */ }
}

export const OldPhoneStep = () => {
  const { activeStep, totalSteps, /* ... */ } = useOldPhoneStep()
  return <div>Step {activeStep + 1} of {totalSteps}</div>
}

// ❌ DON'T: useWizard called directly in the component
export const OldPhoneStep = () => {
  const { form, onSubmit } = useOldPhoneStep()
  const { activeStep, totalSteps } = useWizard() // violation — second hook call
  return <div>Step {activeStep + 1} of {totalSteps}</div>
}
```

This applies to any context hook provided by a parent wrapper (`useWizard`, `useStepper`, etc.) — the step component must remain a single-hook pure renderer.

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

- **shadcn/ui primitives** (`src/ui/`) — these are low-level wrappers, not feature components.
- **Pure composition components** that receive all data via props and have zero hook calls (e.g., `ChangeDateAction` composing `ChangesBanner` + `ActionRow`). These are leaf renderers, not feature components.
- **Legacy code** (`src/components/`, `src/pages/`) — apply this pattern only when adding new features there, not during bug fixes.

## Related Rules

- [react-components.mdc](mdc:.cursor/rules/react-components.mdc) — Arrow functions, named exports, props naming
- [project-structure.mdc](mdc:.cursor/rules/project-structure.mdc) — Where components and hooks live
- [tanstack-query.mdc](mdc:.cursor/rules/tanstack-query.mdc) — Query/mutation hook patterns
