---
name: refactoring-ui-reviewer
description: Audit and review existing UI code (React components, Tailwind classes, JSX/TSX, CSS) against the principles in Refactoring UI by Wathan & Schoger. Use whenever the user asks to review, audit, critique, improve, refactor, or get feedback on a UI component, screen, or design — including phrases like "what's wrong with this component", "make this look better", "design review", "is this UI good", or sharing a component asking for visual feedback. Also use proactively when the user shares UI code and the implicit ask is about visual quality, not behavior. Stack assumed — React + Tailwind v4 + shadcn/ui (TruckBays setup).
---

# Refactoring UI Reviewer

Audit a piece of UI against the 8-chapter principle set from Refactoring UI. Output: a prioritized list of findings the user can act on, citing specific rules.

## Workflow

**1. Read the references.** Before reviewing anything, read both:
- `references/principles.md` — the full principle set, organized by chapter
- `references/checklist.md` — the structured audit checklist + severity definitions + output format

These are short enough to read in full. Do it once at the start of the audit; you'll need to cite rule numbers throughout.

**2. Read the code.** If a file path was given, read it. If code was pasted, work from that. If neither — only a screenshot or description — work from what's available and say so in the output ("review based on visual only, couldn't verify token usage in code").

**3. Run the checklist.** Walk through every chapter in `checklist.md`. Don't skip chapters because the component "doesn't seem to have that problem" — the whole point of a checklist is catching things you'd otherwise miss. For each item, either find an issue or move on silently (don't list every passing check).

**4. Stack-specific verification.** For React + Tailwind v4 + shadcn/ui code, also check:
- **Arbitrary values:** `text-[13px]`, `mt-[18px]`, `bg-[#3a7bd5]` — these bypass the design system (rule 1.5). Suggest the nearest token.
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

- **Don't review behavior or accessibility beyond what's in the book.** This skill is about visual design quality. If you spot a clear a11y bug (missing alt text, no keyboard focus), mention it briefly at the end under "outside the book's scope" — don't make it the audit.
- **Don't write before reading.** Read `principles.md` and `checklist.md` first, every time. Rule numbers and severity tiers come from those files; getting them right is the whole point.
- **Don't lecture.** The user has read (or will read) the book. Cite `2.3 grey on color`, not three paragraphs explaining why grey on color is bad.
- **Don't pad findings.** If there are only two real issues, the audit has two issues. Resist the urge to fill all three severity buckets.
- **Don't apply fixes silently inside the audit.** The output is findings, not a refactor. Ask before changing code.

## Example interaction

> User shares a React card component with `<h1 className="text-5xl font-bold">Account</h1>`, three solid `<Button>`s side by side, and `<p className="text-gray-400">` body text on a `bg-blue-600` panel.

After reading the references, the audit reads:

```
🔴 Critical (2)
- 2.8 All three buttons use solid styling. Only "Save changes" should be the primary; "Cancel" → outline variant, "Delete account" → ghost or destructive-link styling.
- 2.3 `text-gray-400` on `bg-blue-600` reads as washed-out. Hand-pick a desaturated blue with the same hue (~hsl(213, 60%, 80%)) for helper text on this panel.

🟡 Important (2)
- 2.6 "Account" is rendered at text-5xl bold — it's a section label, not a hero headline. text-xl or text-2xl semibold would be better and let the content lead.
- 2.2 The page is using 5 different font weights across the card. Two is plenty (regular + semibold).

Want me to apply these?
```
