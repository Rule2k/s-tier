import type { MapScore } from "@/types/match";

export const getMapWinnerIndex = (map: MapScore): 0 | 1 | null => {
  if (map.status !== "finished") return null;
  return map.scores[0] > map.scores[1] ? 0 : 1;
};
