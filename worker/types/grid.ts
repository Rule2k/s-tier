import type { Series as StoredSeries } from "../../src/shared/types/series";
import type { SeriesState as StoredSeriesState } from "../../src/shared/types/series-state";
import type { Tournament as StoredTournament } from "../../src/shared/types/tournament";

// --- Grid API types (used by scheduler registry) ---

export interface GridSeries {
  id: string;
  startTimeScheduled: string;
  format: { nameShortened: string };
  tournament: { id: string; name: string; nameShortened: string; logoUrl: string };
  teams: { baseInfo: { id: string; name: string; nameShortened?: string; logoUrl: string } }[];
}

export interface GridSeriesState {
  id: string;
  started: boolean;
  finished: boolean;
  teams: { id: string; name: string; score: number }[];
  games: { sequenceNumber: number; started: boolean; finished: boolean; map: { name: string }; teams: { score: number; side: string }[] }[];
}

// --- Fetched types (returned by grid/ fetchers) ---

export type FetchedTournament = StoredTournament;

export type FetchedSeries = StoredSeries;

export type FetchedSeriesState = StoredSeriesState;
