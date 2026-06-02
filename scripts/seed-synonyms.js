#!/usr/bin/env node
// scripts/seed-synonyms.js
// Loads food search synonyms into the Supabase search_synonyms table.
//
// Usage:
//   SUPABASE_URL=https://... SUPABASE_SERVICE_ROLE_KEY=... node scripts/seed-synonyms.js

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

async function main() {
  const synonymsPath = join(__dirname, 'synonyms.json');
  console.log(`Reading synonyms from: ${synonymsPath}`);

  const synonyms = JSON.parse(readFileSync(synonymsPath, 'utf-8'));
  console.log(`Found ${synonyms.length} synonyms to seed`);

  const BATCH_SIZE = 100;
  let inserted = 0;
  let errors = 0;

  for (let i = 0; i < synonyms.length; i += BATCH_SIZE) {
    const batch = synonyms.slice(i, i + BATCH_SIZE);

    const { error } = await supabase
      .from('search_synonyms')
      .upsert(batch, { onConflict: 'term' });

    if (error) {
      console.error(`Batch ${i}-${i + batch.length} failed:`, error.message);
      errors += batch.length;
    } else {
      inserted += batch.length;
    }
  }

  console.log(`\nDone! ${inserted} synonyms inserted/updated, ${errors} failed.`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
