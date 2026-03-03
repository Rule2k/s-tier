import { NextResponse } from "next/server";
import { pandascoreGet } from "@/lib/pandascore/client";
import type { PandaScoreMatch, PandaScoreTournament } from "@/lib/pandascore/types/match";
import { mapMatch } from "@/lib/pandascore/mappers/mapMatch";

export async function GET() {
  try {
    // 1. Get S/A-tier tournament IDs
    const tournaments = await pandascoreGet<PandaScoreTournament[]>(
      "/csgo/tournaments",
      { "filter[tier]": "s,a", per_page: "100", sort: "-begin_at" }
    );
    const tournamentIds = tournaments.map((t) => t.id).join(",");

    if (!tournamentIds) {
      return NextResponse.json([]);
    }

    // 2. Fetch matches filtered by those tournament IDs
    const [past, running, upcoming] = await Promise.all([
      pandascoreGet<PandaScoreMatch[]>("/csgo/matches/past", {
        "filter[tournament_id]": tournamentIds,
        per_page: "50",
      }),
      pandascoreGet<PandaScoreMatch[]>("/csgo/matches/running", {
        "filter[tournament_id]": tournamentIds,
      }),
      pandascoreGet<PandaScoreMatch[]>("/csgo/matches/upcoming", {
        "filter[tournament_id]": tournamentIds,
        per_page: "50",
      }),
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
