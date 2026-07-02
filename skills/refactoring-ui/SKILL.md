---
name: refactoring-ui
description: Apply the design principles from Refactoring UI by Wathan & Schoger when building new UI OR reviewing existing UI in React + Tailwind v4 + shadcn/ui. Use whenever the user asks to build, create, design, implement, code, or scaffold a UI component, screen, page, card, form, modal, empty state, or anything visual — AND whenever the user asks to review, audit, critique, improve, refactor, or get feedback on a UI component or screen ("what's wrong with this component", "design review", "is this UI good"). Also use proactively when implementing a feature where visual quality matters, or when the user shares UI code and the implicit ask is about visual quality, not behavior. Stack — React + Tailwind v4 + shadcn/ui, mobile-only (pages render inside the project's viewport container, e.g. AppContainer at ~350–400px; colors come from the project's semantic tokens — check .claude/rules/).
---

# Refactoring UI

One skill, two workflows. **Build** — generate new UI with the principles baked in. **Audit** — review existing UI against the principle set. Pick the workflow that matches the ask; a "make this look better" request usually means Audit first, then Build the fixes.

Both workflows are mobile-only: every screen renders inside `AppContainer` (~350–400px wide). No `sm:`/`md:`/`lg:` breakpoint prefixes, ever. All colors are semantic tokens from `src/styles/globals.css` — raw Tailwind palette classes (`text-blue-100`, `bg-red-500`) are blocked by a hook.

## Build workflow

**1. Read the references.** Before generating any UI code, read both:
- `references/principles.md` — the full principle set, organized by chapter
- `references/tailwind-shadcn-cheatsheet.md` — concrete Tailwind/shadcn patterns mapped to the principles

These are short. Read them fully once at the start of a task; don't skim. You'll be making dozens of micro-decisions per component, and the cheatsheet exists so each decision lands in a Tailwind class that's already principle-aligned.

**2. Sketch the hierarchy first (rule 1.1, 2.1).** Before writing JSX, identify:
- **What is the one primary thing on this screen?** (the focus, the main action, the headline data)
- **What's secondary?** (supporting info, secondary actions)
- **What's tertiary?** (metadata, fine print, ancillary links)

If you can't answer those three questions, ask the user before writing code. A component without a clear primary element will need rework.

**3. Pick the layout shape (rules 3.3, 3.4).** The viewport is fixed at ~350–400px inside `AppContainer` — design for that width and nothing else. Decide the vertical rhythm: which sections stack, what separates them, what scrolls.

**4. Generate the component.** Write JSX applying the cheatsheet patterns. Specifically:
- **Spacing:** outer container uses larger `space-y-*` than inner groups (rule 3.6).
- **Typography:** two weights max (`font-normal` + `font-semibold`), three text colors max (`text-foreground`, `text-muted-foreground`, occasionally an accent). Never `font-light` or below for UI text.
- **Buttons:** rank by hierarchy. One `variant="default"`, others `outline`/`ghost`. Destructive only loud when destructive IS primary.
- **Colors:** only semantic tokens (`text-foreground`, `bg-card`, `text-muted-foreground`, `text-success`, `bg-warning`), never raw palette classes (`text-gray-500`). No grey on colored backgrounds (rule 2.3) — use a same-hue token pair like `bg-info` + `text-info-foreground`.
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

## Audit workflow

**1. Read the references.** Before reviewing anything, read both:
- `references/principles.md` — the full principle set, organized by chapter
- `references/checklist.md` — the structured audit checklist + severity definitions + output format

These are short enough to read in full. Do it once at the start of the audit; you'll need to cite rule numbers throughout.

**2. Read the code.** If a file path was given, read it. If code was pasted, work from that. If neither — only a screenshot or description — work from what's available and say so in the output ("review based on visual only, couldn't verify token usage in code").

**3. Run the checklist.** Walk through every chapter in `checklist.md`, including the project-specific section at the end. Don't skip chapters because the component "doesn't seem to have that problem" — the whole point of a checklist is catching things you'd otherwise miss. For each item, either find an issue or move on silently (don't list every passing check).

**4. Stack-specific verification.** For React + Tailwind v4 + shadcn/ui code, also check:
- **Arbitrary values:** `text-[13px]`, `mt-[18px]`, `bg-[#3a7bd5]` — these bypass the design system (rule 1.5). Suggest the nearest token.
- **Raw palette classes:** `text-gray-500`, `bg-blue-100`, `border-red-300` — must be semantic tokens from `globals.css` (see checklist P1).
- **Breakpoint prefixes:** any `sm:`/`md:`/`lg:` class — mobile-only app, these are banned.
- **Tailwind weight classes:** `font-thin`, `font-extralight`, `font-light` at UI sizes — violates rule 2.2 (no weights under 400 for UI text).
- **shadcn variants:** if multiple Buttons in the same area all use `variant="default"`, that's rule 2.8.
- **Default shadow tokens:** `shadow-sm`, `shadow`, `shadow-md`, `shadow-lg`, `shadow-xl` — verify the elevation matches the component's role (rule 6.2).
- **`em` units:** in CSS or `style={}`, flag any `em`-based sizing (rule 3.5 / 4.1).
- **Hex colors inline:** `#3a7bd5` instead of theme tokens (rule 5.1, 5.3).

