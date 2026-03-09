import type { Match, MapScore } from "@/types/match";
import { StatusBadge } from "./StatusBadge";
import { format } from "date-fns";

const TeamName = ({
  team,
  isFinished,
  side,
}: {
  team: Match["teams"][number];
  isFinished: boolean;
  side: "left" | "right";
}) => {
  const alignClass = side === "left" ? "justify-end" : "justify-start";
  const winnerClass = isFinished && team.isWinner ? "underline decoration-2 underline-offset-2" : "";
  const loserClass = isFinished && !team.isWinner ? "text-dim font-normal" : "";

  return (
    <div className={`flex items-center gap-1.5 ${alignClass}`}>
      {side === "right" && team.logoUrl && (
        <img src={team.logoUrl} alt={team.name} className="h-4 w-4" />
      )}
      <span className={`font-serif text-base font-bold leading-tight ${winnerClass} ${loserClass}`}>
        {team.name}
      </span>
      {side === "left" && team.logoUrl && (
        <img src={team.logoUrl} alt={team.name} className="h-4 w-4" />
      )}
    </div>
  );
};

const MapScoreLine = ({ maps }: { maps: MapScore[] }) => (
  <div className="font-mono text-[0.6rem] italic text-muted mt-0.5 leading-relaxed">
    {maps.map((map, i) => (
      <span key={map.mapNumber}>
        {i > 0 && " · "}
        {map.mapName} {map.scores[0]}–{map.scores[1]}
      </span>
    ))}
  </div>
);

export const MatchCard = ({
  match,
  side = "left",
}: {
  match: Match;
  side?: "left" | "right";
}) => {
  const formattedTime = match.scheduledAt
    ? format(new Date(match.scheduledAt), "HH:mm")
    : "--:--";

  const isLive = match.status === "running";
  const isFinished = match.status === "finished";
  const borderClass = isLive ? "border-live" : "border-rule";
  const textAlign = side === "left" ? "text-right max-sm:text-left" : "text-left";
  const headerJustify = side === "left" ? "justify-end max-sm:justify-start" : "justify-start";

  // Connector line from card to timeline dot
  // Mobile-first: base = mobile styles, sm: = desktop overrides
  const connectorClass =
    side === "left"
      ? `relative before:content-[''] before:absolute before:top-[14px] before:left-[-49px] before:w-[49px] before:h-px ${isLive ? "before:bg-live" : "before:bg-rule"} sm:before:top-1/2 sm:before:content-none sm:after:content-[''] sm:after:absolute sm:after:top-1/2 sm:after:right-[-30px] sm:after:w-[30px] sm:after:h-px ${isLive ? "sm:after:bg-live" : "sm:after:bg-rule"}`
      : `relative before:content-[''] before:absolute before:top-[14px] before:left-[-49px] before:w-[49px] before:h-px ${isLive ? "before:bg-live" : "before:bg-rule"} sm:before:top-1/2 sm:before:left-[-30px] sm:before:w-[30px]`;

  const playedMaps = match.maps.filter(
    (m) => m.status === "running" || m.status === "finished",
  );

  const score = match.teams.map((t) => t.score ?? "-").join(" – ");

  return (
    <div
      className={`${connectorClass} border-2 ${borderClass} bg-newsprint p-3 max-w-[300px] max-sm:max-w-full w-full ${textAlign}`}
    >
      {/* Header: badge + time */}
      <div className={`flex items-center gap-2 mb-1.5 ${headerJustify}`}>
        {isLive && <StatusBadge status={match.status} />}
        <span className="font-mono text-xs font-bold tracking-[0.08em] text-muted">
          {formattedTime}
        </span>
        {!isLive && <StatusBadge status={match.status} />}
      </div>

      {/* Teams */}
      <div className="flex flex-col gap-0.5 mb-1">
        <TeamName team={match.teams[0]} isFinished={isFinished} side={side} />
        <span className={`font-mono text-[0.6rem] text-dim tracking-[0.1em] ${side === "left" ? "text-right max-sm:text-left" : "text-left"}`}>
          vs
        </span>
        <TeamName team={match.teams[1]} isFinished={isFinished} side={side} />
      </div>

      {/* Score */}
      {(isFinished || isLive) && (
        <div className="font-mono text-[1.4rem] font-bold tracking-[0.05em] mt-0.5">
          {score}
        </div>
      )}

      {/* Maps */}
      {playedMaps.length > 0 && <MapScoreLine maps={playedMaps} />}

      {/* Format */}
      <div className="font-mono text-[0.55rem] tracking-[0.1em] text-dim/70 uppercase mt-1 border-t border-muted/30 pt-1">
        {match.format}
      </div>
    </div>
  );
};
