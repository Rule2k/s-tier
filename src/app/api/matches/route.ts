import { NextResponse } from "next/server";
import redis from "@/lib/redis/client";
import { CACHE_KEYS, CACHE_TTL } from "@/lib/redis/keys";
import { fetchMatchesFromPandaScore } from "@/lib/pandascore/fetchMatches";

export async function GET() {
  // 1. Try Redis cache
  try {
    const cached = await redis.get(CACHE_KEYS.MATCHES);
    if (cached) return NextResponse.json(JSON.parse(cached));
  } catch (error) {
    console.error("Redis read failed, falling back to PandaScore:", error);
  }

  // 2. Fallback: fetch directly from PandaScore
  try {
    const matches = await fetchMatchesFromPandaScore();
    redis.set(CACHE_KEYS.MATCHES, JSON.stringify(matches), "EX", CACHE_TTL)
      .catch((err) => console.error("Redis write failed:", err));
    return NextResponse.json(matches);
  } catch (error) {
    console.error("PandaScore fallback failed:", error);
    return NextResponse.json(
      { error: "Failed to fetch matches" },
      { status: 500 }
    );
  }
}
