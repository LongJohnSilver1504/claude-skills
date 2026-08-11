---
name: test-mobile-app
description: Verify a mobile app change end-to-end on an iOS Simulator or Android Emulator. Use when mobile UI or native changes need runtime verification, when reproducing phone/tablet behavior, or when the user says "test on the simulator/emulator", "run the app on iOS/Android", "verify it on a device". NOT for web apps in a browser (finish-feature owns the browser smoke-walk) or desktop apps (computer-use).
---

# Test Mobile App

Run **one focused, end-to-end verification pass** of the affected flow on one representative device. This skill owns the workflow; platform mechanics live in the `/ios-simulator` and `/android-emulator` skills — invoke the one for the selected platform.

## Step 1: Select a viable platform

Inspect the host and the affected code before launching anything:

- Detect the stack: `app.json`/`app.config.*` + `metro.config.*` → Expo/React Native; `pubspec.yaml` → Flutter; bare `*.xcodeproj`/`build.gradle` → native.
- On macOS with Xcode, prefer one iOS Simulator for cross-platform changes. With the Android SDK (any OS), use one Android Emulator when Android is the affected surface or iOS tooling is unavailable — unavailable iOS tooling is not a blocker when Android is a valid representative target.
- Platform-specific change → test that platform. Neither platform viable → **report the missing SDK/emulator/dev-client prerequisite instead of claiming verification.**

**Done when:** you can name the platform, the device target, and the launch tool — or you have reported exactly what's missing.

## Step 2: Choose the lightest valid launch path

Cheapest option that is actually valid, in order:

1. **JS/TS/asset-only change** → reuse a compatible installed dev client + start the bundler. Never rebuild native code merely to load a new bundle.
2. **Native change** (native source/deps, entitlements, config plugins, generated projects) → rebuild the affected platform.
3. **User forbade rebuilds and no compatible client is installed** → reuse an existing `.app`/`.apk` artifact if one matches; otherwise report the missing dev client. Never silently rebuild.

An installed bundle proves the right app *variant*, not native compatibility — reuse it only if the current change didn't touch native deps, config plugins, or generated projects.

## Step 3: Start or reuse the bundler

For Metro/Expo (adapt for other stacks):

1. If a process already listens on the intended port, probe it (Metro answers `/status`). Reuse it **only** when it is healthy and belongs to THIS worktree/project — verify the served project path, dev-client mode, and scheme match.
2. **Never kill another worktree's bundler.** Start on an explicit free port instead, keeping the full dev identity (variant env var, `--dev-client`, scheme) intact.
3. Read the actual port and URL from the bundler's output — never assume the default.

**Done when:** the bundler's own output shows a port + URL you have recorded, or you're reusing one whose `/status` you probed this session.

## Step 4: Connect to a backend (when the app needs one)

- Point the app at **disposable, isolated state** — never at shared production or personal-account state.
- Origins: iOS Simulator reaches the host at `127.0.0.1`; Android Emulator at `10.0.2.2` (or `adb reverse` — see `/android-emulator`); a physical device needs the host's LAN address with the backend bound to `0.0.0.0`.
- Enter complete `http://` origins; bare hostnames often default to HTTPS and fail silently against local servers.
- Credentials/tokens for test sessions are short-lived and per-device: one per simulator/emulator/device, never reused, never pasted into screenshots, commits, or the final report.

## Step 5: Drive and observe the affected flow

- Launch and drive through the platform skill (`/ios-simulator` or `/android-emulator`): semantic targets (accessibility IDs, resource-ids, testIDs) over screen coordinates, registered deep links over guessed taps.
- Exercise **only the affected flow**, on one representative device — don't expand into a full test matrix unless the change is about platform, OS version, or screen size.
- Capture a screenshot at each key state.

## Step 6: Verify with evidence, then decide the environment's fate

**A launched app on screen is not evidence the flow works.** Before reporting:

1. Confirm the app is connected to the intended environment (seeded data visible), not rendering an empty disconnected shell.
2. Confirm the concrete expected behavior of the change — the assertion that would fail if the change were broken.
3. Capture the final state screenshot.

The environment's lifecycle boundary is the **user's iteration loop, not this turn**. If the user may iterate, leave the bundler/backend/emulator running and say so (with the non-secret URL). Tear down only when the user confirms they're done:

- Stop **only** the processes this session started (bundler, backend, emulator, log streams).
- Remove reverse-port rules you added.
- Delete only directories created for this test; keep anything holding reproduction evidence.

**Done when:** the report has per-step screenshots + pass/fail, the connected-state check, and an explicit line saying whether the environment was retained or torn down.

## Troubleshooting

- **Old UI or stale error appears** → verify the bundler's worktree, port, and variant before diagnosing the app code.
- **App renders but shows no data** → wrong backend origin for the platform (`10.0.2.2` vs `127.0.0.1`), dead backend, or expired test credential — issue a fresh one; they're single-use.
- **Second device can't authenticate** → per-device credentials; create another, don't retry the consumed one.
- **Port occupied** → likely a sibling worktree's process; pick a free explicit port, never kill the occupant.
- **Build succeeds but old behavior persists** → you reused a dev client across a native change; rebuild (Step 2, path 2).
