import { render, screen } from "@testing-library/react";
import { TournamentTimeline } from "./TournamentTimeline";
import { makeMatch } from "@/test/fixtures/matches";

describe("TournamentTimeline", () => {
  it("renders tournament blocks grouped by tournament", () => {
    const matches = [
      makeMatch({ id: "1", scheduledAt: "2025-06-10T15:00:00Z", tournament: { id: "100", name: "BLAST", tier: "s", slug: "blast", region: "EU" } }),
      makeMatch({ id: "2", scheduledAt: "2025-06-11T18:00:00Z", tournament: { id: "100", name: "BLAST", tier: "s", slug: "blast", region: "EU" } }),
      makeMatch({ id: "3", scheduledAt: "2025-06-20T12:00:00Z", tournament: { id: "200", name: "IEM Cologne", tier: "a", slug: "iem", region: "NA" } }),
    ];

    render(<TournamentTimeline matches={matches} />);
    expect(screen.getByText("BLAST")).toBeInTheDocument();
    expect(screen.getByText("IEM Cologne")).toBeInTheDocument();
  });

  it("renders overlapping tournaments side by side", () => {
    const matches = [
      makeMatch({ id: "1", scheduledAt: "2025-06-10T10:00:00Z", tournament: { id: "100", name: "BLAST", tier: "s", slug: "blast", region: "EU" } }),
      makeMatch({ id: "2", scheduledAt: "2025-06-15T10:00:00Z", tournament: { id: "100", name: "BLAST", tier: "s", slug: "blast", region: "EU" } }),
      makeMatch({ id: "3", scheduledAt: "2025-06-12T10:00:00Z", tournament: { id: "200", name: "IEM", tier: "a", slug: "iem", region: "NA" } }),
    ];

    const { container } = render(<TournamentTimeline matches={matches} />);
    // The row with overlapping tournaments should have the flex overflow class
    const flexRow = container.querySelector(".overflow-x-auto");
    expect(flexRow).toBeInTheDocument();
  });

  it("renders single tournament without overflow class", () => {
    const matches = [
      makeMatch({ id: "1", scheduledAt: "2025-06-10T10:00:00Z", tournament: { id: "100", name: "BLAST", tier: "s", slug: "blast", region: "EU" } }),
    ];

    const { container } = render(<TournamentTimeline matches={matches} />);
    expect(container.querySelector(".overflow-x-auto")).not.toBeInTheDocument();
  });

  it("filters out matches without scheduledAt", () => {
    const matches = [
      makeMatch({ id: "1", scheduledAt: "", tournament: { id: "100", name: "Ghost", tier: "s", slug: "ghost", region: null } }),
    ];

    render(<TournamentTimeline matches={matches} />);
    expect(screen.queryByText("Ghost")).not.toBeInTheDocument();
  });
});
