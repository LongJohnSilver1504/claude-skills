# Create Infrastructure — Code Templates

Complete code templates for each infrastructure deliverable type.
Replace `{component}` with the component name (lowercase, kebab-case) and `{Component}` with PascalCase.

---

## Step 1: Provider

Providers follow: context + provider component + consumer hook + guard.

### 1.1 Provider File (`shared/providers/{name}-provider.tsx`)

```tsx
import { createContext, useContext, ReactNode } from 'react'

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

## Step 2: Layout Component

Every layout component MUST extract logic into a hook. The component file contains only UI rendering.

### 2.1 Layout Hook (`shared/layouts/{component}/hooks/use-{component}.ts`)

```tsx
import { useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/router'
import { useTranslation } from 'next-i18next'

/**
 * use{Component} Hook
 * Contains all logic for the {Component} component
 */

type Use{Component}Options = {
  // Hook configuration options
  defaultValue?: string
}

type Use{Component}Return = {
  // Return shape - everything the component needs
  isActive: boolean
  handleAction: () => void
  label: string
}

export const use{Component} = (options: Use{Component}Options = {}): Use{Component}Return => {
  const { defaultValue } = options
  const { t } = useTranslation('app-layout')
  const router = useRouter()

  // State
  const [isActive, setIsActive] = useState(false)

  // Callbacks
  const handleAction = useCallback(() => {
    setIsActive((prev) => !prev)
  }, [])

  // Computed values
  const label = useMemo(() => t('{component}.label'), [t])

  return {
    isActive,
    handleAction,
    label,
  }
}
```

### 2.2 Layout Component (`shared/layouts/{component}/{component}.tsx`)

```tsx
import { clsxm } from '@/utils/clsxm'
import { use{Component} } from './hooks/use-{component}'

/**
 * {Component}
 * UI-only component - all logic lives in use{Component} hook
 */

type {Component}Props = {
  className?: string
  // Props that affect rendering only
}

export const {Component} = ({ className }: {Component}Props) => {
  const { isActive, handleAction, label } = use{Component}()

  return (
    <div
      className={clsxm(
        'base-styles-here',
        isActive && 'active-styles',
        className
      )}
      onClick={handleAction}
    >
      {label}
    </div>
  )
}
```

### 2.3 Layout Barrel (`shared/layouts/{component}/index.ts`)

```tsx
export { {Component} } from './{component}'
export { use{Component} } from './hooks/use-{component}'
```

### 2.4 Layouts Root Barrel (`shared/layouts/index.ts`)

```tsx
export { Navbar, useNavbar, useNavbarItems } from './navbar'
export { BackHeader, useBackHeader } from './back-header'
export { ProfileFooter, FooterTab, useFooterTab } from './profile-footer'
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
  isLoading: boolean
}

