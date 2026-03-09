"use client";

import { useState, type RefObject } from "react";
import type { Tournament } from "@/types/match";
import { TimelineItem } from "@/components/timeline/TimelineItem";
import { DateSeparator } from "@/components/timeline/DateSeparator";
import { groupMatchesByDate } from "@/lib/matches/groupByDate";

export const TournamentBlock = ({
  tournament,
  scrollMatchId,
  scrollRef,
}: {
  tournament: Tournament;
  scrollMatchId?: string | null;
  scrollRef?: RefObject<HTMLDivElement | null>;
}) => {
  const [collapsed, setCollapsed] = useState(false);

  const matchesByDate = groupMatchesByDate(tournament.matches);
  const dateKeys = Array.from(matchesByDate.keys());

  // Global item index for left/right alternation across all date groups
  let itemIndex = 0;

  return (
    <section className="mb-4">
      {/* Sticky tournament banner */}
      <div
        data-tournament-header
        onClick={() => setCollapsed((c) => !c)}
        className="sticky top-[50px] max-sm:top-[44px] z-100 bg-newsprint border-b-4 border-rule px-6 py-2 flex items-center justify-center gap-4 cursor-pointer select-none hover:bg-newsprint-hover transition-colors"
      >
        <div className="flex-1 h-px bg-rule" />
        <h2 className="font-serif text-[clamp(0.75rem,2vw,1rem)] font-bold tracking-[0.1em] uppercase whitespace-nowrap flex items-center gap-2">
          <span
            className={`inline-block text-[0.7rem] font-mono leading-none transition-transform duration-250 ${
              collapsed ? "-rotate-90" : ""
            }`}
          >
            ▼
          </span>
          {tournament.logoUrl && (
            <img src={tournament.logoUrl} alt="" className="h-5 w-5 object-contain" />
          )}
          {tournament.name}
        </h2>
        <div className="flex-1 h-px bg-rule" />
      </div>

      {/* Collapsible body */}
      {!collapsed && (
        <div className="relative max-w-[820px] mx-auto px-6 pb-8 before:content-[''] before:absolute before:left-[20px] before:top-0 before:bottom-0 before:w-0.5 before:bg-rule before:-translate-x-1/2 sm:before:left-1/2">
          {dateKeys.map((dateKey) => {
            const matches = matchesByDate.get(dateKey)!;
            return (
              <div key={dateKey}>
                <DateSeparator date={new Date(dateKey)} />
                {matches.map((match) => {
                  const side = itemIndex % 2 === 0 ? "left" as const : "right" as const;
                  itemIndex++;
                  return (
                    <TimelineItem
                      key={match.id}
                      match={match}
                      side={side}
                      ref={match.id === scrollMatchId ? scrollRef : undefined}
                    />
                  );
                })}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};
