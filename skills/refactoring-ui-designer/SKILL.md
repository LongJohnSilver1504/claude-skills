---
name: refactoring-ui-designer
description: Apply the design principles from Refactoring UI by Wathan & Schoger when creating, building, or implementing new UI in React + Tailwind v4 + shadcn/ui. Use whenever the user asks to build, create, design, implement, code, or scaffold a UI component, screen, page, layout, card, form, dashboard, modal, empty state, table, or anything visual — including phrases like "make a settings page", "build a pricing card", "I need a dashboard for X", or even when the user gives a feature description that will require new UI. Also use proactively when implementing a feature where the visual quality of the result matters, not just behavior. Stack — React + Tailwind v4 + shadcn/ui (TruckBays setup).
---

# Refactoring UI Designer

Build new UI that follows the principles from Refactoring UI. Output: React components using Tailwind v4 + shadcn/ui that don't need a design review afterward, because the principles are baked in from the start.

## Workflow

**1. Read the references.** Before generating any UI code, read both:
- `references/principles.md` — the full principle set, organized by chapter
- `references/tailwind-shadcn-cheatsheet.md` — concrete Tailwind/shadcn patterns mapped to the principles

These are short. Read them fully once at the start of a task; don't skim. You'll be making dozens of micro-decisions per component, and the cheatsheet exists so each decision lands in a Tailwind class that's already principle-aligned.

**2. Sketch the hierarchy first (rule 1.1, 2.1).** Before writing JSX, identify:
- **What is the one primary thing on this screen?** (the focus, the main action, the headline data)
- **What's secondary?** (supporting info, secondary actions)
- **What's tertiary?** (metadata, fine print, ancillary links)

If you can't answer those three questions, ask the user before writing code. A component without a clear primary element will need rework.

**3. Pick the layout shape (rules 3.3, 3.4).**
- What's the optimal width? Cap it with `max-w-*`. Don't default to full-width.
- Is this a fixed-width-sidebar + flexible-content layout (rule 3.4 — use fixed + flex, not 25/75 grid)?
- Is this mobile-first? Design for ~400px first, then scale up.

**4. Generate the component.** Write JSX applying the cheatsheet patterns. Specifically:
- **Spacing:** outer container uses larger `space-y-*` than inner groups (rule 3.6).
- **Typography:** two weights max (`font-normal` + `font-semibold`), three text colors max (`text-foreground`, `text-muted-foreground`, occasionally an accent). Never `font-light` or below for UI text.
- **Buttons:** rank by hierarchy. One `variant="default"`, others `outline`/`ghost`. Destructive only loud when destructive IS primary.
- **Colors:** use shadcn tokens (`text-foreground`, `bg-card`, `text-muted-foreground`), not raw `text-gray-*`. No grey on colored backgrounds (rule 2.3) — use same-hue lighter shades.
- **Borders:** prefer `shadow-sm` or different `bg-*` over a literal border. Never both bg-difference AND border.
- **Shadows:** match the elevation to the role (resting/raised/floating/modal). Don't pick at random.
- **Mixed font sizes on one line:** `items-baseline`, not `items-center`.

**5. Add the polish (chapter 8).** Before stopping, look at the result and apply at least one "finishing touch" where appropriate:
- Replace a default `<ul>` with an icon-bulleted list if it's a feature list.
- Add an accent border (top of card, left of alert, under active nav) if the design feels plain.
- If there's an empty state involved, design it properly — illustration/icon, specific CTA, hide useless secondary UI.
- Supercharge defaults: custom checkbox style, branded link underline, etc.

**6. Self-review pass.** Before handing the code back, mentally walk through these 5 questions:
- When I squint at this, what stands out? Is it the right thing?
- Are there ≤ 2 font weights and ≤ 3 text colors?
- Does space-between-groups visibly exceed space-within-groups?
- Does any button styling not match its hierarchy role?
- Is any color/state communicated by color alone (rule 5.7)?

If something fails, fix it before delivering. Don't ship the violation and explain it later.

## What to avoid

- **Don't write before reading.** Read `principles.md` and `tailwind-shadcn-cheatsheet.md` first, every time. Pattern recall from training data won't match the rules in those files.
- **Don't default to full-width or full-screen.** Most UIs look better with `max-w-*` caps. Filling the canvas is a habit, not a goal (rule 3.3).
- **Don't make every action a primary button.** This is the single most common violation and the most visible (rule 2.8).
- **Don't use arbitrary Tailwind values** (`text-[13px]`, `mt-[18px]`, `bg-[#3a7bd5]`) unless there's a specific reason that doesn't fit the scale. They bypass the design system (rule 1.5).
- **Don't carry hierarchy with size alone.** If the headline is `text-5xl bold`, that's a smell. Drop to `text-2xl semibold` and use weight + color for the contrast (rule 2.2).
- **Don't ship a generic empty state.** "No items" is not a finished component (rule 8.4).
- **Don't lecture in comments.** Code is for shipping. If you want to flag a design decision, do it in your response prose, not as a `// per Refactoring UI rule 2.8` comment in the file.

## Example interaction

> User: "Build me a pricing card with three tiers: Free, Pro, Enterprise."

After reading the references, the response opens with the hierarchy decision:

> "I'll structure this as three cards in a row, with **Pro** as the recommended tier — it gets a slightly larger size, a colored top border (accent border, rule 8.2), and the only `default` button. Free and Enterprise use `outline` buttons (rule 2.8). Prices use baseline alignment between the `$` and the digits (rule 4.4). Two font weights total."

Then the code:

```tsx
<div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
  {/* Free tier */}
  <Card className="flex flex-col">
    <CardHeader>
      <h3 className="text-lg font-semibold">Free</h3>
      <p className="text-sm text-muted-foreground">For getting started</p>
    </CardHeader>
    <CardContent className="flex-1 space-y-6">
      <div className="flex items-baseline gap-1">
        <span className="text-4xl font-bold">$0</span>
        <span className="text-sm text-muted-foreground">/month</span>
      </div>
      <ul className="space-y-3 text-sm">
        <li className="flex items-start gap-2">
          <CheckIcon className="size-4 text-primary mt-0.5 shrink-0" />
          <span>Up to 3 projects</span>
        </li>
        {/* ... */}
      </ul>
    </CardContent>
    <CardFooter>
      <Button variant="outline" className="w-full">Get started</Button>
    </CardFooter>
  </Card>

  {/* Pro tier — recommended */}
  <Card className="flex flex-col border-t-4 border-t-primary md:-mt-4 md:mb-4">
    <CardHeader>
      <div className="flex items-baseline justify-between">
        <h3 className="text-lg font-semibold">Pro</h3>
        <span className="text-xs uppercase tracking-wider text-primary font-semibold">Recommended</span>
      </div>
      {/* ... same structure ... */}
    </CardHeader>
    {/* ... */}
    <CardFooter>
      <Button className="w-full">Start free trial</Button>
    </CardFooter>
  </Card>

  {/* Enterprise tier */}
  {/* ... outline button ... */}
</div>
```

Notice what's happening:
- `gap-6` between cards > `space-y-3` inside lists (rule 3.6).
- One `default` button, two `outline` (rule 2.8).
- `border-t-4 border-t-primary` accent (rule 8.2).
- `items-baseline` on `$0` + `/month` (rule 4.4).
- `text-xs uppercase tracking-wider` on the "Recommended" pill (rule 4.8).
- `text-foreground` / `text-muted-foreground` / `text-primary` — three colors total (rule 2.2).
- Two weights total: default and `font-semibold` (rule 2.2).
