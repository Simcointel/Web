import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MaintenanceOverlay } from "../../components/MaintenanceOverlay";

describe("MaintenanceOverlay", () => {
  it("renders the configured title and message", () => {
    render(
      <MaintenanceOverlay
        title="Systems Down"
        message="We are fixing things."
        retryAfter={60}
        onRetry={() => {}}
      />,
    );
    expect(screen.getByText("Systems Down")).toBeDefined();
    expect(screen.getByText("We are fixing things.")).toBeDefined();
  });

  it("calls onRetry when the check-again button is clicked", () => {
    const onRetry = vi.fn();
    render(
      <MaintenanceOverlay title="T" message="M" retryAfter={60} onRetry={onRetry} />,
    );
    fireEvent.click(screen.getByText("Check Again Now"));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it("exposes an accessible alertdialog with labelled title and message", () => {
    render(
      <MaintenanceOverlay title="Down" message="Outage" retryAfter={30} onRetry={() => {}} />,
    );
    const dialog = screen.getByRole("alertdialog");
    expect(dialog).toBeDefined();
    expect(dialog.getAttribute("aria-labelledby")).toBe("maintenance-title");
    expect(dialog.getAttribute("aria-describedby")).toBe("maintenance-message");
  });

  it("formats the retry countdown in minutes and seconds", () => {
    render(
      <MaintenanceOverlay title="T" message="M" retryAfter={90} onRetry={() => {}} />,
    );
    expect(screen.getByText(/Auto-retry in 1m 30s/)).toBeDefined();
  });
});
