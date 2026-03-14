import { getTokenCount, centralBucket, liveGlobalBucket } from "./rate-limiter";
import type { SeriesEntry } from "./types/scheduler";

interface FastCycleStats {
  cycleNumber: number;
  durationMs: number;
  fetched: { P0: number; P1: number; P2: number; P3: number };
  eligible: { P0: number; P1: number; P2: number; P3: number };
}

export const logFastCycle = (stats: FastCycleStats): void => {
  const { cycleNumber, durationMs, fetched, eligible } = stats;
  const duration = (durationMs / 1000).toFixed(1);
  const liveBudget = getTokenCount(liveGlobalBucket);
  const centralBudget = getTokenCount(centralBucket);

  console.log(
    `[worker:fast] Cycle #${cycleNumber} in ${duration}s` +
      ` — P0: ${fetched.P0}/${eligible.P0}` +
      `, P1: ${fetched.P1}/${eligible.P1}` +
      `, P2: ${fetched.P2}/${eligible.P2}` +
      `, P3: ${fetched.P3}/${eligible.P3}` +
      ` — budget: ${liveBudget}/180 live, ${centralBudget}/20 central`,
  );
};

interface SlowCycleStats {
  tournamentIds: string[];
  entries: SeriesEntry[];
  durationMs: number;
}

const countSeriesStates = (entries: SeriesEntry[]) => {
  let running = 0;
  let upcoming = 0;
  let finished = 0;
  let pending = 0;

  for (const entry of entries) {
    if (!entry.state) { pending++; continue; }
    if (entry.state.finished) { finished++; continue; }
    if (entry.state.started) { running++; continue; }
    upcoming++;
  }

  return { running, upcoming, finished, pending };
};

export const logSlowCycle = (stats: SlowCycleStats): void => {
  const { tournamentIds, entries, durationMs } = stats;
  const duration = (durationMs / 1000).toFixed(1);
  const ids = tournamentIds.join(", ");
  const { running, upcoming, finished, pending } = countSeriesStates(entries);

  console.log(
    `[worker:slow] Refreshed tournaments [${ids}] in ${duration}s` +
      ` — ${entries.length} series` +
      ` (${running} running, ${upcoming} upcoming, ${finished} finished, ${pending} pending)`,
  );
};

export const logWorkerStart = (): void => {
  console.log(
    `[worker] Started — fast loop: 15s, slow loop: 5min`,
  );
};

export const logError = (context: string, error: unknown): void => {
  console.error(`[worker] ${context}:`, error);
};
