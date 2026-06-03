// api/_lib/supabase-client.js
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

let _supabase = null;

export function getSupabase() {
  if (!_supabase) {
    const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
    if (!url || !key) return null;
    _supabase = createClient(url, key, {
      auth: {
        persistSession: false
      }
    });
  }
  return _supabase;
}

function hashKey(str) {
  return crypto.createHash('md5').update(str.trim().toLowerCase()).digest('hex');
}

/**
 * Checks if a cached result exists for a given query and category.
 * Returns null if not found or on database errors.
 */
export async function checkCache(category, queryText) {
  const supabase = getSupabase();
  if (!supabase || !queryText) return null;
  
  const key = `${category}:${hashKey(queryText)}`;
  try {
    const { data, error } = await supabase
      .from('search_cache')
      .select('results')
      .eq('query_hash', key)
      .maybeSingle();
      
    if (error) {
      console.warn(`[cache] Error checking search_cache for ${category}:`, error.message);
      return null;
    }
    return data?.results || null;
  } catch (err) {
    console.warn(`[cache] Cache read failed for ${category} (table may not exist):`, err.message);
    return null;
  }
}

/**
 * Saves a result to the search_cache table.
 * Fails silently if the table does not exist or has errors.
 */
export async function saveToCache(category, queryText, results) {
  const supabase = getSupabase();
  if (!supabase || !queryText || !results) return;
  
  const key = `${category}:${hashKey(queryText)}`;
  try {
    const { error } = await supabase
      .from('search_cache')
      .upsert({
        query_hash: key,
        query: queryText.trim(),
        results,
        created_at: new Date().toISOString()
      }, { onConflict: 'query_hash' });
      
    if (error) {
      console.warn(`[cache] Error saving search_cache for ${category}:`, error.message);
    }
  } catch (err) {
    console.warn(`[cache] Cache write failed for ${category} (table may not exist):`, err.message);
  }
}
