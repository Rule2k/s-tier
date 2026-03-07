import { fetchSeriesFromPandaScore, selectRelevantSeries } from "./fetchSeries";
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

  it("fetches series then matches per serie", async () => {
    const series = [makePandaScoreSerie({ tournaments: [makeTournament()] })];

    vi.mocked(pandascoreGet)
      .mockResolvedValueOnce(series)                     // /csgo/series
      .mockResolvedValueOnce([makePandaScoreMatch()]);   // /csgo/matches for serie 50

    await fetchSeriesFromPandaScore();

    expect(pandascoreGet).toHaveBeenCalledWith(
      "/csgo/series",
      expect.objectContaining({ per_page: "100", sort: "-begin_at" }),
    );
    expect(pandascoreGet).toHaveBeenCalledWith(
      "/csgo/matches",
      expect.objectContaining({ "filter[serie_id]": "50", per_page: "100" }),
    );
  });

  it("includes series of all tiers", async () => {
    const series = [
      makePandaScoreSerie({ id: 1, tournaments: [makeTournament({ id: 100, tier: "b" })] }),
      makePandaScoreSerie({ id: 2, tournaments: [makeTournament({ id: 200, tier: "a" })] }),
    ];

    const match1 = makePandaScoreMatch({ id: 1, tournament: { ...makeTournament({ id: 100, tier: "b" }) } });
    const match2 = makePandaScoreMatch({ id: 2, tournament: { ...makeTournament({ id: 200, tier: "a" }) } });

    vi.mocked(pandascoreGet)
      .mockResolvedValueOnce(series)
      .mockResolvedValueOnce([match1])   // matches for serie 1
      .mockResolvedValueOnce([match2]);  // matches for serie 2

    const result = await fetchSeriesFromPandaScore();

    expect(result).toHaveLength(2);
    expect(result.map((s) => s.tier)).toEqual(expect.arrayContaining(["b", "a"]));
  });

  it("dispatches matches into correct stages", async () => {
    const t1 = makeTournament({ id: 100, name: "Group Stage" });
    const t2 = makeTournament({ id: 200, name: "Playoffs" });
    const series = [makePandaScoreSerie({ tournaments: [t1, t2] })];

    const match1 = makePandaScoreMatch({ id: 1, tournament: { ...t1 } });
    const match2 = makePandaScoreMatch({ id: 2, tournament: { ...t2 } });

    vi.mocked(pandascoreGet)
      .mockResolvedValueOnce(series)
      .mockResolvedValueOnce([match1, match2]);  // matches for serie 50

    const result = await fetchSeriesFromPandaScore();

    expect(result).toHaveLength(1);
    expect(result[0].stages).toHaveLength(2);
    expect(result[0].stages[0].name).toBe("Group Stage");
    expect(result[0].stages[0].matches).toHaveLength(1);
    expect(result[0].stages[1].name).toBe("Playoffs");
    expect(result[0].stages[1].matches).toHaveLength(1);
  });

  it("assigns correct tier based on priority", async () => {
    const series = [makePandaScoreSerie({ tournaments: [makeTournament({ tier: "c" })] })];

    vi.mocked(pandascoreGet)
      .mockResolvedValueOnce(series)
      .mockResolvedValueOnce([makePandaScoreMatch()]);

    const result = await fetchSeriesFromPandaScore();

    expect(result).toHaveLength(1);
    expect(result[0].tier).toBe("c");
  });

  it("excludes series where all stages have zero matches", async () => {
    const series = [
      makePandaScoreSerie({ id: 1, tournaments: [makeTournament({ id: 100 })] }),
      makePandaScoreSerie({ id: 2, tournaments: [makeTournament({ id: 200 })] }),
    ];

    const match = makePandaScoreMatch({ id: 1, tournament: { ...makeTournament({ id: 100 }) } });

    vi.mocked(pandascoreGet)
      .mockResolvedValueOnce(series)
      .mockResolvedValueOnce([match])  // matches for serie 1
      .mockResolvedValueOnce([]);      // matches for serie 2

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
      .mockResolvedValueOnce([makePandaScoreMatch()]);

    const result = await fetchSeriesFromPandaScore();

    expect(result[0].name).toBe("BLAST Premier Spring 2025");
  });
});

describe("selectRelevantSeries", () => {
  const makeSerieAt = (id: number, beginMonth: number, endMonth: number) =>
    makePandaScoreSerie({
      id,
      begin_at: `2026-${String(beginMonth).padStart(2, "0")}-01T00:00:00Z`,
      end_at: `2026-${String(endMonth).padStart(2, "0")}-28T23:59:59Z`,
    });

  it("returns all series when length <= count", () => {
    const series = [makeSerieAt(1, 1, 2), makeSerieAt(2, 3, 4)];
    const result = selectRelevantSeries(series, 5);
    expect(result).toHaveLength(2);
  });

  it("returns current series + 2 before + 2 after", () => {
    // 7 series: Jan-Feb, Feb-Mar, Mar-Apr (current), Apr-May, May-Jun, Jun-Jul, Jul-Aug
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-15T12:00:00Z"));

    const series = [
      makeSerieAt(1, 1, 1),
      makeSerieAt(2, 2, 2),
      makeSerieAt(3, 3, 3),  // current
      makeSerieAt(4, 4, 4),
      makeSerieAt(5, 5, 5),
      makeSerieAt(6, 6, 6),
      makeSerieAt(7, 7, 7),
    ];

    const result = selectRelevantSeries(series, 5);
    expect(result.map((s) => s.id)).toEqual([1, 2, 3, 4, 5]);

    vi.useRealTimers();
  });

  it("picks closest series when none is current", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-15T12:00:00Z")); // between series 3 and 4

    const series = [
      makeSerieAt(1, 1, 1),
      makeSerieAt(2, 2, 2),
      makeSerieAt(3, 3, 3),
      makeSerieAt(4, 5, 5),  // closest: begin_at is ~15 days away
      makeSerieAt(5, 6, 6),
      makeSerieAt(6, 7, 7),
      makeSerieAt(7, 8, 8),
    ];

    const result = selectRelevantSeries(series, 5);
    // Anchor is series 3 (end_at March 28 → 18 days away) or 4 (begin_at May 1 → 16 days away)
    // Series 4 is closer, so window: [2, 3, 4, 5, 6]
    expect(result.map((s) => s.id)).toEqual([2, 3, 4, 5, 6]);

    vi.useRealTimers();
  });

  it("adjusts window at start of list", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-15T12:00:00Z"));

    const series = [
      makeSerieAt(1, 1, 1),  // current — index 0, can't go 2 before
      makeSerieAt(2, 2, 2),
      makeSerieAt(3, 3, 3),
      makeSerieAt(4, 4, 4),
      makeSerieAt(5, 5, 5),
      makeSerieAt(6, 6, 6),
    ];

    const result = selectRelevantSeries(series, 5);
    expect(result.map((s) => s.id)).toEqual([1, 2, 3, 4, 5]);

    vi.useRealTimers();
  });

  it("adjusts window at end of list", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-15T12:00:00Z"));

    const series = [
      makeSerieAt(1, 1, 1),
      makeSerieAt(2, 2, 2),
      makeSerieAt(3, 3, 3),
      makeSerieAt(4, 4, 4),
      makeSerieAt(5, 5, 5),
      makeSerieAt(6, 6, 6),  // current — index 5 (last), can't go 2 after
    ];

    const result = selectRelevantSeries(series, 5);
    expect(result.map((s) => s.id)).toEqual([2, 3, 4, 5, 6]);

    vi.useRealTimers();
  });
});
