---
name: frontend-testing
description: Write tests for feature modules using Vitest, React Testing Library, and MSW v2. Use when writing tests, adding test coverage, or setting up testing infrastructure.
---

> **Path convention:** `{app}` is the project's new-code root from `.claude/rules/project-structure.md` (some projects use `src/new-app/`, others `src/` directly). Resolve it from the rule before writing any file — never assume.
> **If `project-structure.md` does not exist:** stop and ask the user (AskUserQuestion) to define the structure before scaffolding anything. For a **new project**, propose a sensible default (e.g., `src/features/` with `src/shared/` and `src/ui/`) as the recommended option; for an **existing project**, detect candidate roots from the actual tree (Glob for `features/`, `shared/`, `ui/`) and present them as options. Then offer to save the answer as `.claude/rules/project-structure.md` so no one has to ask again.
# Frontend Testing

Write tests that give confidence your app works — not tests that verify implementation details.

## Testing Philosophy

> "The more your tests resemble the way your software is used, the more confidence they can give you." — Kent C. Dodds

### Do NOT test implementation details

Implementation details are things users of your code will not typically use, see, or know about. Testing them leads to:

- **False negatives** — tests break when you refactor, even though the app still works
- **False positives** — tests pass even though the app is broken

```tsx
// ❌ DON'T: Test hook return values directly
const { result } = renderHook(() => useNavbar())
expect(result.current.isOpen).toBe(false)  // user never sees "isOpen"

// ✅ DO: Test what the user sees and does
render(<Navbar />)
await userEvent.click(screen.getByLabelText(/menu/i))
expect(screen.getByRole('navigation')).toBeVisible()
```

### Who are the "users"?

1. **End users** — interact via rendered UI (buttons, text, navigation)
2. **Developers** — interact via props and public hook APIs

Tests should only assert on things these two users care about.

### When `renderHook` IS appropriate

- **Provider/context hooks** (`useAuth`) — the hook IS the public developer API
- **TanStack Query hooks** — testing data fetching behavior
- **Pure logic hooks** with no UI counterpart (rare)

For hooks that power a component (`useNavbar`, `useBackHeader`, `useLanguageSelector`), test through the **component** instead.

## Stack

| Tool | Purpose |
|------|---------|
| **Vitest** | Test runner and assertions |
| **React Testing Library** | Component and hook rendering |
| **@testing-library/user-event** | Simulating user interactions |
| **MSW v2** | API mocking at the network level |
| **jsdom** | Browser environment simulation |

## Test-First Workflow

Build features as **vertical slices** with a red-green loop — one test, one piece of implementation, repeat.

### Anti-pattern: horizontal slices

Do NOT write all the tests first and then all the implementation. Tests written in bulk verify *imagined* behavior — they end up asserting on the shape of things (data structures, signatures) instead of user-facing behavior, pass when behavior breaks, and fail when it's fine.

```
WRONG (horizontal):            RIGHT (vertical, tracer bullets):
  RED:   test1..test5            RED→GREEN: test1→impl1
  GREEN: impl1..impl5            RED→GREEN: test2→impl2
                                 RED→GREEN: test3→impl3
```

### Tracer bullet first

Start with ONE test that proves the path end-to-end — component renders → hook fires → MSW handler answers → UI shows the result — then write the minimal code to pass it. Each subsequent test responds to what the previous cycle taught you: because you just wrote the code, you know exactly which behavior matters and how to verify it.

### The loop

1. **RED** — write the next failing test and **watch it fail**:
   `pnpm vitest run {features-root}/{feature}` (or `pnpm test:watch` while looping)
2. **GREEN** — write the *minimal* code that passes. No speculative features, no code for tests you haven't written yet.
3. **REFACTOR** — clean up with tests green. Never refactor while RED.

Mock only at system boundaries: HTTP via MSW handlers (see [references/msw-setup.md](references/msw-setup.md)), `next/router`, time. Never mock your own modules just to force a test green — see [references/testing-anti-patterns.md](references/testing-anti-patterns.md).

### Regression tests must fail first

A bug-fix test only counts if you have verified it fails without the fix. If it passes before the fix lands, it isn't testing the bug.

## Test File Conventions

Co-location (tests live next to their source file, never in separate test directories), runner config, test commands, and per-feature helper locations are defined in the project rule — see `.claude/rules/testing.md`. Beyond the rule:

- One describe block per module, nested describes for scenarios
- Follow AAA pattern: Arrange, Act, Assert

## Query Priority (Accessibility First)

Always prefer queries that match how users and assistive technology interact with your app. Follow this priority order:

### 1. 🥇 getByRole (Preferred)
Queries elements exposed in the accessibility tree. Best for testing accessibility and should be your default choice.

