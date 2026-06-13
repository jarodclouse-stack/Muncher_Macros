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
 * Strict auth — requires a valid Bearer token.
 * Returns the user object on success, or sends 401 and returns null.
 * Use on all AI scan endpoints (ai-label, ai-describe, ai-lookup, etc.)
 */
export async function requireAuth(req, res) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';

  if (!token) {
    res.status(401).json({ error: 'Authentication required' });
    return null;
  }

  const supabase = getAuthClient();
  if (!supabase) {
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

/**
 * Guest-permissive auth — verifies token if present, but allows unauthenticated
 * requests through as { id: 'anonymous' }.
 * Use on search endpoints (db-search, off-search) where guests can browse foods.
 */
export async function allowGuest(req, res) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';

  if (!token) return { id: 'anonymous' };

  const supabase = getAuthClient();
  if (!supabase) return { id: 'anonymous' };

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
