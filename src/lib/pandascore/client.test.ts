// Set env BEFORE module loads (top-level const reads process.env at import time)
vi.hoisted(() => {
  process.env.PANDASCORE_API_KEY = "test-api-key";
});

import { pandascoreGet } from "./client";

describe("pandascoreGet", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("calls the correct URL with auth header", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify([{ id: 1 }]), { status: 200 }),
    );

    await pandascoreGet("/csgo/matches");

    expect(fetch).toHaveBeenCalledWith(
      "https://api.pandascore.co/csgo/matches",
      { headers: { Authorization: "Bearer test-api-key" } },
    );
  });

  it("appends query params to the URL", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response("[]", { status: 200 }),
    );

    await pandascoreGet("/csgo/tournaments", { per_page: "100", "filter[tier]": "s,a" });

    const calledUrl = vi.mocked(fetch).mock.calls[0][0] as string;
    const url = new URL(calledUrl);
    expect(url.searchParams.get("per_page")).toBe("100");
    expect(url.searchParams.get("filter[tier]")).toBe("s,a");
  });

  it("parses and returns JSON response", async () => {
    const mockData = { id: 1, name: "match" };
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify(mockData), { status: 200 }),
    );

    const result = await pandascoreGet("/csgo/matches");
    expect(result).toEqual(mockData);
  });

  it("throws on non-ok response", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response("Forbidden", { status: 403, statusText: "Forbidden" }),
    );

    await expect(pandascoreGet("/csgo/matches")).rejects.toThrow(
      "PandaScore API error: 403 Forbidden",
    );
  });
});
