---
description: React component conventions for consistent code style
globs: src/**/*.tsx, src/**/*.jsx
alwaysApply: true
---

# React Component Conventions

## Arrow Function Components

Always define React components using arrow functions, not function declarations.

```tsx
// ✅ DO: Arrow function
export const MyComponent = ({ title, children }: MyComponentProps) => {
  return (
    <div>
      <h1>{title}</h1>
      {children}
    </div>
  )
}

// ✅ DO: Arrow function with forwardRef (React 18)
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ children, variant, ...props }, ref) => {
    return (
      <button ref={ref} className={cn(buttonVariants({ variant }))} {...props}>
        {children}
      </button>
    )
  }
)
Button.displayName = 'Button'

// ❌ DON'T: Function declaration
export function MyComponent({ title, children }: MyComponentProps) {
  return (
    <div>
      <h1>{title}</h1>
      {children}
    </div>
  )
}
```

## Named Exports

Prefer named exports over default exports for components.

```tsx
// ✅ DO: Named export
export const UserCard = ({ user }: UserCardProps) => {
  return <div>{user.name}</div>
}

// ❌ DON'T: Default export
const UserCard = ({ user }: UserCardProps) => {
  return <div>{user.name}</div>
}
export default UserCard
```

## Props Interface Naming

Define props types as `{ComponentName}Props` directly above the component.

```tsx
// ✅ DO
type UserCardProps = {
  user: User
  onSelect?: (user: User) => void
}

export const UserCard = ({ user, onSelect }: UserCardProps) => {
  // ...
}
```

## forwardRef for Radix/shadcn Compatibility (React 18)

React 18 requires explicit `forwardRef` for ref forwarding. Any component that may be passed as a child to Radix's `asChild` pattern (e.g., `SheetTrigger`, `DialogTrigger`, `PopoverTrigger`, `TooltipTrigger`) **must** use `forwardRef` — otherwise Radix cannot attach its ref and you get the warning: *"Function components cannot be given refs"*.

### When to Use forwardRef

- Component is used inside `<SheetTrigger asChild>`, `<DialogTrigger asChild>`, or any Radix `asChild` slot
- Component is passed as a `trigger` prop that ends up inside an `asChild` wrapper
- Component wraps a native element (`button`, `a`, `div`) and may need external ref access

### Pattern

```tsx
import { forwardRef } from 'react'

type ActionRowProps = {
  title: string
  onClick?: () => void
}

export const ActionRow = forwardRef<HTMLButtonElement, ActionRowProps>(
  ({ title, onClick, ...rest }, ref) => {
    return (
      <button ref={ref} type="button" onClick={onClick} {...rest}>
        {title}
      </button>
    )
  }
)
ActionRow.displayName = 'ActionRow'
```

### Key Points

1. **Always spread `...rest`** — Radix injects event handlers and ARIA attributes via props.
2. **Always set `displayName`** — React DevTools needs it for forwardRef components.
3. **Type the ref** to the rendered element (`HTMLButtonElement`, `HTMLDivElement`, etc.). If the component conditionally renders different elements, use `HTMLElement` and cast at each branch.

```tsx
// Multi-element component
export const ActionRow = forwardRef<HTMLElement, ActionRowProps>(
  ({ href, ...rest }, ref) => {
    if (href) {
      return <a ref={ref as React.Ref<HTMLAnchorElement>} href={href} {...rest} />
    }
    return <button ref={ref as React.Ref<HTMLButtonElement>} {...rest} />
  }
)
```

## Next.js 13 Link + shadcn Button

Next.js 13 Pages Router `<Link>` only accepts a **single child**. The shadcn `asChild` pattern does not work when the button has multiple children (e.g., icon + text).

```tsx
// ✅ DO: Wrap Link around Button (works with multiple children)
if (href) {
  return (
    <Link href={href}>
      <Button variant="ghost">
        <ArrowLeft className="h-4 w-4" />
        {label}
      </Button>
    </Link>
  )
}

// ❌ DON'T: asChild + Link with multiple children (runtime error)
<Button variant="ghost" asChild>
  <Link href={href}>
    <ArrowLeft className="h-4 w-4" />
    {label}
  </Link>
</Button>

// ❌ DON'T: Fragment inside asChild (breaks flex layout)
<Button variant="ghost" asChild>
  <Link href={href}>
    <>
      <ArrowLeft className="h-4 w-4" />
      {label}
    </>
  </Link>
</Button>
```

`asChild` is fine when the button has a **single text child** (e.g., `<Button asChild><Link href={href}>Click here</Link></Button>`), but avoid it when composing icon + text.

## Related Rules

- [project-structure.mdc](mdc:.cursor/rules/project-structure.mdc) — Where components live
- [form-patterns.mdc](mdc:.cursor/rules/form-patterns.mdc) — Form component patterns
