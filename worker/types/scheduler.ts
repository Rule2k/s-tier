import type { GridSeries, GridSeriesState } from "./grid";

// --- Priority tiers ---

export type PriorityTier = "P0" | "P1" | "P2" | "P3" | "SKIP";

// --- Series registry ---

export interface SeriesEntry {
  seriesId: string;
  tournamentId: string;
  gridSeries: GridSeries;
  state: GridSeriesState | null;
  lastFetchedAt: number;
  failCount: number;
}

// --- Eligibility ---

export interface EligibleSeries {
  entry: SeriesEntry;
  tier: PriorityTier;
  staleness: number; // ms since last fetch
}

// --- Stats ---

export interface TierCounts {
  P0: number;
  P1: number;
  P2: number;
  P3: number;
  SKIP: number;
}
