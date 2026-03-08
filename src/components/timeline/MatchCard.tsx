import type { Match, MapScore } from "@/types/match";
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
    {team.logoUrl ? (
      <img src={team.logoUrl} alt={team.name} className="h-6 w-6" />
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

const MapScoreLine = ({ maps }: { maps: MapScore[] }) => (
  <div className="flex items-center gap-2.5 text-[11px] text-gray-500">
    {maps.map((map, i) => (
      <span key={map.mapNumber} className="flex items-center gap-1">
        {i > 0 && <span className="text-white/[0.06]">·</span>}
        <span>{map.mapName}</span>
        <span
          className={
            map.status === "running"
              ? "text-yellow-400 font-semibold"
              : "text-gray-400"
          }
        >
          {map.scores[0]}–{map.scores[1]}
        </span>
      </span>
    ))}
  </div>
);

const cardStyleByStatus: Record<Match["status"], string> = {
  running:
    "border-red-500/40 bg-red-500/[0.04] shadow-[0_0_15px_-3px] shadow-red-500/10",
  not_started: "border-white/[0.06] bg-white/[0.02]",
  finished: "border-white/[0.04] bg-white/[0.01]",
};

const STARTING_SOON_STYLE =
  "border-blue-400/40 bg-blue-400/[0.04] shadow-[0_0_15px_-3px] shadow-blue-400/10";
const ONE_HOUR_MS = 60 * 60 * 1000;

const isStartingSoon = (match: Match): boolean => {
  if (match.status !== "not_started" || !match.scheduledAt) return false;
  const timeUntilStart = new Date(match.scheduledAt).getTime() - Date.now();
  return timeUntilStart <= ONE_HOUR_MS;
};

export const MatchCard = ({ match }: { match: Match }) => {
  const formattedTime = match.scheduledAt
    ? format(new Date(match.scheduledAt), "HH:mm")
    : "--:--";

  const startingSoon = isStartingSoon(match);
  const cardStyle = startingSoon
    ? STARTING_SOON_STYLE
    : cardStyleByStatus[match.status];

  const playedMaps = match.maps.filter(
    (m) => m.status === "running" || m.status === "finished",
  );

  return (
    <div
      className={`rounded-lg border px-4 py-3 transition-colors ${cardStyle}`}
    >
      <div className="flex items-center gap-4">
        <div className="flex w-16 shrink-0 flex-col items-center gap-1">
          <span className="text-xs text-gray-500">{formattedTime}</span>
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
      {playedMaps.length > 0 && (
        <div className="mt-2 flex justify-end border-t border-white/[0.04] pt-2">
          <MapScoreLine maps={playedMaps} />
        </div>
      )}
    </div>
  );
};
