// api/ai-lookup.js
// Modern AI-Native Food Search Logic

import { setCors, handlePreflight } from '../cors.js';
import { validateQuery, readBody } from '../validate.js';
import { rateLimit, checkAiQuota } from '../rate-limit.js';
import { requireAuth } from '../auth.js';
import { checkCache, saveToCache } from '../supabase-client.js';

function extractJSON(text) {
  if (!text) return null;
  let clean = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
  try { return JSON.parse(clean); } catch {}
  const aStart = clean.indexOf('['), aEnd = clean.lastIndexOf(']');
  if (aStart !== -1 && aEnd > aStart) {
    try { return JSON.parse(clean.slice(aStart, aEnd + 1)); } catch {}
  }
  const oStart = clean.indexOf('{'), oEnd = clean.lastIndexOf('}');
  if (oStart !== -1 && oEnd > oStart) {
    try { return [JSON.parse(clean.slice(oStart, oEnd + 1))]; } catch {}
  }
  return null;
}

const MODELS = [
  'claude-haiku-4-5-20251001',
  'claude-3-5-haiku-20241022',
  'claude-sonnet-4-6',
  'claude-3-5-sonnet-20241022',
];

import https from 'https';

const REQUEST_TIMEOUT_MS = 12000; // 12s — fast fail before Vercel's 20s limit

async function anthropicJson(prompt, apiKey, maxTokens = 1800) {
  let lastError = 'Initialization error';
  for (const model of MODELS) {
    try {
      const data = await new Promise((resolve, reject) => {
        const req = https.request('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01'
          }
        }, (res) => {
          let str = '';
          res.on('data', chunk => str += chunk);
          res.on('end', () => {
            try {
              const body = JSON.parse(str);
              if (res.statusCode >= 200 && res.statusCode < 300) resolve(body);
              else reject(new Error(`Anthropic ${res.statusCode}: ${JSON.stringify(body)}`));
            } catch (e) {
               reject(new Error('Invalid JSON from AI'));
            }
          });
        });
        req.on('error', reject);
        req.setTimeout(REQUEST_TIMEOUT_MS, () => {
          req.destroy();
          reject(new Error('AI search timed out. Try a shorter query.'));
        });
        req.write(JSON.stringify({
          model,
          max_tokens: maxTokens,
          messages: [{ role: 'user', content: prompt }]
        }));
        req.end();
      });

      const content = data?.content?.[0]?.text || '';
      const parsed = extractJSON(content);
      if (parsed) return parsed;
      lastError = 'Invalid JSON structure in AI response';
    } catch (e) {
      lastError = e.message;
    }
  }
  throw new Error(lastError);
}

function parseNum(val) {
  if (val == null) return 0;
  if (typeof val === 'number') return val;
  const cleaned = String(val).replace(/[^\d.-]/g, '');
  const n = parseFloat(cleaned);
  return isNaN(n) ? 0 : n;
}

