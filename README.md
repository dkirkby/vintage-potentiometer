# Vintage Potentiometer

An accessible, controlled React input that behaves like a range slider but looks like a 1950s-era potentiometer knob.

The component supports mouse, pen, and touch dragging; keyboard control; custom value mappings; double-click reset; ARIA slider semantics; and CSS-variable theming.

## Requirements

- React 18 or later
- React DOM 18 or later
- For package development: Node.js 20.19+ or 22.12+

## Installation

Consumers install the published package with:

```bash
npm install @dkirkby/vintage-potentiometer
```

The stylesheet is imported automatically by the package entry point. Consumers do not need a separate CSS import.

## Basic usage

```tsx
import { useState } from "react";
import { Potentiometer } from "@dkirkby/vintage-potentiometer";

export function GainControl() {
  const [gain, setGain] = useState(5);

  return (
    <Potentiometer
      label="Gain"
      value={gain}
      onChange={setGain}
      min={0}
      max={10}
      step={0.1}
      defaultValue={5}
      formatValue={value => value.toFixed(1)}
    />
  );
}
```

The component is controlled: the parent owns `value`, and `onChange` reports the requested new value.

## Logarithmic values

```tsx
import {
  Potentiometer,
  type PositionToValue,
  type ValueToPosition
} from "@dkirkby/vintage-potentiometer";

const logValueToPosition: ValueToPosition = (value, min, max) =>
  Math.log(value / min) / Math.log(max / min);

const logPositionToValue: PositionToValue = (position, min, max) =>
  min * Math.pow(max / min, position);

<Potentiometer
  label="Frequency"
  value={frequency}
  onChange={setFrequency}
  min={100}
  max={5000}
  step={10}
  valueToPosition={logValueToPosition}
  positionToValue={logPositionToValue}
  formatValue={value => `${Math.round(value)} Hz`}
/>;
```

Custom mapping functions map values to normalized positions in `[0, 1]`, and positions back to values in `[min, max]`.

## Interaction

| Action | Result |
|---|---|
| Drag upward/downward | Increase/decrease |
| Shift + drag | Fine adjustment |
| Arrow keys | Change by `step` |
| Shift + arrow | Change by `step / 10` |
| Page Up/Down (Mac: Fn + Up/Down) | Change by about 10% of the range |
| Home/End (Mac: Fn + Left/Right) | Select minimum/maximum |
| Double-click | Restore `defaultValue` |

## Important props

```ts
interface PotentiometerProps {
  value: number;
  onChange: (value: number) => void;
  label: string;
  min?: number;
  max?: number;
  step?: number;
  defaultValue?: number;
  size?: number;
  disabled?: boolean;
  sweepDegrees?: number;
  dragDistance?: number;
  tickCount?: number;
  className?: string;
  style?: CSSProperties;
  showLabel?: boolean;
  showValue?: boolean;
  scalloped?: boolean;
  scallopCount?: number;
  scallopFlat?: number;
  scallopRadius?: number;
  formatValue?: (value: number) => string;
  valueToPosition?: ValueToPosition;
  positionToValue?: PositionToValue;
  onChangeStart?: () => void;
  onChangeEnd?: (value: number) => void;
}
```

`showLabel` and `showValue` (both default `true`) toggle the visible label row and value readout independently; the surrounding layout collapses to fit whatever is still shown, rather than leaving empty space. `label` is still required even when `showLabel` is `false` — it's used as the slider's `aria-label` so the control stays accessible without a visible label.

`scalloped` (default `false`) gives the knob a fluted edge, made of `scallopCount` (default `10`) concave notches cut into the plain circle, like a vintage Bakelite knob, colored to match `--pot-knob-edge` so it follows theming automatically. Each notch spans `1 - scallopFlat` of its `360 / scallopCount` wedge (the rest stays a flat circular arc); `scallopFlat` defaults to `0.25`. `scallopRadius` (default `0.5`) sets each notch's radius of curvature as a multiple of the knob's plain radius — smaller values cut deeper, sharper notches; it's floored automatically at whatever minimum is geometrically possible for the current `scallopCount`/`scallopFlat` so the shape never becomes invalid.

## Theming

Only `--pot-panel`, `--pot-knob-face`, `--pot-text`, `--pot-indicator`, and `--pot-focus-ring` need to be set — the panel/knob highlight and edge tones are derived from `--pot-panel` and `--pot-knob-face` automatically (via `color-mix()`), so a single base color still renders a coherent lit/shaded surface:

```tsx
<Potentiometer className="red-knob" label="Tone" value={tone} onChange={setTone} />
```

