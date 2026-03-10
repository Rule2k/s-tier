import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TournamentBlock } from "../TournamentBlock";
import { makeTournament, makeMatch } from "@/test/fixtures/matches";

describe("TournamentBlock", () => {
  it("renders tournament name", () => {
    render(<TournamentBlock tournament={makeTournament()} />);
    expect(screen.getByText("ESL Pro League Season 23")).toBeInTheDocument();
  });

  it("renders tournament logo", () => {
    const { container } = render(<TournamentBlock tournament={makeTournament()} />);
    const headerImg = container.querySelector("[data-tournament-header] img");
    expect(headerImg).toHaveAttribute("src", "https://img.grid.gg/esl-pro-league.png");
  });

  it("renders all matches including finished ones", () => {
    const tournament = makeTournament({
      matches: [
        makeMatch({ id: "1", status: "finished" }),
        makeMatch({ id: "2", status: "running" }),
      ],
    });
    const { container } = render(<TournamentBlock tournament={tournament} />);
    expect(container.querySelectorAll("[data-match-card]")).toHaveLength(2);
  });

  it("shows 'Finished' with winner when all matches are done", () => {
    const tournament = makeTournament({
      matches: [
        makeMatch({ id: "1", status: "finished", scheduledAt: "2025-06-14T15:00:00Z" }),
        makeMatch({
          id: "2",
          status: "finished",
          scheduledAt: "2025-06-15T18:00:00Z",
          teams: [
            { name: "Navi", shortName: "NAVI", logoUrl: "https://img.test/navi.png", score: 2, isWinner: true },
            { name: "G2", shortName: "G2", logoUrl: null, score: 1, isWinner: false },
          ],
        }),
      ],
    });
    render(<TournamentBlock tournament={tournament} />);
    expect(screen.getByText("Finished")).toBeInTheDocument();
    expect(screen.getAllByText("Navi").length).toBeGreaterThanOrEqual(2);
  });

  it("shows 'Live' with match count when matches are running", () => {
    const tournament = makeTournament({
      matches: [
        makeMatch({ id: "1", status: "running" }),
        makeMatch({ id: "2", status: "running" }),
        makeMatch({ id: "3", status: "not_started" }),
      ],
    });
    render(<TournamentBlock tournament={tournament} />);
    expect(screen.getByText("Live")).toBeInTheDocument();
    expect(screen.getByText("2 matches")).toBeInTheDocument();
  });

  it("shows 'In Progress' when some matches finished but none running", () => {
    const tournament = makeTournament({
      matches: [
        makeMatch({ id: "1", status: "finished" }),
        makeMatch({ id: "2", status: "not_started" }),
      ],
    });
    render(<TournamentBlock tournament={tournament} />);
    expect(screen.getByText("In Progress")).toBeInTheDocument();
  });

  it("shows 'Upcoming' when no matches have been played", () => {
    const tournament = makeTournament({
      matches: [
        makeMatch({ id: "1", status: "not_started" }),
        makeMatch({ id: "2", status: "not_started" }),
      ],
    });
    render(<TournamentBlock tournament={tournament} />);
    expect(screen.getByText("Upcoming")).toBeInTheDocument();
  });

  it("uses all tournament matches for the header status when visible matches are filtered", () => {
    const filteredMatch = makeMatch({
      id: "1",
      status: "finished",
      scheduledAt: "2025-06-15T15:00:00Z",
      teams: [
        { name: "Navi", shortName: "NAVI", logoUrl: "https://img.test/navi.png", score: 2, isWinner: true },
        { name: "G2", shortName: "G2", logoUrl: null, score: 1, isWinner: false },
      ],
    });
    const runningMatch = makeMatch({
      id: "2",
      status: "running",
      scheduledAt: "2025-06-15T18:00:00Z",
      teams: [
        { name: "Spirit", shortName: "SPI", logoUrl: "https://img.test/spirit.png", score: 1, isWinner: false },
        { name: "Vitality", shortName: "VIT", logoUrl: "https://img.test/vitality.png", score: 1, isWinner: false },
      ],
    });
    const tournament = makeTournament({
      matches: [filteredMatch],
      allMatches: [filteredMatch, runningMatch],
    });

    render(<TournamentBlock tournament={tournament} />);

    expect(screen.getByText("Live")).toBeInTheDocument();
    expect(screen.queryByText("Finished")).not.toBeInTheDocument();
    expect(screen.queryByText("Navi")).toBeInTheDocument();
  });

  it("renders sticky date separators inside the tournament content", () => {
    const tournament = makeTournament({
      matches: [
        makeMatch({ id: "1", scheduledAt: "2025-06-15T15:00:00Z" }),
        makeMatch({ id: "2", scheduledAt: "2025-06-16T18:00:00Z" }),
      ],
    });

    const { container } = render(<TournamentBlock tournament={tournament} />);
    const separators = container.querySelectorAll("[data-date-separator]");

    expect(separators).toHaveLength(2);
    separators.forEach((separator) => {
      expect(separator.className).toContain("sticky");
    });
  });

  it("collapses the tournament content and keeps only the header visible", async () => {
    const user = userEvent.setup();
    const tournament = makeTournament({
      matches: [
        makeMatch({ id: "1", scheduledAt: "2025-06-15T15:00:00Z" }),
        makeMatch({ id: "2", scheduledAt: "2025-06-16T18:00:00Z" }),
      ],
    });

    const { container } = render(<TournamentBlock tournament={tournament} />);
    const toggleButton = screen.getByRole("button", { name: /close esl pro league season 23/i });
    const collapsedIndicator = container.querySelector("[data-collapsed-indicator]");

    expect(toggleButton).toHaveAttribute("aria-expanded", "true");
    expect(collapsedIndicator).toHaveClass("opacity-0");
    expect(container.querySelectorAll("[data-match-card]")).toHaveLength(2);

    await user.click(toggleButton);

    expect(toggleButton).toHaveAttribute("aria-expanded", "false");
    expect(collapsedIndicator).toHaveClass("opacity-100");
    expect(container.querySelectorAll("[data-match-card]")).toHaveLength(0);
  });
});
