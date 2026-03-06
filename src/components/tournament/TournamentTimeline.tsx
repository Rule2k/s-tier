"use client";

import { useEffect, useRef } from "react";
import type { Serie } from "@/types/match";
import { buildTimelineRows } from "@/lib/tournaments/buildTimelineRows";
import { SerieBlock } from "./SerieBlock";

const findScrollTarget = (
  rows: ReturnType<typeof buildTimelineRows>,
): { rowIndex: number; serieId: string } | null => {
  // Find first serie with a live match
  for (let r = 0; r < rows.length; r++) {
    for (const serie of rows[r].series) {
      if (serie.stages.some((st) => st.matches.some((m) => m.status === "running"))) {
        return { rowIndex: r, serieId: serie.id };
      }
    }
  }

  // Otherwise, find serie closest to now
  const now = Date.now();
  let closest: { rowIndex: number; serieId: string; diff: number } | null = null;

  for (let r = 0; r < rows.length; r++) {
    for (const serie of rows[r].series) {
      const begin = new Date(serie.beginAt).getTime();
      const end = new Date(serie.endAt).getTime();
      const diff = now >= begin && now <= end ? 0 : Math.min(Math.abs(now - begin), Math.abs(now - end));
      if (!closest || diff < closest.diff) {
        closest = { rowIndex: r, serieId: serie.id, diff };
      }
    }
  }

  return closest;
};

export const TournamentTimeline = ({ series }: { series: Serie[] }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const hasScrolled = useRef(false);

  const rows = buildTimelineRows(series);
  const scrollTarget = findScrollTarget(rows);

  useEffect(() => {
    if (hasScrolled.current || !scrollRef.current) return;
    scrollRef.current.scrollIntoView?.({ block: "start" });
    hasScrolled.current = true;
  }, []);

  return (
    <div className="space-y-6">
      {rows.map((row, rowIndex) => {
        const isMulti = row.series.length > 1;

        return (
          <div
            key={row.series.map((s) => s.id).join("-")}
            ref={scrollTarget?.rowIndex === rowIndex ? scrollRef : undefined}
            className={
              isMulti
                ? "flex gap-4 overflow-x-auto pb-2 max-md:flex-col max-md:overflow-x-visible"
                : undefined
            }
          >
            {row.series.map((serie) => (
              <div
                key={serie.id}
                className={isMulti ? "min-w-[350px] flex-shrink-0 max-md:min-w-0 max-md:w-full" : undefined}
              >
                <SerieBlock serie={serie} />
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
};
