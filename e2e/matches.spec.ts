import { test, expect } from "@playwright/test";

const mockMatches = [
  {
    id: "1",
    status: "running",
    scheduledAt: new Date().toISOString(),
    format: "Bo3",
    tournament: { id: "100", name: "BLAST Premier", tier: "s" },
    teams: [
      { name: "Navi", acronym: "NAVI", imageUrl: null, score: 1, isWinner: false },
      { name: "G2 Esports", acronym: "G2", imageUrl: null, score: 0, isWinner: false },
    ],
  },
  {
    id: "2",
    status: "not_started",
    scheduledAt: new Date().toISOString(),
    format: "Bo3",
    tournament: { id: "100", name: "BLAST Premier", tier: "s" },
    teams: [
      { name: "FaZe Clan", acronym: "FAZE", imageUrl: null, score: null, isWinner: false },
      { name: "Vitality", acronym: "VIT", imageUrl: null, score: null, isWinner: false },
    ],
  },
];

test.beforeEach(async ({ page }) => {
  // Intercept /api/matches to avoid needing Redis/PandaScore
  await page.route("**/api/matches", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(mockMatches),
    }),
  );
});

test("displays matches with team names and status badges", async ({ page }) => {
  await page.goto("/");

  // Match cards should display team names
  await expect(page.getByText("Navi")).toBeVisible();
  await expect(page.getByText("G2 Esports")).toBeVisible();
  await expect(page.getByText("FaZe Clan")).toBeVisible();
  await expect(page.getByText("Vitality")).toBeVisible();

  // Status badges should be visible
  await expect(page.getByText("LIVE")).toBeVisible();
  await expect(page.getByText("UPCOMING")).toBeVisible();
});

test("displays date separator for today", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByText("Today")).toBeVisible();
});

test("displays match format", async ({ page }) => {
  await page.goto("/");

  const bo3Elements = page.getByText("Bo3");
  await expect(bo3Elements.first()).toBeVisible();
});