function normalizeResult(f) {
  const p = Math.round(parseNum(f.p != null ? f.p : f.protein) * 10) / 10;
  const sugars = Math.round(parseNum(f.sugars != null ? f.sugars : f.sugar) * 10) / 10;
  const fb = Math.round(parseNum(f.fb != null ? f.fb : (f.fiber != null ? f.fiber : f.Fiber)) * 10) / 10;
  
  let c = Math.round(parseNum(f.c != null ? f.c : (f.carbs != null ? f.carbs : f.carbohydrates)) * 10) / 10;
  // Enforce Carbohydrates >= sugars + fiber
  if (c < sugars + fb) {
    c = Math.round((sugars + fb) * 10) / 10;
  }

  const fat = Math.round(parseNum(f.f != null ? f.f : f.fat) * 10) / 10;
  
  // Calculate macro-based calories
  let cal = Math.round(p * 4 + c * 4 + fat * 9);
  
  // Self-Healing Macro Reconstructor
  if (cal === 0) {
    const rawCal = Math.round(parseNum(f.cal != null ? f.cal : f.calories));
    if (rawCal > 0) {
      // Set carbs to explain calories, e.g. for sugary/fat-free drinks/beverages
      c = Math.round((rawCal / 4) * 10) / 10;
      cal = rawCal;
    }
  }

  let serving = f.serving ? String(f.serving).trim() : '';
  const detectedCount = Number(f.detectedCount || f.sQty || f.qty || f.quantity || 1);
  const sUnit = String(f.sUnit || f.unit || 'piece').trim();

  // If serving string is missing, just a unit name, or too short, reconstruct it
  const isUnitOnly = /^[a-zA-Z\s]+$/.test(serving) && (serving.toLowerCase() === sUnit.toLowerCase() || ['g', 'ml', 'oz', 'serving', 'piece'].includes(serving.toLowerCase()));
  if (!serving || isUnitOnly || serving.length <= 2) {
    serving = `${detectedCount}${sUnit}`;
  }

  return {
    name: String(f.name || 'Unknown Item'),
    serving,
    sQty: detectedCount,
    sUnit,
    cal, p, c, f: fat,
    fb,
    sat: Math.round(parseNum(f.sat) * 10) / 10,
    trans: Math.round(parseNum(f.trans) * 10) / 10,
    mono: Math.round(parseNum(f.mono) * 10) / 10,
    poly: Math.round(parseNum(f.poly) * 10) / 10,
    chol: Math.round(parseNum(f.chol || f.cholesterol)),
    sugars,
    Sodium: Math.round(parseNum(f.Sodium || f.sodium)),
    Potassium: Math.round(parseNum(f.Potassium || f.potassium)),
    Calcium: Math.round(parseNum(f.Calcium || f.calcium)),
    Iron: Math.round(parseNum(f.Iron || f.iron) * 10) / 10,
    'Vitamin C': Math.round(parseNum(f['Vitamin C'] || f.vitamin_c) * 10) / 10,
    'Vitamin A': Math.round(parseNum(f['Vitamin A'] || f.vitamin_a)),
    'Vitamin D': Math.round(parseNum(f['Vitamin D'] || f.vitamin_d) * 10) / 10,
    'Vitamin B1': Math.round(parseNum(f['Vitamin B1'] || f.vitamin_b1) * 100) / 100,
    'Vitamin B2': Math.round(parseNum(f['Vitamin B2'] || f.vitamin_b2) * 100) / 100,
    'Vitamin B3': Math.round(parseNum(f['Vitamin B3'] || f.vitamin_b3) * 100) / 100,
    'Vitamin B5': Math.round(parseNum(f['Vitamin B5'] || f.vitamin_b5) * 100) / 100,
    'Vitamin B6': Math.round(parseNum(f['Vitamin B6'] || f.vitamin_b6) * 100) / 100,
    'Vitamin B7': Math.round(parseNum(f['Vitamin B7'] || f.vitamin_b7) * 100) / 100,
    'Vitamin B9': Math.round(parseNum(f['Vitamin B9'] || f.vitamin_b9) * 100) / 100,
    'Vitamin B12': Math.round(parseNum(f['Vitamin B12'] || f.vitamin_b12) * 100) / 100,
    'Vitamin E': Math.round(parseNum(f['Vitamin E'] || f.vitamin_e) * 10) / 10,
    'Vitamin K': Math.round(parseNum(f['Vitamin K'] || f.vitamin_k) * 10) / 10,
    Magnesium: Math.round(parseNum(f.Magnesium || f.magnesium)),
    Phosphorus: Math.round(parseNum(f.Phosphorus || f.phosphorus)),
    Zinc: Math.round(parseNum(f.Zinc || f.zinc) * 10) / 10,
    Copper: Math.round(parseNum(f.Copper || f.copper) * 1000) / 1000,
    Manganese: Math.round(parseNum(f.Manganese || f.manganese) * 100) / 100,
    Selenium: Math.round(parseNum(f.Selenium || f.selenium) * 10) / 10,
    Chloride: Math.round(parseNum(f.Chloride || f.chloride)),
    Iodine: Math.round(parseNum(f.Iodine || f.iodine) * 10) / 10,
    Chromium: Math.round(parseNum(f.Chromium || f.chromium) * 10) / 10,
    Molybdenum: Math.round(parseNum(f.Molybdenum || f.molybdenum) * 10) / 10,
    Fluoride: Math.round(parseNum(f.Fluoride || f.fluoride) * 10) / 10,
    Fiber: fb,
    'Soluble Fiber': Math.round(parseNum(f['Soluble Fiber'] || f.solubleFiber || f.soluble_fiber) * 10) / 10,
    'Insoluble Fiber': Math.round(parseNum(f['Insoluble Fiber'] || f.insolubleFiber || f.insoluble_fiber) * 10) / 10,
    solubleFiber: Math.round(parseNum(f['Soluble Fiber'] || f.solubleFiber || f.soluble_fiber) * 10) / 10,
    insolubleFiber: Math.round(parseNum(f['Insoluble Fiber'] || f.insolubleFiber || f.insoluble_fiber) * 10) / 10,
    nutriscore_grade: f.nutriscore_grade ? String(f.nutriscore_grade).toLowerCase().trim() : undefined,
    nutrient_levels: typeof f.nutrient_levels === 'object' && f.nutrient_levels ? {
      fat: f.nutrient_levels.fat ? String(f.nutrient_levels.fat).toLowerCase().trim() : undefined,
      'saturated-fat': (f.nutrient_levels['saturated-fat'] || f.nutrient_levels.saturatedFat) ? String(f.nutrient_levels['saturated-fat'] || f.nutrient_levels.saturatedFat).toLowerCase().trim() : undefined,
      sugars: f.nutrient_levels.sugars ? String(f.nutrient_levels.sugars).toLowerCase().trim() : undefined,
      salt: f.nutrient_levels.salt ? String(f.nutrient_levels.salt).toLowerCase().trim() : undefined,
    } : undefined,
    nutrient_percentages: f.nutrient_percentages ? {
      fat: f.nutrient_percentages.fat !== undefined ? Number(f.nutrient_percentages.fat) : undefined,
      'saturated-fat': f.nutrient_percentages['saturated-fat'] !== undefined ? Number(f.nutrient_percentages['saturated-fat']) : undefined,
      sugars: f.nutrient_percentages.sugars !== undefined ? Number(f.nutrient_percentages.sugars) : undefined,
      salt: f.nutrient_percentages.salt !== undefined ? Number(f.nutrient_percentages.salt) : undefined,
    } : undefined,
    foodGroup: String(f.foodGroup || 'Other'),
    _src: 'ai',
    // Legacy support
    calories: cal,
    protein: p,
    carbs: c,
    fat: fat,
    fiber: fb,
    sugar: sugars,
    sodium: Math.round(parseNum(f.Sodium || f.sodium)),
    potassium: Math.round(parseNum(f.Potassium || f.potassium)),
    cholesterol: Math.round(parseNum(f.chol || f.cholesterol)),
    saturatedFat: Math.round(parseNum(f.sat || f.saturatedFat) * 10) / 10,
    monounsaturatedFat: Math.round(parseNum(f.mono || f.monounsaturatedFat) * 10) / 10,
    polyunsaturatedFat: Math.round(parseNum(f.poly || f.polyunsaturatedFat) * 10) / 10,
    chloride: Math.round(parseNum(f.Chloride || f.chloride)),
    iodine: Math.round(parseNum(f.Iodine || f.iodine) * 10) / 10,
    chromium: Math.round(parseNum(f.Chromium || f.chromium) * 10) / 10,
    molybdenum: Math.round(parseNum(f.Molybdenum || f.molybdenum) * 10) / 10,
    fluoride: Math.round(parseNum(f.Fluoride || f.fluoride) * 10) / 10,
    solubleFiber: Math.round(parseNum(f['Soluble Fiber'] || f.solubleFiber || f.soluble_fiber) * 10) / 10,
    insolubleFiber: Math.round(parseNum(f['Insoluble Fiber'] || f.insolubleFiber || f.insoluble_fiber) * 10) / 10,
    stagedQty: String(f.detectedCount || f.sQty || f.qty || f.quantity || 1),
    stagedUnit: String(f.sUnit || f.unit || 'piece')
  };
}

