import { useState } from "react";
import { Potentiometer, type PositionToValue, type ValueToPosition } from "../src";
import { Playground } from "./Playground";

const logValueToPosition: ValueToPosition = (value, min, max) =>
  Math.log(value / min) / Math.log(max / min);
const logPositionToValue: PositionToValue = (position, min, max) =>
  min * Math.pow(max / min, position);

export function Demo() {
  const [gain, setGain] = useState(5);
  const [frequency, setFrequency] = useState(1000);
  const [tone, setTone] = useState(0);

  return (
    <main className="demo-panel">
      <h1>Vintage Potentiometer</h1>
      <p className="demo-subtitle">Hold <kbd>Shift</kbd> while dragging or pressing an arrow key for fine adjustment. Page Up/Down changes by 10% of the range; Home/End selects the limits.</p>

      <Playground />

      <hr className="demo-divider" />

      <h2>Examples</h2>
      <section className="demo-controls">
        <Potentiometer label="Gain" value={gain} onChange={setGain} min={0} max={10} step={0.1} defaultValue={5} formatValue={value => value.toFixed(1)} />
        <Potentiometer label="Frequency" value={frequency} onChange={setFrequency} min={100} max={5000} step={10} defaultValue={1000} valueToPosition={logValueToPosition} positionToValue={logPositionToValue} formatValue={value => `${Math.round(value)} Hz`} />
        <Potentiometer className="demo-red-knob" label="Tone" value={tone} onChange={setTone} min={-10} max={10} step={1} defaultValue={0} formatValue={value => `${value > 0 ? "+" : ""}${value}`} />
      </section>
      <output className="demo-readout">
        gain = {gain.toFixed(1)}<br />
        frequency = {Math.round(frequency)} Hz<br />
        tone = {tone > 0 ? "+" : ""}{tone}
      </output>
    </main>
  );
}
