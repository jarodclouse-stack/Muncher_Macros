#!/usr/bin/env node
// scripts/ingest-usda.js
// Loads USDA FoodData Central SR Legacy data into the Supabase foods table.
//
// Usage:
//   SUPABASE_URL=https://... SUPABASE_SERVICE_ROLE_KEY=... node scripts/ingest-usda.js ./FoodData_Central_sr_legacy_food_json_*.json
//
// Download the SR Legacy JSON from: https://fdc.nal.usda.gov/download-datasets
// Look for "SR Legacy" under "Full Download of All Data Types"

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables');
  process.exit(1);
}

const filePath = process.argv[2];
if (!filePath) {
  console.error('Usage: node scripts/ingest-usda.js <path-to-usda-json>');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// USDA nutrient number -> our column name
const NUTRIENT_MAP = {
  208: 'cal',        // Energy (kcal)
  203: 'p',          // Protein
  205: 'c',          // Carbohydrate
  204: 'f',          // Total Fat
  291: 'fiber',      // Fiber
  269: 'sugars',     // Sugars
  606: 'sat',        // Saturated fat
  645: 'mono',       // Monounsaturated fat
  646: 'poly',       // Polyunsaturated fat
  605: 'trans',      // Trans fat
  601: 'chol',       // Cholesterol (mg)
  307: 'sodium',     // Sodium (mg)
  306: 'potassium',  // Potassium (mg)
  301: 'calcium',    // Calcium (mg)
  304: 'magnesium',  // Magnesium (mg)
  303: 'iron',       // Iron (mg)
  309: 'zinc',       // Zinc (mg)
  305: 'phosphorus', // Phosphorus (mg)
  315: 'manganese',  // Manganese (mg)
  317: 'selenium',   // Selenium (mcg)
  312: 'copper',     // Copper (mg)
  401: 'vitamin_c',  // Vitamin C (mg)
  320: 'vitamin_a',  // Vitamin A RAE (mcg)
  328: 'vitamin_d',  // Vitamin D (mcg)
  323: 'vitamin_e',  // Vitamin E (mg)
  430: 'vitamin_k',  // Vitamin K (mcg)
  404: 'vitamin_b1', // Thiamin (mg)
  405: 'vitamin_b2', // Riboflavin (mg)
  406: 'vitamin_b3', // Niacin (mg)
  410: 'vitamin_b5', // Pantothenic acid (mg)
  415: 'vitamin_b6', // Vitamin B6 (mg)
  418: 'vitamin_b12',// Vitamin B12 (mcg)
  417: 'vitamin_b9', // Folate (mcg)
};

function cleanName(desc) {
  if (!desc) return 'Unknown';
  // Remove USDA parenthetical codes
  let name = desc
    .replace(/,?\s*NFS\b/gi, '')
    .replace(/,?\s*NLEA\b/gi, '')
    .replace(/,?\s*NFP\b/gi, '')
    .trim();
  // Title case: "BUTTER, SALTED" -> "Butter, Salted"
  name = name.replace(/\b\w+/g, w =>
    w.length > 2 ? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase() : w.toLowerCase()
  );
  // Capitalize first letter
  name = name.charAt(0).toUpperCase() + name.slice(1);
  return name;
}

function extractNutrients(foodNutrients) {
  const result = {};
  if (!Array.isArray(foodNutrients)) return result;

  for (const fn of foodNutrients) {
    const num = fn.nutrient?.number;
    const numInt = parseInt(num, 10);
    const col = NUTRIENT_MAP[numInt];
    if (col && fn.amount != null) {
      result[col] = Number(fn.amount) || 0;
    }
  }
  return result;
}

async function main() {
  console.log(`Reading USDA data from: ${filePath}`);
  const raw = readFileSync(filePath, 'utf-8');
  const data = JSON.parse(raw);

  // SR Legacy format: { SRLegacyFoods: [...] }
  // Foundation format: { FoundationFoods: [...] }
  // Survey (FNDDS) format: { SurveyFoods: [...] }
  const foods = data.SRLegacyFoods || data.FoundationFoods || data.SurveyFoods || [];
  console.log(`Found ${foods.length} foods to ingest`);

  if (foods.length === 0) {
    console.error('No foods found in JSON. Check the file format.');
    process.exit(1);
  }

  const BATCH_SIZE = 200;
  let inserted = 0;
  let skipped = 0;

  for (let i = 0; i < foods.length; i += BATCH_SIZE) {
    const batch = foods.slice(i, i + BATCH_SIZE);
    const rows = batch.map(food => {
      const nutrients = extractNutrients(food.foodNutrients);
      return {
        usda_fdc_id: food.fdcId,
        name: cleanName(food.description),
        brand: '',
        serving: '100 g',
        s_qty: 100,
        s_unit: 'g',
        source: 'usda',
        ...nutrients,
      };
    }).filter(r => r.usda_fdc_id && r.name !== 'Unknown');

    if (rows.length === 0) {
      skipped += batch.length;
      continue;
    }

    const { error } = await supabase
      .from('foods')
      .upsert(rows, { onConflict: 'usda_fdc_id' });

    if (error) {
      console.error(`Batch ${i}-${i + batch.length} failed:`, error.message);
      skipped += rows.length;
    } else {
      inserted += rows.length;
    }

    // Progress
    if ((i / BATCH_SIZE) % 10 === 0 || i + BATCH_SIZE >= foods.length) {
      console.log(`  Progress: ${Math.min(i + BATCH_SIZE, foods.length)}/${foods.length} (${inserted} inserted, ${skipped} skipped)`);
    }
  }

  console.log(`\nDone! ${inserted} foods inserted/updated, ${skipped} skipped.`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
