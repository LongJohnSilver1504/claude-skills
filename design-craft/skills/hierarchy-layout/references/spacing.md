# Spacing recipes

## The scale

Adjacent steps differ by at least ~25%, so each step is a real decision:

```
4  8  12  16  24  32  48  64  96  128  192
```

Tailwind's default spacing follows this shape; a project scale in `.design/style-lock.md` wins.

Jobs per step (4px base):

| Step | Use |
| --- | --- |
| 4 | icon-to-label, badge padding |
| 8 | a label and its value, stacked related lines |
| 12 | dense rows, compact internals, gap between bordered controls |
| 16 | standard component padding, layout margin on mobile |
| 24 | between groups inside a card; content-card padding floor; around borderless controls |
| 32 | showcase-card padding; between groups in a section |
| 48–64 | compact and default section padding |
| 96–192 | weighty and pivotal marketing sections, desktop only |

## The 2× rule

```css
/* Good: spacing alone communicates grouping */
.field { display: flex; flex-direction: column; gap: 8px; }
.form  { display: flex; flex-direction: column; gap: 24px; }

/* Bad: uniform spacing plus a line to compensate */
.form > * { margin-bottom: 12px; border-bottom: 1px solid var(--separator); }
```

```html
<div class="space-y-6">
  <div class="space-y-2">…label + input…</div>
  <div class="space-y-2">…label + input…</div>
</div>
```

Card padding never exceeds the gap between cards — if it does, the layout reads cramped inside and empty outside at once.

## Breathing room between targets

| Between | Start at |
| --- | --- |
| Adjacent bordered or filled controls | 12px |
| Around borderless text or icon controls | 24px |
| Unrelated control groups | 24px+ (≥2× intra-group) |

```html
<!-- Good -->
<div class="flex gap-3">
  <button class="rounded-lg border px-4 py-2">Cancel</button>
  <button class="rounded-lg bg-accent-solid px-4 py-2 text-on-accent">Save</button>
</div>

<!-- Bad: three borderless icon buttons packed at 4px -->
<div class="flex gap-1"><button><TrashIcon/></button><button><ArchiveIcon/></button><button><ShareIcon/></button></div>
```

Hit-area minimums and pseudo-element expansion belong to accessibility; these clearances come on top so expanded hit areas never overlap.

## Inset action bars

```css
.action-bar {
  padding-inline: 16px;
  padding-bottom: calc(16px + env(safe-area-inset-bottom));
}
.action-bar button { width: 100%; border-radius: 12px; }
```

A button glued to three viewport edges reads as system chrome and clips against rounded corners and gesture zones.

## Content bleeds, controls float

```css
.article {
  display: grid;
  grid-template-columns: 1fr min(65ch, calc(100% - 48px)) 1fr;
}
.article > * { grid-column: 2; }
.article > .full-bleed { grid-column: 1 / -1; }

.fab {
  position: fixed;
  inset-inline-end: calc(16px + env(safe-area-inset-right));
  bottom: calc(16px + env(safe-area-inset-bottom));
}
```

## Alignment edges

```css
/* Good: one shared leading edge, one indent step */
.section { padding-inline: 24px; }
.section .child { margin-inline-start: 16px; }

/* Bad: three unrelated leading edges in one column */
.header { padding-inline-start: 20px; }
.list-item { padding-inline-start: 14px; }
.footer { padding-inline-start: 24px; }
```

| Physical (avoid) | Logical (use) |
| --- | --- |
| `margin-left` | `margin-inline-start` |
| `padding-right` | `padding-inline-end` |
| `left: 0` | `inset-inline-start: 0` |
| `text-align: left` | `text-align: start` |
| `border-right` | `border-inline-end` |

Sequences that encode progression (steps, star ratings, progress) mirror in RTL; flex and grid with logical properties mirror automatically, hand-positioned elements do not.

## Order by importance

```html
<!-- Good: primary fact first, detail demoted -->
<div>
  <p class="text-2xl font-semibold">$4,320.00</p>
  <p class="text-sm text-secondary">Available balance</p>
</div>

<!-- Bad: the key fact is buried -->
<div>
  <p class="text-sm">Account 4402 · Opened 2019 · Standard tier</p>
  <p class="text-sm">Last statement: June 30</p>
  <p class="text-sm">Balance: $4,320.00</p>
</div>
```

## Landing-page section tiers (desktop; step down one or two tiers under 40rem)

| Section role | Padding per side |
| --- | --- |
| Connective (logo strip, transition band) | 48–64px |
| Standard (feature explanation, testimonial) | 64–96px |
| Pivotal (hero, primary proof or demo) | 128–192px |

The perceived pause between two sections is one bottom padding plus the next top padding — 120–250px on desktop reads as "the next idea starts here". Whitespace alone is a legitimate separator at this scale; one mechanism for the whole page.
