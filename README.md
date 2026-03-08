# S-Tier

CS2 match tracker that aggregates tournament matches from Grid API, with per-map round scores.

## Architecture

```
┌──────────────────────────────────────────┐
│  docker-compose (internal network)       │
│                                          │
│  ┌─────────┐  ┌────────┐  ┌──────────┐  │
│  │  app     │──│ redis  │──│  worker  │  │
│  │ (Next.js)│  │ (6379) │  │ (cron)   │  │
│  └─────────┘  └────────┘  └──────────┘  │
└──────────────────────────────────────────┘
```

- **app** — Next.js server. Reads matches from Redis cache, falls back to Grid API if cache is empty.
- **worker** — Background process. Fetches Grid API every 60s and writes to Redis.
- **redis** — Cache layer. Not exposed externally, data persisted with a Docker volume.

## Getting Started

### Prerequisites

- Docker and Docker Compose
- Grid API key

### Setup

1. Copy environment variables:

```bash
cp .env.example .env
```

2. Fill in your API keys in `.env`.

3. Start all services:

```bash
docker compose up --build
```

The app is available at `http://localhost:3001`.

### Development (without Docker)

1. Install dependencies:

```bash
npm install
```

2. Start a local Redis instance:

```bash
# With Homebrew (macOS)
brew install redis
brew services start redis

# Or with Docker (just Redis, not the full stack)
docker run -d -p 6379:6379 redis:7-alpine
```

3. Start the worker and dev server in separate terminals:

```bash
# Terminal 1 — worker
npx tsx worker/refresh.ts

# Terminal 2 — Next.js dev server
npm run dev
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `GRID_API_KEY` | Grid API key |
| `REDIS_URL` | Redis connection URL (default: `redis://localhost:6379`) |

## Project Structure

```
src/
  app/api/matches/         API route (Redis-first, Grid fallback)
  app/api/tournament-index/ Tournament index endpoint
  components/              React components
  config/                  Tournament IDs whitelist
  lib/
    grid/                  Grid API clients, queries, mappers, types
    redis/                 Redis client and cache constants
  types/                   Shared TypeScript types
worker/
  refresh.ts               Background cache refresh script
```
