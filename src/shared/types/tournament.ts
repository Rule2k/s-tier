/** Tournament metadata as stored in Redis (written by worker, read by front). */
export interface Tournament {
  id: string;
  name: string;
  nameShortened: string;
  logoUrl: string | null;
  startDate: string | null;
  endDate: string | null;
  prizePool: number | null;
  venueType: string | null;
  teams: TournamentTeam[];
}

export interface TournamentTeam {
  id: string;
  name: string;
}