```css
.red-knob {
  --pot-panel: #542b25;
  --pot-knob-face: #74463d;
  --pot-indicator: #fff0c2;
}
```

Set `--pot-panel-highlight`, `--pot-panel-edge`, `--pot-knob-highlight`, or `--pot-knob-edge` directly to override any of the derived tones with an exact color instead.

`--pot-light-angle` (default `-35deg`, 0deg is straight above, increasing clockwise) controls the simulated light direction — it repositions the highlight on the panel and knob gradients and the direction their inset/drop shadows fall:

```css
.red-knob {
  --pot-light-angle: 120deg; /* light from the lower right */
}
```

`--pot-label-font-family` and `--pot-value-font-family` set the label and value readout typefaces. `--pot-label-font-size`, `--pot-value-font-size`, and `--pot-gap` (the spacing between the label, knob, and value) are also optional — left unset, they scale proportionally with `size` instead of a fixed default, so a larger or smaller knob keeps its text and spacing in proportion:

```css
.red-knob {
  --pot-label-font-family: Georgia, serif;
  --pot-value-font-size: 1rem; /* fixed instead of scaling with size */
}
```

`--pot-indicator-width` and `--pot-knob-border-width` are optional too, following the same pattern, but clamped with a floor (and a ceiling) rather than scaling all the way down to nothing at small sizes or up indefinitely at large ones.

For colors computed at runtime (e.g. a live theme picker), set the same custom properties via `style` instead — the values must land on the component's own root element, so an ancestor element's `style` will not work:

```tsx
<Potentiometer
  label="Tone"
  value={tone}
  onChange={setTone}
  style={{ "--pot-panel": panelColor, "--pot-knob-face": knobColor } as CSSProperties}
/>
```

Deriving the highlight/edge tones and light angle relies on `color-mix()` and the CSS trig functions (`sin()`/`cos()`), both supported in current versions of Chrome, Firefox, Safari, and Edge (roughly 2023 or later).

## Using it in an Observable notebook

Use **[Observable Framework](https://observablehq.com/framework/)** (the static-site builder), not a classic notebook (observablehq.com). Framework does a real build (Vite) with actual npm dependency resolution, so `react`/`react-dom` get deduped the normal way, like any bundler-based app. Classic notebooks have no real dependency graph — importing a compiled React component library through ad-hoc CDN imports there is prone to loading two separate copies of React and hitting "invalid hook call"-style failures, and isn't a reliable path for this package.

Framework supports JSX fenced code blocks with React/ReactDOM available by default:

````md
```jsx
import {Potentiometer} from "npm:@dkirkby/vintage-potentiometer";

function Gain() {
  const [gain, setGain] = React.useState(5);
  return <Potentiometer label="Gain" value={gain} onChange={setGain} min={0} max={10} step={0.1} />;
}
display(<Gain />);
```
````

If the stylesheet doesn't load automatically, add it explicitly as plain HTML in the page:

```html
<link rel="stylesheet" href="npm:@dkirkby/vintage-potentiometer/dist/style.css">
```

## Development

```bash
npm install
npm run dev
```

Other commands:

```bash
npm run test:run
npm run typecheck
npm run build
npm run check
```

The build output is written to `dist/`. Since `src/index.ts` imports `Potentiometer.css`, Vite emits `dist/style.css` and consuming bundlers load it automatically through the JavaScript entry point.

## Testing the packed package

```bash
npm pack --dry-run
npm pack
```

Install the generated tarball in a separate React app before publishing.

## Publishing

Releases are automated: pushing a `vX.Y.Z` tag triggers `.github/workflows/publish.yml`, which runs `npm run check` (via `prepublishOnly`) and publishes via npm's trusted publishing (OIDC) — no token, no manual `npm login`.

1. Bump the version and tag it:

```bash
npm version patch   # or minor / major, or an explicit x.y.z
git push --follow-tags
```

2. Watch the **Actions** tab on GitHub for the `publish.yml` run — it verifies the pushed tag matches `package.json`'s version before publishing, so a mismatch fails loudly instead of publishing the wrong thing.

This relies on a trusted publisher already configured on npmjs.com for this package (Settings → Trusted Publisher: organization/user `dkirkby`, repository `vintage-potentiometer`, workflow filename `publish.yml`), which itself requires the package to already exist on the registry — npm can't configure trusted publishing before a package's first release. If CI is unavailable, or you're bootstrapping a brand new package for the first time, fall back to publishing manually:

```bash
npm run check
npm pack --dry-run
npm login
npm publish --access public --otp=<code from your authenticator app>
```

## License

MIT
