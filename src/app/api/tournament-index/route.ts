import { NextResponse } from "next/server";
import redis from "@/lib/redis/client";
import { CACHE_KEYS } from "@/lib/redis/keys";

export async function GET() {
  try {
    const cached = await redis.get(CACHE_KEYS.TOURNAMENTS_INDEX);
    if (!cached) {
      return NextResponse.json(
        { error: "Data not yet available", retryAfter: 15 },
        { status: 503, headers: { "Retry-After": "15" } },
      );
    }
    return NextResponse.json(JSON.parse(cached), {
      headers: {
        "Cache-Control": "public, max-age=15, stale-while-revalidate=30",
      },
    });
  } catch (error) {
    console.error("Failed to fetch tournament index from Redis:", error);
    return NextResponse.json(
      { error: "Data not yet available", retryAfter: 15 },
      { status: 503, headers: { "Retry-After": "15" } },
    );
  }
}
