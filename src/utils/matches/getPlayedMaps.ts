import type { MapScore } from "@/types/match";

export const getPlayedMaps = (maps: MapScore[]) =>
  maps.filter((map) => map.status === "running" || map.status === "finished");
