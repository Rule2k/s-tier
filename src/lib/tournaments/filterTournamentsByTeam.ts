import type { TournamentView } from "@/types/match";

export const filterTournamentsByTeam = (
  tournaments: TournamentView[],
  selectedTeam: string | null,
): TournamentView[] => {
  if (!tournaments.length || !selectedTeam) return tournaments;

  return tournaments
    .map((tournament) => ({
      ...tournament,
      allMatches: tournament.matches,
      matches: tournament.matches.filter((match) =>
        match.teams.some((team) => team.name === selectedTeam),
      ),
    }))
    .filter((tournament) => tournament.matches.length > 0);
};
