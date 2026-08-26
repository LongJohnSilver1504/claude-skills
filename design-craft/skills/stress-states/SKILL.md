---
name: stress-states
description: Answers "does this survive?" for one component — renders it on a throwaway page in every state real use can put it in (empty, one word, unbreakable string, RTL, emoji, zero and 10× items, 320px, squeezed, loading, error, disabled) and hands that page over as a visual report of what broke, each break named with the reference skill that owns the fix. Only runs when explicitly invoked.
disable-model-invocation: true
---

# Stress states

Take one component, render it on a fresh page under every scenario that can actually reach it, and let the page be the report: every state side by side, breaks marked. A component built against one happy path looks finished right up until real content arrives.

This skill observes; it does not judge against a standard (design-review) or explore alternatives (variants). A finding is something that visibly broke, named in the vocabulary of the skill that owns the fix. The whole run is build, look once, report — minutes, not a session.

## 1. Scope one component

One per run. "The settings page" is not a component; the profile form's text input is. When the request spans several, list the candidates and ask which to test. Restate the component in one sentence: what it accepts, what it renders, where it lives.

## 2. Infer the scenarios from the component

Stress only what varies. Read the props, slots, states and rendered data, then walk `references/scenarios.md`: each axis carries a cue that says whether it applies. A text input gets content length and states, never item quantity; a static icon button with a fixed label gets container and environment, never long text. Write the kept scenarios down, one line each, before building; say which axes you dropped and why, so a wrong inference is cheap to catch.

## 3. Build the harness page

One throwaway page holding the **real component imported from the project**, rendered once per scenario in a single column with a short text label above each instance. A scratch route inside the app gives it the app's own layout, fonts and global styles for free.

The page adds labels, container widths and fixture props — nothing else: no fonts or styles of its own, no simulated themes or token swaps, no probes. A component observed under any of those is a different component. Where the framework splits server from client components, the page itself is client code (`"use client"` in Next), or fixture props vanish silently across the boundary and every scenario renders empty.

Widths are scenarios *on the page*: render the width cases inside fixed-width containers beside the full-width one, so one load shows every width and nothing gets resized. Feed scenarios as props and fixture data; never wire live data; production never imports from the harness.

## 4. Look once

One pass. Load the page in a browser already at hand, skim every scenario top to bottom, note what visibly broke — "text escapes the field's right edge", never "spacing feels tight". A run that never rendered is a code review in a costume, and a predicted failure is not a finding.

One load is the budget. With no browser at hand, or one that needs launching or debugging, skip the look: hand the URL over and let the user's eyes be the observation. Then mark each break you did see on the page, a one-line note under that scenario's label, in a single edit — the page reads as the report on its own.

## 5. Report and stop

| Scenario | Observed | Owner |
| --- | --- | --- |
| One unbreakable 60-character string | overflows the card, no wrap, no truncation | typography |
| Zero items | blank region with no message | interface-copy |
| 320px container | primary button clipped at the trailing edge | hierarchy-layout |

Broken scenarios first. The owner is the skill whose rules diagnose the break. "Everything survived" plus the scenario list is a complete report. Do not fix anything unasked; on a request to fix, follow the owner skill's rules and re-render the failing scenarios to confirm.

## 6. Leave the page up

The page is half the report; it outlives the table. Delete it and its fixtures only when the user says they are done.

## Before you finish

| Mistake | Fix |
| --- | --- |
| Every axis run against every component | Keep only axes whose cue matches; name the drops |
| A predicted failure reported as observed | Render it or leave it out |
| A scenario missing the content it was fed | The harness is broken, not the component — make the page client code |
| A rebuilt lookalike in the harness | Import the real component |
| Harness re-themes or restyles the component | App layout, fonts and tokens as they are |
| A browser launched or screenshotted per scenario | One load, one look — or hand the URL over |
| Findings phrased as taste | What was visible on the page, or nothing |
| A break with no owner | Name the skill whose rules diagnose it |
| A clean run padded with suggestions | "Everything survived" plus the scenario list |
| Page deleted in the same turn as the report | Delete only on the user's word |

**Done when:** the harness page renders the real component under every kept scenario with one load, each break is marked on the page and listed with an owner, the dropped axes are named, and the page is still running at a stated URL.
