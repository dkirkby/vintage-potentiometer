import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { Potentiometer } from "../src";

interface PlaygroundConfig {
  min: number;
  max: number;
  step: number;
  defaultValue: number;
  size: number;
  sweepDegrees: number;
  dragDistance: number;
  tickCount: number;
  disabled: boolean;
  decimals: number;
  showLabel: boolean;
  showValue: boolean;
  scalloped: boolean;
  scallopCount: number;
  scallopFlat: number;
  scallopRadius: number;
}

const DEFAULT_CONFIG: PlaygroundConfig = {
  min: 0,
  max: 100,
  step: 1,
  defaultValue: 50,
  size: 160,
  sweepDegrees: 270,
  dragDistance: 180,
  tickCount: 11,
  disabled: false,
  decimals: 0,
  showLabel: true,
  showValue: true,
  scalloped: false,
  scallopCount: 10,
  scallopFlat: 0.25,
  scallopRadius: 0.5
};

interface ThemeConfig {
  panel: string;
  knobFace: string;
  indicator: string;
  lightAngle: number;
  labelFontFamily: string;
  valueFontFamily: string;
  labelFontSize: number;
  valueFontSize: number;
  gap: number;
}

const DEFAULT_THEME: ThemeConfig = {
  panel: "#e7ddc4",
  knobFace: "#302e28",
  indicator: "#eee1bd",
  lightAngle: -35,
  labelFontFamily: "",
  valueFontFamily: "",
  labelFontSize: 0,
  valueFontSize: 0,
  gap: 0
};

// Empty string / 0 mean "unset" here, so the component's own auto-scaling
// default (proportional to size) applies instead of a fixed value.
const FONT_FAMILY_OPTIONS = [
  { label: "Default", value: "" },
  { label: "Serif", value: "Georgia, 'Times New Roman', serif" },
  { label: "Monospace", value: "'Courier New', monospace" },
  { label: "Sans", value: "'Trebuchet MS', sans-serif" }
];

type ThemeStyle = CSSProperties & Record<`--pot-${string}`, string>;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function parseNumber(raw: string, previous: number): number {
  const parsed = Number(raw);
  return Number.isNaN(parsed) ? previous : parsed;
}

