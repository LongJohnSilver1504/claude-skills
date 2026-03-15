# Create Feature — Code Templates

Complete code templates for each layer in a feature module.
Replace `{feature}` with the feature name (lowercase) and `{Feature}` with PascalCase.

---

## Step 1: Domain Layer

### 1.1 Domain Types (`domain/{feature}.types.ts`)

Pure TypeScript types with NO external dependencies.

```tsx
/**
 * {Feature} domain types
 * Pure TypeScript types with no external dependencies
 */

export type {Feature}Status = 'active' | 'inactive' | 'pending'

export type {Feature} = {
  id: number
  // Add fields based on user requirements
  status: {Feature}Status
  createdAt: Date
  updatedAt: Date
}

export type Paginated{Feature}s = {
  results: {Feature}[]
  count: number
  page: number
  limit: number
  hasMore: boolean
}
```

### 1.2 Domain Service (`domain/{feature}.service.ts`)

Pure functions only — no side effects, no imports from React or API.

```tsx
import type { {Feature}, {Feature}Status } from './{feature}.types'

export const getStatusLabel = (status: {Feature}Status): string => ({
  active: 'Active',
  inactive: 'Inactive',
  pending: 'Pending',
})[status]

export const getStatusColor = (status: {Feature}Status): string => ({
  active: 'text-green-600 bg-green-50',
  inactive: 'text-gray-600 bg-gray-50',
  pending: 'text-yellow-600 bg-yellow-50',
})[status]

export const canEdit = ({feature}: {Feature}): boolean =>
  {feature}.status !== 'inactive'

export const canDelete = ({feature}: {Feature}): boolean =>
  {feature}.status === 'pending'
```

### 1.3 Domain Errors (`domain/{feature}.errors.ts`) — Optional

```tsx
import { AppError } from '@/shared/errors'

export class {Feature}NotFoundError extends AppError {
  constructor(id: number) {
    super(`{Feature} #${id} not found`, '{FEATURE}_NOT_FOUND', 404)
  }
}

export class {Feature}ValidationError extends AppError {
  constructor(message: string) {
    super(message, '{FEATURE}_VALIDATION_ERROR', 422)
  }
}
```

---

## Step 2: API Layer

### 2.1 Schemas (`api/{feature}.schemas.ts`)

Zod schemas for trust boundary validation. Request and response schemas live here.

```tsx
import { z } from 'zod'

/**
 * {Feature} API validation schemas
 * Trust boundary validation for external data
 */

// Enums
export const {feature}StatusSchema = z.enum(['active', 'inactive', 'pending'])

// Response schemas
export const {feature}Schema = z.object({
  id: z.number(),
  // Add fields matching API response
  status: {feature}StatusSchema,
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
})

export const paginated{Feature}sSchema = z.object({
  results: z.array({feature}Schema),
  count: z.number(),
  page: z.number(),
  limit: z.number(),
  has_more: z.boolean(),
})

// Request schemas (for form validation)
export const create{Feature}Schema = z.object({
  // Define create request fields
  status: {feature}StatusSchema.optional().default('pending'),
})

export const update{Feature}Schema = create{Feature}Schema.partial()

// Inferred types for requests (used by hooks)
export type Create{Feature}Request = z.infer<typeof create{Feature}Schema>
export type Update{Feature}Request = z.infer<typeof update{Feature}Schema>
```

### 2.2 Raw Types (`api/{feature}.types.ts`)

Types matching the exact API response structure (may use snake_case).

```tsx
/**
 * Raw API response types
 * Match the backend response structure exactly
 */

export type Raw{Feature}Response = {
  id: number
  // Match API response structure exactly
  created_at: string
  updated_at: string
}

export type RawPaginated{Feature}sResponse = {
  results: Raw{Feature}Response[]
  count: number
  page: number
  limit: number
  has_more: boolean
}
```

### 2.3 Mapper (`api/{feature}.mapper.ts`)

Transform raw API responses to domain types with Zod validation.

```tsx
import { {feature}Schema, paginated{Feature}sSchema } from './{feature}.schemas'
import type { Raw{Feature}Response, RawPaginated{Feature}sResponse } from './{feature}.types'
import type { {Feature}, Paginated{Feature}s } from '../domain/{feature}.types'
import { AppError } from '@/shared/errors'

