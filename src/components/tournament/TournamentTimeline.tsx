"use client";

import { useEffect, useRef } from "react";
import type { Tournament, Match } from "@/types/match";
import { TournamentBlock } from "./TournamentBlock";

/**
 * Find the best match to scroll to:
 * 1. First live match (running)
 * 2. Closest match in time (past or future)
 */
const findScrollTargetMatch = (tournaments: Tournament[]): string | null => {
  const allMatches = tournaments.flatMap((t) => t.matches);
  const now = Date.now();

  // Priority 1: first live match
  const liveMatch = allMatches.find((m) => m.status === "running");
  if (liveMatch) return liveMatch.id;

  // Priority 2: closest match in time
  let closest: Match | null = null;
  let smallestDiff = Infinity;

  for (const match of allMatches) {
    if (!match.scheduledAt) continue;
    const diff = Math.abs(new Date(match.scheduledAt).getTime() - now);
    if (diff < smallestDiff) {
      smallestDiff = diff;
      closest = match;
    }
  }

  return closest?.id ?? null;
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
    className="w-full py-3 font-mono text-sm font-bold uppercase tracking-wide text-foreground border-2 border-rule bg-newsprint hover:bg-newsprint-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
  >
    {isLoading ? (
      <span className="inline-flex items-center gap-2">
        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-dim border-t-rule" />
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
  tournaments: Tournament[];
  onLoadPrevious?: () => void;
  onLoadNext?: () => void;
  loadingDirection?: "previous" | "next" | null;
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const hasScrolled = useRef(false);

  const scrollMatchId = findScrollTargetMatch(tournaments);

  useEffect(() => {
    if (hasScrolled.current || !scrollRef.current) return;
    scrollRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    hasScrolled.current = true;
  }, []);

  return (
    <div>
      {onLoadPrevious && (
        <div className="px-6 mb-4">
          <LoadButton onClick={onLoadPrevious} isLoading={loadingDirection === "previous"}>
            Load earlier tournaments
          </LoadButton>
        </div>
      )}

      {tournaments.map((tournament) => (
        <TournamentBlock
          key={tournament.id}
          tournament={tournament}
          scrollMatchId={scrollMatchId}
          scrollRef={scrollRef}
        />
      ))}

      {onLoadNext && (
        <div className="px-6 mt-4">
          <LoadButton onClick={onLoadNext} isLoading={loadingDirection === "next"}>
            Load later tournaments
          </LoadButton>
        </div>
      )}
    </div>
  );
};
