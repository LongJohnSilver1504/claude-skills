# Design System Component Map

> **Scope:** Reference for all skills that generate or reference UI components. Use this map to ensure correct component usage — never invent components that already exist.

## shadcn/ui Components (Installed)

| UI Concept | Component | Import Path | When to Use |
|------------|-----------|-------------|-------------|
| Action trigger | `Button` | `@/new-app/ui/button` | Primary/secondary/ghost/destructive actions |
| Status label | `Badge` | `@/new-app/ui/badge` | Status indicators, tags, counts |
| Text input | `Input` | `@/new-app/ui/input` | Single-line text, email, password |
| Dropdown select | `Select` | `@/new-app/ui/select` | Fixed option lists |
| Modal dialog | `Dialog` | `@/new-app/ui/dialog` | Confirmations, forms, detail views |
| Side panel | `Sheet` | `@/new-app/ui/sheet` | Settings, filters, detail sidebars. **Always `side="right"`** unless explicitly specified otherwise (see Sheet Defaults below) |
| Info popup | `Popover` | `@/new-app/ui/popover` | Contextual information, date pickers |
| Hover hint | `Tooltip` | `@/new-app/ui/tooltip` | Icon labels, truncated text hints |
| Loading placeholder | `Skeleton` | `@/new-app/ui/skeleton` | Content loading states |
| Inline message | `Alert` | `@/new-app/ui/alert` | Warnings, info, error callouts |
| Data grid | `DataTable` + `Table` | `@/new-app/ui/data-table`, `@/new-app/ui/table` | Structured data lists |
| Tab navigation | `Tabs` | `@/new-app/ui/tabs` | Content switching within a view |
| Scrollable area | `ScrollArea` | `@/new-app/ui/scroll-area` | Vertical scroll in fixed-height containers |
| Expandable section | `Collapsible` | `@/new-app/ui/collapsible` | Show/hide content sections |
| Toast notifications | `Sonner` | `@/new-app/ui/sonner` | Success/error feedback (via ErrorProvider for errors) |

## Custom Components (`ui/custom/`)

| UI Concept | Component | Import Path | When to Use |
|------------|-----------|-------------|-------------|
| Page wrapper | `AppContainer` | `@/new-app/ui/custom/app-container` | Root layout container for pages |
| Navigate back | `BackButton` | `@/new-app/ui/custom/back-button` | Page-level back navigation |
| Progress indicator | `FuelMeter` | `@/new-app/ui/custom/fuel-meter` | Visual progress/level display |
| Multi-step flow | `Stepper` | `@/new-app/ui/custom/stepper` | Wizard/checkout flows |
| Language toggle | `LanguageSelector` | `@/new-app/ui/custom/language-selector` | EN/ES language switch |
| Top navigation | `TruckerNavbar` | `@/new-app/ui/custom/navbar` | App header with nav |
| Debug overlay | `DevToolPanel` | `@/new-app/ui/custom/dev-tool-panel` | Development-only debugging |

## Form Components

| UI Concept | Component | Import Path | When to Use |
|------------|-----------|-------------|-------------|
| Form field wrapper | `Field` | `@/new-app/ui/field` | Wraps every form input |
| Field label | `FieldLabel` | `@/new-app/ui/field` | Accessible label for inputs |
| Validation error | `FieldError` | `@/new-app/ui/field` | Displays field validation errors |
| Field group | `FieldGroup` | `@/new-app/ui/field` | Groups multiple fields with spacing |

## Not Installed (Install When Needed)

| UI Concept | Component | Install Command |
|------------|-----------|----------------|
| Bordered container | `Card` | `pnpm dlx shadcn@latest add card` |
| Confirmation modal | `AlertDialog` | `pnpm dlx shadcn@latest add alert-dialog` |
| Action menu | `DropdownMenu` | `pnpm dlx shadcn@latest add dropdown-menu` |
| User avatar | `Avatar` | `pnpm dlx shadcn@latest add avatar` |
| Navigation trail | `Breadcrumb` | `pnpm dlx shadcn@latest add breadcrumb` |
| Page navigation | `Pagination` | `pnpm dlx shadcn@latest add pagination` |
| Visual divider | `Separator` | `pnpm dlx shadcn@latest add separator` |
| Progress bar | `Progress` | `pnpm dlx shadcn@latest add progress` |

## shadcn/ui Post-Install Checklist

After running `pnpm dlx shadcn@latest add {component}`, apply these 4 fixes:

1. **Fix `cn` import** — Change `import { cn } from "@/lib/utils"` to `import { cn } from "@/utils/clsxm"`
2. **Fix `forwardRef` types** — Ensure React 18 `forwardRef` generics are correct (shadcn sometimes outputs broken types)
3. **Cap overlay widths at mobile size** — For dialogs/sheets/alert-dialogs that ship a default like `max-w-[calc(100%-2rem)]` or `max-w-lg`, replace with `max-w-[350px]` so overlays render at mobile width even when previewed on desktop. `Dialog` and `AlertDialog` already have `max-w-[350px]` baked in — do **not** add it inline on `<DialogContent>` (it's redundant). Only override if a specific dialog needs a different width.
4. **Strip `sm:` breakpoint prefixes** — Remove all `sm:` responsive prefixes (mobile-only app, single viewport)

## Sheet Defaults

Sheets always slide in from the **right** (`side="right"`). Never use `side="bottom"` unless the content is a short confirmation or action sheet (e.g., delete confirmation with 2 buttons).

| Rule | Value |
|------|-------|
| Default side | `right` |
| Width | `max-w-[350px]` (set in `ui/sheet.tsx`) |
| Layout | `flex flex-col` on `SheetContent` |
| Close button | `showCloseButton` on right-side sheets |
| Header | `sr-only` for right-side sheets (close button is sufficient) |

```tsx
// ✅ Default — right-side sheet
<SheetContent side="right" className="flex flex-col" showCloseButton>

// ✅ Exception — short bottom confirmation
<SheetContent side="bottom">
  <SheetHeader><SheetTitle>Delete account?</SheetTitle></SheetHeader>
  <Button>Cancel</Button>
  <Button variant="destructive">Delete</Button>
</SheetContent>

// ❌ Don't use bottom for forms, lists, or detail views
<SheetContent side="bottom">
  <LongFormHere />  {/* Should be side="right" */}
</SheetContent>
```

> **Note:** Use the shadcn MCP server for full component API, props, and variants. This map covers what's available and when to use it.
