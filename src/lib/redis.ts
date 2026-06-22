import Redis from "ioredis";

declare global {
  var redisGlobal: Redis | undefined;
}

const getRedisUrl = () => {
  return process.env.REDIS_URL || "redis://127.0.0.1:6379";
};

export const redis = globalThis.redisGlobal ?? new Redis(getRedisUrl(), {
  maxRetriesPerRequest: 3, // Fail fast after 3 connection retries instead of 20
  enableOfflineQueue: false, // Immediately throw an error if Redis is offline, instead of waiting in queue
  connectTimeout: 5000, // Timeout connection attempts after 5 seconds
});

if (process.env.NODE_ENV !== "production") {
  globalThis.redisGlobal = redis;
}
