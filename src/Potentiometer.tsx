import {
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
  useId,
  useMemo,
  useRef,
  useState
} from "react";

export type ValueToPosition = (
  value: number,
  min: number,
  max: number
) => number;

export type PositionToValue = (
  position: number,
  min: number,
  max: number
) => number;

export interface PotentiometerProps {
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

const linearValueToPosition: ValueToPosition = (value, min, max) =>
  max === min ? 0 : (value - min) / (max - min);

const linearPositionToValue: PositionToValue = (position, min, max) =>
  min + position * (max - min);

// Scalloped outline, built in objectBoundingBox (0..1) space: n concave
// notches cut into a circle of radius r, each spanning (1-f) of its 360/n
// wedge (the remaining f stays flat, at radius r). Each notch is the minor
// (inward-dipping) arc of a circle of radius R = radiusRatio * r, chosen so
// that circle passes through the two points bounding the notch on the
// r-circle: R must be at least r*sin(halfNotch) (half the chord length) for
// that circle to exist, so radiusRatio is clamped to sin(halfNotch) as a
// floor. SVG's arc command finds the matching circle center itself given the
// endpoints, radius, and flags, so no center coordinates are computed here.
function buildScallopPath(scallopCount: number, scallopFlat: number, scallopRadius: number, r: number): string {
  const n = Math.max(2, Math.round(scallopCount));
  const f = clamp(scallopFlat, 0, 1);
  const wedge = (2 * Math.PI) / n;
  const notchAngle = wedge * (1 - f);
  const halfNotch = notchAngle / 2;
  const radiusRatio = Math.max(scallopRadius, Math.sin(halfNotch));
  const R = r * radiusRatio;

  function point(radius: number, angle: number): string {
    const x = 0.5 + radius * Math.sin(angle);
    const y = 0.5 - radius * Math.cos(angle);
    return `${x.toFixed(5)},${y.toFixed(5)}`;
  }

  const commands: string[] = [];
  for (let i = 0; i < n; i++) {
    const center = i * wedge;
    const notchStart = point(r, center - halfNotch);
    const notchEnd = point(r, center + halfNotch);
    if (i === 0) commands.push(`M${notchStart}`);
    commands.push(`A${R.toFixed(5)},${R.toFixed(5)} 0 0,0 ${notchEnd}`);
    commands.push(`A${r},${r} 0 0,1 ${point(r, center + wedge - halfNotch)}`);
  }
  commands.push("Z");
  return commands.join(" ");
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function decimalPlaces(value: number): number {
  const text = value.toString().toLowerCase();
  if (text.includes("e-")) {
    const [coefficient, exponentText] = text.split("e-");
    return Number(exponentText) + (coefficient.split(".")[1]?.length ?? 0);
  }
  return text.split(".")[1]?.length ?? 0;
}

function quantize(value: number, min: number, max: number, step: number): number {
  const steps = Math.round((value - min) / step);
  const quantized = min + steps * step;
  const decimals = Math.max(decimalPlaces(min), decimalPlaces(step));
  return clamp(Number(quantized.toFixed(decimals)), min, max);
}

export function Potentiometer({
  value,
  onChange,
  label,
  min = 0,
  max = 100,
  step = 1,
  defaultValue,
  size = 128,
  disabled = false,
  sweepDegrees = 270,
  dragDistance = 180,
  tickCount = 11,
  className,
  style,
  showLabel = true,
  showValue = true,
  scalloped = false,
  scallopCount = 10,
  scallopFlat = 0.25,
  scallopRadius = 0.5,
  formatValue = value => String(value),
  valueToPosition = linearValueToPosition,
  positionToValue = linearPositionToValue,
  onChangeStart,
  onChangeEnd
}: PotentiometerProps) {
  if (!(max > min)) throw new Error("Potentiometer requires max to be greater than min.");
  if (!(step > 0)) throw new Error("Potentiometer requires step to be greater than zero.");

  const id = useId();
  const dragRef = useRef<{ pointerId: number; startY: number; startPosition: number; shiftKey: boolean } | null>(null);
  const latestValueRef = useRef(value);
  const [dragging, setDragging] = useState(false);

  latestValueRef.current = value;
  const position = clamp(valueToPosition(value, min, max), 0, 1);
  const startAngle = -sweepDegrees / 2;
  const angle = startAngle + position * sweepDegrees;
  // The clip path matches the plain knob-shell's own radius exactly (0.5,
  // since border-radius: 50% touches its box edges), so the flat sections
  // line up with an unscalloped knob. The outline path is drawn slightly
  // smaller so its stroke (centered on the path) lands at that same edge
  // without depending on the SVG clipping away the outer half of the stroke.
  const scallopClipPath = useMemo(
    () => buildScallopPath(scallopCount, scallopFlat, scallopRadius, 0.5),
    [scallopCount, scallopFlat, scallopRadius]
  );
  const scallopOutlinePath = useMemo(
    () => buildScallopPath(scallopCount, scallopFlat, scallopRadius, 0.4875),
    [scallopCount, scallopFlat, scallopRadius]
  );
  // buildScallopPath places a notch's center at angle 0, so rotating the
  // scallop shape by the same `angle` as the indicator would align it with a
  // notch. Offsetting by half a wedge instead centers the indicator on the
  // flat ridge between two notches.
  const scallopRotation = angle - 180 / scallopCount;

  function setPosition(nextPosition: number): void {
    const boundedPosition = clamp(nextPosition, 0, 1);
    const mappedValue = positionToValue(boundedPosition, min, max);
    const nextValue = quantize(mappedValue, min, max, step);
    latestValueRef.current = nextValue;
    onChange(nextValue);
  }

  function setValue(nextValue: number, quantizeStep: number = step): void {
    const quantizedValue = quantize(nextValue, min, max, quantizeStep);
    latestValueRef.current = quantizedValue;
    onChange(quantizedValue);
  }

  function handlePointerDown(event: PointerEvent<HTMLDivElement>): void {
    if (disabled || event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = { pointerId: event.pointerId, startY: event.clientY, startPosition: position, shiftKey: event.shiftKey };
    setDragging(true);
    onChangeStart?.();
    event.preventDefault();
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>): void {
    const drag = dragRef.current;
    if (disabled || drag === null || drag.pointerId !== event.pointerId) return;
    if (event.shiftKey !== drag.shiftKey) {
      // Re-anchor so the sensitivity change takes effect from here, not from
      // the original pointer-down point (which would rescale the whole
      // accumulated delta and cause a jump).
      drag.startY = event.clientY;
      drag.startPosition = position;
      drag.shiftKey = event.shiftKey;
    }
    const deltaY = drag.startY - event.clientY;
    const sensitivity = event.shiftKey ? 0.1 : 1;
    setPosition(drag.startPosition + (deltaY / dragDistance) * sensitivity);
  }

  function finishPointerDrag(event: PointerEvent<HTMLDivElement>): void {
    if (dragRef.current?.pointerId !== event.pointerId) return;
    dragRef.current = null;
    setDragging(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    onChangeEnd?.(latestValueRef.current);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>): void {
    if (disabled) return;
    const increment = event.shiftKey ? step / 10 : step;
    const pageIncrement = Math.max(step, (max - min) / 10);
    let nextValue: number | undefined;
    let quantizeStep = step;

    switch (event.key) {
      case "ArrowUp":
      case "ArrowRight": nextValue = value + increment; quantizeStep = increment; break;
      case "ArrowDown":
      case "ArrowLeft": nextValue = value - increment; quantizeStep = increment; break;
      case "PageUp": nextValue = value + pageIncrement; break;
      case "PageDown": nextValue = value - pageIncrement; break;
      case "Home": nextValue = min; break;
      case "End": nextValue = max; break;
      default: return;
    }

    setValue(nextValue, quantizeStep);
    event.preventDefault();
  }

  function handleDoubleClick(): void {
    if (!disabled && defaultValue !== undefined) setValue(defaultValue);
  }

  const rootClassName = [
    "vintage-potentiometer",
    dragging && "vintage-potentiometer--dragging",
    disabled && "vintage-potentiometer--disabled",
    className
  ].filter(Boolean).join(" ");

  const actualTickCount = Math.max(2, tickCount);

  return (
    <div className={rootClassName} style={{ ...style, width: size, "--pot-size": `${size}px` } as CSSProperties}>
      {showLabel && <div id={`${id}-label`} className="vintage-potentiometer__label">{label}</div>}
      <div
        className="vintage-potentiometer__control"
        style={{ width: size, height: size }}
        role="slider"
        tabIndex={disabled ? -1 : 0}
        aria-labelledby={showLabel ? `${id}-label` : undefined}
        aria-label={showLabel ? undefined : label}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-valuetext={formatValue(value)}
        aria-disabled={disabled}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={finishPointerDrag}
        onPointerCancel={finishPointerDrag}
        onKeyDown={handleKeyDown}
        onDoubleClick={handleDoubleClick}
      >
        <div className="vintage-potentiometer__scale" aria-hidden="true">
          {Array.from({ length: actualTickCount }, (_, index) => {
            const tickAngle = startAngle + (index / (actualTickCount - 1)) * sweepDegrees;
            const isMajor = index === 0 || index === actualTickCount - 1 || index === Math.floor((actualTickCount - 1) / 2);
            return (
              <span
                key={index}
                className={["vintage-potentiometer__tick", isMajor && "vintage-potentiometer__tick--major"].filter(Boolean).join(" ")}
                style={{ transform: `rotate(${tickAngle}deg)` }}
              />
            );
          })}
        </div>
        {scalloped && (
          <svg className="vintage-potentiometer__knob-shadow" viewBox="0 0 1 1" aria-hidden="true">
            <path d={scallopClipPath} transform={`rotate(${scallopRotation} 0.5 0.5)`} />
          </svg>
        )}
        {scalloped && (
          <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
            <defs>
              <clipPath id={`${id}-scallop`} clipPathUnits="objectBoundingBox">
                <path d={scallopClipPath} transform={`rotate(${scallopRotation} 0.5 0.5)`} />
              </clipPath>
            </defs>
          </svg>
        )}
        <div
          className="vintage-potentiometer__knob-shell"
          aria-hidden="true"
          style={scalloped ? { clipPath: `url(#${id}-scallop)` } : undefined}
        >
          <div className="vintage-potentiometer__rotor" style={{ transform: `rotate(${angle}deg)` }}>
            <span className="vintage-potentiometer__indicator" />
          </div>
        </div>
        {scalloped && (
          <svg className="vintage-potentiometer__knob-outline" viewBox="0 0 1 1" aria-hidden="true">
            <path d={scallopOutlinePath} transform={`rotate(${scallopRotation} 0.5 0.5)`} />
          </svg>
        )}
      </div>
      {showValue && <output className="vintage-potentiometer__value">{formatValue(value)}</output>}
    </div>
  );
}