export default async function handler(req, res) {
  setCors(req, res);
  if (handlePreflight(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!(await rateLimit(req, res))) return;

  const user = await requireAuth(req, res);
  if (!user) return;

  const body = await readBody(req);
  const query = validateQuery(body.query);

  const apiKey = (process.env.ANTHROPIC_API_KEY || '').trim();
  if (!apiKey) return res.status(500).json({ error: 'Environment variable ANTHROPIC_API_KEY missing' });

  const prompt = `Return a JSON array of the 3 best matches for: "${query}".
Use real USDA/manufacturer values. Return ONLY raw JSON, no markdown.

Rules:
- cal = p*4 + c*4 + f*9 (macros must explain calories — never 0 macros with non-zero cal)
- c (total carbs) >= sugars + fb at all times
- For branded products (Pepsi, Big Mac, Oreo etc) use exact label values
- sUnit = "g" and detectedCount = weight in grams when weight is known
- nutriscore_grade: a/b for produce & whole foods, c for balanced meals, d/e for junk/soda
- nutrient_levels keys: fat, saturated-fat, sugars, salt — values: low/moderate/high per 100g thresholds
- nutrient_percentages: same 4 keys, numeric mass-percent values per 100g
- foodGroup: one of Vegetables|Fruits|Grains & Breads|Meat & Poultry|Fish & Seafood|Dairy & Eggs|Nuts & Seeds|Fats & Oils|Sweets & Snacks|Beverages|Mixed Meals|Legumes & Beans|Condiments & Sauces|Supplements & Powders|Herbs & Spices|Soups & Stews|Fast Food / Restaurant|Alcoholic Beverages|Other

Required JSON keys per item:
name, serving, detectedCount, sUnit, cal, p, c, f, fb, sat, trans, mono, poly, chol, sugars,
Sodium, Potassium, Calcium, Iron, Magnesium, Zinc, "Vitamin C", "Vitamin D", "Vitamin B12",
nutriscore_grade, nutrient_levels, nutrient_percentages, foodGroup`;

  try {
    const cached = await checkCache('lookup', query);
    if (cached) {
      return res.status(200).json({ foods: cached });
    }

    if (!(await checkAiQuota(user.id, res))) return;

    const aiResults = await anthropicJson(prompt, apiKey);
    const finalFoods = aiResults.map(f => normalizeResult(f));
    
    await saveToCache('lookup', query, finalFoods);
    
    return res.status(200).json({ foods: finalFoods });
  } catch (e) {
    console.error('AI Lookup Error:', e);
    return res.status(500).json({ error: 'Search failed: ' + e.message });
  }
}
