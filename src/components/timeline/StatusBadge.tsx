import type { MatchStatus } from "@/types/match";

const statusStyles: Record<MatchStatus, { label: string; dotColor: string; textColor: string; pulse: boolean }> = {
  running: {
    label: "LIVE",
    dotColor: "bg-red-500",
    textColor: "text-red-400",
    pulse: true,
  },
  not_started: {
    label: "UPCOMING",
    dotColor: "bg-blue-400",
    textColor: "text-gray-500",
    pulse: false,
  },
  finished: {
    label: "FINISHED",
    dotColor: "bg-gray-600",
    textColor: "text-gray-600",
    pulse: false,
  },
};

export const StatusBadge = ({ status }: { status: MatchStatus }) => {
  const { label, dotColor, textColor, pulse } = statusStyles[status];
  return (
    <span className={`flex items-center gap-1.5 text-[10px] font-semibold tracking-wide ${textColor}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${dotColor} ${pulse ? "animate-pulse" : ""}`} />
      {label}
    </span>
  );
};
