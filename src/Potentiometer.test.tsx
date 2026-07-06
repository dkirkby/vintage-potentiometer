import { useState } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Potentiometer } from "./Potentiometer";

describe("Potentiometer", () => {
  it("exposes slider semantics", () => {
    render(<Potentiometer label="Gain" value={5} min={0} max={10} step={1} onChange={() => undefined} />);
    const slider = screen.getByRole("slider", { name: "Gain" });
    expect(slider).toHaveAttribute("aria-valuemin", "0");
    expect(slider).toHaveAttribute("aria-valuemax", "10");
    expect(slider).toHaveAttribute("aria-valuenow", "5");
  });

  it("increments with ArrowUp", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Potentiometer label="Gain" value={5} min={0} max={10} step={1} onChange={onChange} />);
    const slider = screen.getByRole("slider", { name: "Gain" });
    slider.focus();
    await user.keyboard("{ArrowUp}");
    expect(onChange).toHaveBeenCalledWith(6);
  });

  it("supports a controlled value", async () => {
    const user = userEvent.setup();
    function Example() {
      const [value, setValue] = useState(2);
      return <Potentiometer label="Level" value={value} min={0} max={10} step={1} onChange={setValue} />;
    }
    render(<Example />);
    const slider = screen.getByRole("slider", { name: "Level" });
    slider.focus();
    await user.keyboard("{ArrowRight}");
    expect(slider).toHaveAttribute("aria-valuenow", "3");
  });

  it("clamps values at the maximum", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Potentiometer label="Gain" value={10} min={0} max={10} step={1} onChange={onChange} />);
    const slider = screen.getByRole("slider", { name: "Gain" });
    slider.focus();
    await user.keyboard("{ArrowUp}");
    expect(onChange).toHaveBeenCalledWith(10);
  });

  it("resets on double-click", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Potentiometer label="Tone" value={8} min={0} max={10} step={1} defaultValue={5} onChange={onChange} />);
    await user.dblClick(screen.getByRole("slider", { name: "Tone" }));
    expect(onChange).toHaveBeenCalledWith(5);
  });

  it("re-anchors instead of jumping when shift is toggled mid-drag", () => {
    const onChange = vi.fn();
    function Example() {
      const [value, setValue] = useState(50);
      return (
        <Potentiometer
          label="Level"
          value={value}
          onChange={next => {
            setValue(next);
            onChange(next);
          }}
          min={0}
          max={100}
          step={1}
          dragDistance={200}
        />
      );
    }
    render(<Example />);
    const slider = screen.getByRole("slider", { name: "Level" });

    fireEvent.pointerDown(slider, { pointerId: 1, clientY: 200, button: 0 });
    fireEvent.pointerMove(slider, { pointerId: 1, clientY: 150 });
    expect(onChange).toHaveBeenLastCalledWith(75);

    // Pressing shift with no further mouse movement must not change the value.
    fireEvent.pointerMove(slider, { pointerId: 1, clientY: 150, shiftKey: true });
    expect(onChange).toHaveBeenLastCalledWith(75);

    // Further movement should now apply the slow (shift) rate from the re-anchored point.
    fireEvent.pointerMove(slider, { pointerId: 1, clientY: 140, shiftKey: true });
    expect(onChange).toHaveBeenLastCalledWith(76);
  });
});
