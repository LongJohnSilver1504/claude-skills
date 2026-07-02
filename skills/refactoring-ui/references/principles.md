# Refactoring UI — Principles Reference

The book condensed into actionable rules. Each rule has a short name (use it in audit findings), the principle, the failure mode it prevents, and how to fix it.

## Table of contents

1. [Starting from Scratch](#1-starting-from-scratch)
2. [Hierarchy is Everything](#2-hierarchy-is-everything)
3. [Layout and Spacing](#3-layout-and-spacing)
4. [Designing Text](#4-designing-text)
5. [Working with Color](#5-working-with-color)
6. [Creating Depth](#6-creating-depth)
8. [Finishing Touches](#8-finishing-touches)

> Chapter 7 (Working with Images — stock photos, favicons, screenshots) is intentionally omitted: it doesn't apply to this app. Its one relevant rule — user-uploaded images get fixed containers with `object-fit: cover` — lives in rule 3.7. Chapter 8's numbering is kept so rule citations stay stable.

---

## 1. Starting from Scratch

### 1.1 Feature-first, not layout-first
Don't design the shell (nav, sidebar, container) before you've designed real features. You don't have the information to make shell decisions until you know what the features need. **Apply by:** sketching the core feature's fields/actions first, then derive the navigation from what features demand.

### 1.2 Detail comes later
Don't pick colors, fonts, or shadows in the first pass. Use greyscale and rough sizes until the structure works, then refine. **Apply by:** designing low-fidelity first — boxes, text labels, no styling — and only adding visual polish once hierarchy is right.

### 1.3 Don't design too much
Stop designing once decisions become arbitrary. Move to code; real constraints surface real problems. **Apply by:** when two mockup variants feel equally fine, ship the simpler one and iterate from real use.

### 1.4 Choose a personality
Every UI has a personality whether you choose it or not. Personality emerges from: typography (serif = traditional/literary, geometric sans = modern, rounded = friendly), color (saturated = energetic, muted = sophisticated), border radius (sharp = serious, round = playful), language (formal vs casual), and imagery. **Apply by:** pick a personality up front and check every decision against it.

### 1.5 Limit your choices
A limitless palette is a paralyzing curse. Pre-define small systems (8-10 shades per color, ~6-8 font sizes, ~10 spacing values) and only choose from those. Decision-making by elimination is fast; decision-making from infinity is paralysis. **Apply by:** never reach for the color picker mid-design — pick from a predefined token set.

---

## 2. Hierarchy is Everything

### 2.1 Not all elements are equal
"Designed" mostly means "deliberately weighted." When everything competes, the result is chaos. The fix is rarely to add styling — it's to subtract emphasis from the secondary things. **Apply by:** rank every visible element as primary / secondary / tertiary and style each tier consistently.

### 2.2 Size isn't everything
Don't carry the entire hierarchy with font size — it leads to oversized primary text and unreadable secondary text. Use font **weight** and **color** to do the same work at more reasonable sizes. Stick to ~2 weights (e.g. 400/500 and 600/700) and ~3 colors (dark / grey / lighter grey) for hierarchy. **Avoid font weights under 400 for UI text** — they only work at large headline sizes.

### 2.3 Don't use grey text on colored backgrounds
Grey-on-white works because it reduces contrast. On colored backgrounds, grey looks dirty. Reducing white opacity (e.g. `rgba(255,255,255,0.7)`) looks washed out and lets the background bleed through text. **Fix:** the text needs the **same hue** as the background at a different lightness — use the surface's paired token from `globals.css` (e.g. `text-warning-foreground` on `bg-warning`, `text-info-foreground` on `bg-info`). If no paired token fits, add a new token per `color-usage.md` — never hand-pick an inline value or reach for a raw palette class.

### 2.4 Emphasize by de-emphasizing
When the primary element doesn't pop, don't keep adding to it — tone down its competition. Active nav item won't stand out? Soften the inactive items. Sidebar competing with main content? Remove its background color. **Apply by:** before adding emphasis, ask "what could I subtract from the competition instead?"

### 2.5 Labels are a last resort
The `label: value` pattern gives every datum equal weight. Avoid it when:
- **Format implies meaning:** `jane@example.com` is obviously an email; `$19.99` is obviously a price.
- **Context implies meaning:** "Customer Support" under a name in an employee list is obviously a department.
- **You can fold the label into the value:** "In stock: 12" → "12 left in stock"; "Bedrooms: 3" → "3 bedrooms".

When you do need labels (e.g. scannable dashboards, spec sheets), de-emphasize them (smaller, lighter, lower contrast) so the value remains primary. Emphasize labels only when the user is searching by label, like reading a spec sheet for "depth".

### 2.6 Separate visual hierarchy from document hierarchy
`<h1>` doesn't mean "big." Section titles in apps often function as labels, not headlines — style them small even if the markup is `<h1>` or `<h2>`. Sometimes the right move is to visually hide a heading entirely while keeping it in the markup for accessibility. **Pick the tag for semantics, the style for visual hierarchy.**

### 2.7 Balance weight and contrast
Bold text and solid icons cover more surface area, so they feel emphasized. To balance a heavy icon next to text, lower the icon's **contrast** (softer color). To emphasize a thin border without darkening it (which feels harsh), increase its **width**. The principle: weight and contrast are interchangeable levers — use one to compensate for the other.

### 2.8 Semantics are secondary (for buttons)
Every page has a pyramid: one primary action, a few secondary actions, several tertiary actions. Style by hierarchy, not by semantic role:
- **Primary:** solid, high-contrast background.
- **Secondary:** outline or low-contrast background.
- **Tertiary:** styled as a link (no border, no background).

A destructive action isn't automatically a big red button. If "Cancel subscription" isn't the page's primary action, give it a tertiary treatment. Use the big red button on the confirmation modal where it IS the primary action.

---

## 3. Layout and Spacing

### 3.1 Start with too much white space
White space is almost always **added** to a design, which means designs end up with the minimum to not look broken — not the amount that looks good. Reverse the process: start with way too much spacing, then remove until you're happy. Dense UIs (dashboards) are a deliberate choice; sparse is the default.

### 3.2 Establish a spacing and sizing system
Don't fight between 120px and 125px. A linear scale (every 4px) doesn't help because small jumps matter at small sizes (12→16 = +33%) and not at large sizes (500→520 = +4%). **No two adjacent values in your scale should be closer than ~25%.** Start from 16px and build up. Example: `4, 8, 12, 16, 24, 32, 48, 64, 96, 128, 192, 256, 384, 512, 640, 768`. Tailwind's default spacing scale follows this principle.

### 3.3 You don't have to fill the whole screen
Having 1400px of canvas doesn't mean using it. If 600px is enough, use 600px. Don't make sections full-width just because the nav is full-width. Each element gets the space it needs, no more. When designing on a large canvas, shrink the canvas to ~400px and design mobile-first; bring it back up only when needed.

### 3.4 Grids are overrated
12-column grids force percentage-based widths on elements that should be fixed. A sidebar should be a fixed width optimized for its content, not 25% of whatever the screen is. Make components **fixed-width with a `max-width`** when there's an optimal size; let the surrounding space flex. Only use percentage widths for things that should genuinely scale.

### 3.5 Relative sizing doesn't scale
Don't define `headline = 2.5em` and call it done. The relationship between headline and body changes across breakpoints — on mobile, the ratio is much closer (1.5–1.7×). Define explicit sizes per breakpoint, not relative ones. Same applies within a component: button padding should not scale proportionally with font size — small buttons need disproportionately tighter padding, large buttons need disproportionately more generous padding.

### 3.6 Avoid ambiguous spacing
When elements are grouped without a visible separator (border, background), spacing has to do the grouping. **Space around a group must be larger than space within the group.** Common failures: label–input pairs where margin-below-label equals margin-below-input (the form looks like a list of unconnected elements); bulleted lists where line-height of one bullet equals gap between bullets.

### 3.7 User images get fixed containers
Users will give you whatever aspect ratio they have. Don't let user-uploaded images (truck photos, plate captures, avatars) dictate your layout — force them into a fixed container with `object-fit: cover` (or `background-size: cover`). For images whose background might match your UI background, use a subtle **inner box-shadow** instead of a border; borders clash with image colors, shadows don't.

---

## 4. Designing Text

### 4.1 Establish a type scale
Don't use every pixel value from 10–24. Pre-pick ~6–10 sizes. Modular scales (golden ratio etc.) produce fractional values and aren't flexible enough for UI — hand-pick instead. A useful scale: `12, 14, 16, 18, 20, 24, 30, 36, 48, 60, 72`. **Use px or rem, never em** — em compounds in nested elements and breaks the scale.

### 4.2 Use good fonts
- For UI, default to a neutral sans-serif. The system font stack is a safe choice: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`.
- Filter typeface lists by "5+ weights" — fonts with many weights tend to be more carefully designed.
- Match font to purpose: headline fonts have tighter spacing and shorter x-height; UI fonts have wider spacing and taller x-height. Don't use a condensed headline font for body UI.
- Popular = usually good. Sorting font directories by popularity is a real heuristic.

### 4.3 Keep your line length in check
Paragraphs should be **45–75 characters per line** (~20–35em wide). Going up to 90 is risky territory. Long lines are hard to scan back to the start of the next line. Mix wider components (images, code blocks) with narrower paragraphs in the same content area when needed — different widths in the same column look more polished than long lines.

### 4.4 Baseline, not center
When mixing font sizes on the same horizontal line (e.g. card title + small metadata), **align by baseline, not by vertical center.** Centering offsets the baselines, which the eye reads as misaligned. CSS: `align-items: baseline`.

### 4.5 Line-height is proportional
- **Small text + wide lines:** taller line-height (up to 2).
- **Large headlines:** tight line-height (1–1.1, sometimes less).
- The 1.5 default is for body copy at moderate widths only.

Line-height and font size are inversely proportional: small text needs more leading, large text needs less.

### 4.6 Not every link needs a color
The "blue underlined" treatment is for links inside paragraphs of non-link text. In an interface where nearly everything is clickable, that treatment is visual noise. For navigation-style links, use a heavier weight or darker color. For really ancillary links, show the underline or color only on hover.

### 4.7 Align with readability in mind
- Left-align long text in LTR languages.
- Center only works for ≤2–3 lines. If you want centered text but a line is too long, **rewrite it shorter** rather than allow it to wrap.
- Right-align numbers in tables so decimals line up — they become scannable.
- Justified text needs hyphenation enabled, or you get rivers of whitespace.

### 4.8 Use letter-spacing effectively
- Default: trust the type designer, leave it alone.
- Headlines using a body-optimized font: tighten letter-spacing slightly to mimic the dense look of a real headline face.
- All-caps text: increase letter-spacing. Uppercase letters lack the visual variety of lowercase (no descenders/ascenders), so extra spacing improves legibility. Typical: `tracking-wider` or `letter-spacing: 0.05–0.1em`.

---

## 5. Working with Color

### 5.1 Perceptual color spaces, applied through tokens
Hex/RGB hide the relationship between colors. HSL — and OKLCH, which is even better perceptually — expose hue, saturation/chroma, and lightness: the dimensions the eye actually perceives. In this project that thinking is already done: the palette lives in `src/styles/globals.css` as OKLCH tokens. **In component code, never define a color** — use an existing semantic token with the hue you need, or add a new token to `globals.css` (light + dark values) per `color-usage.md`.

### 5.2 You need more colors than you think
Five-color palettes from generators don't build real interfaces. You need:
- **Greys: 8–10 shades.** Almost everything in a UI is grey.
- **Primary color(s): 5–10 shades each.** One, sometimes two.
- **Accent colors: 5–10 shades each.** For semantic states (red destructive, yellow warning, green positive) and for highlighting.

A complex UI can need 50+ named colors. This is normal — that's why `globals.css` carries semantic, state, and feature-specific tokens rather than a tiny palette.

### 5.3 Define your shades up front
Don't derive colors at the call site (`lighten()`, `color-mix()`, opacity stacking) — you end up with 35 nearly identical blues. Every shade is defined once, as a named token in `globals.css`. When a design needs a shade that doesn't exist, that's a signal to **add a token** (with light and dark OKLCH values, exposed via `@theme inline`) per `color-usage.md` — not to improvise a value or grab the nearest raw palette class in the component.

### 5.4 Don't let lightness kill your saturation
In OKLCH/HSL, saturation has less visual effect at extreme lightness values. When **defining new tokens** in `globals.css`, bump chroma as lightness moves away from the middle so very light or very dark shades don't look washed out. Also: "lightness" doesn't match perceived brightness across hues — yellow looks lighter than blue at the same lightness value. A shade can be visually lightened by rotating hue toward the nearest bright hue (yellow, cyan, magenta) or darkened toward the nearest dark hue (red, green, blue); limit rotation to ~20–30° or it stops feeling like the same color. This is token-authoring guidance — it never happens inline in component code.

### 5.5 Greys don't have to be grey
True 0%-saturation grey is sterile. Real-feeling greys are slightly saturated. **Cool greys:** add blue saturation. **Warm greys:** add yellow/orange saturation. Keep saturation consistent (or slightly increasing) across the scale so the temperature stays uniform. (The project's neutral tokens already carry a slight cool cast — another reason to use them instead of `text-gray-*`.)

### 5.6 Accessible doesn't have to mean ugly
WCAG asks for **4.5:1 contrast for normal text, 3:1 for large text (~18px+).** Two tricks when this is hard with color:
- **Flip the contrast:** instead of white-on-dark-color (which forces a very dark color), use dark-color-on-light-color (the same family, just inverted). In token terms: swap which of the pair (`--x` / `--x-foreground`) is the surface and which is the text.
- **Rotate the hue:** when authoring a token that must pass contrast on a dark colored panel and lightness alone won't get to 4.5:1 without going near-white, rotate hue toward a brighter color (cyan, magenta, yellow) in the token definition.

### 5.7 Don't rely on color alone
Color-blind users (~8% of men) can't always tell red from green. Always communicate state with a second channel:
- Up/down arrows on metric cards, not just red/green numbers.
- Different line styles or labels on graphs, not just different colors.
- Icons (✓/✗/!) on alert types, not just background color.

---

## 6. Creating Depth

### 6.1 Emulate a light source
Light comes from above. This single rule explains everything else:
- **Raised elements:** top edge is lighter (catches light), bottom is darker (in shadow). Shadow falls below the element.
- **Inset elements:** the inverse — top is darker (the lip above blocks light), bottom is lighter.
- Use a **lighter same-hue token** for the top edge, not white-with-opacity (opacity desaturates the underlying color and looks dull).
- Shadow blur should be small for sharp edges — look at a real wall outlet's shadow for reference.

### 6.2 Use shadows to convey elevation
Shadows position elements on a z-axis. Tight, small shadows = barely raised. Large, soft shadows = floating closer to the user. Map UI primitives to elevations:
- **Buttons / cards (low elevation):** subtle small shadow.
- **Dropdowns / popovers (medium):** more diffuse shadow.
- **Modals (high):** large diffuse shadow, the element commands attention.

Define **~5 elevation levels** and only use those. Use shadow changes for interaction feedback: button shrinks shadow on press; drag-item gains shadow on grab.

### 6.3 Shadows can have two parts
Real shadows have two components. Combine them for richer depth:
- **Larger, softer shadow:** big blur, vertical offset, low opacity. The directional shadow from the main light source.
- **Tighter, sharper shadow:** small blur, less offset, slightly darker. The shadow at the contact line where ambient light can't reach.

At higher elevations, the tight contact shadow disappears (the object isn't touching anything). Example:
```css
box-shadow:
  0 1px 3px rgba(0,0,0,0.12),   /* contact */
  0 1px 2px rgba(0,0,0,0.24);   /* directional */
```

### 6.4 Even flat designs can have depth
Flat design doesn't mean depth-free. Cues that work without skeuomorphism:
- **Lighter = closer, darker = further** (when both differ from background). Make a card lighter than the page to lift it; darker to inset it.
- **Solid shadow** (vertical offset, zero blur) — keeps a flat aesthetic but still lifts the element off the page.

### 6.5 Overlap elements to create layers
The most effective depth cue: have elements cross boundaries.
- A card that straddles a section boundary (half on a colored section, half on the next).
- An image that pokes out of its container.
- Controls that overlap the content they control (e.g. carousel arrows on top of the image).

For overlapping images that would clash, add an "invisible border" matching the background color — creates a small gap between layers.

---

## 8. Finishing Touches

### 8.1 Supercharge the defaults
Don't accept browser default styling. Cheap wins:
- Replace `<ul>` bullets with icons (checkmarks for features, locks for security points).
- Style block quotes — increase size, brand color, large quotation mark.
- Custom underline for in-text links (thick, branded, partially overlapping the descenders).
- Custom checkbox/radio styling using brand colors.

### 8.2 Add color with accent borders
A thin colored bar adds personality without graphic-design skill. Common placements:
- Top edge of a card.
- Left edge of a callout/alert.
- Under a section heading.
- Indicator under the active nav tab.
- Top of the entire page.

### 8.3 Decorate your backgrounds
A plain UI feels plain. Options to break monotony:
- Differentiate sections by background color (alternate page sections).
- **Subtle gradient** between two hues no more than ~30° apart.
- **Repeating pattern** (Hero Patterns, simple SVGs). Keep contrast very low.
- A geometric shape or simple illustration in a corner of a hero section.

### 8.4 Don't overlook empty states
The first thing a new user sees is the zero-state. Don't ship a generic "No items yet" message.
- Include illustration or large icon.
- Strong, specific CTA ("Create your first invoice"), not just "Add."
- Hide secondary UI (filters, sort, tabs) that's useless until there's content.

### 8.5 Use fewer borders
Borders are noisy. Alternatives:
- **Box shadow** instead of border (subtler outline).
- **Different background colors** for adjacent elements (no border needed).
- **More spacing** — separation by gap rather than line.

If you're already using a different background AND a border, the border is redundant.

### 8.6 Think outside the box
Components don't have to look like their default. A dropdown can have columns, sections, icons, supporting text. A table can merge related columns and use images in cells. Radio buttons can be selectable cards. The conditioned defaults are not the only valid design.

---

## Cross-cutting "Leveling Up" practices

- **Look for unintuitive decisions** in designs you admire. The interesting stuff is what you wouldn't have thought to do.
- **Rebuild your favorite interfaces** from scratch without peeking at DevTools. You discover details only by trying to recreate them.
