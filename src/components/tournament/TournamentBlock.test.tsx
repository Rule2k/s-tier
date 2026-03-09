import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TournamentBlock } from "./TournamentBlock";
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

  it("renders all matches", () => {
    const tournament = makeTournament({
      matches: [
        makeMatch({ id: "1", status: "finished" }),
        makeMatch({ id: "2", status: "running" }),
      ],
    });
    render(<TournamentBlock tournament={tournament} />);
    // Both matches render their team names
    expect(screen.getAllByText("Team Alpha")).toHaveLength(2);
  });

  it("collapses and expands on banner click", async () => {
    const user = userEvent.setup();
    const tournament = makeTournament();
    render(<TournamentBlock tournament={tournament} />);

    // Match visible initially
    expect(screen.getByText("Team Alpha")).toBeInTheDocument();

    // Click banner to collapse
    await user.click(screen.getByText("ESL Pro League Season 23"));
    expect(screen.queryByText("Team Alpha")).not.toBeInTheDocument();

    // Click again to expand
    await user.click(screen.getByText("ESL Pro League Season 23"));
    expect(screen.getByText("Team Alpha")).toBeInTheDocument();
  });

  it("renders chevron indicator", () => {
    render(<TournamentBlock tournament={makeTournament()} />);
    expect(screen.getByText("▼")).toBeInTheDocument();
  });
});
