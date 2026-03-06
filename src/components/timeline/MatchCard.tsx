import type { Match } from "@/types/match";
import { StatusBadge } from "./StatusBadge";
import { format } from "date-fns";

const TeamRow = ({
  team,
  isFinished,
}: {
  team: Match["teams"][number];
  isFinished: boolean;
}) => (
  <div
    className={`flex items-center gap-2.5 ${
      isFinished && !team.isWinner ? "opacity-40" : "text-white"
    }`}
  >
    {team.imageUrl ? (
      <img src={team.imageUrl} alt={team.name} className="h-6 w-6" />
    ) : (
      <div className="h-6 w-6 rounded bg-gray-700" />
    )}
    <span className="text-sm font-medium">{team.name}</span>
  </div>
);

const ScoreRow = ({
  team,
  isFinished,
  isLive,
}: {
  team: Match["teams"][number];
  isFinished: boolean;
  isLive: boolean;
}) => (
  <div
    className={`text-center text-base font-bold ${
      isLive
        ? "text-yellow-400"
        : isFinished && !team.isWinner
          ? "opacity-40"
          : "text-white"
    }`}
  >
    {team.score ?? "-"}
  </div>
);

const borderColor: Record<Match["status"], string> = {
  running: "border-l-red-500",
  not_started: "border-l-gray-700",
  finished: "border-l-gray-700",
  canceled: "border-l-gray-700",
  postponed: "border-l-gray-700",
};

export const MatchCard = ({ match }: { match: Match }) => {
  const time = match.scheduledAt
    ? format(new Date(match.scheduledAt), "HH:mm")
    : "--:--";

  return (
    <div
      className={`flex items-center gap-4 rounded-lg border border-gray-800 border-l-2 bg-gray-900/60 px-4 py-3 ${borderColor[match.status]}`}
    >
      <div className="flex w-16 shrink-0 flex-col items-center gap-1">
        <span className="text-xs text-gray-500">{time}</span>
        <StatusBadge status={match.status} />
      </div>
      <div className="flex-1 space-y-1.5">
        {match.teams.map((team) => (
          <TeamRow
            key={team.name}
            team={team}
            isFinished={match.status === "finished"}
          />
        ))}
      </div>
      <div className="shrink-0">
        <span className="text-xs font-medium text-gray-500">
          {match.format}
        </span>
      </div>
      <div className="w-6 shrink-0 space-y-1.5">
        {match.teams.map((team) => (
          <ScoreRow
            key={team.name}
            team={team}
            isFinished={match.status === "finished"}
            isLive={match.status === "running"}
          />
        ))}
      </div>
    </div>
  );
};
