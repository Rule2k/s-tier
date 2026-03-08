"use client";

import { useMemo, type RefObject } from "react";
import type { Match, Tournament } from "@/types/match";
import { MatchCard } from "@/components/timeline/MatchCard";
import { DateSeparator } from "@/components/timeline/DateSeparator";
import { groupMatchesByDate } from "@/lib/matches/groupByDate";

type TournamentStatus =
  | { type: "finished"; winner: { name: string; logoUrl: string | null } | null }
  | { type: "live"; count: number }
  | { type: "in_progress" }
  | { type: "upcoming" };

const getTournamentStatus = (matches: Match[]): TournamentStatus => {
  const liveMatches = matches.filter((m) => m.status === "running");
  if (liveMatches.length > 0) return { type: "live", count: liveMatches.length };

  const hasFinished = matches.some((m) => m.status === "finished");
  const hasUpcoming = matches.some((m) => m.status === "not_started");

  if (hasFinished && !hasUpcoming) {
    const lastMatch = [...matches]
      .sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime())[0];
    const winnerTeam = lastMatch?.teams.find((t) => t.isWinner) ?? null;
    const winner = winnerTeam ? { name: winnerTeam.name, logoUrl: winnerTeam.logoUrl } : null;
    return { type: "finished", winner };
  }

  if (hasFinished) return { type: "in_progress" };

  return { type: "upcoming" };
};

export const TournamentBlock = ({
  tournament,
  scrollTargetDate,
  scrollRef,
}: {
  tournament: Tournament;
  scrollTargetDate?: string | null;
  scrollRef?: RefObject<HTMLDivElement | null>;
}) => {
  const status = useMemo(() => getTournamentStatus(tournament.matches), [tournament.matches]);

  const matchesByDate = groupMatchesByDate(tournament.matches);
  const dateKeys = Array.from(matchesByDate.keys());

  return (
    <div data-tournament-block className="rounded-2xl border border-white/[0.06] bg-white/[0.03] overflow-clip shadow-lg shadow-black/20">
      {/* Sticky glass header */}
      <div data-tournament-header className="sticky top-[57px] z-10 backdrop-blur-md bg-gray-950/80 border-b border-white/[0.06]">
        <div className="px-5 py-4 bg-gradient-to-r from-white/[0.06] to-transparent">
          <div className="flex items-center gap-3">
            {tournament.logoUrl && (
              <img src={tournament.logoUrl} alt="" className="h-8 w-8 rounded object-contain shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold text-white truncate">{tournament.name}</h3>
            </div>
            <div className="shrink-0 text-right">
              {status.type === "live" && (
                <div>
                  <span className="text-xs font-bold text-red-400">Live</span>
                  <p className="text-[10px] text-red-400/70 mt-0.5">
                    {status.count} {status.count > 1 ? "matches" : "match"}
                  </p>
                </div>
              )}
              {status.type === "in_progress" && (
                <span className="text-xs font-semibold text-blue-400">In Progress</span>
              )}
              {status.type === "upcoming" && (
                <span className="text-xs font-semibold text-gray-500">Upcoming</span>
              )}
              {status.type === "finished" && (
                <div>
                  <span className="text-xs font-semibold text-gray-500">Finished</span>
                  {status.winner && (
                    <div className="flex items-center justify-end gap-1.5 mt-0.5">
                      {status.winner.logoUrl && (
                        <img src={status.winner.logoUrl} alt="" className="h-4 w-4 rounded object-contain" />
                      )}
                      <span className="text-[11px] text-white">{status.winner.name}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="space-y-0">
          {dateKeys.map((dateKey, i) => (
            <div
              key={dateKey}
              ref={dateKey === scrollTargetDate ? scrollRef : undefined}
            >
              <DateSeparator date={new Date(dateKey)} isLast={i === dateKeys.length - 1} />
              <div className="space-y-2 pl-5 pb-4">
                {matchesByDate.get(dateKey)!.map((match) => (
                  <div key={match.id}>
                    <MatchCard match={match} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
