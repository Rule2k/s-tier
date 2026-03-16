import { randomUUID } from "crypto";
import redis from "../src/lib/redis/client";
import { REDIS_KEYS } from "../src/shared/redis-keys";
import { config } from "./config";
import { logError } from "./logger";

const instanceId = randomUUID();
const renewScript = `
if redis.call("get", KEYS[1]) == ARGV[1] then
  return redis.call("expire", KEYS[1], tonumber(ARGV[2]))
end
return 0
`;
const releaseScript = `
if redis.call("get", KEYS[1]) == ARGV[1] then
  return redis.call("del", KEYS[1])
end
return 0
`;

let renewTimer: NodeJS.Timeout | null = null;
let renewInFlight = false;

const lockKey = REDIS_KEYS.metaWorkerLock;

const evalAsNumber = async (
  script: string,
  key: string,
  value: string,
  ttlSeconds?: number,
): Promise<number> => {
  const args = ttlSeconds === undefined ? [value] : [value, String(ttlSeconds)];
  const result = await redis.eval(script, 1, key, ...args);
  return typeof result === "number" ? result : Number(result ?? 0);
};

export const getWorkerInstanceId = (): string => instanceId;

export const acquireWorkerLock = async (): Promise<boolean> => {
  const result = await redis.set(
    lockKey,
    instanceId,
    "EX",
    config.workerLock.ttlSeconds,
    "NX",
  );
  return result === "OK";
};

export const renewWorkerLock = async (): Promise<boolean> => {
  const result = await evalAsNumber(
    renewScript,
    lockKey,
    instanceId,
    config.workerLock.ttlSeconds,
  );
  return result === 1;
};

export const releaseWorkerLock = async (): Promise<void> => {
  try {
    await evalAsNumber(releaseScript, lockKey, instanceId);
  } catch (error) {
    logError("Failed to release worker lock", error);
  }
};

export const startWorkerLockHeartbeat = (
  onLockLost: () => void,
): (() => void) => {
  if (renewTimer) {
    clearInterval(renewTimer);
  }

  renewTimer = setInterval(() => {
    if (renewInFlight) return;
    renewInFlight = true;

    void renewWorkerLock()
      .then((renewed) => {
        if (!renewed) {
          clearInterval(renewTimer ?? undefined);
          renewTimer = null;
          onLockLost();
        }
      })
      .catch((error) => {
        logError("Failed to renew worker lock", error);
        clearInterval(renewTimer ?? undefined);
        renewTimer = null;
        onLockLost();
      })
      .finally(() => {
        renewInFlight = false;
      });
  }, config.workerLock.renewIntervalMs);

  renewTimer.unref?.();

  return () => {
    if (renewTimer) {
      clearInterval(renewTimer);
      renewTimer = null;
    }
  };
};
