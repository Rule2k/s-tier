import { isToday, isTomorrow, isYesterday, format } from "date-fns";

const getLabel = (date: Date): string => {
  if (isToday(date)) return "Today";
  if (isTomorrow(date)) return "Tomorrow";
  if (isYesterday(date)) return "Yesterday";
  return format(date, "EEEE, MMMM d");
};

export const DateSeparator = ({
  date,
  isLast = false,
  sticky = false,
  stickyTop,
}: {
  date: Date;
  isLast?: boolean;
  sticky?: boolean;
  stickyTop?: string;
}) => {
  const today = isToday(date);

  return (
    <div
      data-date-separator
      className={sticky ? "sticky z-[5] py-2" : "py-2"}
      style={sticky && stickyTop ? { top: stickyTop } : undefined}
    >
      <div
        className={`flex items-center gap-3 rounded-full border px-3 py-2 backdrop-blur-sm ${
          sticky
            ? "border-white/10 bg-gray-950/90 shadow-lg shadow-black/20"
            : "border-transparent bg-transparent px-0 py-0 backdrop-blur-none"
        }`}
      >
        <div className="relative flex flex-col items-center">
          <div
            className={`h-2 w-2 rounded-full ${
              today ? "bg-green-400 shadow-[0_0_6px] shadow-green-400/50" : "bg-gray-600"
            }`}
          />
          {!isLast && (
            <div className="absolute top-2.5 h-[calc(100%+2rem)] w-px bg-gradient-to-b from-gray-700 to-transparent" />
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
    </div>
  );
};
