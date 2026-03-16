import { NextResponse } from "next/server";
import redis from "@/lib/redis/client";
import { REDIS_KEYS } from "@/shared/redis-keys";
import type { Series as RedisSeries } from "@/shared/types/series";
import type { SeriesState as RedisSeriesState } from "@/shared/types/series-state";
import type { Tournament as RedisTournament } from "@/shared/types/tournament";
import type { Match, MatchStatus, MatchTeam, MapScore } from "@/types/match";

/**
 * GET /api/tournaments?limit=5&offset=0&id=828253
 *
 * Returns tournaments with their matches from Redis.
 * Maps the worker's series/state format to the front-end Match format.
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
      
      return NextResponse.json(
        { tournaments: [tournament], hasMore: false, total: 1 },
        {
          headers: cacheHeaders(),
        },
      );
    }

    const total = await redis.zcard(REDIS_KEYS.tournaments);
    const tournamentIds = await redis.zrevrangebyscore(
      REDIS_KEYS.tournaments,
      "+inf",
      "-inf",
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

const parseJson = <T>(value: string): T => JSON.parse(value) as T;

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

  const tournament = parseJson<RedisTournament>(tournamentJson);

  if (seriesIds.length === 0) {
    return {
      id: tournament.id,
      name: tournament.name,
      logoUrl: tournament.logoUrl ?? null,
      matches: [],
    };
  }

  // Batch fetch series + states
  const pipeline = redis.pipeline();
  for (const id of seriesIds) {
    pipeline.get(REDIS_KEYS.series(id));
    pipeline.get(REDIS_KEYS.seriesState(id));
  }

  const results = await pipeline.exec();
  if (!results) {
    return {
      id: tournament.id,
      name: tournament.name,
      logoUrl: tournament.logoUrl ?? null,
      matches: [],
    };
  }

  const matches: Match[] = [];
  for (let i = 0; i < seriesIds.length; i++) {
    const seriesJson = results[i * 2]?.[1] as string | null;
    const stateJson = results[i * 2 + 1]?.[1] as string | null;

    if (seriesJson) {
      const series = parseJson<RedisSeries>(seriesJson);
      const state = stateJson ? parseJson<RedisSeriesState>(stateJson) : null;
      matches.push(mapSeriesToMatch(series, state));
    }
  }

  return {
    id: tournament.id,
    name: tournament.name,
    logoUrl: tournament.logoUrl ?? null,
    matches,
  };
};

// --- Series → Match mapping ---

const deriveStatus = (
  state: RedisSeriesState | null,
  scheduledAt?: string,
): MatchStatus => {
  if (!state) {
    if (scheduledAt && new Date(scheduledAt).getTime() < Date.now()) return "finished";
    return "not_started";
  }
  if (state.finished) return "finished";
  if (state.started) return "running";
  return "not_started";
};

const mapSeriesToMatch = (
  series: RedisSeries,
  state: RedisSeriesState | null,
): Match => {
  const status = deriveStatus(state, series.startTimeScheduled);
  const stateTeamsById = new Map(
    (state?.teams ?? []).map((team) => [team.id, team]),
  );

  const teams: MatchTeam[] = (series.teams ?? []).map(
    (team) => {
      const stateTeam = stateTeamsById.get(team.id);
      return {
        name: team.name,
        shortName: team.name,
        logoUrl: team.logoUrl || null,
        score: stateTeam?.score ?? null,
        isWinner: stateTeam?.won ?? false,
      };
    },
  );

  const maps: MapScore[] = (state?.games ?? []).map((game) => {
    const gameTeamsById = new Map(game.teams.map((team) => [team.id, team]));
    const [firstTeam, secondTeam] = series.teams;
    const firstGameTeam = firstTeam ? gameTeamsById.get(firstTeam.id) : null;
    const secondGameTeam = secondTeam ? gameTeamsById.get(secondTeam.id) : null;

    return {
      mapNumber: game.sequenceNumber,
      mapName: game.mapName ?? "tba",
      status: game.finished
        ? "finished"
        : game.started
          ? "running"
          : "not_started",
      scores: [firstGameTeam?.score ?? 0, secondGameTeam?.score ?? 0],
      sides: [firstGameTeam?.side ?? "", secondGameTeam?.side ?? ""],
    };
  });

  return {
    id: series.id,
    status,
    scheduledAt: series.startTimeScheduled,
    format: series.format ?? "Bo1",
    teams,
    maps,
  };
};
