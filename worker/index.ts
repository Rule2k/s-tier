import { startDiscoveryLoop } from "./discovery";
import { startSeriesRefreshLoop } from "./series-refresh";
import { logWorkerStart, logError, logApiStats } from "./logger";
import { hydrateSchedulerFromRedis } from "./discovery";
import {
  acquireWorkerLock,
  getWorkerInstanceId,
  releaseWorkerLock,
  startWorkerLockHeartbeat,
} from "./lock";
import { config } from "./config";

const sleep = async (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

const waitForLeadership = async (): Promise<void> => {
  while (!(await acquireWorkerLock())) {
    console.log(
      `[worker] Lock held by another instance — retrying in ${config.workerLock.retryIntervalMs}ms`,
    );
    await sleep(config.workerLock.retryIntervalMs);
  }

  console.log(`[worker] Leadership acquired (${getWorkerInstanceId()})`);
};

const registerShutdownHandlers = () => {
  const shutdown = (signal: NodeJS.Signals) => {
    console.log(`[worker] Received ${signal}, releasing lock`);
    logApiStats();
    void releaseWorkerLock().finally(() => process.exit(0));
  };

  process.once("SIGINT", () => shutdown("SIGINT"));
  process.once("SIGTERM", () => shutdown("SIGTERM"));
};

const run = async () => {
  await waitForLeadership();
  logWorkerStart();
  registerShutdownHandlers();

  const stopLockHeartbeat = startWorkerLockHeartbeat(() => {
    logError("Worker lock lost", new Error("leader lock was not renewed"));
    process.exit(1);
  });

  try {
    // Hydrate from Redis first, then start both loops.
    await hydrateSchedulerFromRedis();
    await Promise.all([
      startDiscoveryLoop(),
      startSeriesRefreshLoop(),
    ]);
  } finally {
    stopLockHeartbeat();
    await releaseWorkerLock();
  }
};

run().catch((error) => {
  logError("Fatal startup error", error);
  process.exit(1);
});
