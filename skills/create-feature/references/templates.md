# Create Feature — Code Templates

> **Path convention:** `{app}` is the project's new-code root from `.claude/rules/project-structure.md` (some projects use `src/new-app/`, others `src/` directly). Resolve it from the rule before writing any file — never assume.
> **If `project-structure.md` does not exist:** stop and ask the user (AskUserQuestion) to define the structure before scaffolding anything. For a **new project**, propose a sensible default (e.g., `src/features/` with `src/shared/` and `src/ui/`) as the recommended option; for an **existing project**, detect candidate roots from the actual tree (Glob for `features/`, `shared/`, `ui/`) and present them as options. Then offer to save the answer as `.claude/rules/project-structure.md` so no one has to ask again.


Complete code templates for each layer in a feature module, modeled on the shipped `stays` feature.

Replace `{feature}` with the feature name (lowercase) and `{Feature}` with PascalCase.

**Paths:** templates use placeholders — `{features-root}` and `@/{app}/...` come from the project's `.claude/rules/project-structure.md`; resolve them before writing any file. `cn` import path also comes from the project's conventions.

**Conventions are not restated here.** The templates comply with the project rules; when in doubt the rule file wins:

- Error flow, `handleApiError`, `parseResponse`, `AppError` → `.claude/rules/error-handling.md`
- Query keys, invalidation, provider defaults → `.claude/rules/tanstack-query.md`
- Forms (`zodResolver` + `Controller` + `Field`) → `.claude/rules/form-patterns.md`
- Component/hook separation + translate-in-hooks → `.claude/rules/component-hook-separation.md`
- Routes/endpoints → `.claude/rules/centralized-links.md`
- Colors → `.claude/rules/color-usage.md`
- Layout/AppContainer → `.claude/rules/layout-ownership.md`

---

## Step 1: API Layer

### 1.1 Schemas (`api/{feature}.schemas.ts`)

Zod response schemas with `.transform()` for field renaming, type coercion, and defaults. Inferred types are exported from this file — they ARE the domain types.

```tsx
import { z } from 'zod'

// Enums (validated at parse time)
export const {feature}StatusSchema = z.enum(['active', 'inactive', 'pending'])

// Response schema with transforms
export const {feature}ResponseSchema = z
  .object({
    id: z.number(),
    status: {feature}StatusSchema,
    // Use .optional().default() for fields the backend may omit
    name: z.string().optional().default(''),
    // Use .nullable() for fields that can be null
    description: z.string().nullable(),
    // Use .transform() for field renaming or type coercion
    user_id: z.number().nullable().optional().default(null),
    created_at: z.string(),
    updated_at: z.string(),
  })
  .transform(({ user_id, ...rest }) => ({
    ...rest,
    ownerId: user_id, // rename field
  }))

// Request schemas (for form validation — no transforms needed)
export const create{Feature}Schema = z.object({
  status: {feature}StatusSchema.optional().default('pending'),
})

export const update{Feature}Schema = create{Feature}Schema.partial()

// Export inferred types — these ARE the domain types
export type {Feature} = z.infer<typeof {feature}ResponseSchema>
export type {Feature}Status = z.infer<typeof {feature}StatusSchema>
export type Create{Feature}Request = z.infer<typeof create{Feature}Schema>
export type Update{Feature}Request = z.infer<typeof update{Feature}Schema>
```

**Paginated lists** use the backend's `Page<T>` envelope. There is no shared `paginatedResponseSchema` helper — define the envelope in the schema file (pattern from `stays.schemas.ts`):

```tsx
// Page<T> envelope — mirrors the backend `buildPage` shape.
const pageSchema = <T extends z.ZodTypeAny>(item: T) =>
  z
    .object({
      count: z.number(),
      hasMore: z.boolean().optional(),
      page: z.number().optional(),
      limit: z.number().optional(),
      results: z.array(item),
    })
    .passthrough()

export const {feature}sListResponseSchema = pageSchema({feature}ResponseSchema)
export type {Feature}sPage = z.infer<typeof {feature}sListResponseSchema>
```

