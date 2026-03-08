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
          format {
            nameShortened
          }
          tournament {
            id
            name
            nameShortened
            logoUrl
          }
          teams {
            baseInfo {
              id
              name
              nameShortened
              logoUrl
            }
          }
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
