import { GraphQLClient } from "graphql-request";

const GRID_API_KEY = process.env.GRID_API_KEY!;

export const centralClient = new GraphQLClient(
  "https://api-op.grid.gg/central-data/graphql",
  { headers: { "x-api-key": GRID_API_KEY } }
);

export const liveClient = new GraphQLClient(
  "https://api-op.grid.gg/live-data-feed/series-state/graphql",
  { headers: { "x-api-key": GRID_API_KEY } }
);
