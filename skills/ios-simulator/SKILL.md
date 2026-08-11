---
name: ios-simulator
description: Build, launch, inspect, and drive apps on the iOS Simulator with one pinned simulator identity — installs, deep links, semantic UI automation, screenshots, scoped logs. Use when a task needs an iOS Simulator (macOS + Xcode): launching or verifying an iOS build, driving iOS UI, capturing simulator screenshots or logs — "boot the simulator", "run it on iPhone", "tap through the flow on iOS". NOT for Android (android-emulator) or desktop apps and non-simulator windows (computer-use).
---

# iOS Simulator

Operate the iOS Simulator with an explicit device identity and evidence-based verification. Prefer semantic MCP tooling (e.g. an XcodeBuildMCP server) when the session exposes it; fall back to `xcrun simctl` / `xcodebuild`. For the full mobile verification workflow (platform choice, bundler lifecycle, backend wiring), this skill is driven by `/test-mobile-app`.

## Step 1: Confirm availability

Requires macOS with Xcode (`xcodebuild -version`, `xcrun simctl help`). If the session exposes iOS MCP tools (session defaults, build/run, UI snapshot), prefer them over raw CLIs. If neither exists, **report the missing prerequisite — never claim simulator verification without a simulator.**

## Step 2: Pin one simulator context

1. `xcrun simctl list devices available` — pick ONE explicit UDID. Prefer a simulator that is already booted; boot an installed one (`xcrun simctl boot <udid>`) only when needed.
2. Do not create devices or download runtimes without the user's go-ahead.
3. Pin **every** subsequent build, install, launch, screenshot, log, and UI action to that same UDID. Never target "booted" implicitly when more than one simulator is running.
4. With MCP tooling: set session defaults (workspace/project, scheme, Debug configuration, simulator UDID, bundle id) once, before discovery or build calls.

Avoid generic macOS window automation for Simulator windows — explicit device identity is more reliable than window focus.

**Done when:** one UDID is recorded and `xcrun simctl list devices | grep <udid>` shows `(Booted)`.

## Step 3: Build or reuse, then launch

- **Native code, deps, entitlements, or project config changed** → build and run (MCP build-run tool, or `xcodebuild -scheme <scheme> -destination 'id=<udid>'` + install).
- **Otherwise reuse:** prove the app is installed with `xcrun simctl get_app_container <udid> <bundle-id> app`; install an existing artifact with `xcrun simctl install <udid> <path.app>` if needed; launch with `xcrun simctl launch <udid> <bundle-id>`.
- Run native tests with the smallest relevant target — never a whole workspace matrix routinely.

After launch, take a screenshot or UI snapshot **before** interacting: an open Simulator window alone is not evidence the intended app launched.

## Step 4: Drive the UI semantically

1. With MCP tooling: snapshot the accessibility hierarchy, act only on element references from the **current** snapshot, and re-snapshot after navigation — references go stale.
2. Prefer waiting primitives for async transitions over fixed sleeps.
3. When no actionable element is exposed, use a registered deep link (`xcrun simctl openurl <udid> '<scheme>://<route>'`) instead of guessing coordinates. If neither exists, **report the accessibility blocker** — blind coordinate tapping produces false verification.
4. If a gesture is unreliable, return to a known route or relaunch rather than switching to desktop automation.

## Step 5: Capture evidence and logs

- Screenshot: `xcrun simctl io <udid> screenshot <file>.png` (or the MCP screenshot tool) at each key state and for the final proof.
- Logs, scoped to the app: `xcrun simctl spawn <udid> log stream --predicate 'subsystem CONTAINS "<bundle-id>"'` — start it only when diagnosing, stop it when done, summarize relevant errors instead of dumping unbounded output.

**Done when:** the flow's key states each have a screenshot showing the concrete expected content — not just any rendered screen.

## Step 6: Clean up what you own

Stop only log captures, debugger sessions, apps, and simulators **this session started** (`xcrun simctl shutdown <udid>` only if this session booted it). Leave pre-existing booted simulators and other sessions' streams alone. If the user may iterate, keep the simulator and app running and say so.

## Troubleshooting

- **`simctl` targets the wrong device** → you used `booted` with multiple simulators running; always pass the pinned UDID.
- **Launch succeeds but old behavior persists** → a stale install; check the app container path's timestamp, reinstall the fresh artifact, or rebuild if native code changed.
- **UI element not found** → re-snapshot first (references are snapshot-specific); then try a deep link; then report the accessibility gap.
- **App can't reach a local server** → the simulator shares the host network: use `127.0.0.1:<port>`, and confirm the server is actually listening on that port from its own output.
- **Build tools missing mid-task** → `xcode-select -p` and report; don't attempt partial verification.
