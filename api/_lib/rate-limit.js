const windows = new Map();

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 10;

export function rateLimit(req, res) {
  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || 'unknown';
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
