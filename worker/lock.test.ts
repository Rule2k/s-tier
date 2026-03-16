import { beforeEach, describe, expect, it, vi } from "vitest";

const redisMock = vi.hoisted(() => ({
  set: vi.fn(),
  eval: vi.fn(),
}));

vi.mock("../src/lib/redis/client", () => ({
  default: redisMock,
}));

vi.mock("./logger", () => ({
  logError: vi.fn(),
}));

import {
  acquireWorkerLock,
  renewWorkerLock,
  releaseWorkerLock,
  startWorkerLockHeartbeat,
} from "./lock";

describe("worker lock", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("acquires the Redis lock only when Redis returns OK", async () => {
    redisMock.set.mockResolvedValueOnce("OK").mockResolvedValueOnce(null);

    await expect(acquireWorkerLock()).resolves.toBe(true);
    await expect(acquireWorkerLock()).resolves.toBe(false);
  });

  it("renews and releases only through guarded Redis scripts", async () => {
    redisMock.eval.mockResolvedValueOnce(1).mockResolvedValueOnce(1);

    await expect(renewWorkerLock()).resolves.toBe(true);
    await expect(releaseWorkerLock()).resolves.toBeUndefined();
  });

  it("invokes the lost-lock callback when renewal fails", async () => {
    const onLockLost = vi.fn();
    redisMock.eval.mockResolvedValueOnce(0);

    const stop = startWorkerLockHeartbeat(onLockLost);
    await vi.advanceTimersByTimeAsync(15_000);

    expect(onLockLost).toHaveBeenCalledTimes(1);
    stop();
  });
});
