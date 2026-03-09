import { forwardRef } from "react";
import type { Match } from "@/types/match";
import { MatchCard } from "./MatchCard";

interface TimelineItemProps {
  match: Match;
  side: "left" | "right";
}

const dotStyle = (status: Match["status"]): string => {
  if (status === "running") return "bg-live animate-dot-pulse";
  if (status === "not_started") return "bg-newsprint border-2 border-rule";
  return "bg-rule";
};

export const TimelineItem = forwardRef<HTMLDivElement, TimelineItemProps>(
  ({ match, side }, ref) => {
    const positionClass =
      side === "left"
        ? "justify-end pr-[calc(50%+30px)] max-sm:justify-start max-sm:pr-4 max-sm:pl-[52px]"
        : "justify-start pl-[calc(50%+30px)] max-sm:pl-[52px] max-sm:pr-4";

    return (
      <div ref={ref} className={`relative flex py-3 ${positionClass}`}>
        {/* Dot on timeline */}
        <div
          className={`absolute left-[-11px] top-[27px] w-3.5 h-3.5 rounded-full z-3 sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 ${dotStyle(match.status)}`}
        />
        <MatchCard match={match} side={side} />
      </div>
    );
  },
);

TimelineItem.displayName = "TimelineItem";
