import { render, screen } from "@testing-library/react";
import { MatchCard } from "./MatchCard";
import { makeMatch } from "@/test/fixtures/matches";

describe("MatchCard", () => {
  it("displays team names", () => {
    render(<MatchCard match={makeMatch()} />);
    expect(screen.getByText("Team Alpha")).toBeInTheDocument();
    expect(screen.getByText("Team Bravo")).toBeInTheDocument();
  });

  it("displays scores", () => {
    render(<MatchCard match={makeMatch()} />);
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
  });

  it("displays dash when score is null", () => {
    const match = makeMatch({
      status: "not_started",
      teams: [
        { name: "Team A", acronym: "A", imageUrl: null, score: null, isWinner: false },
        { name: "Team B", acronym: "B", imageUrl: null, score: null, isWinner: false },
      ],
    });
    render(<MatchCard match={match} />);
    const dashes = screen.getAllByText("-");
    expect(dashes).toHaveLength(2);
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
    // The displayed time depends on local timezone, so we just check it's rendered
    expect(screen.getByText(/\d{2}:\d{2}/)).toBeInTheDocument();
  });
});
