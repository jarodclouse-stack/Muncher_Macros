// api/db-search.js — Search our own foods database with fuzzy matching
import { createClient } from '@supabase/supabase-js';
import { setCors, handlePreflight } from './_lib/cors.js';
import { validateQuery, readBody } from './_lib/validate.js';
import { rateLimit } from './_lib/rate-limit.js';
import { requireAuth } from './_lib/auth.js';

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
  if (!rateLimit(req, res)) return;

  const user = await requireAuth(req, res);
  if (!user) return;

  const body = await readBody(req);
  const query = validateQuery(body.query);
  if (!query) return res.status(400).json({ error: 'Missing or invalid query' });

  try {
    const supabase = getSupabase();

    // Check for synonym expansion (Phase 2 — no-op if table doesn't exist yet)
    let synonymText = null;
    try {
      const { data: syn } = await supabase
        .from('search_synonyms')
        .select('expands')
        .eq('term', query.toLowerCase())
        .maybeSingle();
      if (syn?.expands) synonymText = syn.expands;
    } catch {
      // Table may not exist yet — skip synonym expansion
    }

    // Call the search function
    const rpcParams = { query_text: query, result_limit: 25 };

    // If we have a synonym, search both original and expanded
    let results = [];
    const { data, error } = await supabase.rpc('search_foods', rpcParams);
    if (error) throw error;
    results = data || [];

    // If synonym found, also search with expanded term and merge
    if (synonymText) {
      const { data: synData } = await supabase.rpc('search_foods', {
        query_text: synonymText,
        result_limit: 25
      });
      if (synData?.length) {
        // Merge and dedupe by id, keep best rank_score
        const seen = new Set(results.map(r => r.id));
        for (const r of synData) {
          if (!seen.has(r.id)) {
            results.push(r);
            seen.add(r.id);
          }
        }
        // Re-sort by rank_score
        results.sort((a, b) => (b.rank_score || 0) - (a.rank_score || 0));
        results = results.slice(0, 25);
      }
    }

    const foods = results.map(mapToFoodShape);
    return res.status(200).json({ foods, expandedQuery: synonymText || query });
  } catch (err) {
    console.error('db-search error:', err?.message || err);
    return res.status(500).json({ error: 'Search failed', foods: [] });
  }
}
