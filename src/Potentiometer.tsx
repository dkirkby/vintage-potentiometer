import {
  type KeyboardEvent,
  type PointerEvent,
  useId,
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
    <div className={rootClassName} style={{ width: size }}>
      <div id={`${id}-label`} className="vintage-potentiometer__label">{label}</div>
      <div
        className="vintage-potentiometer__control"
        style={{ width: size, height: size }}
        role="slider"
        tabIndex={disabled ? -1 : 0}
        aria-labelledby={`${id}-label`}
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
        <div className="vintage-potentiometer__knob-shell" aria-hidden="true">
          <div className="vintage-potentiometer__rotor" style={{ transform: `rotate(${angle}deg)` }}>
            <span className="vintage-potentiometer__indicator" />
          </div>
        </div>
      </div>
      <output className="vintage-potentiometer__value">{formatValue(value)}</output>
    </div>
  );
}
