import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { LoadingState, ErrorState, EmptyState } from "../../components/States";

describe("LoadingState", () => {
  it("renders default text", () => {
    render(<LoadingState />);
    expect(screen.getByText("Loading data...")).toBeDefined();
  });

  it("renders custom text", () => {
    render(<LoadingState text="Please wait..." />);
    expect(screen.getByText("Please wait...")).toBeDefined();
  });

  it("renders spinner", () => {
    const { container } = render(<LoadingState />);
    expect(container.querySelector(".animate-spin")).toBeDefined();
  });
});

describe("ErrorState", () => {
  it("renders error message", () => {
    render(<ErrorState message="Something broke" />);
    expect(screen.getByText("Something broke")).toBeDefined();
  });

  it("renders retry button when onRetry provided", () => {
    const onRetry = vi.fn();
    render(<ErrorState message="Error" onRetry={onRetry} />);
    fireEvent.click(screen.getByText("Retry"));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it("does not render retry button when not provided", () => {
    render(<ErrorState message="Error" />);
    expect(screen.queryByText("Retry")).toBeNull();
  });
});

describe("EmptyState", () => {
  it("renders default message", () => {
    render(<EmptyState />);
    expect(screen.getByText("No data available")).toBeDefined();
  });

  it("renders custom message", () => {
    render(<EmptyState message="Nothing here" />);
    expect(screen.getByText("Nothing here")).toBeDefined();
  });
});