```tsx
// Buttons
screen.getByRole('button', { name: /submit/i })
screen.getByRole('button', { name: /cancel/i })

// Form fields
screen.getByRole('textbox', { name: /email/i })
screen.getByRole('textbox', { name: /password/i })
screen.getByRole('combobox', { name: /country/i })

// Navigation
screen.getByRole('navigation')
screen.getByRole('link', { name: /home/i })

// Headings
screen.getByRole('heading', { name: /dashboard/i, level: 1 })
```

### 2. 🥈 getByLabelText
For form fields associated with labels. Excellent for accessibility.

```tsx
screen.getByLabelText(/email address/i)
screen.getByLabelText(/password/i)
```

### 3. 🥉 getByPlaceholderText
When a label is not available (less ideal than label text).

```tsx
screen.getByPlaceholderText(/search\.\.\./i)
```

### 4. getByText
For non-interactive elements (paragraphs, divs, spans) or finding by text content.

```tsx
screen.getByText(/welcome back/i)
screen.getByText(/no results found/i)
```

### 5. 🚫 getByTestId (Last Resort)
Only use when semantic queries don't work or don't make sense (e.g., dynamic text, non-semantic wrappers).

```tsx
// Avoid this when possible
screen.getByTestId('user-avatar')
```

**Why this order matters:**
- `getByRole` and `getByLabelText` test accessibility
- They force proper semantic HTML
- They align with how screen readers work
- They make your app more accessible to users with disabilities

## Testing Strategy by Layer

### 1. Components (Primary — test behavior through UI)

This is where most tests should live. Render the component, interact as a user would, assert on visible output.

```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// vi.mock is HOISTED to the top of the file — declare it at module level,
// never inside an `it` block. Module-scope mock fns are safe to reference
// because the factory's returned functions read them at render time.
const mockPush = vi.fn()

vi.mock('next/router', () => ({
  useRouter: () => ({ push: mockPush, isReady: true, query: {} }),
}))

describe('Navbar', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('opens the menu when hamburger is clicked', async () => {
    render(<Navbar />)

    // Use getByRole for buttons with accessible name
    await userEvent.click(screen.getByRole('button', { name: /menu/i }))

    expect(screen.getByRole('navigation')).toBeVisible()
  })

  it('hides auth-required items when unauthenticated', async () => {
    render(<Navbar />)  // default: unauthenticated

    await userEvent.click(screen.getByRole('button', { name: /menu/i }))

    expect(screen.queryByText(/messages/i)).not.toBeInTheDocument()
  })

  it('navigates to home when logo is clicked', async () => {
    render(<Navbar />)

    await userEvent.click(screen.getByRole('link', { name: /home/i }))

    expect(mockPush).toHaveBeenCalledWith('/')
  })
})
```

When a test needs a *different* router shape (e.g., populated `query`), keep the mock's mutable pieces at module scope and reset them in `beforeEach` — the same pattern the project's existing tests use:

```tsx
const mockPush = vi.fn().mockResolvedValue(undefined)
const mockQuery: Record<string, string> = {}

vi.mock('next/router', () => ({
  useRouter: () => ({ isReady: true, query: mockQuery, push: mockPush }),
}))

beforeEach(() => {
  vi.clearAllMocks()
  Object.keys(mockQuery).forEach((key) => delete mockQuery[key])
})

it('preselects the reservation from the URL', () => {
  mockQuery.reservationId = '42'
  // ...
})
```

### 2. Providers / Context Hooks (renderHook is OK)

The hook IS the public API for developers. Test it directly.

```tsx
import { renderHook, waitFor } from '@testing-library/react'
import { AuthProvider, useAuth } from './auth-provider'

const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>

describe('useAuth', () => {
  it('returns authenticated when valid user in localStorage', async () => {
    localStorage.setItem('user', JSON.stringify(validUser))
    const { result } = renderHook(() => useAuth(), { wrapper })

    await waitFor(() => expect(result.current.isAuthenticated).toBe(true))
  })
})
```

### 3. Domain Layer (Pure Functions)

No mocking needed. Test inputs → outputs.

```tsx
import { canEdit, getStatusLabel } from '../{feature}.service'

describe('{feature}.service', () => {
  it('returns true for active items', () => {
    expect(canEdit({ status: 'active' })).toBe(true)
  })
})
```

### 4. API Layer (MSW)

Use MSW to mock HTTP at the network level. The server is set up **per test file** — there is no global MSW server (see [references/msw-setup.md](references/msw-setup.md)).

```tsx
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'

const server = setupServer()
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('{feature}Api', () => {
  it('maps response correctly', async () => {
    server.use(
      http.get('*/{feature}s', () => HttpResponse.json({ results: [{ id: 1 }] }))
    )
    const result = await {feature}Api.getAll({})
    expect(result.results).toHaveLength(1)
  })
})
```

## Async Testing Patterns

### Use waitFor for Async Assertions

When testing async behavior, use `waitFor` for:
- Component re-renders
- State changes after async operations
- Asynchronous updates from data fetching

