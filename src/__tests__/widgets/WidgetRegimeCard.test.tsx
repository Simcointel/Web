import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { WidgetRegimeCard } from "../../components/widgets/WidgetRegimeCard";

vi.mock("../../services/widgetClient", () => ({
  fetchWidget: vi.fn().mockResolvedValue({
    reg: { na: "Expansion", sc: 72, mo: 8.5, vo: 12.3, ms: 45.0 },
  }),
}));

describe("WidgetRegimeCard", () => {
  it("shows empty state when no data", () => {
    render(<WidgetRegimeCard />);
    expect(screen.getByText("No regime data")).toBeDefined();
  });

  it("renders regime data after fetch", async () => {
    render(<WidgetRegimeCard />);
    const regime = await screen.findByText("Expansion");
    expect(regime).toBeDefined();
  });

  it("renders regime score", async () => {
    render(<WidgetRegimeCard />);
    const score = await screen.findByText("72", { exact: false });
    expect(score).toBeDefined();
  });
});
