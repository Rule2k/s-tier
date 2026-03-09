import { render, screen } from "@testing-library/react";
import { StatusBadge } from "./StatusBadge";
import type { MatchStatus } from "@/types/match";

describe("StatusBadge", () => {
  const cases: [MatchStatus, string][] = [
    ["running", "LIVE"],
    ["not_started", "UPCOMING"],
    ["finished", "FINISHED"],
  ];

  it.each(cases)("renders '%s' status as '%s'", (status, label) => {
    render(<StatusBadge status={status} />);
    expect(screen.getByText(label)).toBeInTheDocument();
  });

  it("renders a blinking dot for live status", () => {
    const { container } = render(<StatusBadge status="running" />);
    const dot = container.querySelector(".animate-blink");
    expect(dot).toBeInTheDocument();
  });

  it("does not render a blinking dot for non-running statuses", () => {
    const { container } = render(<StatusBadge status="finished" />);
    const dot = container.querySelector(".animate-blink");
    expect(dot).not.toBeInTheDocument();
  });
});
