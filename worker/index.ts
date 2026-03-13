import { startDiscoveryLoop } from "./discovery";
import { startSeriesRefreshLoop } from "./series-refresh";
import { logWorkerStart, logError } from "./logger";

const run = async () => {
  logWorkerStart();

  // Discovery loop first — populates tournament & series data
  await startDiscoveryLoop();

  // Then start the series refresh loop
  await startSeriesRefreshLoop();
};

run().catch((error) => {
  logError("Fatal startup error", error);
  process.exit(1);
});
