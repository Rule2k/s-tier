import { pandascoreGet } from "./client";
import { mapMatch } from "./mappers/mapMatch";
import type { PandaScoreMatch, PandaScoreTournament } from "./types/match";
import type { Match } from "@/types/match";

export const fetchMatchesFromPandaScore = async (): Promise<Match[]> => {
  const tournaments = await pandascoreGet<PandaScoreTournament[]>(
    "/csgo/tournaments",
    { "filter[tier]": "s,a", per_page: "100", sort: "-begin_at" }
  );
  const tournamentIds = tournaments.map((t) => t.id).join(",");

  if (!tournamentIds) return [];

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

  return [...past, ...running, ...upcoming].map(mapMatch);
};
