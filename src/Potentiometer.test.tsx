import { useState, type CSSProperties } from "react";
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

  it("forwards a style prop, merged onto its own root element", () => {
    const { container } = render(
      <Potentiometer
        label="Gain"
        value={5}
        min={0}
        max={10}
        step={1}
        size={64}
        onChange={() => undefined}
        style={{ "--pot-panel": "#123456" } as CSSProperties}
      />
    );
    const root = container.querySelector(".vintage-potentiometer") as HTMLElement;
    expect(root.style.getPropertyValue("--pot-panel")).toBe("#123456");
    expect(root.style.width).toBe("64px");
  });

  it("exposes the size prop as --pot-size for scaling font size and gap", () => {
    const { container } = render(
      <Potentiometer label="Gain" value={5} min={0} max={10} step={1} size={64} onChange={() => undefined} />
    );
    const root = container.querySelector(".vintage-potentiometer") as HTMLElement;
    expect(root.style.getPropertyValue("--pot-size")).toBe("64px");
  });

  it("hides the label row but keeps an accessible name via aria-label", () => {
    render(<Potentiometer label="Gain" value={5} min={0} max={10} step={1} showLabel={false} onChange={() => undefined} />);
    const slider = screen.getByRole("slider", { name: "Gain" });
    expect(slider).not.toHaveAttribute("aria-labelledby");
    expect(slider).toHaveAttribute("aria-label", "Gain");
    expect(screen.queryByText("Gain")).not.toBeInTheDocument();
  });

  it("omits the value readout element when showValue is false", () => {
    const { container } = render(
      <Potentiometer label="Gain" value={5} min={0} max={10} step={1} showValue={false} onChange={() => undefined} />
    );
    expect(container.querySelector(".vintage-potentiometer__value")).toBeNull();
  });

  it("omits the scalloped clip-path and outline by default", () => {
    const { container } = render(
      <Potentiometer label="Gain" value={5} min={0} max={10} step={1} onChange={() => undefined} />
    );
    expect(container.querySelector(".vintage-potentiometer__knob-outline")).toBeNull();
    const knobShell = container.querySelector(".vintage-potentiometer__knob-shell") as HTMLElement;
    expect(knobShell.style.clipPath).toBe("");
  });

  it("clips the knob shell and renders a matching outline when scalloped", () => {
    const { container } = render(
      <Potentiometer label="Gain" value={5} min={0} max={10} step={1} scalloped onChange={() => undefined} />
    );
    const knobShell = container.querySelector(".vintage-potentiometer__knob-shell") as HTMLElement;
    expect(knobShell.style.clipPath).toMatch(/^url\(#.+-scallop\)$/);
    const outline = container.querySelector(".vintage-potentiometer__knob-outline path");
    expect(outline).not.toBeNull();
    expect(container.querySelector("clipPath path")).not.toBeNull();
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

  it("moves by step/10 on Shift+ArrowUp", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    function Example() {
      const [value, setValue] = useState(5);
      return (
        <Potentiometer
          label="Gain"
          value={value}
          min={0}
          max={10}
          step={1}
          onChange={next => {
            setValue(next);
            onChange(next);
          }}
        />
      );
    }
    render(<Example />);
    const slider = screen.getByRole("slider", { name: "Gain" });
    slider.focus();
    await user.keyboard("{Shift>}{ArrowUp}{ArrowUp}{/Shift}");
    expect(onChange).toHaveBeenNthCalledWith(1, 5.1);
    expect(onChange).toHaveBeenNthCalledWith(2, 5.2);
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
