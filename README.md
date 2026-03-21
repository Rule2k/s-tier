# S-Tier

CS2 match tracker built on Grid APIs, with Redis-backed caching, priority-based background refresh, tournament navigation, and per-map score details.

## Overview

S-Tier keeps the UI fast by reading precomputed tournament data from Redis, while a background worker continuously refreshes tournament and match state from Grid's GraphQL APIs.

Three services with clear responsibilities:

- **app** — renders the UI and exposes API routes for tournament data
- **worker** — fetches Grid data on a priority-based schedule and populates Redis
- **redis** — stores the tournament index, series metadata, and live match state

## Architecture

```text
┌──────────────────────────────────────────────────────────────┐
│ Docker Compose                                                │
│                                                                │
│  ┌──────────────┐      ┌──────────────┐      ┌─────────────┐  │
│  │ Next.js app  │─────>│    Redis     │<─────│   worker    │  │
│  │ + API routes │      │ cache/store  │      │ scheduler   │  │
│  └──────────────┘      └──────────────┘      └──────┬──────┘  │
│                                                      │         │
│                                              ┌───────▼───────┐ │
│                                              │   Grid APIs   │ │
│                                              │ Central + Live│ │
│                                              └───────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

### Data flow

1. The worker discovers tournaments via Grid Central Data API (paginated GraphQL, filtered by tracked teams).
2. For each tournament, it fetches the full series list and writes normalized data to Redis.
3. A priority-based scheduler polls live series state via Grid Live Data Feed API.
4. The app reads from Redis through `/api/tournaments`.
5. The frontend uses React Query to poll the API every 30 seconds.

## Worker

The worker entry point is [`worker/index.ts`](./worker/index.ts). It runs two loops:

### Discovery loop (every 5 min)

Handled by [`worker/discovery.ts`](./worker/discovery.ts):

- Discovers tournaments where tracked teams participate (server-side filter via team IDs)
- Fetches the full series list for each active tournament
- Skips re-fetching tournaments where all series are finished
- Writes tournament index and series data to Redis
- Prunes stale tournaments no longer in the tracked set

### Series refresh loop (every 15s)

Handled by [`worker/series-refresh.ts`](./worker/series-refresh.ts):

- Uses a priority-based scheduler ([`worker/scheduler.ts`](./worker/scheduler.ts)) to decide which series to poll
- Fetches live state from Grid Live Data Feed API
- Writes series state to Redis

Priority tiers:

| Tier | Interval | Criteria |
|------|----------|----------|
| P0 | 15s | Live matches (`started: true`, `finished: false`) |
| P1 | 2 min | Starting within 30 min (no state yet) |
| P3 | 30 min | Past matches without state (backfill) |
| SKIP | — | Finished, future (>30 min), or stale live (>24h) |

Additional scheduling features:

- Exponential backoff on fetch failures (2^n * 15s, capped at 5 min)
- Demotion to P3 after 10 consecutive failures
- Automatic cleanup of stale "live" matches (>24h since scheduled time → marked finished)

### Rate limiting

Token bucket rate limiter ([`worker/rate-limiter.ts`](./worker/rate-limiter.ts)) enforces Grid API limits:

- Central Data: 20 requests/min
- Live Data Feed: 180 requests/min (global), 6 requests/min (per series)

### Leader election

Only one worker instance runs at a time. Leader election via Redis `SET NX` with a 45s lock TTL, renewed every 15s. See [`worker/lock.ts`](./worker/lock.ts).

## Redis

Key schema and TTLs defined in [`src/shared/redis-keys.ts`](./src/shared/redis-keys.ts).

| Key pattern | Type | TTL |
|---|---|---|
| `s-tier:tournaments` | Sorted Set | None (rewritten each discovery cycle) |
| `s-tier:tournament:{id}` | JSON | None |
| `s-tier:tournament:{id}:series` | Sorted Set | None |
| `s-tier:series:{id}` | JSON | None |
| `s-tier:series:{id}:state` | JSON | None (finished) / 6h (live fallback) |
| `s-tier:meta:*` | String | 1h |
| `s-tier:worker:heartbeat` | String | 2 min |

## API routes

### `GET /api/tournaments`

[`src/app/api/tournaments/route.ts`](./src/app/api/tournaments/route.ts)

Returns tournaments with their matches from Redis.

| Param | Description |
|---|---|
| `id` | Single tournament by ID |
| `limit` | Number of tournaments (default 5, max 20) |
| `offset` | Pagination offset |

Response: `{ tournaments, hasMore, total }`

### `GET /api/health`

[`src/app/api/health/route.ts`](./src/app/api/health/route.ts)

Returns worker health status (heartbeat, discovery timestamp).

## Frontend

### Main UI flow

- [`src/app/page.tsx`](./src/app/page.tsx) — page composition and team filtering
- [`src/hooks/useTournaments.ts`](./src/hooks/useTournaments.ts) — React Query data fetching (30s refetch)
- [`src/hooks/useTournamentNavigation.ts`](./src/hooks/useTournamentNavigation.ts) — pagination and lazy loading
- [`src/components/tournament/TournamentTimeline.tsx`](./src/components/tournament/TournamentTimeline.tsx) — timeline of tournament blocks
- [`src/components/tournament/TournamentBlock.tsx`](./src/components/tournament/TournamentBlock.tsx) — tournament header, collapse state, date groups
- [`src/components/timeline/MatchCard.tsx`](./src/components/timeline/MatchCard.tsx) — match card with scores and map details

### UI features

- Sticky tournament headers and date separators
- Collapsible tournament blocks
- Team-based filtering
- Live / upcoming / finished visual states

### Utility functions

Match helpers in [`src/utils/matches/`](./src/utils/matches/):
`groupByDate`, `formatDateRange`, `isStartingSoon`, `getPlayedMaps`, `getMapWinnerIndex`

Tournament helpers in [`src/utils/tournaments/`](./src/utils/tournaments/):
`getTournamentStatus`, `getTournamentSummary`, `filterTournamentsByTeam`, `buildTimelineRows`, `sortTournamentsByStartDate`, and others.

## Testing

Tests live in `__tests__/` directories next to the code they test.

- **Unit tests** — pure helpers in `src/utils/**/__tests__/`
- **Component tests** — UI behavior in `src/components/**/__tests__/`
- **Hook tests** — `src/hooks/__tests__/`
- **Route tests** — `src/app/api/**/__tests__/`
- **Worker tests** — `worker/__tests__/`
- **E2E tests** — Playwright in `e2e/`

Tooling: Vitest + Testing Library (jsdom), Playwright (Chromium only).

## Project structure

```text
src/
  app/
    api/
      health/
      tournaments/
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
    redis/
  shared/
    types/
    redis-keys.ts
    config.ts
    worker-runtime.ts
  utils/
    matches/
    teams/
    tournaments/
  types/
    match.ts
  test/
    fixtures/
    setup.ts
worker/
  index.ts
  config.ts
  discovery.ts
  series-refresh.ts
  scheduler.ts
  redis-writer.ts
  rate-limiter.ts
  lock.ts
  logger.ts
  grid/
    client.ts
    central-data.ts
    series-state.ts
    queries.ts
  types/
    grid.ts
    rate-limiter.ts
    scheduler.ts
e2e/
  matches.spec.ts
```

## Environment variables

| Variable | Description |
|---|---|
| `GRID_API_KEY` | Grid API key (Central Data + Live Data Feed) |
| `REDIS_URL` | Redis connection URL |

See [`.env.example`](./.env.example).

## Scripts

```bash
npm run dev          # Start Next.js dev server
npm run build        # Production build
npm run lint         # ESLint
npm test             # Unit tests (Vitest)
npm run test:watch   # Watch mode
npm run test:e2e     # E2E tests (Playwright)
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
npx tsx worker/index.ts
npm run dev
```
