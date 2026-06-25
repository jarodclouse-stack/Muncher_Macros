// api/db-search.js — Search our own foods database with fuzzy matching
import { createClient } from '@supabase/supabase-js';
import { setCors, handlePreflight } from '../cors.js';
import { validateQuery, readBody } from '../validate.js';
import { rateLimit } from '../rate-limit.js';
import { allowGuest } from '../auth.js';

// ─── In-memory synonym cache ──────────────────────────────────────────────────
// The search_synonyms table is 262 static rows. Loading it into memory on first
// request eliminates a DB round trip on every single search query.
let _synonymMap = null;
let _synonymLoadedAt = 0;
const SYNONYM_TTL_MS = 60 * 60 * 1000; // refresh hourly

async function getSynonymMap(supabase) {
  const now = Date.now();
  if (_synonymMap && now - _synonymLoadedAt < SYNONYM_TTL_MS) return _synonymMap;
  try {
    const { data } = await supabase.from('search_synonyms').select('term, expands');
    if (data) {
      _synonymMap = new Map(data.map(r => [r.term.toLowerCase(), r.expands]));
      _synonymLoadedAt = now;
    }
  } catch {
    _synonymMap = _synonymMap || new Map();
  }
  return _synonymMap;
}

// ─── Result cache helpers (reuse search_cache table) ─────────────────────────
async function getCached(supabase, cacheKey) {
  try {
    const { data } = await supabase
      .from('search_cache')
      .select('results')
      .eq('query_hash', `db:${cacheKey}`)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();
    return data?.results || null;
  } catch { return null; }
}

async function setCached(supabase, cacheKey, results) {
  if (!results?.length) return;
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  try {
    await supabase.from('search_cache').upsert({
      query_hash: `db:${cacheKey}`,
      query: cacheKey,
      results,
      created_at: new Date().toISOString(),
      expires_at: expiresAt,
    }, { onConflict: 'query_hash' });
    // Lazy cleanup: ~5% chance to purge expired rows
    if (Math.random() < 0.05) {
      supabase.rpc('cleanup_expired_search_cache').catch(() => {});
    }
  } catch { /* cache write is best-effort */ }
}

const round1 = v => Math.round((Number(v) || 0) * 10) / 10;
const round2 = v => Math.round((Number(v) || 0) * 100) / 100;
const round3 = v => Math.round((Number(v) || 0) * 1000) / 1000;

function mapToFoodShape(row) {
  return {
    name: row.name,
    brand: row.brand || undefined,
    serving: row.serving,
    sQty: Number(row.s_qty) || 100,
    sUnit: row.s_unit || 'g',
    cal: Math.round(Number(row.cal) || 0),
    p: round1(row.p),
    c: round1(row.c),
    f: round1(row.f),
    fb: round1(row.fiber),
    fiber: round1(row.fiber),
    Fiber: round1(row.fiber),
    sugars: round1(row.sugars),
    sat: round1(row.sat),
    mono: round1(row.mono),
    poly: round1(row.poly),
    trans: round1(row.trans),
    chol: Math.round(Number(row.chol) || 0),
    Sodium: Math.round(Number(row.sodium) || 0),
    Potassium: Math.round(Number(row.potassium) || 0),
    Calcium: Math.round(Number(row.calcium) || 0),
    Magnesium: Math.round(Number(row.magnesium) || 0),
    Iron: round1(row.iron),
    Zinc: round1(row.zinc),
    Phosphorus: Math.round(Number(row.phosphorus) || 0),
    Manganese: round2(row.manganese),
    Selenium: round1(row.selenium),
    Copper: round3(row.copper),
    Chloride: Math.round(Number(row.chloride) || 0),
    Iodine: round1(row.iodine),
    Chromium: round1(row.chromium),
    Molybdenum: round1(row.molybdenum),
    Fluoride: round1(row.fluoride),
    'Vitamin C': round1(row.vitamin_c),
    'Vitamin A': Math.round(Number(row.vitamin_a) || 0),
    'Vitamin D': round1(row.vitamin_d),
    'Vitamin E': round1(row.vitamin_e),
    'Vitamin K': round1(row.vitamin_k),
    'Vitamin B1': round2(row.vitamin_b1),
    'Vitamin B2': round2(row.vitamin_b2),
    'Vitamin B3': round2(row.vitamin_b3),
    'Vitamin B5': round2(row.vitamin_b5),
    'Vitamin B6': round2(row.vitamin_b6),
    'Vitamin B7': round2(row.vitamin_b7),
    'Vitamin B9': round2(row.vitamin_b9),
    'Vitamin B12': round2(row.vitamin_b12),
    barcode: row.barcode || undefined,
    _src: 'db',
  };
}