export const mapTo{Feature} = (raw: Raw{Feature}Response): {Feature} => {
  const result = {feature}Schema.safeParse(raw)

  if (!result.success) {
    console.error('{Feature} mapping failed:', result.error.format())
    throw new AppError('Invalid {feature} data from API', 'INVALID_DATA', 500)
  }

  return {
    id: result.data.id,
    status: result.data.status,
    createdAt: result.data.created_at,
    updatedAt: result.data.updated_at,
  }
}

export const mapToPaginated{Feature}s = (raw: RawPaginated{Feature}sResponse): Paginated{Feature}s => {
  return {
    results: raw.results.map(mapTo{Feature}),
    count: raw.count,
    page: raw.page,
    limit: raw.limit,
    hasMore: raw.has_more,
  }
}
```

### 2.4 API Adapter (`api/{feature}.api.ts`)

> **Rule:** All endpoint paths in a centralized constant object. See [centralized-links.mdc](mdc:.cursor/rules/centralized-links.mdc).

```tsx
import { client, isAxiosError } from '@/shared/api'
import { mapToPaginated{Feature}s, mapTo{Feature} } from './{feature}.mapper'
import type { {Feature}, Paginated{Feature}s } from '../domain/{feature}.types'
import type { Create{Feature}Request, Update{Feature}Request } from './{feature}.schemas'
import { {Feature}NotFoundError } from '../domain/{feature}.errors'
import { AppError } from '@/shared/errors'

const {feature}Endpoints = {
  list: '/{feature}s',
  detail: (id: number) => `/{feature}s/${id}`,
} as const

type GetAllParams = {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export const {feature}Api = {
  getAll: async (params: GetAllParams): Promise<Paginated{Feature}s> => {
    const response = await client.get({feature}Endpoints.list, { params })
    return mapToPaginated{Feature}s(response.data)
  },

  getById: async (id: number): Promise<{Feature}> => {
    try {
      const response = await client.get({feature}Endpoints.detail(id))
      return mapTo{Feature}(response.data)
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 404) {
        throw new {Feature}NotFoundError(id)
      }
      throw error
    }
  },

  create: async (data: Create{Feature}Request): Promise<{Feature}> => {
    const response = await client.post({feature}Endpoints.list, data)
    return mapTo{Feature}(response.data)
  },

  update: async (id: number, data: Update{Feature}Request): Promise<{Feature}> => {
    const response = await client.patch({feature}Endpoints.detail(id), data)
    return mapTo{Feature}(response.data)
  },

  delete: async (id: number): Promise<void> => {
    await client.delete({feature}Endpoints.detail(id))
  },
}
```

---

## Step 3: Queries Layer

### 3.1 Query Keys (`queries/{feature}.keys.ts`)

```tsx
export const {feature}Keys = {
  all: ['{feature}s'] as const,
  lists: () => [...{feature}Keys.all, 'list'] as const,
  list: (params?: object) =>
    [...{feature}Keys.lists(), params] as const,
  details: () => [...{feature}Keys.all, 'detail'] as const,
  detail: (id: number) => [...{feature}Keys.details(), id] as const,
}
```

### 3.2 Query Options (`queries/{feature}.queries.ts`)

```tsx
import { queryOptions } from '@tanstack/react-query'
import { {feature}Api } from '../api/{feature}.api'
import { {feature}Keys } from './{feature}.keys'

