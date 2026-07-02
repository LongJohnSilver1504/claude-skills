# Test Utilities & Wrapper Patterns

> **Path convention:** `{app}` is the project's new-code root from `.claude/rules/project-structure.md` (some projects use `src/new-app/`, others `src/` directly). Resolve it from the rule before writing any file — never assume.
> **If `project-structure.md` does not exist:** stop and ask the user (AskUserQuestion) to define the structure before scaffolding anything. For a **new project**, propose a sensible default (e.g., `src/features/` with `src/shared/` and `src/ui/`) as the recommended option; for an **existing project**, detect candidate roots from the actual tree (Glob for `features/`, `shared/`, `ui/`) and present them as options. Then offer to save the answer as `.claude/rules/project-structure.md` so no one has to ask again.


Test helpers in this project are **per-feature**, not global. Each feature owns its helpers in `features/{feature}/testing/`:

```
features/{feature}/
  testing/
    setup.tsx       # renderWithProviders + createWizardMock
    factories.ts    # Test data builders for the feature's domain types
```

There is **no global `test/utils.tsx`**. And `vitest.setup.ts` at the repo root contains **only** the `@testing-library/jest-dom/vitest` import plus jsdom polyfills (pointer capture, `scrollIntoView`, `matchMedia`, `IntersectionObserver`, `ResizeObserver` for Radix UI and Embla) — never providers, MSW servers, or global mocks.

## `renderWithProviders` (per-feature `testing/setup.tsx`)

Wraps the component under test in a fresh `QueryClientProvider` per render to avoid state leakage between tests:

```tsx
// features/{feature}/testing/setup.tsx
import { type ReactNode } from 'react'
import { render, type RenderOptions } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

export const renderWithProviders = (
  ui: React.ReactElement,
  options?: RenderOptions
) => {
  const queryClient = createTestQueryClient()
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
  return render(ui, { wrapper: Wrapper, ...options })
}
```

Usage:

```tsx
import { renderWithProviders } from '../../testing/setup'

renderWithProviders(<MyComponent />)
```

Only `QueryClientProvider` is wrapped by default. If a component genuinely needs another provider (e.g., `NotificationProvider` from `@/{app}/shared/providers`), add it to that feature's `Wrapper` — don't create a global one.

## `createWizardMock` (wizard step testing)

For pages/components rendered inside `<Wizard>`, the setup file exports a factory that provides a working `WizardContext` so `useWizard()` works inside step hooks:

```tsx
// features/{feature}/testing/setup.tsx (continued)
import { createContext, useContext } from 'react'

type WizardContextValue = {
  activeStep: number
  totalSteps: number
  direction: 1 | -1
  isFirstStep: boolean
  isLastStep: boolean
  canScrollPrev: boolean
  canScrollNext: boolean
  next: () => void
  prev: () => void
  goToStep: (step: number) => void
}

const WizardContext = createContext<WizardContextValue | null>(null)

export const createWizardMock = () => ({
  Wizard: ({ steps, currentStep }: { steps: ReactNode[]; currentStep: number }) => (
    <WizardContext.Provider
      value={{
        activeStep: currentStep,
        totalSteps: steps.length,
        direction: 1 as const,
        isFirstStep: currentStep === 0,
        isLastStep: currentStep === steps.length - 1,
        canScrollPrev: currentStep > 0,
        canScrollNext: currentStep < steps.length - 1,
        next: () => {},
        prev: () => {},
        goToStep: () => {},
      }}
    >
      <div data-testid="wizard">{steps[currentStep]}</div>
    </WizardContext.Provider>
  ),
  Stepper: () => null,
  useWizard: (): WizardContextValue => {
    const ctx = useContext(WizardContext)
    if (!ctx) throw new Error('useWizard must be used within a Wizard')
    return ctx
  },
})
```

Usage in a test file — mock the real wizard module with the factory:

```tsx
import { renderWithProviders, createWizardMock } from '../../testing/setup'

vi.mock('@/{app}/ui/custom/wizard', () => createWizardMock())
```

## Data Factories (per-feature `testing/factories.ts`)

See the "Shared Test Factories" section in SKILL.md for the factory pattern and the thresholds for when to create one. Factories always live next to the setup file, in the same feature's `testing/` folder — never in a global `test/factories/` directory.

## Hook Wrappers for `renderHook`

When a hook under test uses TanStack Query, give `renderHook` the same fresh-client wrapper:

```tsx
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
})
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
)

const { result } = renderHook(() => useMyFeature(), { wrapper })
```

Remember the renderHook policy from SKILL.md: only for provider/context hooks, query hooks, and pure-logic hooks — hooks that power a component are tested through the component.

## Waiting for Async State

```tsx
import { waitFor } from '@testing-library/react'

// Wait for a query to resolve
await waitFor(() => expect(result.current.isSuccess).toBe(true))

// Wait for an element to appear
await waitFor(() => {
  expect(screen.getByText('Expected text')).toBeInTheDocument()
})

// Wait for loading to finish
await waitFor(() => {
  expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
})
```
