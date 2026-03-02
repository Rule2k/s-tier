import type { Match } from "@/types/match";
import { MatchCard } from "./MatchCard";
import { DateSeparator } from "./DateSeparator";
import { startOfDay } from "date-fns";

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

export const MatchTimeline = ({ matches }: { matches: Match[] }) => {
  const valid = matches.filter((m) => m.scheduledAt);
  const sorted = sortMatches(valid);
  const grouped = groupByDate(sorted);

  return (
    <div className="space-y-4">
      {Array.from(grouped.entries()).map(([dateKey, dateMatches]) => (
        <div key={dateKey}>
          <DateSeparator date={new Date(dateKey)} />
          <div className="space-y-2">
            {dateMatches.map((match) => (
              <MatchCard key={match.id} match={match} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
