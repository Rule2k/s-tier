import { NextResponse } from "next/server";
import redis from "@/lib/redis/client";
import { REDIS_KEYS } from "@/shared/redis-keys";

/**
 * GET /api/tournaments?limit=5&offset=0&id=828253
 *
 * Returns tournaments with their series and series states from Redis.
 * The worker writes all data; this route only reads.
 */
export const GET = async (request: Request) => {
  const { searchParams } = new URL(request.url);

  const singleId = searchParams.get("id");
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "5", 10), 20);
  const offset = parseInt(searchParams.get("offset") ?? "0", 10);

  try {
    if (singleId) {
      const tournament = await buildTournamentPayload(singleId);
      if (!tournament) {
        return NextResponse.json(
          { error: "Tournament not found" },
          { status: 404 },
        );
      }
      return NextResponse.json({ tournaments: [tournament], hasMore: false, total: 1 }, {
        headers: cacheHeaders(),
      });
    }

    // Get tournament IDs from sorted set (ordered by startDate)
    const total = await redis.zcard(REDIS_KEYS.tournaments);
    const tournamentIds = await redis.zrangebyscore(
      REDIS_KEYS.tournaments,
      "-inf",
      "+inf",
      "LIMIT",
      offset,
      limit,
    );

    if (tournamentIds.length === 0) {
      return NextResponse.json(
        { error: "No data available yet" },
        { status: 503, headers: { "Retry-After": "15" } },
      );
    }

    const tournaments = await Promise.all(
      tournamentIds.map(buildTournamentPayload),
    );

    return NextResponse.json(
      {
        tournaments: tournaments.filter(Boolean),
        hasMore: offset + limit < total,
        total,
      },
      { headers: cacheHeaders() },
    );
  } catch (error) {
    console.error("[api/tournaments] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
};

// --- Helpers ---

const cacheHeaders = () => ({
  "Cache-Control": "public, max-age=15, stale-while-revalidate=30",
});

const buildTournamentPayload = async (tournamentId: string) => {
  const [tournamentJson, seriesIds] = await Promise.all([
    redis.get(REDIS_KEYS.tournament(tournamentId)),
    redis.zrangebyscore(
      REDIS_KEYS.tournamentSeries(tournamentId),
      "-inf",
      "+inf",
    ),
  ]);

  if (!tournamentJson) return null;

  const tournament = JSON.parse(tournamentJson);

  if (seriesIds.length === 0) {
    return { ...tournament, series: [] };
  }

  // Batch fetch series + states
  const pipeline = redis.pipeline();
  for (const id of seriesIds) {
    pipeline.get(REDIS_KEYS.series(id));
    pipeline.get(REDIS_KEYS.seriesState(id));
  }

  const results = await pipeline.exec();
  if (!results) return { ...tournament, series: [] };

  const series = [];
  for (let i = 0; i < seriesIds.length; i++) {
    const seriesJson = results[i * 2]?.[1] as string | null;
    const stateJson = results[i * 2 + 1]?.[1] as string | null;

    if (seriesJson) {
      series.push({
        ...JSON.parse(seriesJson),
        state: stateJson ? JSON.parse(stateJson) : null,
      });
    }
  }

  return { ...tournament, series };
};
