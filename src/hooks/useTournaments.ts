"use client";

import { useQuery } from "@tanstack/react-query";
import type { Tournament, TournamentSummary } from "@/types/match";

// --- Response type from /api/tournaments ---

interface TournamentsResponse {
  tournaments: Tournament[];
  hasMore: boolean;
  total: number;
}

// --- Hooks ---

const fetchTournaments = async (): Promise<Tournament[]> => {
  const response = await fetch("/api/tournaments?limit=5");
  if (!response.ok) throw new Error("Failed to fetch tournaments");
  const data: TournamentsResponse = await response.json();
  return data.tournaments;
};

export const useTournaments = () =>
  useQuery({
    queryKey: ["tournaments"],
    queryFn: fetchTournaments,
    refetchInterval: 30_000,
  });

const fetchTournamentById = async (id: string): Promise<Tournament> => {
  const response = await fetch(`/api/tournaments?id=${id}`);
  if (!response.ok) throw new Error(`Failed to fetch tournament ${id}`);
  const data: TournamentsResponse = await response.json();
  return data.tournaments[0];
};

export { fetchTournamentById };

// Tournament index is now derived from the same endpoint
// We keep useTournamentIndex for backward compat with useTournamentNavigation
const fetchTournamentIndex = async (): Promise<TournamentSummary[]> => {
  const response = await fetch("/api/tournaments?limit=100");
  if (!response.ok) throw new Error("Failed to fetch tournament index");
  const data: TournamentsResponse = await response.json();
  return data.tournaments.map((t) => ({
    id: t.id,
    name: t.name,
    logoUrl: t.logoUrl,
    startDate: t.matches[0]?.scheduledAt ?? "",
    endDate: t.matches[t.matches.length - 1]?.scheduledAt ?? null,
  }));
};

export const useTournamentIndex = () =>
  useQuery({
    queryKey: ["tournament-index"],
    queryFn: fetchTournamentIndex,
    staleTime: 5 * 60_000,
  });
