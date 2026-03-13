import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useTournaments } from "../useTournaments";
import { makeTournament } from "@/test/fixtures/matches";
import { createElement, type ReactNode } from "react";

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children);
};

describe("useTournaments", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("fetches and returns tournaments", async () => {
    const tournaments = [makeTournament()];
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ tournaments, hasMore: false, total: 1 }),
    }));

    const { result } = renderHook(() => useTournaments(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.tournaments).toEqual(tournaments);

    vi.unstubAllGlobals();
  });

  it("handles fetch error", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
    }));

    const { result } = renderHook(() => useTournaments(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeInstanceOf(Error);

    vi.unstubAllGlobals();
  });
});
