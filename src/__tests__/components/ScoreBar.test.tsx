import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ScoreBar } from "../../components/ScoreBar";

describe("ScoreBar", () => {
  it("renders value and label", () => {
    render(<ScoreBar value={85} label="Health" />);
    expect(screen.getByText("85")).toBeDefined();
    expect(screen.getByText("Health")).toBeDefined();
  });

  it("renders width style proportional to value", () => {
    const { container } = render(<ScoreBar value={42} label="Test" />);
    const inner = container.querySelector(".h-full");
    expect(inner).toBeDefined();
    expect((inner as HTMLElement).style.width).toBe("42%");
  });
});
