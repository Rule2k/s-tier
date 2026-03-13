/** Series (= one match) as stored in Redis (written by worker, read by front). */
export interface Series {
  id: string;
  tournamentId: string;
  teams: [TeamInfo, TeamInfo];
  startTimeScheduled: string;
  format: string; // "Bo1" | "Bo3" | "Bo5"
  type: string; // "ESPORTS"
  streams: string[];
}

export interface TeamInfo {
  id: string;
  name: string;
}
