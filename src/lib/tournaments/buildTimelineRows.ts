import type { Tournament } from "@/types/match";

export interface TimelineRow {
  tournaments: Tournament[];
}

const getStartDate = (t: Tournament): string =>
  t.matches[0]?.scheduledAt ?? "";

const getEndDate = (t: Tournament): string =>
  t.matches[t.matches.length - 1]?.scheduledAt ?? "";

export const buildTimelineRows = (tournaments: Tournament[]): TimelineRow[] => {
  const rows: TimelineRow[] = [];

  for (const tournament of tournaments) {
    const startTime = new Date(getStartDate(tournament)).getTime();

    // Try to fit into the last row if overlapping
    const lastRow = rows[rows.length - 1];
    if (lastRow) {
      const latestEndTime = Math.max(
        ...lastRow.tournaments.map((t) => new Date(getEndDate(t)).getTime()),
      );
      if (startTime <= latestEndTime) {
        lastRow.tournaments.push(tournament);
        continue;
      }
    }

    rows.push({ tournaments: [tournament] });
  }

  return rows;
};
