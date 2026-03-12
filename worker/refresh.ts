import redis from "../src/lib/redis/client";
import { CACHE_KEYS, CACHE_TTL, getTournamentTtl } from "../src/lib/redis/keys";
import { TOURNAMENT_IDS } from "../src/config/tournaments";
import { fetchTournamentSeries } from "../src/lib/grid/fetchTournamentSeries";
import { fetchSeriesState } from "../src/lib/grid/fetchSeriesStates";
import type { GridSeries } from "../src/lib/grid/types/series";
import type { TournamentSummary } from "../src/types/match";
import {
  centralBucket,
  liveGlobalBucket,
  getLivePerSeriesBucket,
  waitForToken,
  drainBucket,
  cleanupPerSeriesBuckets,
} from "./rate-limiter";
import {
  upsertSeries,
  getEligibleSeries,
  getSeriesForTournament,
  getRegistry,
  classifyTier,
} from "./scheduler";
import { rebuildTournament, rebuildTournamentSummary } from "./tournament-rebuilder";
import { logFastCycle, logSlowCycle, logWorkerStart, logError } from "./logger";

// --- Constants ---

const FAST_LOOP_INTERVAL = 15_000;  // 15s
const SLOW_LOOP_INTERVAL = 5 * 60_000; // 5 min
const MAX_TOURNAMENTS_PER_SLOW_CYCLE = 4;

// --- Tournament tracking ---

// Tracks which tournaments have been fetched at least once
const fetchedTournaments = new Set<string>();

// Tracks which tournaments are "active" (have running/upcoming series)
const activeTournaments = new Set<string>();

const isActiveTournament = (tournamentId: string): boolean => {
  const entries = getSeriesForTournament(tournamentId);
  return entries.some((e) => {
    const tier = classifyTier(e.state, e.gridSeries.startTimeScheduled);
    return tier !== "SKIP";
  });
};

// --- Slow loop: Central Data ---

let slowCycleNumber = 0;

const selectTournamentsToRefresh = (): string[] => {
  const toRefresh: string[] = [];

  // Priority 1: Active tournaments (always refresh)
  for (const id of TOURNAMENT_IDS) {
    if (activeTournaments.has(id)) {
      toRefresh.push(id);
    }
  }

  // Priority 2: Never-fetched tournaments (cold start)
  if (toRefresh.length < MAX_TOURNAMENTS_PER_SLOW_CYCLE) {
    for (const id of TOURNAMENT_IDS) {
      if (toRefresh.length >= MAX_TOURNAMENTS_PER_SLOW_CYCLE) break;
      if (!fetchedTournaments.has(id) && !toRefresh.includes(id)) {
        toRefresh.push(id);
      }
    }
  }

  return toRefresh.slice(0, MAX_TOURNAMENTS_PER_SLOW_CYCLE);
};

const fetchTournamentWithRateLimit = async (
  tournamentId: string,
): Promise<GridSeries[]> => {
  // fetchTournamentSeries is paginated — we rate-limit each page
  // We wrap it by consuming a token before the call
  // Since fetchTournamentSeries handles pagination internally,
  // we consume one token per call (most tournaments fit in 1-2 pages)
  await waitForToken(centralBucket);
  return fetchTournamentSeries(tournamentId);
};

const slowLoop = async () => {
  slowCycleNumber++;
  const start = Date.now();

  try {
    const tournamentIds = selectTournamentsToRefresh();
    if (tournamentIds.length === 0) return;

    const allActiveSeriesIds = new Set<string>();

    for (const tournamentId of tournamentIds) {
      try {
        const gridSeriesList = await fetchTournamentWithRateLimit(tournamentId);

        // Register all series in the scheduler
        for (const gs of gridSeriesList) {
          upsertSeries(tournamentId, gs);
          allActiveSeriesIds.add(gs.id);
        }

        fetchedTournaments.add(tournamentId);

        // Update active status
        if (isActiveTournament(tournamentId)) {
          activeTournaments.add(tournamentId);
        } else {
          activeTournaments.delete(tournamentId);
        }
      } catch (error) {
        logError(`Failed to fetch Central Data for tournament ${tournamentId}`, error);

        if (isRateLimitError(error)) {
          drainBucket(centralBucket);
          break; // Stop fetching more tournaments this cycle
        }
      }
    }

    // Rebuild tournament index from all fetched tournaments
    const summaries: TournamentSummary[] = [];
    for (const id of fetchedTournaments) {
      const summary = rebuildTournamentSummary(id);
      if (summary) summaries.push(summary);
    }

    if (summaries.length > 0) {
      await redis
        .set(
          CACHE_KEYS.TOURNAMENTS_INDEX,
          JSON.stringify(summaries),
          "EX",
          CACHE_TTL.INDEX,
        )
        .catch((err) => logError("Redis write failed for tournament index", err));
    }

    logSlowCycle({
      tournamentIds,
      entries: [...getRegistry().values()],
      durationMs: Date.now() - start,
    });

  } catch (error) {
    logError(`Slow loop cycle #${slowCycleNumber} failed`, error);
  }
};

