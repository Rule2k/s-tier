import redis from "../src/lib/redis/client";
import { CACHE_KEYS, CACHE_TTL, getTournamentTtl } from "../src/lib/redis/keys";
import { TOURNAMENT_IDS } from "../src/config/tournaments";
import {
  fetchTournamentSeries,
  fetchSeriesState,
  buildTournament,
  buildTournamentSummary,
} from "../src/lib/grid/fetchTournaments";
import type { GridSeriesState } from "../src/lib/grid/types/seriesState";
import type { TournamentSummary } from "../src/types/match";

const REFRESH_INTERVAL = 60_000; // 60 seconds
const MAX_STATE_FETCHES_PER_CYCLE = 100;
const ONE_HOUR_MS = 60 * 60 * 1000;

const refreshTournaments = async () => {
  try {
    // Phase 1 — Fetch series index from Grid Central (parallel)
    const results = await Promise.all(
      TOURNAMENT_IDS.map(async (id) => ({
        id,
        series: await fetchTournamentSeries(id),
      })),
    );

    const tournamentIndex: TournamentSummary[] = [];
    const allTournamentSeries = new Map<
      string,
      Awaited<ReturnType<typeof fetchTournamentSeries>>
    >();

    for (const { id, series } of results) {
      allTournamentSeries.set(id, series);
      const summary = buildTournamentSummary(id, series);
      if (summary) tournamentIndex.push(summary);
    }

    await redis.set(
      CACHE_KEYS.TOURNAMENTS_INDEX,
      JSON.stringify(tournamentIndex),
      "EX",
      CACHE_TTL.INDEX,
    );
    console.log(
      `[worker] Cached index (${tournamentIndex.length} tournaments)`,
    );

    // Phase 2 — Collect candidates and fetch states in parallel
    const now = Date.now();

    // Per-tournament state maps (needed for Phase 3)
    const tournamentStates = new Map<string, Map<string, GridSeriesState>>();

    // First pass: check caches, collect candidates needing API fetch
    type Candidate = {
      tournamentId: string;
      gs: Awaited<ReturnType<typeof fetchTournamentSeries>>[number];
    };
    const candidates: Candidate[] = [];

    for (const [tournamentId, gridSeriesList] of allTournamentSeries) {
      const seriesStates = new Map<string, GridSeriesState>();
      tournamentStates.set(tournamentId, seriesStates);

      for (const gs of gridSeriesList) {
        const scheduledTime = new Date(gs.startTimeScheduled).getTime();
        if (scheduledTime > now + ONE_HOUR_MS) continue;

        const cachedRaw = await redis.get(CACHE_KEYS.matchState(gs.id));
        if (cachedRaw) {
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
    for (const { tournamentId, gs, state } of fetched) {
      const seriesStates = tournamentStates.get(tournamentId)!;
      const teams = gs.teams
        .map((t) => t.baseInfo.nameShortened || t.baseInfo.name)
        .join(" vs ");

      if (state) {
        const status = state.finished
          ? "finished"
          : state.started
            ? "running"
            : "not_started";
        console.log(`[worker]   ${teams} (${gs.id}): ${status}`);
        seriesStates.set(gs.id, state);
        const ttl = state.finished
          ? CACHE_TTL.MATCH_FINISHED
          : CACHE_TTL.MATCH_RUNNING;
        await redis.set(
          CACHE_KEYS.matchState(gs.id),
          JSON.stringify(state),
          "EX",
          ttl,
        );
      } else {
        console.warn(
          `[worker]   ${teams} (${gs.id}): state fetch returned null`,
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

    console.log(
      `[worker] Cached ${allTournamentSeries.size} tournaments (${toFetch.length} state fetches)`,
    );
  } catch (error) {
    console.error("[worker] Refresh failed:", error);
  }
};

// Run immediately on startup, then every minute
refreshTournaments();
setInterval(refreshTournaments, REFRESH_INTERVAL);
console.log(`[worker] Started — refreshing every ${REFRESH_INTERVAL / 1000}s`);
