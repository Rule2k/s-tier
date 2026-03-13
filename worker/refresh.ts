// Worker entry point — will be replaced by worker/index.ts in Phase 2.
// This stub keeps the project compilable during the transition.

import { logWorkerStart } from "./logger";

const run = async () => {
  logWorkerStart();
  console.log("[worker] Placeholder — rebuild in progress. See Phase 1-2.");
};

run().catch((error) => {
  console.error("[worker] Fatal startup error:", error);
  process.exit(1);
});
