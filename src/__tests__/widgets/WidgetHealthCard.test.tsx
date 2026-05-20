import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { WidgetHealthCard } from "../../components/widgets/WidgetHealthCard";

vi.mock("../../services/widgetClient", () => ({
  fetchWidget: vi.fn().mockResolvedValue({
    w: "simcointel-health",
    t: "2025-01-15T12:00:00.000Z",
    s: { eh: 85, ms: 62, st: 71, ip: 45, sr: 38 },
    r: { na: "Expansion", sc: 72 },
  }),
}));

describe("WidgetHealthCard", () => {
  it("shows loading state initially", () => {
    render(<WidgetHealthCard />);
    expect(screen.getByText("Loading...")).toBeDefined();
  });

  it("renders widget with scores after fetch", async () => {
    render(<WidgetHealthCard />);
    const scores = await screen.findAllByText(/85|62|71|45|38/);
    expect(scores.length).toBeGreaterThan(0);
  });

  it("renders regime badge", async () => {
    render(<WidgetHealthCard />);
    const regime = await screen.findByText("Expansion");
    expect(regime).toBeDefined();
  });
});
