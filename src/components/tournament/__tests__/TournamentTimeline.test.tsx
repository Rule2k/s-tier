import { render, screen } from "@testing-library/react";
import { TournamentTimeline } from "../TournamentTimeline";
import { makeTournament } from "@/test/fixtures/matches";

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
});
