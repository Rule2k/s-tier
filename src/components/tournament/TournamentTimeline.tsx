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

  const allSeries = rows.flatMap((row) => row.series);

  return (
    <div className="space-y-5">
      {allSeries.map((serie, i) => (
        <div
          key={serie.id}
          ref={scrollTarget?.serieId === serie.id ? scrollRef : undefined}
          className=""
        >
          <SerieBlock serie={serie} />
        </div>
      ))}
    </div>
  );
};
