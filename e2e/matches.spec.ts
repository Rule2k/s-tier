import { test, expect } from "@playwright/test";

const today = new Date().toISOString();

const mockSeries = [
  {
    id: "50",
    name: "BLAST Premier Spring 2025",
    leagueImageUrl: null,
    tier: "s",
    region: "EU",
    beginAt: today,
    endAt: today,
    stages: [
      {
        id: "100",
        name: "Group Stage",
        matches: [
          {
            id: "1",
            status: "running",
            scheduledAt: today,
            format: "Bo3",
            tournament: { id: "100", name: "Group Stage", tier: "s", slug: "group-stage", region: "EU" },
            teams: [
              { name: "Navi", acronym: "NAVI", imageUrl: null, score: 1, isWinner: false },
              { name: "G2 Esports", acronym: "G2", imageUrl: null, score: 0, isWinner: false },
            ],
          },
          {
            id: "2",
            status: "not_started",
            scheduledAt: today,
            format: "Bo3",
            tournament: { id: "100", name: "Group Stage", tier: "s", slug: "group-stage", region: "EU" },
            teams: [
              { name: "FaZe Clan", acronym: "FAZE", imageUrl: null, score: null, isWinner: false },
              { name: "Vitality", acronym: "VIT", imageUrl: null, score: null, isWinner: false },
            ],
          },
        ],
      },
    ],
  },
];

test.beforeEach(async ({ page }) => {
  await page.route("**/api/matches", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(mockSeries),
    }),
  );
});

test("displays matches with team names and status badges", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByText("Navi")).toBeVisible();
  await expect(page.getByText("G2 Esports")).toBeVisible();
  await expect(page.getByText("FaZe Clan")).toBeVisible();
  await expect(page.getByText("Vitality")).toBeVisible();

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
