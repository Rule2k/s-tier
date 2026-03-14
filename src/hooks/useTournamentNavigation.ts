"use client";

import { useState, useCallback, useMemo } from "react";
import { sortTournamentsByStartDate } from "@/utils/tournaments/sortTournamentsByStartDate";
import { mergeUniqueTournaments } from "@/utils/tournaments/mergeUniqueTournaments";
import { useTournaments, fetchTournamentById } from "./useTournaments";
import type { Tournament } from "@/types/match";

const PAGE_SIZE = 5;

export const useTournamentNavigation = () => {
  const {
    data,
    isLoading: isLoadingDefault,
    error,
  } = useTournaments(PAGE_SIZE, 0);

  const [extraTournaments, setExtraTournaments] = useState<Tournament[]>([]);
  const [loadingDirection, setLoadingDirection] = useState<
    "previous" | "next" | null
  >(null);

  const defaultTournaments = data?.tournaments ?? [];
  const total = data?.total ?? 0;

  const allLoaded = useMemo(
    () =>
      sortTournamentsByStartDate(
        mergeUniqueTournaments([...defaultTournaments, ...extraTournaments]),
      ),
    [defaultTournaments, extraTournaments],
  );

  // Redis returns tournaments most-recent-first (offset 0 = newest).
  // "Load earlier" = fetch the next one in that descending order.
  const hasPrevious = useMemo(() => {
    if (!allLoaded.length || total === 0) return false;
    return allLoaded.length < total;
  }, [allLoaded, total]);

  // No "load next" — initial fetch already starts from the most recent
  const hasNext = false;

  const loadDirection = useCallback(
    async (direction: "previous" | "next") => {
      if (loadingDirection) return;

      const offset = allLoaded.length;

      setLoadingDirection(direction);
      try {
        const response = await fetch(
          `/api/tournaments?limit=1&offset=${offset}`,
        );
        if (!response.ok) throw new Error("Failed to load tournament");
        const data = await response.json();
        const tournament = data.tournaments[0];
        if (tournament) {
          setExtraTournaments((prev) => [...prev, tournament]);
        }
      } finally {
        setLoadingDirection(null);
      }
    },
    [allLoaded, loadingDirection],
  );

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
