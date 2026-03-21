import {
  getTotalConsumed,
  centralBucket,
  liveGlobalBucket,
  workerStartedAt,
} from "./rate-limiter";

// --- API stats (snapshot-based for 20min deltas) ---

let lastSnapshotCentral = 0;
let lastSnapshotLive = 0;

export const logApiStats = (): void => {
  const centralTotal = getTotalConsumed(centralBucket);
  const liveTotal = getTotalConsumed(liveGlobalBucket);
  const centralDelta = centralTotal - lastSnapshotCentral;
  const liveDelta = liveTotal - lastSnapshotLive;
  lastSnapshotCentral = centralTotal;
  lastSnapshotLive = liveTotal;

  const uptimeMin = Math.floor((Date.now() - workerStartedAt) / 60_000);
  console.log(
    `[worker:stats] Last 20min: ${centralDelta} central, ${liveDelta} live (${centralDelta + liveDelta} total) — uptime: ${uptimeMin}min`,
  );
};

// --- General ---

export const logWorkerStart = (): void => {
  console.log(
    `[worker] Started — fast loop: 15s, slow loop: 5min`,
  );
};

export const logError = (context: string, error: unknown): void => {
  console.error(`[worker] ${context}:`, error);
};
