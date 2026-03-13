/** All Grid GraphQL queries in one file. */

export const tournamentsQuery = `
  query Tournaments($first: Int!, $after: String, $filter: TournamentFilter!) {
    tournaments(first: $first, after: $after, filter: $filter) {
      edges {
        node {
          id
          name
          nameShortened
          logoUrl
          startDate
          endDate
          prizePool { amount }
          venueType
          teams { id name }
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
  query AllSeries($first: Int!, $after: String, $filter: SeriesFilter!) {
    allSeries(
      first: $first
      after: $after
      filter: $filter
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
            baseInfo { id name }
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
      format { nameShortened }
      started
      finished
      forfeited
      valid
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
