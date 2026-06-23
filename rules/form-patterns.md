---
description: Enforce standard form patterns — react-hook-form + Zod + Controller + Field components
globs: "**/*.{ts,tsx}"
alwaysApply: false
---

# Form Patterns

> **Scope:** These patterns apply to new code in `src/`. Legacy code in `src/components/` follows existing conventions.

All forms use `react-hook-form` + `zodResolver` + `Controller` + custom `Field` components. Never use the deprecated `<Form>` / `<FormField>` wrappers.

## Hard Rules

1. **Always use `zodResolver`** with a Zod schema for validation.
2. **Always use `Controller`** to bind fields — never `register()`.
3. **Always use `Field` / `FieldLabel` / `FieldError`** from `@/ui/field` — never build inline error display.
4. **Form schemas live in hooks** (with user-facing messages) or in `api/{feature}.schemas.ts` (for API request/response validation). Do not mix the two.
5. **Infer types** with `z.infer<typeof schema>` — never hand-write form value types.
6. **Always provide `defaultValues`** in `useForm`.
7. **Wrap submit** with `form.handleSubmit()` — never call `mutate()` outside it.

## Standard Form Hook

```typescript
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import { useError } from '@/shared/providers'

const mySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.email('Please enter a valid email'),
})

type MyFormValues = z.infer<typeof mySchema>

export function useMyForm() {
  const { showError } = useError()

  const form = useForm<MyFormValues>({
    resolver: zodResolver(mySchema),
    defaultValues: { name: '', email: '' },
  })

  const mutation = useMutation({
    mutationFn: myApi.create,
    onError: (error) => {
      if (AppError.isAppError(error)) {
        showError(error.message)
        return
      }
      showError('Something went wrong')
    },
  })

  const onSubmit = form.handleSubmit((data) => {
    mutation.mutate(data)
  })

  return {
    form,
    onSubmit,
    isSubmitting: mutation.isPending,
    isDisabled: mutation.isPending,
  }
}
```

## Standard Field Pattern

```tsx
import { Controller } from 'react-hook-form'
import { Field, FieldLabel, FieldError, FieldGroup } from '@/ui/field'
import { Input } from '@/ui/input'

<FieldGroup>
  <Controller
    name="email"
    control={form.control}
    render={({ field, fieldState }) => (
      <Field data-invalid={fieldState.invalid}>
        <FieldLabel htmlFor="my-email">Email</FieldLabel>
        <Input
          {...field}
          id="my-email"
          type="email"
          placeholder="Enter your email"
          disabled={isDisabled}
          aria-invalid={fieldState.invalid}
        />
        {fieldState.invalid && (
          <FieldError errors={[fieldState.error]} />
        )}
      </Field>
    )}
  />
</FieldGroup>
```

## Anti-Patterns

```tsx
// ❌ register() instead of Controller
<Input {...form.register('email')} />

// ❌ Deprecated Form/FormField
<Form {...form}>
  <FormField name="email" render={...} />
</Form>

// ❌ Inline error display
{form.formState.errors.email && <p className="text-red-500">...</p>}

// ❌ Hand-written form types
type MyForm = { email: string; name: string }

// ❌ Missing defaultValues
useForm<MyFormValues>({ resolver: zodResolver(schema) })
```

## Related

- [Field component source](mdc:ui/field.tsx)
- [Auth form example](mdc:features/auth/components/sign-in-form.tsx)
- [Auth hook example](mdc:features/auth/hooks/use-sign-in.ts)
- Error handling: see `error-handling` skill in `.cursor/skills/error-handling/`
