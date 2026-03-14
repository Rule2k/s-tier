"use client";

import { useQuery } from "@tanstack/react-query";
import type { Tournament, TournamentsResponse } from "@/types/match";

// --- Hooks ---

const fetchTournaments = async (
  limit: number,
  offset: number,
): Promise<TournamentsResponse> => {
  const response = await fetch(`/api/tournaments?limit=${limit}&offset=${offset}`);
  if (!response.ok) throw new Error("Failed to fetch tournaments");
  return response.json();
};

export const useTournaments = (limit = 5, offset = 0) =>
  useQuery({
    queryKey: ["tournaments", limit, offset],
    queryFn: () => fetchTournaments(limit, offset),
    refetchInterval: 30_000,
  });

export const fetchTournamentById = async (id: string): Promise<Tournament> => {
  const response = await fetch(`/api/tournaments?id=${id}`);
  if (!response.ok) throw new Error(`Failed to fetch tournament ${id}`);
  const data: TournamentsResponse = await response.json();
  return data.tournaments[0];
};
