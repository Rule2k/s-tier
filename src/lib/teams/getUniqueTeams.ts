import type { TournamentView } from "@/types/match";

export const getUniqueTeams = (tournaments: TournamentView[]) => {
  const teamMap = new Map<string, { imageUrl: string | null }>();

  for (const tournament of tournaments) {
    for (const match of tournament.matches) {
      for (const team of match.teams) {
        if (!teamMap.has(team.name)) {
          teamMap.set(team.name, { imageUrl: team.logoUrl });
        }
      }
    }
  }

  return Array.from(teamMap, ([name, { imageUrl }]) => ({ name, imageUrl }))
    .sort((teamA, teamB) => teamA.name.localeCompare(teamB.name));
};
