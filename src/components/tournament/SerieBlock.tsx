"use client";

import { useState } from "react";
import type { Serie, Match } from "@/types/match";
import { MatchCard } from "@/components/timeline/MatchCard";
import { DateSeparator } from "@/components/timeline/DateSeparator";
import { startOfDay, format } from "date-fns";

const tierConfig: Record<string, { label: string; badgeClassName: string; headerBg: string; borderColor: string }> = {
  s: { label: "S", badgeClassName: "bg-yellow-500/20 text-yellow-400", headerBg: "bg-yellow-500/10", borderColor: "border-l-yellow-500" },
  a: { label: "A", badgeClassName: "bg-purple-500/20 text-purple-400", headerBg: "bg-purple-500/10", borderColor: "border-l-purple-500" },
};

const groupMatchesByDate = (matches: Match[]) => {
  
  const groups = new Map<string, Match[]>();
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

export const SerieBlock = ({ serie }: { serie: Serie }) => {
  const allMatches = serie.stages.flatMap((s) => s.matches);
  const finishedMatches = allMatches.filter((m) => m.status === "finished");
  const activeMatches = allMatches.filter((m) => m.status !== "finished");
  const hasFinished = finishedMatches.length > 0;
  const hasActive = activeMatches.length > 0;

  const [showFinished, setShowFinished] = useState(!hasActive);

  const showStageHeaders = serie.stages.length > 1;
  const tier = tierConfig[serie.tier];

  return (
    <div className={`rounded-xl border border-gray-800 border-l-4 bg-gray-950/50 overflow-hidden shadow-lg shadow-black/20 ${tier?.borderColor ?? "border-l-gray-700"}`}>
      <div className={`border-b border-gray-800 px-5 py-4 ${tier?.headerBg ?? ""}`}>
        <div className="flex items-center gap-3">
          {serie.leagueImageUrl && (
            <img src={serie.leagueImageUrl} alt="" className="h-6 w-6 object-contain" />
          )}
          <h3 className="text-base font-bold text-white">{serie.name}</h3>
          {tier && (
            <span className={`rounded px-1.5 py-0.5 text-xs font-bold ${tier.badgeClassName}`}>
              {tier.label}
            </span>
          )}
        </div>
        <div className="mt-1.5 flex items-center gap-2 text-xs text-gray-400">
          {serie.region && <span>{serie.region}</span>}
          {serie.beginAt && serie.endAt && (
            <span>{formatDateRange(serie.beginAt, serie.endAt)}</span>
          )}
          <span>{allMatches.length} match{allMatches.length > 1 ? "es" : ""}</span>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {hasFinished && hasActive && (
          <button
            type="button"
            onClick={() => setShowFinished((v) => !v)}
            className="flex items-center gap-1.5 rounded-md border border-gray-700 px-2.5 py-1.5 text-xs text-gray-400 hover:text-gray-200 hover:border-gray-600 transition-colors"
          >
            <span className={`inline-block transition-transform ${showFinished ? "rotate-90" : ""}`}>&#9654;</span>
            {showFinished ? "Hide" : "Show"} {finishedMatches.length} finished match{finishedMatches.length > 1 ? "es" : ""}
          </button>
        )}

        {serie.stages.map((stage) => {
          const stageMatches = showFinished
            ? stage.matches
            : stage.matches.filter((m) => m.status !== "finished");

          if (stageMatches.length === 0) return null;

          const grouped = groupMatchesByDate(stageMatches);
          const dateKeys = Array.from(grouped.keys());

          return (
            <div key={stage.id}>
              {showStageHeaders && (
                <h4 className="mb-3 rounded-md bg-gray-800/50 px-3 py-1.5 text-xs font-semibold text-gray-300 uppercase tracking-wide">
                  {stage.name || "Main Stage"}
                </h4>
              )}
              {dateKeys.map((dateKey) => (
                <div key={dateKey}>
                  <DateSeparator date={new Date(dateKey)} />
                  <div className="space-y-2.5">
                    {grouped.get(dateKey)!.map((match) => (
                      <MatchCard key={match.id} match={match} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
};