type {Feature}sQueryParams = {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export const {feature}sQueryOptions = (params: {Feature}sQueryParams) =>
  queryOptions({
    queryKey: {feature}Keys.list(params),
    queryFn: () => {feature}Api.getAll(params),
    staleTime: 5 * 60 * 1000,
  })

export const {feature}QueryOptions = (id: number) =>
  queryOptions({
    queryKey: {feature}Keys.detail(id),
    queryFn: () => {feature}Api.getById(id),
  })
```

---

## Step 4: Store Layer (Zustand) — Optional

Only create if the feature needs client-side UI state (filters, selection, modals).

### 4.1 UI Store (`store/{feature}.store.ts`)

```tsx
import { create } from 'zustand'

type {Feature}FilterStatus = 'all' | 'active' | 'inactive' | 'pending'

type {Feature}UIState = {
  selectedIds: number[]
  filterStatus: {Feature}FilterStatus
  searchQuery: string
  isCreateModalOpen: boolean
  isEditModalOpen: boolean
  editingId: number | null

  toggleSelection: (id: number) => void
  selectAll: (ids: number[]) => void
  clearSelection: () => void
  setFilterStatus: (status: {Feature}FilterStatus) => void
  setSearchQuery: (query: string) => void
  clearFilters: () => void
  openCreateModal: () => void
  closeCreateModal: () => void
  openEditModal: (id: number) => void
  closeEditModal: () => void
}

export const use{Feature}Store = create<{Feature}UIState>((set) => ({
  selectedIds: [],
  filterStatus: 'all',
  searchQuery: '',
  isCreateModalOpen: false,
  isEditModalOpen: false,
  editingId: null,

  toggleSelection: (id) =>
    set((state) => ({
      selectedIds: state.selectedIds.includes(id)
        ? state.selectedIds.filter((i) => i !== id)
        : [...state.selectedIds, id],
    })),
  selectAll: (ids) => set({ selectedIds: ids }),
  clearSelection: () => set({ selectedIds: [] }),
  setFilterStatus: (filterStatus) => set({ filterStatus }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  clearFilters: () => set({ filterStatus: 'all', searchQuery: '' }),
  openCreateModal: () => set({ isCreateModalOpen: true }),
  closeCreateModal: () => set({ isCreateModalOpen: false }),
  openEditModal: (id) => set({ isEditModalOpen: true, editingId: id }),
  closeEditModal: () => set({ isEditModalOpen: false, editingId: null }),
}))
```

---

## Step 5: Hooks Layer

### 5.1 List Hook (`hooks/use-{feature}s.ts`)

Includes translations alongside data fetching — all logic in one hook.

```tsx
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'next-i18next'
import { {feature}sQueryOptions } from '../queries/{feature}.queries'

type Use{Feature}sParams = {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export const use{Feature}s = (params: Use{Feature}sParams) => {
  const { t } = useTranslation('{namespace}')
  const query = useQuery({feature}sQueryOptions(params))

  const translations = {
    title: t('{feature}.list.title'),
    empty: t('{feature}.list.empty'),
    retry: t('{feature}.list.retry'),
    loading: t('{feature}.list.loading'),
  }

  return {
    ...query,
    translations,
  }
}
```

### 5.2 Detail Hook (`hooks/use-{feature}.ts`)

Includes translations alongside data fetching.

```tsx
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'next-i18next'
import { {feature}QueryOptions } from '../queries/{feature}.queries'

export const use{Feature} = (id: number) => {
  const { t } = useTranslation('{namespace}')
  const query = useQuery({feature}QueryOptions(id))

  const translations = {
    title: t('{feature}.detail.title'),
    notFound: t('{feature}.detail.notFound'),
    loading: t('{feature}.detail.loading'),
  }

  return {
    ...query,
    translations,
  }
}
```

### 5.3 Mutations Hook (`hooks/use-{feature}-mutations.ts`)

```tsx
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useError } from '@/shared/providers'
import { {feature}Api } from '../api/{feature}.api'
import { {feature}Keys } from '../queries/{feature}.keys'
import { AppError } from '@/shared/errors'

export const useCreate{Feature} = () => {
  const queryClient = useQueryClient()
  const { showError } = useError()

  return useMutation({
    mutationFn: {feature}Api.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: {feature}Keys.all })
    },
    onError: (error) => {
      const message = AppError.isAppError(error) ? error.message : 'Failed to create {feature}'
      showError(message)
    },
  })
}

export const useUpdate{Feature} = () => {
  const queryClient = useQueryClient()
  const { showError } = useError()

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Parameters<typeof {feature}Api.update>[1] }) =>
      {feature}Api.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: {feature}Keys.detail(id) })
      queryClient.invalidateQueries({ queryKey: {feature}Keys.lists() })
    },
    onError: (error) => {
      const message = AppError.isAppError(error) ? error.message : 'Failed to update {feature}'
      showError(message)
    },
  })
}

export const useDelete{Feature} = () => {
  const queryClient = useQueryClient()
  const { showError } = useError()

  return useMutation({
    mutationFn: {feature}Api.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: {feature}Keys.all })
    },
    onError: (error) => {
      const message = AppError.isAppError(error) ? error.message : 'Failed to delete {feature}'
      showError(message)
    },
  })
}
```

### 5.4 Form Hook (`hooks/use-{feature}-form.ts`)

Modeled after `features/auth/hooks/use-sign-in.ts`. Encapsulates form state, validation, API call, error handling, and navigation.

```tsx
'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useError } from '@/shared/providers'
import { {feature}Api } from '../api/{feature}.api'
import { {feature}Keys } from '../queries/{feature}.keys'
import { create{Feature}Schema, type Create{Feature}Request } from '../api/{feature}.schemas'
import { tryCatch } from '@/shared/utils'
import { AppError } from '@/shared/errors'
import { links } from '@/shared/links'

