import { NextRequest, NextResponse } from "next/server";
import redis from "@/lib/redis/client";
import { CACHE_KEYS, getTournamentTtl } from "@/lib/redis/keys";
import {
  fetchTournamentSeries,
  fetchSeriesStates,
  buildTournament,
} from "@/lib/grid/fetchTournaments";
import { getTournamentIndex } from "@/lib/redis/getTournamentIndex";
import { selectRelevantTournaments } from "@/lib/tournaments/selectRelevantTournaments";
import { sortTournamentsByStartDate } from "@/lib/tournaments/sortTournamentsByStartDate";
import type { Tournament } from "@/types/match";

const getCachedTournament = async (id: string): Promise<Tournament | null> => {
  try {
    const cached = await redis.get(CACHE_KEYS.tournamentById(id));
    if (cached) return JSON.parse(cached);
  } catch (error) {
    console.error(`Redis read failed for tournament ${id}:`, error);
  }
  return null;
};

const fetchAndCacheTournament = async (
  tournamentId: string,
): Promise<Tournament | null> => {
  try {
    const gridSeries = await fetchTournamentSeries(tournamentId);
    if (gridSeries.length === 0) return null;

    const first = gridSeries[0];
    const seriesIds = gridSeries.map((s) => s.id);
    const states = await fetchSeriesStates(seriesIds);

    const tournament = buildTournament(
      tournamentId,
      first.tournament.name,
      first.tournament.logoUrl || null,
      gridSeries,
      states,
    );

    const ttl = getTournamentTtl(tournament);
    redis
      .set(
        CACHE_KEYS.tournamentById(tournamentId),
        JSON.stringify(tournament),
        "EX",
        ttl,
      )
      .catch((err) => console.error("Redis write failed:", err));

    return tournament;
  } catch (error) {
    console.error(`Failed to fetch tournament ${tournamentId}:`, error);
    return null;
  }
};

const getDefaultTournaments = async (): Promise<Tournament[]> => {
  const index = await getTournamentIndex();
  const relevant = selectRelevantTournaments(index, 3);

  const tournaments = await Promise.all(
    relevant.map(async (summary) => {
      const cached = await getCachedTournament(summary.id);
      if (cached) return cached;
      return fetchAndCacheTournament(summary.id);
    }),
  );

  return sortTournamentsByStartDate(
    tournaments.filter((t): t is Tournament => t !== null),
  );
};

const getTournamentById = async (
  tournamentId: string,
): Promise<Tournament | null> => {
  const cached = await getCachedTournament(tournamentId);
  if (cached) return cached;

  return fetchAndCacheTournament(tournamentId);
};

export async function GET(request: NextRequest) {
  const tournamentId = request.nextUrl.searchParams.get("tournamentId");

  if (tournamentId) {
    try {
      const tournament = await getTournamentById(tournamentId);
      if (!tournament) {
        return NextResponse.json(
          { error: "Tournament not found" },
          { status: 404 },
        );
      }
      return NextResponse.json(tournament);
    } catch (error) {
      console.error(`Failed to fetch tournament ${tournamentId}:`, error);
      return NextResponse.json(
        { error: "Failed to fetch tournament" },
        { status: 500 },
      );
    }
  }

  try {
    const tournaments = await getDefaultTournaments();
    return NextResponse.json(tournaments);
  } catch (error) {
    console.error("Failed to fetch tournaments:", error);
    return NextResponse.json(
      { error: "Failed to fetch tournaments" },
      { status: 500 },
    );
  }
}
