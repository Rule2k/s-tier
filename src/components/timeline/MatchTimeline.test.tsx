import { render, screen } from "@testing-library/react";
import { MatchTimeline } from "./MatchTimeline";
import { makeMatch } from "@/test/fixtures/matches";

// jsdom doesn't implement scrollIntoView
Element.prototype.scrollIntoView = vi.fn();

describe("MatchTimeline", () => {
  it("renders date separators and match cards", () => {
    const matches = [
      makeMatch({ id: "1", scheduledAt: "2025-06-15T15:00:00Z", teams: [
        { name: "Navi", shortName: "NAVI", logoUrl: null, score: 2, isWinner: true },
        { name: "G2", shortName: "G2", logoUrl: null, score: 1, isWinner: false },
      ]}),
      makeMatch({ id: "2", scheduledAt: "2025-06-15T18:00:00Z", teams: [
        { name: "FaZe", shortName: "FAZE", logoUrl: null, score: 0, isWinner: false },
        { name: "Vitality", shortName: "VIT", logoUrl: null, score: 2, isWinner: true },
      ]}),
    ];

    render(<MatchTimeline matches={matches} />);

    // Date separator: "June 15" as main label, "Sunday" as sub
    expect(screen.getByText("June 15")).toBeInTheDocument();

    // Team names should be visible
    expect(screen.getByText("Navi")).toBeInTheDocument();
    expect(screen.getByText("G2")).toBeInTheDocument();
    expect(screen.getByText("FaZe")).toBeInTheDocument();
    expect(screen.getByText("Vitality")).toBeInTheDocument();
  });

  it("groups matches by date with separate headers", () => {
    const matches = [
      makeMatch({ id: "1", scheduledAt: "2025-06-15T15:00:00Z" }),
      makeMatch({ id: "2", scheduledAt: "2025-06-16T15:00:00Z" }),
    ];

    render(<MatchTimeline matches={matches} />);

    expect(screen.getByText("June 15")).toBeInTheDocument();
    expect(screen.getByText("June 16")).toBeInTheDocument();
  });

  it("filters out matches without scheduledAt", () => {
    const matches = [
      makeMatch({ id: "1", scheduledAt: "2025-06-15T15:00:00Z" }),
      makeMatch({ id: "2", scheduledAt: "" }),
    ];

    render(<MatchTimeline matches={matches} />);

    expect(screen.getByText("June 15")).toBeInTheDocument();
    expect(screen.getByText("Team Alpha")).toBeInTheDocument();
  });
});
