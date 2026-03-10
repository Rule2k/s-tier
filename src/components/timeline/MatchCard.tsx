import { format } from "date-fns";
import { getMapWinnerIndex } from "@/lib/matches/getMapWinnerIndex";
import { getPlayedMaps } from "@/lib/matches/getPlayedMaps";
import { isStartingSoon } from "@/lib/matches/isStartingSoon";
import type { Match, MapScore } from "@/types/match";
import { StatusBadge } from "./StatusBadge";
const cardStyleByStatus: Record<Match["status"], string> = {
  running:
    "border-red-500/40 bg-[linear-gradient(180deg,rgba(72,8,12,0.32),rgba(20,8,12,0.22))] shadow-[0_0_18px_-4px] shadow-red-500/15",
  not_started:
    "border-blue-400/28 bg-[linear-gradient(180deg,rgba(10,18,34,0.78),rgba(6,12,24,0.68))]",
  finished:
    "border-white/[0.05] bg-[linear-gradient(180deg,rgba(12,20,32,0.74),rgba(7,13,24,0.6))]",
};
const STARTING_SOON_STYLE =
  "border-blue-400/40 bg-blue-400/[0.04] shadow-[0_0_15px_-3px] shadow-blue-400/10";

const TeamRow = ({
  team,
  isMuted,
}: {
  team: Match["teams"][number];
  isMuted: boolean;
}) => (
  <div className={`flex items-center gap-2 sm:gap-3 ${isMuted ? "opacity-40" : "text-white"}`}>
    {team.logoUrl ? (
      <img src={team.logoUrl} alt={team.name} className="h-6 w-6 sm:h-7 sm:w-7" />
    ) : (
      <div className="h-6 w-6 rounded-md bg-gray-700 sm:h-7 sm:w-7" />
    )}
    <span className="truncate text-[15px] font-medium tracking-[-0.01em] sm:text-base">
      <span className="sm:hidden">{team.shortName}</span>
      <span className="hidden sm:inline">{team.name}</span>
    </span>
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
}) => {
  const scoreTone = isLive
    ? "text-yellow-400"
    : isFinished && !team.isWinner
      ? "opacity-40"
      : "text-white";

  return (
    <div className={`text-center text-lg font-bold tabular-nums sm:text-[1.45rem] ${scoreTone}`}>
      {team.score ?? "-"}
    </div>
  );
};

const MapScoreLine = ({
  maps,
  teams,
}: {
  maps: MapScore[];
  teams: Match["teams"];
}) => (
  <div className="flex flex-wrap items-center justify-end gap-x-3 gap-y-1 text-[10px] text-gray-500 sm:text-[11px]">
    {maps.map((map, index) => {
      const winnerIndex = getMapWinnerIndex(map);
      const winnerLogo = winnerIndex !== null ? teams[winnerIndex]?.logoUrl : null;

      return (
        <span key={map.mapNumber} className="flex items-center gap-1.5">
          {index > 0 && <span className="text-white/[0.08]">·</span>}
          {winnerLogo && (
            <img src={winnerLogo} alt="" className="hidden h-3.5 w-3.5 opacity-80 sm:block" />
          )}
          <span className="lowercase">{map.mapName}</span>
          <span className={map.status === "running" ? "font-semibold text-yellow-300" : "text-gray-400"}>
            {map.scores[0]}–{map.scores[1]}
          </span>
        </span>
      );
    })}
  </div>
);

export const MatchCard = ({ match }: { match: Match }) => {
  const isFinished = match.status === "finished";
  const isLive = match.status === "running";
  const formattedTime = match.scheduledAt ? format(new Date(match.scheduledAt), "HH:mm") : "--:--";
  const cardStyle = isStartingSoon(match) ? STARTING_SOON_STYLE : cardStyleByStatus[match.status];
  const playedMaps = getPlayedMaps(match.maps);

  return (
    <div
      data-match-card
      className={`rounded-[18px] border px-3 py-3 transition-colors sm:px-4 sm:py-3.5 ${cardStyle}`}
    >
      <div className="flex items-stretch gap-3 sm:gap-4">
        <div className="flex w-14 shrink-0 flex-col items-center justify-center gap-1.5 border-r border-white/[0.05] pr-3 sm:w-[4.5rem] sm:pr-4">
          <span className="text-xs font-medium tabular-nums text-gray-400 sm:text-[13px]">
            {formattedTime}
          </span>
          <StatusBadge status={match.status} />
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          {match.teams.map((team) => (
            <TeamRow
              key={team.name}
              team={team}
              isMuted={isFinished && !team.isWinner}
            />
          ))}
        </div>

        <div className="flex shrink-0 items-center gap-3 sm:gap-4">
          <div className="hidden min-[420px]:flex min-w-[3rem] items-center justify-center rounded-full border border-white/[0.06] bg-black/10 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-500">
            {match.format}
          </div>
          <div className="min-w-[2rem] space-y-1">
            {match.teams.map((team) => (
              <ScoreRow
                key={team.name}
                team={team}
                isFinished={isFinished}
                isLive={isLive}
              />
            ))}
          </div>
        </div>
      </div>

      {playedMaps.length > 0 && (
        <div className="mt-3 flex justify-end border-t border-white/[0.04] pt-2.5">
          <MapScoreLine maps={playedMaps} teams={match.teams} />
        </div>
      )}
    </div>
  );
};
