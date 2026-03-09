"use client";

import { TeamFilter } from "@/components/ui/TeamFilter";
import { useTeamFilter } from "@/context/TeamFilterContext";
import { format } from "date-fns";

export const Header = () => {
  const { teams, selectedTeam, setSelectedTeam } = useTeamFilter();
  const todayFormatted = format(new Date(), "EEEE, MMMM d, yyyy");

  return (
    <>
      {/* Masthead — scrolls with page */}
      <header className="text-center px-6 pt-8 pb-5 border-b-[6px] border-rule">
        <p className="text-[0.7rem] tracking-[0.15em] uppercase mb-1.5 text-muted">
          {todayFormatted}
        </p>
        <h1 className="font-serif text-[clamp(2rem,7vw,4rem)] font-bold tracking-[0.06em] uppercase leading-none">
          S-Tier // CS2 Match Tracker
        </h1>
        <p className="text-[0.65rem] tracking-[0.2em] uppercase text-dim mt-1.5">
          All scores updated live — Evening Edition
        </p>
      </header>

      {/* Filter bar — sticky */}
      <div className="sticky top-0 z-200 bg-newsprint border-b-2 border-rule px-6 py-2 flex items-center justify-center gap-3 max-sm:px-4 max-sm:py-1.5">
        <label className="font-serif text-[0.7rem] font-bold tracking-[0.1em] uppercase">
          Team
        </label>
        {teams.length > 0 && (
          <TeamFilter teams={teams} selectedTeam={selectedTeam} onChange={setSelectedTeam} />
        )}
      </div>
    </>
  );
};
