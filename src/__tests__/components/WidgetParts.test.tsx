import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MiniScoreBar, MiniRegimeBadge, SeverityDot } from "../../components/widgets/WidgetParts";

describe("MiniScoreBar", () => {
  it("renders value", () => {
    render(<MiniScoreBar value={72} />);
    expect(screen.getByText("72")).toBeDefined();
  });

  it("renders width style", () => {
    const { container } = render(<MiniScoreBar value={55} />);
    const inner = container.querySelector(".h-full");
    expect((inner as HTMLElement).style.width).toBe("55%");
  });

  it("clamps value to 0-100 range", () => {
    const { container } = render(<MiniScoreBar value={150} />);
    const inner = container.querySelector(".h-full");
    expect((inner as HTMLElement).style.width).toBe("100%");
  });
});

describe("MiniRegimeBadge", () => {
  it("renders regime name", () => {
    render(<MiniRegimeBadge regime="Expansion" />);
    expect(screen.getByText("Expansion")).toBeDefined();
  });

  it("renders recession regime", () => {
    render(<MiniRegimeBadge regime="Recession" />);
    expect(screen.getByText("Recession")).toBeDefined();
  });

  it("renders unknown regime with default style", () => {
    render(<MiniRegimeBadge regime="Unknown" />);
    expect(screen.getByText("Unknown")).toBeDefined();
  });
});

describe("SeverityDot", () => {
  it("renders dot for critical", () => {
    const { container } = render(<SeverityDot severity="critical" />);
    expect(container.querySelector(".bg-red-500")).toBeDefined();
  });

  it("renders dot for warning", () => {
    const { container } = render(<SeverityDot severity="warning" />);
    expect(container.querySelector(".bg-amber-500")).toBeDefined();
  });

  it("renders dot for info", () => {
    const { container } = render(<SeverityDot severity="info" />);
    expect(container.querySelector(".bg-blue-500")).toBeDefined();
  });
});
