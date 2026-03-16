import { beforeEach, describe, expect, it, vi } from "vitest";

const redisMock = vi.hoisted(() => ({
  get: vi.fn(),
}));

vi.mock("@/lib/redis/client", () => ({
  default: redisMock,
}));

vi.mock("next/server", () => ({
  NextResponse: {
    json: (body: unknown, init?: ResponseInit) =>
      new Response(JSON.stringify(body), init),
  },
}));

import { GET } from "../route";

describe("/api/health", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-16T12:00:00Z"));
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("returns a healthy non-stale worker when heartbeat and discovery are recent", async () => {
    redisMock.get
      .mockResolvedValueOnce(String(Date.parse("2026-03-16T11:59:10Z")))
      .mockResolvedValueOnce(String(Date.parse("2026-03-16T11:50:00Z")));

    const response = await GET();
    const body = await response.json();

    expect(body).toEqual({
      workerAlive: true,
      staleData: false,
      lastHeartbeat: "2026-03-16T11:59:10.000Z",
      lastDiscovery: "2026-03-16T11:50:00.000Z",
    });
  });

  it("flags stale data when discovery is too old even if the worker is alive", async () => {
    redisMock.get
      .mockResolvedValueOnce(String(Date.parse("2026-03-16T11:59:30Z")))
      .mockResolvedValueOnce(String(Date.parse("2026-03-16T11:40:00Z")));

    const response = await GET();
    const body = await response.json();

    expect(body.workerAlive).toBe(true);
    expect(body.staleData).toBe(true);
  });

  it("returns a degraded payload on Redis failure", async () => {
    redisMock.get.mockRejectedValue(new Error("redis down"));

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({
      workerAlive: false,
      staleData: true,
      lastHeartbeat: null,
      lastDiscovery: null,
    });
  });
});
