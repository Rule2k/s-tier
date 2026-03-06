import { groupByTournament } from "./groupByTournament";
import { makeMatch } from "@/test/fixtures/matches";

describe("groupByTournament", () => {
  it("groups matches by tournament id", () => {
    const matches = [
      makeMatch({ id: "1", tournament: { id: "100", name: "BLAST", tier: "s", slug: "blast", region: "EU" } }),
      makeMatch({ id: "2", tournament: { id: "200", name: "IEM", tier: "a", slug: "iem", region: "NA" } }),
      makeMatch({ id: "3", tournament: { id: "100", name: "BLAST", tier: "s", slug: "blast", region: "EU" } }),
    ];

    const result = groupByTournament(matches);
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe("100");
    expect(result[0].matches).toHaveLength(2);
    expect(result[1].id).toBe("200");
    expect(result[1].matches).toHaveLength(1);
  });

  it("computes beginAt and endAt from match dates", () => {
    const matches = [
      makeMatch({ id: "1", scheduledAt: "2025-06-15T15:00:00Z", tournament: { id: "100", name: "T", tier: "s", slug: "t", region: null } }),
      makeMatch({ id: "2", scheduledAt: "2025-06-17T18:00:00Z", tournament: { id: "100", name: "T", tier: "s", slug: "t", region: null } }),
      makeMatch({ id: "3", scheduledAt: "2025-06-16T12:00:00Z", tournament: { id: "100", name: "T", tier: "s", slug: "t", region: null } }),
    ];

    const result = groupByTournament(matches);
    expect(result[0].beginAt).toBe("2025-06-15T15:00:00Z");
    expect(result[0].endAt).toBe("2025-06-17T18:00:00Z");
  });

  it("sorts tournaments by beginAt ascending", () => {
    const matches = [
      makeMatch({ id: "1", scheduledAt: "2025-06-20T10:00:00Z", tournament: { id: "200", name: "Late", tier: "a", slug: "late", region: null } }),
      makeMatch({ id: "2", scheduledAt: "2025-06-10T10:00:00Z", tournament: { id: "100", name: "Early", tier: "s", slug: "early", region: null } }),
    ];

    const result = groupByTournament(matches);
    expect(result[0].name).toBe("Early");
    expect(result[1].name).toBe("Late");
  });

  it("sorts matches within a tournament by scheduledAt", () => {
    const matches = [
      makeMatch({ id: "2", scheduledAt: "2025-06-16T12:00:00Z", tournament: { id: "100", name: "T", tier: "s", slug: "t", region: null } }),
      makeMatch({ id: "1", scheduledAt: "2025-06-15T10:00:00Z", tournament: { id: "100", name: "T", tier: "s", slug: "t", region: null } }),
    ];

    const result = groupByTournament(matches);
    expect(result[0].matches[0].id).toBe("1");
    expect(result[0].matches[1].id).toBe("2");
  });

  it("returns empty array for empty input", () => {
    expect(groupByTournament([])).toEqual([]);
  });
});
