# S-Tier

CS2 match tracker that aggregates S-tier and A-tier tournament matches from PandaScore.

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

- **app** — Next.js server. Reads matches from Redis cache, falls back to PandaScore if cache is empty.
- **worker** — Background process. Fetches PandaScore every 60s and writes to Redis (TTL 120s).
- **redis** — Cache layer. Not exposed externally, data persisted with a Docker volume.

## Getting Started

### Prerequisites

- Docker and Docker Compose
- PandaScore API key

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
| `PANDASCORE_API_KEY` | PandaScore API key |
| `REDIS_URL` | Redis connection URL (default: `redis://localhost:6379`) |

## Project Structure

```
src/
  app/api/matches/    API route (Redis-first, PandaScore fallback)
  components/         React components
  lib/
    pandascore/       PandaScore client, mappers, types
    redis/            Redis client and cache constants
    grid/             Grid API integration
  types/              Shared TypeScript types
worker/
  refresh.ts          Background cache refresh script
```