> Raw API types + separate mapper files are NOT needed — the schema's `.transform()` handles validation and mapping in one step via `parseResponse()`.

> **Never trust legacy types.** Validate the schema against a real API response before writing it down.

### 1.2 API Adapter (`api/{feature}.api.ts`)

Endpoint paths in a centralized `const` object; `.catch((error) => handleApiError(error, [...]))` + `parseResponse` — never try/catch (see `error-handling.md`).

```tsx
import { client, handleApiError, parseResponse } from '@/{app}/shared/api'
import { buildUrl } from '@/{app}/shared/links'
import {
  {feature}ResponseSchema,
  {feature}sListResponseSchema,
} from './{feature}.schemas'
import type {
  {Feature},
  {Feature}sPage,
  Create{Feature}Request,
  Update{Feature}Request,
} from './{feature}.schemas'

const {feature}Endpoints = {
  list: '/{feature}s',
  detail: (id: number) => `/{feature}s/${id}`,
} as const

export const {feature}Api = {
  list: async (params: { page?: number; limit?: number }): Promise<{Feature}sPage> => {
    const response = await client
      .get(
        buildUrl({feature}Endpoints.list, {
          page: params.page != null ? String(params.page) : undefined,
          limit: params.limit != null ? String(params.limit) : undefined,
        })
      )
      .catch((error) => handleApiError(error, []))
    return parseResponse({feature}sListResponseSchema, response.data)
  },

  getById: async (id: number): Promise<{Feature}> => {
    const response = await client
      .get({feature}Endpoints.detail(id))
      .catch((error) =>
        handleApiError(error, [
          { status: 404, code: '{FEATURE}_NOT_FOUND', message: '{Feature} not found' },
        ])
      )
    return parseResponse({feature}ResponseSchema, response.data)
  },

  create: async (data: Create{Feature}Request): Promise<{Feature}> => {
    const response = await client
      .post({feature}Endpoints.list, data)
      .catch((error) => handleApiError(error, []))
    return parseResponse({feature}ResponseSchema, response.data)
  },

  update: async (id: number, data: Update{Feature}Request): Promise<{Feature}> => {
    const response = await client
      .patch({feature}Endpoints.detail(id), data)
      .catch((error) => handleApiError(error, []))
    return parseResponse({feature}ResponseSchema, response.data)
  },

  delete: async (id: number): Promise<void> => {
    await client
      .delete({feature}Endpoints.detail(id))
      .catch((error) => handleApiError(error, []))
  },
}
```

---

## Step 2: Domain Layer

### 2.1 Domain Types (`domain/{feature}.types.ts`)

Re-export types inferred from the Zod response schemas.

```tsx
export type {
  {Feature},
  {Feature}Status,
  {Feature}sPage,
} from '../api/{feature}.schemas'
```

### 2.2 Domain Service (`domain/{feature}.service.ts`)

Pure functions only — no side effects, no imports from React or the API layer. Status colors use semantic tokens only (see `color-usage.md`).

```tsx
import type { {Feature}, {Feature}Status } from './{feature}.types'

export const getStatusColor = (status: {Feature}Status): string =>
  ({
    active: 'text-state-success bg-state-success/10',
    inactive: 'text-muted-foreground bg-muted',
    pending: 'text-state-warning bg-state-warning/10',
  })[status]

export const canEdit = ({feature}: {Feature}): boolean =>
  {feature}.status !== 'inactive'

export const canDelete = ({feature}: {Feature}): boolean =>
  {feature}.status === 'pending'
```

> Status **labels** are user-facing strings — they come from i18n via the hook (`t('{feature}.status.active')`), never from a hardcoded map in the service.

### 2.3 Domain Errors (`domain/{feature}.errors.ts`) — Optional

`AppError` takes a single config object (see `error-handling.md` for when a domain class is warranted).

```tsx
import { AppError } from '@/{app}/shared/errors'

export class {Feature}NotFoundError extends AppError {
  constructor(id: number) {
    super({
      message: '{Feature} not found',
      code: '{FEATURE}_NOT_FOUND',
      status: 404,
      details: { id },
    })
  }
}
```

