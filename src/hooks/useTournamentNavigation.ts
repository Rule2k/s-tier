"use client";

import { useState, useCallback, useMemo } from "react";
import { findAdjacentTournamentSummary } from "@/utils/tournaments/findAdjacentTournamentSummary";
import { getTournamentStartDate } from "@/utils/tournaments/getTournamentStartDate";
import { mergeUniqueTournaments } from "@/utils/tournaments/mergeUniqueTournaments";
import { sortTournamentSummariesByStartDate } from "@/utils/tournaments/sortTournamentSummariesByStartDate";
import { sortTournamentsByStartDate } from "@/utils/tournaments/sortTournamentsByStartDate";
import { useTournaments, useTournamentIndex, fetchTournamentById } from "./useTournaments";
import type { Tournament } from "@/types/match";

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

  const allLoaded = useMemo(() => {
    return sortTournamentsByStartDate(
      mergeUniqueTournaments([...(defaultTournaments ?? []), ...extraTournaments]),
    );
  }, [defaultTournaments, extraTournaments]);

  const sortedIndex = useMemo(() => {
    if (!index) return [];
    return sortTournamentSummariesByStartDate(index);
  }, [index]);

  const loadedIds = useMemo(
    () => new Set(allLoaded.map((t) => t.id)),
    [allLoaded],
  );

  const hasPrevious = useMemo(() => {
    if (!sortedIndex.length || !allLoaded.length) return false;
    return Boolean(
      findAdjacentTournamentSummary({
        direction: "previous",
        loadedIds,
        sortedIndex,
        boundaryStartDate: getTournamentStartDate(allLoaded[0]),
      }),
    );
  }, [sortedIndex, allLoaded, loadedIds]);

  const hasNext = useMemo(() => {
    if (!sortedIndex.length || !allLoaded.length) return false;
    return Boolean(
      findAdjacentTournamentSummary({
        direction: "next",
        loadedIds,
        sortedIndex,
        boundaryStartDate: getTournamentStartDate(allLoaded[allLoaded.length - 1]),
      }),
    );
  }, [sortedIndex, allLoaded, loadedIds]);

  const loadDirection = useCallback(async (direction: "previous" | "next") => {
    if (!sortedIndex.length || !allLoaded.length || loadingDirection) return;
    const boundaryTournament =
      direction === "previous" ? allLoaded[0] : allLoaded[allLoaded.length - 1];
    const adjacent = findAdjacentTournamentSummary({
      direction,
      loadedIds,
      sortedIndex,
      boundaryStartDate: getTournamentStartDate(boundaryTournament),
    });
    if (!adjacent) return;

    setLoadingDirection(direction);
    try {
      const tournament = await fetchTournamentById(adjacent.id);
      setExtraTournaments((prev) => [...prev, tournament]);
    } finally {
      setLoadingDirection(null);
    }
  }, [sortedIndex, allLoaded, loadedIds, loadingDirection]);

  const loadPrevious = useCallback(
    () => loadDirection("previous"),
    [loadDirection],
  );

  const loadNext = useCallback(
    () => loadDirection("next"),
    [loadDirection],
  );

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
