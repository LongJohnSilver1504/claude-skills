# Click-Path Audit

## Overview

The 4-phase flow starts from one symptom and drives to one root cause. It misses bugs where every function works in isolation and the *composition* is wrong — two store actions in one handler that cancel out, an effect that re-runs and clobbers what the click just set, a refetch that moves a wizard step under the user.

**Core principle:** Audit the screen, not the symptom. Map what each store action *resets that it does not own*, then trace every interactive element against that map.

**Use when:** a button "does nothing", a wizard jumps to the wrong step, state resets on its own, or Phase 2 isolation keeps coming back clean. Also after changing a Zustand store action — every caller is now suspect.

Single agent, three steps. Do not parallelize: step 1's map is the input to step 2, and splitting it loses the cross-store view that finds these bugs.

## Step 1: Build the state side-effect map

For every Zustand store (and React context with a reducer) in scope, list each action with the keys it **sets** and the keys it **resets that it does not own**:

```
STORE: composeStore
  setComposeMode(bool)  → sets {composeMode}
  selectThread(thread)  → sets {threadId, messages, drafts} · RESETS {composeMode} (owned by setComposeMode)
  reset()               → RESETS everything (owned: n/a)
```

Then extract the suspect list — this is the whole point of the step:

```
DANGEROUS RESETS
  selectThread → composeMode  (owner: setComposeMode)
  reset        → everything
```

Read the `set({...})` call of each action literally. A key that appears in an action's `set` but is never *read* by that action's own feature is a reset it does not own.

Also list every `useEffect` in scope that **writes** store state, keyed by what it watches:

```
EFFECTS THAT WRITE
  useComposePanel: watches [threadId] → writes {composeMode: false}
```

**Exit:** every action in scope has a row; the dangerous-reset list and the effect-writes list are written down.

## Step 2: Trace each interactive element

For every button, toggle, form submit, select and link on the screen, read the handler and follow each call into the store. Classify against these six patterns.

**1. Sequential undo** — call 2 resets what call 1 set.

```ts
onClick={() => {
  setComposeMode(true)   // sets composeMode = true
  selectThread(null)     // RESETS composeMode = false  ← the button does nothing
}}
```

**2. useEffect interference** — an effect keyed on a value the handler just changed re-runs and clobbers the rest of the handler's work.

```ts
// handler sets { threadId, composeMode: true }
useEffect(() => { setComposeMode(false) }, [threadId]) // fires next commit, undoes it
```

**3. Stale closure** — the handler captured an old value instead of reading the current one.

```ts
const { count, setCount } = useCounterStore()
const onClick = useCallback(() => {
  setCount(count + 1)
  setCount(count + 1)   // same captured count — increments by 1
}, [count])
```

Fix by reading fresh state (`useStore.getState()`) or an updater form. See `.claude/rules/zustand-patterns.md` for what belongs in a dependency array.

**4. Invalidation shift** — an `invalidateQueries` refetch re-derives a conditional step flag, the step array changes length, and the wizard lands on a different step.

```ts
onSuccess: async () => {
  await queryClient.invalidateQueries({ queryKey: myKeys.lists() }) // step flags re-derive → index shifts
}
```

Invalidate in the success step's exit handler instead. Full rule and the "step flags must be stable" test: `.claude/rules/tanstack-query.md` → Wizard Flow Invalidation.

**5. Double source of truth** — query data copied into the store, so a refetch and a store write disagree.

```ts
useEffect(() => { if (data) setItems(data.items) }, [data]) // store now drifts from the cache
```

The query cache owns server data; the store owns only what the user picked.

**6. Orphan reset** — an action resets a key that no component on the current screen reads. Either the reset is dead code or its reader was deleted and something else now depends on the stale value. Grep the key: zero readers is a finding, not a pass.

Record one row per element:

| Element | Handler | Actions called | Verdict |
| --- | --- | --- | --- |
| "New Email" (`thread-list.tsx:42`) | inline `onClick` | `setComposeMode(true)`, `selectThread(null)` | **Sequential undo** — call 2 resets `composeMode` |
| "Save draft" (`draft-area.tsx:88`) | `handleSave` | `updateDraft`, `mutate` | clean |
| "Next" (`wizard-nav.tsx:31`) | `onNext` | `goToStep`, `mutate` → `invalidateQueries` | **Invalidation shift** — step flags re-derive |

`clean` is a real verdict — expect most rows to be clean. A row you could not trace is `not verified`, never `clean`.

**Exit:** every interactive element on the screen has a row with a pattern name or `clean`.

## Step 3: Hand findings back to Phase 1

The audit produces suspects, not fixes. Each non-clean row re-enters the main skill as its own bug:

1. Write the Phase 1 reproduction: expected, actual, and the click sequence that triggers it.
2. Write the failing test **first** — a hook/component test that asserts the final state after the handler runs (e.g. `composeMode` is still `true` after clicking "New Email"). It must fail before the fix.
3. Then Phase 3 and 4 as normal: one-sentence root cause, minimal fix, test passes, feature tests and build pass.

Fix the store, not the caller, when the same dangerous reset breaks more than one element — splitting the action (or dropping the foreign key from its `set`) removes the whole class.

**Exit:** every finding has a failing test before any fix lands, and the table's `clean` and `not verified` rows are reported as-is.
