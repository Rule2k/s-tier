const PREFIX = "s-tier";

/** Redis key builders — 9 key types. */
export const REDIS_KEYS = {
  /** Sorted Set: tournament IDs scored by startDate timestamp */
  tournaments: `${PREFIX}:tournaments`,

  /** JSON string: tournament metadata */
  tournament: (id: string) => `${PREFIX}:tournament:${id}`,

  /** Sorted Set: series IDs scored by startTimeScheduled */
  tournamentSeries: (id: string) => `${PREFIX}:tournament:${id}:series`,

  /** JSON string: series data (Central Data) */
  series: (id: string) => `${PREFIX}:series:${id}`,

  /** JSON string: detailed SeriesState */
  seriesState: (id: string) => `${PREFIX}:series:${id}:state`,

  /** String: unix timestamp of last refresh */
  metaSeriesLastRefresh: (id: string) => `${PREFIX}:meta:series:${id}:lastRefresh`,

  /** String: live | today | upcoming | past */
  metaSeriesStatus: (id: string) => `${PREFIX}:meta:series:${id}:status`,

  /** String: unix timestamp — worker heartbeat */
  metaWorkerHeartbeat: `${PREFIX}:meta:worker:heartbeat`,

  /** String: unix timestamp — last discovery run */
  metaDiscoveryLastRun: `${PREFIX}:meta:discovery:lastRun`,
} as const;

/** TTLs in seconds. */
export const REDIS_TTL = {
  TOURNAMENTS: 86_400,              // 24h
  TOURNAMENT: 86_400,               // 24h
  TOURNAMENT_SERIES: 604_800,       // 7 days (matches SERIES_STATE_FINISHED)
  SERIES_LIVE: 604_800,             // 7 days (matches SERIES_STATE_FINISHED)
  SERIES_FINISHED: 604_800,         // 7 days
  SERIES_STATE_LIVE: 21_600,        // 6h
  SERIES_STATE_FINISHED: 604_800,   // 7 days
  META: 3_600,                      // 1h
  HEARTBEAT: 120,                   // 2 min
} as const;