// --- Fast loop: Series State ---

let fastCycleNumber = 0;

const fastLoop = async () => {
  fastCycleNumber++;
  const start = Date.now();

  const fetched: Record<string, number> = { P0: 0, P1: 0, P2: 0, P3: 0 };
  const eligible: Record<string, number> = { P0: 0, P1: 0, P2: 0, P3: 0 };
  const affectedTournaments = new Set<string>();

  try {
    const series = getEligibleSeries();

    for (const { tier } of series) {
      eligible[tier]++;
    }

    for (const { entry, tier } of series) {
      // Rate limit: global + per-series
      try {
        await waitForToken(liveGlobalBucket);
        await waitForToken(getLivePerSeriesBucket(entry.seriesId));
      } catch {
        // Budget exhausted — stop this cycle, remaining will be picked up next cycle
        break;
      }

      try {
        const state = await fetchSeriesState(entry.seriesId);

        if (state) {
          entry.state = state;
          entry.lastFetchedAt = Date.now();
          entry.failCount = 0;
          fetched[tier]++;

          // Write series state to Redis
          const ttl = getSeriesStateTtl(state, entry.gridSeries.startTimeScheduled);
          await redis
            .set(
              CACHE_KEYS.seriesState(entry.seriesId),
              JSON.stringify(state),
              "EX",
              ttl,
            )
            .catch((err) =>
              logError(`Redis write failed for series ${entry.seriesId}`, err),
            );

          affectedTournaments.add(entry.tournamentId);
        } else {
          entry.failCount++;
          entry.lastFetchedAt = Date.now();
        }
      } catch (error) {
        entry.failCount++;
        entry.lastFetchedAt = Date.now();

        if (isRateLimitError(error)) {
          drainBucket(liveGlobalBucket);
          break;
        }
      }
    }

    // Rebuild affected tournaments in Redis
    for (const tournamentId of affectedTournaments) {
      const tournament = rebuildTournament(tournamentId);
      if (tournament) {
        const ttl = getTournamentTtl(tournament);
        await redis
          .set(
            CACHE_KEYS.tournamentById(tournamentId),
            JSON.stringify(tournament),
            "EX",
            ttl,
          )
          .catch((err) =>
            logError(`Redis write failed for tournament ${tournamentId}`, err),
          );
      }
    }

    // Cleanup per-series buckets for finished/removed series
    const activeIds = new Set<string>();
    for (const entry of getRegistry().values()) {
      if (!entry.state?.finished) activeIds.add(entry.seriesId);
    }
    cleanupPerSeriesBuckets(activeIds);

    logFastCycle({
      cycleNumber: fastCycleNumber,
      durationMs: Date.now() - start,
      fetched: fetched as { P0: number; P1: number; P2: number; P3: number },
      eligible: eligible as { P0: number; P1: number; P2: number; P3: number },
    });

  } catch (error) {
    logError(`Fast loop cycle #${fastCycleNumber} failed`, error);
  }
};

// --- TTL helpers ---

const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

const getSeriesStateTtl = (
  state: { started: boolean; finished: boolean },
  scheduledAt: string,
): number => {
  if (state.finished) return CACHE_TTL.SERIES_STATE_FINISHED;
  if (state.started) return CACHE_TTL.SERIES_STATE_LIVE;

  const timeUntil = new Date(scheduledAt).getTime() - Date.now();
  if (timeUntil <= TWENTY_FOUR_HOURS_MS) return CACHE_TTL.SERIES_STATE_UPCOMING_SOON;
  return CACHE_TTL.SERIES_STATE_UPCOMING_FAR;
};

// --- Error helpers ---

const isRateLimitError = (error: unknown): boolean => {
  if (error instanceof Error) {
    return error.message.includes("429") || error.message.includes("Too Many Requests");
  }
  return false;
};

// --- Main ---

const run = async () => {
  logWorkerStart();

  // Initial slow loop to populate data
  await slowLoop();

  // Start dual loops
  setInterval(slowLoop, SLOW_LOOP_INTERVAL);

  // Fast loop: run immediately then every 15s
  await fastLoop();
  setInterval(fastLoop, FAST_LOOP_INTERVAL);
};

run().catch((error) => {
  console.error("[worker] Fatal startup error:", error);
  process.exit(1);
});
