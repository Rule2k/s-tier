"use client";

import { useState, useMemo, type RefObject } from "react";
import type { Match, Serie } from "@/types/match";
import { MatchCard } from "@/components/timeline/MatchCard";
import { DateSeparator } from "@/components/timeline/DateSeparator";
import { groupMatchesByDate } from "@/lib/matches/groupByDate";
import { formatDateRange } from "@/lib/matches/formatDateRange";

const tierConfig: Record<string, { label: string; accent: string; glow: string }> = {
  s: { label: "S-Tier", accent: "text-yellow-400", glow: "shadow-yellow-500/10" },
  a: { label: "A-Tier", accent: "text-purple-400", glow: "shadow-purple-500/10" },
};

type SerieStatus =
  | { type: "finished"; winner: { name: string; imageUrl: string | null } | null }
  | { type: "live"; count: number }
  | { type: "in_progress" }
  | { type: "upcoming" };

const getSerieStatus = (stages: Serie["stages"]): SerieStatus => {
  const allMatches = stages.flatMap((stage) => stage.matches);
  const liveMatches = allMatches.filter((m) => m.status === "running");
  if (liveMatches.length > 0) return { type: "live", count: liveMatches.length };

  const hasFinished = allMatches.some((m) => m.status === "finished");
  const hasUpcoming = allMatches.some((m) => m.status === "not_started");

  if (hasFinished && !hasUpcoming) {
    const lastMatch = [...allMatches]
      .sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime())[0];
    const winnerTeam = lastMatch?.teams.find((t) => t.isWinner) ?? null;
    const winner = winnerTeam ? { name: winnerTeam.name, imageUrl: winnerTeam.imageUrl } : null;
    return { type: "finished", winner };
  }

  if (hasFinished) return { type: "in_progress" };

  return { type: "upcoming" };
};

const findDefaultStageIndex = (stages: Serie["stages"]): number => {
  const stageWithLiveMatch = stages.findIndex((stage) =>
    stage.matches.some((match) => match.status === "running"),
  );
  if (stageWithLiveMatch !== -1) return stageWithLiveMatch;

  const now = Date.now();
  const stageWithUpcomingMatch = stages.findIndex((stage) =>
    stage.matches.some(
      (match) => match.status === "not_started" && new Date(match.scheduledAt).getTime() > now,
    ),
  );
  if (stageWithUpcomingMatch !== -1) return stageWithUpcomingMatch;

  return stages.length - 1;
};

export const SerieBlock = ({
  serie,
  scrollTargetMatchId,
  scrollRef,
}: {
  serie: Serie;
  scrollTargetMatchId?: string | null;
  scrollRef?: RefObject<HTMLDivElement | null>;
}) => {
  const visibleStages = serie.stages.filter((stage) => stage.matches.length > 0);
  const [activeStage, setActiveStage] = useState(() => findDefaultStageIndex(visibleStages));

  const tierStyle = tierConfig[serie.tier];
  const status = useMemo(() => getSerieStatus(serie.stages), [serie.stages]);
  const currentStage = visibleStages[activeStage] ?? visibleStages[0];
  const matchesForCurrentStage = currentStage?.matches ?? [];

  const matchesByDate = groupMatchesByDate(matchesForCurrentStage);
  const dateKeys = Array.from(matchesByDate.keys());

  return (
    <div data-serie-block className={`rounded-2xl border border-white/[0.06] bg-white/[0.03] overflow-clip shadow-lg ${tierStyle?.glow ?? "shadow-black/20"}`}>
      {/* Sticky glass header + tabs */}
      <div data-serie-header className="sticky top-[57px] z-10 backdrop-blur-md bg-gray-950/80 border-b border-white/[0.06]">
        <div className="px-5 py-4 bg-gradient-to-r from-white/[0.06] to-transparent">
          <div className="flex items-center gap-3">
            {serie.leagueImageUrl && (
              <img src={serie.leagueImageUrl} alt="" className="h-7 w-7 rounded-lg object-contain" />
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white truncate">{serie.name}</h3>
                {tierStyle && (
                  <span className={`text-[10px] font-black tracking-wider ${tierStyle.accent}`}>
                    {tierStyle.label}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-gray-500 mt-0.5">
                {serie.beginAt && serie.endAt && (
                  <span>{formatDateRange(serie.beginAt, serie.endAt)}</span>
                )}
              </div>
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
                      {status.winner.imageUrl && (
                        <img src={status.winner.imageUrl} alt="" className="h-4 w-4 rounded object-contain" />
                      )}
                      <span className="text-[11px] text-white">{status.winner.name}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
        {visibleStages.length && (
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
        <div className="space-y-0">
          {dateKeys.map((dateKey, i) => (
            <div key={dateKey}>
              <DateSeparator date={new Date(dateKey)} isLast={i === dateKeys.length - 1} />
              <div className="space-y-2 pl-5 pb-4">
                {matchesByDate.get(dateKey)!.map((match) => (
                  <div
                    key={match.id}
                    ref={match.id === scrollTargetMatchId ? scrollRef : undefined}
                  >
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
