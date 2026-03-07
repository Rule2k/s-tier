"use client";

import { useQuery } from "@tanstack/react-query";
import type { Serie, SerieSummary } from "@/types/match";

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

const fetchSeriesIndex = async (): Promise<SerieSummary[]> => {
  const response = await fetch("/api/series-index");
  if (!response.ok) throw new Error("Failed to fetch series index");
  return response.json();
};

export const useSeriesIndex = () =>
  useQuery({
    queryKey: ["series-index"],
    queryFn: fetchSeriesIndex,
    staleTime: 5 * 60 * 1000,
  });
