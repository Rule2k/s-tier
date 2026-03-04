import type { MatchStatus } from "@/types/match";

const config: Record<MatchStatus, { label: string; className: string }> = {
  running: {
    label: "LIVE",
    className: "bg-red-500/20 text-red-400 animate-pulse",
  },
  not_started: {
    label: "UPCOMING",
    className: "bg-blue-500/20 text-blue-400",
  },
  finished: {
    label: "FINISHED",
    className: "bg-gray-500/10 text-gray-500",
  },
  canceled: {
    label: "CANCELED",
    className: "bg-gray-500/20 text-gray-400",
  },
  postponed: {
    label: "POSTPONED",
    className: "bg-yellow-500/20 text-yellow-400",
  },
};

export const StatusBadge = ({ status }: { status: MatchStatus }) => {
  const { label, className } = config[status];
  return (
    <span className={`rounded px-2 py-1 text-xs font-semibold ${className}`}>
      {label}
    </span>
  );
};
