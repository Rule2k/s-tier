import { getTournamentEndDate } from "./getTournamentEndDate";
import { getTournamentStartDate } from "./getTournamentStartDate";
import type { Tournament } from "@/types/match";

export interface TimelineRow {
  tournaments: Tournament[];
}

export const buildTimelineRows = (tournaments: Tournament[]): TimelineRow[] => {
  const rows: TimelineRow[] = [];

  for (const tournament of tournaments) {
    const startTime = new Date(getTournamentStartDate(tournament)).getTime();

    // Try to fit into the last row if overlapping
    const lastRow = rows[rows.length - 1];
    if (lastRow) {
      const latestEndTime = Math.max(
        ...lastRow.tournaments.map((t) => new Date(getTournamentEndDate(t)).getTime()),
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
