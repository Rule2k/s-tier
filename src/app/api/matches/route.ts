import { NextRequest, NextResponse } from "next/server";
import redis from "@/lib/redis/client";
import { CACHE_KEYS, CACHE_TTL, getSerieTtl } from "@/lib/redis/keys";
import {
  fetchSeriesIndex,
  fetchSerieWithMatches,
  fetchSeriesFromPandaScore,
  selectRelevantSeries,
} from "@/lib/pandascore/fetchSeries";
import type { PandaScoreSerie } from "@/lib/pandascore/types/match";
import type { Serie } from "@/types/match";

const getSeriesIndex = async (): Promise<PandaScoreSerie[]> => {
  const cached = await redis.get(CACHE_KEYS.SERIES_INDEX);
  if (cached) return JSON.parse(cached);

  const pandaSeries = await fetchSeriesIndex();
  redis
    .set(CACHE_KEYS.SERIES_INDEX, JSON.stringify(pandaSeries), "EX", CACHE_TTL.INDEX)
    .catch((err) => console.error("Redis write failed:", err));
  return pandaSeries;
};

const getCachedSerie = async (id: string): Promise<Serie | null> => {
  const cached = await redis.get(CACHE_KEYS.serieById(id));
  if (cached) return JSON.parse(cached);
  return null;
};

const fetchAndCacheSerie = async (pandaSerie: PandaScoreSerie): Promise<Serie | null> => {
  const serie = await fetchSerieWithMatches(pandaSerie);
  if (!serie) return null;

  const ttl = getSerieTtl(serie);
  redis
    .set(CACHE_KEYS.serieById(serie.id), JSON.stringify(serie), "EX", ttl)
    .catch((err) => console.error("Redis write failed:", err));
  return serie;
};

const getDefaultSeries = async (): Promise<Serie[]> => {
  // Try reading individual serie caches from index
  try {
    const pandaSeries = await getSeriesIndex();
    const relevant = selectRelevantSeries(pandaSeries, 5);

    const series = await Promise.all(
      relevant.map(async (ps) => {
        const id = String(ps.id);
        const cached = await getCachedSerie(id);
        if (cached) return cached;
        return fetchAndCacheSerie(ps);
      }),
    );

    const result = series
      .filter((s): s is Serie => s !== null)
      .sort((a, b) => new Date(a.beginAt).getTime() - new Date(b.beginAt).getTime());

    if (result.length > 0) return result;
  } catch (error) {
    console.error("Failed to load series from index + cache:", error);
  }

  // Fallback: fetch everything from PandaScore
  return fetchSeriesFromPandaScore();
};

const getSerieById = async (serieId: string): Promise<Serie | null> => {
  // 1. Check cache
  const cached = await getCachedSerie(serieId);
  if (cached) return cached;

  // 2. Find in index and fetch
  const pandaSeries = await getSeriesIndex();
  const pandaSerie = pandaSeries.find((s) => String(s.id) === serieId);
  if (!pandaSerie) return null;

  return fetchAndCacheSerie(pandaSerie);
};

export async function GET(request: NextRequest) {
  const serieId = request.nextUrl.searchParams.get("serieId");

  if (serieId) {
    try {
      const serie = await getSerieById(serieId);
      if (!serie) {
        return NextResponse.json({ error: "Serie not found" }, { status: 404 });
      }
      return NextResponse.json(serie);
    } catch (error) {
      console.error(`Failed to fetch serie ${serieId}:`, error);
      return NextResponse.json(
        { error: "Failed to fetch serie" },
        { status: 500 },
      );
    }
  }

  try {
    const series = await getDefaultSeries();
    return NextResponse.json(series);
  } catch (error) {
    console.error("Failed to fetch series:", error);
    return NextResponse.json(
      { error: "Failed to fetch series" },
      { status: 500 },
    );
  }
}
