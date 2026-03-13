import type { Match } from "@/types/match";

export type TournamentStatus =
  | { type: "finished"; winner: { name: string; logoUrl: string | null } | null }
  | { type: "live"; count: number }
  | { type: "in_progress" }
  | { type: "upcoming" };

export const getTournamentStatus = (matches: Match[]): TournamentStatus => {
  const liveCount = matches.filter((match) => match.status === "running").length;
  if (liveCount > 0) return { type: "live", count: liveCount };

  const hasFinished = matches.some((match) => match.status === "finished");
  const hasUpcoming = matches.some((match) => match.status === "not_started");
  if (hasFinished && hasUpcoming) return { type: "in_progress" };
  if (!hasFinished) return { type: "upcoming" };

  const lastMatch = [...matches].sort(
    (matchA, matchB) => new Date(matchB.scheduledAt).getTime() - new Date(matchA.scheduledAt).getTime(),
  )[0];
  const winnerTeam = lastMatch?.teams.find((team) => team.isWinner) ?? null;

  return {
    type: "finished",
    winner: winnerTeam ? { name: winnerTeam.name, logoUrl: winnerTeam.logoUrl } : null,
  };
};