export const useCreate{Feature}Form = () => {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { showError } = useError()

  const form = useForm<Create{Feature}Request>({
    resolver: zodResolver(create{Feature}Schema),
    defaultValues: {
      // Set sensible defaults for each field
    },
  })

  const mutation = useMutation({
    mutationFn: async (data: Create{Feature}Request) => {
      const { data: result, error } = await tryCatch(
        {feature}Api.create(data)
      )

      if (error) {
        throw error
      }

      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: {feature}Keys.all })
      // Navigate to list or detail page
      // router.push(links.private.{feature}s)
    },
    onError: (error: unknown) => {
      if (AppError.isAppError(error)) {
        switch (error.code) {
          case 'VALIDATION_ERROR':
            showError(error.message)
            break
          case 'SERVER_ERROR':
            showError('Server error. Please try again later.')
            break
          case 'NETWORK_ERROR':
            showError('Unable to connect. Please check your connection.')
            break
          default:
            showError('Something went wrong. Please try again.')
        }
      } else if (error instanceof Error) {
        showError(error.message)
      } else {
        showError('Something went wrong. Please try again.')
      }
    },
  })

  const onSubmit = form.handleSubmit((data) => {
    mutation.mutate(data)
  })

  return {
    form,
    isSubmitting: mutation.isPending,
    isDisabled: mutation.isPending,
    onSubmit,
  }
}
```

### 5.5 Layout Hook (`hooks/use-{feature}-layout.ts`) — Optional

If the feature has a layout shell component, create a hook that encapsulates all layout logic (translations, navigation, handlers).

```tsx
import { useTranslation } from 'next-i18next'
import { useRouter } from 'next/router'

export const use{Feature}Layout = () => {
  const { t } = useTranslation('{namespace}')
  const router = useRouter()

  const translations = {
    headerTitle: t('{feature}.headerTitle'),
    backButton: t('{feature}.backButton'),
  }

  const handleBack = () => {
    router.back()
  }

  return {
    translations,
    handleBack,
  }
}
```

**Usage in layout component:**

```tsx
// components/{feature}-layout.tsx
import { use{Feature}Layout } from '../hooks/use-{feature}-layout'

export const {Feature}Layout = ({ children }: { children: ReactNode }) => {
  const { translations, handleBack } = use{Feature}Layout()

  return (
    <div>
      <BackHeader title={translations.headerTitle} onBack={handleBack} />
      {children}
    </div>
  )
}
```

---

## Step 6: Components Layer

### 6.1 Card Component (`components/{feature}-card.tsx`)

```tsx
import type { {Feature} } from '../domain/{feature}.types'
import { getStatusLabel, getStatusColor, canEdit } from '../domain/{feature}.service'

type {Feature}CardProps = {
  {feature}: {Feature}
  onEdit?: (id: number) => void
}

export const {Feature}Card = ({ {feature}, onEdit }: {Feature}CardProps) => {
  return (
    <div className="p-4 border rounded-lg">
      <div className="flex justify-between items-center">
        <span className="font-medium">#{{{feature}.id}</span>
        <span className={`px-2 py-1 rounded text-sm ${getStatusColor({feature}.status)}`}>
          {getStatusLabel({feature}.status)}
        </span>
      </div>
      {canEdit({feature}) && onEdit && (
        <button onClick={() => onEdit({feature}.id)}>Edit</button>
      )}
    </div>
  )
}
```

### 6.2 List Component (`components/{feature}-list.tsx`)

```tsx
import type { {Feature} } from '../domain/{feature}.types'
import { {Feature}Card } from './{feature}-card'

type {Feature}ListProps = {
  {feature}s: {Feature}[]
  onEdit?: (id: number) => void
}

