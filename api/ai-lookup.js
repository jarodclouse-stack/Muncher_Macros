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

function normalizeResult(f) {
  const p = Math.round((Number(f.p) || 0) * 10) / 10;
  const c = Math.round((Number(f.c) || 0) * 10) / 10;
  const fat = Math.round((Number(f.f) || 0) * 10) / 10;
  const cal = Math.round(p * 4 + c * 4 + fat * 9);

  return {
    name: String(f.name || 'Unknown Item'),
    serving: String(f.serving || (f.detectedCount || f.sQty ? `${f.detectedCount || f.sQty}${f.sUnit || f.unit || 'piece'}` : '1 serving')),
    sQty: Number(f.detectedCount || f.sQty || f.qty || f.quantity || 1),
    sUnit: String(f.sUnit || f.unit || 'piece'),
    cal, p, c, f: fat,
    fb: Math.round((Number(f.fb || f.Fiber || f.fiber) || 0) * 10) / 10,
    sat: Math.round((Number(f.sat) || 0) * 10) / 10,
    trans: Math.round((Number(f.trans) || 0) * 10) / 10,
    mono: Math.round((Number(f.mono) || 0) * 10) / 10,
    poly: Math.round((Number(f.poly) || 0) * 10) / 10,
    chol: Math.round(Number(f.chol) || 0),
    sugars: Math.round((Number(f.sugars) || 0) * 10) / 10,
    Sodium: Math.round(Number(f.Sodium) || 0),
    Potassium: Math.round(Number(f.Potassium) || 0),
    Calcium: Math.round(Number(f.Calcium) || 0),
    Iron: Math.round((Number(f.Iron) || 0) * 10) / 10,
    'Vitamin C': Math.round((Number(f['Vitamin C']) || 0) * 10) / 10,
    'Vitamin A': Math.round(Number(f['Vitamin A']) || 0),
    'Vitamin D': Math.round((Number(f['Vitamin D']) || 0) * 10) / 10,
    'Vitamin B1': Math.round((Number(f['Vitamin B1']) || 0) * 100) / 100,
    'Vitamin B2': Math.round((Number(f['Vitamin B2']) || 0) * 100) / 100,
    'Vitamin B3': Math.round((Number(f['Vitamin B3']) || 0) * 100) / 100,
    'Vitamin B5': Math.round((Number(f['Vitamin B5']) || 0) * 100) / 100,
    'Vitamin B6': Math.round((Number(f['Vitamin B6']) || 0) * 100) / 100,
    'Vitamin B7': Math.round((Number(f['Vitamin B7']) || 0) * 100) / 100,
    'Vitamin B9': Math.round((Number(f['Vitamin B9']) || 0) * 100) / 100,
    'Vitamin B12': Math.round((Number(f['Vitamin B12']) || 0) * 100) / 100,
    'Vitamin E': Math.round((Number(f['Vitamin E']) || 0) * 10) / 10,
    'Vitamin K': Math.round((Number(f['Vitamin K']) || 0) * 10) / 10,
    Magnesium: Math.round(Number(f.Magnesium) || 0),
    Phosphorus: Math.round(Number(f.Phosphorus) || 0),
    Zinc: Math.round((Number(f.Zinc) || 0) * 10) / 10,
    Copper: Math.round((Number(f.Copper) || 0) * 1000) / 1000,
    Manganese: Math.round((Number(f.Manganese) || 0) * 100) / 100,
    Selenium: Math.round((Number(f.Selenium) || 0) * 10) / 10,
    Chloride: Math.round(Number(f.Chloride) || 0),
    Iodine: Math.round((Number(f.Iodine) || 0) * 10) / 10,
    Chromium: Math.round((Number(f.Chromium) || 0) * 10) / 10,
    Molybdenum: Math.round((Number(f.Molybdenum) || 0) * 10) / 10,
    Fluoride: Math.round((Number(f.Fluoride) || 0) * 10) / 10,
    Fiber: Math.round((Number(f.Fiber || f.fb || f.fiber) || 0) * 10) / 10,
    'Soluble Fiber': Math.round((Number(f['Soluble Fiber'] || f.solubleFiber || f.soluble_fiber) || 0) * 10) / 10,
    'Insoluble Fiber': Math.round((Number(f['Insoluble Fiber'] || f.insolubleFiber || f.insoluble_fiber) || 0) * 10) / 10,
    solubleFiber: Math.round((Number(f['Soluble Fiber'] || f.solubleFiber || f.soluble_fiber) || 0) * 10) / 10,
    insolubleFiber: Math.round((Number(f['Insoluble Fiber'] || f.insolubleFiber || f.insoluble_fiber) || 0) * 10) / 10,
    _src: 'ai',
    // Legacy support
    calories: cal,
    protein: p,
    carbs: c,
    fat: fat,
    fiber: Math.round((Number(f.fb || f.Fiber || f.fiber) || 0) * 10) / 10,
    sugar: Math.round((Number(f.sugars) || 0) * 10) / 10,
    sodium: Math.round(Number(f.Sodium) || 0),
    potassium: Math.round(Number(f.Potassium) || 0),
    cholesterol: Math.round(Number(f.chol) || 0),
    saturatedFat: Math.round((Number(f.sat) || 0) * 10) / 10,
    monounsaturatedFat: Math.round((Number(f.mono) || 0) * 10) / 10,
    polyunsaturatedFat: Math.round((Number(f.poly) || 0) * 10) / 10,
    chloride: Math.round(Number(f.Chloride) || 0),
    iodine: Math.round((Number(f.Iodine) || 0) * 10) / 10,
    chromium: Math.round((Number(f.Chromium) || 0) * 10) / 10,
    molybdenum: Math.round((Number(f.Molybdenum) || 0) * 10) / 10,
    fluoride: Math.round((Number(f.Fluoride) || 0) * 10) / 10,
    solubleFiber: Math.round((Number(f['Soluble Fiber'] || f.solubleFiber || f.soluble_fiber) || 0) * 10) / 10,
    insolubleFiber: Math.round((Number(f['Insoluble Fiber'] || f.insolubleFiber || f.insoluble_fiber) || 0) * 10) / 10,
    stagedQty: String(f.detectedCount || f.sQty || f.qty || f.quantity || 1),
    stagedUnit: String(f.sUnit || f.unit || 'serving')
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
  1. ITEM COUNT/WEIGHT: Identify the base serving weight or count (e.g. 174 for a 174g breast).
  2. NUTRITION: Extract nutrition for exactly that quantity. You MUST estimate and populate every single micronutrient and trace mineral key listed below. Do not leave them out or set them all to 0. Realistically estimate each value using scientific nutrition databases (USDA/NCCDB).
  
  JSON keys: name, serving, detectedCount, sUnit, cal, p, c, f, fb, sat, trans, mono, poly, chol, sugars, Sodium, Potassium, Calcium, Iron, "Vitamin C", "Vitamin A", "Vitamin D", "Vitamin B1", "Vitamin B2", "Vitamin B3", "Vitamin B5", "Vitamin B6", "Vitamin B7", "Vitamin B9", "Vitamin B12", "Vitamin E", "Vitamin K", "Magnesium", "Phosphorus", "Zinc", "Copper", "Manganese", "Selenium", "Chloride", "Iodine", "Chromium", "Molybdenum", "Fluoride", "Fiber", "Soluble Fiber", "Insoluble Fiber".

  Rules:
  - Return ONLY raw JSON. No markdown fences.
  - Accuracy is paramount. Use P*4 + C*4 + F*9 for calories.
  - CRITICAL: Use GRAMS (g) as sUnit if a weight is known, and put the weight in detectedCount. (e.g. "Chicken Breast" -> detectedCount: 174, sUnit: "g")
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