```tsx
import { waitFor } from '@testing-library/react'

it('displays data after loading', async () => {
  render(<UserProfile userId="123" />)

  // Wait for loading to complete
  await waitFor(() => {
    expect(screen.queryByText(/loading/i)).not.toBeInTheDocument()
  })

  // Assert final state
  expect(screen.getByText(/john doe/i)).toBeInTheDocument()
})
```

### Alternative: findBy Queries

For simpler cases, use `findBy*` queries (combines `getBy` + `waitFor`):

```tsx
it('displays data after loading', async () => {
  render(<UserProfile userId="123" />)

  // Automatically waits for element to appear
  expect(await screen.findByText(/john doe/i)).toBeInTheDocument()
})
```

### Handling act() Warnings

React Testing Library methods handle `act()` automatically. If you see act() warnings:

**What it means:**
- Component state updated but test didn't wait for it
- Indicates untested component updates

**How to fix:**
```tsx
// ❌ BAD: Missing await
userEvent.click(button)
expect(screen.getByText(/success/i)).toBeInTheDocument()

// ✅ GOOD: Await user interaction
await userEvent.click(button)
expect(screen.getByText(/success/i)).toBeInTheDocument()

// ✅ GOOD: Wait for async updates
await userEvent.click(button)
await waitFor(() => {
  expect(screen.getByText(/success/i)).toBeInTheDocument()
})
```

**General rule:**
- Always `await` userEvent methods
- Use `waitFor` or `findBy*` for async assertions
- If you see act() warnings, your test is incomplete

## Additional Resources

- For test utilities, wrapper patterns, and rendering helpers, see [references/test-utilities.md](references/test-utilities.md)
- For MSW v2 setup, handler patterns, and network mocking, see [references/msw-setup.md](references/msw-setup.md)
- For the ways tests rot into false confidence (testing mocks, test-only production code, mocking without understanding), see [references/testing-anti-patterns.md](references/testing-anti-patterns.md)

## Shared Test Factories

When a domain type (e.g., `Reservation`) is used across many test files, create a **shared test factory** instead of duplicating `makeReservation` in every test file. This avoids a cascade of updates when adding a new required field to the type.

Factories live in `features/{feature}/testing/factories.ts` (location defined in `.claude/rules/testing.md`).

### Factory pattern

```typescript
// features/reservation-details/testing/factories.ts
import type { Reservation, ReservationInvoice } from '../domain/reservation.types'

export const createReservation = (overrides: Partial<Reservation> = {}): Reservation => ({
  id: 1,
  status: 'checked in',
  type: 'daily',
  // ... all required fields with sensible defaults ...
  ...overrides,
})

export const createInvoice = (overrides: Partial<ReservationInvoice> = {}): ReservationInvoice => ({
  id: 1,
  status: 'paid',
  total: 5000,
  createdAt: '2026-01-01T00:00:00Z',
  collectionMethod: 'charge_automatically',
  ...overrides,
})
```

### Usage in tests

```typescript
// domain/reservation-state.test.ts
import { createReservation, createInvoice } from '../testing/factories'

it('returns CHARGED_FAILED when own payment failed', () => {
  const r = createReservation({ payment: { status: 'payment failed' } })
  expect(resolveState(r)).toBe('CHARGED_FAILED')
})

it('detects unpaid invoice', () => {
  const r = createReservation({
    invoice: createInvoice({ status: 'open' }),
  })
  expect(resolveState(r)).toBe('CHARGED_FAILED')
})
```

### When to create a factory

- The domain type has **5+ required fields** AND
- It appears in **3+ test files**

If a type is only tested in 1-2 files, a local `makeX` helper is fine.

### API response factories

For API layer tests, create a separate factory for the raw API response shape:

```typescript
export const createApiResponse = (overrides: Record<string, unknown> = {}) => ({
  id: 1,
  status: 'checked in',
  // ... raw API shape ...
  ...overrides,
})
```

## Checklist

```
[ ] Test-first: every test was seen RED before its implementation landed
[ ] Component tests: render + userEvent + screen assertions
[ ] Provider tests: renderHook for public API hooks only
[ ] Domain tests: pure function input/output
[ ] API tests: MSW (or mocked client) + schema validation
[ ] NO hook-level tests for hooks that power components
```

## Resume After Context Cleanup

If context was cleaned mid-pipeline, restore state before proceeding:

1. **Read the feature's pipeline artifacts** (`.claude/pipeline/{feature}/` and the feature folder: DESIGN.md, PRD.md, UX-spec.md, PROGRESS.md — whichever exist) for accumulated context
2. **Read the relevant artifact** for this skill's input:
   - The feature code and any existing test files in the feature folder
3. **Continue from where you left off** — don't restart the skill from scratch

## Next Step

After completing this skill, use the `AskUserQuestion` tool to present the next step options. Include a summary of what was completed in the question text.

Options to present:

- **generate-feature-doc** — document the implementation
- **Something else** — do something different

Do NOT present numbered text options and ask the user to "type a number." Always use the `AskUserQuestion` tool for skill transitions.

