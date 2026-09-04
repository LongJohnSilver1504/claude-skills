# Gestures and springs

An interface feels alive when motion starts from the current on-screen value, inherits the user's velocity, projects momentum forward, and can be grabbed and reversed at any instant. Springs make that natural because they are interruptible and velocity-aware.

## Respond on pointer-down

Highlight on press, not on release; feedback continuous *during* a drag, never only at its end. Audit every debounce, timer and transition wait on the input path — the moment lag appears, directness falls off a cliff.

## 1:1 tracking

```js
el.addEventListener("pointerdown", (e) => {
  el.setPointerCapture(e.pointerId);                              // tracking survives leaving the bounds
  const grabOffset = e.clientY - el.getBoundingClientRect().top;  // respect where they grabbed
  // keep a short position + timestamp history for release velocity
});
```

Ignore additional touch points once a drag began (`if (isDragging) return`), or switching fingers jumps the element. Set `transform` on the dragged element directly, never through a CSS variable on the parent.

## Interruptibility

Never lock out input during a transition. Animate from the *presentation* (live on-screen) value, never from the logical target — starting from the target causes a visible jump. Avoid CSS transitions and keyframes for gesture-driven motion; a spring re-targets from the current value and velocity. Decompose 2D motion into independent X and Y springs.

## Spring parameters

Think in Apple's two dials rather than the physics triplet:

- **Damping ratio** — `1.0` is critically damped (no overshoot); below `1.0` bounces. Default `1.0` for most UI; `~0.8` only when the gesture itself carried momentum (a flick, a throw, a drag release).
- **Response** — how fast it reaches the target, in seconds (`0.3–0.4` typical). Not a duration; a spring has none.

| Interaction | Damping | Response |
| --- | --- | --- |
| Move / reposition | 1.0 | 0.4 |
| Rotation | 0.8 | 0.4 |
| Drawer / sheet | 0.8 | 0.3 |

Motion's `bounce` + `duration` API maps closely:

```js
animate(el, { y: 0 }, { type: "spring", bounce: 0, duration: 0.4 });      // critically damped default
animate(el, { y: target }, { type: "spring", bounce: 0.2, duration: 0.4 }); // after a flick
```

Traditional form for more control: `{ type: "spring", mass: 1, stiffness: 100, damping: 10 }`.

## Velocity handoff

Pass the pointer's release velocity as the spring's initial velocity so there is no seam between dragging and animating. Motion takes px/s directly (`velocity`); APIs wanting relative velocity take `gestureVelocity / (target − current)`.

## Momentum projection

Don't snap to the nearest boundary from the release point; project where the gesture is *going* and snap from there:

```js
function project(velocityPxPerSec, decelerationRate = 0.998) {
  return (velocityPxPerSec / 1000) * decelerationRate / (1 - decelerationRate);
}
const target = nearestSnapPoint(current + project(releaseVelocity));
animateSpringTo(target, { velocity: releaseVelocity });
```

Use the velocity **sign** to decide reverse-vs-commit, not the position.

## Dismiss on a flick

```js
const velocity = Math.abs(swipeAmount) / elapsedMs;
if (Math.abs(swipeAmount) >= SWIPE_THRESHOLD || velocity > 0.11) dismiss();
```

## Rubber-banding

Resist progressively at a boundary instead of stopping hard:

```js
function rubberband(overshoot, dimension, constant = 0.55) {
  return (overshoot * dimension * constant) / (dimension + constant * Math.abs(overshoot));
}
```

## Spatial consistency

Enter and exit along the same path; anchor menus and sheets to their trigger; hint the destination with the intermediate frames (a sheet grows toward the finger). Mirror the easing on reversible transitions.

## Gesture details

- Tap: highlight on touch-down, commit on touch-up, ~10px hysteresis, cancel by dragging away and back.
- Drag: ~10px movement threshold before committing to a direction, then 1:1.
- Detect plausible gestures in parallel from the first move; cancel the losers once intent is clear.
- Pay the double-tap disambiguation delay only where double-tap exists.
- `touch-action: none` only on the surface that owns the gesture.

## Reduced motion and materials

Under `prefers-reduced-motion`, springs and slides become ≤200ms opacity cross-fades; drop overshoot, parallax and autoplay. Avoid slow loops near 0.2 Hz and abrupt brightness jumps. Under `prefers-reduced-transparency`, translucent surfaces go frosty or solid. Multimodal feedback (sound, haptics) fires on the same frame as the visual, on the causal event, and only where it earns its place.
