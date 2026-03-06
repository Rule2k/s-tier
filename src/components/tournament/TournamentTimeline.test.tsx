import { render, screen } from "@testing-library/react";
import { TournamentTimeline } from "./TournamentTimeline";
import { makeSerie } from "@/test/fixtures/matches";

describe("TournamentTimeline", () => {
  it("renders serie blocks", () => {
    const series = [
      makeSerie({ id: "1", name: "BLAST Premier Spring 2025" }),
      makeSerie({ id: "2", name: "IEM Cologne 2025", beginAt: "2025-07-10T00:00:00Z", endAt: "2025-07-20T00:00:00Z" }),
    ];

    render(<TournamentTimeline series={series} />);
    expect(screen.getByText("BLAST Premier Spring 2025")).toBeInTheDocument();
    expect(screen.getByText("IEM Cologne 2025")).toBeInTheDocument();
  });

  it("renders all series in masonry grid", () => {
    const series = [
      makeSerie({ id: "1", beginAt: "2025-06-01T00:00:00Z", endAt: "2025-06-15T00:00:00Z" }),
      makeSerie({ id: "2", beginAt: "2025-06-10T00:00:00Z", endAt: "2025-06-20T00:00:00Z" }),
    ];

    const { container } = render(<TournamentTimeline series={series} />);
    const grid = container.firstElementChild;
    expect(grid?.children).toHaveLength(2);
  });

  it("renders empty when no series", () => {
    const { container } = render(<TournamentTimeline series={[]} />);
    expect(container.firstElementChild?.children).toHaveLength(0);
  });
});
