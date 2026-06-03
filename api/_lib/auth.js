// api/_lib/auth.js — Verify the caller is a logged-in Supabase user
import { createClient } from '@supabase/supabase-js';

let _supabase = null;

function getAuthClient() {
  if (!_supabase) {
    const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const key = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
    if (!url || !key) return null;
    _supabase = createClient(url, key);
  }
  return _supabase;
}

/**
 * Extracts the Bearer token from the Authorization header and verifies
 * it against Supabase Auth. Returns the user object on success, or
 * sends a 401 response and returns null on failure.
 */
export async function requireAuth(req, res) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';

  if (!token) {
    res.status(401).json({ error: 'Missing authorization token' });
    return null;
  }

  const supabase = getAuthClient();
  if (!supabase) {
    // If Supabase credentials aren't configured, allow the request through
    // (local dev without auth setup). Log a warning.
    console.warn('[auth] Supabase credentials not configured — skipping auth check');
    return { id: 'anonymous' };
  }

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      res.status(401).json({ error: 'Invalid or expired token' });
      return null;
    }
    return user;
  } catch (err) {
    console.error('[auth] Token verification failed:', err.message);
    res.status(401).json({ error: 'Authentication failed' });
    return null;
  }
}
