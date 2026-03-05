import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useMatches } from "./useMatches";
import { makeMatch } from "@/test/fixtures/matches";
import { createElement, type ReactNode } from "react";

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children);
};

describe("useMatches", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("fetches and returns matches", async () => {
    const matches = [makeMatch()];
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(matches),
    }));

    const { result } = renderHook(() => useMatches(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(matches);

    vi.unstubAllGlobals();
  });

  it("handles fetch error", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
    }));

    const { result } = renderHook(() => useMatches(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeInstanceOf(Error);

    vi.unstubAllGlobals();
  });
});
