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
    // Phase 1 — Fetch series index from Grid Central for each tournament
    const tournamentIndex: TournamentSummary[] = [];
    const allTournamentSeries = new Map<
      string,
      Awaited<ReturnType<typeof fetchTournamentSeries>>
    >();

    for (const tournamentId of TOURNAMENT_IDS) {
      const gridSeries = await fetchTournamentSeries(tournamentId);
      allTournamentSeries.set(tournamentId, gridSeries);

      const summary = buildTournamentSummary(tournamentId, gridSeries);
      if (summary) tournamentIndex.push(summary);
    }

    await redis.set(
      CACHE_KEYS.TOURNAMENT_INDEX,
      JSON.stringify(tournamentIndex),
      "EX",
      CACHE_TTL.INDEX,
    );
    console.log(
      `[worker] Cached index (${tournamentIndex.length} tournaments)`,
    );

    // Phase 2 — Fetch seriesState progressively (max ~100 per cycle)
    const now = Date.now();
    let stateFetchCount = 0;

    for (const [tournamentId, gridSeriesList] of allTournamentSeries) {
      const seriesStates = new Map<string, GridSeriesState>();

      for (const gs of gridSeriesList) {
        const scheduledTime = new Date(gs.startTimeScheduled).getTime();

        // Skip matches more than 1 hour in the future — unlikely to have started
        if (scheduledTime > now + ONE_HOUR_MS) continue;

        // Check if we already have a finished state cached
        const cachedRaw = await redis.get(CACHE_KEYS.matchState(gs.id));
        if (cachedRaw) {
          const cached: GridSeriesState = JSON.parse(cachedRaw);
          seriesStates.set(gs.id, cached);
          // Skip re-fetching if already finished
          if (cached.finished) continue;
        }

        // Budget check
        if (stateFetchCount >= MAX_STATE_FETCHES_PER_CYCLE) continue;

        const state = await fetchSeriesState(gs.id);
        stateFetchCount++;

        if (state) {
          const status = state.finished ? "finished" : state.started ? "running" : "not_started";
          const teams = gs.teams.map((t) => t.baseInfo.nameShortened || t.baseInfo.name).join(" vs ");
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
          const teams = gs.teams.map((t) => t.baseInfo.nameShortened || t.baseInfo.name).join(" vs ");
          console.warn(`[worker]   ${teams} (${gs.id}): state fetch returned null`);
        }
      }

      // Phase 3 — Build and store complete tournament
      const first = gridSeriesList[0];
      if (!first) continue;

      const tournament = buildTournament(
        tournamentId,
        first.tournament.name,
        first.tournament.logoUrl || null,
        gridSeriesList,
        seriesStates,
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
      `[worker] Cached ${allTournamentSeries.size} tournaments (${stateFetchCount} state fetches)`,
    );
  } catch (error) {
    console.error("[worker] Refresh failed:", error);
  }
};

// Run immediately on startup, then every minute
refreshTournaments();
setInterval(refreshTournaments, REFRESH_INTERVAL);
console.log(
  `[worker] Started — refreshing every ${REFRESH_INTERVAL / 1000}s`,
);
