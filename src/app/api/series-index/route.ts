import { NextResponse } from "next/server";
import redis from "@/lib/redis/client";
import { CACHE_KEYS, CACHE_TTL } from "@/lib/redis/keys";
import { fetchSeriesIndex } from "@/lib/pandascore/fetchSeries";
import type { PandaScoreSerie } from "@/lib/pandascore/types/match";
import type { SerieSummary } from "@/types/match";

const mapToSummary = (serie: PandaScoreSerie): SerieSummary => {
  const tiers = serie.tournaments.map((t) => t.tier);
  const tierPriority = ["s", "a", "b", "c", "d", "unranked"] as const;
  const highestTier = tierPriority.find((t) => tiers.includes(t)) ?? "unranked";
  const region = serie.tournaments.find((t) => t.region)?.region ?? null;
  const name = serie.league.name + (serie.full_name ? ` ${serie.full_name}` : "");

  return {
    id: String(serie.id),
    name,
    leagueImageUrl: serie.league.image_url,
    tier: highestTier,
    region,
    beginAt: serie.begin_at ?? "",
    endAt: serie.end_at ?? "",
  };
};

const getSeriesIndex = async (): Promise<PandaScoreSerie[]> => {
  const cached = await redis.get(CACHE_KEYS.SERIES_INDEX);
  if (cached) return JSON.parse(cached);

  const pandaSeries = await fetchSeriesIndex();
  redis
    .set(CACHE_KEYS.SERIES_INDEX, JSON.stringify(pandaSeries), "EX", CACHE_TTL.INDEX)
    .catch((err) => console.error("Redis write failed:", err));
  return pandaSeries;
};

export async function GET() {
  try {
    const pandaSeries = await getSeriesIndex();
    const summaries = pandaSeries.map(mapToSummary);
    return NextResponse.json(summaries);
  } catch (error) {
    console.error("Failed to fetch series index:", error);
    return NextResponse.json(
      { error: "Failed to fetch series index" },
      { status: 500 },
    );
  }
}
