import redis from "../src/lib/redis/client";
import { REDIS_KEYS, REDIS_TTL } from "../src/shared/redis-keys";
import type { FetchedTournament, FetchedSeries, FetchedSeriesState } from "./types/grid";
import { logError } from "./logger";

// --- Tournament index (Sorted Set) ---

export const writeTournaments = async (
  tournaments: FetchedTournament[],
): Promise<void> => {
  if (tournaments.length === 0) return;

  const pipeline = redis.pipeline();

  // Clear and rebuild the sorted set
  pipeline.del(REDIS_KEYS.tournaments);

  for (const t of tournaments) {
    const score = Number(t.id);
    pipeline.zadd(REDIS_KEYS.tournaments, score, t.id);

    pipeline.set(
      REDIS_KEYS.tournament(t.id),
      JSON.stringify(t),
      "EX",
      REDIS_TTL.TOURNAMENT,
    );
  }

  pipeline.expire(REDIS_KEYS.tournaments, REDIS_TTL.TOURNAMENTS);

  await pipeline.exec().catch((err) =>
    logError("Redis pipeline failed (writeTournaments)", err),
  );
};

// --- Series for a tournament (Sorted Set) ---

export const writeTournamentSeries = async (
  tournamentId: string,
  seriesList: FetchedSeries[],
): Promise<void> => {
  if (seriesList.length === 0) return;

  const key = REDIS_KEYS.tournamentSeries(tournamentId);
  const pipeline = redis.pipeline();

  pipeline.del(key);

  for (const s of seriesList) {
    const score = new Date(s.startTimeScheduled).getTime();
    pipeline.zadd(key, score, s.id);

    pipeline.set(
      REDIS_KEYS.series(s.id),
      JSON.stringify(s),
      "EX",
      REDIS_TTL.SERIES_LIVE, // default to shorter TTL; will be extended for finished
    );
  }

  pipeline.expire(key, REDIS_TTL.TOURNAMENT_SERIES);

  await pipeline.exec().catch((err) =>
    logError(`Redis pipeline failed (writeTournamentSeries ${tournamentId})`, err),
  );
};

// --- Series state ---

export const writeSeriesState = async (
  seriesId: string,
  state: FetchedSeriesState,
): Promise<void> => {
  const ttl = state.finished ? REDIS_TTL.SERIES_STATE_FINISHED : REDIS_TTL.SERIES_STATE_LIVE;

  await redis
    .set(REDIS_KEYS.seriesState(seriesId), JSON.stringify(state), "EX", ttl)
    .catch((err) => logError(`Redis write failed (seriesState ${seriesId})`, err));
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

  await pipeline.exec().catch((err) =>
    logError(`Redis pipeline failed (writeSeriesMeta ${seriesId})`, err),
  );
};

// --- Worker heartbeat ---

export const writeHeartbeat = async (): Promise<void> => {
  await redis
    .set(REDIS_KEYS.metaWorkerHeartbeat, String(Date.now()), "EX", REDIS_TTL.HEARTBEAT)
    .catch((err) => logError("Redis write failed (heartbeat)", err));
};

// --- Discovery timestamp ---

export const writeDiscoveryTimestamp = async (): Promise<void> => {
  await redis
    .set(REDIS_KEYS.metaDiscoveryLastRun, String(Date.now()), "EX", REDIS_TTL.META)
    .catch((err) => logError("Redis write failed (discovery timestamp)", err));
};
