import redis from "../src/lib/redis/client";
import { CACHE_KEYS, CACHE_TTL, getTournamentTtl } from "../src/lib/redis/keys";
import { TOURNAMENT_IDS } from "../src/config/tournaments";
import {
  fetchSeriesState,
  buildTournament,
} from "../src/lib/grid/fetchTournaments";
import type { GridSeries } from "../src/lib/grid/types/series";
import { fetchTournamentSeriesIndex } from "../src/lib/tournaments/fetchTournamentSeriesIndex";
import type { GridSeriesState } from "../src/lib/grid/types/seriesState";

const REFRESH_INTERVAL = 60_000; // 60 seconds
const MAX_STATE_FETCHES_PER_CYCLE = 100;
const ONE_HOUR_MS = 60 * 60 * 1000;

const refreshTournaments = async () => {
  const cycleStart = Date.now();
  try {
    const {
      summaries: tournamentIndex,
      seriesByTournamentId: allTournamentSeries,
    } = await fetchTournamentSeriesIndex(TOURNAMENT_IDS);

    await redis.set(
      CACHE_KEYS.TOURNAMENTS_INDEX,
      JSON.stringify(tournamentIndex),
      "EX",
      CACHE_TTL.INDEX,
    );

    // Phase 2 — Collect candidates and fetch states in parallel
    const now = Date.now();

    // Per-tournament state maps (needed for Phase 3)
    const tournamentStates = new Map<string, Map<string, GridSeriesState>>();

    // First pass: check caches, collect candidates needing API fetch
    type Candidate = {
      tournamentId: string;
      gs: GridSeries;
    };
    const candidates: Candidate[] = [];

    for (const [tournamentId, gridSeriesList] of allTournamentSeries) {
      const seriesStates = new Map<string, GridSeriesState>();
      tournamentStates.set(tournamentId, seriesStates);

      for (const gs of gridSeriesList) {
        const cachedRaw = await redis.get(CACHE_KEYS.matchState(gs.id));
        if (cachedRaw) {
          if (cachedRaw === "pending") continue;
          const cached: GridSeriesState = JSON.parse(cachedRaw);
          seriesStates.set(gs.id, cached);
          if (cached.finished) continue;
        }

        candidates.push({ tournamentId, gs });
      }
    }

    // Fetch all states in parallel (respecting budget)
    const toFetch = candidates.slice(0, MAX_STATE_FETCHES_PER_CYCLE);
    const fetched = await Promise.all(
      toFetch.map(async ({ tournamentId, gs }) => {
        const state = await fetchSeriesState(gs.id);
        return { tournamentId, gs, state };
      }),
    );

    // Process results
    const statusCounts = { running: 0, upcoming: 0, finished: 0, failed: 0 };

    for (const { tournamentId, gs, state } of fetched) {
      const seriesStates = tournamentStates.get(tournamentId)!;

      if (state) {
        seriesStates.set(gs.id, state);
        const scheduledTime = new Date(gs.startTimeScheduled).getTime();
        const ttl = state.finished
          ? CACHE_TTL.MATCH_FINISHED
          : scheduledTime > now + ONE_HOUR_MS
            ? CACHE_TTL.MATCH_UPCOMING
            : CACHE_TTL.MATCH_RUNNING;

        if (state.finished) statusCounts.finished++;
        else if (state.started) statusCounts.running++;
        else statusCounts.upcoming++;

        await redis.set(
          CACHE_KEYS.matchState(gs.id),
          JSON.stringify(state),
          "EX",
          ttl,
        );
      } else {
        statusCounts.upcoming++;
        await redis.set(
          CACHE_KEYS.matchState(gs.id),
          "pending",
          "EX",
          CACHE_TTL.MATCH_UPCOMING,
        );
      }
    }

    // Phase 3 — Build and store complete tournaments
    for (const [tournamentId, gridSeriesList] of allTournamentSeries) {
      const first = gridSeriesList[0];
      if (!first) continue;

      const tournament = buildTournament(
        tournamentId,
        first.tournament.name,
        first.tournament.logoUrl || null,
        gridSeriesList,
        tournamentStates.get(tournamentId)!,
      );

      const ttl = getTournamentTtl(tournament);
      await redis.set(
        CACHE_KEYS.tournamentById(tournamentId),
        JSON.stringify(tournament),
        "EX",
        ttl,
      );
    }

    if (candidates.length > MAX_STATE_FETCHES_PER_CYCLE) {
      console.warn(
        `[worker] Budget exceeded: ${candidates.length} candidates, capped at ${MAX_STATE_FETCHES_PER_CYCLE}`,
      );
    }

    const duration = ((Date.now() - cycleStart) / 1000).toFixed(1);
    const { running, upcoming, finished, failed } = statusCounts;
    console.log(
      `[worker] Cycle done in ${duration}s — central ${allTournamentSeries.size}/20, live ${toFetch.length}/180 (${running} running, ${upcoming} upcoming, ${finished} finished, ${failed} failed)`,
    );
  } catch (error) {
    console.error("[worker] Refresh failed:", error);
  }
};

// Run immediately on startup, then every minute
refreshTournaments();
setInterval(refreshTournaments, REFRESH_INTERVAL);
console.log(`[worker] Started — refreshing every ${REFRESH_INTERVAL / 1000}s`);