// ── Personal frequency map ────────────────────────────────────────────────────
// Counts how many times each food name appears in the user's diary (last 60
// days). Runs in parallel with the main search RPC — zero added latency for
// authenticated users. Anonymous users get an empty map (no boost).
async function getFrequentFoodNames(supabase, userId) {
  if (!userId || userId === 'anonymous') return new Map();
  try {
    const since = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const { data } = await supabase
      .from('diary_entries')
      .select('food_log')
      .eq('user_id', userId)
      .gte('entry_date', since)
      .not('food_log', 'is', null);

    if (!data?.length) return new Map();

    const freq = new Map();
    for (const row of data) {
      if (!Array.isArray(row.food_log)) continue;
      for (const item of row.food_log) {
        if (item?.name) {
          const key = item.name.toLowerCase();
          freq.set(key, (freq.get(key) || 0) + 1);
        }
      }
    }
    return freq;
  } catch {
    return new Map();
  }
}

// Lazy-init Supabase client (server-side, service role)
let _supabase = null;
function getSupabase() {
  if (!_supabase) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    _supabase = createClient(url, key);
  }
  return _supabase;
}

export default async function handler(req, res) {
  setCors(req, res);
  if (handlePreflight(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!(await rateLimit(req, res))) return;

  const user = await allowGuest(req, res);
  if (!user) return;

  const body = await readBody(req);
  const query = validateQuery(body.query);
  if (!query) return res.status(400).json({ error: 'Missing or invalid query' });

  try {
    const supabase = getSupabase();
    const isBarcode = /^\d+$/.test(query);

    // ── Personal frequency promise (fires now, awaited later) ─────────────────
    // Runs in parallel with synonym lookup + search RPC — zero added latency.
    // Returns a name→count map of foods this user has logged in the last 60 days.
    const freqPromise = !isBarcode
      ? getFrequentFoodNames(supabase, user?.id)
      : Promise.resolve(new Map());

    // ── 1. Synonyms from memory (no DB round trip after first load) ──────────
    const synonymMap = await getSynonymMap(supabase);
    const synonymText = !isBarcode ? (synonymMap.get(query.toLowerCase()) || null) : null;

    // ── 2. Cache check ────────────────────────────────────────────────────────
    const cacheKey = synonymText ? `${query}::${synonymText}` : query;
    const cached = await getCached(supabase, cacheKey);
    if (cached) {
      return res.status(200).json({
        foods: cached.map(mapToFoodShape),
        expandedQuery: synonymText || query,
        _cached: true,
      });
    }

    // ── 3. Search ─────────────────────────────────────────────────────────────
    let results = [];

    if (isBarcode) {
      const { data, error } = await supabase
        .from('foods')
        .select('*')
        .eq('barcode', query)
        .limit(1);
      if (error) throw error;
      results = data || [];
    } else if (synonymText) {
      // Run original + synonym in parallel — eliminates sequential delay
      const [main, syn] = await Promise.all([
        supabase.rpc('search_foods', { query_text: query,       result_limit: 25 }),
        supabase.rpc('search_foods', { query_text: synonymText, result_limit: 25 }),
      ]);
      if (main.error) throw main.error;
      results = main.data || [];
      if (syn.data?.length) {
        const seen = new Set(results.map(r => r.id));
        for (const r of syn.data) {
          if (!seen.has(r.id)) { results.push(r); seen.add(r.id); }
        }
        results.sort((a, b) => (b.rank_score || 0) - (a.rank_score || 0));
        results = results.slice(0, 25);
      }
    } else {
      const { data, error } = await supabase.rpc('search_foods', {
        query_text: query,
        result_limit: 25,
      });
      if (error) throw error;
      results = data || [];
    }

    // ── 4. Cache results for next time ────────────────────────────────────────
    // Fire-and-forget: don't await, keeps response fast
    setCached(supabase, cacheKey, results);

    // ── 5. Personal frequency boost ───────────────────────────────────────────
    // Reorder results so foods this user logs frequently float to the top.
    // freqPromise was started in parallel — should already be resolved by now.
    const freqMap = await freqPromise;
    if (freqMap.size > 0) {
      results.sort((a, b) => {
        const aFreq = freqMap.get((a.name || '').toLowerCase()) || 0;
        const bFreq = freqMap.get((b.name || '').toLowerCase()) || 0;
        if (aFreq !== bFreq) return bFreq - aFreq;
        return (b.rank_score || 0) - (a.rank_score || 0);
      });
    }

    const foods = results.map(mapToFoodShape);
    return res.status(200).json({ foods, expandedQuery: synonymText || query });
  } catch (err) {
    console.error('db-search error:', err?.message || err);
    return res.status(500).json({ error: 'Search failed', foods: [] });
  }
}
