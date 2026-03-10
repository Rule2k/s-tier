"use client";

import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from "react";
import type { Match, TournamentView } from "@/types/match";
import { MatchCard } from "@/components/timeline/MatchCard";
import { DateSeparator } from "@/components/timeline/DateSeparator";
import { formatDateRange } from "@/lib/matches/formatDateRange";
import { groupMatchesByDate } from "@/lib/matches/groupByDate";

type TournamentStatus =
  | { type: "finished"; winner: { name: string; logoUrl: string | null } | null }
  | { type: "live"; count: number }
  | { type: "in_progress" }
  | { type: "upcoming" };

const getTournamentStatus = (matches: Match[]): TournamentStatus => {
  const liveMatches = matches.filter((match) => match.status === "running");
  if (liveMatches.length > 0) return { type: "live", count: liveMatches.length };

  const hasFinished = matches.some((match) => match.status === "finished");
  const hasUpcoming = matches.some((match) => match.status === "not_started");

  if (hasFinished && !hasUpcoming) {
    const lastMatch = [...matches]
      .sort((matchA, matchB) => new Date(matchB.scheduledAt).getTime() - new Date(matchA.scheduledAt).getTime())[0];
    const winnerTeam = lastMatch?.teams.find((team) => team.isWinner) ?? null;
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
  tournament: TournamentView;
  scrollTargetDate?: string | null;
  scrollRef?: RefObject<HTMLDivElement | null>;
}) => {
  const contentId = useId();
  const headerRef = useRef<HTMLDivElement>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [headerHeight, setHeaderHeight] = useState(0);
  const headerMatches = tournament.allMatches ?? tournament.matches;
  const status = useMemo(() => getTournamentStatus(headerMatches), [headerMatches]);
  const summary = useMemo(() => {
    const scheduledMatches = headerMatches
      .filter((match) => Boolean(match.scheduledAt))
      .sort(
        (matchA, matchB) => new Date(matchA.scheduledAt).getTime() - new Date(matchB.scheduledAt).getTime(),
      );

    const firstMatch = scheduledMatches[0]?.scheduledAt;
    const lastMatch = scheduledMatches[scheduledMatches.length - 1]?.scheduledAt;

    return {
      matchCount: headerMatches.length,
      dateRange: firstMatch && lastMatch ? formatDateRange(firstMatch, lastMatch) : null,
    };
  }, [headerMatches]);

  const matchesByDate = groupMatchesByDate(tournament.matches);
  const dateKeys = Array.from(matchesByDate.keys());
  const stickyDateTop = `calc(57px + ${headerHeight}px + 8px)`;

  useEffect(() => {
    const element = headerRef.current;
    if (!element) return;

    const updateHeaderHeight = () => {
      setHeaderHeight(Math.ceil(element.getBoundingClientRect().height));
    };

    updateHeaderHeight();

    if (typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver(updateHeaderHeight);
    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  return (
    <div
      data-tournament-block
      className="overflow-clip rounded-2xl border border-white/[0.06] bg-white/[0.03] shadow-lg shadow-black/20"
    >
      <div
        ref={headerRef}
        data-tournament-header
        className="sticky top-[57px] z-10 border-b border-white/[0.06] bg-gray-950/80 backdrop-blur-md"
      >
        <div className="bg-gradient-to-r from-white/[0.06] to-transparent px-5 py-4">
          <div className="flex items-start gap-3">
            {tournament.logoUrl && (
              <img src={tournament.logoUrl} alt="" className="h-8 w-8 shrink-0 rounded object-contain" />
            )}
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-sm font-bold text-white">{tournament.name}</h3>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-gray-400">
                {summary.dateRange && <span>{summary.dateRange}</span>}
                {summary.dateRange && summary.matchCount > 0 && (
                  <span className="h-1 w-1 rounded-full bg-gray-700" />
                )}
                <span>
                  {summary.matchCount} {summary.matchCount > 1 ? "matches" : "match"}
                </span>
                <span
                  data-collapsed-indicator
                  aria-hidden={!isCollapsed}
                  className={`rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.18em] transition-opacity ${
                    isCollapsed
                      ? "border-white/10 bg-white/[0.04] text-gray-300 opacity-100"
                      : "border-transparent bg-transparent text-transparent opacity-0"
                  }`}
                >
                  Closed
                </span>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <div className="text-right">
                {status.type === "live" && (
                  <div>
                    <span className="text-xs font-bold text-red-400">Live</span>
                    <p className="mt-0.5 text-[10px] text-red-400/70">
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
                      <div className="mt-0.5 flex items-center justify-end gap-1.5">
                        {status.winner.logoUrl && (
                          <img src={status.winner.logoUrl} alt="" className="h-4 w-4 rounded object-contain" />
                        )}
                        <span className="text-[11px] text-white">{status.winner.name}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <button
                type="button"
                aria-expanded={!isCollapsed}
                aria-controls={contentId}
                aria-label={isCollapsed ? `Open ${tournament.name}` : `Close ${tournament.name}`}
                onClick={() => setIsCollapsed((collapsed) => !collapsed)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-gray-300 transition-colors hover:border-white/20 hover:bg-white/[0.08] hover:text-white"
              >
                <svg
                  viewBox="0 0 20 20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  className={`h-4 w-4 transition-transform ${isCollapsed ? "" : "rotate-180"}`}
                  aria-hidden="true"
                >
                  <path d="m5 8 5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {!isCollapsed && (
        <div id={contentId} className="p-4">
          <div className="space-y-0">
            {dateKeys.map((dateKey, index) => (
              <div
                key={dateKey}
                ref={dateKey === scrollTargetDate ? scrollRef : undefined}
              >
                <DateSeparator
                  date={new Date(dateKey)}
                  isLast={index === dateKeys.length - 1}
                  sticky
                  stickyTop={stickyDateTop}
                />
                <div className="space-y-2 pb-4 pl-5">
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
      )}
    </div>
  );
};
