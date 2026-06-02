// api/ai-lookup.js
// Modern AI-Native Food Search Logic

import { setCors, handlePreflight } from './_lib/cors.js';
import { validateQuery, readBody } from './_lib/validate.js';
import { rateLimit } from './_lib/rate-limit.js';

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
  'claude-sonnet-4-6',
  'claude-haiku-4-5-20251001',
  'claude-haiku-4-5-20241022',
  'claude-haiku-4-5-20241001',
];

import https from 'https';

async function anthropicJson(prompt, apiKey, maxTokens = 4000) {
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

  return {
    name: String(f.name || 'Unknown Item'),
    serving: String(f.serving || (f.detectedCount || f.sQty ? `${f.detectedCount || f.sQty}${f.sUnit || f.unit || 'piece'}` : '1 serving')),
    sQty: Number(f.detectedCount || f.sQty || f.qty || f.quantity || 1),
    sUnit: String(f.sUnit || f.unit || 'piece'),
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
    nutrient_percentages: typeof f.nutrient_percentages === 'object' && f.nutrient_percentages ? {
      fat: f.nutrient_percentages.fat !== undefined ? Number(f.nutrient_percentages.fat) : undefined,
      'saturated-fat': (f.nutrient_percentages['saturated-fat'] || f.nutrient_percentages.saturatedFat) !== undefined ? Number(f.nutrient_percentages['saturated-fat'] || f.nutrient_percentages.saturatedFat) : undefined,
      sugars: f.nutrient_percentages.sugars !== undefined ? Number(f.nutrient_percentages.sugars) : undefined,
      salt: f.nutrient_percentages.salt !== undefined ? Number(f.nutrient_percentages.salt) : undefined,
    } : undefined,
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
  if (!rateLimit(req, res)) return;

  const body = await readBody(req);
  const query = validateQuery(body.query);

  const apiKey = (process.env.ANTHROPIC_API_KEY || '').trim();
  if (!apiKey) return res.status(500).json({ error: 'Environment variable ANTHROPIC_API_KEY missing' });

  const prompt = `Search for nutritional data for: "${query}".
  Return a JSON array of the 5 most likely food matches.
  For each match, provide a complete nutrient breakdown scaled to its standard "BASE" serving.

  DIETARY PERCEPTION PROTOCOL:
  1. BRANDED & COMMERCIAL PRODUCTS: For widely known commercial products (e.g. "Pepsi", "Coca-Cola", "Oreo", "Big Mac"), you MUST use their exact, real-world manufacturer nutrition label facts. A standard 12 fl oz (355ml) regular Pepsi has exactly 150 kcal, 41g carbohydrates (all sugars), 0g protein, and 0g fat. Regular Coca-Cola has 140 kcal, 39g carbs. Do not guess or hallucinate generic or blank numbers (like 0g carbs for regular Pepsi) for standard commercial items.
  2. TOTAL CARBOHYDRATES RULE: The "c" (carbs) key represents TOTAL carbohydrates. Total carbohydrates MUST include all simple sugars ("sugars") and dietary fiber ("fb"). Therefore, it is a mathematical requirement that: c >= sugars + fb. For example, if a beverage has 41g of sugars, its "c" value MUST be at least 41g. Never set "c" to 0 if "sugars" is non-zero.
  3. MACRO-CALORIE ALIGNMENT: Stated calories ("cal") must be mathematically aligned with the macronutrients: cal = p * 4 + c * 4 + f * 9. Stating a positive calorie count (like 150 kcal) while setting all macros (protein, carbs, fat) to 0 is an extreme error. If a food has calories, it MUST have the corresponding macros that produce those calories.
  4. ITEM COUNT/WEIGHT: Identify the base serving weight or count (e.g. 174 for a 174g breast).
  5. NUTRITION: Extract nutrition for exactly that quantity. You MUST estimate and populate every single micronutrient and trace mineral key listed below. Do not leave them out or set them all to 0. Realistically estimate each value using scientific nutrition databases (USDA/NCCDB).
  6. NUTRI-SCORE & NUTRIENT LEVELS: Estimate the product's Nutri-Score grade ('a', 'b', 'c', 'd', or 'e') and nutrient levels (qualitative level 'low', 'moderate', or 'high' for fat, saturated-fat, sugars, and salt) based on the calculated nutritional density per 100g of the food:
     - Nutri-Score: 'a' or 'b' for fresh raw vegetables, fruits, whole grains, water. 'c' for standard meats, mixed meals with reasonable balance. 'd' or 'e' for high-sugar, high-saturated-fat, or high-salt processed foods (e.g. regular soda, donuts, potato chips).
     - Nutrient Levels per 100g:
       * fat: low (<3g), moderate (3g - 17.5g), high (>17.5g)
       * saturated-fat: low (<1.5g), moderate (1.5g - 5g), high (>5g)
       * sugars: low (<5g), moderate (5g - 22.5g), high (>22.5g)
       * salt: low (<0.3g / <120mg sodium), moderate (0.3g - 1.5g / 120mg - 600mg sodium), high (>1.5g / >600mg sodium)
     - Also calculate/estimate the exact nutrient percentages (weight percentage of that nutrient per 100g of the food) for: fat, saturated-fat, sugars, and salt (where salt percentage = sodium per 100g in mg * 2.5 / 10000). e.g., a food with 30g sugar per 100g has 30% sugars.
  
  JSON keys: name, serving, detectedCount, sUnit, cal, p, c, f, fb, sat, trans, mono, poly, chol, sugars, Sodium, Potassium, Calcium, Iron, "Vitamin C", "Vitamin A", "Vitamin D", "Vitamin B1", "Vitamin B2", "Vitamin B3", "Vitamin B5", "Vitamin B6", "Vitamin B7", "Vitamin B9", "Vitamin B12", "Vitamin E", "Vitamin K", "Magnesium", "Phosphorus", "Zinc", "Copper", "Manganese", "Selenium", "Chloride", "Iodine", "Chromium", "Molybdenum", "Fluoride", "Fiber", "Soluble Fiber", "Insoluble Fiber", nutriscore_grade, nutrient_levels, nutrient_percentages.

  Rules:
  - Return ONLY raw JSON. No markdown fences.
  - Accuracy is paramount. Use P*4 + C*4 + F*9 for calories.
  - CRITICAL: Use GRAMS (g) as sUnit if a weight is known, and put the weight in detectedCount. (e.g. "Chicken Breast" -> detectedCount: 174, sUnit: "g")
  - Ensure nutrient_levels is an object containing exact keys: {"fat": "low|moderate|high", "saturated-fat": "low|moderate|high", "sugars": "low|moderate|high", "salt": "low|moderate|high"}.
  - Ensure nutrient_percentages is an object containing exact keys with estimated numeric values (e.g., mass percentages like 41, 24, 30, 0.02): {"fat": number, "saturated-fat": number, "sugars": number, "salt": number}.
  - DO NOT omit any key. Ensure every single key from the list above is included in the output JSON objects. All values should be estimated as realistically as possible for the base serving.`;

  try {
    const aiResults = await anthropicJson(prompt, apiKey);
    const finalFoods = aiResults.map(f => normalizeResult(f));
    return res.status(200).json({ foods: finalFoods });
  } catch (e) {
    console.error('AI Lookup Error:', e);
    return res.status(500).json({ error: 'Search failed: ' + e.message });
  }
}
