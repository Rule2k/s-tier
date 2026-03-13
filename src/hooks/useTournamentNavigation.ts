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

  // There are earlier tournaments if the first loaded isn't the first overall
  const hasPrevious = useMemo(() => {
    if (!allLoaded.length || total === 0) return false;
    return allLoaded.length < total && defaultTournaments.length > 0;
  }, [allLoaded, total, defaultTournaments]);

  // There are later tournaments if we haven't loaded them all
  const hasNext = useMemo(() => {
    if (!allLoaded.length || total === 0) return false;
    return allLoaded.length < total;
  }, [allLoaded, total]);

  const loadDirection = useCallback(
    async (direction: "previous" | "next") => {
      if (loadingDirection) return;

      // Calculate what offset to fetch based on what we already have
      const currentCount = allLoaded.length;
      const offset =
        direction === "next"
          ? currentCount
          : Math.max(0, currentCount - PAGE_SIZE);

      setLoadingDirection(direction);
      try {
        const response = await fetch(
          `/api/tournaments?limit=1&offset=${direction === "next" ? currentCount : Math.max(0, offset - 1)}`,
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
