---
name: interface-copy
description: UX writing and interface copy — voice and tone, verb-first buttons, links that name their destination, one capitalization policy, settings that describe the on state, errors that say how to fix, empty states that point forward, placeholders as examples, and realistic draft content instead of lorem ipsum and AI clichés. Use when writing or reviewing any user-facing text — labels, CTAs, errors, empty states, toasts, settings, onboarding, marketing copy — or when the copy reads "generic", "robotic", "salesy", or inconsistent. NOT for how text renders and wraps (typography), error markup and announcements (accessibility), or room for translated strings (hierarchy-layout).
---

# Interface copy

Clear and brief beats clever; consistent beats varied. The best error message is the interaction redesigned so the error cannot happen.

## Recon the existing voice

Before writing or reviewing, read the copy nearby: the product's terms, localization conventions, any content style guide. A deliberate brand voice is not a defect. Raise a departure from plain language only when it creates inconsistency, ambiguity, translation risk, or a tone the stakes don't support.

## One voice, flexible tone

The product has one voice; a local edit does not invent a new one. Terms stay consistent — "Archive" in the menu is not "Move to storage" in the toast. Tone flexes with the stakes:

| Context | Tone |
| --- | --- |
| Success, onboarding, empty states | warm, can be light |
| Routine actions, settings | neutral, minimal |
| Errors, destructive confirmations | calm, plain, zero playfulness |
| Data loss, security | serious, explicit |

## Address the reader directly

"You", not "the user". In errors, "we" reads as deflection — "Unable to load content" over "We're having trouble loading this content". Possessives sparingly: "Favorites" beats "Your favorites". One perspective throughout a flow.

## Plain words, no assembly

Words a tired reader gets on the first pass; delete every word that does no work. No idioms, no humor that won't translate. "Tap" on touch, "click" with a pointer, "select" when both are possible. Skip unnecessary gender ("Subscribers can post recipes"). Never assemble a sentence from fragments around a variable — word order changes per language; use a full templated string with real pluralization.

## Verb-first buttons that repeat the consequence

"Send", "Save draft", "Delete project" — never "OK!", "Let's go!", or a bare "Yes"/"No" on a consequential action. A confirmation is answerable without reading the body: "Delete this project?" offers `Delete project` and `Cancel`. A multi-step flow uses one vocabulary: "Get started" to enter, "Continue" *or* "Next" (pick one), "Done" to finish. CTAs are verb + what they get: "Start free trial", "Book a demo", never "Learn more" or "Submit".

## Links describe their destination

Screen-reader users navigate by a list of links, so link text makes sense out of context: "Read the billing docs", never "Click here". Two "Learn more" on one page need suffixes: "Learn more about exports".

## One capitalization policy

Title case or sentence case per element type, applied to every instance. Sentence case is the safer default — calmer, no per-word rules, localizes cleanly. "Save Changes" beside "Discard changes" reads as sloppiness.

## Settings describe the ON state

"Send read receipts", never "Don't send read receipts" (a double negative on a toggle). Link straight to a referenced setting ("Notification settings") instead of describing the path to it.

## Errors say how to fix, next to where it broke

| Bad | Good |
| --- | --- |
| That password is too short | Choose a password with at least 8 characters |
| Invalid name | Use only letters for your name |
| Oops! Something went wrong. | Unable to save. Check your connection and try again. |

No blame, no "oops", no exclamation marks, active voice ("We could not save your changes", never "Mistakes were made"). Phrase hints positively and show them before the mistake. When the same error keeps firing, redesign the interaction instead of rewording it. Success messages carry no exclamation marks either.

## Empty states point forward

Say what this place is, how to fill it, and offer one next action:

```html
<!-- Bad --> <p>No results.</p>
<!-- Good -->
<p class="font-medium">No projects yet</p>
<p class="text-sm text-secondary">Projects keep your tasks and files together.</p>
<button class="mt-4">Create a project</button>
```

A search or filter empty state names the query and offers an exit: "No results for 'quarterly'. Clear filters". Persistent information never lives in an empty state — it vanishes the moment content exists.

## Placeholders are examples, not labels

A placeholder shows the expected format (`name@example.com`, `DD/MM/YYYY`), vanishes on input, and is never the only label. Every field keeps a visible one.

## Real content, never filler

Draft copy is real copy: no lorem ipsum, no "John Doe", no "Acme Corp" or "Nexus", no round fake numbers (`99.99%`, `$100.00` — write `47.2%`, `$99.00`, `+1 (312) 847-1928`). Never a metric, testimonial, logo or count the user did not supply — an honest "metric to confirm" placeholder beats an invented one. Banned clichés: "Elevate", "Seamless", "Unleash", "Next-gen", "Game changer", "Delve", "Tapestry", "In the world of", "Streamline", "Optimize" as a value proposition. Marketing copy is specific ("Cut weekly reporting from 4 hours to 15 minutes") and benefit-first (features are what it does; benefits are what that means for them).

## Before you finish

| Mistake | Fix |
| --- | --- |
| "Click here" / "Learn more" links | Name the destination |
| "OK" / "Yes" on a destructive dialog | Repeat the consequence: `Delete project` |
| "Next" here, "Continue" there | One flow vocabulary |
| Title case and sentence case mixed | One policy per element type |
| "Don't send notifications" toggle | Describe the ON state |
| "Invalid input" | Name the fix, beside the field |
| "No items" | Orientation plus a next step |
| Placeholder as the only label | Add a visible label |
| "Acme Corp", `99.99%`, "Elevate your workflow" | Believable names, organic numbers, specific outcomes |

## Reporting

**Severity.** `HIGH` misleads the user or hides how to recover from an error. `MEDIUM` breaks voice, terminology or capitalization consistency. `LOW` is isolated wording polish.

**Verification.** Source alone is enough: every label against the action it invokes, every error for a stated fix, terminology against the copy around it, placeholder content against the realism rules.

**Format.** Group findings under the principle each violates, ordered by severity, one row per root cause listing every location it appears in:

| Severity | Location | Before | After | Why |
| --- | --- | --- | --- | --- |

`Location` is `path/to/file:line`. `Why` names the principle and the user impact. Report every check you could not run as `Not verified`.

End with `Block` when any `HIGH` remains, `Approve` otherwise, leaving the rest in the table as work to do. Never `Approve` coverage you did not inspect. With nothing to report, say "No actionable findings" for this domain in one line and report verification.
