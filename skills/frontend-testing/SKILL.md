---
name: frontend-testing
description: Write tests for TruckBays features using Vitest, React Testing Library, and MSW v2. Use when writing tests, adding test coverage, or setting up testing infrastructure.
---

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

## Test File Conventions

- **Tests are co-located next to their source file** — no `__tests__/` directories.
  - `components/navbar.tsx` → `components/navbar.test.tsx`
  - `providers/auth-provider.tsx` → `providers/auth-provider.test.tsx`
  - `domain/{feature}.service.ts` → `domain/{feature}.service.test.ts`
  - `api/{feature}.api.ts` → `api/{feature}.api.test.ts`
- Test files use `.test.ts` or `.test.tsx` suffix
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
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

describe('Navbar', () => {
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
    const mockPush = vi.fn()
    vi.mock('next/router', () => ({ useRouter: () => ({ push: mockPush }) }))

    render(<Navbar />)

    await userEvent.click(screen.getByRole('link', { name: /home/i }))

    expect(mockPush).toHaveBeenCalledWith('/')
  })
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

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.isAuthenticated).toBe(true)
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

Use MSW to mock HTTP at the network level.

```tsx
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'

const server = setupServer()
beforeAll(() => server.listen())
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

## Shared Test Factories

When a domain type (e.g., `Reservation`) is used across many test files, create a **shared test factory** instead of duplicating `makeReservation` in every test file. This avoids a cascade of updates when adding a new required field to the type.

### Where to put it

```
features/{feature}/
  testing/
    factories.ts          # Shared test factories for this feature
```

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
[ ] vitest.config.ts configured with jsdom, path aliases, setup file
[ ] vitest.setup.ts imports @testing-library/jest-dom
[ ] Component tests: render + userEvent + screen assertions
[ ] Provider tests: renderHook for public API hooks only
[ ] Domain tests: pure function input/output
[ ] API tests: MSW + mapper validation
[ ] NO hook-level tests for hooks that power components
[ ] package.json scripts: test, test:watch, test:coverage
```

## Resume After Context Cleanup

If context was cleaned mid-pipeline, restore state before proceeding:

1. **Read DECISIONS.md** in the feature folder for accumulated context
2. **Read the relevant artifact** for this skill's input:
   - The feature code and any existing test files in the feature folder
3. **Continue from where you left off** — don't restart the skill from scratch

## Next Step

After completing this skill, use the `AskUserQuestion` tool to present the next step options. Include a summary of what was completed in the question text.

Options to present:

- **generate-feature-doc** — document the implementation
- **Something else** — do something different

Do NOT present numbered text options and ask the user to "type a number." Always use the `AskUserQuestion` tool for skill transitions.

## Context Management

After completing this skill's work, report the **context usage percentage** so the user can decide whether to clean context:

> "{Skill output summary}. Context usage: **{X}%**"

Do NOT recommend cleaning context — just show the percentage. The user will decide.