---

## Step 3: Queries Layer

### 3.1 Query Keys (`queries/{feature}.keys.ts`)

Key structure `[feature, scope, ...params]` — see `tanstack-query.md`. Pattern from `stays/queries/stay.keys.ts`:

```tsx
export const {feature}Keys = {
  all: ['{feature}s'] as const,
  lists: () => ['{feature}s', 'list'] as const,
  list: (params?: { page?: number; limit?: number }) =>
    ['{feature}s', 'list', params] as const,
  details: () => ['{feature}s', 'detail'] as const,
  detail: (id: number) => ['{feature}s', 'detail', id] as const,
} as const
```

> No `queries/{feature}.queries.ts` / `queryOptions` layer — hooks call `useQuery` directly with a key from the factory (this matches the shipped features). Don't override `staleTime`/`gcTime`; the provider sets the defaults.

---

## Step 4: Store Layer (Zustand) — Optional

Only create if the feature needs client-side UI state (filters, selection, dialog open/close). Server data lives in TanStack Query. See `zustand-patterns.md` for effect-dependency rules.

### 4.1 UI Store (`store/{feature}.store.ts`)

```tsx
import { create } from 'zustand'

type {Feature}FilterStatus = 'all' | 'active' | 'inactive' | 'pending'

type {Feature}UIState = {
  selectedIds: number[]
  filterStatus: {Feature}FilterStatus
  isCreateDialogOpen: boolean

  toggleSelection: (id: number) => void
  clearSelection: () => void
  setFilterStatus: (status: {Feature}FilterStatus) => void
  openCreateDialog: () => void
  closeCreateDialog: () => void
}

export const use{Feature}Store = create<{Feature}UIState>((set) => ({
  selectedIds: [],
  filterStatus: 'all',
  isCreateDialogOpen: false,

  toggleSelection: (id) =>
    set((state) => ({
      selectedIds: state.selectedIds.includes(id)
        ? state.selectedIds.filter((i) => i !== id)
        : [...state.selectedIds, id],
    })),
  clearSelection: () => set({ selectedIds: [] }),
  setFilterStatus: (filterStatus) => set({ filterStatus }),
  openCreateDialog: () => set({ isCreateDialogOpen: true }),
  closeCreateDialog: () => set({ isCreateDialogOpen: false }),
}))
```

---

## Step 5: Hooks Layer

Every component gets a co-located hook that owns ALL logic — queries, handlers, and translated strings. Components never see `t` (see `component-hook-separation.md`).

### 5.1 Query Hooks (`hooks/use-{feature}s-query.ts`, `hooks/use-{feature}-query.ts`)

Thin data hooks (pattern from `stays/hooks/use-stay-query.ts`):

```tsx
import { useQuery } from '@tanstack/react-query'
import { {feature}Api } from '../api/{feature}.api'
import { {feature}Keys } from '../queries/{feature}.keys'

export const use{Feature}sQuery = (params: { page?: number; limit?: number } = {}) =>
  useQuery({
    queryKey: {feature}Keys.list(params),
    queryFn: () => {feature}Api.list(params),
  })

export const use{Feature}Query = (id: number) =>
  useQuery({
    queryKey: {feature}Keys.detail(id),
    queryFn: () => {feature}Api.getById(id),
    enabled: Number.isFinite(id),
  })
```

### 5.2 Component Hook (`hooks/use-{feature}-list.ts`)

Composes query hooks + translations into display-ready values with a typed return (pattern from `stays/metered-detail/hooks/use-stay-summary-card.ts`):

