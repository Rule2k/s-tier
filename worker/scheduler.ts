// Grid types — will be replaced by worker/grid/ types in Phase 1
interface GridSeries {
  id: string;
  startTimeScheduled: string;
  format: { nameShortened: string };
  tournament: { id: string; name: string; nameShortened: string; logoUrl: string };
  teams: { baseInfo: { id: string; name: string; nameShortened?: string; logoUrl: string } }[];
}

interface GridSeriesState {
  id: string;
  started: boolean;
  finished: boolean;
  teams: { id: string; name: string; score: number }[];
  games: { sequenceNumber: number; started: boolean; finished: boolean; map: { name: string }; teams: { score: number; side: string }[] }[];
}

// --- Priority tiers ---

export type PriorityTier = "P0" | "P1" | "P2" | "P3" | "SKIP";

const THIRTY_MINUTES_MS = 30 * 60 * 1000;
const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

export const TIER_INTERVALS: Record<Exclude<PriorityTier, "SKIP">, number> = {
  P0: 15_000,      // 15s — live matches
  P1: 2 * 60_000,  // 2min — starting soon
  P2: 10 * 60_000, // 10min — today
  P3: 30 * 60_000, // 30min — future
};

export const classifyTier = (
  state: GridSeriesState | null,
  scheduledAt: string,
  now = Date.now(),
): PriorityTier => {
  // If we have state, use it for started/finished detection
  if (state?.finished) return "SKIP";
  if (state?.started && !state.finished) return "P0";

  // No state or not started — classify by scheduled time
  const scheduledTime = new Date(scheduledAt).getTime();
  const timeUntil = scheduledTime - now;

  if (timeUntil < 0) {
    // Scheduled in the past but no state yet → likely live or about to be
    return "P0";
  }

  if (timeUntil <= THIRTY_MINUTES_MS) return "P1";
  if (timeUntil <= TWENTY_FOUR_HOURS_MS) return "P2";
  return "P3";
};

// --- Series registry ---

export interface SeriesEntry {
  seriesId: string;
  tournamentId: string;
  gridSeries: GridSeries;
  state: GridSeriesState | null;
  lastFetchedAt: number;
  failCount: number;
}

const registry = new Map<string, SeriesEntry>();

export const getRegistry = (): Map<string, SeriesEntry> => registry;

export const upsertSeries = (
  tournamentId: string,
  gridSeries: GridSeries,
): SeriesEntry => {
  const existing = registry.get(gridSeries.id);
  if (existing) {
    // Update metadata but keep state and fetch timing
    existing.gridSeries = gridSeries;
    existing.tournamentId = tournamentId;
    return existing;
  }

  const entry: SeriesEntry = {
    seriesId: gridSeries.id,
    tournamentId,
    gridSeries,
    state: null,
    lastFetchedAt: 0,
    failCount: 0,
  };
  registry.set(gridSeries.id, entry);
  return entry;
};

export const getSeriesEntry = (seriesId: string): SeriesEntry | undefined =>
  registry.get(seriesId);

export const removeSeriesNotIn = (activeIds: Set<string>): number => {
  let removed = 0;
  for (const [id] of registry) {
    if (!activeIds.has(id)) {
      registry.delete(id);
      removed++;
    }
  }
  return removed;
};

// --- Eligibility ---

const MAX_FAIL_BACKOFF_MS = 5 * 60_000; // 5 min cap
const FAIL_DEMOTE_THRESHOLD = 10;

const getEffectiveInterval = (entry: SeriesEntry, tier: PriorityTier): number => {
  if (tier === "SKIP") return Infinity;

  const base = TIER_INTERVALS[tier];

  if (entry.failCount === 0) return base;

  // Exponential backoff on failures: 2^failCount * 15s, capped at 5min
  const backoff = Math.min(
    Math.pow(2, entry.failCount) * 15_000,
    MAX_FAIL_BACKOFF_MS,
  );
  return Math.max(base, backoff);
};

export interface EligibleSeries {
  entry: SeriesEntry;
  tier: PriorityTier;
  staleness: number; // ms since last fetch
}

export const getEligibleSeries = (now = Date.now()): EligibleSeries[] => {
  const eligible: EligibleSeries[] = [];

  for (const entry of registry.values()) {
    let tier = classifyTier(
      entry.state,
      entry.gridSeries.startTimeScheduled,
      now,
    );

    if (tier === "SKIP") continue;

    // Demote to P3 after too many failures
    if (entry.failCount >= FAIL_DEMOTE_THRESHOLD && tier !== "P3") {
      tier = "P3";
    }

    const interval = getEffectiveInterval(entry, tier);
    const staleness = now - entry.lastFetchedAt;

    if (staleness >= interval) {
      eligible.push({ entry, tier, staleness });
    }
  }

  // Sort: P0 first, then P1, P2, P3. Within same tier, most stale first.
  const tierOrder: Record<string, number> = { P0: 0, P1: 1, P2: 2, P3: 3 };
  eligible.sort((a, b) => {
    const tierDiff = tierOrder[a.tier] - tierOrder[b.tier];
    if (tierDiff !== 0) return tierDiff;
    return b.staleness - a.staleness; // most stale first
  });

  return eligible;
};

// --- Stats ---

export interface TierCounts {
  P0: number;
  P1: number;
  P2: number;
  P3: number;
  SKIP: number;
}

export const getTierCounts = (now = Date.now()): TierCounts => {
  const counts: TierCounts = { P0: 0, P1: 0, P2: 0, P3: 0, SKIP: 0 };

  for (const entry of registry.values()) {
    const tier = classifyTier(
      entry.state,
      entry.gridSeries.startTimeScheduled,
      now,
    );
    counts[tier]++;
  }

  return counts;
};

export const getSeriesForTournament = (
  tournamentId: string,
): SeriesEntry[] => {
  const entries: SeriesEntry[] = [];
  for (const entry of registry.values()) {
    if (entry.tournamentId === tournamentId) entries.push(entry);
  }
  return entries;
};

export const clearRegistry = (): void => {
  registry.clear();
};
