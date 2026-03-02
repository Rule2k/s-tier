import { NextResponse } from "next/server";
import { pandascoreGet } from "@/lib/pandascore/client";
import type { PandaScoreMatch } from "@/lib/pandascore/types/match";
import { mapMatch } from "@/lib/pandascore/mappers/mapMatch";

export async function GET() {
  try {
    const [past, running, upcoming] = await Promise.all([
      pandascoreGet<PandaScoreMatch[]>("/csgo/matches/past", { per_page: "20" }),
      pandascoreGet<PandaScoreMatch[]>("/csgo/matches/running"),
      pandascoreGet<PandaScoreMatch[]>("/csgo/matches/upcoming", { per_page: "20" }),
    ]);

    const matches = [...past, ...running, ...upcoming].map(mapMatch);

    return NextResponse.json(matches);
  } catch (error) {
    console.error("Failed to fetch matches:", error);
    return NextResponse.json(
      { error: "Failed to fetch matches" },
      { status: 500 }
    );
  }
}
