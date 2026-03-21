import { discoverTournaments, fetchTournamentSeries } from "./grid/central-data";
import {
  writeTournaments,
  writeTournamentSeries,
  writeDiscoveryTimestamp,
  deleteTournaments,
} from "./redis-writer";
import {
  upsertSeries,
  getRegistry,
  getSeriesForTournament,
  removeSeriesNotIn,
} from "./scheduler";
import { logError } from "./logger";
import {
  cleanupPerSeriesBuckets,
  drainBucket,
  centralBucket,
} from "./rate-limiter";
import { config } from "./config";
import redis from "../src/lib/redis/client";
import { REDIS_KEYS } from "../src/shared/redis-keys";
import type { FetchedSeries } from "./types/grid";
import type { Series as StoredSeries } from "../src/shared/types/series";
import type { SeriesState as StoredSeriesState } from "../src/shared/types/series-state";
import type { Tournament as StoredTournament } from "../src/shared/types/tournament";

// --- State ---

/** Set of tracked tournament IDs discovered so far. */
const trackedTournamentIds = new Set<string>();

// --- Discovery cycle ---

const parseJson = <T>(value: string): T => JSON.parse(value) as T;

const syncTrackedTournamentIds = (nextTournamentIds: Iterable<string>) => {
  trackedTournamentIds.clear();
  for (const tournamentId of nextTournamentIds) {
    trackedTournamentIds.add(tournamentId);
  }
};

export const runDiscoveryCycle = async (): Promise<void> => {
  const start = Date.now();

  try {
    const previousTournamentIds = await redis.zrangebyscore(
      REDIS_KEYS.tournaments,
      "-inf",
      "+inf",
    );

    // 1. Discover tournaments via series of tracked teams (server-side filter)
    const tracked = await discoverTournaments(config.teamFilter.teamIds);
    const trackedTournamentIdSet = new Set(tracked.map((tournament) => tournament.id));

    console.log(`[discovery] ${tracked.length} tournaments discovered via team series`);

    syncTrackedTournamentIds(trackedTournamentIdSet);

    // 2. Write tournament index to Redis
    await writeTournaments(tracked);

    // 3. For each tracked tournament, fetch its series
    const allSeries: FetchedSeries[] = [];
    const processedTournamentIds = new Set<string>();
    const nextRegistrySeriesIds = new Set<string>();
    let fetchErrors = 0;

    let skippedFinished = 0;

    for (const tournament of tracked) {
      try {
        // Skip re-fetching tournaments where all series are done
        // A series is "done" if finished via state OR scheduled >24h ago with no state
        const existingSeries = getSeriesForTournament(tournament.id);
        const now = Date.now();
        const isSeriesDone = (e: typeof existingSeries[number]) => {
          if (e.state?.finished) return true;
          if (e.state?.started) return false; // live — not done
          const scheduled = new Date(e.gridSeries.startTimeScheduled).getTime();
          return now - scheduled > 24 * 60 * 60 * 1000;
        };
        if (
          existingSeries.length > 0 &&
          existingSeries.every(isSeriesDone)
        ) {
          skippedFinished++;
          processedTournamentIds.add(tournament.id);
          for (const entry of existingSeries) {
            nextRegistrySeriesIds.add(entry.seriesId);
          }
          continue;
        }

        const series = await fetchTournamentSeries(tournament.id);
        processedTournamentIds.add(tournament.id);
        allSeries.push(...series);
        for (const s of series) {
          nextRegistrySeriesIds.add(s.id);
        }

        // Register each series in the scheduler
        for (const s of series) {
          upsertSeries(tournament.id, {
            id: s.id,
            startTimeScheduled: s.startTimeScheduled,
            format: { nameShortened: s.format },
            tournament: {
              id: tournament.id,
              name: tournament.name,
              nameShortened: tournament.nameShortened,
              logoUrl: tournament.logoUrl ?? "",
            },
            teams: s.teams.map((t) => ({
              baseInfo: { id: t.id, name: t.name, logoUrl: t.logoUrl ?? "" },
            })),
          });
        }

        // Write series for this tournament to Redis
        await writeTournamentSeries(tournament.id, series);
      } catch (error) {
        fetchErrors++;
        processedTournamentIds.add(tournament.id);
        for (const entry of getSeriesForTournament(tournament.id)) {
          nextRegistrySeriesIds.add(entry.seriesId);
        }

        if (isRateLimitError(error)) {
          console.log(
            `[discovery] Rate limited — pausing series fetch (${processedTournamentIds.size}/${tracked.length} tournaments attempted)`,
          );
          drainBucket(centralBucket);
          break;
        }
        logError(`Failed to fetch series for tournament ${tournament.id}`, error);
      }
    }

    for (const tournament of tracked) {
      if (processedTournamentIds.has(tournament.id)) continue;
      for (const entry of getSeriesForTournament(tournament.id)) {
        nextRegistrySeriesIds.add(entry.seriesId);
      }
    }

    const staleTournamentIds = previousTournamentIds.filter(
      (tournamentId) => !trackedTournamentIdSet.has(tournamentId),
    );
    await deleteTournaments(staleTournamentIds);

    const removedSeries = removeSeriesNotIn(nextRegistrySeriesIds);
    cleanupPerSeriesBuckets(nextRegistrySeriesIds);

    await writeDiscoveryTimestamp();

    const duration = ((Date.now() - start) / 1000).toFixed(1);
    console.log(
      `[discovery] Done in ${duration}s — ${tracked.length} tournaments indexed (${skippedFinished} fully finished, skipped), ${allSeries.length} series fetched, ${staleTournamentIds.length} stale tournaments removed, ${removedSeries} registry series pruned, ${fetchErrors} fetch errors`,
    );
  } catch (error) {
    logError("Discovery cycle failed", error);

    if (isRateLimitError(error)) {
      drainBucket(centralBucket);
    }
  }
};

