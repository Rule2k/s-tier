"use client";

import { useState, useCallback, useMemo } from "react";
import { useSeries, useSeriesIndex } from "./useSeries";
import type { Serie, SerieSummary } from "@/types/match";

const fetchSerieById = async (id: string): Promise<Serie> => {
  const response = await fetch(`/api/matches?serieId=${id}`);
  if (!response.ok) throw new Error(`Failed to fetch serie ${id}`);
  return response.json();
};

export const useSeriesNavigation = () => {
  const { data: defaultSeries, isLoading: isLoadingDefault, error } = useSeries();
  const { data: index } = useSeriesIndex();
  const [extraSeries, setExtraSeries] = useState<Serie[]>([]);
  const [loadingDirection, setLoadingDirection] = useState<"previous" | "next" | null>(null);

  // All loaded series (default + extras), sorted by beginAt
  const allLoaded = useMemo(() => {
    const merged = [...(defaultSeries ?? []), ...extraSeries];
    const seen = new Set<string>();
    return merged
      .filter((s) => {
        if (seen.has(s.id)) return false;
        seen.add(s.id);
        return true;
      })
      .sort((a, b) => new Date(a.beginAt).getTime() - new Date(b.beginAt).getTime());
  }, [defaultSeries, extraSeries]);

  // Index sorted by beginAt
  const sortedIndex = useMemo(() => {
    if (!index) return [];
    return [...index].sort(
      (a, b) => new Date(a.beginAt).getTime() - new Date(b.beginAt).getTime(),
    );
  }, [index]);

  const loadedIds = useMemo(() => new Set(allLoaded.map((s) => s.id)), [allLoaded]);

  const hasPrevious = useMemo(() => {
    if (!sortedIndex.length || !allLoaded.length) return false;
    const earliestLoaded = allLoaded[0];
    return sortedIndex.some(
      (s) => new Date(s.beginAt).getTime() < new Date(earliestLoaded.beginAt).getTime() && !loadedIds.has(s.id),
    );
  }, [sortedIndex, allLoaded, loadedIds]);

  const hasNext = useMemo(() => {
    if (!sortedIndex.length || !allLoaded.length) return false;
    const latestLoaded = allLoaded[allLoaded.length - 1];
    return sortedIndex.some(
      (s) => new Date(s.beginAt).getTime() > new Date(latestLoaded.beginAt).getTime() && !loadedIds.has(s.id),
    );
  }, [sortedIndex, allLoaded, loadedIds]);

  const loadPrevious = useCallback(async () => {
    if (!sortedIndex.length || !allLoaded.length || loadingDirection) return;
    const earliestLoaded = allLoaded[0];
    // Find the closest previous serie in the index that isn't loaded
    const previous = [...sortedIndex]
      .reverse()
      .find(
        (s) => new Date(s.beginAt).getTime() < new Date(earliestLoaded.beginAt).getTime() && !loadedIds.has(s.id),
      );
    if (!previous) return;

    setLoadingDirection("previous");
    try {
      const serie = await fetchSerieById(previous.id);
      setExtraSeries((prev) => [...prev, serie]);
    } finally {
      setLoadingDirection(null);
    }
  }, [sortedIndex, allLoaded, loadedIds, loadingDirection]);

  const loadNext = useCallback(async () => {
    if (!sortedIndex.length || !allLoaded.length || loadingDirection) return;
    const latestLoaded = allLoaded[allLoaded.length - 1];
    const next = sortedIndex.find(
      (s) => new Date(s.beginAt).getTime() > new Date(latestLoaded.beginAt).getTime() && !loadedIds.has(s.id),
    );
    if (!next) return;

    setLoadingDirection("next");
    try {
      const serie = await fetchSerieById(next.id);
      setExtraSeries((prev) => [...prev, serie]);
    } finally {
      setLoadingDirection(null);
    }
  }, [sortedIndex, allLoaded, loadedIds, loadingDirection]);

  return {
    series: allLoaded,
    isLoading: isLoadingDefault,
    error,
    loadPrevious,
    loadNext,
    hasPrevious,
    hasNext,
    loadingDirection,
  };
};
