import { pandascoreGet } from "./client";
import { mapMatch } from "./mappers/mapMatch";

import type { PandaScoreMatch, PandaScoreSerie } from "./types/match";
import type { Match, Serie, Stage } from "@/types/match";

export const selectRelevantSeries = (
  series: PandaScoreSerie[],
  count: number,
): PandaScoreSerie[] => {
  if (series.length <= count) return series;

  const sortedSeries = [...series].sort(
    (a, b) => new Date(a.begin_at ?? "").getTime() - new Date(b.begin_at ?? "").getTime(),
  );

  const now = Date.now();

  // Find the current series (begin_at <= now <= end_at)
  let anchorIndex = sortedSeries.findIndex((sortedSerie) => {
    const begin = new Date(sortedSerie.begin_at ?? "").getTime();
    const end = new Date(sortedSerie.end_at ?? "").getTime();
    return begin <= now && now <= end;
  });

  // If none is current, find the closest to now
  if (anchorIndex === -1) {
    let minDistance = Infinity;
    sortedSeries.forEach((s, i) => {
      const begin = new Date(s.begin_at ?? "").getTime();
      const end = new Date(s.end_at ?? "").getTime();
      const distance = Math.min(Math.abs(now - begin), Math.abs(now - end));
      if (distance < minDistance) {
        minDistance = distance;
        anchorIndex = i;
      }
    });
  }

  // Build a window of `count` centered on anchorIndex
  const half = Math.floor(count / 2);
  let start = anchorIndex - half;
  let end = start + count;

  if (start < 0) {
    start = 0;
    end = count;
  }
  if (end > sortedSeries.length) {
    end = sortedSeries.length;
    start = end - count;
  }

  return sortedSeries.slice(start, end);
};

const fetchMatchesForSerie = async (serieId: number): Promise<Match[]> => {
  const matches = await pandascoreGet<PandaScoreMatch[]>("/csgo/matches", {
    "filter[serie_id]": String(serieId),
    per_page: "100",
  });

  return matches.map(mapMatch);
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

export const fetchSeriesIndex = async (): Promise<PandaScoreSerie[]> =>
  pandascoreGet<PandaScoreSerie[]>("/csgo/series", {
    "filter[tier]": "s,a",
    per_page: "100",
    sort: "-begin_at",
  });

export const fetchSerieWithMatches = async (
  pandaSerie: PandaScoreSerie,
): Promise<Serie | null> => {
  const matches = await fetchMatchesForSerie(pandaSerie.id);
  if (matches.length === 0) return null;

  const matchesByTournament = groupMatchesByTournament(matches);
  return buildSerieFromPandaScore(pandaSerie, matchesByTournament);
};

export const fetchSeriesFromPandaScore = async (): Promise<Serie[]> => {
  const pandaSeries = await fetchSeriesIndex();
  const relevantSeries = selectRelevantSeries(pandaSeries, 5);

  if (relevantSeries.length === 0) return [];

  const results = await Promise.all(
    relevantSeries.map((serie) => fetchSerieWithMatches(serie)),
  );

  return results
    .filter((serie): serie is Serie => serie !== null)
    .sort((serieA, serieB) => new Date(serieA.beginAt).getTime() - new Date(serieB.beginAt).getTime());
};
