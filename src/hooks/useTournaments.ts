"use client";

import { useQuery } from "@tanstack/react-query";
import type { Tournament, TournamentSummary } from "@/types/match";

const fetchTournaments = async (): Promise<Tournament[]> => {
  const response = await fetch("/api/matches");
  if (!response.ok) throw new Error("Failed to fetch tournaments");
  return response.json();
};

export const useTournaments = () =>
  useQuery({
    queryKey: ["tournaments"],
    queryFn: fetchTournaments,
    refetchInterval: 60_000,
  });

const fetchTournamentIndex = async (): Promise<TournamentSummary[]> => {
  const response = await fetch("/api/tournament-index");
  if (!response.ok) throw new Error("Failed to fetch tournament index");
  return response.json();
};

export const useTournamentIndex = () =>
  useQuery({
    queryKey: ["tournament-index"],
    queryFn: fetchTournamentIndex,
    staleTime: 5 * 60 * 1000,
  });
