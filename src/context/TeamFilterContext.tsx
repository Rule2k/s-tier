"use client";

import { createContext, useContext, useState } from "react";

interface TeamFilterContextValue {
  selectedTeam: string | null;
  setSelectedTeam: (team: string | null) => void;
  teams: { name: string; imageUrl: string | null }[];
  setTeams: (teams: { name: string; imageUrl: string | null }[]) => void;
}

const TeamFilterContext = createContext<TeamFilterContextValue>({
  selectedTeam: null,
  setSelectedTeam: () => {},
  teams: [],
  setTeams: () => {},
});

export const useTeamFilter = () => useContext(TeamFilterContext);

export const TeamFilterProvider = ({ children }: { children: React.ReactNode }) => {
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [teams, setTeams] = useState<TeamFilterContextValue["teams"]>([]);

  return (
    <TeamFilterContext.Provider value={{ selectedTeam, setSelectedTeam, teams, setTeams }}>
      {children}
    </TeamFilterContext.Provider>
  );
};
