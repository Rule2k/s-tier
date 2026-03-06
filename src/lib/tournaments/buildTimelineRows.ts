import type { Tournament } from "./groupByTournament";

export interface TimelineRow {
  tournaments: Tournament[];
}

export const buildTimelineRows = (tournaments: Tournament[]): TimelineRow[] => {
  const rows: TimelineRow[] = [];

  for (const tournament of tournaments) {
    const beginAt = new Date(tournament.beginAt).getTime();

    // Try to fit into the last row if overlapping
    const lastRow = rows[rows.length - 1];
    if (lastRow) {
      const rowEndAt = Math.max(
        ...lastRow.tournaments.map((t) => new Date(t.endAt).getTime()),
      );
      if (beginAt <= rowEndAt) {
        lastRow.tournaments.push(tournament);
        continue;
      }
    }

    rows.push({ tournaments: [tournament] });
  }

  return rows;
};
