import redis from "../src/lib/redis/client";
import { REDIS_KEYS, REDIS_TTL } from "../src/shared/redis-keys";
import type { FetchedTournament, FetchedSeries, FetchedSeriesState } from "./types/grid";
import { logError } from "./logger";

type RedisPipeline = ReturnType<typeof redis.pipeline>;

const getTimestampScore = (date: string | null): number => {
  if (!date) return 0;
  const timestamp = new Date(date).getTime();
  return Number.isFinite(timestamp) ? timestamp : 0;
};

const throwPipelineError = (context: string, error: unknown): never => {
  logError(context, error);
  throw error instanceof Error ? error : new Error(String(error));
};

const execPipeline = async (
  pipeline: RedisPipeline,
  context: string,
) => {
  let results: Awaited<ReturnType<RedisPipeline["exec"]>> = null;
  try {
    results = await pipeline.exec();
  } catch (error) {
    throwPipelineError(context, error);
  }

  if (results == null) {
    throwPipelineError(context, new Error("Redis pipeline returned null"));
  }

  const resolvedResults = results as NonNullable<
    Awaited<ReturnType<RedisPipeline["exec"]>>
  >;

  for (const [error] of resolvedResults) {
    if (error) {
      throwPipelineError(context, error);
    }
  }

  return resolvedResults;
};

const deleteSeriesArtifacts = (
  pipeline: RedisPipeline,
  seriesIds: Iterable<string>,
) => {
  for (const seriesId of seriesIds) {
    pipeline.del(REDIS_KEYS.series(seriesId));
    pipeline.del(REDIS_KEYS.seriesState(seriesId));
    pipeline.del(REDIS_KEYS.metaSeriesLastRefresh(seriesId));
    pipeline.del(REDIS_KEYS.metaSeriesStatus(seriesId));
  }
};

// --- Tournament index (Sorted Set) ---

export const writeTournaments = async (
  tournaments: FetchedTournament[],
): Promise<void> => {
  const pipeline = redis.pipeline();

  // Clear and rebuild the sorted set (no TTL — rewritten every discovery cycle)
  pipeline.del(REDIS_KEYS.tournaments);

  for (const t of tournaments) {
    const score = getTimestampScore(t.startDate);
    pipeline.zadd(REDIS_KEYS.tournaments, score, t.id);
    pipeline.set(REDIS_KEYS.tournament(t.id), JSON.stringify(t));
  }

  await execPipeline(pipeline, "Redis pipeline failed (writeTournaments)");
};

// --- Series for a tournament (Sorted Set) ---

export const writeTournamentSeries = async (
  tournamentId: string,
  seriesList: FetchedSeries[],
): Promise<void> => {
  const key = REDIS_KEYS.tournamentSeries(tournamentId);
  const existingSeriesIds = await redis
    .zrangebyscore(key, "-inf", "+inf")
    .catch((error) => throwPipelineError(
      `Redis read failed (writeTournamentSeries ${tournamentId})`,
      error,
    ));

  const nextSeriesIds = new Set(seriesList.map((series) => series.id));
  const staleSeriesIds = existingSeriesIds.filter((seriesId) => !nextSeriesIds.has(seriesId));
  const pipeline = redis.pipeline();

  pipeline.del(key);
  deleteSeriesArtifacts(pipeline, staleSeriesIds);

  for (const s of seriesList) {
    const score = new Date(s.startTimeScheduled).getTime();
    pipeline.zadd(key, score, s.id);
    // No TTL — static data, persists until overwritten
    pipeline.set(REDIS_KEYS.series(s.id), JSON.stringify(s));
  }

  await execPipeline(
    pipeline,
    `Redis pipeline failed (writeTournamentSeries ${tournamentId})`,
  );
};

export const deleteTournaments = async (
  tournamentIds: Iterable<string>,
): Promise<void> => {
  const ids = [...new Set(tournamentIds)];
  if (ids.length === 0) return;

  const seriesLists = await Promise.all(
    ids.map((tournamentId) =>
      redis
        .zrangebyscore(REDIS_KEYS.tournamentSeries(tournamentId), "-inf", "+inf")
        .catch((error) => throwPipelineError(
          `Redis read failed (deleteTournaments ${tournamentId})`,
          error,
        )),
    ),
  );

  const pipeline = redis.pipeline();

  ids.forEach((tournamentId, index) => {
    pipeline.del(REDIS_KEYS.tournament(tournamentId));
    pipeline.del(REDIS_KEYS.tournamentSeries(tournamentId));
    deleteSeriesArtifacts(pipeline, seriesLists[index]);
  });

  await execPipeline(pipeline, "Redis pipeline failed (deleteTournaments)");
};

// --- Series state ---

export const writeSeriesState = async (
  seriesId: string,
  state: FetchedSeriesState,
): Promise<void> => {
  if (state.finished) {
    // Finished — static, no TTL
    try {
      await redis.set(REDIS_KEYS.seriesState(seriesId), JSON.stringify(state));
    } catch (error) {
      throwPipelineError(`Redis write failed (seriesState ${seriesId})`, error);
    }
  } else {
    // Live/upcoming — 6h fallback in case worker dies
    try {
      await redis.set(
        REDIS_KEYS.seriesState(seriesId),
        JSON.stringify(state),
        "EX",
        REDIS_TTL.SERIES_STATE_LIVE,
      );
    } catch (error) {
      throwPipelineError(`Redis write failed (seriesState ${seriesId})`, error);
    }
  }
};

export const markSeriesStateFinished = async (
  seriesId: string,
): Promise<boolean> => {
  try {
    const raw = await redis.get(REDIS_KEYS.seriesState(seriesId));
    if (!raw) return false;

    const state = JSON.parse(raw) as FetchedSeriesState;
    state.finished = true;

    // Finished — static, no TTL
    await redis.set(REDIS_KEYS.seriesState(seriesId), JSON.stringify(state));
    return true;
  } catch (error) {
    logError(`Redis markFinished failed (${seriesId})`, error);
    return false;
  }
};

// --- Series metadata ---

export const writeSeriesMeta = async (
  seriesId: string,
  status: string,
): Promise<void> => {
  const pipeline = redis.pipeline();

  pipeline.set(
    REDIS_KEYS.metaSeriesLastRefresh(seriesId),
    String(Date.now()),
    "EX",
    REDIS_TTL.META,
  );
  pipeline.set(
    REDIS_KEYS.metaSeriesStatus(seriesId),
    status,
    "EX",
    REDIS_TTL.META,
  );

  await execPipeline(pipeline, `Redis pipeline failed (writeSeriesMeta ${seriesId})`);
};

// --- Worker heartbeat ---

export const writeHeartbeat = async (): Promise<void> => {
  try {
    await redis.set(
      REDIS_KEYS.metaWorkerHeartbeat,
      String(Date.now()),
      "EX",
      REDIS_TTL.HEARTBEAT,
    );
  } catch (error) {
    throwPipelineError("Redis write failed (heartbeat)", error);
  }
};

// --- Discovery timestamp ---

export const writeDiscoveryTimestamp = async (): Promise<void> => {
  try {
    await redis.set(
      REDIS_KEYS.metaDiscoveryLastRun,
      String(Date.now()),
      "EX",
      REDIS_TTL.META,
    );
  } catch (error) {
    throwPipelineError("Redis write failed (discovery timestamp)", error);
  }
};
