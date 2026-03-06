"use client";

import { useEffect, useRef } from "react";
import type { Match, Serie } from "@/types/match";
import { buildTimelineRows } from "@/lib/tournaments/buildTimelineRows";
import { SerieBlock } from "./SerieBlock";

const findMatchToScrollTo = (allSeries: Serie[]): string | null => {
  const allMatches = allSeries.flatMap((serie) =>
    serie.stages.flatMap((stage) => stage.matches),
  );

  const liveMatch = allMatches.find((match) => match.status === "running");
  if (liveMatch) return liveMatch.id;

  const now = Date.now();
  let closestUpcoming: Match | null = null;
  let smallestTimeUntilStart = Infinity;

  for (const match of allMatches) {
    if (match.status !== "not_started" || !match.scheduledAt) continue;
    const timeUntilStart = new Date(match.scheduledAt).getTime() - now;
    if (timeUntilStart > 0 && timeUntilStart < smallestTimeUntilStart) {
      smallestTimeUntilStart = timeUntilStart;
      closestUpcoming = match;
    }
  }

  return closestUpcoming?.id ?? null;
};

export const TournamentTimeline = ({ series }: { series: Serie[] }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const hasScrolled = useRef(false);

  const rows = buildTimelineRows(series);
  const allSeries = rows.flatMap((row) => row.series);
  const scrollTargetMatchId = findMatchToScrollTo(allSeries);

  useEffect(() => {
    if (hasScrolled.current || !scrollRef.current) return;
    scrollRef.current.scrollIntoView?.({ block: "center" });
    hasScrolled.current = true;
  }, []);

  return (
    <div className="space-y-5">
      {allSeries.map((serie) => (
        <SerieBlock
          key={serie.id}
          serie={serie}
          scrollTargetMatchId={scrollTargetMatchId}
          scrollRef={scrollRef}
        />
      ))}
    </div>
  );
};
