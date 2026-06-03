#!/usr/bin/env node
// scripts/ingest-branded.js
// Loads curated branded foods into the Supabase foods table with a priority boost.
//
// Usage:
//   SUPABASE_URL=https://... SUPABASE_SERVICE_ROLE_KEY=... node scripts/ingest-branded.js

import { createClient } from '@supabase/supabase-js';
import { readFileSync, readdirSync } from 'fs';
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

// Priority tiers (added to search rank when an item matches a query).
//   FLAGSHIP — the single most iconic item per brand, leads brand searches
//   DEFAULT  — regular menu / catalogue items
//   SIDE     — sauces, biscuits, small add-ons; stay findable but below mains
const FLAGSHIP_PRIORITY = 30;
const CURATED_PRIORITY = 20;
const SIDE_PRIORITY = 12;

// Iconic hero item per brand — leads when someone searches the brand.
const FLAGSHIP_NAMES = new Set([
  'Coca-Cola Classic',
  'Pepsi',
  'Big Mac',
  'Whopper',
  "Wendy's Dave's Single",
  'Popeyes Chicken Sandwich',
  'Chick-fil-A Chicken Sandwich',
  'KFC Original Recipe Chicken Breast',
  'Taco Bell Crunchy Taco',
  'Chipotle Chicken Burrito Bowl',
  'Panda Express Orange Chicken',
  'In-N-Out Double-Double',
  'Five Guys Cheeseburger',
  'Shake Shack ShackBurger (Single)',
  'Starbucks Caffe Latte (Grande)',
  'Dunkin Glazed Donut',
  'Subway Italian B.M.T. (6 inch)',
  "Domino's Hand Tossed Pepperoni Pizza (1 slice)",
  'Pizza Hut Pepperoni Pan Pizza (1 slice)',
  'Wingstop Classic Wings (6 piece, plain)',
  "Arby's Classic Roast Beef",
  'Sonic Cheeseburger',
  'Jack in the Box Jumbo Jack',
  "Raising Cane's Chicken Finger (1)",
  'Whataburger Whataburger',
  "Jersey Mike's Original Italian (Regular)",
  "Jimmy John's Turkey Tom (8 inch)",
]);

// Side items / condiments that should not lead a brand search.
const SIDE_NAMES = new Set([
  "Raising Cane's Cane's Sauce",
  "Raising Cane's Texas Toast",
  'Chipotle Sour Cream',
  'Chipotle Cheese',
  'KFC Biscuit',
  'Popeyes Biscuit',
  'Olive Garden Breadstick',
]);

function priorityFor(name) {
  if (FLAGSHIP_NAMES.has(name)) return FLAGSHIP_PRIORITY;
  if (SIDE_NAMES.has(name)) return SIDE_PRIORITY;
  return CURATED_PRIORITY;
}

async function main() {
  // Load every branded-foods*.json file in this directory and combine them.
  const files = readdirSync(__dirname)
    .filter(f => /^branded-foods.*\.json$/.test(f))
    .sort();
  console.log(`Reading ${files.length} data file(s): ${files.join(', ')}`);

  const combined = [];
  for (const file of files) {
    const data = JSON.parse(readFileSync(join(__dirname, file), 'utf-8'));
    combined.push(...data);
  }

  // De-dupe by name (last occurrence wins).
  const byName = new Map();
  for (const it of combined) byName.set(it.name, it);
  const items = [...byName.values()];
  console.log(`Found ${combined.length} entries, ${items.length} unique branded foods to ingest`);

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
    priority: priorityFor(it.name),
  }));

  // Full re-ingest: delete ALL existing curated rows, then insert fresh.
  // Keeps re-runs fully idempotent regardless of how the data files change.
  const { error: delErr } = await supabase
    .from('foods')
    .delete()
    .eq('source', 'curated');
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
