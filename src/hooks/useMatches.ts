"use client";

import { useQuery } from "@tanstack/react-query";
import type { Match } from "@/types/match";

const fetchMatches = async (): Promise<Match[]> => {
  const response = await fetch("/api/matches");
  if (!response.ok) throw new Error("Failed to fetch matches");
  return response.json();
};

export const useMatches = () =>
  useQuery({
    queryKey: ["matches"],
    queryFn: fetchMatches,
    refetchInterval: 60_000,
  });
