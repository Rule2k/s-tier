import { NextResponse } from "next/server";
import redis from "@/lib/redis/client";
import { CACHE_KEYS } from "@/lib/redis/keys";
import type { TournamentSummary } from "@/types/match";

export async function GET() {
  try {
    const cached = await redis.get(CACHE_KEYS.TOURNAMENT_INDEX);
    if (cached) {
      const summaries: TournamentSummary[] = JSON.parse(cached);
      return NextResponse.json(summaries);
    }

    // No Central fallback from app (rate limit) — return empty
    return NextResponse.json([]);
  } catch (error) {
    console.error("Failed to fetch tournament index:", error);
    return NextResponse.json(
      { error: "Failed to fetch tournament index" },
      { status: 500 },
    );
  }
}
