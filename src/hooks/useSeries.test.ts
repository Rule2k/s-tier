import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useSeries } from "./useSeries";
import { makeSerie } from "@/test/fixtures/matches";
import { createElement, type ReactNode } from "react";

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children);
};

describe("useSeries", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("fetches and returns series", async () => {
    const series = [makeSerie()];
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(series),
    }));

    const { result } = renderHook(() => useSeries(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(series);

    vi.unstubAllGlobals();
  });

  it("handles fetch error", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
    }));

    const { result } = renderHook(() => useSeries(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeInstanceOf(Error);

    vi.unstubAllGlobals();
  });
});
