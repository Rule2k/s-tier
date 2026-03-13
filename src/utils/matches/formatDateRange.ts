import { startOfDay, format } from "date-fns";

export const formatDateRange = (beginAt: string, endAt: string): string => {
  const start = new Date(beginAt);
  const end = new Date(endAt);
  if (startOfDay(start).getTime() === startOfDay(end).getTime()) {
    return format(start, "MMMM d");
  }
  return `${format(start, "MMMM d")} - ${format(end, "MMMM d")}`;
};
