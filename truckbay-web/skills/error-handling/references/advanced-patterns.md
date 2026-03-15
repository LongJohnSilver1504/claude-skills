# Advanced Error Handling Patterns

## Error Boundaries (React)

The project does not yet have Error Boundary components. When adding them:

```typescript
// shared/components/error-boundary.tsx
'use client'

import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode | ((error: Error, reset: () => void) => ReactNode)
}

interface State {
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary]', error, errorInfo)
  }

  reset = () => {
    this.setState({ error: null })
  }

  render() {
    if (this.state.error) {
      const { fallback } = this.props
      if (typeof fallback === 'function') {
        return fallback(this.state.error, this.reset)
      }
      return fallback ?? <DefaultErrorFallback error={this.state.error} reset={this.reset} />
    }
    return this.props.children
  }
}

function DefaultErrorFallback({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 p-8">
      <h2 className="text-lg font-semibold">Something went wrong</h2>
      <p className="text-sm text-muted-foreground">{error.message}</p>
      <button onClick={reset} className="text-sm underline">Try again</button>
    </div>
  )
}
```

### Next.js `error.tsx` Convention

```typescript
// app/(private)/locations/error.tsx
'use client'

export default function LocationsError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 p-8">
      <h2 className="text-lg font-semibold">Failed to load locations</h2>
      <p className="text-sm text-muted-foreground">{error.message}</p>
      <button onClick={reset} className="text-sm underline">Try again</button>
    </div>
  )
}
```

## Form-Level Error Display

For errors that should appear inline in forms (not as toasts):

```typescript
// In a hook that returns form-level errors
export function useSignIn() {
  const [formError, setFormError] = useState<string | null>(null)
  const { showError } = useError()

  const mutation = useMutation({
    mutationFn: authApi.signIn,
    onError: (error) => {
      if (AppError.isAppError(error)) {
        switch (error.code) {
          case 'INVALID_CREDENTIALS':
            // Show inline instead of toast
            setFormError('Invalid email or password')
            return
          default:
            // Non-form errors still go to toast
            showError('Something went wrong')
        }
        return
      }
      showError('An unexpected error occurred')
    },
  })

  return { ...mutation, formError, clearFormError: () => setFormError(null) }
}
```

```tsx
// In the form component
const { mutate, formError, clearFormError } = useSignIn()

{formError && (
  <p className="text-sm text-destructive">{formError}</p>
)}
```

**When to use form-level vs toast:**
- **Form-level:** Validation errors, credential errors — anything the user can fix by changing input
- **Toast:** Network errors, server errors, permission errors — things outside the form

## Retry Patterns

```typescript
// Using TanStack Query retry
const { data, error } = useQuery({
  queryKey: ['locations'],
  queryFn: locationApi.list,
  retry: (failureCount, error) => {
    // Don't retry client errors (4xx)
    if (AppError.isAppError(error) && error.status >= 400 && error.status < 500) {
      return false
    }
    return failureCount < 3
  },
})
```

## Error Mapping Helper

For features with many status-to-error mappings, extract a helper:

```typescript
// features/{feature}/api/{feature}.errors.ts
import { isAxiosError, type AxiosError } from 'axios'
import { AppError } from '@/shared/errors'

type ErrorMapping = Record<number, { message: string; code: string }>

export function mapApiError(error: unknown, mappings: ErrorMapping): never {
  if (isAxiosError(error)) {
    const status = error.response?.status ?? 500
    const serverMessage = error.response?.data?.message
    const mapping = mappings[status]

    if (mapping) {
      throw new AppError(serverMessage || mapping.message, mapping.code, status)
    }
    throw new AppError(serverMessage || 'Server error', 'SERVER_ERROR', status)
  }

  if (error instanceof Error && error.message === 'Network Error') {
    throw new AppError('Unable to connect. Please check your connection.', 'NETWORK_ERROR', 0)
  }

  throw new AppError('An unexpected error occurred', 'UNKNOWN_ERROR', 500)
}

// Usage in adapter:
export const locationApi = {
  get: async (id: number) => {
    try {
      const response = await client.get(locationEndpoints.detail(id))
      return mapLocation(response.data)
    } catch (error) {
      mapApiError(error, {
        404: { message: 'Location not found', code: 'LOCATION_NOT_FOUND' },
        403: { message: 'Not authorized to view this location', code: 'FORBIDDEN' },
      })
    }
  },
}
```

## Server Action Error Handling

For Next.js Server Actions (if used in the future):

```typescript
// app/actions/some-action.ts
'use server'

import { AppError } from '@/shared/errors'

type ActionResult<T> = { success: true; data: T } | { success: false; error: string; code: string }

export async function someAction(formData: FormData): Promise<ActionResult<void>> {
  try {
    // ... perform action
    return { success: true, data: undefined }
  } catch (error) {
    if (AppError.isAppError(error)) {
      return { success: false, error: error.message, code: error.code }
    }
    return { success: false, error: 'An unexpected error occurred', code: 'UNKNOWN' }
  }
}
```

**Note:** Server Actions cannot throw errors to the client. Always return a result object.
