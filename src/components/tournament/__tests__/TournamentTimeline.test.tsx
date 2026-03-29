import { render, screen } from "@testing-library/react";
import { TournamentTimeline } from "../TournamentTimeline";
import { makeTournament, makeMatch } from "@/test/fixtures/matches";

describe("TournamentTimeline", () => {
  it("renders tournament blocks", () => {
    const tournaments = [
      makeTournament({ id: "1", name: "ESL Pro League Season 23" }),
      makeTournament({ id: "2", name: "IEM Cologne 2025" }),
    ];

    render(<TournamentTimeline tournaments={tournaments} />);
    expect(screen.getByText("ESL Pro League Season 23")).toBeInTheDocument();
    expect(screen.getByText("IEM Cologne 2025")).toBeInTheDocument();
  });

  it("renders all tournaments", () => {
    const tournaments = [
      makeTournament({ id: "1" }),
      makeTournament({ id: "2" }),
    ];

    const { container } = render(<TournamentTimeline tournaments={tournaments} />);
    const grid = container.firstElementChild;
    // 2 tournament blocks (no load buttons since no onLoadPrevious/onLoadNext)
    expect(grid?.children).toHaveLength(2);
  });

  it("renders empty when no tournaments", () => {
    const { container } = render(<TournamentTimeline tournaments={[]} />);
    expect(container.firstElementChild?.children).toHaveLength(0);
  });

  it("opens the live tournament and keeps others collapsed", () => {
    const tournaments = [
      makeTournament({
        id: "finished",
        name: "Finished Event",
        matches: [makeMatch({ id: "1", status: "finished" })],
      }),
      makeTournament({
        id: "live",
        name: "Live Event",
        matches: [makeMatch({ id: "2", status: "running" })],
      }),
    ];

    const { container } = render(<TournamentTimeline tournaments={tournaments} />);
    const blocks = container.querySelectorAll("[data-tournament-block]");

    // Finished tournament: collapsed (no match cards)
    expect(blocks[0].querySelectorAll("[data-match-card]")).toHaveLength(0);
    // Live tournament: expanded (has match cards)
    expect(blocks[1].querySelectorAll("[data-match-card]")).toHaveLength(1);
  });

  it("opens the in-progress tournament when none are live", () => {
    const tournaments = [
      makeTournament({
        id: "upcoming",
        name: "Upcoming Event",
        matches: [makeMatch({ id: "1", status: "not_started" })],
      }),
      makeTournament({
        id: "in-progress",
        name: "In Progress Event",
        matches: [
          makeMatch({ id: "2", status: "finished" }),
          makeMatch({ id: "3", status: "not_started" }),
        ],
      }),
    ];

    const { container } = render(<TournamentTimeline tournaments={tournaments} />);
    const blocks = container.querySelectorAll("[data-tournament-block]");

    expect(blocks[0].querySelectorAll("[data-match-card]")).toHaveLength(0);
    expect(blocks[1].querySelectorAll("[data-match-card]")).toHaveLength(2);
  });

  it("opens the tournament with the closest future match when none are active", () => {
    const now = new Date();
    const inOneHour = new Date(now.getTime() + 60 * 60 * 1000).toISOString();
    const inOneWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const tournaments = [
      makeTournament({
        id: "far",
        name: "Far Event",
        matches: [makeMatch({ id: "1", status: "not_started", scheduledAt: inOneWeek })],
      }),
      makeTournament({
        id: "soon",
        name: "Soon Event",
        matches: [makeMatch({ id: "2", status: "not_started", scheduledAt: inOneHour })],
      }),
    ];

    const { container } = render(<TournamentTimeline tournaments={tournaments} />);
    const blocks = container.querySelectorAll("[data-tournament-block]");

    // Far tournament: collapsed
    expect(blocks[0].querySelectorAll("[data-match-card]")).toHaveLength(0);
    // Soon tournament: expanded
    expect(blocks[1].querySelectorAll("[data-match-card]")).toHaveLength(1);
  });

  it("keeps all tournaments collapsed when all matches are in the past", () => {
    const tournaments = [
      makeTournament({
        id: "1",
        matches: [makeMatch({ id: "1", status: "finished" })],
      }),
      makeTournament({
        id: "2",
        matches: [makeMatch({ id: "2", status: "finished" })],
      }),
    ];

    const { container } = render(<TournamentTimeline tournaments={tournaments} />);
    const blocks = container.querySelectorAll("[data-tournament-block]");

    expect(blocks[0].querySelectorAll("[data-match-card]")).toHaveLength(0);
    expect(blocks[1].querySelectorAll("[data-match-card]")).toHaveLength(0);
  });
});
