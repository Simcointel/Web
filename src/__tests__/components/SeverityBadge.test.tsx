import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SeverityBadge } from "../../components/SeverityBadge";

describe("SeverityBadge", () => {
  it("renders severity text", () => {
    render(<SeverityBadge severity="critical" />);
    expect(screen.getByText("critical")).toBeDefined();
  });

  it("renders warning severity", () => {
    render(<SeverityBadge severity="warning" />);
    expect(screen.getByText("warning")).toBeDefined();
  });

  it("renders info severity", () => {
    render(<SeverityBadge severity="info" />);
    expect(screen.getByText("info")).toBeDefined();
  });

  it("renders unknown severity with default style", () => {
    render(<SeverityBadge severity="unknown" />);
    expect(screen.getByText("unknown")).toBeDefined();
  });
});
