/** Worker configuration — all tunables in one place. */

export const config = {
  /** Discovery loop (Central Data) */
  discovery: {
    intervalMs: 5 * 60_000, // 5 min
  },

  /** Series refresh loop (Series State) */
  seriesRefresh: {
    intervalMs: 15_000, // 15s between cycles
  },

  /** Rate limit budgets (tokens per minute, with safety margin) */
  rateLimits: {
    centralData: { maxTokens: 18, refillPerMinute: 20 },
    seriesStateGlobal: { maxTokens: 162, refillPerMinute: 180 },
    seriesStatePerSeries: { maxTokens: 5, refillPerMinute: 6 },
  },

  /** Prestige filter — which tournaments the worker tracks */
  prestige: {
    minPrizePool: 100_000,
    includeLan: true,
  },

  /** Grid API pagination */
  pagination: {
    pageSize: 50,
  },
} as const;
