"use client";

import { useEffect, useRef } from "react";
import type { Match } from "@/types/match";
import { groupByTournament } from "@/lib/tournaments/groupByTournament";
import { buildTimelineRows } from "@/lib/tournaments/buildTimelineRows";
import { TournamentBlock } from "./TournamentBlock";

const findScrollTarget = (
  rows: ReturnType<typeof buildTimelineRows>,
): { rowIndex: number; tournamentId: string } | null => {
  // Find first tournament with a live match
  for (let r = 0; r < rows.length; r++) {
    for (const t of rows[r].tournaments) {
      if (t.matches.some((m) => m.status === "running")) {
        return { rowIndex: r, tournamentId: t.id };
      }
    }
  }

  // Otherwise, find tournament closest to now
  const now = Date.now();
  let closest: { rowIndex: number; tournamentId: string; diff: number } | null = null;

  for (let r = 0; r < rows.length; r++) {
    for (const t of rows[r].tournaments) {
      const begin = new Date(t.beginAt).getTime();
      const end = new Date(t.endAt).getTime();
      // Prefer ongoing tournaments (now is between begin and end)
      const diff = now >= begin && now <= end ? 0 : Math.min(Math.abs(now - begin), Math.abs(now - end));
      if (!closest || diff < closest.diff) {
        closest = { rowIndex: r, tournamentId: t.id, diff };
      }
    }
  }

  return closest;
};

export const TournamentTimeline = ({ matches }: { matches: Match[] }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const hasScrolled = useRef(false);

  const tournaments = groupByTournament(matches.filter((m) => m.scheduledAt));
  const rows = buildTimelineRows(tournaments);
  const scrollTarget = findScrollTarget(rows);

  useEffect(() => {
    if (hasScrolled.current || !scrollRef.current) return;
    scrollRef.current.scrollIntoView?.({ block: "start" });
    hasScrolled.current = true;
  }, []);

  return (
    <div className="space-y-6">
      {rows.map((row, rowIndex) => {
        const isMulti = row.tournaments.length > 1;

        return (
          <div
            key={row.tournaments.map((t) => t.id).join("-")}
            ref={scrollTarget?.rowIndex === rowIndex ? scrollRef : undefined}
            className={
              isMulti
                ? "flex gap-4 overflow-x-auto pb-2 max-md:flex-col max-md:overflow-x-visible"
                : undefined
            }
          >
            {row.tournaments.map((tournament) => (
              <div
                key={tournament.id}
                className={isMulti ? "min-w-[350px] flex-shrink-0 max-md:min-w-0 max-md:w-full" : undefined}
              >
                <TournamentBlock tournament={tournament} />
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
};
