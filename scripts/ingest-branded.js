#!/usr/bin/env node
// scripts/ingest-branded.js
// Loads curated branded foods into the Supabase foods table with a priority boost.
//
// Usage:
//   SUPABASE_URL=https://... SUPABASE_SERVICE_ROLE_KEY=... node scripts/ingest-branded.js

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Priority boost so curated branded items rank at the top of their query.
const CURATED_PRIORITY = 20;

async function main() {
  const path = join(__dirname, 'branded-foods.json');
  console.log(`Reading branded foods from: ${path}`);
  const items = JSON.parse(readFileSync(path, 'utf-8'));
  console.log(`Found ${items.length} branded foods to ingest`);

  // Map each item to a foods-table row.
  // Each food is stored as 1 serving with per-serving macros, matching how
  // the app logs (multiplier = quantity of servings).
  const rows = items.map(it => ({
    name: it.name,
    brand: it.brand || '',
    serving: it.serving || '1 serving',
    s_qty: 1,
    s_unit: 'serving',
    cal: it.cal || 0,
    p: it.p || 0,
    c: it.c || 0,
    f: it.f || 0,
    fiber: it.fiber || 0,
    sugars: it.sugars || 0,
    sat: it.sat || 0,
    sodium: it.sodium || 0,
    potassium: it.potassium || 0,
    calcium: it.calcium || 0,
    source: 'curated',
    priority: CURATED_PRIORITY,
  }));

  // Upsert on a deterministic key. The foods table's unique constraint is on
  // usda_fdc_id (null for curated), so we de-dupe by deleting existing curated
  // rows with the same name first, then insert. This keeps re-runs idempotent.
  const names = rows.map(r => r.name);
  const { error: delErr } = await supabase
    .from('foods')
    .delete()
    .eq('source', 'curated')
    .in('name', names);
  if (delErr) {
    console.error('Cleanup of existing curated rows failed:', delErr.message);
    process.exit(1);
  }

  const BATCH = 100;
  let inserted = 0;
  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH);
    const { error } = await supabase.from('foods').insert(batch);
    if (error) {
      console.error(`Batch ${i}-${i + batch.length} failed:`, error.message);
      process.exit(1);
    }
    inserted += batch.length;
  }

  console.log(`\nDone! ${inserted} curated branded foods inserted (priority ${CURATED_PRIORITY}).`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
