/** Tournament metadata as stored in Redis (written by worker, read by front). */
export interface Tournament {
  id: string;
  name: string;
  nameShortened: string;
  logoUrl: string | null;
  startDate: string | null;
  endDate: string | null;
  prizePool: number | null;
  venueType: "LAN" | "ONLINE" | "UNKNOWN";
  teamCount: number;
}
