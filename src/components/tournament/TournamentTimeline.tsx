"use client";

import { useEffect, useRef } from "react";
import type { Serie } from "@/types/match";
import { buildTimelineRows } from "@/lib/tournaments/buildTimelineRows";
import { SerieBlock } from "./SerieBlock";

const hasLiveMatch = (serie: Serie): boolean =>
  serie.stages.some((stage) =>
    stage.matches.some((match) => match.status === "running"),
  );

const distanceToNow = (serie: Serie): number => {
  const now = Date.now();
  const beginTime = new Date(serie.beginAt).getTime();
  const endTime = new Date(serie.endAt).getTime();
  if (now >= beginTime && now <= endTime) return 0;
  return Math.min(Math.abs(now - beginTime), Math.abs(now - endTime));
};

const findSerieToScrollTo = (allSeries: Serie[]): string | null => {
  const liveSerie = allSeries.find(hasLiveMatch);
  if (liveSerie) return liveSerie.id;

  let closestSerie: Serie | null = null;
  let smallestDistance = Infinity;

  for (const serie of allSeries) {
    const distance = distanceToNow(serie);
    if (distance < smallestDistance) {
      smallestDistance = distance;
      closestSerie = serie;
    }
  }

  return closestSerie?.id ?? null;
};

export const TournamentTimeline = ({ series }: { series: Serie[] }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const hasScrolled = useRef(false);

  const rows = buildTimelineRows(series);
  const allSeries = rows.flatMap((row) => row.series);
  const scrollTargetId = findSerieToScrollTo(allSeries);

  useEffect(() => {
    if (hasScrolled.current || !scrollRef.current) return;
    scrollRef.current.scrollIntoView?.({ block: "start" });
    hasScrolled.current = true;
  }, []);

  return (
    <div className="space-y-5">
      {allSeries.map((serie) => (
        <div
          key={serie.id}
          ref={scrollTargetId === serie.id ? scrollRef : undefined}
        >
          <SerieBlock serie={serie} />
        </div>
      ))}
    </div>
  );
};
