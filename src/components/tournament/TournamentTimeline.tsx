"use client";

import { useEffect, useRef } from "react";
import type { Serie } from "@/types/match";
import { buildTimelineColumns } from "@/lib/tournaments/buildTimelineColumns";
import { SerieBlock } from "./SerieBlock";

const findScrollTarget = (
  columns: ReturnType<typeof buildTimelineColumns>,
): { columnIndex: number; serieId: string } | null => {
  // Find first serie with a live match
  for (let c = 0; c < columns.length; c++) {
    for (const serie of columns[c].series) {
      if (serie.stages.some((st) => st.matches.some((m) => m.status === "running"))) {
        return { columnIndex: c, serieId: serie.id };
      }
    }
  }

  // Otherwise, find serie closest to now
  const now = Date.now();
  let closest: { columnIndex: number; serieId: string; diff: number } | null = null;

  for (let c = 0; c < columns.length; c++) {
    for (const serie of columns[c].series) {
      const begin = new Date(serie.beginAt).getTime();
      const end = new Date(serie.endAt).getTime();
      const diff = now >= begin && now <= end ? 0 : Math.min(Math.abs(now - begin), Math.abs(now - end));
      if (!closest || diff < closest.diff) {
        closest = { columnIndex: c, serieId: serie.id, diff };
      }
    }
  }

  return closest;
};

export const TournamentTimeline = ({ series }: { series: Serie[] }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const hasScrolled = useRef(false);

  const columns = buildTimelineColumns(series);
  const scrollTarget = findScrollTarget(columns);

  useEffect(() => {
    if (hasScrolled.current || !scrollRef.current) return;
    scrollRef.current.scrollIntoView?.({ inline: "start", block: "nearest" });
    hasScrolled.current = true;
  }, []);

  return (
    <div className="flex gap-6 overflow-x-auto snap-x snap-mandatory pb-4">
      {columns.map((column, columnIndex) => (
        <div
          key={column.series.map((s) => s.id).join("-")}
          ref={scrollTarget?.columnIndex === columnIndex ? scrollRef : undefined}
          className="min-w-[380px] flex-shrink-0 snap-start flex flex-col gap-4"
        >
          {column.series.map((serie) => (
            <SerieBlock key={serie.id} serie={serie} />
          ))}
        </div>
      ))}
    </div>
  );
};
