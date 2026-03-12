import { getTokenCount, centralBucket, liveGlobalBucket } from "./rate-limiter";
import type { TierCounts } from "./scheduler";

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
      ` — budget: ${liveBudget}/162 live, ${centralBudget}/18 central`,
  );
};

interface SlowCycleStats {
  tournamentIds: string[];
  totalSeries: number;
  tierCounts: TierCounts;
  durationMs: number;
}

export const logSlowCycle = (stats: SlowCycleStats): void => {
  const { tournamentIds, totalSeries, tierCounts, durationMs } = stats;
  const duration = (durationMs / 1000).toFixed(1);
  const ids = tournamentIds.join(", ");

  console.log(
    `[worker:slow] Refreshed tournaments [${ids}] in ${duration}s` +
      ` — ${totalSeries} series` +
      ` (${tierCounts.P0} running, ${tierCounts.P1 + tierCounts.P2} upcoming, ${tierCounts.SKIP} finished)`,
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
