"use client";

import { useEffect, useMemo } from "react";
import { useTournamentNavigation } from "@/hooks/useTournamentNavigation";
import { TournamentTimeline } from "@/components/tournament/TournamentTimeline";
import { Spinner } from "@/components/ui/Spinner";
import { useTeamFilter } from "@/context/TeamFilterContext";

export default function Home() {
  const {
    tournaments,
    isLoading,
    error,
    loadPrevious,
    loadNext,
    hasPrevious,
    hasNext,
    loadingDirection,
  } = useTournamentNavigation();
  const { selectedTeam, setTeams } = useTeamFilter();

  const uniqueTeams = useMemo(() => {
    if (!tournaments.length) return [];
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
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [tournaments]);

  useEffect(() => {
    setTeams(uniqueTeams);
  }, [uniqueTeams, setTeams]);

  const filteredTournaments = useMemo(() => {
    if (!tournaments.length || !selectedTeam) return tournaments;
    return tournaments
      .map((tournament) => ({
        ...tournament,
        matches: tournament.matches.filter((match) =>
          match.teams.some((team) => team.name === selectedTeam),
        ),
      }))
      .filter((tournament) => tournament.matches.length > 0);
  }, [tournaments, selectedTeam]);

  if (isLoading) return <Spinner />;
  if (error) return <p className="text-red-400">Failed to load matches.</p>;
  if (!tournaments.length) return <p className="text-gray-500">No matches found.</p>;

  return (
    <TournamentTimeline
      tournaments={filteredTournaments}
      onLoadPrevious={hasPrevious ? loadPrevious : undefined}
      onLoadNext={hasNext ? loadNext : undefined}
      loadingDirection={loadingDirection}
    />
  );
}
