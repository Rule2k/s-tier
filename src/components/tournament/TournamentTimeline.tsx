"use client";

import { useEffect, useRef } from "react";
import type { Serie } from "@/types/match";
import { buildTimelineRows } from "@/lib/tournaments/buildTimelineRows";
import { SerieBlock } from "./SerieBlock";

const findClosestDateKey = (allSeries: Serie[]): string | null => {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

  let closestDateKey: string | null = null;
  let smallestDiff = Infinity;

  for (const serie of allSeries) {
    for (const stage of serie.stages) {
      for (const match of stage.matches) {
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
  series,
  onLoadPrevious,
  onLoadNext,
  loadingDirection,
}: {
  series: Serie[];
  onLoadPrevious?: () => void;
  onLoadNext?: () => void;
  loadingDirection?: "previous" | "next" | null;
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const hasScrolled = useRef(false);

  const rows = buildTimelineRows(series);
  const allSeries = rows.flatMap((row) => row.series);
  const scrollTargetDate = findClosestDateKey(allSeries);

  useEffect(() => {
    if (hasScrolled.current || !scrollRef.current) return;
    const el = scrollRef.current;
    const siteHeader = document.querySelector("header");
    const serieHeader = el.closest("[data-serie-block]")?.querySelector("[data-serie-header]");
    const siteHeaderHeight = siteHeader?.getBoundingClientRect().height ?? 57;
    const serieHeaderHeight = serieHeader?.getBoundingClientRect().height ?? 0;
    const offset = siteHeaderHeight + serieHeaderHeight + 8;
    const top = el.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top, behavior: "smooth" });
    hasScrolled.current = true;
  }, []);

  return (
    <div className="space-y-5">
      {onLoadPrevious && (
        <LoadButton onClick={onLoadPrevious} isLoading={loadingDirection === "previous"}>
          Load earlier series
        </LoadButton>
      )}

      {allSeries.map((serie) => (
        <SerieBlock
          key={serie.id}
          serie={serie}
          scrollTargetDate={scrollTargetDate}
          scrollRef={scrollRef}
        />
      ))}

      {onLoadNext && (
        <LoadButton onClick={onLoadNext} isLoading={loadingDirection === "next"}>
          Load later series
        </LoadButton>
      )}
    </div>
  );
};
