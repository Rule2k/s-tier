import { NextResponse } from "next/server";
import redis from "@/lib/redis/client";
import { REDIS_KEYS } from "@/shared/redis-keys";
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
      const series = JSON.parse(seriesJson);
      const state = stateJson ? JSON.parse(stateJson) : null;
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

const deriveStatus = (state: SeriesStateData | null, scheduledAt?: string): MatchStatus => {
  if (!state) {
    if (scheduledAt && new Date(scheduledAt).getTime() < Date.now()) return "finished";
    return "not_started";
  }
  if (state.finished) return "finished";
  if (state.started) return "running";
  return "not_started";
};

const mapSeriesToMatch = (
  series: SeriesData,
  state: SeriesStateData | null,
): Match => {
  const status = deriveStatus(state, series.startTimeScheduled);

  const teams: MatchTeam[] = (series.teams ?? []).map(
    (team: { id: string; name: string; logoUrl?: string | null }, index: number) => {
      const stateTeam = state?.teams?.[index];
      return {
        name: team.name,
        shortName: team.name,
        logoUrl: team.logoUrl || null,
        score: stateTeam?.score ?? null,
        isWinner: stateTeam?.won ?? false,
      };
    },
  );

  const maps: MapScore[] = (state?.games ?? []).map((game: GameData) => ({
    mapNumber: game.sequenceNumber,
    mapName: game.mapName ?? "tba",
    status: game.finished
      ? "finished"
      : game.started
        ? "running"
        : "not_started",
    scores: [game.teams?.[0]?.score ?? 0, game.teams?.[1]?.score ?? 0],
    sides: [game.teams?.[0]?.side ?? "", game.teams?.[1]?.side ?? ""],
  }));

  return {
    id: series.id,
    status,
    scheduledAt: series.startTimeScheduled,
    format: series.format ?? "Bo1",
    teams,
    maps,
  };
};

// --- Redis data shapes (what the worker writes) ---

interface SeriesData {
  id: string;
  startTimeScheduled: string;
  format: string;
  teams: { id: string; name: string }[];
}

interface GameTeamData {
  score: number;
  side: string;
}

interface GameData {
  sequenceNumber: number;
  mapName: string;
  started: boolean;
  finished: boolean;
  teams: GameTeamData[];
}

interface SeriesStateData {
  started: boolean;
  finished: boolean;
  teams: { id: string; name: string; score: number; won: boolean }[];
  games: GameData[];
}
