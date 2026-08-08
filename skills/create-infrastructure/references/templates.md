# Create Infrastructure — Code Templates

> **Project config:** `{app}` is the project's new-code root from `.claude/rules/project-structure.md`; project values (package manager, commands, base branch, error surface) come from `docs/agents/project-conventions.md`. Resolve both before writing any file — never assume. If a needed file is missing, stop: "Run `/setup-daher-skills` first — missing `<file>`."


Complete code templates for each infrastructure deliverable type.
Replace `{component}` / `{module}` with the module name (lowercase, kebab-case) and `{Component}` with PascalCase.

**Paths:** templates use placeholders — shared root `@/{app}/shared/...` and UI `@/{app}/ui/...` come from the project's `.claude/rules/project-structure.md`; resolve them before writing any file. `cn` import path also comes from the project's conventions.

Conventions (component/hook separation, translate-in-hooks, centralized links, colors, layout ownership) live in the project's `.claude/rules/` — templates comply; the rule file wins.

---

## Step 1: Provider

Providers follow: context + provider component + consumer hook + guard.

### 1.1 Provider File (`shared/providers/{name}-provider.tsx`)

```tsx
import { createContext, useContext, useState, ReactNode } from 'react'

/**
 * {Component} Provider
 * Provides {component} context throughout the app
 */

type {Component}ContextValue = {
  // Define context shape
  value: string
  setValue: (value: string) => void
}

const {Component}Context = createContext<{Component}ContextValue | null>(null)

type {Component}ProviderProps = {
  children: ReactNode
  initialValue?: string
}

export const {Component}Provider = ({ children, initialValue = '' }: {Component}ProviderProps) => {
  // Provider logic here (useState, useEffect, etc.)
  const [value, setValue] = useState(initialValue)

  const contextValue: {Component}ContextValue = {
    value,
    setValue,
  }

  return (
    <{Component}Context.Provider value={contextValue}>
      {children}
    </{Component}Context.Provider>
  )
}

export const use{Component} = (): {Component}ContextValue => {
  const context = useContext({Component}Context)
  if (!context) {
    throw new Error('use{Component} must be used within <{Component}Provider>')
  }
  return context
}
```

### 1.2 Provider Barrel (`shared/providers/index.ts`)

```tsx
export { {Component}Provider, use{Component} } from './{component}-provider'
```

---

## Step 2: Layout Component Module

Every layout component MUST extract logic into a hook. The component file contains only UI rendering and lives in `{module}/components/` — never at the module root.

### 2.1 Layout Hook (`{module}/hooks/use-{component}.ts`)

The hook owns all logic AND all user-facing strings — `useTranslation` is never called in the component.

```tsx
import { useState, useCallback } from 'react'
import { useTranslation } from 'next-i18next'

/**
 * use{Component} Hook
 * Contains all logic for the {Component} component
 */

type Use{Component}Return = {
  // Return shape — everything the component needs, strings already translated
  isActive: boolean
  handleAction: () => void
  label: string
}

export const use{Component} = (): Use{Component}Return => {
  const { t } = useTranslation('{namespace}')

  // State
  const [isActive, setIsActive] = useState(false)

  // Callbacks
  const handleAction = useCallback(() => {
    setIsActive((prev) => !prev)
  }, [])

  return {
    isActive,
    handleAction,
    label: t('{component}.label'),
  }
}
```

If the hook needs navigation, import `useRouter` from `next/router` (Pages Router) and push routes from the `links` object — never hardcoded paths (see `centralized-links.md`).

### 2.2 Layout Component (`{module}/components/{component}.tsx`)

Renders flush — no external spacing props. The parent layout owns spacing between siblings (see `layout-ownership.md`), so there is no `className` passthrough for positioning.

```tsx
import { cn } from '@/utils/clsxm'
import { use{Component} } from '../hooks/use-{component}'

/**
 * {Component}
 * UI-only component — all logic lives in the use{Component} hook
 */

export const {Component} = () => {
  const { isActive, handleAction, label } = use{Component}()

  return (
    <button
      type="button"
      className={cn('base-styles-here', isActive && 'active-styles')}
      onClick={handleAction}
    >
      {label}
    </button>
  )
}
```

### 2.3 Module Barrel (`{module}/index.ts`)

```tsx
export { {Component} } from './components/{component}'
export { use{Component} } from './hooks/use-{component}'
```

### 2.4 Root Barrel (layouts root `index.ts`)

```tsx
export { {ComponentA}, use{ComponentA} } from './{module-a}'
export { {ComponentB}, use{ComponentB} } from './{module-b}'
```

---

## Step 3: Shared Hook

Truly shared hooks (used across multiple components) live in `shared/hooks/`.

### 3.1 Shared Hook (`shared/hooks/use-{name}.ts`)

```tsx
import { useState, useEffect, useCallback } from 'react'

/**
 * use{Name} Hook
 * {Description of what this hook does}
 * Used by: {list components that use this hook}
 */

type Use{Name}Options = {
  // Configuration options
  initialValue?: string
  delay?: number
}

type Use{Name}Return = {
  // Return shape
  value: string
  setValue: (value: string) => void
}

export const use{Name} = (options: Use{Name}Options = {}): Use{Name}Return => {
  const { initialValue = '', delay = 300 } = options

  const [value, setValue] = useState(initialValue)

  // Hook logic here

  return {
    value,
    setValue,
  }
}
```

### 3.2 Hooks Barrel (`shared/hooks/index.ts`)

```tsx
export { useDebounce } from './use-debounce'
export { useMediaQuery } from './use-media-query'
export { use{Name} } from './use-{name}'
```

---

## Step 4: i18n Translations

### 4.1 English Namespace (`public/locales/en/{namespace}.json`)

```json
{
  "navbar": {
    "menu": "Menu",
    "home": "Home",
    "findBay": "Find Bay",
    "messages": "Messages",
    "profile": "Profile"
  },
  "backButton": {
    "back": "Go back"
  }
}
```

### 4.2 Spanish Namespace (`public/locales/es/{namespace}.json`)

```json
{
  "navbar": {
    "menu": "Menú",
    "home": "Inicio",
    "findBay": "Buscar Bahía",
    "messages": "Mensajes",
    "profile": "Perfil"
  },
  "backButton": {
    "back": "Volver"
  }
}
```

---

## Step 5: Shared Utility

### 5.1 Utility Module (`shared/{module}/index.ts`)

```tsx
/**
 * {Module} utilities
 * {Description}
 */

export const helperFunction = (input: string): string => {
  // Implementation
  return input.trim()
}

export const anotherHelper = <T>(items: T[]): T[] => {
  // Implementation
  return items.filter(Boolean)
}
```

---

## Living Examples

Don't copy long examples from this file — read the project's real shipped modules instead (e.g., `{app}/ui/custom/`). Each follows the module pattern above (`components/` + `hooks/` + `index.ts`, plus PRD/UX-spec docs):

| Module | What it shows |
|--------|---------------|
| `ui/custom/navbar/` | Sheet-based top nav, hook-owned items + translations |
| `ui/custom/back-button/` | Small component with a dedicated hook for navigation |
| `ui/custom/app-container/` | Page wrapper (viewport constraint, navbar/footer slots) |
| `ui/custom/language-selector/` | Locale toggle, hook-owned locale logic |

For a shared provider example, read `{app}/shared/providers/notification-provider.tsx`.
