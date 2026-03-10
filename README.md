# S-Tier

CS2 match tracker built on top of Grid APIs, with Redis-backed caching, background refresh, tournament navigation, and per-map score details.

## Overview

S-Tier is designed around a simple idea: keep the UI fast and predictable by reading precomputed tournament data from Redis whenever possible, while a worker continuously refreshes tournament and match state in the background.

The result is a small system with three clear responsibilities:

- `app`: renders the UI and exposes API routes for tournament data
- `worker`: fetches Grid data on a schedule and populates Redis
- `redis`: stores the tournament index, tournament payloads, and per-series state

## Architecture

```text
┌────────────────────────────────────────────────────────────┐
│ Docker Compose / local stack                              │
│                                                            │
│  ┌──────────────┐      ┌──────────────┐      ┌──────────┐  │
│  │ Next.js app  │─────▶│    Redis     │◀─────│  worker  │  │
│  │ + API routes │      │ cache/store  │      │ refresh  │  │
│  └──────────────┘      └──────────────┘      └──────────┘  │
└────────────────────────────────────────────────────────────┘
```

### Runtime data flow

1. The worker fetches tournament series from Grid Central.
2. The worker fetches live series state for relevant matches from Grid Live.
3. The worker builds normalized tournament objects and writes them to Redis.
4. The app reads tournaments from Redis through `/api/matches`.
5. If Redis is missing a tournament, the API route rebuilds it on demand from Grid.
6. The frontend uses React Query to poll and cache API responses in the browser.

## Technical solutions

### 1. Redis-first API layer

The app does not query Grid directly from the browser. Instead:

- `/api/matches` returns normalized tournament payloads
- `/api/tournament-index` returns lightweight tournament summaries
- Redis is used as the first read layer for both endpoints

This keeps the UI simple and avoids leaking upstream API complexity into React components.

### 2. Background refresh instead of heavy client polling

The worker in [`worker/refresh.ts`](./worker/refresh.ts) refreshes the dataset every 60 seconds.

It is responsible for:

- rebuilding the tournament index
- refreshing per-series live state
- storing normalized tournaments with status-aware TTLs

This reduces API load and keeps the app responsive even when multiple tournaments are displayed.

It also exists to stay within Grid rate limits. At the time of writing, the relevant limits are:

- Grid `Series State`: 180 requests per minute overall
- Grid `Series State`: 6 requests per minute per series
- Grid `Central Data`: 20 requests per minute

Without Redis and background refresh, a client-driven approach would make it much easier to exceed those limits, especially when multiple users are watching the same tournaments or when several live series are displayed at once.

### 3. Status-aware cache TTLs

Redis TTLs are not fixed for every tournament. They depend on match state:

- running tournament: 60s
- upcoming tournament: 120s
- finished tournament: 7 days
- finished match state: 7 days

The rules live in [`src/lib/redis/keys.ts`](./src/lib/redis/keys.ts).

The cache is not only a performance optimization. It is also a rate-limit protection layer in front of Grid:

- the tournament index is cached to avoid repeated Central Data reads
- tournament payloads are cached so the app can serve repeated requests without rehydrating everything from Grid
- per-series state is cached so live polling stays bounded even when the same series is requested repeatedly

### 4. Small, testable domain helpers

A lot of logic has been extracted into small pure utilities under `src/lib/` so it can be reused and unit-tested independently:

- tournament selection and sorting
- tournament status and summary computation
- match helpers such as `isStartingSoon`, `getPlayedMaps`, and `getMapWinnerIndex`
- team extraction and tournament filtering

This keeps React components focused on presentation rather than business rules.

### 5. Split Grid integration by responsibility

Grid integration is intentionally split into focused modules:

- fetch tournament series from Grid Central
- fetch live series state from Grid Live
- map Grid responses into internal match/tournament objects

The public entry point remains [`src/lib/grid/fetchTournaments.ts`](./src/lib/grid/fetchTournaments.ts), which now re-exports focused helpers rather than owning all logic itself.

### 6. React Query for frontend data consistency

The frontend uses React Query to manage remote state:

- tournament list polling every 60 seconds
- tournament index caching with a longer stale window

This avoids ad-hoc fetch logic in components and keeps refresh behavior explicit.

## Frontend architecture

### Main UI flow

