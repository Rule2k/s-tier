import type { Match } from "@/types/match";

export interface Tournament {
  id: string;
  name: string;
  tier: string;
  slug: string;
  region: string | null;
  beginAt: string;
  endAt: string;
  matches: Match[];
}

export const groupByTournament = (matches: Match[]): Tournament[] => {
  const map = new Map<string, Match[]>();

  for (const match of matches) {
    const id = match.tournament.id;
    const group = map.get(id) ?? [];
    group.push(match);
    map.set(id, group);
  }

  const tournaments: Tournament[] = [];

  for (const [, group] of map) {
    const sorted = [...group].sort(
      (a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime(),
    );
    const { tournament } = sorted[0];

    tournaments.push({
      id: tournament.id,
      name: tournament.name,
      tier: tournament.tier,
      slug: tournament.slug,
      region: tournament.region,
      beginAt: sorted[0].scheduledAt,
      endAt: sorted[sorted.length - 1].scheduledAt,
      matches: sorted,
    });
  }

  return tournaments.sort(
    (a, b) => new Date(a.beginAt).getTime() - new Date(b.beginAt).getTime(),
  );
};
