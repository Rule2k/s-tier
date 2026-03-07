export const CACHE_KEYS = {
  SERIES_INDEX: "series:index",
  serieById: (id: string) => `series:${id}`,
} as const;

export const CACHE_TTL = {
  INDEX: 300,
  RUNNING: 120,
  PAST: 604_800,
  MAX_FUTURE: 86_400,
} as const;

export const getSerieTtl = (serie: { beginAt: string; endAt: string }): number => {
  const now = Date.now();
  const begin = new Date(serie.beginAt).getTime();
  const end = new Date(serie.endAt).getTime();
  if (end < now) return CACHE_TTL.PAST;
  if (begin <= now) return CACHE_TTL.RUNNING;
  return Math.min(CACHE_TTL.MAX_FUTURE, Math.floor((begin - now) / 1000));
};
