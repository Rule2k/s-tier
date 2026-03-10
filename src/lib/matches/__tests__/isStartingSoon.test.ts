import { isStartingSoon } from "../isStartingSoon";
import { makeMatch } from "@/test/fixtures/matches";

describe("isStartingSoon", () => {
  it("returns true for not started matches within the next hour", () => {
    const now = new Date("2025-06-15T10:00:00Z");
    vi.useFakeTimers();
    vi.setSystemTime(now);

    expect(
      isStartingSoon(
        makeMatch({ status: "not_started", scheduledAt: "2025-06-15T10:45:00Z" }),
      ),
    ).toBe(true);

    vi.useRealTimers();
  });

  it("returns false for matches outside the next hour or already running", () => {
    const now = new Date("2025-06-15T10:00:00Z");
    vi.useFakeTimers();
    vi.setSystemTime(now);

    expect(
      isStartingSoon(
        makeMatch({ status: "not_started", scheduledAt: "2025-06-15T12:00:00Z" }),
      ),
    ).toBe(false);
    expect(
      isStartingSoon(
        makeMatch({ status: "running", scheduledAt: "2025-06-15T10:45:00Z" }),
      ),
    ).toBe(false);

    vi.useRealTimers();
  });
});
