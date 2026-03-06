"use client";

import { useState } from "react";
import type { Tournament } from "@/lib/tournaments/groupByTournament";
import { MatchCard } from "@/components/timeline/MatchCard";
import { DateSeparator } from "@/components/timeline/DateSeparator";
import { startOfDay } from "date-fns";
import { format } from "date-fns";

const tierBadge: Record<string, { label: string; className: string }> = {
  s: { label: "S", className: "bg-yellow-500/20 text-yellow-400" },
  a: { label: "A", className: "bg-purple-500/20 text-purple-400" },
};

const groupMatchesByDate = (matches: Tournament["matches"]) => {
  const groups = new Map<string, Tournament["matches"]>();
  for (const match of matches) {
    const key = startOfDay(new Date(match.scheduledAt)).toISOString();
    const group = groups.get(key) ?? [];
    group.push(match);
    groups.set(key, group);
  }
  return groups;
};

const formatDateRange = (beginAt: string, endAt: string): string => {
  const start = new Date(beginAt);
  const end = new Date(endAt);
  if (startOfDay(start).getTime() === startOfDay(end).getTime()) {
    return format(start, "MMM d");
  }
  return `${format(start, "MMM d")} - ${format(end, "MMM d")}`;
};

export const TournamentBlock = ({ tournament }: { tournament: Tournament }) => {
  const finishedMatches = tournament.matches.filter((m) => m.status === "finished");
  const activeMatches = tournament.matches.filter((m) => m.status !== "finished");
  const hasFinished = finishedMatches.length > 0;
  const hasActive = activeMatches.length > 0;

  const [showFinished, setShowFinished] = useState(!hasActive);

  const visibleMatches = showFinished ? tournament.matches : activeMatches;
  const grouped = groupMatchesByDate(visibleMatches);
  const dateKeys = Array.from(grouped.keys());
  const badge = tierBadge[tournament.tier];

  return (
    <div className="rounded-xl border border-gray-800 bg-gray-950/50 overflow-hidden">
      <div className="border-b border-gray-800 px-4 py-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold text-white">{tournament.name}</h3>
          {badge && (
            <span className={`rounded px-1.5 py-0.5 text-xs font-bold ${badge.className}`}>
              {badge.label}
            </span>
          )}
        </div>
        <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
          {tournament.region && <span>{tournament.region}</span>}
          <span>{formatDateRange(tournament.beginAt, tournament.endAt)}</span>
          <span>{tournament.matches.length} matches</span>
        </div>
      </div>

      <div className="p-3 space-y-3">
        {hasFinished && hasActive && (
          <button
            type="button"
            onClick={() => setShowFinished((v) => !v)}
            className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
          >
            {showFinished ? "Hide" : "Show"} {finishedMatches.length} finished match{finishedMatches.length > 1 ? "es" : ""}
          </button>
        )}

        {dateKeys.map((dateKey) => (
          <div key={dateKey}>
            <DateSeparator date={new Date(dateKey)} />
            <div className="space-y-2">
              {grouped.get(dateKey)!.map((match) => (
                <MatchCard key={match.id} match={match} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
