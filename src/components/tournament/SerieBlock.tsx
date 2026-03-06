"use client";

import { useState } from "react";
import type { Serie } from "@/types/match";
import { MatchCard } from "@/components/timeline/MatchCard";
import { DateSeparator } from "@/components/timeline/DateSeparator";
import { groupMatchesByDate } from "@/lib/matches/groupByDate";
import { formatDateRange } from "@/lib/matches/formatDateRange";

const tierConfig: Record<string, { label: string; accent: string; glow: string }> = {
  s: { label: "S", accent: "text-yellow-400", glow: "shadow-yellow-500/10" },
  a: { label: "A", accent: "text-purple-400", glow: "shadow-purple-500/10" },
};

export const SerieBlock = ({ serie }: { serie: Serie }) => {
  const allMatches = serie.stages.flatMap((s) => s.matches);
  const finishedMatches = allMatches.filter((m) => m.status === "finished");
  const activeMatches = allMatches.filter((m) => m.status !== "finished");
  const hasFinished = finishedMatches.length > 0;
  const hasActive = activeMatches.length > 0;

  const [showFinished, setShowFinished] = useState(!hasActive);
  const [activeStage, setActiveStage] = useState(0);

  const tier = tierConfig[serie.tier];
  const hasMultipleStages = serie.stages.length > 1;

  const visibleStages = serie.stages.filter((stage) => {
    const stageMatches = showFinished
      ? stage.matches
      : stage.matches.filter((m) => m.status !== "finished");
    return stageMatches.length > 0;
  });

  const currentStage = visibleStages[activeStage] ?? visibleStages[0];

  const currentMatches = currentStage
    ? showFinished
      ? currentStage.matches
      : currentStage.matches.filter((m) => m.status !== "finished")
    : [];

  const grouped = groupMatchesByDate(currentMatches);
  const dateKeys = Array.from(grouped.keys());

  return (
    <div className={`rounded-2xl border border-white/[0.06] bg-white/[0.03] overflow-clip shadow-lg ${tier?.glow ?? "shadow-black/20"}`}>
      {/* Sticky glass header + tabs */}
      <div className="sticky top-[57px] z-10 backdrop-blur-md bg-gray-950/80 border-b border-white/[0.06]">
        <div className="px-5 py-4 bg-gradient-to-r from-white/[0.06] to-transparent">
          <div className="flex items-center gap-3">
            {serie.leagueImageUrl && (
              <img src={serie.leagueImageUrl} alt="" className="h-7 w-7 rounded-lg object-contain" />
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white truncate">{serie.name}</h3>
                {tier && (
                  <span className={`text-[10px] font-black tracking-wider ${tier.accent}`}>
                    {tier.label}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-gray-500 mt-0.5">
                {serie.region && <span>{serie.region}</span>}
                {serie.region && serie.beginAt && <span>·</span>}
                {serie.beginAt && serie.endAt && (
                  <span>{formatDateRange(serie.beginAt, serie.endAt)}</span>
                )}
                <span>·</span>
                <span>{allMatches.length} match{allMatches.length > 1 ? "es" : ""}</span>
              </div>
            </div>
          </div>
        </div>

        {hasMultipleStages && visibleStages.length > 1 && (
          <div className="flex gap-1 px-4 border-t border-white/[0.04]">
            {visibleStages.map((stage, i) => (
              <button
                key={stage.id}
                type="button"
                onClick={() => setActiveStage(i)}
                className={`px-3 py-2 text-xs font-medium transition-colors relative ${
                  i === activeStage
                    ? "text-white"
                    : "text-gray-500 hover:text-gray-300"
                }`}
              >
                {stage.name || "Main Stage"}
                {i === activeStage && (
                  <span className="absolute bottom-0 left-1 right-1 h-0.5 rounded-full bg-white/60" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {hasFinished && hasActive && (
          <button
            type="button"
            onClick={() => setShowFinished((v) => !v)}
            className="mb-3 flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1 text-[11px] text-gray-400 hover:text-gray-200 hover:border-white/[0.15] transition-colors"
          >
            <span className={`inline-block text-[8px] transition-transform ${showFinished ? "rotate-90" : ""}`}>&#9654;</span>
            {showFinished ? "Hide" : "Show"} {finishedMatches.length} finished match{finishedMatches.length > 1 ? "es" : ""}
          </button>
        )}

        {/* Day timeline */}
        <div className="space-y-0">
          {dateKeys.map((dateKey, i) => (
            <div key={dateKey}>
              <DateSeparator date={new Date(dateKey)} isLast={i === dateKeys.length - 1} />
              <div className="space-y-2 pl-5 pb-4">
                {grouped.get(dateKey)!.map((match) => (
                  <MatchCard key={match.id} match={match} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
