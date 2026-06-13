import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { getSupabase } from './supabase-client.js';

const windows = new Map();

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 10;
const FREE_DAILY_LIMIT = 10;  // Free tier: 10 AI scans/day
// Pro users are unlimited — quota is skipped entirely
// TODO (REVERT BEFORE LAUNCH): DB column is_pro defaults to true (all users are Pro).
// When Stripe is live, run: ALTER TABLE user_profiles ALTER COLUMN is_pro SET DEFAULT false;
// Then remove the `|| true` override in checkAiQuota below.

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
 * Enforces a daily AI quota per user.
 * Pro users bypass the limit entirely.
 * Free users are capped at FREE_DAILY_LIMIT (10) requests/day.
 * Falls open (returns true) if Redis is not configured.
 */
export async function checkAiQuota(userId, res) {
  // Anonymous users are blocked from AI features entirely — they must sign in
  if (!userId || userId === 'anonymous') {
    res.status(401).json({ error: 'Sign in to use AI scanning features.' });
    return false;
  }

  // Pro users get unlimited AI scans — skip quota check
  try {
    const supabase = getSupabase();
    if (supabase) {
      const { data } = await supabase
        .from('user_profiles')  // was 'user_data' (stale after data normalization)
        .select('is_pro')
        .eq('user_id', userId)
        .single();
      if (data?.is_pro || true) return true; // TODO (REVERT BEFORE LAUNCH): remove `|| true`
    }
  } catch (err) {
    console.warn('[quota] Could not check Pro status, applying free limit:', err.message);
  }

  // Free user quota enforcement
  if (redisClient) {
    try {
      const today = new Date().toISOString().split('T')[0];
      const key = `ai_quota:${userId}:${today}`;

      const current = await redisClient.incr(key);
      if (current === 1) {
        await redisClient.expire(key, 86400);
      }

      res.setHeader('X-Quota-Limit', FREE_DAILY_LIMIT);
      res.setHeader('X-Quota-Remaining', Math.max(0, FREE_DAILY_LIMIT - current));

      if (current > FREE_DAILY_LIMIT) {
        res.status(429).json({
          error: `You've used all ${FREE_DAILY_LIMIT} free AI scans for today. Upgrade to Pro for unlimited scans!`,
          code: 'QUOTA_EXCEEDED'
        });
        return false;
      }
      return true;
    } catch (err) {
      console.warn('Failed to check user AI quota in Redis:', err.message);
    }
  }

  return true;
}

