/** All Grid GraphQL queries in one file. */

/**
 * Discover tournaments through series of tracked teams.
 * Returns series with embedded tournament metadata — caller groups by tournament.
 */
export const discoverSeriesQuery = `
  query DiscoverSeries($first: Int!, $after: String, $teamIds: [ID!]!) {
    allSeries(
      first: $first
      after: $after
      filter: { titleId: 28, teamIds: { in: $teamIds } }
      orderBy: StartTimeScheduled
      orderDirection: DESC
    ) {
      edges {
        node {
          id
          startTimeScheduled
          tournament { id name nameShortened logoUrl prizePool { amount } venueType }
          teams { baseInfo { id name } }
        }
        cursor
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

export const allSeriesQuery = `
  query AllSeries($first: Int!, $after: String, $tournamentId: ID!) {
    allSeries(
      first: $first
      after: $after
      filter: { titleId: 28, tournamentId: $tournamentId }
      orderBy: StartTimeScheduled
      orderDirection: ASC
    ) {
      edges {
        node {
          id
          startTimeScheduled
          format { name nameShortened }
          type
          teams {
            baseInfo { id name logoUrl }
          }
          streams { url }
        }
        cursor
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

export const seriesStateQuery = `
  query SeriesState($id: ID!) {
    seriesState(id: $id) {
      id
      format
      started
      finished
      teams {
        id
        name
        score
        won
      }
      games {
        id
        sequenceNumber
        map { name }
        started
        finished
        paused
        teams {
          id
          name
          side
          score
          won
        }
      }
      draftActions {
        id
        type
      }
      updatedAt
      startedAt
      duration
    }
  }
`;
