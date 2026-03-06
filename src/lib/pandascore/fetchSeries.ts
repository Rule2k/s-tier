import { pandascoreGet } from "./client";
import { mapMatch } from "./mappers/mapMatch";

import type { PandaScoreMatch, PandaScoreSerie } from "./types/match";
import type { Match, Serie, Stage } from "@/types/match";

const fetchAllMatches = async (tournamentIds: string): Promise<Match[]> => {
  const [pastMatches, runningMatches, upcomingMatches] = await Promise.all([
    pandascoreGet<PandaScoreMatch[]>("/csgo/matches/past", {
      "filter[tournament_id]": tournamentIds,
      per_page: "100",
    }),
    pandascoreGet<PandaScoreMatch[]>("/csgo/matches/running", {
      "filter[tournament_id]": tournamentIds,
    }),
    pandascoreGet<PandaScoreMatch[]>("/csgo/matches/upcoming", {
      "filter[tournament_id]": tournamentIds,
      per_page: "100",
    }),
  ]);

  return [...pastMatches, ...runningMatches, ...upcomingMatches].map(mapMatch);
};

const groupMatchesByTournament = (matches: Match[]): Map<string, Match[]> => {
  const matchesByTournament = new Map<string, Match[]>();
  for (const match of matches) {
    const tournamentId = match.tournament.id;
    const matchesForTournament = matchesByTournament.get(tournamentId) ?? [];
    matchesForTournament.push(match);
    matchesByTournament.set(tournamentId, matchesForTournament);
  }
  return matchesByTournament;
};

const sortMatchesByScheduledTime = (matches: Match[]): void => {
  matches.sort(
    (matchA, matchB) => new Date(matchA.scheduledAt).getTime() - new Date(matchB.scheduledAt).getTime(),
  );
};

const buildSerieFromPandaScore = (
  pandaSerie: PandaScoreSerie,
  matchesByTournament: Map<string, Match[]>,
): Serie => {
  const stages: Stage[] = pandaSerie.tournaments.map((tournament) => {
    const matches = matchesByTournament.get(String(tournament.id)) ?? [];
    sortMatchesByScheduledTime(matches);
    return { id: String(tournament.id), name: tournament.name, matches };
  });

  const tiers = pandaSerie.tournaments.map((tournament) => tournament.tier);
  const tierPriority = ["s", "a", "b", "c", "d", "unranked"] as const;
  const highestTier = tierPriority.find((t) => tiers.includes(t)) ?? "unranked";
  const region = pandaSerie.tournaments.find((tournament) => tournament.region)?.region ?? null;
  const serieName = pandaSerie.league.name + (pandaSerie.full_name ? ` ${pandaSerie.full_name}` : "");

  return {
    id: String(pandaSerie.id),
    name: serieName,
    leagueImageUrl: pandaSerie.league.image_url,
    tier: highestTier,
    region,
    beginAt: pandaSerie.begin_at ?? "",
    endAt: pandaSerie.end_at ?? "",
    stages,
  };
};

export const fetchSeriesFromPandaScore = async (): Promise<Serie[]> => {
  const pandaSeries = await pandascoreGet<PandaScoreSerie[]>("/csgo/series", {
    "filter[tier]": "s,a",
    per_page: "100",
    sort: "-begin_at",
  });

  const allTournamentIds = pandaSeries
    .flatMap((serie) => serie.tournaments.map((tournament) => tournament.id))
    .join(",");

  if (!allTournamentIds) return [];

  const allMatches = await fetchAllMatches(allTournamentIds);
  const matchesByTournament = groupMatchesByTournament(allMatches);

  return pandaSeries
    .map((serie) => buildSerieFromPandaScore(serie, matchesByTournament))
    .filter((serie) => serie.stages.some((stage) => stage.matches.length > 0))
    .sort((serieA, serieB) => new Date(serieA.beginAt).getTime() - new Date(serieB.beginAt).getTime());
};
