import { NextResponse } from "next/server";
import redis from "@/lib/redis/client";
import { REDIS_KEYS } from "@/shared/redis-keys";
import { WORKER_RUNTIME } from "@/shared/worker-runtime";
import type { WorkerHealth } from "@/shared/types/worker-health";

/**
 * GET /api/health
 *
 * Returns worker health status based on heartbeat and discovery timestamps.
 */
export const GET = async () => {
  try {
    const [heartbeat, lastDiscovery] = await Promise.all([
      redis.get(REDIS_KEYS.metaWorkerHeartbeat),
      redis.get(REDIS_KEYS.metaDiscoveryLastRun),
    ]);

    const now = Date.now();
    const heartbeatTs = heartbeat ? parseInt(heartbeat, 10) : null;
    const discoveryTs = lastDiscovery ? parseInt(lastDiscovery, 10) : null;

    const body: WorkerHealth = {
      workerAlive:
        heartbeatTs !== null
        && now - heartbeatTs < WORKER_RUNTIME.health.heartbeatAliveWindowMs,
      staleData:
        discoveryTs === null
        || now - discoveryTs > WORKER_RUNTIME.health.staleDataAfterMs,
      lastHeartbeat: heartbeatTs ? new Date(heartbeatTs).toISOString() : null,
      lastDiscovery: discoveryTs ? new Date(discoveryTs).toISOString() : null,
    };

    return NextResponse.json(body);
  } catch (error) {
    console.error("[api/health] Error:", error);
    return NextResponse.json(
      {
        workerAlive: false,
        staleData: true,
        lastHeartbeat: null,
        lastDiscovery: null,
      } satisfies WorkerHealth,
      { status: 500 },
    );
  }
};
