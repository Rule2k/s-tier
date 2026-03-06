import { fetchSeriesFromPandaScore } from "./fetchSeries";
import { pandascoreGet } from "./client";
import { mapMatch } from "./mappers/mapMatch";
import { makePandaScoreSerie, makePandaScoreMatch, makeMatch } from "@/test/fixtures/matches";
import type { PandaScoreTournament } from "./types/match";

vi.mock("./client");
vi.mock("./mappers/mapMatch");

const makeTournament = (overrides: Partial<PandaScoreTournament> = {}): PandaScoreTournament => ({
  id: 100,
  name: "Group Stage",
  slug: "group-stage",
  tier: "s",
  region: "EU",
  league_id: 10,
  serie_id: 50,
  ...overrides,
});

describe("fetchSeriesFromPandaScore", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(mapMatch).mockImplementation((m) =>
      makeMatch({ id: String(m.id), tournament: { id: String(m.tournament.id), name: m.tournament.name, tier: m.tournament.tier, slug: m.tournament.slug, region: m.tournament.region } }),
    );
  });

  it("fetches series then past/running/upcoming matches", async () => {
    const series = [makePandaScoreSerie({ tournaments: [makeTournament()] })];

    vi.mocked(pandascoreGet)
      .mockResolvedValueOnce(series)                     // /csgo/series
      .mockResolvedValueOnce([makePandaScoreMatch()])     // past
      .mockResolvedValueOnce([])                          // running
      .mockResolvedValueOnce([]);                         // upcoming

    await fetchSeriesFromPandaScore();

    expect(pandascoreGet).toHaveBeenCalledWith(
      "/csgo/series",
      expect.objectContaining({ per_page: "50", sort: "-begin_at" }),
    );
    expect(pandascoreGet).toHaveBeenCalledWith(
      "/csgo/matches/past",
      expect.objectContaining({ "filter[tournament_id]": "100" }),
    );
  });

  it("filters out series with no s/a tier tournaments", async () => {
    const series = [
      makePandaScoreSerie({ id: 1, tournaments: [makeTournament({ tier: "b" })] }),
      makePandaScoreSerie({ id: 2, tournaments: [makeTournament({ tier: "a" })] }),
    ];

    vi.mocked(pandascoreGet)
      .mockResolvedValueOnce(series)
      .mockResolvedValueOnce([makePandaScoreMatch()])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    const result = await fetchSeriesFromPandaScore();

    // Only the serie with tier "a" tournament should produce results
    // Tournament IDs should only include those from filtered series
    expect(pandascoreGet).toHaveBeenCalledWith(
      "/csgo/matches/past",
      expect.objectContaining({ "filter[tournament_id]": "100" }),
    );
    expect(result.length).toBeLessThanOrEqual(1);
  });

  it("dispatches matches into correct stages", async () => {
    const t1 = makeTournament({ id: 100, name: "Group Stage" });
    const t2 = makeTournament({ id: 200, name: "Playoffs" });
    const series = [makePandaScoreSerie({ tournaments: [t1, t2] })];

    const match1 = makePandaScoreMatch({ id: 1, tournament: { ...t1 } });
    const match2 = makePandaScoreMatch({ id: 2, tournament: { ...t2 } });

    vi.mocked(pandascoreGet)
      .mockResolvedValueOnce(series)
      .mockResolvedValueOnce([match1, match2])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    const result = await fetchSeriesFromPandaScore();

    expect(result).toHaveLength(1);
    expect(result[0].stages).toHaveLength(2);
    expect(result[0].stages[0].name).toBe("Group Stage");
    expect(result[0].stages[0].matches).toHaveLength(1);
    expect(result[0].stages[1].name).toBe("Playoffs");
    expect(result[0].stages[1].matches).toHaveLength(1);
  });

  it("returns empty array when no series have s/a tournaments", async () => {
    const series = [makePandaScoreSerie({ tournaments: [makeTournament({ tier: "c" })] })];

    vi.mocked(pandascoreGet).mockResolvedValueOnce(series);

    const result = await fetchSeriesFromPandaScore();

    expect(result).toEqual([]);
    expect(pandascoreGet).toHaveBeenCalledTimes(1);
  });

  it("excludes series where all stages have zero matches", async () => {
    const series = [
      makePandaScoreSerie({ id: 1, tournaments: [makeTournament({ id: 100 })] }),
      makePandaScoreSerie({ id: 2, tournaments: [makeTournament({ id: 200 })] }),
    ];

    // Only matches for tournament 100
    const match = makePandaScoreMatch({ id: 1, tournament: { ...makeTournament({ id: 100 }) } });

    vi.mocked(pandascoreGet)
      .mockResolvedValueOnce(series)
      .mockResolvedValueOnce([match])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    const result = await fetchSeriesFromPandaScore();

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("1");
  });

  it("builds serie name from league name + full_name", async () => {
    const series = [makePandaScoreSerie({
      full_name: "Spring 2025",
      league: { id: 10, name: "BLAST Premier", slug: "blast", image_url: null },
      tournaments: [makeTournament()],
    })];

    vi.mocked(pandascoreGet)
      .mockResolvedValueOnce(series)
      .mockResolvedValueOnce([makePandaScoreMatch()])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    const result = await fetchSeriesFromPandaScore();

    expect(result[0].name).toBe("BLAST Premier Spring 2025");
  });
});
