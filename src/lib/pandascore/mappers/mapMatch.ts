import type { Match } from "@/types/match";
import type { PandaScoreMatch } from "../types/match";

export const mapMatch = (match: PandaScoreMatch): Match => ({
  id: String(match.id),
  status: match.status,
  scheduledAt: match.scheduled_at ?? match.begin_at ?? "",
  format: `Bo${match.number_of_games}`,
  tournament: {
    id: String(match.tournament.id),
    name: match.tournament.name,
    tier: match.tournament.tier,
  },
  teams: match.opponents.map((o) => {
    const result = match.results.find((r) => r.team_id === o.opponent.id);
    return {
      name: o.opponent.name,
      acronym: o.opponent.acronym,
      imageUrl: o.opponent.image_url,
      score: result?.score ?? null,
      isWinner: match.winner_id === o.opponent.id,
    };
  }),
});
