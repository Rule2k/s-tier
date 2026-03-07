"use client";

import { TeamFilter } from "@/components/ui/TeamFilter";
import { useTeamFilter } from "@/context/TeamFilterContext";

export const Header = () => {
  const { teams, selectedTeam, setSelectedTeam } = useTeamFilter();

  return (
    <header className="sticky top-0 z-20 border-b border-gray-800 bg-gray-950 px-6 py-3">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-baseline gap-2 shrink-0">
          <h1 className="text-xl font-bold tracking-tight">S-Tier</h1>
          <span className="hidden min-[400px]:inline text-xs text-gray-500">CS2 Match Tracker</span>
        </div>
        {teams.length > 0 && (
          <TeamFilter teams={teams} selectedTeam={selectedTeam} onChange={setSelectedTeam} />
        )}
      </div>
    </header>
  );
};