```tsx
import { useTranslation } from 'next-i18next'
import { use{Feature}sQuery } from './use-{feature}s-query'
import type { {Feature} } from '../domain/{feature}.types'

export type Use{Feature}ListReturn = {
  {feature}s: {Feature}[]
  isPending: boolean
  isError: boolean
  errorMessage: string
  emptyLabel: string
  retryLabel: string
  refetch: () => void
}

export const use{Feature}List = (): Use{Feature}ListReturn => {
  const { t } = useTranslation('{namespace}')
  const { data, isPending, isError, error, refetch } = use{Feature}sQuery()

  return {
    {feature}s: data?.results ?? [],
    isPending,
    isError,
    errorMessage: error?.message ?? t('{feature}.list.error'),
    emptyLabel: t('{feature}.list.empty'),
    retryLabel: t('{feature}.list.retry'),
    refetch,
  }
}
```

### 5.3 Mutations Hook (`hooks/use-{feature}-mutations.ts`)

`useNotification().showError()` for user-visible errors; invalidation per the table in `tanstack-query.md` (and NOT inside a wizard's `onSuccess` — see that rule's Wizard Flow section).

```tsx
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'next-i18next'
import { useNotification } from '@/{app}/shared/providers'
import { AppError } from '@/{app}/shared/errors'
import { {feature}Api } from '../api/{feature}.api'
import { {feature}Keys } from '../queries/{feature}.keys'

export const useCreate{Feature} = () => {
  const { t } = useTranslation('{namespace}')
  const queryClient = useQueryClient()
  const { showError } = useNotification()

  return useMutation({
    mutationFn: {feature}Api.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: {feature}Keys.lists() })
    },
    onError: (error) => {
      showError(
        AppError.isAppError(error) ? error.message : t('{feature}.errors.createFailed')
      )
    },
  })
}

export const useUpdate{Feature} = () => {
  const { t } = useTranslation('{namespace}')
  const queryClient = useQueryClient()
  const { showError } = useNotification()

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Parameters<typeof {feature}Api.update>[1] }) =>
      {feature}Api.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: {feature}Keys.detail(id) })
      queryClient.invalidateQueries({ queryKey: {feature}Keys.lists() })
    },
    onError: (error) => {
      showError(
        AppError.isAppError(error) ? error.message : t('{feature}.errors.updateFailed')
      )
    },
  })
}

export const useDelete{Feature} = () => {
  const { t } = useTranslation('{namespace}')
  const queryClient = useQueryClient()
  const { showError } = useNotification()

  return useMutation({
    mutationFn: {feature}Api.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: {feature}Keys.lists() })
    },
    onError: (error) => {
      showError(
        AppError.isAppError(error) ? error.message : t('{feature}.errors.deleteFailed')
      )
    },
  })
}
```

### 5.4 Form Hook (`hooks/use-{feature}-form.ts`)

Form conventions live in `form-patterns.md`; error-code switching in `error-handling.md`. Pages Router: `useRouter` from `next/router`, routes from the `links` object.

```tsx
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/router'
import { useTranslation } from 'next-i18next'
import { useQueryClient } from '@tanstack/react-query'
import { useNotification } from '@/{app}/shared/providers'
import { AppError } from '@/{app}/shared/errors'
import { tryCatch } from '@/{app}/shared/utils'
import { links } from '@/{app}/shared/links'
import { {feature}Api } from '../api/{feature}.api'
import { {feature}Keys } from '../queries/{feature}.keys'
import { create{Feature}Schema, type Create{Feature}Request } from '../api/{feature}.schemas'

export type Use{Feature}FormReturn = {
  form: ReturnType<typeof useForm<Create{Feature}Request>>
  onSubmit: () => void
  isSubmitting: boolean
  labels: {
    fieldName: string
    fieldPlaceholder: string
    submit: string
  }
}

export const useCreate{Feature}Form = (): Use{Feature}FormReturn => {
  const { t } = useTranslation('{namespace}')
  const router = useRouter()
  const queryClient = useQueryClient()
  const { showError } = useNotification()

  const form = useForm<Create{Feature}Request>({
    resolver: zodResolver(create{Feature}Schema),
    defaultValues: {
      // sensible defaults for each field
    },
  })

  const onSubmit = form.handleSubmit(async (values) => {
    const { error } = await tryCatch({feature}Api.create(values))
    if (error) {
      showError(
        AppError.isAppError(error) ? error.message : t('{feature}.errors.createFailed')
      )
      return
    }
    await queryClient.invalidateQueries({ queryKey: {feature}Keys.lists() })
    await router.push(links.private.{feature}s)
  })

  return {
    form,
    onSubmit,
    isSubmitting: form.formState.isSubmitting,
    labels: {
      fieldName: t('{feature}.form.fields.name'),
      fieldPlaceholder: t('{feature}.form.fields.namePlaceholder'),
      submit: t('{feature}.form.submit'),
    },
  }
}
```

