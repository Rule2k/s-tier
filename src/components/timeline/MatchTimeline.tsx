"use client";

import { useEffect, useRef } from "react";
import type { Match } from "@/types/match";
import { MatchCard } from "./MatchCard";
import { DateSeparator } from "./DateSeparator";
import { isToday, startOfDay } from "date-fns";

const statusOrder: Record<Match["status"], number> = {
  finished: 0,
  running: 1,
  not_started: 2,
  postponed: 3,
  canceled: 4,
};

const sortMatches = (matches: Match[]): Match[] =>
  [...matches].sort((a, b) => {
    const statusDiff = statusOrder[a.status] - statusOrder[b.status];
    if (statusDiff !== 0) return statusDiff;
    return new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime();
  });

const groupByDate = (matches: Match[]): Map<string, Match[]> => {
  const groups = new Map<string, Match[]>();
  for (const match of matches) {
    const key = startOfDay(new Date(match.scheduledAt)).toISOString();
    const group = groups.get(key) ?? [];
    group.push(match);
    groups.set(key, group);
  }
  return groups;
};

const findClosestDateKey = (dateKeys: string[]): string | null => {
  const today = dateKeys.find((key) => isToday(new Date(key)));
  if (today) return today;

  // Find the closest future date
  const now = new Date();
  const future = dateKeys.find((key) => new Date(key) >= startOfDay(now));
  if (future) return future;

  // Fallback to last date (most recent past)
  return dateKeys[dateKeys.length - 1] ?? null;
};

export const MatchTimeline = ({ matches }: { matches: Match[] }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const hasScrolled = useRef(false);

  const valid = matches.filter((m) => m.scheduledAt);
  const sorted = sortMatches(valid);
  const grouped = groupByDate(sorted);
  const dateKeys = Array.from(grouped.keys());
  const scrollToKey = findClosestDateKey(dateKeys);

  useEffect(() => {
    if (hasScrolled.current || !scrollRef.current) return;
    scrollRef.current.scrollIntoView({ block: "start" });
    hasScrolled.current = true;
  }, [scrollToKey]);

  return (
    <div className="space-y-4">
      {dateKeys.map((dateKey) => (
        <div
          key={dateKey}
          ref={dateKey === scrollToKey ? scrollRef : undefined}
        >
          <DateSeparator date={new Date(dateKey)} />
          <div className="space-y-2">
            {grouped.get(dateKey)!.map((match) => (
              <MatchCard key={match.id} match={match} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
