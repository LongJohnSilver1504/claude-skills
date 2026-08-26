# Anti-slop gates

The recognizable tells that make output read as generated regardless of how good the tokens are. Run the six-axis critique before finalizing a system or a build; run the gates after. Every gate binds unless a mood note loosens it.

## Six-axis critique (score 1–5; any axis under 3 triggers a revision pass)

| Axis | Question |
| --- | --- |
| Show, don't tell | Is each section mostly something to look at (mockup, chart, comparison, real photo) with text as caption — or prose with a decorative icon? |
| Philosophy | Is there a reason this looks like *this*, traceable to the design read? |
| Hierarchy | In two seconds, can a viewer tell primary from secondary from tertiary? |
| Specificity | Does it look like *this* product, or like any page in different colors? |
| Restraint | Has everything not earning its place been removed — decoration, redundancy, motion with no information? |
| Variety | Does the structure differ from the last build in this project (a palette swap is not variety)? |

## Structure and chrome

1. The page is a named shape, not the reflexive hero → three feature cards → testimonial → CTA → footer.
2. Nav is not the reflexive wordmark-left / inline-links / button-right bar unless the page has ≤2 destinations; footer is not the four-column Product/Company/Resources/Legal farm unless it is a docs root.
3. No eyebrow-left / heading-right two-column section head; stack the eyebrow above the heading.
4. No hand-drawn fake browser, phone or IDE chrome — a real screenshot or nothing.
5. **One intentional rule-break exists**: an element bleeding past its column, an oversized number, an asymmetric moment. A page where everything sits safely on the grid reads as generated even when every token is right.
6. The same pill eyebrow does not appear above every section heading.
7. Semi-brutalist hairlines-and-flat-fills is a deliberate choice for this product, not the house reflex.

## Hero and logo

8. In five seconds a new visitor can name the product, its value and the primary action; every hero element that does not sharpen one of those answers moves below the fold.
9. Headline, lede and primary CTA are visible at 1280×800 without scrolling; the headline is sized to its word count and never stacks one word per line.
10. Not everything is centered on one axis — at most two centered elements; the eyebrow or CTA sits off-axis (playful/elegant may center more, still with one element off-axis).
11. No section headline outside the hero reaches hero scale (cap at ~50–65% of the hero display size).
12. The logo is a real mark, never a letter in a colored tile; an existing brand mark is preserved byte-for-byte unless a rebrand was requested.

## Color

13. No indigo→purple or blue→cyan gradient on heroes, buttons, or as `background-clip: text`.
14. Every pairing actually used is measured — including button label on fill, disabled text, and state borders. The three that ship most: label ≈ fill lightness, a dark panel whose text stayed dark, an accent fill with no verified on-accent color.
15. Neutrals are tinted toward the anchor hue unless the lane is deliberately monochrome.
16. The accent stays an accent: roughly ≤5% of any viewport (playful may run higher).
17. Nothing contradicts the lock's "Do not" list.

## Spacing and layout

18. Every gap is on the scale; a card's internal padding ≤ the gap to its neighbor.
19. Two-column sections balance their columns (center, fill with a real element, or cap) rather than trailing into empty space.
20. One section-separation mechanism across the whole page.
21. Landing-page sections are padded by tier (connective 48–64px, standard 64–96px, pivotal 128–192px desktop), not one cramped value everywhere. App shells stay dense.
22. No horizontal scroll from 320px to 1920px: `overflow-x: clip` on html/body, `minmax(0, 1fr)` on image tracks, `min-width: 0` and `overflow-wrap: anywhere` on display headings.
23. No clickable text wraps to two lines at any width; hit targets ≥44px under 40rem.

## Motion

24. The page is not static — hover/press feedback and restrained reveals exist — and it is not over-animated: motion carries information or it goes.
25. No `transition: all`; only `transform` and `opacity` animate; no uniform `hover:scale-105` across unrelated elements; no bouncy easing on UI state.
26. Focus rings appear instantly and never fade in.
27. Every motion degrades under `prefers-reduced-motion` to a ≤150ms opacity change, not to nothing and not to full motion.

## Typography

28. No emoji as icons; body copy never in monospace; no italic headings; at most three families on a page (display + body + one outlier in ≤2 slots).
29. Display line-height tightens with size but never below 1.0 on a bold display headline.

## Content and honesty

30. Real draft copy, never lorem ipsum, "John Doe", "Acme Corp", or round fake numbers (`99.99%`, `$100.00`); no AI clichés ("Elevate", "Seamless", "Unleash", "Next-gen", "In the world of").
31. **No invented metrics or fabricated proof.** A stat, logo, testimonial or count the user did not supply is slop the moment it is invented; use a real number, an honest `—` "metric to confirm" placeholder, or a section that needs no proof slot.
32. Loading, empty, error, disabled, focus, hover, pressed and success states exist for app screens; every button points somewhere or is visibly disabled; the current nav item is indicated.
33. Every color and font references a named token; an inline hex or `font-family: "X"` outside the token block is improvisation past the system.
34. Fallbacks are stated plainly (a code-native placeholder is not implied to be a real photo); no visible attribution line on the page.
35. Ship-completeness: favicon, `<title>`, meta description and social tags, legal links in the footer, a branded 404, client-side form validation, a skip link, alt text, a way back from every page.
