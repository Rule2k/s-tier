import { discoverTournaments, fetchTournamentSeries } from "./grid/central-data";
import { writeTournaments, writeTournamentSeries, writeDiscoveryTimestamp } from "./redis-writer";
import { upsertSeries, getSeriesForTournament } from "./scheduler";
import { logSlowCycle, logError } from "./logger";
import { drainBucket, centralBucket } from "./rate-limiter";
import { config } from "./config";
import redis from "../src/lib/redis/client";
import { REDIS_KEYS } from "../src/shared/redis-keys";
import type { FetchedSeries } from "./types/grid";

// --- State ---

/** Set of tracked tournament IDs discovered so far. */
const trackedTournamentIds = new Set<string>();

/** Tournaments whose series have already been fetched successfully. */
const fullyDiscoveredTournaments = new Set<string>();

// --- Discovery cycle ---

const runDiscoveryCycle = async (): Promise<void> => {
  const start = Date.now();

  try {
    // 1. Discover tournaments via series of tracked teams (server-side filter)
    const tracked = await discoverTournaments(config.teamFilter.teamIds);

    console.log(`[discovery] ${tracked.length} tournaments discovered via team series`);

    // Track discovered IDs
    for (const t of tracked) {
      trackedTournamentIds.add(t.id);
    }

    // 2. Write tournament index to Redis
    await writeTournaments(tracked);

    // 3. For each tracked tournament, fetch its series
    const allSeries: FetchedSeries[] = [];

    for (const tournament of tracked) {
      if (fullyDiscoveredTournaments.has(tournament.id)) continue;
      // Skip if already in scheduler registry (e.g. hydrated from Redis)
      if (getSeriesForTournament(tournament.id).length > 0) {
        fullyDiscoveredTournaments.add(tournament.id);
        continue;
      }

      try {
        const series = await fetchTournamentSeries(tournament.id);
        allSeries.push(...series);

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
        fullyDiscoveredTournaments.add(tournament.id);
      } catch (error) {
        logError(`Failed to fetch series for tournament ${tournament.id}`, error);

        if (isRateLimitError(error)) {
          drainBucket(centralBucket);
          break;
        }
      }
    }

    await writeDiscoveryTimestamp();

    logSlowCycle({
      tournamentIds: tracked.map((t) => t.id),
      entries: [], // Simplified — the log will show tournament count
      durationMs: Date.now() - start,
    });
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

const hydrateSchedulerFromRedis = async (): Promise<void> => {
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

      const tournament = JSON.parse(tournamentJson);

      // Batch-read all series data
      const pipeline = redis.pipeline();
      for (const id of seriesIds) {
        pipeline.get(REDIS_KEYS.series(id));
      }
      const results = await pipeline.exec();
      if (!results) continue;

      for (let i = 0; i < seriesIds.length; i++) {
        const seriesJson = results[i]?.[1] as string | null;
        if (!seriesJson) continue;

        const s = JSON.parse(seriesJson);
        upsertSeries(tournamentId, {
          id: s.id,
          startTimeScheduled: s.startTimeScheduled,
          format: { nameShortened: s.format ?? "Bo1" },
          tournament: {
            id: tournamentId,
            name: tournament.name,
            nameShortened: tournament.nameShortened ?? tournament.name,
            logoUrl: tournament.logoUrl ?? "",
          },
          teams: (s.teams ?? []).map((t: { id: string; name: string; logoUrl?: string }) => ({
            baseInfo: { id: t.id, name: t.name, logoUrl: t.logoUrl ?? "" },
          })),
        });
        totalSeries++;
      }

      trackedTournamentIds.add(tournamentId);
      fullyDiscoveredTournaments.add(tournamentId);
    }

    console.log(`[discovery] Hydrated ${totalSeries} series from ${tournamentIds.length} tournaments in Redis`);
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
  // Hydrate scheduler with existing Redis data (no API calls needed)
  await hydrateSchedulerFromRedis();

  // Initial discovery run
  await runDiscoveryCycle();

  // Then repeat — setTimeout ensures next cycle waits for previous to finish
  scheduleNextDiscovery();
};

export const getTrackedTournamentIds = (): Set<string> => trackedTournamentIds;
