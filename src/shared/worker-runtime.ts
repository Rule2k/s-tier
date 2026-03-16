export const WORKER_RUNTIME = {
  lock: {
    ttlSeconds: 45,
    renewIntervalMs: 15_000,
    retryIntervalMs: 15_000,
  },
  health: {
    heartbeatAliveWindowMs: 2 * 60_000,
    staleDataAfterMs: 15 * 60_000,
  },
} as const;
