import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";

// jsdom has no matchMedia; useTheme needs it.
beforeEach(() => {
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }));
});

const mockUseMaintenanceMode = vi.fn();

vi.mock("../../hooks/useMaintenanceMode", () => ({
  useMaintenanceMode: () => mockUseMaintenanceMode(),
}));

import { AppShell } from "../../App";

function mockMode(overrides: Partial<ReturnType<typeof mockUseMaintenanceMode>> = {}) {
  mockUseMaintenanceMode.mockReturnValue({
    enabled: false,
    title: "Site Under Maintenance",
    message: "We're performing scheduled maintenance. Please check back soon.",
    retryAfter: 300,
    loading: false,
    refresh: vi.fn(),
    ...overrides,
  });
}

describe("AppShell maintenance gating", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
    vi.stubGlobal("matchMedia", (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }));
  });

  it("renders the overlay instead of the page when maintenance is enabled", async () => {
    mockMode({ enabled: true, title: "Emergency Stop", message: "All systems halted." });
    render(<AppShell path="/" />);

    expect(screen.getByText("Emergency Stop")).toBeDefined();
    expect(screen.getByText("All systems halted.")).toBeDefined();
    expect(screen.queryByRole("navigation")).toBeNull();
  });

  it("renders the app normally when maintenance is disabled", async () => {
    mockMode({ enabled: false });
    render(<AppShell path="/" />);

    await waitFor(() => {
      expect(screen.getByText(/Economic Intelligence Platform/)).toBeDefined();
    });
    expect(screen.queryByRole("alertdialog")).toBeNull();
  });

  it("holds the page back while the flag is still loading", () => {
    mockMode({ loading: true });
    render(<AppShell path="/" />);

    // Footer/sidebar not rendered yet, and no overlay yet.
    expect(screen.queryByText(/Economic Intelligence Platform/)).toBeNull();
    expect(screen.queryByRole("alertdialog")).toBeNull();
  });

  it("blocks the widget route too", () => {
    mockMode({ enabled: true, title: "Down", message: "Gone" });
    render(<AppShell path="/widgets/health?realm=1" />);

    expect(screen.getByText("Down")).toBeDefined();
  });
});
