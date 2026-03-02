import { isToday, isTomorrow, isYesterday, format } from "date-fns";

const getLabel = (date: Date): string => {
  if (isToday(date)) return "Today";
  if (isTomorrow(date)) return "Tomorrow";
  if (isYesterday(date)) return "Yesterday";
  return format(date, "EEEE, MMMM d");
};

export const DateSeparator = ({ date }: { date: Date }) => (
  <div className="flex items-center gap-3 py-2">
    <span className="text-sm font-semibold text-gray-400">
      {getLabel(date)}
    </span>
    <div className="h-px flex-1 bg-gray-800" />
  </div>
);
