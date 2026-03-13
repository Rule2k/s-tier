import type { TournamentSummary } from "@/types/match";

export const findAdjacentTournamentSummary = ({
  direction,
  loadedIds,
  sortedIndex,
  boundaryStartDate,
}: {
  direction: "previous" | "next";
  loadedIds: Set<string>;
  sortedIndex: TournamentSummary[];
  boundaryStartDate: string;
}): TournamentSummary | null => {
  const boundaryTime = new Date(boundaryStartDate).getTime();
  const candidates = direction === "previous" ? [...sortedIndex].reverse() : sortedIndex;

  return (
    candidates.find((summary) => {
      const summaryStartTime = new Date(summary.startDate).getTime();
      const isOnRequestedSide =
        direction === "previous"
          ? summaryStartTime < boundaryTime
          : summaryStartTime > boundaryTime;

      return isOnRequestedSide && !loadedIds.has(summary.id);
    }) ?? null
  );
};
