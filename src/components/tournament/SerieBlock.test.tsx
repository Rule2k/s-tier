import { render, screen } from "@testing-library/react";
import { SerieBlock } from "./SerieBlock";
import { makeSerie, makeStage, makeMatch } from "@/test/fixtures/matches";

describe("SerieBlock", () => {
  it("renders serie name and tier badge", () => {
    render(<SerieBlock serie={makeSerie()} />);
    expect(screen.getByText("BLAST Premier Spring 2025")).toBeInTheDocument();
    expect(screen.getByText("S-Tier")).toBeInTheDocument();
  });

  it("renders league image when present", () => {
    const { container } = render(<SerieBlock serie={makeSerie({ leagueImageUrl: "https://img.test/logo.png" })} />);
    const leagueImg = container.querySelector('img[src="https://img.test/logo.png"]');
    expect(leagueImg).toBeInTheDocument();
  });

  it("renders date range", () => {
    render(<SerieBlock serie={makeSerie({ beginAt: "2025-06-01T00:00:00Z", endAt: "2025-06-15T00:00:00Z" })} />);
    expect(screen.getByText("June 1 - June 15")).toBeInTheDocument();
  });

  it("shows stage headers when 2+ stages", () => {
    const serie = makeSerie({
      stages: [
        makeStage({ id: "1", name: "Group Stage", matches: [makeMatch({ id: "1", status: "running" })] }),
        makeStage({ id: "2", name: "Playoffs", matches: [makeMatch({ id: "2", status: "running" })] }),
      ],
    });
    render(<SerieBlock serie={serie} />);
    expect(screen.getByText("Group Stage")).toBeInTheDocument();
    expect(screen.getByText("Playoffs")).toBeInTheDocument();
  });

  it("shows stage tab even with 1 stage", () => {
    const serie = makeSerie({
      stages: [makeStage({ name: "Group Stage" })],
    });
    render(<SerieBlock serie={serie} />);
    expect(screen.getByText("Group Stage")).toBeInTheDocument();
  });

  it("renders all matches including finished ones", () => {
    const serie = makeSerie({
      stages: [
        makeStage({
          matches: [
            makeMatch({ id: "1", status: "finished" }),
            makeMatch({ id: "2", status: "running" }),
          ],
        }),
      ],
    });
    const { container } = render(<SerieBlock serie={serie} />);
    expect(container.querySelectorAll(".rounded-lg.border")).toHaveLength(2);
  });

  it("uses 'Main Stage' for stages with empty name", () => {
    const serie = makeSerie({
      stages: [
        makeStage({ id: "1", name: "", matches: [makeMatch({ id: "1", status: "running" })] }),
        makeStage({ id: "2", name: "Playoffs", matches: [makeMatch({ id: "2", status: "running" })] }),
      ],
    });
    render(<SerieBlock serie={serie} />);
    expect(screen.getByText("Main Stage")).toBeInTheDocument();
  });
});
