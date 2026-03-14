import { fetchTournaments, fetchTournamentSeries } from "./grid/central-data";
import { isPrestigious } from "./prestige";
import { writeTournaments, writeTournamentSeries, writeDiscoveryTimestamp } from "./redis-writer";
import { upsertSeries } from "./scheduler";
import { logSlowCycle, logError } from "./logger";
import { drainBucket, centralBucket } from "./rate-limiter";
import { config } from "./config";
import type { FetchedSeries } from "./types/grid";

// --- State ---

/** Set of prestigious tournament IDs discovered so far. */
const prestigiousTournamentIds = new Set<string>();

// --- Discovery cycle ---

const runDiscoveryCycle = async (): Promise<void> => {
  const start = Date.now();

  try {
    // 1. Fetch all CS2 tournaments (paginated)
    const allTournaments = await fetchTournaments();

    // 2. Filter by prestige
    const prestigious = allTournaments.filter(isPrestigious);

    // Track discovered IDs
    for (const t of prestigious) {
      prestigiousTournamentIds.add(t.id);
    }

    // 3. Write tournament index to Redis
    await writeTournaments(prestigious);

    // 4. For each prestigious tournament, fetch its series
    const allSeries: FetchedSeries[] = [];

    for (const tournament of prestigious) {
      try {
        const series = await fetchTournamentSeries(tournament.id);
        allSeries.push(...series);

        // Register each series in the scheduler
        for (const s of series) {
          // Adapt FetchedSeries to the GridSeries shape expected by scheduler
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
              baseInfo: { id: t.id, name: t.name, logoUrl: "" },
            })),
          });
        }

        // Write series for this tournament to Redis
        await writeTournamentSeries(tournament.id, series);
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
      tournamentIds: prestigious.map((t) => t.id),
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

// --- Public ---

export const startDiscoveryLoop = async (): Promise<void> => {
  // Initial run
  await runDiscoveryCycle();

  // Then repeat
  setInterval(() => {
    runDiscoveryCycle().catch((err) => logError("Discovery loop unhandled error", err));
  }, config.discovery.intervalMs);
};

export const getPrestigiousTournamentIds = (): Set<string> => prestigiousTournamentIds;