---

## Step 6: Components Layer

Pure renderers — zero hook calls except the component's own hook; all strings arrive translated; root elements render flush (no external spacing — see `layout-ownership.md`).

### 6.1 Card Component (`components/{feature}-card.tsx`)

```tsx
import { cn } from '@/utils/clsxm'
import type { {Feature} } from '../domain/{feature}.types'
import { getStatusColor, canEdit } from '../domain/{feature}.service'

type {Feature}CardProps = {
  {feature}: {Feature}
  statusLabel: string
  editLabel: string
  onEdit?: (id: number) => void
}

export const {Feature}Card = ({ {feature}, statusLabel, editLabel, onEdit }: {Feature}CardProps) => {
  return (
    <div className="rounded-lg border border-border p-4">
      <div className="flex items-center justify-between">
        <span className="font-medium">#{{{feature}.id}}</span>
        <span
          className={cn(
            'rounded px-2 py-1 text-sm',
            getStatusColor({feature}.status)
          )}
        >
          {statusLabel}
        </span>
      </div>
      {canEdit({feature}) && onEdit && (
        <button type="button" onClick={() => onEdit({feature}.id)}>
          {editLabel}
        </button>
      )}
    </div>
  )
}
```

### 6.2 List Component (`components/{feature}-list.tsx`)

Self-contained: fetches its own data via its hook; the parent only positions it.

```tsx
import { Skeleton } from '@/{app}/ui/skeleton'
import { use{Feature}List } from '../hooks/use-{feature}-list'
import { {Feature}Card } from './{feature}-card'

export const {Feature}List = () => {
  const {
    {feature}s,
    isPending,
    isError,
    errorMessage,
    emptyLabel,
    retryLabel,
    refetch,
    // status/edit labels also come from the hook
  } = use{Feature}List()

  if (isPending) return <Skeleton className="h-48" />

  if (isError) {
    return (
      <div className="text-destructive">
        <p>{errorMessage}</p>
        <button type="button" onClick={() => refetch()}>
          {retryLabel}
        </button>
      </div>
    )
  }

  if ({feature}s.length === 0) {
    return <p className="text-muted-foreground">{emptyLabel}</p>
  }

  return (
    <div className="flex flex-col gap-4">
      {{feature}s.map(({feature}) => (
        <{Feature}Card key={{feature}.id} {feature}={{feature}} /* labels from hook */ />
      ))}
    </div>
  )
}
```

### 6.3 Form Component (`components/{feature}-form.tsx`)

`Controller` + `Field`/`FieldLabel`/`FieldError` — full pattern in `form-patterns.md`.

```tsx
import { Controller } from 'react-hook-form'
import { Button } from '@/{app}/ui/button'
import { Input } from '@/{app}/ui/input'
import { Field, FieldLabel, FieldError, FieldGroup } from '@/{app}/ui/field'
import { useCreate{Feature}Form } from '../hooks/use-{feature}-form'

export const {Feature}Form = () => {
  const { form, onSubmit, isSubmitting, labels } = useCreate{Feature}Form()

  return (
    <form onSubmit={onSubmit}>
      <FieldGroup>
        <Controller
          name="name"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="{feature}-name">{labels.fieldName}</FieldLabel>
              <Input
                {...field}
                id="{feature}-name"
                placeholder={labels.fieldPlaceholder}
                disabled={isSubmitting}
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {labels.submit}
        </Button>
      </FieldGroup>
    </form>
  )
}
```

