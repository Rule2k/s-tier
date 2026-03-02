export { default as ALL_SERIES_QUERY } from "./queries/allSeries.graphql";
export { default as SERIES_STATE_QUERY } from "./queries/seriesState.graphql";

export function buildBatchSeriesStateQuery(seriesIds: string[]): string {
  const fields = seriesIds
    .map(
      (id, i) => `s${i}: seriesState(id: "${id}") {
      id
      started
      finished
      teams {
        id
        name
        score
      }
    }`
    )
    .join("\n");

  return `{ ${fields} }`;
}
