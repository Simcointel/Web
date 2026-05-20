import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { StatCard } from "../../components/StatCard";

describe("StatCard", () => {
  it("renders title and value", () => {
    render(<StatCard title="GDP" value="$1.2T" />);
    expect(screen.getByText("GDP")).toBeDefined();
    expect(screen.getByText("$1.2T")).toBeDefined();
  });

  it("renders subtitle when provided", () => {
    render(<StatCard title="GDP" value="$1.2T" subtitle="Quarterly" />);
    expect(screen.getByText("Quarterly")).toBeDefined();
  });

  it("renders up trend", () => {
    render(<StatCard title="GDP" value="$1.2T" trend={{ up: true, label: "+2.5%" }} />);
    expect(screen.getByText("+2.5%", { exact: false })).toBeDefined();
  });

  it("renders down trend", () => {
    render(<StatCard title="GDP" value="$1.2T" trend={{ up: false, label: "-1.2%" }} />);
    expect(screen.getByText("-1.2%", { exact: false })).toBeDefined();
  });

  it("renders children", () => {
    render(<StatCard title="Card"><div data-testid="child">Extra</div></StatCard>);
    expect(screen.getByTestId("child")).toBeDefined();
  });
});
