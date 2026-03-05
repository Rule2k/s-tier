import { render, screen } from "@testing-library/react";
import { StatusBadge } from "./StatusBadge";
import type { MatchStatus } from "@/types/match";

describe("StatusBadge", () => {
  const cases: [MatchStatus, string][] = [
    ["running", "LIVE"],
    ["not_started", "UPCOMING"],
    ["finished", "FINISHED"],
    ["canceled", "CANCELED"],
    ["postponed", "POSTPONED"],
  ];

  it.each(cases)("renders '%s' status as '%s'", (status, label) => {
    render(<StatusBadge status={status} />);
    expect(screen.getByText(label)).toBeInTheDocument();
  });

  it("applies animate-pulse class for running status", () => {
    render(<StatusBadge status="running" />);
    expect(screen.getByText("LIVE")).toHaveClass("animate-pulse");
  });

  it("does not apply animate-pulse for non-running statuses", () => {
    render(<StatusBadge status="finished" />);
    expect(screen.getByText("FINISHED")).not.toHaveClass("animate-pulse");
  });
});
