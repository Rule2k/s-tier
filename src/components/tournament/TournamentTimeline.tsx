"use client";

import { useEffect, useRef } from "react";
import type { TournamentView } from "@/types/match";
import { TournamentBlock } from "./TournamentBlock";

const findActiveTournamentId = (tournaments: TournamentView[]): string | null => {
  const now = Date.now();

  // Priority 1: tournament with live matches
  const live = tournaments.find((t) =>
    t.matches.some((m) => m.status === "running"),
  );
  if (live) return live.id;

  // Priority 2: tournament in progress (has finished + upcoming, none running)
  const inProgress = tournaments.find((t) => {
    const hasFinished = t.matches.some((m) => m.status === "finished");
    const hasUpcoming = t.matches.some((m) => m.status === "not_started");
    return hasFinished && hasUpcoming;
  });
  if (inProgress) return inProgress.id;

  // Priority 3: tournament with the closest future match
  let closestId: string | null = null;
  let smallestDiff = Infinity;

  for (const t of tournaments) {
    for (const m of t.matches) {
      if (m.status !== "not_started" || !m.scheduledAt) continue;
      const diff = new Date(m.scheduledAt).getTime() - now;
      if (diff > 0 && diff < smallestDiff) {
        smallestDiff = diff;
        closestId = t.id;
      }
    }
  }

  return closestId;
};

const findClosestDateKey = (tournaments: TournamentView[]): string | null => {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

  let closestDateKey: string | null = null;
  let smallestDiff = Infinity;

  for (const tournament of tournaments) {
    for (const match of tournament.matches) {
      if (!match.scheduledAt) continue;
      const d = new Date(match.scheduledAt);
      const dayKey = new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString();
      const diff = Math.abs(new Date(dayKey).getTime() - todayStart);
      if (diff < smallestDiff) {
        smallestDiff = diff;
        closestDateKey = dayKey;
      }
    }
  }

  return closestDateKey;
};

const LoadButton = ({
  onClick,
  isLoading,
  children,
}: {
  onClick: () => void;
  isLoading: boolean;
  children: React.ReactNode;
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={isLoading}
    className="w-full py-3 text-sm font-medium text-gray-400 hover:text-white border border-white/[0.06] rounded-xl bg-white/[0.03] hover:bg-white/[0.06] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
  >
    {isLoading ? (
      <span className="inline-flex items-center gap-2">
        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-gray-600 border-t-white" />
        Loading…
      </span>
    ) : (
      children
    )}
  </button>
);

export const TournamentTimeline = ({
  tournaments,
  onLoadPrevious,
  onLoadNext,
  loadingDirection,
}: {
  tournaments: TournamentView[];
  onLoadPrevious?: () => void;
  onLoadNext?: () => void;
  loadingDirection?: "previous" | "next" | null;
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const hasScrolled = useRef(false);

  const activeTournamentId = findActiveTournamentId(tournaments);
  const scrollTargetDate = findClosestDateKey(tournaments);

  useEffect(() => {
    if (hasScrolled.current || !scrollRef.current) return;
    const el = scrollRef.current;
    const siteHeader = document.querySelector("header");
    const tournamentHeader = el.closest("[data-tournament-block]")?.querySelector("[data-tournament-header]");
    const siteHeaderHeight = siteHeader?.getBoundingClientRect().height ?? 57;
    const tournamentHeaderHeight = tournamentHeader?.getBoundingClientRect().height ?? 0;
    const offset = siteHeaderHeight + tournamentHeaderHeight + 8;
    const top = el.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top, behavior: "smooth" });
    hasScrolled.current = true;
  }, []);

  return (
    <div className="space-y-5">
      {onLoadPrevious && (
        <LoadButton onClick={onLoadPrevious} isLoading={loadingDirection === "previous"}>
          Load earlier tournaments
        </LoadButton>
      )}

      {tournaments.map((tournament) => (
        <TournamentBlock
          key={tournament.id}
          tournament={tournament}
          scrollTargetDate={scrollTargetDate}
          scrollRef={scrollRef}
          initiallyCollapsed={tournament.id !== activeTournamentId}
        />
      ))}

      {onLoadNext && (
        <LoadButton onClick={onLoadNext} isLoading={loadingDirection === "next"}>
          Load later tournaments
        </LoadButton>
      )}
    </div>
  );
};
