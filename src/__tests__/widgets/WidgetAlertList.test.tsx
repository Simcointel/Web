import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { WidgetAlertList } from "../../components/widgets/WidgetAlertList";

vi.mock("../../services/widgetClient", () => ({
  fetchWidget: vi.fn().mockResolvedValue({
    v: "1.0",
    t: "2025-01-15T12:00:00.000Z",
    w: "simcointel-alerts",
    a: [
      { t: "2025-01-15T11:00:00Z", s: "critical", c: "energy", i: "Price spike detected" },
      { t: "2025-01-15T10:00:00Z", s: "warning", c: "metals", i: "Unusual movement" },
    ],
    total: 2,
  }),
}));

describe("WidgetAlertList", () => {
  it("shows empty state when no data", () => {
    render(<WidgetAlertList />);
    expect(screen.getByText("No recent alerts")).toBeDefined();
  });

  it("renders alert items after fetch", async () => {
    render(<WidgetAlertList />);
    const alert1 = await screen.findByText("Price spike detected");
    const alert2 = await screen.findByText("Unusual movement");
    expect(alert1).toBeDefined();
    expect(alert2).toBeDefined();
  });
});
