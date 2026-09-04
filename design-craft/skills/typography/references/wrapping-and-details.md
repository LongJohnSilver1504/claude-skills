# Wrapping, truncation and details

## Measure

Aim for 60–75 characters per line in long-form text. `65ch` measures characters directly (one `ch` is the width of `0`). At 16px body size the range lands roughly between 560px and 680px, so `max-w-xl` (576px) and `max-w-2xl` (672px) both fit. Recheck when the body size changes.

## Wrapping

| Property | Job |
| --- | --- |
| `text-wrap: balance` | even lines on a heading |
| `text-wrap: pretty` | no orphan on a description's last line |
| `overflow-wrap: break-word` | long words, links and IDs break before escaping |
| `white-space: nowrap` | labels and badges stay on one line |

Browsers ignore `balance` past a few lines; skip both in long-form text.

## Truncation

```css
.one-line { overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
.three-lines { display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 3; overflow: hidden; }
```

When the hidden text matters, expose the full value in a tooltip or expanded view.

## Underlines

```css
a {
  text-underline-position: from-font;
  text-decoration-thickness: from-font;
}
abbr { text-decoration: underline dotted; }

/* or tune by hand */
a {
  text-decoration-thickness: 1px;
  text-underline-offset: 3px;
  text-decoration-skip-ink: auto;
  text-decoration-color: var(--color-text-secondary);
  transition: text-decoration-color 200ms ease-out;
}
a:hover { text-decoration-color: var(--color-text-primary); }
```

Color is the only part of a real underline that animates reliably; anything else needs a separate element.

## iOS input zoom — two correct fixes

**Size up on mobile** (the mobile input looks different from desktop):

```tsx
<input className="text-base sm:text-sm" type="email" />
```

**Scale the text down** (identical look at every viewport; more code):

```tsx
// 13px rendered from a 16px font-size: 13 / 16 = 0.8125
<div className="flex h-10 items-center rounded-[10px] bg-sunken px-2.5">
  <input
    className="h-full w-[calc(100%/0.8125)] origin-left scale-[0.8125] bg-transparent text-base leading-[calc(1.125/0.8125)] outline-none sm:w-full sm:scale-100 sm:text-[13px]"
    type="email"
  />
</div>
```

The transform shrinks the whole box, so a wrapper draws the surface and the input stays transparent. `origin-right` under RTL.

## Sizes

| Text | Size |
| --- | --- |
| Long-form body | ~16px, verified in the actual face and measure |
| Inputs and menus | ~14px (16px on mobile) |
| Captions | 13px |
| Floor | rarely below 12px |

Typography must survive the reader changing it: zoom, a larger browser font, overridden line-height or letter-spacing.

## Decorative text

`::first-letter` drop caps; `background-clip: text` for gradients clipped to letters (a recognized tell on headlines — earn it); `-webkit-text-stroke` outlines (variable fonts show overlapping contours; static fonts don't); `text-shadow` follows glyph shapes.

## Internationalization

- A paragraph of three or more lines aligns to its own script (`text-align: start` with correct `lang`/`dir` on the element); one- or two-line snippets follow the UI direction.
- Digits never reverse; wrap mixed values in `<bdi>` where adjacent RTL text disturbs them.
- Latin glyphs read smaller beside CJK at the same nominal size — check mixed strings visually.
