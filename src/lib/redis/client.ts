import Redis from "ioredis";

const redis = new Redis(process.env.REDIS_URL ?? "redis://localhost:6379", {
  lazyConnect: true,
  maxRetriesPerRequest: 2,
  connectTimeout: 5_000,
  commandTimeout: 3_000,
  retryStrategy: (times) => Math.min(times * 200, 2000),
});

export default redis;
