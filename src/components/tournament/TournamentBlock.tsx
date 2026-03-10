"use client";

import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from "react";
import { DateSeparator } from "@/components/timeline/DateSeparator";
import { MatchCard } from "@/components/timeline/MatchCard";
import { groupMatchesByDate } from "@/lib/matches/groupByDate";
import { getTournamentStatus, type TournamentStatus } from "@/lib/tournaments/getTournamentStatus";
import { getTournamentSummary } from "@/lib/tournaments/getTournamentSummary";
import type { TournamentView } from "@/types/match";

const TournamentStatusBadge = ({ status }: { status: TournamentStatus }) => {
  if (status.type === "live") {
    return (
      <div className="flex min-h-16 min-w-[6.25rem] flex-col items-center justify-center rounded-full border border-red-400/20 bg-red-500/[0.08] px-3 py-1.5 text-center">
        <span className="text-xs font-bold leading-none text-red-300">Live</span>
        <p className="mt-1 text-[10px] leading-none text-red-200/80">
          {status.count} {status.count > 1 ? "matches" : "match"}
        </p>
      </div>
    );
  }

  if (status.type === "in_progress") {
    return (
      <span className="rounded-full border border-blue-400/15 bg-blue-400/[0.08] px-3 py-1.5 text-xs font-semibold text-blue-200">
        In Progress
      </span>
    );
  }

  if (status.type === "upcoming") {
    return (
      <span className="rounded-full border border-white/8 bg-white/[0.03] px-3 py-1.5 text-xs font-semibold text-gray-400">
        Upcoming
      </span>
    );
  }

  return (
    <div className="rounded-full border border-white/8 bg-white/[0.03] px-3 py-1.5">
      <span className="text-[11px] font-semibold text-gray-400">Finished</span>
      {status.winner && (
        <div className="mt-0.5 flex items-center justify-end gap-1.5">
          {status.winner.logoUrl && (
            <img src={status.winner.logoUrl} alt="" className="h-4 w-4 rounded object-contain" />
          )}
          <span className="text-[11px] font-medium text-white">{status.winner.name}</span>
        </div>
      )}
    </div>
  );
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
  const summary = useMemo(() => getTournamentSummary(headerMatches), [headerMatches]);

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
      className="overflow-clip rounded-[24px] border border-white/[0.07] bg-[linear-gradient(180deg,rgba(9,18,32,0.92),rgba(4,10,20,0.94))] shadow-[0_24px_80px_rgba(0,0,0,0.34)]"
    >
      <div
        ref={headerRef}
        data-tournament-header
        className="sticky top-[57px] z-10 border-b border-white/[0.06] bg-[linear-gradient(90deg,rgba(255,255,255,0.06),rgba(255,255,255,0.01))] backdrop-blur-xl"
      >
        <div className="px-5 py-3.5 sm:px-6">
          <div className="flex items-center gap-3 sm:gap-4">
            {tournament.logoUrl && (
              <img src={tournament.logoUrl} alt="" className="h-9 w-9 shrink-0 rounded-lg object-contain opacity-90" />
            )}

            <div className="min-w-0 flex-1">
              <h3 className="truncate text-base font-semibold tracking-tight text-white sm:text-[1.08rem]">
                {tournament.name}
              </h3>
              <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-gray-400">
                {summary.dateRange && <span>{summary.dateRange}</span>}
                {summary.dateRange && summary.matchCount > 0 && (
                  <span className="h-1 w-1 rounded-full bg-white/12" />
                )}
                <span>
                  {summary.matchCount} {summary.matchCount > 1 ? "matches" : "match"}
                </span>
                <span
                  data-collapsed-indicator
                  aria-hidden={!isCollapsed}
                  className={`rounded-full border px-2 py-0.5 text-[9px] font-medium uppercase tracking-[0.18em] transition-opacity ${
                    isCollapsed
                      ? "border-white/10 bg-white/[0.05] text-gray-200 opacity-100"
                      : "border-transparent bg-transparent text-transparent opacity-0"
                  }`}
                >
                  Closed
                </span>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2 sm:gap-3">
              <div className="text-right">
                <TournamentStatusBadge status={status} />
              </div>
              <button
                type="button"
                aria-expanded={!isCollapsed}
                aria-controls={contentId}
                aria-label={isCollapsed ? `Open ${tournament.name}` : `Close ${tournament.name}`}
                onClick={() => setIsCollapsed((collapsed) => !collapsed)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-black/20 text-gray-300 transition-colors hover:border-white/20 hover:bg-white/[0.08] hover:text-white"
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
