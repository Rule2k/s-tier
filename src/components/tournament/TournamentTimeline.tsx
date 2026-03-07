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

export const TournamentTimeline = ({ series }: { series: Serie[] }) => {
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
      {allSeries.map((serie) => (
        <SerieBlock
          key={serie.id}
          serie={serie}
          scrollTargetDate={scrollTargetDate}
          scrollRef={scrollRef}
        />
      ))}
    </div>
  );
};
