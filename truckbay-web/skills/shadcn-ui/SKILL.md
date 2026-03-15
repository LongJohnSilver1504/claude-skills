---
name: shadcn-ui
description: Project-specific shadcn/ui patterns for TruckBays. Covers form conventions, import paths, post-install fixes, and project rules. For component API/props/variants, use the shadcn MCP server instead.
---

# shadcn/ui — TruckBays Project Patterns

For component catalog, props, variants, and installation examples, **use the shadcn MCP server** (connected as `shadcn`). This skill covers project-specific rules only.

## Project Setup

| Setting | Value |
|---------|-------|
| React | **18.x** (`forwardRef` still required for ref forwarding) |
| Tailwind | **v4** (PostCSS, `@theme` directive, OKLCH colors) |
| Animation | `tw-animate-css` (NOT `tailwindcss-animate`) |
| Component path | `@/new-app/ui/` |
| Custom components | `@/new-app/ui/custom/` |
| Utility function | `cn` from `@/utils/clsxm` |
| Icon library | `lucide-react` |
| Style | `new-york` |

## Installing New Components

```bash
pnpm dlx shadcn@latest add <component-name>
```

**Post-install fix (REQUIRED):** The shadcn CLI generates imports with `from "src/lib/utils"` instead of the configured alias. Always run after every `shadcn add`:

```bash
grep -rl 'from "src/lib/utils"' src/new-app/ui/ | xargs sed -i '' 's|from "src/lib/utils"|from "@/utils/clsxm"|g'
```

## Import Path Rules

All imports use `@/new-app/ui/`, never the legacy `@/components/ui/` path.

```tsx
// ✅ Correct
import { Button } from '@/new-app/ui/button'
import { Card, CardContent } from '@/new-app/ui/card'
import { Field, FieldLabel, FieldError } from '@/new-app/ui/field'
import { BackButton } from '@/new-app/ui/custom/back-button'

// ❌ Wrong — legacy path
import { Button } from '@/components/ui/button'
```

## Form Pattern (Project Standard)

Use `Controller` from `react-hook-form` with `Field` components. **Never use the deprecated `<Form>` / `<FormField>` wrappers** even though `form.tsx` exists.

```tsx
import { Controller } from 'react-hook-form'
import { Button } from '@/new-app/ui/button'
import { Input } from '@/new-app/ui/input'
import {
  Field,
  FieldLabel,
  FieldError,
  FieldGroup,
} from '@/new-app/ui/field'

export const MyForm = () => {
  const { form, isDisabled, onSubmit } = useMyFormHook()

  return (
    <form onSubmit={onSubmit}>
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

        <Button type="submit" className="w-full" loading={isDisabled}>
          Submit
        </Button>
      </FieldGroup>
    </form>
  )
}
```

### Field Component API

| Component | Purpose |
|-----------|---------|
| `Field` | Wrapper, accepts `data-invalid` for error styling |
| `FieldLabel` | Label with proper accessibility |
| `FieldError` | Displays validation errors, accepts `errors` array |
| `FieldGroup` | Groups multiple fields with consistent spacing |
| `FieldSet` | Fieldset wrapper for logical grouping |
| `FieldDescription` | Help text below a field |
| `FieldContent` | Content wrapper for complex field layouts |

### Key Accessibility Props

Always include on form inputs:
- `id` — unique, matches `htmlFor` on label
- `aria-invalid` — from `fieldState.invalid`
- `disabled` — from form's `isDisabled` state
- `autoComplete` — appropriate value for the input type

## Toast / Error Display

Use `ErrorProvider` for errors — never call `toast.error()` directly.

```tsx
// ✅ In hooks — use error provider
import { useError } from '@/new-app/shared/providers'

const { showError, showWarning } = useError()
showError('Something went wrong')

// ✅ For success toasts — sonner directly is OK
import { toast } from 'sonner'
toast.success('Item created')

// ❌ Never for errors
toast.error('Something went wrong')
```

## Installed Components

### shadcn/ui (16)
alert, badge, button, collapsible, data-table, dialog, input, popover, scroll-area, select, sheet, skeleton, sonner, table, tabs, tooltip

### Custom (`ui/custom/`) (7)
app-container, back-button, dev-tool-panel, fuel-meter, language-selector, navbar (TruckerNavbar), stepper

> **Note:** If a feature needs a component not in this list, install it with `pnpm dlx shadcn@latest add <name>` and update this list. Use the shadcn MCP to check available components.

## Anti-Patterns

```tsx
// ❌ register() instead of Controller
<Input {...form.register('email')} />

// ❌ Deprecated Form/FormField wrappers
<Form {...form}>
  <FormField name="email" render={...} />
</Form>

// ❌ Inline error display
{form.formState.errors.email && <p className="text-red-500">...</p>}

// ❌ Legacy import path
import { Button } from '@/components/ui/button'

// ❌ Wrong utility import
import { cn } from '@/lib/utils'
// ✅ Correct
import { cn } from '@/utils/clsxm'
```

## React 18 Notes

- **`forwardRef` is still required** for ref forwarding (this is NOT React 19)
- Use `useContext(Context)` (not `use(Context)`)
- `displayName` required on `forwardRef` components

## Related

- **shadcn MCP server** — use for component API, props, variants, installation help
- [Form patterns rule](.claude/rules/form-patterns.md)
- [Error handling rule](.claude/rules/error-handling.md)
