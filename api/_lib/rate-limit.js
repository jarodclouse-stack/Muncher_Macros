import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const windows = new Map();

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 10;
const DAILY_LIMIT = 50;

let ratelimit = null;
let redisClient = null;

if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  try {
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
    redisClient = redis;
    ratelimit = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(MAX_REQUESTS, "60 s"),
      analytics: false,
    });
  } catch (err) {
    console.error("Failed to initialize Upstash Redis:", err);
  }
}

export async function rateLimit(req, res) {
  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || 'unknown';

  if (ratelimit) {
    try {
      const result = await ratelimit.limit(ip);
      res.setHeader('X-RateLimit-Limit', result.limit);
      res.setHeader('X-RateLimit-Remaining', result.remaining);
      res.setHeader('X-RateLimit-Reset', result.reset);
      if (!result.success) {
        res.setHeader('Retry-After', Math.ceil((result.reset - Date.now()) / 1000));
        res.status(429).json({ error: 'Too many requests. Please wait a minute.' });
        return false;
      }
      return true;
    } catch (err) {
      console.warn("Upstash Rate Limiting error, falling back to in-memory:", err);
    }
  }

  const now = Date.now();

  let entry = windows.get(ip);
  if (!entry || now - entry.start > WINDOW_MS) {
    entry = { start: now, count: 0 };
    windows.set(ip, entry);
  }

  entry.count++;

  if (entry.count > MAX_REQUESTS) {
    res.setHeader('Retry-After', Math.ceil((entry.start + WINDOW_MS - now) / 1000));
    res.status(429).json({ error: 'Too many requests. Please wait a minute.' });
    return false;
  }

  if (windows.size > 10_000) {
    const cutoff = now - WINDOW_MS;
    for (const [key, val] of windows) {
      if (val.start < cutoff) windows.delete(key);
    }
  }

  return true;
}

/**
 * Enforces a daily limit of 50 AI requests per user using Redis.
 * Returns true if the user is allowed to proceed, false otherwise.
 * If Redis is not configured, it fails open (returns true).
 */
export async function checkAiQuota(userId, res) {
  if (!userId || userId === 'anonymous') return true;

  if (redisClient) {
    try {
      const today = new Date().toISOString().split('T')[0];
      const key = `ai_quota:${userId}:${today}`;

      const current = await redisClient.incr(key);
      if (current === 1) {
        // Expire key at the end of the day, or simply set 24h retention
        await redisClient.expire(key, 86400);
      }

      res.setHeader('X-Quota-Limit', DAILY_LIMIT);
      res.setHeader('X-Quota-Remaining', Math.max(0, DAILY_LIMIT - current));

      if (current > DAILY_LIMIT) {
        res.status(429).json({
          error: `Daily AI limit of ${DAILY_LIMIT} requests reached. Please try again tomorrow.`
        });
        return false;
      }
      return true;
    } catch (err) {
      console.warn("Failed to check user AI quota in Redis:", err.message);
    }
  }

  return true;
}

