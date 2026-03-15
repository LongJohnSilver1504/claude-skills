# Test Utilities & Wrapper Patterns

Shared test utilities for the TruckBays project.

## QueryClient Wrapper

Most hooks use TanStack Query and need a `QueryClientProvider`. Create a fresh client per test to avoid state leakage.

```tsx
// test/utils.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, type RenderOptions } from '@testing-library/react'
import { ErrorProvider } from '@/shared/providers'

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  })
}

type TestProvidersProps = {
  children: React.ReactNode
}

function TestProviders({ children }: TestProvidersProps) {
  const queryClient = createTestQueryClient()
  return (
    <QueryClientProvider client={queryClient}>
      <ErrorProvider>
        {children}
      </ErrorProvider>
    </QueryClientProvider>
  )
}

/**
 * Custom render that wraps component in all providers.
 * Use instead of RTL's `render` for components that depend on providers.
 */
export function renderWithProviders(
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return render(ui, { wrapper: TestProviders, ...options })
}

/**
 * Create a wrapper function for `renderHook`.
 * Creates a fresh QueryClient per call to avoid state leakage.
 */
export function createHookWrapper() {
  const queryClient = createTestQueryClient()
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <ErrorProvider>
        {children}
      </ErrorProvider>
    </QueryClientProvider>
  )
}
```

## Mock Data Factories

Create factory functions for consistent test data:

```tsx
// test/factories/{feature}.factory.ts
import type { {Feature} } from '@/features/{feature}/domain/{feature}.types'

export function create{Feature}(overrides: Partial<{Feature}> = {}): {Feature} {
  return {
    id: 1,
    status: 'active',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
  }
}

export function createRaw{Feature}Response(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    ...overrides,
  }
}
```

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