export const use{Name} = (options: Use{Name}Options = {}): Use{Name}Return => {
  const { initialValue = '', delay = 300 } = options

  const [value, setValue] = useState(initialValue)
  const [isLoading, setIsLoading] = useState(false)

  // Hook logic here

  return {
    value,
    setValue,
    isLoading,
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
  "backHeader": {
    "back": "Go back"
  },
  "footer": {
    "home": "Home",
    "bookings": "Bookings",
    "messages": "Messages",
    "profile": "Profile"
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
  "backHeader": {
    "back": "Volver"
  },
  "footer": {
    "home": "Inicio",
    "bookings": "Reservas",
    "messages": "Mensajes",
    "profile": "Perfil"
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

## Complete Examples

### Example: FooterTab with Hook

**Hook:** `shared/layouts/profile-footer/hooks/use-footer-tab.ts`

```tsx
import { useRouter } from 'next/router'

type UseFooterTabOptions = {
  href: string
  isActive?: boolean
}

type UseFooterTabReturn = {
  isActive: boolean
  href: string
}

export const useFooterTab = ({ href, isActive: isActiveProp }: UseFooterTabOptions): UseFooterTabReturn => {
  const router = useRouter()
  const isActive = isActiveProp ?? router.pathname === href

  return {
    isActive,
    href,
  }
}
```

**Component:** `shared/layouts/profile-footer/profile-footer.tsx`

```tsx
import { ReactNode } from 'react'
import Link from 'next/link'
import { LucideIcon } from 'lucide-react'
import { clsxm } from '@/utils/clsxm'
import { useFooterTab } from './hooks/use-footer-tab'

type FooterTabProps = {
  href: string
  icon: LucideIcon
  label: string
  isActive?: boolean
}

export const FooterTab = ({ href, icon: Icon, label, isActive: isActiveProp }: FooterTabProps) => {
  const { isActive } = useFooterTab({ href, isActive: isActiveProp })

  return (
    <Link href={href} legacyBehavior>
      <a
        className={clsxm(
          'relative flex flex-1 flex-col items-center justify-center gap-1 py-2 transition-colors',
          isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
        )}
      >
        {isActive && (
          <span className="absolute inset-x-0 top-0 h-0.5 bg-primary" />
        )}
        <Icon className="h-5 w-5 shrink-0" />
        <span className="text-xs font-medium">{label}</span>
      </a>
    </Link>
  )
}

type ProfileFooterProps = {
  children: ReactNode
  className?: string
}

export const ProfileFooter = ({ children, className }: ProfileFooterProps) => {
  return (
    <footer
      className={clsxm(
        'fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background',
        className
      )}
    >
      <nav className="mx-auto flex h-16 max-w-sm items-stretch">
        {children}
      </nav>
    </footer>
  )
}
```

**Barrel:** `shared/layouts/profile-footer/index.ts`

```tsx
export { ProfileFooter, FooterTab } from './profile-footer'
export { useFooterTab } from './hooks/use-footer-tab'
```

### Example: BackHeader with Hook

**Hook:** `shared/layouts/back-header/hooks/use-back-header.ts`

```tsx
import { useCallback } from 'react'
import { useRouter } from 'next/router'

type UseBackHeaderOptions = {
  onBack?: () => void
}

type UseBackHeaderReturn = {
  handleBack: () => void
}

export const useBackHeader = ({ onBack }: UseBackHeaderOptions = {}): UseBackHeaderReturn => {
  const router = useRouter()

  const handleBack = useCallback(() => {
    if (onBack) {
      onBack()
    } else {
      router.back()
    }
  }, [onBack, router])

  return {
    handleBack,
  }
}
```

**Component:** `shared/layouts/back-header/back-header.tsx`

```tsx
import { useTranslation } from 'next-i18next'
import { ChevronLeft } from 'lucide-react'
import { Button } from '@/ui/button'
import { clsxm } from '@/utils/clsxm'
import { useBackHeader } from './hooks/use-back-header'

type BackHeaderProps = {
  title?: string
  onBack?: () => void
  className?: string
}

export const BackHeader = ({ title, onBack, className }: BackHeaderProps) => {
  const { t } = useTranslation('app-layout')
  const { handleBack } = useBackHeader({ onBack })

  return (
    <header
      className={clsxm(
        'sticky top-0 z-40 w-full border-b border-border bg-background',
        className
      )}
    >
      <div className="mx-auto flex h-14 max-w-sm items-center gap-2 px-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleBack}
          aria-label={t('backHeader.back')}
          className="-ml-2 shrink-0"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>

        {title && (
          <h1 className="truncate text-base font-semibold text-foreground">
            {title}
          </h1>
        )}
      </div>
    </header>
  )
}
```

### Example: Navbar with Hook

**Hook:** `shared/layouts/navbar/hooks/use-navbar.ts`

```tsx
import { useState, useCallback } from 'react'
import { useRouter } from 'next/router'

type UseNavbarReturn = {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  closeSheet: () => void
  isActive: (href: string) => boolean
}

export const useNavbar = (): UseNavbarReturn => {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)

  const closeSheet = useCallback(() => {
    setIsOpen(false)
  }, [])

  const isActive = useCallback(
    (href: string) => router.pathname === href,
    [router.pathname]
  )

  return {
    isOpen,
    setIsOpen,
    closeSheet,
    isActive,
  }
}
```

**Component:** `shared/layouts/navbar/navbar.tsx`

```tsx
import Link from 'next/link'
import { useTranslation } from 'next-i18next'
import { Menu } from 'lucide-react'
import { Button } from '@/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/ui/sheet'
import { Separator } from '@/ui/separator'
import { clsxm } from '@/utils/clsxm'
import { useNavbar } from './hooks/use-navbar'
import { useNavbarItems } from './hooks/use-navbar-items'

type NavbarProps = {
  className?: string
}

export const Navbar = ({ className }: NavbarProps) => {
  const { t } = useTranslation('app-layout')
  const { isOpen, setIsOpen, closeSheet, isActive } = useNavbar()
  const navItems = useNavbarItems()

  return (
    <header
      className={clsxm(
        'sticky top-0 z-40 w-full border-b border-border bg-background',
        className
      )}
    >
      <div className="mx-auto flex h-14 max-w-sm items-center justify-between px-4">
        <Link href="/" legacyBehavior>
          <a className="text-lg font-semibold tracking-tight text-foreground">
            TruckBays
          </a>
        </Link>

        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label={t('navbar.menu')}
              className="shrink-0"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>

          <SheetContent side="right" className="w-[280px] sm:w-[320px]">
            <SheetHeader>
              <SheetTitle className="text-left">TruckBays</SheetTitle>
            </SheetHeader>

            <Separator className="my-4" />

            <nav className="flex flex-col gap-1">
              {navItems.map((item) => {
                const IconComponent = item.icon
                const active = isActive(item.href)

                return (
                  <Link key={item.key} href={item.href} legacyBehavior>
                    <a
                      onClick={closeSheet}
                      className={clsxm(
                        'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors',
                        active
                          ? 'bg-primary/10 text-primary'
                          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                      )}
                    >
                      <IconComponent className="h-5 w-5 shrink-0" />
                      <span>{item.label}</span>
                    </a>
                  </Link>
                )
              })}
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  )
}
```

**Barrel:** `shared/layouts/navbar/index.ts`

```tsx
export { Navbar } from './navbar'
export { useNavbar } from './hooks/use-navbar'
export { useNavbarItems } from './hooks/use-navbar-items'
export type { NavbarItem } from './hooks/use-navbar-items'
```

---
