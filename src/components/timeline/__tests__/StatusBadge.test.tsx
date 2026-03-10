import { render, screen } from "@testing-library/react";
import { StatusBadge } from "../StatusBadge";
import type { MatchStatus } from "@/types/match";

describe("StatusBadge", () => {
  const cases: [MatchStatus, string][] = [
    ["running", "LIVE"],
    ["not_started", "UPCOMING"],
    ["finished", "FINISHED"],
  ];

  it.each(cases)("renders '%s' status as '%s'", (status, label) => {
    render(<StatusBadge status={status} />);
    // Desktop label is in a hidden span; jsdom renders both spans
    expect(screen.getAllByText(label).length).toBeGreaterThanOrEqual(1);
  });

  it("applies animate-pulse to the dot for running status", () => {
    const { container } = render(<StatusBadge status="running" />);
    const dot = container.querySelector(".rounded-full");
    expect(dot).toHaveClass("animate-pulse");
  });

  it("does not apply animate-pulse to the dot for non-running statuses", () => {
    const { container } = render(<StatusBadge status="finished" />);
    const dot = container.querySelector(".rounded-full");
    expect(dot).not.toHaveClass("animate-pulse");
  });
});
