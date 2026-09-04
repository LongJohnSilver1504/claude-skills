# Test Utilities & Wrapper Patterns

> **Project config:** `{app}` is the project's new-code root from `.claude/rules/project-structure.md`; project values (package manager, commands, base branch, error surface) come from `docs/agents/project-conventions.md`. Resolve both before writing any file — never assume. If a needed file is missing, stop: "Run `/setup-daher-skills` first — missing `<file>`."


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
import { waitFor, waitForElementToBeRemoved } from '@testing-library/react'

// Wait for a query to resolve
await waitFor(() => expect(result.current.isSuccess).toBe(true))

// Wait for an element to appear
await waitFor(() => {
  expect(screen.getByText('Expected text')).toBeInTheDocument()
})

// Wait for loading to finish — see Gotcha 2 for why this beats polling queryBy*
await waitForElementToBeRemoved(() => screen.queryByText('Loading...'))
```

## Gotchas

Each of these is a checkable rule — a reviewer can cite it with a `file:line`.

### 1. One `QueryClient` per test, constructed outside the wrapper closure

```tsx
// ❌ A new client on every render — cache state resets mid-test
const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={new QueryClient()}>{children}</QueryClientProvider>
)

// ✅ One client per test, captured by the closure
const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
})
const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
)
```

**Why:** a client constructed inside the closure is a fresh instance on every re-render, so cached data and in-flight queries disappear between renders — the test flakes on timing instead of failing on behavior. (Fresh-per-*test* is the goal; fresh-per-*render* is the bug.)

### 2. `waitForElementToBeRemoved` for disappearing loaders

```tsx
// ❌ Polling for absence — passes instantly if the loader never rendered
await waitFor(() =>
  expect(screen.queryByText(/loading/i)).not.toBeInTheDocument()
)

// ✅ Asserts the loader was there, then waits for it to go
await waitForElementToBeRemoved(() => screen.queryByText(/loading/i))
```

**Why:** `waitFor` on a `queryBy*` absence is satisfied by an element that was never mounted, so a broken loading state passes; `waitForElementToBeRemoved` throws if the element is missing at the start and only resolves once it actually leaves the DOM.

### 3. Error-boundary tests: spy `console.error`, restore in `finally`

```tsx
// ❌ Spy leaks — every later test in the file runs with console.error silenced
vi.spyOn(console, 'error').mockImplementation(() => {})
render(<ErrorBoundary fallback={<p>Something went wrong</p>}><Broken /></ErrorBoundary>)
expect(screen.getByText(/something went wrong/i)).toBeInTheDocument()

// ✅ Restored even when the assertion throws
const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
try {
  render(<ErrorBoundary fallback={<p>Something went wrong</p>}><Broken /></ErrorBoundary>)
  expect(screen.getByText(/something went wrong/i)).toBeInTheDocument()
} finally {
  errorSpy.mockRestore()
}
```

**Why:** React logs the caught error through `console.error`, so the expected throw needs silencing to keep the output readable — but a spy restored only on the happy path hides real errors in every test that runs after a failure.

### 4. The RTL / real-browser boundary

```tsx
// ❌ jsdom has no layout engine — these assert on stub values, not behavior
expect(el.getBoundingClientRect().height).toBeGreaterThan(0)
expect(container.scrollTop).toBe(120)

// ✅ Assert what jsdom can actually see
expect(screen.getByRole('dialog')).toBeVisible()
expect(screen.getByRole('button', { name: /save/i })).toBeEnabled()
```

**Why:** jsdom implements the DOM API but no layout, no compositor and no real input timing — so layout and overflow, scroll position, drag-and-drop, clipboard, and focus-trap timing pass or fail on stubs. Verify those in a real browser: the smoke-walk in the `/finish-feature` skill, or a Playwright run.

### 5. `renderHook` only when no component in the feature exercises the hook

```tsx
// ❌ The feature renders <ReservationCard />, which already uses this hook
const { result } = renderHook(() => useReservationCard(id))
expect(result.current.canExtend).toBe(true)

// ✅ Same behavior, through the component the user sees
renderWithProviders(<ReservationCard id={id} />)
expect(screen.getByRole('button', { name: /extend/i })).toBeEnabled()
```

**Why:** the renderHook policy in SKILL.md reserves `renderHook` for hooks that ARE the public API — provider/context hooks, query hooks, and pure-logic hooks with no UI counterpart. When a component exercises the hook, the component render covers the hook plus its wiring, and the hook-level test only locks in a return shape that refactoring will break.
