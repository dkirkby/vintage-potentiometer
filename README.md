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
  formatValue?: (value: number) => string;
  valueToPosition?: ValueToPosition;
  positionToValue?: PositionToValue;
  onChangeStart?: () => void;
  onChangeEnd?: (value: number) => void;
}
```

## Theming

```tsx
<Potentiometer className="red-knob" label="Tone" value={tone} onChange={setTone} />
```

```css
.red-knob {
  --pot-panel: #ded7c5;
  --pot-panel-highlight: #f5eedc;
  --pot-panel-edge: #a79b80;
  --pot-text: #2f2b25;
  --pot-knob-face: #542b25;
  --pot-knob-highlight: #74463d;
  --pot-knob-edge: #261511;
  --pot-indicator: #fff0c2;
  --pot-focus-ring: rgb(42 91 135 / 40%);
}
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

1. Replace the placeholder package name.
2. Add repository and author metadata if desired.
3. Run `npm run check`.
4. Run `npm pack --dry-run`.
5. Publish:

```bash
npm login
npm publish --access public
```

## License

MIT
