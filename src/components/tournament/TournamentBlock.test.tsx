import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TournamentBlock } from "./TournamentBlock";
import { makeMatch } from "@/test/fixtures/matches";
import type { Tournament } from "@/lib/tournaments/groupByTournament";

const makeTournament = (overrides: Partial<Tournament> = {}): Tournament => ({
  id: "100",
  name: "BLAST Premier Spring Finals",
  tier: "s",
  slug: "blast",
  region: "EU",
  beginAt: "2025-06-10T10:00:00Z",
  endAt: "2025-06-15T20:00:00Z",
  matches: [
    makeMatch({ id: "1", status: "finished", scheduledAt: "2025-06-10T15:00:00Z" }),
    makeMatch({ id: "2", status: "running", scheduledAt: "2025-06-11T18:00:00Z" }),
  ],
  ...overrides,
});

describe("TournamentBlock", () => {
  it("renders tournament name and tier badge", () => {
    render(<TournamentBlock tournament={makeTournament()} />);
    expect(screen.getByText("BLAST Premier Spring Finals")).toBeInTheDocument();
    expect(screen.getByText("S")).toBeInTheDocument();
  });

  it("renders region and date range", () => {
    render(<TournamentBlock tournament={makeTournament()} />);
    expect(screen.getByText("EU")).toBeInTheDocument();
    expect(screen.getByText("Jun 10 - Jun 15")).toBeInTheDocument();
  });

  it("renders match count", () => {
    render(<TournamentBlock tournament={makeTournament()} />);
    expect(screen.getByText("2 matches")).toBeInTheDocument();
  });

  it("hides finished matches by default when active matches exist", () => {
    render(<TournamentBlock tournament={makeTournament()} />);
    expect(screen.getByText(/Show 1 finished match/)).toBeInTheDocument();
  });

  it("shows all matches when only finished matches exist", () => {
    const tournament = makeTournament({
      matches: [
        makeMatch({ id: "1", status: "finished", scheduledAt: "2025-06-10T15:00:00Z" }),
        makeMatch({ id: "2", status: "finished", scheduledAt: "2025-06-11T18:00:00Z" }),
      ],
    });
    render(<TournamentBlock tournament={tournament} />);
    expect(screen.queryByText(/Show.*finished/)).not.toBeInTheDocument();
  });

  it("toggles finished matches visibility", async () => {
    const user = userEvent.setup();
    render(<TournamentBlock tournament={makeTournament()} />);

    const btn = screen.getByText(/Show 1 finished match/);
    await user.click(btn);
    expect(screen.getByText(/Hide 1 finished match/)).toBeInTheDocument();
  });
});