- [`src/app/page.tsx`](./src/app/page.tsx): screen composition and team filtering
- [`src/hooks/useTournamentNavigation.ts`](./src/hooks/useTournamentNavigation.ts): merge default and lazily loaded tournaments, previous/next navigation
- [`src/components/tournament/TournamentTimeline.tsx`](./src/components/tournament/TournamentTimeline.tsx): timeline of tournament blocks
- [`src/components/tournament/TournamentBlock.tsx`](./src/components/tournament/TournamentBlock.tsx): tournament header, collapse state, date groups
- [`src/components/timeline/MatchCard.tsx`](./src/components/timeline/MatchCard.tsx): match presentation and scoreboard layout

### UI behavior implemented in the app

- sticky tournament headers
- sticky date separators inside tournament blocks
- collapsible tournaments
- team-based filtering without corrupting tournament-level status
- live/upcoming/finished visual states

## Backend and data modules

### API routes

- [`src/app/api/matches/route.ts`](./src/app/api/matches/route.ts)
  - returns default tournaments
  - supports `?tournamentId=...`
  - reads Redis first, falls back to Grid when needed

- [`src/app/api/tournament-index/route.ts`](./src/app/api/tournament-index/route.ts)
  - returns the tournament summary index

### Grid integration

- [`src/lib/grid/fetchTournamentSeries.ts`](./src/lib/grid/fetchTournamentSeries.ts)
- [`src/lib/grid/fetchSeriesStates.ts`](./src/lib/grid/fetchSeriesStates.ts)
- [`src/lib/grid/buildTournament.ts`](./src/lib/grid/buildTournament.ts)
- [`src/lib/grid/mappers/mapMatch.ts`](./src/lib/grid/mappers/mapMatch.ts)

### Tournament domain helpers

- [`src/lib/tournaments/selectRelevantTournaments.ts`](./src/lib/tournaments/selectRelevantTournaments.ts)
- [`src/lib/tournaments/fetchTournamentSeriesIndex.ts`](./src/lib/tournaments/fetchTournamentSeriesIndex.ts)
- [`src/lib/tournaments/getTournamentStatus.ts`](./src/lib/tournaments/getTournamentStatus.ts)
- [`src/lib/tournaments/getTournamentSummary.ts`](./src/lib/tournaments/getTournamentSummary.ts)
- [`src/lib/tournaments/filterTournamentsByTeam.ts`](./src/lib/tournaments/filterTournamentsByTeam.ts)

### Match domain helpers

- [`src/lib/matches/groupByDate.ts`](./src/lib/matches/groupByDate.ts)
- [`src/lib/matches/formatDateRange.ts`](./src/lib/matches/formatDateRange.ts)
- [`src/lib/matches/isStartingSoon.ts`](./src/lib/matches/isStartingSoon.ts)
- [`src/lib/matches/getPlayedMaps.ts`](./src/lib/matches/getPlayedMaps.ts)
- [`src/lib/matches/getMapWinnerIndex.ts`](./src/lib/matches/getMapWinnerIndex.ts)

## Testing strategy

Tests are organized in local `__tests__` folders instead of living next to production files.

Current test layers:

- unit tests for pure helpers in `src/lib/**/__tests__`
- component tests for UI behavior in `src/components/**/__tests__`
- hook tests in `src/hooks/__tests__`
- route tests in `src/app/api/**/__tests__`

Tooling:

- Vitest + Testing Library for unit/component tests
- jsdom for UI tests
- Playwright for E2E

## Project structure

```text
src/
  app/
    api/
      matches/
      tournament-index/
    layout.tsx
    page.tsx
    providers.tsx
  components/
    layout/
    timeline/
    tournament/
    ui/
  context/
    TeamFilterContext.tsx
  hooks/
    useTournamentNavigation.ts
    useTournaments.ts
  lib/
    grid/
    matches/
    redis/
    teams/
    tournaments/
  test/
    fixtures/
    setup.ts
  types/
worker/
  refresh.ts
```

## Environment variables

| Variable | Description |
|----------|-------------|
| `GRID_API_KEY` | Grid API key used for Central and Live API calls |
| `REDIS_URL` | Redis connection URL |

See [`.env.example`](./.env.example) for the expected format.

## Scripts

```bash
npm run dev
npm run build
npm run lint
npm test
npm run test:watch
npm run test:e2e
```

## Local development

### With Docker

```bash
cp .env.example .env
docker compose up --build
```

The app is available at `http://localhost:3001`.

### Without Docker

1. Install dependencies:

```bash
npm install
```

2. Start Redis locally:

```bash
docker run -d -p 6379:6379 redis:7-alpine
```

3. Start the worker and app in separate terminals:

```bash
npx tsx worker/refresh.ts
npm run dev
```
