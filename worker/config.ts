/** Worker configuration — all tunables in one place. */

export const config = {
  /** Discovery loop (Central Data) */
  discovery: {
    intervalMs: 5 * 60_000, // 5 min
  },

  /** Series refresh loop (Series State) */
  seriesRefresh: {
    intervalMs: 15_000, // 15s between cycles
  },

  /** Team filter — only track tournaments these teams participate in */
  teamFilter: {
    teamIds: [
      "51818", // Team Vitality
      "51824", // FURIA
      "51819", // MOUZ
      "51967", // Team Falcons
      "49586", // Team Spirit
      "51814", // Natus Vincere
      "51822", // G2 Esports
      "51812", // FaZe Clan
      "51793", // 3DMAX
    ],
  },

  /** Grid API pagination */
  pagination: {
    pageSize: 50,
  },
} as const;
