import { isToday, isTomorrow, isYesterday, format } from "date-fns";

const getLabel = (date: Date): string => {
  if (isToday(date)) return "Today";
  if (isTomorrow(date)) return "Tomorrow";
  if (isYesterday(date)) return "Yesterday";
  return format(date, "EEE, MMM d");
};

export const DateSeparator = ({
  date,
  isLast = false,
}: {
  date: Date;
  isLast?: boolean;
}) => {
  const today = isToday(date);

  return (
    <div className="flex items-center gap-3 py-2">
      <div className="relative flex flex-col items-center">
        <div
          className={`h-2 w-2 rounded-full ${
            today ? "bg-green-400 shadow-[0_0_6px] shadow-green-400/50" : "bg-gray-600"
          }`}
        />
        {!isLast && (
          <div className="absolute top-2.5 w-px h-[calc(100%+2rem)] bg-gradient-to-b from-gray-700 to-transparent" />
        )}
      </div>
      <span
        className={`text-xs font-semibold ${
          today ? "text-green-400" : "text-gray-500"
        }`}
      >
        {getLabel(date)}
      </span>
    </div>
  );
};
