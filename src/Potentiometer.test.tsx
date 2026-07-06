import { useState } from "react";
import { render, screen } from "@testing-library/react";
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
});
