import type { MatchStatus } from "@/types/match";

const statusConfig: Record<MatchStatus, { label: string; isLive: boolean }> = {
  running: { label: "LIVE", isLive: true },
  not_started: { label: "UPCOMING", isLive: false },
  finished: { label: "FINISHED", isLive: false },
};

export const StatusBadge = ({ status }: { status: MatchStatus }) => {
  const { label, isLive } = statusConfig[status];

  return (
    <span
      className={`inline-flex items-center gap-1 text-[0.55rem] font-bold tracking-[0.12em] uppercase px-1.5 py-0.5 ${
        isLive ? "bg-live text-newsprint" : "bg-rule text-newsprint"
      }`}
    >
      {isLive && (
        <span className="inline-block w-[5px] h-[5px] bg-newsprint rounded-full animate-blink" />
      )}
      {label}
    </span>
  );
};
