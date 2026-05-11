---
description: Test infrastructure, polyfills, and patterns for Vitest + React Testing Library
globs: "**/*.test.{ts,tsx}"
alwaysApply: false
---

# Testing

> **Scope:** All tests in `src/new-app/`. Legacy tests follow existing conventions.

## Runner & Config

- **Vitest 4** with `jsdom` environment, configured in `vitest.config.ts`
- **React Testing Library** for component tests
- **MSW v2** for API mocking
- **Coverage** scoped to `src/new-app/` only (excludes `ui/`, test files, barrel `index.ts`)
- `globals: true` — no need to import `describe`, `it`, `expect`, `vi`

## Polyfills (`vitest.setup.ts`)

The setup file provides polyfills required by Radix UI and Embla Carousel in jsdom:

- `hasPointerCapture`, `setPointerCapture`, `releasePointerCapture` — Radix pointer events
- `scrollIntoView` — Radix focus management
- `matchMedia` — Responsive hooks
- `IntersectionObserver` — Embla carousel
- `ResizeObserver` — Embla carousel

If a new Radix or Embla component fails with "X is not a function", add the polyfill here.

## Feature Test Helpers

Each feature provides test utilities in `{feature}/testing/`:

```
{feature}/testing/
  setup.tsx       # renderWithProviders (QueryClientProvider wrapper)
  factories.ts    # Test data builders for domain types
```

### `renderWithProviders`

Wraps component under test with a fresh `QueryClientProvider`:

```typescript
import { renderWithProviders } from '../testing/setup'

renderWithProviders(<MyComponent />)
```

### `createWizardMock`

For testing wizard step components in isolation:

```typescript
import { createWizardMock } from '../testing/setup'

const { Wizard, useWizard } = createWizardMock()
```

## Test Co-Location

Tests live next to their source file — no `__tests__/` directories:

```
components/
  my-component.tsx
  my-component.test.tsx
hooks/
  use-my-component.ts
  use-my-component.test.ts
```

## Commands

```bash
pnpm test                                          # all tests
pnpm vitest run src/new-app/features/{feature}     # feature tests
pnpm test:watch                                    # watch mode
pnpm test:coverage                                 # coverage report
```
