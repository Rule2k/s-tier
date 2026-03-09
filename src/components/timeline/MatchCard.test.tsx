import { render, screen } from "@testing-library/react";
import { MatchCard } from "./MatchCard";
import { makeMatch } from "@/test/fixtures/matches";

describe("MatchCard", () => {
  it("displays team names", () => {
    render(<MatchCard match={makeMatch()} />);
    expect(screen.getByText("Team Alpha")).toBeInTheDocument();
    expect(screen.getByText("Team Bravo")).toBeInTheDocument();
  });

  it("displays combined score", () => {
    render(<MatchCard match={makeMatch()} />);
    expect(screen.getByText("2 – 1")).toBeInTheDocument();
  });

  it("does not display score for not_started matches", () => {
    const match = makeMatch({
      status: "not_started",
      teams: [
        { name: "Team A", shortName: "A", logoUrl: null, score: null, isWinner: false },
        { name: "Team B", shortName: "B", logoUrl: null, score: null, isWinner: false },
      ],
      maps: [],
    });
    render(<MatchCard match={match} />);
    expect(screen.queryByText(/–/)).not.toBeInTheDocument();
  });

  it("displays the match format", () => {
    render(<MatchCard match={makeMatch({ format: "Bo5" })} />);
    expect(screen.getByText("Bo5")).toBeInTheDocument();
  });

  it("displays the status badge", () => {
    render(<MatchCard match={makeMatch({ status: "running" })} />);
    expect(screen.getByText("LIVE")).toBeInTheDocument();
  });

  it("displays formatted time", () => {
    render(<MatchCard match={makeMatch({ scheduledAt: "2025-06-15T15:00:00Z" })} />);
    expect(screen.getByText(/\d{2}:\d{2}/)).toBeInTheDocument();
  });

  it("displays map scores for played maps", () => {
    render(<MatchCard match={makeMatch()} />);
    expect(screen.getByText(/mirage/)).toBeInTheDocument();
    expect(screen.getByText(/inferno/)).toBeInTheDocument();
    expect(screen.getByText(/nuke/)).toBeInTheDocument();
  });

  it("does not display map scores for not_started matches", () => {
    const match = makeMatch({
      status: "not_started",
      maps: [],
      teams: [
        { name: "Team A", shortName: "A", logoUrl: null, score: null, isWinner: false },
        { name: "Team B", shortName: "B", logoUrl: null, score: null, isWinner: false },
      ],
    });
    render(<MatchCard match={match} />);
    expect(screen.queryByText(/mirage/)).not.toBeInTheDocument();
  });
});