export function Playground() {
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [theme, setTheme] = useState(DEFAULT_THEME);
  const [value, setValue] = useState(DEFAULT_CONFIG.defaultValue);
  const [log, setLog] = useState<string[]>([]);

  // Guard against invalid combinations (e.g. max <= min) while the user is
  // mid-edit, so the live preview never hits the component's invariant checks.
  const safeMin = config.min;
  const safeMax = config.max > config.min ? config.max : config.min + 1;
  const safeStep = config.step > 0 ? config.step : 1;

  useEffect(() => {
    setValue(current => clamp(current, safeMin, safeMax));
  }, [safeMin, safeMax]);

  function updateConfig<K extends keyof PlaygroundConfig>(key: K, next: PlaygroundConfig[K]): void {
    setConfig(previous => ({ ...previous, [key]: next }));
  }

  function appendLog(message: string): void {
    setLog(previous => [message, ...previous].slice(0, 6));
  }

  function resetAll(): void {
    setConfig(DEFAULT_CONFIG);
    setTheme(DEFAULT_THEME);
    setValue(DEFAULT_CONFIG.defaultValue);
    setLog([]);
  }

  const themeStyle: ThemeStyle = {
    "--pot-panel": theme.panel,
    "--pot-knob-face": theme.knobFace,
    "--pot-indicator": theme.indicator,
    "--pot-light-angle": `${theme.lightAngle}deg`,
    ...(theme.labelFontFamily && { "--pot-label-font-family": theme.labelFontFamily }),
    ...(theme.valueFontFamily && { "--pot-value-font-family": theme.valueFontFamily }),
    ...(theme.labelFontSize > 0 && { "--pot-label-font-size": `${theme.labelFontSize}px` }),
    ...(theme.valueFontSize > 0 && { "--pot-value-font-size": `${theme.valueFontSize}px` }),
    ...(theme.gap > 0 && { "--pot-gap": `${theme.gap}px` })
  };

  const formatValue = (v: number) => v.toFixed(config.decimals);

  const snippet = useMemo(() => {
    const props = [
      `label="Playground"`,
      `value={${formatValue(value)}}`,
      `onChange={setValue}`,
      `min={${safeMin}}`,
      `max={${safeMax}}`,
      `step={${safeStep}}`,
      `defaultValue={${config.defaultValue}}`,
      config.size !== DEFAULT_CONFIG.size ? `size={${config.size}}` : null,
      config.sweepDegrees !== DEFAULT_CONFIG.sweepDegrees ? `sweepDegrees={${config.sweepDegrees}}` : null,
      config.dragDistance !== DEFAULT_CONFIG.dragDistance ? `dragDistance={${config.dragDistance}}` : null,
      config.tickCount !== DEFAULT_CONFIG.tickCount ? `tickCount={${config.tickCount}}` : null,
      config.disabled ? `disabled` : null,
      !config.showLabel ? `showLabel={false}` : null,
      !config.showValue ? `showValue={false}` : null,
      config.scalloped ? `scalloped` : null,
      config.scalloped && config.scallopCount !== DEFAULT_CONFIG.scallopCount ? `scallopCount={${config.scallopCount}}` : null,
      config.scalloped && config.scallopFlat !== DEFAULT_CONFIG.scallopFlat ? `scallopFlat={${config.scallopFlat}}` : null,
      config.scalloped && config.scallopRadius !== DEFAULT_CONFIG.scallopRadius ? `scallopRadius={${config.scallopRadius}}` : null,
      config.decimals > 0 ? `formatValue={value => value.toFixed(${config.decimals})}` : null
    ].filter((line): line is string => line !== null);
    return `<Potentiometer\n  ${props.join("\n  ")}\n/>`;
  }, [config, safeMin, safeMax, safeStep, value]);

  return (
    <section className="playground">
      <h2>Playground</h2>
      <p className="demo-subtitle">Adjust any prop below, then drag, use the keyboard, or double-click the knob.</p>

      <div className="playground-layout">
        <div className="playground-preview">
          <Potentiometer
            label="Playground"
            value={value}
            onChange={setValue}
            min={safeMin}
            max={safeMax}
            step={safeStep}
            defaultValue={config.defaultValue}
            size={config.size}
            sweepDegrees={config.sweepDegrees}
            dragDistance={config.dragDistance}
            tickCount={config.tickCount}
            disabled={config.disabled}
            showLabel={config.showLabel}
            showValue={config.showValue}
            scalloped={config.scalloped}
            scallopCount={config.scallopCount}
            scallopFlat={config.scallopFlat}
            scallopRadius={config.scallopRadius}
            style={themeStyle}
            formatValue={formatValue}
            onChangeStart={() => appendLog("onChangeStart")}
            onChangeEnd={next => appendLog(`onChangeEnd(${formatValue(next)})`)}
          />
        </div>

        <form className="playground-controls" onSubmit={event => event.preventDefault()}>
          <label>
            min
            <input
              type="number"
              value={config.min}
              onChange={event => updateConfig("min", parseNumber(event.target.value, config.min))}
            />
          </label>
          <label>
            max
            <input
              type="number"
              value={config.max}
              onChange={event => updateConfig("max", parseNumber(event.target.value, config.max))}
            />
          </label>
          <label>
            step
            <input
              type="number"
              step="any"
              value={config.step}
              onChange={event => updateConfig("step", parseNumber(event.target.value, config.step))}
            />
          </label>
          <label>
            defaultValue
            <input
              type="number"
              value={config.defaultValue}
              onChange={event => updateConfig("defaultValue", parseNumber(event.target.value, config.defaultValue))}
            />
          </label>
          <label>
            decimals
            <input
              type="number"
              min={0}
              max={6}
              value={config.decimals}
              onChange={event => updateConfig("decimals", clamp(parseNumber(event.target.value, config.decimals), 0, 6))}
            />
          </label>
          <label>
            size ({config.size}px)
            <input
              type="range"
              min={64}
              max={256}
              value={config.size}
              onChange={event => updateConfig("size", Number(event.target.value))}
            />
          </label>
          <label>
            sweepDegrees ({config.sweepDegrees}&deg;)
            <input
              type="range"
              min={90}
              max={350}
              value={config.sweepDegrees}
              onChange={event => updateConfig("sweepDegrees", Number(event.target.value))}
            />
          </label>
          <label>
            dragDistance ({config.dragDistance}px)
            <input
              type="range"
              min={40}
              max={400}
              value={config.dragDistance}
              onChange={event => updateConfig("dragDistance", Number(event.target.value))}
            />
          </label>
          <label>
            tickCount ({config.tickCount})
            <input
              type="range"
              min={2}
              max={25}
              value={config.tickCount}
              onChange={event => updateConfig("tickCount", Number(event.target.value))}
            />
          </label>
          <label className="playground-checkbox">
            <input
              type="checkbox"
              checked={config.disabled}
              onChange={event => updateConfig("disabled", event.target.checked)}
            />
            disabled
          </label>
          <label className="playground-checkbox">
            <input
              type="checkbox"
              checked={config.showLabel}
              onChange={event => updateConfig("showLabel", event.target.checked)}
            />
            showLabel
          </label>
          <label className="playground-checkbox">
            <input
              type="checkbox"
              checked={config.showValue}
              onChange={event => updateConfig("showValue", event.target.checked)}
            />
            showValue
          </label>
          <label className="playground-checkbox">
            <input
              type="checkbox"
              checked={config.scalloped}
              onChange={event => updateConfig("scalloped", event.target.checked)}
            />
            scalloped
          </label>
          <label>
            scallopCount ({config.scallopCount})
            <input
              type="range"
              min={2}
              max={24}
              value={config.scallopCount}
              onChange={event => updateConfig("scallopCount", Number(event.target.value))}
            />
          </label>
          <label>
            scallopFlat ({config.scallopFlat.toFixed(2)})
            <input
              type="range"
              min={0}
              max={0.9}
              step={0.05}
              value={config.scallopFlat}
              onChange={event => updateConfig("scallopFlat", Number(event.target.value))}
            />
          </label>
          <label>
            scallopRadius ({config.scallopRadius.toFixed(2)})
            <input
              type="range"
              min={0.2}
              max={1}
              step={0.02}
              value={config.scallopRadius}
              onChange={event => updateConfig("scallopRadius", Number(event.target.value))}
            />
          </label>

          <fieldset className="playground-theme">
            <legend>Theme</legend>
            <label>
              panel
              <input type="color" value={theme.panel} onChange={event => setTheme(previous => ({ ...previous, panel: event.target.value }))} />
            </label>
            <label>
              knob
              <input type="color" value={theme.knobFace} onChange={event => setTheme(previous => ({ ...previous, knobFace: event.target.value }))} />
            </label>
            <label>
              indicator
              <input type="color" value={theme.indicator} onChange={event => setTheme(previous => ({ ...previous, indicator: event.target.value }))} />
            </label>
            <label>
              light angle ({theme.lightAngle}&deg;)
              <input
                type="range"
                min={-180}
                max={180}
                value={theme.lightAngle}
                onChange={event => setTheme(previous => ({ ...previous, lightAngle: Number(event.target.value) }))}
              />
            </label>
          </fieldset>

          <fieldset className="playground-theme">
            <legend>Typography &amp; spacing</legend>
            <label>
              label font
              <select
                value={theme.labelFontFamily}
                onChange={event => setTheme(previous => ({ ...previous, labelFontFamily: event.target.value }))}
              >
                {FONT_FAMILY_OPTIONS.map(option => <option key={option.label} value={option.value}>{option.label}</option>)}
              </select>
            </label>
            <label>
              value font
              <select
                value={theme.valueFontFamily}
                onChange={event => setTheme(previous => ({ ...previous, valueFontFamily: event.target.value }))}
              >
                {FONT_FAMILY_OPTIONS.map(option => <option key={option.label} value={option.value}>{option.label}</option>)}
              </select>
            </label>
            <label>
              label size ({theme.labelFontSize > 0 ? `${theme.labelFontSize}px` : "auto"})
              <input
                type="range"
                min={0}
                max={40}
                value={theme.labelFontSize}
                onChange={event => setTheme(previous => ({ ...previous, labelFontSize: Number(event.target.value) }))}
              />
            </label>
            <label>
              value size ({theme.valueFontSize > 0 ? `${theme.valueFontSize}px` : "auto"})
              <input
                type="range"
                min={0}
                max={40}
                value={theme.valueFontSize}
                onChange={event => setTheme(previous => ({ ...previous, valueFontSize: Number(event.target.value) }))}
              />
            </label>
            <label>
              gap ({theme.gap > 0 ? `${theme.gap}px` : "auto"})
              <input
                type="range"
                min={0}
                max={48}
                value={theme.gap}
                onChange={event => setTheme(previous => ({ ...previous, gap: Number(event.target.value) }))}
              />
            </label>
          </fieldset>

          <button type="button" className="playground-reset" onClick={resetAll}>
            Reset to defaults
          </button>
        </form>
      </div>

      <div className="playground-output">
        <pre className="playground-snippet"><code>{snippet}</code></pre>
        <div className="playground-log">
          <strong>Events</strong>
          <ul>
            {log.length === 0 && <li className="playground-log-empty">Drag the knob to see onChangeStart/onChangeEnd fire.</li>}
            {log.map((entry, index) => <li key={index}>{entry}</li>)}
          </ul>
        </div>
      </div>
    </section>
  );
}