// --- Helpers ---

const isRateLimitError = (error: unknown): boolean => {
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    return msg.includes("429")
      || msg.includes("too many requests")
      || msg.includes("rate limit")
      || msg.includes("enhance_your_calm");
  }
  return false;
};

// --- Hydrate scheduler from Redis on startup ---

const mapStoredSeriesStateToRegistryState = (
  state: StoredSeriesState,
) => ({
  id: state.seriesId,
  started: state.started,
  finished: state.finished,
  teams: state.teams,
  games: state.games.map((game) => ({
    sequenceNumber: game.sequenceNumber,
    started: game.started,
    finished: game.finished,
    map: { name: game.mapName },
    teams: game.teams.map((team) => ({ score: team.score, side: team.side })),
  })),
});

export const hydrateSchedulerFromRedis = async (): Promise<void> => {
  try {
    const tournamentIds = await redis.zrevrangebyscore(
      REDIS_KEYS.tournaments, "+inf", "-inf", "LIMIT", 0, 200,
    );

    if (tournamentIds.length === 0) return;

    let totalSeries = 0;

    for (const tournamentId of tournamentIds) {
      const [tournamentJson, seriesIds] = await Promise.all([
        redis.get(REDIS_KEYS.tournament(tournamentId)),
        redis.zrangebyscore(REDIS_KEYS.tournamentSeries(tournamentId), "-inf", "+inf"),
      ]);

      if (!tournamentJson || seriesIds.length === 0) continue;

      const tournament = parseJson<StoredTournament>(tournamentJson);

      // Batch-read all series data + states
      const pipeline = redis.pipeline();
      for (const id of seriesIds) {
        pipeline.get(REDIS_KEYS.series(id));
        pipeline.get(REDIS_KEYS.seriesState(id));
      }
      const results = await pipeline.exec();
      if (!results) continue;

      for (let i = 0; i < seriesIds.length; i++) {
        const seriesJson = results[i * 2]?.[1] as string | null;
        const stateJson = results[i * 2 + 1]?.[1] as string | null;
        if (!seriesJson) continue;

        const s = parseJson<StoredSeries>(seriesJson);
        const entry = upsertSeries(tournamentId, {
          id: s.id,
          startTimeScheduled: s.startTimeScheduled,
          format: { nameShortened: s.format ?? "Bo1" },
          tournament: {
            id: tournamentId,
            name: tournament.name,
            nameShortened: tournament.nameShortened ?? tournament.name,
            logoUrl: tournament.logoUrl ?? "",
          },
          teams: (s.teams ?? []).map((t) => ({
            baseInfo: { id: t.id, name: t.name, logoUrl: t.logoUrl ?? "" },
          })),
        });

        // Restore state so live/finished series get correct priority
        if (stateJson) {
          const state = parseJson<StoredSeriesState>(stateJson);
          entry.state = mapStoredSeriesStateToRegistryState(state);
          // Live series: lastFetchedAt = 0 so they refresh immediately
          // Finished series: lastFetchedAt = now (no rush to re-fetch)
          if (state.finished) {
            entry.lastFetchedAt = Date.now();
          }
        }

        totalSeries++;
      }

      trackedTournamentIds.add(tournamentId);
    }

    // Count states
    let withState = 0;
    let finished = 0;
    let live = 0;
    for (const entry of getRegistry().values()) {
      if (entry.state) {
        withState++;
        if (entry.state.finished) finished++;
        if (entry.state.started && !entry.state.finished) live++;
      }
    }
    console.log(`[discovery] Hydrated ${totalSeries} series from ${tournamentIds.length} tournaments — ${withState} with state (${finished} finished, ${live} live, ${totalSeries - withState} without state)`);
  } catch (error) {
    logError("Failed to hydrate scheduler from Redis", error);
  }
};

// --- Public ---

const scheduleNextDiscovery = () => {
  setTimeout(async () => {
    await runDiscoveryCycle().catch((err) => logError("Discovery loop unhandled error", err));
    scheduleNextDiscovery();
  }, config.discovery.intervalMs);
};

export const startDiscoveryLoop = async (): Promise<void> => {
  // Initial discovery run
  await runDiscoveryCycle();

  // Then repeat — setTimeout ensures next cycle waits for previous to finish
  scheduleNextDiscovery();
};

export const getTrackedTournamentIds = (): Set<string> => trackedTournamentIds;
