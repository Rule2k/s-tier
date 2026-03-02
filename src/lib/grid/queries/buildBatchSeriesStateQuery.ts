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
