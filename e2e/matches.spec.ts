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
          { name: "Navi", logoUrl: null, score: 1, isWinner: false },
          { name: "G2 Esports", logoUrl: null, score: 0, isWinner: false },
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
          { name: "FaZe Clan", logoUrl: null, score: null, isWinner: false },
          { name: "Vitality", logoUrl: null, score: null, isWinner: false },
        ],
        maps: [],
      },
    ],
  },
];

test.beforeEach(async ({ page }) => {
  await page.route("**/api/matches", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(mockTournaments),
    }),
  );
});

test("displays matches with team names and status badges", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByText("Navi")).toBeVisible();
  await expect(page.getByText("G2 Esports")).toBeVisible();
  await expect(page.getByText("FaZe Clan")).toBeVisible();
  await expect(page.getByText("Vitality")).toBeVisible();

  await expect(page.getByText("LIVE", { exact: true })).toBeVisible();
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
