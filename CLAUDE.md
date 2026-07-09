# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A single-component React library published to npm as `@dkirkby/vintage-potentiometer`. It exposes one component, `Potentiometer`: a controlled input with range-slider semantics rendered as a 1950s rotary knob. There is no application here beyond the demo used for local development.

## Commands

```bash
npm run dev          # Vite dev server serving index.html -> demo/main.tsx
npm run test         # Vitest in watch mode
npm run test:run     # Vitest once (CI-style)
npm run typecheck    # tsc --noEmit
npm run build        # Vite library build -> dist/
npm run check        # typecheck + test:run + build; also runs on prepublishOnly
```

Run a single test by file or name:

```bash
npx vitest run src/Potentiometer.test.tsx
npx vitest run -t "resets on double-click"
```

## Architecture

**Controlled-only component.** The parent owns `value` and receives requested changes via `onChange`; the component never stores the value in state. The only internal state is `dragging` (a boolean for cursor styling) plus refs for the active pointer drag and `latestValueRef` (the last value emitted, so `onChangeEnd` can report the final value without waiting for a re-render).

**Position/value indirection is the core abstraction.** All interaction math operates on a normalized *position* in `[0, 1]`, not on the value directly. `valueToPosition`/`positionToValue` convert between the two (linear by default; consumers pass log or other mappings). The pipeline for any user input is: input → position (or raw value) → `positionToValue` → `quantize` → `onChange`. `quantize` snaps to `step`, then rounds to the max decimal count of `min`/`step` to avoid floating-point drift (see `decimalPlaces`), then clamps to `[min, max]`. When adding a new interaction, feed it through `setPosition` (for drag-like input) or `setValue` (for absolute targets) rather than calling `onChange` directly, so quantization and clamping stay consistent.

**Rendering: only the indicator rotates.** The knob shell, its gradients, and highlights are stationary; a transparent `__rotor` layer holding just the `__indicator` mark is what gets `rotate(angle)`. This keeps the simulated lighting fixed while the pointer moves. `angle = -sweepDegrees/2 + position * sweepDegrees`. Tick marks are generated from `tickCount`, with major ticks at the two ends and the midpoint. Exception: when `scalloped` is true, the clip-path/outline/shadow paths (built by `buildScallopPath`) *also* rotate — by `scallopRotation`, offset from the indicator's `angle` by half a wedge so a flat ridge lines up with the indicator instead of a notch — since the notches are a physical feature of the knob itself, unlike the fixed lighting gradients.

**Invariants are enforced by throwing at render:** `max > min` and `step > 0`. Keep validation there rather than silently clamping bad props.

## Build & packaging

- `src/index.ts` is the library entry and imports `Potentiometer.css`. Vite (`vite-plugin-lib-inject-css` + `cssCodeSplit`) emits `dist/style.css` and wires the JS entry to load it, so **consumers get styles automatically** with no separate CSS import. Preserve this — don't move the CSS import out of the entry.
- `vite-plugin-dts` emits `.d.ts` files; `react`, `react-dom`, and `react/jsx-runtime` are externalized. The build is ES-module only.
- `dist/` and the `*.tgz` tarball are checked in but gitignored artifacts — regenerate with `npm run build` / `npm pack` rather than editing.
- Releases are automated: pushing a `vX.Y.Z` tag runs `.github/workflows/publish.yml`, which verifies the tag matches `package.json`'s version, then publishes via npm trusted publishing (OIDC, no token). See the README's "Publishing" section for the release steps and the manual/OTP fallback.

## Theming

Styling is entirely CSS custom properties (`--pot-*`) scoped under `.vintage-potentiometer`. Consumers theme by passing `className` and overriding the variables in their own rule (see `demo/demo.css` `.demo-red-knob` and the README). When adding visual features, expose them as `--pot-*` variables rather than hardcoded colors.

## Accessibility

The control has `role="slider"` with `aria-valuemin/max/now` and `aria-valuetext` (the `formatValue` output). Keyboard handling (arrows, shift-arrow for fine, PageUp/Down, Home/End) and `aria-disabled` live in `handleKeyDown`. Tests in `Potentiometer.test.tsx` assert these semantics via `getByRole("slider", ...)` — extend them there when changing interaction behavior.
