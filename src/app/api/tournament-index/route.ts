import { NextResponse } from "next/server";
import redis from "@/lib/redis/client";
import { CACHE_KEYS } from "@/lib/redis/keys";
import { TOURNAMENT_IDS } from "@/config/tournaments";
import {
  fetchTournamentSeries,
  buildTournamentSummary,
} from "@/lib/grid/fetchTournaments";
import type { TournamentSummary } from "@/types/match";

export async function GET() {
  try {
    const cached = await redis.get(CACHE_KEYS.TOURNAMENT_INDEX);
    if (cached) {
      const summaries: TournamentSummary[] = JSON.parse(cached);
      return NextResponse.json(summaries);
    }
  } catch (error) {
    console.error("Redis read failed for tournament index:", error);
  }

  // Fallback: fetch from Grid Central directly
  try {
    const summaries: TournamentSummary[] = [];
    for (const id of TOURNAMENT_IDS) {
      const gridSeries = await fetchTournamentSeries(id);
      const summary = buildTournamentSummary(id, gridSeries);
      if (summary) summaries.push(summary);
    }
    return NextResponse.json(summaries);
  } catch (error) {
    console.error("Failed to fetch tournament index:", error);
    return NextResponse.json(
      { error: "Failed to fetch tournament index" },
      { status: 500 },
    );
  }
}
