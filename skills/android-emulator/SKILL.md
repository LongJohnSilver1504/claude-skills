---
name: android-emulator
description: Launch, install, drive, and capture Android apps on an emulator or attached device through adb with one explicit serial — installs, deep links, adb reverse networking, uiautomator-based semantic UI driving, screenshots, scoped logcat. Use when a task needs Android runtime verification: launching an APK or dev client, driving Android UI, wiring a local bundler/backend to the emulator, capturing screenshots or logs — "run it on Android", "test on the emulator", "adb". NOT for iOS (ios-simulator) or desktop apps (computer-use).
---

# Android Emulator

Operate Android emulators and devices through `adb` with an explicit serial and evidence-based verification. For the full mobile verification workflow (platform choice, bundler lifecycle, backend wiring), this skill is driven by `/test-mobile-app`.

## Step 1: Confirm availability

Locate the SDK: `adb` on `PATH` or `$ANDROID_HOME/platform-tools/adb`. List targets: `adb devices` (running) and `emulator -list-avds` (bootable). If no SDK, emulator, or device exists, **report the missing prerequisite — never claim Android verification without a target.**

## Step 2: Pin one serial

1. Pick ONE serial from `adb devices`. Prefer an emulator that is already running; boot one only when needed: `emulator -avd <name>` as a background process this session then owns.
2. Pass `-s <serial>` on **every** adb command — with more than one device attached, bare `adb` fails or hits the wrong target.
3. Never stop, erase, or reconfigure an emulator another task owns.

**Done when:** `adb -s <serial> shell getprop sys.boot_completed` prints `1`.

## Step 3: Install or reuse, then launch

- Check presence: `adb -s <serial> shell pm path <package>` — presence proves the right variant, not native compatibility; reinstall after native changes.
- Install: `adb -s <serial> install -r <path.apk>`.
- Launch: `adb -s <serial> shell am start -W -n <package>/<activity>`, or by deep link:
  ```bash
  adb -s <serial> shell am start -W -a android.intent.action.VIEW -d '<scheme>://<route>' <package>
  ```

After launch, capture a screenshot before interacting — a foregrounded window alone is not evidence the intended app and screen loaded.

## Step 4: Wire networking

- The emulator reaches the host's loopback at `10.0.2.2`, **not** `127.0.0.1`.
- For a bundler or backend that must appear on-device at `localhost`, add `adb -s <serial> reverse tcp:<port> tcp:<port>` — and record it for removal at cleanup.
- Physical devices: no `10.0.2.2`; use `adb reverse` or the host's LAN address with the server bound to `0.0.0.0`.

## Step 5: Drive the UI semantically

1. Prefer semantic automation the session already exposes (an Android MCP/driver). Otherwise dump the hierarchy:
   ```bash
   adb -s <serial> shell uiautomator dump && adb -s <serial> shell cat /sdcard/window_dump.xml
   ```
2. Target stable `resource-id`, `content-desc`, or `text` attributes; compute tap points from that node's `bounds` — never from guessed screen positions.
3. Act with scoped inputs: `input tap <x> <y>`, `input text '<value>'`, `input keyevent <code>`, `input swipe ...`.
4. Re-dump after every navigation or layout change; stale bounds produce false taps. Prefer a deep link over multi-step blind navigation.

## Step 6: Capture evidence and logs

- Screenshot: `adb -s <serial> exec-out screencap -p > <file>.png` at each key state and for the final proof.
- Logs, scoped to the app: `adb -s <serial> logcat -d --pid $(adb -s <serial> shell pidof -s <package>)` — summarize relevant errors, don't dump unbounded logcat.

**Done when:** the flow's key states each have a screenshot showing the concrete expected content — real data, not an empty or disconnected shell.

## Step 7: Clean up what you own

- Remove reverse rules this session added: `adb -s <serial> reverse --remove tcp:<port>`.
- Stop the emulator **only if this session booted it**: `adb -s <serial> emu kill`. Leave pre-existing emulators running.
- If the user may iterate, keep the emulator, app, and wiring alive and say so.

## Troubleshooting

- **`more than one device/emulator`** → you dropped `-s <serial>`; add it everywhere.
- **App can't reach the bundler** → verify `adb reverse --list` shows the exact port, then relaunch via the dev-client URL/deep link.
- **App can't reach the backend** → use `10.0.2.2` on emulators, never `127.0.0.1`; confirm the backend port from its own output.
- **Device shows `offline`/`unauthorized`** → accept the device's USB-debugging prompt; `adb reconnect` only as a last resort — `adb kill-server` disrupts every other adb session on the machine.
- **Taps land on nothing** → the dump is stale; re-dump and recompute bounds, or use a deep link.
- **`INSTALL_FAILED_UPDATE_INCOMPATIBLE`** → signature mismatch with the installed build; uninstall that package first (only if this test owns it).
