"use client";

import { useState, useMemo } from "react";
import { useSeries } from "@/hooks/useSeries";
import { TournamentTimeline } from "@/components/tournament/TournamentTimeline";
import { Spinner } from "@/components/ui/Spinner";
import { TeamFilter } from "@/components/ui/TeamFilter";

export default function Home() {
  const { data: series, isLoading, error } = useSeries();
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);

  const uniqueTeams = useMemo(() => {
    if (!series) return [];
    const teamMap = new Map<string, { acronym: string | null; imageUrl: string | null }>();
    for (const serie of series) {
      for (const stage of serie.stages) {
        for (const match of stage.matches) {
          for (const team of match.teams) {
            if (!teamMap.has(team.name)) {
              teamMap.set(team.name, { acronym: team.acronym, imageUrl: team.imageUrl });
            }
          }
        }
      }
    }
    return Array.from(teamMap, ([name, { acronym, imageUrl }]) => ({ name, acronym, imageUrl }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [series]);

  const filteredSeries = useMemo(() => {
    if (!series || !selectedTeam) return series;
    return series
      .map((serie) => ({
        ...serie,
        stages: serie.stages.map((stage) => ({
          ...stage,
          matches: stage.matches.filter((match) =>
            match.teams.some((team) => team.name === selectedTeam),
          ),
        })),
      }))
      .filter((serie) => serie.stages.some((stage) => stage.matches.length > 0));
  }, [series, selectedTeam]);

  if (isLoading) return <Spinner />;
  if (error) return <p className="text-red-400">Failed to load matches.</p>;
  if (!series?.length) return <p className="text-gray-500">No matches found.</p>;

  return (
    <div>
      <div className="mb-4">
        <TeamFilter teams={uniqueTeams} selectedTeam={selectedTeam} onChange={setSelectedTeam} />
      </div>
      <TournamentTimeline series={filteredSeries ?? []} />
    </div>
  );
}
