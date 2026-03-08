"use client";

import { useState, useCallback, useMemo } from "react";
import { useTournaments, useTournamentIndex } from "./useTournaments";
import type { Tournament } from "@/types/match";

const fetchTournamentById = async (id: string): Promise<Tournament> => {
  const response = await fetch(`/api/matches?tournamentId=${id}`);
  if (!response.ok) throw new Error(`Failed to fetch tournament ${id}`);
  return response.json();
};

const getStartDate = (t: Tournament): string =>
  t.matches[0]?.scheduledAt ?? "";

export const useTournamentNavigation = () => {
  const {
    data: defaultTournaments,
    isLoading: isLoadingDefault,
    error,
  } = useTournaments();
  const { data: index } = useTournamentIndex();
  const [extraTournaments, setExtraTournaments] = useState<Tournament[]>([]);
  const [loadingDirection, setLoadingDirection] = useState<
    "previous" | "next" | null
  >(null);

  // All loaded tournaments (default + extras), sorted by first match date
  const allLoaded = useMemo(() => {
    const merged = [...(defaultTournaments ?? []), ...extraTournaments];
    const seen = new Set<string>();
    return merged
      .filter((t) => {
        if (seen.has(t.id)) return false;
        seen.add(t.id);
        return true;
      })
      .sort(
        (a, b) =>
          new Date(getStartDate(a)).getTime() -
          new Date(getStartDate(b)).getTime(),
      );
  }, [defaultTournaments, extraTournaments]);

  // Index sorted by startDate
  const sortedIndex = useMemo(() => {
    if (!index) return [];
    return [...index].sort(
      (a, b) =>
        new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
    );
  }, [index]);

  const loadedIds = useMemo(
    () => new Set(allLoaded.map((t) => t.id)),
    [allLoaded],
  );

  const hasPrevious = useMemo(() => {
    if (!sortedIndex.length || !allLoaded.length) return false;
    const earliestDate = getStartDate(allLoaded[0]);
    return sortedIndex.some(
      (s) =>
        new Date(s.startDate).getTime() < new Date(earliestDate).getTime() &&
        !loadedIds.has(s.id),
    );
  }, [sortedIndex, allLoaded, loadedIds]);

  const hasNext = useMemo(() => {
    if (!sortedIndex.length || !allLoaded.length) return false;
    const latestDate = getStartDate(allLoaded[allLoaded.length - 1]);
    return sortedIndex.some(
      (s) =>
        new Date(s.startDate).getTime() > new Date(latestDate).getTime() &&
        !loadedIds.has(s.id),
    );
  }, [sortedIndex, allLoaded, loadedIds]);

  const loadPrevious = useCallback(async () => {
    if (!sortedIndex.length || !allLoaded.length || loadingDirection) return;
    const earliestDate = getStartDate(allLoaded[0]);
    const previous = [...sortedIndex]
      .reverse()
      .find(
        (s) =>
          new Date(s.startDate).getTime() <
            new Date(earliestDate).getTime() && !loadedIds.has(s.id),
      );
    if (!previous) return;

    setLoadingDirection("previous");
    try {
      const tournament = await fetchTournamentById(previous.id);
      setExtraTournaments((prev) => [...prev, tournament]);
    } finally {
      setLoadingDirection(null);
    }
  }, [sortedIndex, allLoaded, loadedIds, loadingDirection]);

  const loadNext = useCallback(async () => {
    if (!sortedIndex.length || !allLoaded.length || loadingDirection) return;
    const latestDate = getStartDate(allLoaded[allLoaded.length - 1]);
    const next = sortedIndex.find(
      (s) =>
        new Date(s.startDate).getTime() > new Date(latestDate).getTime() &&
        !loadedIds.has(s.id),
    );
    if (!next) return;

    setLoadingDirection("next");
    try {
      const tournament = await fetchTournamentById(next.id);
      setExtraTournaments((prev) => [...prev, tournament]);
    } finally {
      setLoadingDirection(null);
    }
  }, [sortedIndex, allLoaded, loadedIds, loadingDirection]);

  return {
    tournaments: allLoaded,
    isLoading: isLoadingDefault,
    error,
    loadPrevious,
    loadNext,
    hasPrevious,
    hasNext,
    loadingDirection,
  };
};
