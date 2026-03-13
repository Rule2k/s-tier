import { test, expect } from "@playwright/test";

const today = new Date().toISOString();

const mockTournaments = [
  {
    id: "828791",
    name: "BLAST Premier Spring 2025",
    logoUrl: null,
    matches: [
      {
        id: "1",
        status: "running",
        scheduledAt: today,
        format: "Bo3",
        teams: [
          { name: "Navi", shortName: "NAVI", logoUrl: null, score: 1, isWinner: false },
          { name: "G2 Esports", shortName: "G2", logoUrl: null, score: 0, isWinner: false },
        ],
        maps: [
          {
            mapNumber: 1,
            mapName: "mirage",
            status: "finished",
            scores: [13, 8],
            sides: ["terrorists", "counter-terrorists"],
          },
        ],
      },
      {
        id: "2",
        status: "not_started",
        scheduledAt: today,
        format: "Bo3",
        teams: [
          { name: "FaZe Clan", shortName: "FaZe", logoUrl: null, score: null, isWinner: false },
          { name: "Vitality", shortName: "VIT", logoUrl: null, score: null, isWinner: false },
        ],
        maps: [],
      },
    ],
  },
];

test.beforeEach(async ({ page }) => {
  await page.route("**/api/tournaments**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        tournaments: mockTournaments,
        hasMore: false,
        total: mockTournaments.length,
      }),
    }),
  );
});

test("displays matches with team names and status badges", async ({ page }) => {
  await page.goto("/");

  // Wait for match data to render
  await page.waitForSelector("text=Bo3");

  // Each team name renders in two spans (shortName + fullName)
  for (const name of ["Navi", "G2", "FaZe", "Vitality"]) {
    expect(await page.locator(`text=${name}`).count()).toBeGreaterThanOrEqual(1);
  }

  // Status badges render in two spans (mobile + desktop labels)
  expect(await page.locator("text=LIVE").count()).toBeGreaterThanOrEqual(1);
  expect(await page.locator("text=UPCOMING").count()).toBeGreaterThanOrEqual(1);
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
