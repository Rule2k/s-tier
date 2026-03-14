/** All Grid GraphQL queries in one file. */

/** CS2 title ID hardcoded — Grid IdFilter only accepts { in: [...] }. */
export const tournamentsQuery = `
  query Tournaments($last: Int!, $before: String) {
    tournaments(last: $last, before: $before, filter: { title: { id: { in: [28] } } }) {
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
        hasPreviousPage
        startCursor
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
