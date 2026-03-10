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
        className={`inline-flex items-center gap-2.5 rounded-full px-3 py-1.5 backdrop-blur-md ${
          sticky
            ? "border border-white/10 bg-[rgba(5,10,20,0.78)] shadow-[0_12px_30px_rgba(0,0,0,0.28)]"
            : "border border-transparent bg-transparent px-0 py-0 backdrop-blur-none"
        }`}
      >
        <div className="relative flex flex-col items-center">
          <div
            className={`h-2 w-2 rounded-full ${
              today ? "bg-green-400 shadow-[0_0_8px] shadow-green-400/50" : "bg-gray-500"
            }`}
          />
          {!isLast && (
            <div className="absolute top-2.5 h-[calc(100%+2rem)] w-px bg-gradient-to-b from-white/18 to-transparent" />
          )}
        </div>
        <span
          className={`text-xs font-semibold tracking-[0.01em] ${
            today ? "text-green-300" : "text-gray-400"
          }`}
        >
          {getLabel(date)}
        </span>
      </div>
    </div>
  );
};
