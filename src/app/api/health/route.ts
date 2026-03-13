import { NextResponse } from "next/server";
import redis from "@/lib/redis/client";
import { REDIS_KEYS } from "@/shared/redis-keys";

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

    const workerAlive = heartbeatTs !== null && now - heartbeatTs < 2 * 60_000;

    return NextResponse.json({
      workerAlive,
      lastHeartbeat: heartbeatTs ? new Date(heartbeatTs).toISOString() : null,
      lastDiscovery: discoveryTs ? new Date(discoveryTs).toISOString() : null,
    });
  } catch (error) {
    console.error("[api/health] Error:", error);
    return NextResponse.json(
      { workerAlive: false, lastHeartbeat: null, lastDiscovery: null },
      { status: 500 },
    );
  }
};
