import { startOfDay, format } from "date-fns";

export const formatDateRange = (beginAt: string, endAt: string): string => {
  const start = new Date(beginAt);
  const end = new Date(endAt);
  if (startOfDay(start).getTime() === startOfDay(end).getTime()) {
    return format(start, "MMM d");
  }
  return `${format(start, "MMM d")} - ${format(end, "MMM d")}`;
};
