import { NextRequest, NextResponse } from "next/server";
import redis from "@/lib/redis/client";
import { CACHE_KEYS } from "@/lib/redis/keys";
import { selectRelevantTournaments } from "@/lib/tournaments/selectRelevantTournaments";
import { sortTournamentsByStartDate } from "@/lib/tournaments/sortTournamentsByStartDate";
import type { Tournament, TournamentSummary } from "@/types/match";

const CACHE_HEADERS = {
  "Cache-Control": "public, max-age=15, stale-while-revalidate=30",
};

export async function GET(request: NextRequest) {
  const tournamentId = request.nextUrl.searchParams.get("tournamentId");

  if (tournamentId) {
    try {
      const cached = await redis.get(CACHE_KEYS.tournamentById(tournamentId));
      if (!cached) {
        return NextResponse.json(
          { error: "Tournament not found" },
          { status: 404 },
        );
      }
      return NextResponse.json(JSON.parse(cached), { headers: CACHE_HEADERS });
    } catch (error) {
      console.error(`Redis read failed for tournament ${tournamentId}:`, error);
      return NextResponse.json(
        { error: "Data not yet available", retryAfter: 15 },
        { status: 503, headers: { "Retry-After": "15" } },
      );
    }
  }

  // Default: return 3 relevant tournaments
  try {
    const indexRaw = await redis.get(CACHE_KEYS.TOURNAMENTS_INDEX);
    if (!indexRaw) {
      return NextResponse.json(
        { error: "Data not yet available", retryAfter: 15 },
        { status: 503, headers: { "Retry-After": "15" } },
      );
    }

    const index: TournamentSummary[] = JSON.parse(indexRaw);
    const relevant = selectRelevantTournaments(index, 3);

    if (relevant.length === 0) {
      return NextResponse.json([], { headers: CACHE_HEADERS });
    }

    const keys = relevant.map((s) => CACHE_KEYS.tournamentById(s.id));
    const results = await redis.mget(...keys);

    const tournaments: Tournament[] = results
      .filter((raw): raw is string => raw !== null)
      .map((raw) => JSON.parse(raw));

    return NextResponse.json(
      sortTournamentsByStartDate(tournaments),
      { headers: CACHE_HEADERS },
    );
  } catch (error) {
    console.error("Failed to fetch tournaments from Redis:", error);
    return NextResponse.json(
      { error: "Data not yet available", retryAfter: 15 },
      { status: 503, headers: { "Retry-After": "15" } },
    );
  }
}