export const {Feature}List = ({ {feature}s, onEdit }: {Feature}ListProps) => {
  if ({feature}s.length === 0) {
    return <p className="text-muted-foreground">No {feature}s found</p>
  }

  return (
    <div className="space-y-4">
      {{feature}s.map(({feature}) => (
        <{Feature}Card key={{feature}.id} {feature}={{feature}} onEdit={onEdit} />
      ))}
    </div>
  )
}
```

### 6.3 Form Component (`components/{feature}-form.tsx`)

Uses Controller + Field/FieldLabel/FieldError pattern from `@/new-app/ui/field`.

```tsx
'use client'

import { Controller } from 'react-hook-form'
import { Button } from '@/new-app/ui/button'
import { Input } from '@/new-app/ui/input'
import {
  Field,
  FieldLabel,
  FieldError,
  FieldGroup,
} from '@/new-app/ui/field'
import { useCreate{Feature}Form } from '../hooks/use-{feature}-form'

export const {Feature}Form = () => {
  const { form, isDisabled, onSubmit } = useCreate{Feature}Form()

  return (
    <form onSubmit={onSubmit}>
      <FieldGroup>
        <Controller
          name="fieldName"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="{feature}-field-name">Field Label</FieldLabel>
              <Input
                {...field}
                id="{feature}-field-name"
                placeholder="Enter value"
                disabled={isDisabled}
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && (
                <FieldError errors={[fieldState.error]} />
              )}
            </Field>
          )}
        />

        <Button type="submit" className="w-full" loading={isDisabled}>
          Create {Feature}
        </Button>
      </FieldGroup>
    </form>
  )
}
```

### 6.4 Container Component (`components/{feature}s-view.tsx`)

```tsx
'use client'

import { use{Feature}s } from '../hooks/use-{feature}s'
import { {Feature}List } from './{feature}-list'
import { Skeleton } from '@/new-app/ui/skeleton'

type {Feature}sViewProps = {
  // Add required props like locationId if needed
}

export const {Feature}sView = (props: {Feature}sViewProps) => {
  const { data, translations, isLoading, isError, error, refetch } = use{Feature}s({})

  if (isLoading) return <Skeleton className="h-48" />

  if (isError) {
    return (
      <div className="text-destructive">
        <p>{error.message}</p>
        <button onClick={() => refetch()}>{translations.retry}</button>
      </div>
    )
  }

  return <{Feature}List {feature}s={data?.results ?? []} emptyMessage={translations.empty} />
}
```

---

## Step 7: Public Exports (`index.ts`)

```tsx
// Components
export { {Feature}sView } from './components/{feature}s-view'
export { {Feature}List } from './components/{feature}-list'
export { {Feature}Card } from './components/{feature}-card'
export { {Feature}Form } from './components/{feature}-form'

// Hooks
export { use{Feature}s } from './hooks/use-{feature}s'
export { use{Feature} } from './hooks/use-{feature}'
export { useCreate{Feature}, useUpdate{Feature}, useDelete{Feature} } from './hooks/use-{feature}-mutations'
// export { use{Feature}Layout } from './hooks/use-{feature}-layout' // only if feature has a layout

// Store (only if created)
// export { use{Feature}Store } from './store/{feature}.store'

// Types
export type { {Feature}, {Feature}Status, Paginated{Feature}s } from './domain/{feature}.types'

// Domain services (if needed externally)
export { getStatusLabel, getStatusColor, canEdit, canDelete } from './domain/{feature}.service'
```

---

## Step 8: MSW Handlers (for tests)

Add handlers for testing. Place in your test setup directory.

```tsx
import { http, HttpResponse } from 'msw'

export const {feature}Handlers = [
  http.get('*/{feature}s', () => {
    return HttpResponse.json({
      results: [/* mock data */],
      count: 1,
      page: 1,
      limit: 10,
      has_more: false,
    })
  }),

  http.get('*/{feature}s/:id', ({ params }) => {
    return HttpResponse.json({
      id: Number(params.id),
      // ... mock data
    })
  }),

  http.post('*/{feature}s', async ({ request }) => {
    const body = await request.json()
    return HttpResponse.json({
      id: 1,
      ...body,
    }, { status: 201 })
  }),

  http.patch('*/{feature}s/:id', async ({ params, request }) => {
    const body = await request.json()
    return HttpResponse.json({
      id: Number(params.id),
      ...body,
    })
  }),

  http.delete('*/{feature}s/:id', () => {
    return new HttpResponse(null, { status: 204 })
  }),
]
```

---
