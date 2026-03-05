import { fetchMatchesFromPandaScore } from "./fetchMatches";
import { pandascoreGet } from "./client";
import { mapMatch } from "./mappers/mapMatch";
import { makePandaScoreMatch, makeMatch } from "@/test/fixtures/matches";
import type { PandaScoreTournament } from "./types/match";

vi.mock("./client");
vi.mock("./mappers/mapMatch");

describe("fetchMatchesFromPandaScore", () => {
  const mockTournaments: PandaScoreTournament[] = [
    { id: 100, name: "BLAST", slug: "blast", tier: "s", region: "EU", league_id: 10, serie_id: 50 },
    { id: 200, name: "IEM", slug: "iem", tier: "a", region: "NA", league_id: 20, serie_id: 60 },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(mapMatch).mockReturnValue(makeMatch());
  });

  it("fetches tournaments then past/running/upcoming matches", async () => {
    vi.mocked(pandascoreGet)
      .mockResolvedValueOnce(mockTournaments)           // tournaments
      .mockResolvedValueOnce([makePandaScoreMatch()])    // past
      .mockResolvedValueOnce([])                         // running
      .mockResolvedValueOnce([makePandaScoreMatch()]);   // upcoming

    await fetchMatchesFromPandaScore();

    // First call: tournaments
    expect(pandascoreGet).toHaveBeenCalledWith(
      "/csgo/tournaments",
      expect.objectContaining({ "filter[tier]": "s,a" }),
    );

    // Parallel calls: past, running, upcoming — all filter by tournament IDs
    const tournamentIds = "100,200";
    expect(pandascoreGet).toHaveBeenCalledWith(
      "/csgo/matches/past",
      expect.objectContaining({ "filter[tournament_id]": tournamentIds }),
    );
    expect(pandascoreGet).toHaveBeenCalledWith(
      "/csgo/matches/running",
      expect.objectContaining({ "filter[tournament_id]": tournamentIds }),
    );
    expect(pandascoreGet).toHaveBeenCalledWith(
      "/csgo/matches/upcoming",
      expect.objectContaining({ "filter[tournament_id]": tournamentIds }),
    );
  });

  it("maps all fetched matches with mapMatch", async () => {
    const past = [makePandaScoreMatch({ id: 1 })];
    const running = [makePandaScoreMatch({ id: 2 })];
    const upcoming = [makePandaScoreMatch({ id: 3 })];

    vi.mocked(pandascoreGet)
      .mockResolvedValueOnce(mockTournaments)
      .mockResolvedValueOnce(past)
      .mockResolvedValueOnce(running)
      .mockResolvedValueOnce(upcoming);

    await fetchMatchesFromPandaScore();

    expect(mapMatch).toHaveBeenCalledTimes(3);
  });

  it("returns empty array when no tournaments found", async () => {
    vi.mocked(pandascoreGet).mockResolvedValueOnce([]);

    const result = await fetchMatchesFromPandaScore();

    expect(result).toEqual([]);
    // Should not call match endpoints
    expect(pandascoreGet).toHaveBeenCalledTimes(1);
  });
});
