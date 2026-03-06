import { mapMatch } from "./mapMatch";
import { makePandaScoreMatch } from "@/test/fixtures/matches";

describe("mapMatch", () => {
  it("maps id from number to string", () => {
    const result = mapMatch(makePandaScoreMatch({ id: 9999 }));
    expect(result.id).toBe("9999");
  });

  it("uses scheduled_at for scheduledAt", () => {
    const result = mapMatch(makePandaScoreMatch({ scheduled_at: "2025-06-15T15:00:00Z" }));
    expect(result.scheduledAt).toBe("2025-06-15T15:00:00Z");
  });

  it("falls back to begin_at when scheduled_at is null", () => {
    const result = mapMatch(makePandaScoreMatch({ scheduled_at: null, begin_at: "2025-06-15T15:05:00Z" }));
    expect(result.scheduledAt).toBe("2025-06-15T15:05:00Z");
  });

  it("returns empty string when both scheduled_at and begin_at are null", () => {
    const result = mapMatch(makePandaScoreMatch({ scheduled_at: null, begin_at: null }));
    expect(result.scheduledAt).toBe("");
  });

  it("formats number_of_games as Bo{n}", () => {
    expect(mapMatch(makePandaScoreMatch({ number_of_games: 3 })).format).toBe("Bo3");
    expect(mapMatch(makePandaScoreMatch({ number_of_games: 5 })).format).toBe("Bo5");
    expect(mapMatch(makePandaScoreMatch({ number_of_games: 1 })).format).toBe("Bo1");
  });

  it("maps tournament with id as string", () => {
    const result = mapMatch(makePandaScoreMatch());
    expect(result.tournament).toEqual({
      id: "100",
      name: "BLAST Premier Spring Finals 2025",
      tier: "s",
      slug: "blast-premier-spring-finals-2025",
      region: "EU",
    });
  });

  it("maps teams with scores and detects the winner", () => {
    const result = mapMatch(makePandaScoreMatch());
    expect(result.teams).toHaveLength(2);
    expect(result.teams[0]).toEqual({
      name: "Team Alpha",
      acronym: "TA",
      imageUrl: "https://img.pandascore.co/team-alpha.png",
      score: 2,
      isWinner: true,
    });
    expect(result.teams[1]).toEqual({
      name: "Team Bravo",
      acronym: "TB",
      imageUrl: "https://img.pandascore.co/team-bravo.png",
      score: 1,
      isWinner: false,
    });
  });

  it("handles upcoming match with no results and no winner", () => {
    const result = mapMatch(
      makePandaScoreMatch({
        status: "not_started",
        winner_id: null,
        results: [],
      }),
    );
    expect(result.teams[0].score).toBeNull();
    expect(result.teams[0].isWinner).toBe(false);
    expect(result.teams[1].score).toBeNull();
    expect(result.teams[1].isWinner).toBe(false);
  });

  it("preserves the original status", () => {
    expect(mapMatch(makePandaScoreMatch({ status: "running" })).status).toBe("running");
    expect(mapMatch(makePandaScoreMatch({ status: "canceled" })).status).toBe("canceled");
  });
});