### 6.4 Page Compositor (`pages/{feature}s-page.tsx` in the feature)

Every page wraps its content in `AppContainer` and owns inter-component spacing (pattern from `stays/metered-detail/pages/stay-detail-page.tsx`):

```tsx
import { AppContainer } from '@/{app}/ui/custom/app-container'
import { TruckerNavbar } from '@/{app}/ui/custom/navbar'
import { {Feature}List } from '../components/{feature}-list'

export const {Feature}sPage = () => {
  return (
    <AppContainer navbar={<TruckerNavbar />}>
      <div className="px-4 pt-3">
        <{Feature}List />
      </div>
    </AppContainer>
  )
}
```

The Next.js route file in `src/pages/` stays a thin re-export that renders this compositor.

---

## Step 7: Public Exports (`index.ts`)

```tsx
// Components
export { {Feature}List } from './components/{feature}-list'
export { {Feature}Card } from './components/{feature}-card'
export { {Feature}Form } from './components/{feature}-form'

// Hooks
export { use{Feature}List } from './hooks/use-{feature}-list'
export { use{Feature}Query, use{Feature}sQuery } from './hooks/use-{feature}s-query'
export { useCreate{Feature}, useUpdate{Feature}, useDelete{Feature} } from './hooks/use-{feature}-mutations'

// Store (only if created)
// export { use{Feature}Store } from './store/{feature}.store'

// Types
export type { {Feature}, {Feature}Status, {Feature}sPage } from './domain/{feature}.types'

// Domain services (if needed externally)
export { getStatusColor, canEdit, canDelete } from './domain/{feature}.service'
```

---

## Step 8: i18n Translation Files

Translations live in `public/locales/{locale}/{namespace}.json` — one namespace file per locale, NOT inside the feature directory. Create both `public/locales/en/{namespace}.json` and `public/locales/es/{namespace}.json`.

**Important:** next-i18next uses nested JSON objects, not flat dot-notation keys.

```json
// ✅ Correct — nested objects (public/locales/en/{namespace}.json)
{
  "{feature}": {
    "list": {
      "empty": "Nothing here yet",
      "error": "Something went wrong",
      "retry": "Retry"
    },
    "status": {
      "active": "Active",
      "inactive": "Inactive",
      "pending": "Pending"
    },
    "form": {
      "submit": "Create",
      "fields": {
        "name": "Name",
        "namePlaceholder": "Enter name"
      }
    },
    "errors": {
      "createFailed": "Failed to create",
      "updateFailed": "Failed to update",
      "deleteFailed": "Failed to delete"
    }
  }
}

// ❌ Wrong — flat dot-notation keys (next-i18next won't resolve these)
{
  "{feature}.list.empty": "Nothing here yet"
}
```

Generate only keys the feature actually uses — don't create keys speculatively. Register the namespace in the page's `serverSideTranslations` call.

---

## Step 9: MSW Handlers (for tests)

Mock the same shapes the schemas expect — list endpoints return the `Page<T>` envelope. Co-locate with the feature's `testing/` utilities (see `testing.md` and `frontend-testing`).

```tsx
import { http, HttpResponse } from 'msw'

export const {feature}Handlers = [
  http.get('*/{feature}s', () => {
    return HttpResponse.json({
      count: 1,
      hasMore: false,
      page: 1,
      limit: 10,
      results: [/* mock {feature} objects matching the RAW API shape (pre-transform) */],
    })
  }),

  http.get('*/{feature}s/:id', ({ params }) => {
    return HttpResponse.json({
      id: Number(params.id),
      // ... raw API shape
    })
  }),

  http.post('*/{feature}s', async ({ request }) => {
    const body = await request.json()
    return HttpResponse.json({ id: 1, ...body }, { status: 201 })
  }),

  http.patch('*/{feature}s/:id', async ({ params, request }) => {
    const body = await request.json()
    return HttpResponse.json({ id: Number(params.id), ...body })
  }),

  http.delete('*/{feature}s/:id', () => {
    return new HttpResponse(null, { status: 204 })
  }),
]
```
