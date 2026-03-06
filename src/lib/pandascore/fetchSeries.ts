import { pandascoreGet } from "./client";
import { mapMatch } from "./mappers/mapMatch";
import type { PandaScoreMatch, PandaScoreSerie } from "./types/match";
import type { Match, Serie, Stage } from "@/types/match";

export const fetchSeriesFromPandaScore = async (): Promise<Serie[]> => {
  const pandaSeries = await pandascoreGet<PandaScoreSerie[]>("/csgo/series", {
    per_page: "50",
    sort: "-begin_at",
  });

  const filteredSeries = pandaSeries.filter((s) =>
    s.tournaments.some((t) => t.tier === "s" || t.tier === "a"),
  );

  const tournamentIds = filteredSeries
    .flatMap((s) => s.tournaments.map((t) => t.id))
    .join(",");

  if (!tournamentIds) return [];

  const [past, running, upcoming] = await Promise.all([
    pandascoreGet<PandaScoreMatch[]>("/csgo/matches/past", {
      "filter[tournament_id]": tournamentIds,
      per_page: "50",
    }),
    pandascoreGet<PandaScoreMatch[]>("/csgo/matches/running", {
      "filter[tournament_id]": tournamentIds,
    }),
    pandascoreGet<PandaScoreMatch[]>("/csgo/matches/upcoming", {
      "filter[tournament_id]": tournamentIds,
      per_page: "50",
    }),
  ]);

  const allMatches = [...past, ...running, ...upcoming].map(mapMatch);

  const matchesByTournament = new Map<string, Match[]>();
  for (const match of allMatches) {
    const tid = match.tournament.id;
    const group = matchesByTournament.get(tid) ?? [];
    group.push(match);
    matchesByTournament.set(tid, group);
  }

  return filteredSeries
    .map((s) => {
      const stages: Stage[] = s.tournaments.map((t) => {
        const matches = matchesByTournament.get(String(t.id)) ?? [];
        matches.sort(
          (a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime(),
        );
        return { id: String(t.id), name: t.name, matches };
      });

      const tiers = s.tournaments.map((t) => t.tier);
      const tier = tiers.includes("s") ? "s" : "a";

      const region = s.tournaments.find((t) => t.region)?.region ?? null;

      const name = s.league.name + (s.full_name ? ` ${s.full_name}` : "");

      return {
        id: String(s.id),
        name,
        leagueImageUrl: s.league.image_url,
        tier,
        region,
        beginAt: s.begin_at ?? "",
        endAt: s.end_at ?? "",
        stages,
      };
    })
    .filter((s) => s.stages.some((st) => st.matches.length > 0))
    .sort((a, b) => new Date(a.beginAt).getTime() - new Date(b.beginAt).getTime());
};
