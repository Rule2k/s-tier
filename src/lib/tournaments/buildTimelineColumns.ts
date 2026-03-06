import type { Serie } from "@/types/match";

export interface TimelineColumn {
  series: Serie[];
}

export const buildTimelineColumns = (series: Serie[]): TimelineColumn[] => {
  const columns: TimelineColumn[] = [];

  for (const serie of series) {
    const beginAt = new Date(serie.beginAt).getTime();

    // Try to fit into the last column if overlapping
    const lastColumn = columns[columns.length - 1];
    if (lastColumn) {
      const columnEndAt = Math.max(
        ...lastColumn.series.map((s) => new Date(s.endAt).getTime()),
      );
      if (beginAt <= columnEndAt) {
        lastColumn.series.push(serie);
        continue;
      }
    }

    columns.push({ series: [serie] });
  }

  return columns;
};