**5. Write the audit.** Use the format from `checklist.md`:
- Group by severity (🔴 Critical / 🟡 Important / 🟢 Nitpick), not by chapter.
- Each finding: rule number + one-sentence diagnosis + one-sentence fix.
- Don't restate the principle — the rule number references it.
- If you have nothing critical, say so: "No critical issues. A few polish opportunities below."

**6. Offer the fix.** End with: "Want me to apply these changes?" Don't refactor preemptively — the user might want to see the audit first.

## What to avoid

- **Don't write before reading.** Read the reference files first, every time. Pattern recall from training data won't match the rules in those files.
- **Don't add breakpoint prefixes or desktop layouts.** There is one viewport (~350–400px). `md:grid-cols-3` is always wrong here.
- **Don't use raw palette classes or arbitrary color values** (`text-blue-100`, `bg-[#3a7bd5]`). Use an existing semantic token from `globals.css`, or add a new one per `color-usage.md`.
- **Don't make every action a primary button.** The single most common violation and the most visible (rule 2.8).
- **Don't use arbitrary Tailwind values** (`text-[13px]`, `mt-[18px]`) unless there's a specific reason that doesn't fit the scale (rule 1.5).
- **Don't carry hierarchy with size alone.** If the headline is `text-5xl bold`, that's a smell. Drop to `text-2xl semibold` and use weight + color for the contrast (rule 2.2).
- **Don't ship a generic empty state.** "No items" is not a finished component (rule 8.4).
- **Don't lecture.** In audits, cite `2.3 grey on color`, not three paragraphs. In build mode, don't leave `// per Refactoring UI rule 2.8` comments in the file — flag design decisions in your response prose.
- **Don't pad findings or apply fixes silently inside an audit.** If there are two real issues, the audit has two issues. The audit output is findings, not a refactor — ask before changing code.
- **Don't review behavior or deep accessibility in audits.** This skill is about visual design quality (plus the three project-specific checks in the checklist). If you spot an unrelated a11y bug, mention it briefly at the end under "outside the book's scope."

## Example interaction (Build)

> User: "Build the stay summary card for the metered stay detail page."

After reading the references, the response opens with the hierarchy decision:

> "Primary: the amount due — it's the number the trucker came to see. Secondary: the warehouse name and bay. Tertiary: check-in time and plate. The card gets an accent top border in the warning hue since payment is pending (rule 8.2), one `default` button ('Pay this stay'), and a `ghost` receipt link (rule 2.8). Amount and '/stay' align by baseline (rule 4.4). Two font weights total."

Then the code:

```tsx
<Card className="flex flex-col border-t-4 border-t-warning">
  <CardHeader>
    <div className="flex items-baseline justify-between">
      <h3 className="text-lg font-semibold">Sunrise Logistics</h3>
      <span className="text-xs uppercase tracking-wider text-muted-foreground">Bay 4</span>
    </div>
    <p className="text-sm text-muted-foreground">Checked in 6:42 AM · ABC-1234</p>
  </CardHeader>
  <CardContent className="space-y-6">
    <div className="flex items-baseline gap-1">
      <span className="text-4xl font-bold">$36.50</span>
      <span className="text-sm text-muted-foreground">due now</span>
    </div>
    <ul className="space-y-3 text-sm">
      <li className="flex items-start justify-between">
        <span className="text-muted-foreground">Parking (3h 15m)</span>
        <span className="tabular-nums">$32.50</span>
      </li>
      <li className="flex items-start justify-between">
        <span className="text-muted-foreground">Service fee</span>
        <span className="tabular-nums">$4.00</span>
      </li>
    </ul>
  </CardContent>
  <CardFooter className="flex flex-col gap-2">
    <Button className="w-full min-h-11">Pay this stay</Button>
    <Button variant="ghost" className="w-full min-h-11">View receipt</Button>
  </CardFooter>
</Card>
```

Notice what's happening:
- Fits the ~350px AppContainer viewport — no breakpoint prefixes, no `max-w-6xl`, parent owns external spacing (root renders flush).
- `space-y-6` between content groups > `space-y-3` inside the line-item list (rule 3.6).
- One `default` button, one `ghost` (rule 2.8).
- `border-t-4 border-t-warning` accent using a semantic token (rule 8.2).
- `items-baseline` on `$36.50` + `due now` (rule 4.4).
- `text-xs uppercase tracking-wider` on the bay label (rule 4.8).
- `text-foreground` / `text-muted-foreground` / `border-t-warning` — every color is a token; three text colors max, two weights total (rule 2.2).
- `min-h-11` keeps both buttons at the 44px touch-target minimum.

## Example interaction (Audit)

> User shares a React card component with `<h1 className="text-5xl font-bold">Account</h1>`, three solid `<Button>`s side by side, and `<p className="text-gray-400">` body text on a `bg-info` panel.

After reading the references, the audit reads:

```
🔴 Critical (3)
- P1 `text-gray-400` is a raw palette class — blocked by the color hook. Use a semantic token.
- 2.8 All three buttons use solid styling. Only "Save changes" should be the primary; "Cancel" → outline variant, "Delete account" → ghost or destructive-link styling.
- 2.3 Grey text on the `bg-info` panel reads as washed-out. Use the panel's paired token (`text-info-foreground`), or add a same-hue token per color-usage.md.

🟡 Important (2)
- 2.6 "Account" is rendered at text-5xl bold — it's a section label, not a hero headline. text-xl or text-2xl semibold would be better and let the content lead.
- 2.2 The page is using 5 different font weights across the card. Two is plenty (regular + semibold).

Want me to apply these?
```
