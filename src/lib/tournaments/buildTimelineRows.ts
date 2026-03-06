import type { Serie } from "@/types/match";

export interface TimelineRow {
  series: Serie[];
}

export const buildTimelineRows = (series: Serie[]): TimelineRow[] => {
  const rows: TimelineRow[] = [];

  for (const serie of series) {
    const serieStartTime = new Date(serie.beginAt).getTime();

    // Try to fit into the last row if overlapping
    const lastRow = rows[rows.length - 1];
    if (lastRow) {
      const latestEndTime = Math.max(
        ...lastRow.series.map((existingSerie) => new Date(existingSerie.endAt).getTime()),
      );
      if (serieStartTime <= latestEndTime) {
        lastRow.series.push(serie);
        continue;
      }
    }

    rows.push({ series: [serie] });
  }

  return rows;
};
