import { startDiscoveryLoop } from "./discovery";
import { startSeriesRefreshLoop } from "./series-refresh";
import { logWorkerStart, logError } from "./logger";
import { hydrateSchedulerFromRedis } from "./discovery";

const run = async () => {
  logWorkerStart();

  // Hydrate from Redis first, then start both loops.
  await hydrateSchedulerFromRedis();
  await Promise.all([
    startDiscoveryLoop(),
    startSeriesRefreshLoop(),
  ]);
};

run().catch((error) => {
  logError("Fatal startup error", error);
  process.exit(1);
});
