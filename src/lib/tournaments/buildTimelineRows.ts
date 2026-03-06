import type { Serie } from "@/types/match";

export interface TimelineRow {
  series: Serie[];
}

export const buildTimelineRows = (series: Serie[]): TimelineRow[] => {
  const rows: TimelineRow[] = [];

  for (const serie of series) {
    const beginAt = new Date(serie.beginAt).getTime();

    // Try to fit into the last row if overlapping
    const lastRow = rows[rows.length - 1];
    if (lastRow) {
      const rowEndAt = Math.max(
        ...lastRow.series.map((s) => new Date(s.endAt).getTime()),
      );
      if (beginAt <= rowEndAt) {
        lastRow.series.push(serie);
        continue;
      }
    }

    rows.push({ series: [serie] });
  }

  return rows;
};
