"use client";

import { useEffect, useMemo } from "react";
import { useTournamentNavigation } from "@/hooks/useTournamentNavigation";
import { TournamentTimeline } from "@/components/tournament/TournamentTimeline";
import { Spinner } from "@/components/ui/Spinner";
import { useTeamFilter } from "@/context/TeamFilterContext";
import { getUniqueTeams } from "@/utils/teams/getUniqueTeams";
import { filterTournamentsByTeam } from "@/utils/tournaments/filterTournamentsByTeam";

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

  const uniqueTeams = useMemo(() => getUniqueTeams(tournaments), [tournaments]);

  useEffect(() => {
    setTeams(uniqueTeams);
  }, [uniqueTeams, setTeams]);

  const filteredTournaments = useMemo(
    () => filterTournamentsByTeam(tournaments, selectedTeam),
    [tournaments, selectedTeam],
  );

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
