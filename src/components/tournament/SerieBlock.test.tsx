import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SerieBlock } from "./SerieBlock";
import { makeSerie, makeStage, makeMatch } from "@/test/fixtures/matches";

describe("SerieBlock", () => {
  it("renders serie name and tier badge", () => {
    render(<SerieBlock serie={makeSerie()} />);
    expect(screen.getByText("BLAST Premier Spring 2025")).toBeInTheDocument();
    expect(screen.getByText("S")).toBeInTheDocument();
  });

  it("renders league image when present", () => {
    const { container } = render(<SerieBlock serie={makeSerie({ leagueImageUrl: "https://img.test/logo.png" })} />);
    const leagueImg = container.querySelector('img[src="https://img.test/logo.png"]');
    expect(leagueImg).toBeInTheDocument();
  });

  it("renders date range and match count", () => {
    render(<SerieBlock serie={makeSerie({ beginAt: "2025-06-01T00:00:00Z", endAt: "2025-06-15T00:00:00Z" })} />);
    expect(screen.getByText("Jun 1 - Jun 15")).toBeInTheDocument();
    expect(screen.getByText("1 match")).toBeInTheDocument();
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

  it("does not show stage header when only 1 stage", () => {
    const serie = makeSerie({
      stages: [makeStage({ name: "Group Stage" })],
    });
    render(<SerieBlock serie={serie} />);
    expect(screen.queryByText("Group Stage")).not.toBeInTheDocument();
  });

  it("hides finished matches by default when active matches exist", () => {
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
    render(<SerieBlock serie={serie} />);
    expect(screen.getByText(/Show 1 finished match$/)).toBeInTheDocument();
  });

  it("shows all matches when only finished matches exist", () => {
    const serie = makeSerie({
      stages: [
        makeStage({
          matches: [
            makeMatch({ id: "1", status: "finished" }),
            makeMatch({ id: "2", status: "finished" }),
          ],
        }),
      ],
    });
    render(<SerieBlock serie={serie} />);
    expect(screen.queryByText(/Show.*finished/)).not.toBeInTheDocument();
  });

  it("toggles finished matches visibility", async () => {
    const user = userEvent.setup();
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
    render(<SerieBlock serie={serie} />);

    const btn = screen.getByText(/Show 1 finished match$/);
    await user.click(btn);
    expect(screen.getByText(/Hide 1 finished match$/)).toBeInTheDocument();
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
