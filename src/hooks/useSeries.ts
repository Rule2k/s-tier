"use client";

import { useQuery } from "@tanstack/react-query";
import type { Serie } from "@/types/match";

const fetchSeries = async (): Promise<Serie[]> => {
  const response = await fetch("/api/matches");
  if (!response.ok) throw new Error("Failed to fetch series");
  return response.json();
};

export const useSeries = () =>
  useQuery({
    queryKey: ["series"],
    queryFn: fetchSeries,
    refetchInterval: 60_000,
  });
